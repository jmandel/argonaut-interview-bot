import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { marked } from 'marked';
import { useState, useEffect, useRef } from 'react';

marked.setOptions({ breaks: true, gfm: true });
function md(text: string): string { return marked.parse(text) as string; }
function escapeHtml(str: string) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const API = '';
const ARCH_LABELS: Record<string, string> = {
  ehr_data_holder: 'EHR/Data Holder', patient_app_developer: 'App Developer',
  identity_service: 'Identity Service', public_health: 'Public Health',
  care_coordination_cbo: 'CBO', privacy_governance: 'Privacy/Governance',
  patient_self: 'Patient', caregiver_representative: 'Caregiver/Rep',
};
function archLabel(key: string) { return ARCH_LABELS[key] || key; }

// ─── Store ───
interface DashState {
  sessions: any[];
  sessionsMap: Record<string, any>;
  currentSession: string | null;
  currentSessionSlug: string | null;
  participants: Record<string, any>;
  currentParticipant: string | null;
  transcript: any[];
  analysis: string | null;
  synthesis: any | null;
  tab: 'transcript' | 'analysis' | 'synthesis';
  synthesizing: boolean;
}

const useStore = create<DashState>(() => ({
  sessions: [], sessionsMap: {},
  currentSession: null, currentSessionSlug: null,
  participants: {}, currentParticipant: null,
  transcript: [], analysis: null, synthesis: null,
  tab: 'transcript', synthesizing: false,
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

async function createSession(name: string) {
  const res = await fetch(`${API}/api/sessions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  await res.json();
  await loadSessions();
}

async function selectSession(id: string) {
  const { sessionsMap } = useStore.getState();
  set({ currentSession: id, currentSessionSlug: sessionsMap[id]?.slug || id });
  const list = await fetch(`${API}/api/sessions/${id}/participants`).then(r => r.json());
  const participants: Record<string, any> = {};
  list.forEach((p: any) => { participants[p.id] = p; });
  set({ participants });
  connectSSE(id);
}

async function selectParticipant(id: string) {
  set({ currentParticipant: id });
  const [transcript, analysisData] = await Promise.all([
    fetch(`${API}/api/participants/${id}/transcript`).then(r => r.json()),
    fetch(`${API}/api/participants/${id}/analysis`).then(r => r.json()),
  ]);
  set({ transcript, analysis: analysisData.analysis || null });
}

async function loadSynthesis() {
  const { currentSession } = useStore.getState();
  if (!currentSession) return;
  try {
    const data = await fetch(`${API}/api/sessions/${currentSession}/synthesis`).then(r => r.json());
    if (!data.error) set({ synthesis: data });
  } catch {}
}

async function runSynthesis() {
  const { currentSession } = useStore.getState();
  if (!currentSession) return;
  set({ synthesizing: true });
  try {
    await fetch(`${API}/api/sessions/${currentSession}/synthesize`, { method: 'POST' });
  } catch (err: any) {
    alert('Synthesis error: ' + err.message);
    set({ synthesizing: false });
  }
}

let evtSource: EventSource | null = null;
function connectSSE(sessionId: string) {
  evtSource?.close();
  evtSource = new EventSource(`${API}/api/dashboard/events`);
  evtSource.addEventListener('participant_joined', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    if (data.sessionId !== sessionId) return;
    set(s => ({ participants: { ...s.participants, [data.id]: data } }));
  });
  evtSource.addEventListener('participant_status', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    set(s => {
      if (!s.participants[data.id]) return s;
      return { participants: { ...s.participants, [data.id]: { ...s.participants[data.id], status: data.status } } };
    });
  });
  evtSource.addEventListener('new_message', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
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
  evtSource.addEventListener('synthesis_complete', () => {
    loadSynthesis();
    set({ tab: 'synthesis', synthesizing: false });
  });
  evtSource.addEventListener('synthesis_error', (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    alert('Synthesis failed: ' + (data.error || 'Unknown error'));
    set({ synthesizing: false });
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
        <button className="btn btn-outline" onClick={() => {
          const name = prompt('Session name:', 'Permission Tickets Discovery');
          if (name) createSession(name);
        }}>+ New Session</button>
        <select value={currentSession || ''} onChange={e => { if (e.target.value) selectSession(e.target.value); }}
          style={{ padding: '0.375rem 0.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.375rem', color: 'var(--text)', fontSize: '0.8125rem' }}>
          <option value="">Select session...</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
        </select>
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
  const url = `${location.origin}/session/${slug}`;
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

function ParticipantList() {
  const participants = useStore(s => s.participants);
  const current = useStore(s => s.currentParticipant);
  const pList = Object.values(participants);

  return (
    <div className="panel">
      <div className="panel-header">Participants</div>
      <div className="panel-body">
        <ShareUrl />
        {pList.length === 0
          ? <div className="empty-state">No participants yet. Share the link above.</div>
          : pList.map((p: any) => (
            <div key={p.id} className={`participant-card ${current === p.id ? 'active' : ''}`}
              onClick={() => selectParticipant(p.id)}>
              <div className="name"><span className={`status-dot ${p.status}`} />{p.name}</div>
              <div className="meta">{p.organization} · {archLabel(p.archetype)}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

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
  if (!analysis) return <div className="empty-state">Analysis memo not yet generated (builds during interview)</div>;
  return <div className="analysis-memo" dangerouslySetInnerHTML={{ __html: md(analysis) }} />;
}

function SynthesisView() {
  const synthesis = useStore(s => s.synthesis);
  if (!synthesis) return <div className="empty-state">Run synthesis to see cross-participant analysis</div>;

  return (
    <div>
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
                    <div className="arch">{archLabel(p.archetype)}</div>
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
              <div className="req-meta"><strong>For:</strong> {r.for?.archetypes?.map(archLabel).join(', ') || '?'} — {r.for?.core_argument || ''}</div>
              <div className="req-meta"><strong>Against:</strong> {r.against?.archetypes?.map(archLabel).join(', ') || '?'} — {r.against?.core_argument || ''}</div>
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

function CenterPanel() {
  const tab = useStore(s => s.tab);
  return (
    <div className="panel">
      <div className="tabs">
        {(['transcript', 'analysis', 'synthesis'] as const).map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => set({ tab: t })}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>
      <div className="panel-body">
        {tab === 'transcript' && <TranscriptView />}
        {tab === 'analysis' && <AnalysisView />}
        {tab === 'synthesis' && <SynthesisView />}
      </div>
    </div>
  );
}

function Dashboard() {
  useEffect(() => { loadSessions(); }, []);

  return (
    <>
      <Header />
      <div className="layout">
        <ParticipantList />
        <CenterPanel />
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
