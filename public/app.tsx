import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { marked } from 'marked';
import { useState, useEffect, useRef, useCallback, useLayoutEffect, type ChangeEvent, type SyntheticEvent } from 'react';

marked.use({
  breaks: true,
  gfm: true,
  renderer: {
    html({ text }: { text: string }) {
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
  },
});

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
interface TextSelection { start: number; end: number; }
interface SpeechInsertState { committedEnd: number; interimRange: TextSelection | null; }

// ─── Store ───
type Screen = 'join' | 'chat' | 'complete';

interface AppStoreState {
  screen: Screen;
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
  interviewRequestId: number;
}

interface AppStoreActions {
  beginInterviewRequest: () => number;
  isRequestCurrent: (requestId: number, token?: string) => boolean;
  resetConversation: (overrides?: Partial<AppStoreState>) => void;
  applySessionConfig: (formConfig: any) => void;
  loadSessionConfig: (sid: string, requestId?: number) => Promise<void>;
  initApp: () => Promise<void>;
  startInterview: (token: string, requestId?: number) => Promise<void>;
  resumeInterview: (token: string, requestId?: number) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  finishInterview: (finalThoughts: string | null) => Promise<void>;
}

type AppStore = AppStoreState & AppStoreActions;

const conversationDefaults: Pick<AppStoreState, 'screen' | 'token' | 'archetype' | 'messages' | 'streamingContent' | 'isStreaming' | 'sending' | 'turnCount' | 'chatStartTime' | 'lastActivityTime' | 'activeTimeMs' | 'roleDisplay' | 'nameDisplay'> = {
  screen: 'join',
  token: null,
  archetype: null,
  messages: [],
  streamingContent: '',
  isStreaming: false,
  sending: false,
  turnCount: 0,
  chatStartTime: 0,
  lastActivityTime: 0,
  activeTimeMs: 0,
  roleDisplay: '',
  nameDisplay: '',
};

function buildArchetypeMap(formConfig: any): Record<string, ArchetypeInfo> {
  const arcMap: Record<string, ArchetypeInfo> = {};
  (formConfig?.archetypes || []).forEach((a: any) => {
    arcMap[a.key] = { key: a.key, label: a.label, description: a.description };
  });
  return arcMap;
}

const useStore = create<AppStore>((set, get) => ({
  ...conversationDefaults,
  sessionId: null,
  archetypes: {},
  formConfig: null,
  sessionName: '',
  interviewRequestId: 0,

  beginInterviewRequest: () => {
    const next = get().interviewRequestId + 1;
    set({ interviewRequestId: next });
    return next;
  },

  isRequestCurrent: (requestId, token) => {
    const state = get();
    return state.interviewRequestId === requestId && (token === undefined || state.token === token);
  },

  resetConversation: (overrides = {}) => {
    set({ ...conversationDefaults, ...overrides });
  },

  applySessionConfig: (formConfig) => {
    set({ formConfig, archetypes: buildArchetypeMap(formConfig) });
  },

  loadSessionConfig: async (sid, requestId = get().interviewRequestId) => {
    try {
      const config = await fetch(`${API}/api/sessions/${sid}/config`).then(r => r.json());
      if (!get().isRequestCurrent(requestId)) return;
      if (!config.error && config.form_config) {
        get().applySessionConfig(config.form_config);
      }
    } catch {}
  },

  initApp: async () => {
    const { route, token, sessionId } = parseRoute();
    const requestId = get().beginInterviewRequest();

    if (route !== 'interview') {
      get().resetConversation({ screen: 'join', sessionId });
    }

    if (route === 'interview' && token) {
      try {
        const p = await fetch(`${API}/api/participants/by-token/${token}`).then(r => r.json());
        if (!get().isRequestCurrent(requestId)) return;
        if (p.error) throw new Error(p.error);

        await get().loadSessionConfig(p.session_id, requestId);
        if (!get().isRequestCurrent(requestId)) return;

        const { archetypes } = get();
        get().resetConversation({
          token,
          sessionId: p.session_id,
          archetype: p.archetype,
          roleDisplay: archetypes[p.archetype]?.label || p.archetype,
          nameDisplay: p.organization ? `${p.name} · ${p.organization}` : p.name,
          screen: p.status === 'completed' ? 'complete' : 'chat',
        });
        if (p.status === 'completed') return;

        await get().resumeInterview(token, requestId);
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

    if (!get().isRequestCurrent(requestId)) return;
    set({ sessionId: sid });
    try {
      const session = await fetch(`${API}/api/sessions/${sid}`).then(r => r.json());
      if (get().isRequestCurrent(requestId) && !session.error) {
        set({ sessionName: session.name });
      }
    } catch {}

    if (sid) await get().loadSessionConfig(sid, requestId);
    if (!get().isRequestCurrent(requestId)) return;

    if (route === 'join' && sid) history.pushState(null, '', `/sessions/${sid}`);
    set({ screen: 'join' });
  },

  startInterview: async (token, requestId = get().interviewRequestId) => {
    if (!get().isRequestCurrent(requestId, token)) return;
    set({ isStreaming: true, streamingContent: '' });
    const resp = await fetch(`${API}/api/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!get().isRequestCurrent(requestId, token)) return;

    if (resp.headers.get('content-type')?.includes('application/json')) {
      const data = await resp.json();
      if (!get().isRequestCurrent(requestId, token)) return;
      set({
        messages: data.messages,
        turnCount: data.messages.filter((m: Msg) => m.role === 'user').length,
        isStreaming: false,
      });
      if (data.status === 'completed' && get().isRequestCurrent(requestId, token)) {
        set({ screen: 'complete' });
      }
      return;
    }

    const result = await readStream(resp, (text) => {
      if (get().isRequestCurrent(requestId, token)) {
        set({ streamingContent: text });
      }
    });
    if (!get().isRequestCurrent(requestId, token)) return;

    set(s => ({
      messages: [...s.messages, { role: 'assistant', content: result.text }],
      streamingContent: '',
      isStreaming: false,
    }));
    if (result.complete && get().isRequestCurrent(requestId, token)) {
      set({ screen: 'complete' });
    }
  },

  resumeInterview: async (token, requestId = get().interviewRequestId) => {
    const resp = await fetch(`${API}/api/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!get().isRequestCurrent(requestId, token)) return;

    if (resp.headers.get('content-type')?.includes('application/json')) {
      const data = await resp.json();
      if (!get().isRequestCurrent(requestId, token)) return;
      set({
        messages: data.messages,
        turnCount: data.messages.filter((m: Msg) => m.role === 'user').length,
      });
      if (data.status === 'completed' && get().isRequestCurrent(requestId, token)) {
        set({ screen: 'complete' });
      }
      return;
    }

    set({ isStreaming: true, streamingContent: '' });
    const result = await readStream(resp, (text) => {
      if (get().isRequestCurrent(requestId, token)) {
        set({ streamingContent: text });
      }
    });
    if (!get().isRequestCurrent(requestId, token)) return;

    set(s => ({
      messages: [...s.messages, { role: 'assistant', content: result.text }],
      streamingContent: '',
      isStreaming: false,
    }));
    if (result.complete && get().isRequestCurrent(requestId, token)) {
      set({ screen: 'complete' });
    }
  },

  sendMessage: async (text) => {
    const requestId = get().interviewRequestId;
    const { token, turnCount, lastActivityTime, activeTimeMs } = get();
    if (!token) return;

    const now = Date.now();
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
      const result = await readStream(resp, (streamText) => {
        if (get().isRequestCurrent(requestId, token)) {
          set({ streamingContent: streamText });
        }
      });
      if (!get().isRequestCurrent(requestId, token)) return;

      set(s => ({
        messages: [...s.messages, { role: 'assistant', content: result.text }],
        streamingContent: '',
        isStreaming: false,
        sending: false,
      }));
      if (result.complete && get().isRequestCurrent(requestId, token)) {
        set({ screen: 'complete' });
      }
    } catch (err: any) {
      if (!get().isRequestCurrent(requestId, token)) return;
      set(s => ({
        messages: [...s.messages, { role: 'assistant', content: 'Error: ' + err.message }],
        streamingContent: '',
        isStreaming: false,
        sending: false,
      }));
    }
  },

  finishInterview: async (finalThoughts) => {
    const requestId = get().interviewRequestId;
    const { token } = get();
    if (!token) return;

    if (finalThoughts) {
      set(s => ({ messages: [...s.messages, { role: 'user', content: finalThoughts }] }));
    }
    await fetch(`${API}/api/chat/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...(finalThoughts ? { finalMessage: finalThoughts } : {}) }),
    });
    if (get().isRequestCurrent(requestId, token)) {
      set({ screen: 'complete' });
    }
  },
}));


// ─── Option Parsing ───
function extractOptionMode(text: string): { text: string; multi: boolean | null } {
  const match = text.match(/\s*\[\[(single|multi)\]\]\s*$/i);
  if (!match || match.index === undefined) return { text, multi: null };
  return {
    text: text.slice(0, match.index).trimEnd(),
    multi: match[1].toLowerCase() === 'multi',
  };
}

function parseOptions(text: string): ParsedOptions {
  const lines = text.split('\n');
  const options: { letter: string; text: string }[] = [];
  let i = lines.length - 1;
  let multi = true;

  while (i >= 0) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(/^\[([A-Z])\]\s+(.+)$/);
    if (match) {
      const parsed = extractOptionMode(match[2]);
      if (parsed.multi !== null) multi = parsed.multi;
      options.unshift({ letter: match[1], text: parsed.text || match[2] });
      i--;
    } else if (/^\[\[(single|multi)\]\]$/i.test(trimmed)) {
      multi = trimmed.toLowerCase() === '[[multi]]';
      i--;
    } else if (trimmed === '' && options.length > 0) {
      i--;
    } else {
      break;
    }
  }

  if (options.length === 0) return { body: text, options: [], multi: false };
  const parsedBody = extractOptionMode(lines.slice(0, i + 1).join('\n').trimEnd());
  if (parsedBody.multi !== null) multi = parsedBody.multi;
  const body = parsedBody.text.trimEnd();
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

// Shared refs so Options and ChatInput can combine MCQ selections + typed text
const inputDraftRef = { get: () => '', clear: () => {} };
const optionsRef = { get: () => '' as string, clear: () => {} };

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

  optionsRef.get = () => multi ? [...selected].join('; ') : '';
  optionsRef.clear = () => { setSelected(new Set()); setDisabled(true); };

  const hint = <span className="options-hint">or type your own answer below</span>;

  const sendWithDraft = (optionText: string) => {
    const draft = inputDraftRef.get().trim();
    inputDraftRef.clear();
    onSelect(draft ? `${optionText}\n\n${draft}` : optionText);
  };

  if (!multi) {
    return (
      <div className="options">
        {options.map(opt => (
          <button key={opt.letter} className="option-btn" disabled={disabled}
            onClick={() => { setDisabled(true); sendWithDraft(opt.text); }}>
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
        onClick={() => { setDisabled(true); sendWithDraft([...selected].join('; ')); }}
      >
        {selected.size > 0 ? `Submit (${selected.size})` : 'Submit'}
      </button>
      {hint}
    </div>
  );
}

function MessageBubble({ msg, isLast }: { msg: Msg; isLast: boolean }) {
  const sendMessage = useStore(s => s.sendMessage);

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
  const sendMessage = useStore(s => s.sendMessage);
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<TextSelection | null>(null);
  const pendingSelectionRef = useRef<TextSelection | null>(null);
  const applyingSelectionRef = useRef(false);
  // Tracks where dictated text is being inserted even if the textarea loses focus.
  const speechStateRef = useRef<SpeechInsertState | null>(null);

  const clampSelection = useCallback((selection: TextSelection | null, length: number): TextSelection => {
    if (!selection) return { start: length, end: length };
    const start = Math.max(0, Math.min(selection.start, length));
    const end = Math.max(0, Math.min(selection.end, length));
    return start <= end ? { start, end } : { start: end, end: start };
  }, []);

  const clearDraft = useCallback(() => {
    speechStateRef.current = null;
    selectionRef.current = { start: 0, end: 0 };
    pendingSelectionRef.current = { start: 0, end: 0 };
    setText('');
  }, []);

  inputDraftRef.get = () => text;
  inputDraftRef.clear = clearDraft;

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [text]);

  useLayoutEffect(() => {
    const textarea = ref.current;
    const pending = pendingSelectionRef.current;
    if (!textarea || !pending) return;
    const next = clampSelection(pending, text.length);
    selectionRef.current = next;
    if (document.activeElement === textarea) {
      applyingSelectionRef.current = true;
      textarea.setSelectionRange(next.start, next.end);
      queueMicrotask(() => {
        applyingSelectionRef.current = false;
      });
    }
    pendingSelectionRef.current = null;
  }, [text, clampSelection]);

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
    if (!final && !interim) return;

    setText(prev => {
      const inserted = final + interim;
      const speechState = speechStateRef.current;
      const selection = clampSelection(selectionRef.current, prev.length);
      const replaceStart = speechState ? speechState.committedEnd : selection.start;
      const replaceEnd = speechState?.interimRange ? speechState.interimRange.end : (speechState ? speechState.committedEnd : selection.end);
      const next = prev.slice(0, replaceStart) + inserted + prev.slice(replaceEnd);
      const committedEnd = replaceStart + final.length;
      speechStateRef.current = {
        committedEnd,
        interimRange: interim
          ? { start: committedEnd, end: committedEnd + interim.length }
          : null,
      };
      const caret = replaceStart + inserted.length;
      selectionRef.current = { start: caret, end: caret };
      pendingSelectionRef.current = { start: caret, end: caret };
      return next;
    });
  }, [clampSelection]);

  const handleSend = useCallback(() => {
    const val = text.trim();
    const opts = optionsRef.get();
    if ((!val && !opts) || sending) return;
    clearDraft();
    micRestartRef.restartIfRecording();
    if (opts) optionsRef.clear();
    const combined = [opts, val].filter(Boolean).join('\n\n');
    sendMessage(combined);
    ref.current?.focus();
  }, [clearDraft, text, sending]);

  const handleTextChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const hadLiveInterim = Boolean(speechStateRef.current?.interimRange);
    speechStateRef.current = null;
    selectionRef.current = {
      start: e.target.selectionStart ?? e.target.value.length,
      end: e.target.selectionEnd ?? e.target.value.length,
    };
    pendingSelectionRef.current = null;
    setText(e.target.value);
    if (hadLiveInterim) micRestartRef.restartIfRecording();
  }, []);

  const handleSelectionChange = useCallback((e: SyntheticEvent<HTMLTextAreaElement>) => {
    if (applyingSelectionRef.current) return;
    const target = e.currentTarget;
    const nextSelection = {
      start: target.selectionStart ?? target.value.length,
      end: target.selectionEnd ?? target.value.length,
    };
    const speechState = speechStateRef.current;

    if (speechState?.interimRange) {
      const { start, end } = speechState.interimRange;
      const interimLength = end - start;
      const adjustIndex = (index: number) => {
        if (index <= start) return index;
        if (index >= end) return index - interimLength;
        return start;
      };
      const adjustedSelection = {
        start: adjustIndex(nextSelection.start),
        end: adjustIndex(nextSelection.end),
      };
      speechStateRef.current = null;
      selectionRef.current = adjustedSelection;
      pendingSelectionRef.current = adjustedSelection;
      setText(prev => prev.slice(0, start) + prev.slice(end));
      micRestartRef.restartIfRecording();
      return;
    }

    speechStateRef.current = null;
    selectionRef.current = nextSelection;
  }, []);

  return (
    <div className="input-area" ref={rootRef}>
      <textarea ref={ref} value={text} placeholder="Type or tap mic to speak..."
        onChange={handleTextChange}
        onSelect={handleSelectionChange}
        onClick={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
      />
      <MicButton onUpdate={handleMicUpdate} inputRef={ref} />

      <button className="btn btn-icon send-btn" onClick={handleSend} disabled={sending || !text.trim()} aria-label="Send message" title="Send message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V4M5 11l7-7 7 7"/></svg></button>
    </div>
  );
}

// Refs for ChatInput to coordinate microphone state.
const micSkipRef = { skip: () => {} };
const micRestartRef = { restartIfRecording: () => {} };

function MicButton({ onUpdate, inputRef }: { onUpdate: (final: string, interim: string) => void; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [recording, setRecording] = useState(false);
  const recRef = useRef<any>(null);
  const wantRecordingRef = useRef(false);
  const activeSessionRef = useRef(0);

  if (!SR) return null;

  useEffect(() => {
    micRestartRef.restartIfRecording = () => {
      if (!wantRecordingRef.current) return;
      activeSessionRef.current += 1;
      const current = recRef.current;
      recRef.current = null;
      current?.stop();
      queueMicrotask(() => {
        if (!wantRecordingRef.current || recRef.current) return;
        try {
          startRec();
          setRecording(true);
        } catch (err) {
          console.error('Failed to restart speech recognition:', err);
          wantRecordingRef.current = false;
          setRecording(false);
        }
      });
    };

    return () => {
      activeSessionRef.current += 1;
      wantRecordingRef.current = false;
      recRef.current?.stop();
      recRef.current = null;
      micSkipRef.skip = () => {};
      micRestartRef.restartIfRecording = () => {};
    };
  }, []);

  const startRec = () => {
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    const sessionId = ++activeSessionRef.current;

    let processedCount = 0;
    let lastResultCount = 0;
    micSkipRef.skip = () => {
      processedCount = Math.max(processedCount, lastResultCount);
    };
    rec.onresult = (e: any) => {
      if (sessionId !== activeSessionRef.current) return;
      lastResultCount = e.results.length;
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
      if (newFinal || interim) onUpdate(newFinal, interim);
    };

    rec.onerror = (e: any) => {
      if (sessionId !== activeSessionRef.current) return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        console.error('SpeechRecognition error:', e.error);
        wantRecordingRef.current = false;
        setRecording(false);
        recRef.current = null;
        micSkipRef.skip = () => {};
      }
      // Other errors (network, no-speech) — let onend handle restart
    };

    rec.onend = () => {
      if (sessionId !== activeSessionRef.current) return;
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
        micSkipRef.skip = () => {};
      }
    };

    rec.start();
    recRef.current = rec;
  };

  const toggle = async () => {
    if (recording) {
      activeSessionRef.current += 1;
      wantRecordingRef.current = false;
      recRef.current?.stop();
      recRef.current = null;
      micSkipRef.skip = () => {};
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
    <button className={`mic-btn ${recording ? 'mic-recording' : ''}`} onMouseDown={e => e.preventDefault()} onClick={toggle}
      title={recording ? 'Stop dictation' : 'Dictate'}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-4 8.93A7.001 7.001 0 0012 20a7.001 7.001 0 00-1-.07V22h2v-2.07z"/>
      </svg>
    </button>
  );
}


function JoinScreen() {
  const archetypes = useStore(s => s.archetypes);
  const formConfig = useStore(s => s.formConfig);
  const sessionId = useStore(s => s.sessionId);
  const sessionName = useStore(s => s.sessionName);
  const beginInterviewRequest = useStore(s => s.beginInterviewRequest);
  const resetConversation = useStore(s => s.resetConversation);
  const startInterview = useStore(s => s.startInterview);
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
  const missingRequired = fields.filter((f: any) => f.required && !(fieldValues[f.name] || '').trim());
  const requiredFieldsFilled = missingRequired.length === 0;
  const ready = requiredFieldsFilled && arch && customOk;

  const hintText = (() => {
    const parts: string[] = [];
    if (missingRequired.length) {
      const names = missingRequired.map((f: any) => f.label);
      parts.push(names.length === 1 ? `Enter ${names[0].toLowerCase()}` : `Enter ${names.join(' and ').toLowerCase()}`);
    }
    if (!arch) parts.push('select a role');
    else if (!customOk) parts.push('describe your role');
    if (!parts.length) return '';
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + (parts.length > 1 ? ' and ' + parts.slice(1).join(' and ') : '') + ' to continue.';
  })();

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
      const requestId = beginInterviewRequest();
      resetConversation({
        token: resp.token,
        sessionId,
        archetype: arch,
        screen: 'chat',
        roleDisplay,
        nameDisplay: organization ? `${name} · ${organization}` : name,
        chatStartTime: Date.now(),
        lastActivityTime: Date.now(),
        activeTimeMs: 0,
      });
      history.pushState(null, '', `/sessions/${sessionId}/interviews/${resp.token}`);
      await startInterview(resp.token, requestId);
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
        <div className="welcome-intro" dangerouslySetInnerHTML={{ __html: md(introText) }} />
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
          {archList.map((a: any) => a.key === 'custom' ? (
            <div key={a.key}
              className={`role-tile role-tile-custom ${arch === a.key ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => { setArch(a.key); }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setArch(a.key);
                }
              }}>
              <div className="role-tile-label">{a.label}</div>
              <textarea className="custom-role-input"
                placeholder="Not listed above? Describe your role here..."
                value={customRole}
                rows={3}
                onClick={e => e.stopPropagation()}
                onFocus={() => setArch('custom')}
                onChange={e => { setCustomRole(e.target.value); setArch('custom'); }} />
            </div>
          ) : (
            <button key={a.key} type="button"
              className={`role-tile ${arch === a.key ? 'selected' : ''}`}
              onClick={() => { setArch(a.key); }}>
              <div className="role-tile-label">{a.label}</div>
              <div className="role-tile-desc">{a.description}</div>
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

function FinalThoughts({ onCancel }: { onCancel: () => void }) {
  const [text, setText] = useState('');
  const finishInterview = useStore(s => s.finishInterview);
  return (
    <div className="final-thoughts">
      <p>Any final thoughts before we wrap up?</p>
      <textarea placeholder="Share anything else on your mind... (optional)" rows={3}
        value={text} onChange={e => setText(e.target.value)} />
      <div className="final-thoughts-actions">
        <button className="btn btn-sm" onClick={() => finishInterview(text.trim() || null)}>Submit &amp; Finish</button>
        <button className="btn btn-sm btn-secondary" onClick={() => finishInterview(null)}>Skip &amp; Finish</button>
        <button className="btn btn-sm btn-secondary" onClick={onCancel}>Never mind — keep going</button>
      </div>
    </div>
  );
}

async function downloadTranscript(token: string | null) {
  if (!token) return;
  const resp = await fetch(`${API}/api/transcript/${token}`);
  const mdText = await resp.text();
  const blob = new Blob([mdText], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'interview-transcript.md';
  a.click();
  URL.revokeObjectURL(url);
}

function CompletionCallout() {
  const token = useStore(s => s.token);
  return (
    <div className="completion-callout">
      <h3>Thank you for your time</h3>
      <p>Your input will be synthesized with other participants' responses and shared with Argonaut Project participants to help drive the discussion forward.</p>
      <p>The goal is to show where the group agrees, where it diverges, and what the real tensions are.</p>
      <button className="btn" style={{ marginTop: '1rem' }} onClick={() => { void downloadTranscript(token); }}>
        Download Transcript (.md)
      </button>
    </div>
  );
}

function ChatScreen() {
  const screen = useStore(s => s.screen);
  const roleDisplay = useStore(s => s.roleDisplay);
  const nameDisplay = useStore(s => s.nameDisplay);
  const token = useStore(s => s.token);
  const [showFinal, setShowFinal] = useState(false);
  const completed = screen === 'complete';

  useEffect(() => {
    if (!completed) return;
    shouldTail.current = true;
    const snapToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
    requestAnimationFrame(() => {
      snapToBottom();
      requestAnimationFrame(snapToBottom);
    });
  }, [completed]);

  return (
    <div id="chat-screen" style={{ display: 'flex' }}>
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>{roleDisplay}</h2>
          <span className="chat-org">{nameDisplay}</span>
        </div>
        <a
          href={`${API}/api/prompt/${token}`}
          target="_blank"
          rel="noopener"
          style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'underline', marginLeft: 'auto', padding: '0.25rem 0.5rem' }}
        >View prompt</a>
      </div>
      <ChatMessages />
      {completed ? (
        <CompletionCallout />
      ) : !showFinal ? (
        <>
          <ChatInput />
          <div className="done-area">
            <button className="btn btn-sm btn-secondary" onClick={() => setShowFinal(true)}>
              I'm done — wrap up the interview
            </button>
          </div>
        </>
      ) : (
        <FinalThoughts onCancel={() => setShowFinal(false)} />
      )}
    </div>
  );
}

function App() {
  const screen = useStore(s => s.screen);
  const initApp = useStore(s => s.initApp);

  useEffect(() => {
    initApp();
    const handler = () => initApp();
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [initApp]);

  if (screen === 'chat' || screen === 'complete') return <ChatScreen />;
  return <>
    <JoinScreen />
    <footer className="app-footer">
      &copy; {new Date().getFullYear()} Josh Mandel &middot; Open source at <a href="https://github.com/jmandel/argonaut-interview-bot" target="_blank" rel="noopener noreferrer">jmandel/argonaut-interview-bot</a>
    </footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
