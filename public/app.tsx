import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { marked } from 'marked';
import { useState, useEffect, useRef, useCallback } from 'react';

marked.setOptions({ breaks: true, gfm: true });

function md(text: string): string {
  return marked.parse(text) as string;
}
function mdInline(text: string): string {
  return marked.parseInline(text) as string;
}

// ─── Types ───
interface Msg { role: 'user' | 'assistant'; content: string; }
interface ArchetypeInfo { key: string; label: string; description: string; }
interface ParsedOptions { body: string; options: { letter: string; text: string }[]; multi: boolean; }

// ─── Store ───
interface AppState {
  screen: 'join' | 'chat' | 'complete';
  sessionId: string | null;
  token: string | null;
  archetype: string | null;
  archetypes: Record<string, ArchetypeInfo>;
  formConfig: any;
  messages: Msg[];
  streamingContent: string;
  isStreaming: boolean;
  sending: boolean;
  turnCount: number;
  chatStartTime: number;
  lastActivityTime: number;
  activeTimeMs: number;
  sessionName: string;
  roleDisplay: string;
  nameDisplay: string;
  ttsEnabled: boolean;
}

const useStore = create<AppState>(() => ({
  screen: 'join',
  sessionId: null,
  token: null,
  archetype: null,
  archetypes: {},
  formConfig: null,
  messages: [],
  streamingContent: '',
  isStreaming: false,
  sending: false,
  turnCount: 0,
  chatStartTime: 0,
  lastActivityTime: 0,
  activeTimeMs: 0,
  sessionName: '',
  roleDisplay: '',
  nameDisplay: '',
  ttsEnabled: false,
}));

const set = useStore.setState;

// ─── TTS ───
let ttsVoices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  ttsVoices = window.speechSynthesis?.getVoices() ?? [];
  console.log('[TTS] voices loaded:', ttsVoices.length, ttsVoices.map(v => `${v.name} (${v.lang})`));
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speakText(text: string) {
  if (!window.speechSynthesis) { console.log('[TTS] speechSynthesis not available'); return; }
  // Strip markdown formatting for cleaner speech
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\[([A-Z])\]\s+/g, '')  // strip option markers
    .replace(/\[\[(single|multi)\]\]/g, '')
    .replace(/\n/g, ' ');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.05;
  // Prefer a natural-sounding voice
  const preferred = ttsVoices.find(v => /samantha|karen|daniel|zira|aria|jenny/i.test(v.name) && v.lang.startsWith('en'))
    || ttsVoices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('natural'))
    || ttsVoices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('espeak'));
  if (preferred) utterance.voice = preferred;
  console.log('[TTS] speaking with voice:', utterance.voice?.name ?? 'default', 'text length:', clean.length);
  utterance.onend = () => console.log('[TTS] done speaking');
  utterance.onerror = (e) => console.error('[TTS] error:', e.error);
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

function maybeSpeakAssistant(text: string) {
  if (useStore.getState().ttsEnabled) speakText(text);
}

// ─── Option Parsing ───
function parseOptions(text: string): ParsedOptions {
  const lines = text.split('\n');
  const options: { letter: string; text: string }[] = [];
  let i = lines.length - 1;
  let multi = true;

  while (i >= 0) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(/^\[([A-Z])\]\s+(.+)$/);
    if (match) {
      options.unshift({ letter: match[1], text: match[2] });
      i--;
    } else if (trimmed === '[[single]]') {
      multi = false;
      i--;
    } else if (trimmed === '[[multi]]') {
      i--;
    } else if (trimmed === '' && options.length > 0) {
      i--;
    } else {
      break;
    }
  }

  if (options.length === 0) return { body: text, options: [], multi: false };
  const body = lines.slice(0, i + 1).join('\n').trimEnd();
  return { body, options, multi };
}

// ─── API Helpers ───
const API = '';

async function readStream(resp: Response, onChunk: (text: string) => void): Promise<{ text: string; complete: boolean }> {
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let complete = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const evt = JSON.parse(raw);
        if (evt.type === 'delta') {
          fullText += evt.content;
          // Strip the marker from display in real time
          onChunk(fullText.replace('[[INTERVIEW_COMPLETE]]', '').trimEnd());
        } else if (evt.type === 'done' && evt.complete) {
          complete = true;
        } else if (evt.type === 'error') {
          fullText += '\n\n[Error: ' + evt.content + ']';
          onChunk(fullText);
        }
      } catch {}
    }
  }
  fullText = fullText.replace('[[INTERVIEW_COMPLETE]]', '').trimEnd();
  return { text: fullText, complete };
}

// ─── URL Routing ───
function parseRoute() {
  const path = location.pathname;
  let match;
  // /sessions/:slug/interviews/:token
  if ((match = path.match(/^\/sessions\/([a-z0-9-]+)\/interviews\/([a-f0-9]+)$/)))
    return { route: 'interview' as const, sessionId: match[1] as string | null, token: match[2] as string | null };
  // Legacy /interview/:token
  if ((match = path.match(/^\/interview\/([a-f0-9]+)$/)))
    return { route: 'interview' as const, token: match[1] as string | null, sessionId: null as string | null };
  // /sessions/:slug or /session/:slug
  if ((match = path.match(/^\/sessions?\/([a-z0-9-]+)$/)))
    return { route: 'session' as const, sessionId: match[1] as string | null, token: null as string | null };
  const params = new URLSearchParams(location.search);
  if (params.get('session'))
    return { route: 'session' as const, sessionId: params.get('session'), token: null as string | null };
  return { route: 'join' as const, sessionId: null as string | null, token: null as string | null };
}

// ─── Init ───
async function loadSessionConfig(sid: string) {
  try {
    const config = await fetch(`${API}/api/sessions/${sid}/config`).then(r => r.json());
    if (!config.error && config.form_config) {
      const arcMap: Record<string, ArchetypeInfo> = {};
      (config.form_config.archetypes || []).forEach((a: any) => {
        arcMap[a.key] = { key: a.key, label: a.label, description: a.description };
      });
      set({ formConfig: config.form_config, archetypes: arcMap });
    }
  } catch {}
}

async function initApp() {
  const { route, token, sessionId } = parseRoute();

  if (route === 'interview' && token) {
    try {
      const p = await fetch(`${API}/api/participants/by-token/${token}`).then(r => r.json());
      if (p.error) throw new Error(p.error);
      // Load session config for this participant's session
      await loadSessionConfig(p.session_id);
      const { archetypes: arcMap } = useStore.getState();
      set({
        token, sessionId: p.session_id, archetype: p.archetype,
        roleDisplay: arcMap[p.archetype]?.label || p.archetype,
        nameDisplay: p.organization ? `${p.name} · ${p.organization}` : p.name,
      });
      if (p.status === 'completed') { set({ screen: 'complete' }); return; }
      set({ screen: 'chat' });
      await resumeInterview(token);
      return;
    } catch {}
  }

  let sid = sessionId;
  if (!sid) {
    const sessions = await fetch(`${API}/api/sessions`).then(r => r.json());
    const active = sessions.filter((s: any) => s.status === 'active');
    if (active.length >= 1) {
      sid = active[0].slug || active[0].id;
    } else {
      const created = await fetch(`${API}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Permission Tickets Discovery' }),
      }).then(r => r.json());
      sid = created.slug || created.id;
    }
  }

  set({ sessionId: sid });
  try {
    const session = await fetch(`${API}/api/sessions/${sid}`).then(r => r.json());
    if (!session.error) set({ sessionName: session.name });
  } catch {}

  // Load session config (form_config, archetypes)
  if (sid) await loadSessionConfig(sid);

  if (route === 'join' && sid) history.pushState(null, '', `/sessions/${sid}`);
  set({ screen: 'join' });
}

async function startInterview(token: string) {
  set({ isStreaming: true, streamingContent: '' });
  const resp = await fetch(`${API}/api/chat/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (resp.headers.get('content-type')?.includes('application/json')) {
    const data = await resp.json();
    set({
      messages: data.messages,
      turnCount: data.messages.filter((m: Msg) => m.role === 'user').length,
      isStreaming: false,
    });
    if (data.status === 'completed') set({ screen: 'complete' });
    return;
  }

  const result = await readStream(resp, (text) => set({ streamingContent: text }));
  set(s => ({
    messages: [...s.messages, { role: 'assistant', content: result.text }],
    streamingContent: '',
    isStreaming: false,
  }));
  maybeSpeakAssistant(result.text);
  if (result.complete) set({ screen: 'complete' });
}

async function resumeInterview(token: string) {
  const resp = await fetch(`${API}/api/chat/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (resp.headers.get('content-type')?.includes('application/json')) {
    const data = await resp.json();
    set({
      messages: data.messages,
      turnCount: data.messages.filter((m: Msg) => m.role === 'user').length,
    });
    if (data.status === 'completed') set({ screen: 'complete' });
  } else {
    set({ isStreaming: true, streamingContent: '' });
    const result = await readStream(resp, (text) => set({ streamingContent: text }));
    set(s => ({
      messages: [...s.messages, { role: 'assistant', content: result.text }],
      streamingContent: '',
      isStreaming: false,
    }));
    maybeSpeakAssistant(result.text);
    if (result.complete) set({ screen: 'complete' });
  }
}

async function sendMessage(text: string) {
  const { token, turnCount, lastActivityTime, activeTimeMs } = useStore.getState();
  const now = Date.now();
  // Add time since last activity, capping idle gaps at 30s
  const gap = lastActivityTime ? Math.min(now - lastActivityTime, 30000) : 0;
  const newActiveTime = activeTimeMs + gap;
  const activeMinutes = Math.round(newActiveTime / 60000);

  set(s => ({
    sending: true,
    messages: [...s.messages, { role: 'user', content: text }],
    isStreaming: true,
    streamingContent: '',
    turnCount: s.turnCount + 1,
    activeTimeMs: newActiveTime,
    lastActivityTime: now,
  }));

  try {
    const resp = await fetch(`${API}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, message: text, turnCount: turnCount + 1, activeMinutes }),
    });
    const result = await readStream(resp, (t) => set({ streamingContent: t }));
    set(s => ({
      messages: [...s.messages, { role: 'assistant', content: result.text }],
      streamingContent: '',
      isStreaming: false,
      sending: false,
    }));
    maybeSpeakAssistant(result.text);
    if (result.complete) set({ screen: 'complete' });
  } catch (err: any) {
    set(s => ({
      messages: [...s.messages, { role: 'assistant', content: 'Error: ' + err.message }],
      streamingContent: '',
      isStreaming: false,
      sending: false,
    }));
  }
}

async function finishInterview(finalThoughts: string | null) {
  const { token } = useStore.getState();
  if (finalThoughts) {
    set(s => ({ messages: [...s.messages, { role: 'user', content: finalThoughts }] }));
  }
  await fetch(`${API}/api/chat/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...(finalThoughts ? { finalMessage: finalThoughts } : {}) }),
  });
  set({ screen: 'complete' });
}

// ─── Components ───

function MarkdownBlock({ content, className }: { content: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: md(content) }} />;
}

function Options({ options, multi, onSelect }: {
  options: { letter: string; text: string }[];
  multi: boolean;
  onSelect: (text: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [disabled, setDisabled] = useState(false);

  const hint = <span className="options-hint">or type your own answer below</span>;

  if (!multi) {
    return (
      <div className="options">
        {options.map(opt => (
          <button key={opt.letter} className="option-btn" disabled={disabled}
            onClick={() => { setDisabled(true); onSelect(opt.text); }}>
            <span className="option-indicator radio" />
            <span dangerouslySetInnerHTML={{ __html: mdInline(opt.text) }} />
          </button>
        ))}
        {hint}
      </div>
    );
  }

  return (
    <div className="options">
      {options.map(opt => (
        <button key={opt.letter}
          className={`option-btn ${selected.has(opt.text) ? 'selected' : ''}`}
          disabled={disabled}
          onClick={() => {
            const next = new Set(selected);
            if (next.has(opt.text)) next.delete(opt.text); else next.add(opt.text);
            setSelected(next);
          }}>
          <span className={`option-indicator checkbox ${selected.has(opt.text) ? 'checked' : ''}`} />
          <span dangerouslySetInnerHTML={{ __html: mdInline(opt.text) }} />
        </button>
      ))}
      <button
        className={`options-submit ${selected.size > 0 ? 'visible' : ''}`}
        disabled={disabled || selected.size === 0}
        onClick={() => { setDisabled(true); onSelect([...selected].join('; ')); }}
      >
        {selected.size > 0 ? `Submit (${selected.size})` : 'Submit'}
      </button>
      {hint}
    </div>
  );
}

function MessageBubble({ msg, isLast }: { msg: Msg; isLast: boolean }) {
  if (msg.role === 'user') {
    return <div className="message user">{msg.content}</div>;
  }

  const { body, options, multi } = isLast ? parseOptions(msg.content) : { body: parseOptions(msg.content).body, options: [], multi: false };

  return (
    <>
      <MarkdownBlock content={body} className="message assistant" />
      {options.length > 0 && <Options options={options} multi={multi} onSelect={sendMessage} />}
    </>
  );
}

function StreamingMessage() {
  const content = useStore(s => s.streamingContent);
  if (!content) return (
    <div className="message assistant streaming">
      <span className="typing-indicator"><span /><span /><span /></span>
    </div>
  );
  return <MarkdownBlock content={content} className="message assistant streaming" />;
}

const shouldTail = { current: true };

function ChatMessages() {
  const messages = useStore(s => s.messages);
  const isStreaming = useStore(s => s.isStreaming);
  const streamingContent = useStore(s => s.streamingContent);
  const sending = useStore(s => s.sending);

  useEffect(() => {
    // Start at the bottom on initial load/resume.
    shouldTail.current = true;
    const snapToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
    requestAnimationFrame(() => {
      snapToBottom();
      requestAnimationFrame(snapToBottom);
    });

    const onScroll = () => {
      const atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 80);
      shouldTail.current = atBottom;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Resume tailing when user sends a message
  useEffect(() => {
    if (sending) shouldTail.current = true;
  }, [sending]);

  // Scroll the page to bottom when tailing
  useEffect(() => {
    if (!shouldTail.current) return;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
  }, [messages, streamingContent]);

  return (
    <div className="messages">
      {messages.map((m, i) => (
        <MessageBubble key={i} msg={m} isLast={i === messages.length - 1 && !isStreaming} />
      ))}
      {isStreaming && <StreamingMessage />}
    </div>
  );
}

function ChatInput() {
  const [text, setText] = useState('');
  const sending = useStore(s => s.sending);
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const interimLenRef = useRef(0);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [text]);

  useEffect(() => {
    const input = ref.current;
    const root = rootRef.current;
    const viewport = window.visualViewport;
    if (!input || !root) return;
    const baselineHeight = viewport?.height || window.innerHeight;
    let rafId = 0;

    const updateKeyboardInset = () => {
      const active = document.activeElement === input;
      if (!active) {
        root.style.setProperty('--keyboard-offset', '0px');
        return;
      }

      const viewportHeight = viewport?.height || window.innerHeight;
      const viewportOffsetTop = viewport?.offsetTop || 0;
      const heightLoss = Math.max(0, baselineHeight - viewportHeight);
      const keyboardOffset = heightLoss > 120
        ? Math.max(heightLoss - viewportOffsetTop, 0)
        : 0;

      root.style.setProperty('--keyboard-offset', `${keyboardOffset}px`);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (shouldTail.current) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
        } else {
          const composerTop = root.getBoundingClientRect().top + window.scrollY;
          const targetTop = Math.max(0, composerTop - window.innerHeight + root.offsetHeight + 16);
          window.scrollTo({ top: targetTop, behavior: 'auto' });
        }
      });
    };

    const clearKeyboardInset = () => {
      root.style.setProperty('--keyboard-offset', '0px');
    };

    input.addEventListener('focus', updateKeyboardInset);
    input.addEventListener('blur', clearKeyboardInset);
    viewport?.addEventListener('resize', updateKeyboardInset);

    return () => {
      cancelAnimationFrame(rafId);
      input.removeEventListener('focus', updateKeyboardInset);
      input.removeEventListener('blur', clearKeyboardInset);
      viewport?.removeEventListener('resize', updateKeyboardInset);
      root.style.setProperty('--keyboard-offset', '0px');
    };
  }, []);

  const handleMicUpdate = useCallback((final: string, interim: string) => {
    setText(prev => {
      const base = prev.slice(0, prev.length - interimLenRef.current);
      interimLenRef.current = interim.length;
      return base + final + interim;
    });
  }, []);

  const handleSend = useCallback(() => {
    const val = text.trim();
    if (!val || sending) return;
    interimLenRef.current = 0;
    setText('');
    sendMessage(val);
    ref.current?.focus();
  }, [text, sending]);

  return (
    <div className="input-area" ref={rootRef}>
      <textarea ref={ref} value={text} placeholder="Type your response..."
        onChange={e => { interimLenRef.current = 0; setText(e.target.value); }}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
      />
      <MicButton onUpdate={handleMicUpdate} inputRef={ref} />
      <SpeakerButton />
      <button className="btn btn-icon send-btn" onClick={handleSend} disabled={sending || !text.trim()} aria-label="Send message" title="Send message">↑</button>
    </div>
  );
}

function MicButton({ onUpdate, inputRef }: { onUpdate: (final: string, interim: string) => void; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [recording, setRecording] = useState(false);
  const recRef = useRef<any>(null);
  const wantRecordingRef = useRef(false);

  if (!SR) return null;

  const startRec = () => {
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let processedCount = 0;
    rec.onresult = (e: any) => {
      let newFinal = '';
      let interim = '';
      for (let i = processedCount; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          newFinal += e.results[i][0].transcript;
          processedCount = i + 1;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      onUpdate(newFinal, interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        console.error('SpeechRecognition error:', e.error);
        wantRecordingRef.current = false;
        setRecording(false);
        recRef.current = null;
      }
      // Other errors (network, no-speech) — let onend handle restart
    };

    rec.onend = () => {
      recRef.current = null;
      if (wantRecordingRef.current) {
        // Browser killed recognition (silence timeout, etc.) — auto-restart
        try {
          startRec();
        } catch {
          wantRecordingRef.current = false;
          setRecording(false);
        }
      } else {
        setRecording(false);
      }
    };

    rec.start();
    recRef.current = rec;
  };

  const toggle = async () => {
    if (recording) {
      wantRecordingRef.current = false;
      recRef.current?.stop();
      recRef.current = null;
      setRecording(false);
      return;
    }

    try {
      wantRecordingRef.current = true;
      startRec();
      setRecording(true);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      wantRecordingRef.current = false;
      setRecording(false);
    }
  };

  return (
    <button className={`mic-btn ${recording ? 'mic-recording' : ''}`} onClick={toggle}
      title={recording ? 'Stop dictation' : 'Dictate'}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-4 8.93A7.001 7.001 0 0012 20a7.001 7.001 0 00-1-.07V22h2v-2.07z"/>
      </svg>
    </button>
  );
}

function SpeakerButton() {
  const enabled = useStore(s => s.ttsEnabled);
  if (!window.speechSynthesis) return null;
  return (
    <button
      className={`mic-btn ${enabled ? 'speaker-active' : ''}`}
      onClick={() => {
        const next = !enabled;
        set({ ttsEnabled: next });
        if (next) {
          // Read the last assistant message as a test
          const msgs = useStore.getState().messages;
          const last = [...msgs].reverse().find(m => m.role === 'assistant');
          if (last) speakText(last.content);
        } else {
          stopSpeaking();
        }
      }}
      title={enabled ? 'Stop reading messages aloud' : 'Read messages aloud'}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        {enabled ? (
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.51 8.51 0 0014 3.23z"/>
        ) : (
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5zM16.5 12l2.5-2.5 1.41 1.41L18.41 12l2 2.09-1.41 1.41L16.5 13l-2.5 2.5-1.41-1.41L14.59 12l-2-2.09 1.41-1.41L16.5 11z"/>
        )}
      </svg>
    </button>
  );
}

function JoinScreen() {
  const archetypes = useStore(s => s.archetypes);
  const formConfig = useStore(s => s.formConfig);
  const sessionId = useStore(s => s.sessionId);
  const sessionName = useStore(s => s.sessionName);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [arch, setArch] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [joining, setJoining] = useState(false);

  if (!formConfig) return <div className="empty-state">Loading session configuration...</div>;

  const fields = formConfig.fields;
  const title = formConfig.title;
  const subtitle = formConfig.subtitle;
  const introText = formConfig.intro_text;

  const customOk = arch !== 'custom' || customRole.trim();
  const requiredFieldsFilled = fields.filter((f: any) => f.required).every((f: any) => (fieldValues[f.name] || '').trim());
  const ready = requiredFieldsFilled && arch && customOk;

  const hintText = !requiredFieldsFilled && !arch ? 'Enter your name and select a role to continue.'
    : !requiredFieldsFilled ? 'Fill in the required fields to continue.'
    : !arch ? 'Select a role to continue.'
    : !customOk ? 'Describe your role to continue.'
    : '';

  const handleJoin = async () => {
    if (!ready) return;
    setJoining(true);
    try {
      const name = (fieldValues['name'] || '').trim();
      const organization = (fieldValues['organization'] || '').trim();
      const resp = await fetch(`${API}/api/sessions/${sessionId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organization, archetype: arch, customRole: arch === 'custom' ? customRole.trim() : '' }),
      }).then(r => r.json());

      const roleDisplay = arch === 'custom' ? (customRole.trim() || 'Other') : (archetypes[arch]?.label || arch);
      set({
        token: resp.token,
        archetype: arch,
        screen: 'chat',
        roleDisplay,
        nameDisplay: organization ? `${name} · ${organization}` : name,
        chatStartTime: Date.now(),
        lastActivityTime: Date.now(),
        activeTimeMs: 0,
      });
      history.pushState(null, '', `/sessions/${sessionId}/interviews/${resp.token}`);
      await startInterview(resp.token);
    } catch (err: any) {
      alert('Failed to join: ' + err.message);
      setJoining(false);
    }
  };

  const archList = formConfig.archetypes;

  return (
    <div id="join-screen" style={{ display: 'flex' }}>
      <div className="join-header">
        {sessionName && <div className="session-badge">{sessionName}</div>}
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>

      {introText && (
        <div className="welcome-intro" dangerouslySetInnerHTML={{ __html: introText }} />
      )}

      {fields.map((f: any) => (
        <div className="form-group" key={f.name}>
          <label htmlFor={f.name}>{f.label}{!f.required && <span style={{ fontWeight: 400 }}> (optional)</span>}</label>
          <input type={f.type || 'text'} id={f.name} placeholder={f.placeholder || ''}
            value={fieldValues[f.name] || ''}
            onChange={e => setFieldValues(prev => ({ ...prev, [f.name]: e.target.value }))} />
        </div>
      ))}

      <div className="form-group">
        <label>Which best describes your role?</label>
        <div className="role-tiles">
          {archList.map((a: any) => (
            <button key={a.key} type="button"
              className={`role-tile ${arch === a.key ? 'selected' : ''}`}
              onClick={() => { setArch(a.key); }}>
              <div className="role-tile-label">{a.label}</div>
              {a.key === 'custom' ? (
                <input type="text" className="custom-role-input"
                  placeholder="Not listed above? Describe your role here..."
                  value={customRole}
                  onClick={e => e.stopPropagation()}
                  onChange={e => { setCustomRole(e.target.value); setArch('custom'); }} />
              ) : (
                <div className="role-tile-desc">{a.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {hintText && (
        <div id="join-hint" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', background: '#fff3cd', padding: '0.375rem 0.625rem', borderRadius: '0.25rem', color: '#664d03', fontWeight: 500 }}>
          {hintText}
        </div>
      )}

      <button className="btn" disabled={joining}
        onClick={handleJoin}>
        {joining ? 'Starting...' : 'Start the Conversation'}
      </button>
    </div>
  );
}

function FinalThoughts() {
  const [text, setText] = useState('');
  return (
    <div className="final-thoughts">
      <p>Any final thoughts before we wrap up?</p>
      <textarea placeholder="Share anything else on your mind... (optional)" rows={3}
        value={text} onChange={e => setText(e.target.value)} />
      <div className="final-thoughts-actions">
        <button className="btn btn-sm" onClick={() => finishInterview(text.trim() || null)}>Submit &amp; Finish</button>
        <button className="btn btn-sm btn-secondary" onClick={() => finishInterview(null)}>Skip &amp; Finish</button>
      </div>
    </div>
  );
}

function ChatScreen() {
  const roleDisplay = useStore(s => s.roleDisplay);
  const nameDisplay = useStore(s => s.nameDisplay);
  const [showFinal, setShowFinal] = useState(false);

  return (
    <div id="chat-screen" style={{ display: 'flex' }}>
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>{roleDisplay}</h2>
          <span className="chat-org">{nameDisplay}</span>
        </div>
        <a
          href={`${API}/api/prompt/${useStore.getState().token}`}
          target="_blank"
          rel="noopener"
          style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'underline', marginLeft: 'auto', padding: '0.25rem 0.5rem' }}
        >View prompt</a>
      </div>
      <ChatMessages />
      {!showFinal ? (
        <>
          <ChatInput />
          <div className="done-area">
            <button className="btn btn-sm btn-secondary" onClick={() => setShowFinal(true)}>
              I'm done — wrap up the interview
            </button>
          </div>
        </>
      ) : (
        <FinalThoughts />
      )}
    </div>
  );
}

function CompleteScreen() {
  const token = useStore(s => s.token);
  return (
    <div id="complete-screen" style={{ display: 'flex' }}>
      <div>
        <h2>Thank you for your time</h2>
        <p>Your input will be synthesized with other participants' responses and shared with Argonaut Project participants to help drive the discussion forward.</p>
        <p style={{ marginTop: '0.75rem' }}>The goal is to show where the group agrees, where it diverges, and what the real tensions are.</p>
        <button className="btn" style={{ marginTop: '1.5rem' }} onClick={async () => {
          const resp = await fetch(`${API}/api/transcript/${token}`);
          const mdText = await resp.text();
          const blob = new Blob([mdText], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'interview-transcript.md'; a.click();
          URL.revokeObjectURL(url);
        }}>Download Transcript (.md)</button>
      </div>
    </div>
  );
}

function App() {
  const screen = useStore(s => s.screen);

  useEffect(() => {
    initApp();
    const handler = () => initApp();
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (screen === 'chat') return <ChatScreen />;
  if (screen === 'complete') return <CompleteScreen />;
  return <JoinScreen />;
}

createRoot(document.getElementById('root')!).render(<App />);
