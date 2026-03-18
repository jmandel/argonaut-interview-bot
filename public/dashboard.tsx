import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { marked } from 'marked';
import { useState, useEffect, useRef } from 'react';

marked.setOptions({ breaks: true, gfm: true });
function md(text: string): string { return marked.parse(text) as string; }

const API = '';

function buildArchetypeLabels(formConfig: any): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const archetype of formConfig?.archetypes || []) {
    if (archetype?.key && archetype?.label) labels[archetype.key] = archetype.label;
  }
  return labels;
}

function getArchetypeLabel(labels: Record<string, string>, key: string) {
  return labels[key] || key;
}

function formatParticipantMeta(labels: Record<string, string>, participant: any) {
  const parts: string[] = [];
  if (participant.organization) parts.push(participant.organization);
  parts.push(getArchetypeLabel(labels, participant.archetype));
  return parts.join(' · ');
}

function mapParticipants(list: any[]) {
  const participants: Record<string, any> = {};
  list.forEach((participant) => {
    participants[participant.id] = participant;
  });
  return participants;
}

function getDefaultParticipantId(list: any[]) {
  return list.find((participant) => !participant.archived)?.id || list[0]?.id || null;
}

async function fetchParticipantsList(sessionId: string) {
  return fetch(`${API}/api/sessions/${sessionId}/participants`).then((r) => r.json());
}

async function refreshParticipants(sessionId: string) {
  const list = await fetchParticipantsList(sessionId);
  set({ participants: mapParticipants(list) });
  return list;
}

function openInTab(text: string, title: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
}

// ─── Store ───
type View = { type: 'participant'; tab: 'transcript' | 'analysis' } | { type: 'synthesis' } | { type: 'create-session' };

interface DashState {
  sessions: any[];
  sessionsMap: Record<string, any>;
  currentSession: string | null;
  currentSessionSlug: string | null;
  archetypeLabels: Record<string, string>;
  participants: Record<string, any>;
  currentParticipant: string | null;
  transcript: any[];
  analysis: string | null;
  synthesis: any | null;
  synthesisStreamText: string | null;
  synthesizing: boolean;
  view: View;
}

const useStore = create<DashState>(() => ({
  sessions: [], sessionsMap: {},
  currentSession: null, currentSessionSlug: null,
  archetypeLabels: {},
  participants: {}, currentParticipant: null,
  transcript: [], analysis: null,
  synthesis: null, synthesisStreamText: null, synthesizing: false,
  view: { type: 'participant', tab: 'transcript' },
}));
const set = useStore.setState;

// ─── Actions ───
async function loadSessions() {
  const sessions = await fetch(`${API}/api/sessions`).then(r => r.json());
  const sessionsMap: Record<string, any> = {};
  sessions.forEach((s: any) => { sessionsMap[s.id] = s; });
  set({ sessions, sessionsMap });
  if (sessions.length === 1) selectSession(sessions[0].id);
}

async function selectSession(id: string) {
  const { sessionsMap } = useStore.getState();
  set({
    currentSession: id,
    currentSessionSlug: sessionsMap[id]?.slug || id,
    archetypeLabels: {},
    currentParticipant: null,
    transcript: [],
    analysis: null,
    view: { type: 'participant', tab: 'transcript' },
  });
  const [list, config] = await Promise.all([
    fetchParticipantsList(id),
    fetch(`${API}/api/sessions/${id}/config`).then(r => r.json()).catch(() => null),
  ]);
  set({
    participants: mapParticipants(list),
    archetypeLabels: config?.form_config ? buildArchetypeLabels(config.form_config) : {},
  });
  const defaultParticipantId = getDefaultParticipantId(list);
  if (defaultParticipantId) {
    await selectParticipant(defaultParticipantId);
  }
  connectSSE(id);
  try {
    const data = await fetch(`${API}/api/sessions/${id}/synthesis`).then(r => r.json());
    if (!data.error) set({ synthesis: data });
    else set({ synthesis: null });
  } catch { set({ synthesis: null }); }
}

async function selectParticipant(id: string) {
  set({ currentParticipant: id, view: { type: 'participant', tab: 'transcript' } });
  const [transcript, analysisData] = await Promise.all([
    fetch(`${API}/api/participants/${id}/transcript`).then(r => r.json()),
    fetch(`${API}/api/participants/${id}/analysis`).then(r => r.json()),
  ]);
  set({ transcript, analysis: analysisData.analysis || null });
}

async function showSynthesis() {
  set({ view: { type: 'synthesis' }, currentParticipant: null });
}

async function runSynthesis() {
  const { currentSession } = useStore.getState();
  if (!currentSession) return;
  set({ synthesizing: true, synthesisStreamText: null, view: { type: 'synthesis' }, currentParticipant: null });
  try {
    await fetch(`${API}/api/sessions/${currentSession}/synthesize`, { method: 'POST' });
  } catch (err: any) {
    alert('Synthesis error: ' + err.message);
    set({ synthesizing: false });
  }
}

async function setParticipantArchived(id: string, archived: boolean) {
  const response = await fetch(`${API}/api/participants/${id}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update participant archive state');
  }
  const { currentSession } = useStore.getState();
  if (currentSession && currentSession === data.session_id) {
    await refreshParticipants(currentSession);
    set({ synthesis: null, synthesisStreamText: null, synthesizing: false });
  }
}

async function inspectSessionDetails() {
  const { currentSession } = useStore.getState();
  if (!currentSession) return;

  try {
    window.open(`/session-info?session=${encodeURIComponent(currentSession)}`, '_blank');
  } catch (err: any) {
    alert('Failed to load session details: ' + (err.message || 'Unknown error'));
  }
}

let evtSource: EventSource | null = null;
function connectSSE(sessionId: string) {
  evtSource?.close();
  evtSource = new EventSource(`${API}/api/dashboard/events`);
  evtSource.addEventListener('participant_joined', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    if (data.sessionId !== sessionId) return;
    refreshParticipants(sessionId);
  });
  evtSource.addEventListener('participant_status', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    set(s => {
      if (!s.participants[data.id]) return s;
      return { participants: { ...s.participants, [data.id]: { ...s.participants[data.id], status: data.status } } };
    });
  });
  evtSource.addEventListener('participant_updated', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    if (data.sessionId !== sessionId) return;
    refreshParticipants(sessionId);
  });
  evtSource.addEventListener('new_message', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    refreshParticipants(sessionId);
    const { currentParticipant } = useStore.getState();
    if (data.participantId === currentParticipant) {
      fetch(`${API}/api/participants/${currentParticipant}/transcript`).then(r => r.json()).then(t => set({ transcript: t }));
    }
  });
  evtSource.addEventListener('analysis_complete', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    const { currentParticipant } = useStore.getState();
    if (data.participantId === currentParticipant) {
      fetch(`${API}/api/participants/${currentParticipant}/analysis`).then(r => r.json()).then(d => set({ analysis: d.analysis || null }));
    }
  });
  evtSource.addEventListener('synthesis_streaming', () => {
    set({ synthesisStreamText: '', synthesizing: true });
  });
  evtSource.addEventListener('synthesis_chunk', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    set({ synthesisStreamText: data.text });
  });
  evtSource.addEventListener('synthesis_complete', () => {
    const { currentSession } = useStore.getState();
    set({ synthesizing: false, synthesisStreamText: null });
    if (currentSession) {
      fetch(`${API}/api/sessions/${currentSession}/synthesis`).then(r => r.json()).then(data => {
        if (!data.error) set({ synthesis: data });
      });
    }
  });
  evtSource.addEventListener('synthesis_error', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    alert('Synthesis failed: ' + (data.error || 'Unknown error'));
    set({ synthesizing: false, synthesisStreamText: null });
  });
  evtSource.addEventListener('synthesis_invalidated', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    if (data.sessionId !== sessionId) return;
    set({ synthesis: null, synthesisStreamText: null, synthesizing: false });
  });
}

// ─── Components ───
function Header() {
  const currentSession = useStore(s => s.currentSession);
  const sessions = useStore(s => s.sessions);
  const synthesizing = useStore(s => s.synthesizing);

  return (
    <div className="header">
      <h1>Facilitator Dashboard</h1>
      <div className="header-actions">
        <button className="btn btn-outline" onClick={() => set({ view: { type: 'create-session' }, currentSession: null, currentParticipant: null })}>
          + New Session
        </button>
        <select value={currentSession || ''} onChange={e => { if (e.target.value) selectSession(e.target.value); }}
          style={{ padding: '0.375rem 0.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.375rem', color: 'var(--text)', fontSize: '0.8125rem' }}>
          <option value="">Select session...</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
        </select>
        <button className="btn btn-outline" disabled={!currentSession} onClick={inspectSessionDetails}>
          Info
        </button>
        <button className="btn" disabled={!currentSession || synthesizing} onClick={runSynthesis}>
          {synthesizing ? 'Synthesizing...' : 'Run Synthesis'}
        </button>
      </div>
    </div>
  );
}

function ShareUrl() {
  const slug = useStore(s => s.currentSessionSlug);
  const [copied, setCopied] = useState(false);
  if (!slug) return null;
  const url = `${location.origin}/sessions/${slug}`;
  return (
    <div className="share-url" onClick={() => {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }} title="Click to copy">
      {copied ? 'Copied!' : `Participant link: ${url}`}
    </div>
  );
}

function Sidebar() {
  const archetypeLabels = useStore(s => s.archetypeLabels);
  const participants = useStore(s => s.participants);
  const currentParticipant = useStore(s => s.currentParticipant);
  const view = useStore(s => s.view);
  const synthesis = useStore(s => s.synthesis);
  const synthesizing = useStore(s => s.synthesizing);
  const currentSession = useStore(s => s.currentSession);
  const pList = Object.values(participants) as any[];
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  if (!currentSession) return null;

  const archivedCount = pList.filter((participant) => participant.archived).length;
  const eligibleCount = pList.filter((participant) => participant.included_in_aggregates).length;

  return (
    <div className="panel">
      <div className="panel-body">
        <div className={`participant-card synthesis-card ${view.type === 'synthesis' ? 'active' : ''}`}
          onClick={showSynthesis}>
          <div className="name">
            {synthesizing && <span className="status-dot interviewing" />}
            Synthesis
          </div>
          <div className="meta">{synthesizing ? 'Generating...' : synthesis ? 'View synthesis' : 'Not yet generated'}</div>
        </div>
        <div className="panel-header" style={{ marginTop: '0.75rem' }}>Participants</div>
        <div className="participant-summary">
          {eligibleCount} included in synthesis{archivedCount > 0 ? ` · ${archivedCount} archived` : ''}
        </div>
        <ShareUrl />
        {pList.length === 0
          ? <div className="empty-state">No participants yet. Share the link above.</div>
          : pList.map((p: any) => {
            const stale = p.status === 'interviewing' && p.last_message_at &&
              (Date.now() - new Date(p.last_message_at + 'Z').getTime()) > 30 * 60 * 1000;
            const statusClass = stale ? 'stale' : p.status;
            const dimmed = !p.meets_threshold;
            const archived = Boolean(p.archived);
            return (
              <div key={p.id} className={`participant-card ${currentParticipant === p.id ? 'active' : ''} ${dimmed ? 'dimmed' : ''} ${archived ? 'archived' : ''}`}
                onClick={() => selectParticipant(p.id)}>
                <div className="participant-card-row">
                  <div className="participant-card-copy">
                    <div className="name"><span className={`status-dot ${statusClass}`} />{p.name}</div>
                    <div className="meta">{formatParticipantMeta(archetypeLabels, p)}</div>
                  </div>
                  <button
                    className="participant-action"
                    disabled={pendingArchiveId === p.id}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setPendingArchiveId(p.id);
                      try {
                        await setParticipantArchived(p.id, !archived);
                      } catch (err: any) {
                        alert(err.message || 'Failed to update archive state');
                      } finally {
                        setPendingArchiveId((current) => current === p.id ? null : current);
                      }
                    }}
                  >
                    {pendingArchiveId === p.id ? 'Saving...' : archived ? 'Restore' : 'Archive'}
                  </button>
                </div>
                <div className="participant-badges">
                  {archived && <span className="participant-badge participant-badge-archived">Archived</span>}
                  {!p.meets_threshold && <span className="participant-badge participant-badge-threshold">Too short for synthesis</span>}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── Session Creation ───

function DefaultReference({ label, getText }: { label: string; getText: () => Promise<string> }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="default-ref">
      <button className="btn-link" onClick={async () => {
        const text = await getText();
        openInTab(text, label);
      }}>View default</button>
      {' '}
      <button className="btn-link" onClick={async () => {
        const text = await getText();
        copyText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}>{copied ? 'Copied!' : 'Copy default'}</button>
    </span>
  );
}

function CreateSessionView() {
  const [name, setName] = useState('');
  const [operationalPrompt, setOperationalPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [formConfig, setFormConfig] = useState('');
  const [extractionPrompt, setExtractionPrompt] = useState('');
  const [synthesisPrompt, setSynthesisPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [defaults, setDefaults] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/defaults`).then(r => r.json()).then((data) => {
      setDefaults(data);
      setOperationalPrompt(data.operational_prompt || '');
    });
  }, []);

  const getDefault = (key: string) => async () => {
    const d = defaults || await fetch(`${API}/api/defaults`).then(r => r.json());
    const val = d[key];
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  const handleCreate = async () => {
    if (!name.trim()) return alert('Name is required');
    if (!systemPrompt.trim()) return alert('System prompt is required');
    if (!formConfig.trim()) return alert('Form config is required');
    if (!extractionPrompt.trim()) return alert('Extraction prompt is required');
    if (!synthesisPrompt.trim()) return alert('Synthesis prompt is required');

    let parsedFormConfig: any;
    try {
      parsedFormConfig = JSON.parse(formConfig);
    } catch {
      return alert('Form config must be valid JSON');
    }

    setCreating(true);
    try {
      const res = await fetch(`${API}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          system_prompt: systemPrompt,
          form_config: parsedFormConfig,
          extraction_prompt: extractionPrompt,
          synthesis_prompt: synthesisPrompt,
        }),
      });
      const session = await res.json();
      await loadSessions();
      selectSession(session.id);
    } catch (err: any) {
      alert('Failed to create session: ' + err.message);
      setCreating(false);
    }
  };

  return (
    <div className="panel" style={{ gridColumn: '1 / -1' }}>
      <div className="tabs">
        <div className="tab active">New Session</div>
      </div>
      <div className="panel-body create-session-form">
        <div className="form-field">
          <label>Session Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Permission Tickets Discovery" />
        </div>

        <div className="form-field">
          <label>
            Built-In Operational Prompt
            <DefaultReference label="Operational Prompt" getText={getDefault('operational_prompt')} />
          </label>
          <p className="field-help">Always-present interviewer instructions. This base prompt is built into the app, shown here for inspection, and is not editable per session.</p>
          <textarea rows={10} value={operationalPrompt} readOnly />
        </div>

        <div className="form-field">
          <label>
            Project Prompt
            <DefaultReference label="Project Prompt" getText={getDefault('system_prompt')} />
          </label>
          <p className="field-help">Project-specific context, goals, tensions, and technical background. This editable prompt is appended after the built-in operational prompt at runtime.</p>
          <textarea rows={12} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
            placeholder="Paste your project-specific prompt here..." />
        </div>

        <div className="form-field">
          <label>
            Form Config (JSON)
            <DefaultReference label="Form Config" getText={getDefault('form_config')} />
          </label>
          <p className="field-help">JSON defining the participant join form: title, subtitle, intro_text, fields, and archetypes (with key, label, description, interviewNotes).</p>
          <textarea rows={10} value={formConfig} onChange={e => setFormConfig(e.target.value)}
            placeholder="Paste your form config JSON here..." />
        </div>

        <div className="form-field">
          <label>
            Per-Interview Analysis Prompt
            <DefaultReference label="Extraction Prompt" getText={getDefault('extraction_prompt')} />
          </label>
          <p className="field-help">Prompt used to generate the per-interview analytical memo after each exchange.</p>
          <textarea rows={6} value={extractionPrompt} onChange={e => setExtractionPrompt(e.target.value)}
            placeholder="Paste your analysis prompt here..." />
        </div>

        <div className="form-field">
          <label>
            Cross-Interview Synthesis Prompt
            <DefaultReference label="Synthesis Prompt" getText={getDefault('synthesis_prompt')} />
          </label>
          <p className="field-help">Prompt used to synthesize patterns across all interviews in this session.</p>
          <textarea rows={6} value={synthesisPrompt} onChange={e => setSynthesisPrompt(e.target.value)}
            placeholder="Paste your synthesis prompt here..." />
        </div>

        <button className="btn" disabled={creating} onClick={handleCreate}>
          {creating ? 'Creating...' : 'Create Session'}
        </button>
      </div>
    </div>
  );
}

// ─── Interview Views ───

function TranscriptView() {
  const transcript = useStore(s => s.transcript);
  if (transcript.length === 0) return <div className="empty-state">Select a participant to view their transcript</div>;
  return (
    <div>
      {transcript.map((m: any, i: number) => (
        <div key={i} className={`transcript-msg ${m.role}`}>
          <div className="role-label">{m.role}</div>
          <div dangerouslySetInnerHTML={{ __html: md(m.content) }} />
        </div>
      ))}
    </div>
  );
}

function AnalysisView() {
  const analysis = useStore(s => s.analysis);
  if (!analysis) return <div className="empty-state">Analysis will appear here as the interview progresses</div>;
  return <div className="analysis-memo" dangerouslySetInnerHTML={{ __html: md(analysis) }} />;
}

function CopyButton({ label, getText }: { label: string; getText: () => Promise<string> }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className="btn btn-outline btn-sm" onClick={async () => {
      const text = await getText();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }}>
      {copied ? 'Copied!' : label}
    </button>
  );
}

function SynthesisView() {
  const archetypeLabels = useStore(s => s.archetypeLabels);
  const synthesis = useStore(s => s.synthesis);
  const streamText = useStore(s => s.synthesisStreamText);
  const synthesizing = useStore(s => s.synthesizing);
  const currentSession = useStore(s => s.currentSession);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamText != null) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamText]);

  const getInputs = async () => {
    const data = await fetch(`${API}/api/sessions/${currentSession}/synthesis-inputs`).then(r => r.json());
    return data;
  };

  const copyToolbar = currentSession && (
    <div className="copy-toolbar">
      <CopyButton label="Copy interview transcripts" getText={async () => (await getInputs()).transcripts} />
      <CopyButton label="Copy synthesis prompt" getText={async () => (await getInputs()).prompt} />
    </div>
  );

  if (streamText != null) {
    return (
      <div className="synthesis-stream">
        {copyToolbar}
        <div className="streaming-label">Generating synthesis...</div>
        <pre className="synthesis-raw">{streamText}<span className="typing-cursor" /></pre>
        <div ref={bottomRef} />
      </div>
    );
  }

  if (!synthesis) {
    return <div>
      {copyToolbar}
      <div className="empty-state">
        {synthesizing ? 'Starting synthesis...' : 'Run synthesis to see cross-participant analysis'}
      </div>
    </div>;
  }

  return (
    <div>
      {copyToolbar}
      {synthesis.narrative_summary && (
        <div className="synthesis-section">
          <h3>Narrative Summary</h3>
          <div className="narrative" dangerouslySetInnerHTML={{ __html: md(synthesis.narrative_summary) }} />
        </div>
      )}
      {synthesis.conflict_map?.length > 0 && (
        <div className="synthesis-section">
          <h3>Conflict Map</h3>
          {synthesis.conflict_map.map((c: any, i: number) => (
            <div key={i} className="conflict-axis">
              <div className="axis-label">{c.axis_label}</div>
              <div className="conflict-positions">
                {c.positions?.map((p: any, j: number) => (
                  <div key={j} className="pos">
                    <div className="arch">{getArchetypeLabel(archetypeLabels, p.archetype)}</div>
                    <div>{p.stance}</div>
                    {p.quote && <div className="quote">"{p.quote}"</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {synthesis.consensus_requirements?.length > 0 && (
        <div className="synthesis-section">
          <h3>Consensus Requirements</h3>
          {synthesis.consensus_requirements.map((r: any, i: number) => (
            <div key={i} className="requirement-card">
              <div className="req-text">{r.requirement}</div>
              <div className="req-meta">Strength: {r.strength} · Support: {r.support_breadth}</div>
            </div>
          ))}
        </div>
      )}
      {synthesis.contested_requirements?.length > 0 && (
        <div className="synthesis-section">
          <h3>Contested Requirements</h3>
          {synthesis.contested_requirements.map((r: any, i: number) => (
            <div key={i} className="requirement-card">
              <div className="req-text">{r.requirement}</div>
              <div className="req-meta"><strong>For:</strong> {r.for?.archetypes?.map((key: string) => getArchetypeLabel(archetypeLabels, key)).join(', ') || '?'} — {r.for?.core_argument || ''}</div>
              <div className="req-meta"><strong>Against:</strong> {r.against?.archetypes?.map((key: string) => getArchetypeLabel(archetypeLabels, key)).join(', ') || '?'} — {r.against?.core_argument || ''}</div>
              {r.discussion_framing && <div className="req-meta" style={{ color: 'var(--orange)' }}><strong>Discussion:</strong> {r.discussion_framing}</div>}
            </div>
          ))}
        </div>
      )}
      {synthesis.open_questions?.length > 0 && (
        <div className="synthesis-section">
          <h3>Open Questions</h3>
          {synthesis.open_questions.map((q: any, i: number) => (
            <div key={i} className="requirement-card">
              <div className="req-text">{q.question}</div>
              <div className="req-meta">{q.why_it_matters} · Raised by {q.raised_by_count} participant(s)</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ParticipantPanel() {
  const view = useStore(s => s.view);
  if (view.type !== 'participant') return null;
  const tab = view.tab;

  return (
    <div className="panel">
      <div className="tabs">
        {(['transcript', 'analysis'] as const).map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => set({ view: { type: 'participant', tab: t } })}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>
      <div className="panel-body">
        {tab === 'transcript' && <TranscriptView />}
        {tab === 'analysis' && <AnalysisView />}
      </div>
    </div>
  );
}

function SynthesisPanel() {
  const view = useStore(s => s.view);
  if (view.type !== 'synthesis') return null;

  return (
    <div className="panel">
      <div className="tabs">
        <div className="tab active">Synthesis</div>
      </div>
      <div className="panel-body">
        <SynthesisView />
      </div>
    </div>
  );
}

function CenterPanel() {
  const view = useStore(s => s.view);
  if (view.type === 'create-session') return <CreateSessionView />;
  if (view.type === 'synthesis') return <SynthesisPanel />;
  return <ParticipantPanel />;
}

function Dashboard() {
  useEffect(() => { loadSessions(); }, []);
  const view = useStore(s => s.view);

  return (
    <>
      <Header />
      <div className="layout">
        {view.type !== 'create-session' && <Sidebar />}
        <CenterPanel />
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
