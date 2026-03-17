import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import OpenAI from "openai";
import db, { generateId, generateToken, slugify } from "./db";
import {
  buildSystemPromptFromTemplate,
  EXTRACTION_PROMPT,
  SYNTHESIS_PROMPT,
  getDefaultSystemPrompt,
  getOperationalBasePrompt,
  getDefaultFormConfig,
} from "./prompts";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Per-stage LLM models — override via env vars
const CHAT_MODEL = process.env.CHAT_MODEL || "google/gemini-3-flash-preview";
const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL || "google/gemini-3-flash-preview";
const SYNTHESIS_MODEL = process.env.SYNTHESIS_MODEL || "google/gemini-3-flash-preview";

const app = new Hono();

// SSE connections for dashboard updates
const dashboardClients = new Set<ReadableStreamDefaultController>();

function notifyDashboard(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const ctrl of dashboardClients) {
    try {
      ctrl.enqueue(new TextEncoder().encode(msg));
    } catch {
      dashboardClients.delete(ctrl);
    }
  }
}

// ─── API Routes ───

// Session defaults (for session creation form)
app.get("/api/defaults", (c) => {
  return c.json({
    operational_prompt: getOperationalBasePrompt(),
    system_prompt: getDefaultSystemPrompt(),
    form_config: getDefaultFormConfig(),
    extraction_prompt: EXTRACTION_PROMPT,
    synthesis_prompt: SYNTHESIS_PROMPT,
  });
});

// Sessions
app.post("/api/sessions", async (c) => {
  const body = await c.req.json<{
    name: string;
    system_prompt?: string;
    form_config?: any;
    extraction_prompt?: string;
    synthesis_prompt?: string;
  }>();
  const { name } = body;
  const id = generateId();
  const slug = slugify(name);
  const systemPrompt = body.system_prompt ?? getDefaultSystemPrompt();
  const formConfig = body.form_config ? (typeof body.form_config === 'string' ? body.form_config : JSON.stringify(body.form_config)) : JSON.stringify(getDefaultFormConfig());
  const extractionPrompt = body.extraction_prompt ?? EXTRACTION_PROMPT;
  const synthesisPrompt = body.synthesis_prompt ?? SYNTHESIS_PROMPT;
  db.run(
    "INSERT INTO sessions (id, name, slug, system_prompt, form_config, extraction_prompt, synthesis_prompt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, name, slug, systemPrompt, formConfig, extractionPrompt, synthesisPrompt]
  );
  return c.json({ id, name, slug });
});

app.get("/api/sessions", (c) => {
  const rows = db.query("SELECT * FROM sessions ORDER BY created_at DESC").all();
  return c.json(rows);
});

app.get("/api/sessions/:id", (c) => {
  const param = c.req.param("id");
  // Try by ID first, then by slug
  let row = db.query("SELECT * FROM sessions WHERE id = ?").get(param);
  if (!row) {
    row = db.query("SELECT * FROM sessions WHERE slug = ?").get(param);
  }
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// Session config endpoint
app.get("/api/sessions/:sessionId/config", (c) => {
  const param = c.req.param("sessionId");
  let row = db.query("SELECT * FROM sessions WHERE id = ?").get(param) as any;
  if (!row) row = db.query("SELECT * FROM sessions WHERE slug = ?").get(param) as any;
  if (!row) return c.json({ error: "Not found" }, 404);
  if (!row.system_prompt || !row.form_config || row.form_config === '{}') {
    return c.json({ error: "Session config is incomplete — missing prompts or form_config" }, 500);
  }
  return c.json({
    system_prompt: row.system_prompt,
    form_config: JSON.parse(row.form_config),
    extraction_prompt: row.extraction_prompt,
    synthesis_prompt: row.synthesis_prompt,
  });
});

// Resolve session param (could be ID or slug)
function resolveSessionId(param: string): string | null {
  const row = db.query("SELECT id FROM sessions WHERE id = ? OR slug = ?").get(param, param) as any;
  return row?.id || null;
}

// Load session config from DB — no fallbacks, data must be present
function loadSessionConfig(sessionId: string) {
  const session = db.query("SELECT system_prompt, form_config, extraction_prompt, synthesis_prompt FROM sessions WHERE id = ?").get(sessionId) as any;
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (!session.system_prompt) throw new Error(`Session ${sessionId} has no system_prompt`);
  if (!session.form_config || session.form_config === '{}') throw new Error(`Session ${sessionId} has no form_config`);
  if (!session.extraction_prompt) throw new Error(`Session ${sessionId} has no extraction_prompt`);
  if (!session.synthesis_prompt) throw new Error(`Session ${sessionId} has no synthesis_prompt`);
  return {
    system_prompt: session.system_prompt,
    form_config: JSON.parse(session.form_config),
    extraction_prompt: session.extraction_prompt,
    synthesis_prompt: session.synthesis_prompt,
  };
}

// Participants
app.post("/api/sessions/:sessionId/participants", async (c) => {
  const sessionId = resolveSessionId(c.req.param("sessionId")) || c.req.param("sessionId");
  const { name, organization = "", archetype, customRole = "" } = await c.req.json<{
    name: string;
    organization?: string;
    archetype: string;
    customRole?: string;
  }>();

  // Validate archetype against session's form_config
  const config = loadSessionConfig(sessionId);
  const validKeys = config.form_config.archetypes?.map((a: any) => a.key) || [];
  if (!validKeys.includes(archetype)) {
    return c.json({ error: "Invalid archetype" }, 400);
  }

  const id = generateId();
  const token = generateToken();

  db.run(
    "INSERT INTO participants (id, session_id, name, organization, archetype, custom_role, token) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, sessionId, name, organization, archetype, customRole, token]
  );

  notifyDashboard("participant_joined", { id, name, organization, archetype, status: "joined", sessionId });

  return c.json({ id, token, archetype });
});

app.get("/api/sessions/:sessionId/participants", (c) => {
  const sessionId = resolveSessionId(c.req.param("sessionId")) || c.req.param("sessionId");
  const rows = db
    .query(`SELECT p.id, p.name, p.organization, p.archetype, p.status, p.created_at, p.completed_at,
      (SELECT COUNT(*) FROM messages m WHERE m.participant_id = p.id AND m.role = 'user') as user_turns,
      (SELECT MAX(m.created_at) FROM messages m WHERE m.participant_id = p.id) as last_message_at
    FROM participants p WHERE p.session_id = ? ORDER BY p.created_at`)
    .all(sessionId) as any[];

  for (const r of rows) {
    const userMsgs = db.query("SELECT content FROM messages WHERE participant_id = ? AND role = 'user'").all(r.id) as { content: string }[];
    r.user_words = userMsgs.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0);
    r.meets_threshold = r.user_turns >= MIN_USER_TURNS || r.user_words >= MIN_USER_WORDS;
  }

  return c.json(rows);
});

// Chat - send message and stream response
app.post("/api/chat", async (c) => {
  const { token, message, turnCount, activeMinutes } = await c.req.json<{ token: string; message: string; turnCount?: number; activeMinutes?: number }>();

  const participant = db
    .query("SELECT * FROM participants WHERE token = ?")
    .get(token) as any;

  if (!participant) return c.json({ error: "Invalid token" }, 401);
  if (participant.status === "completed") {
    return c.json({ error: "Interview already completed" }, 400);
  }

  // Mark as interviewing
  if (participant.status === "joined") {
    db.run("UPDATE participants SET status = 'interviewing' WHERE id = ?", [participant.id]);
    notifyDashboard("participant_status", { id: participant.id, status: "interviewing" });
  }

  // Store user message
  const userMsgResult = db.run(
    "INSERT INTO messages (participant_id, role, content) VALUES (?, 'user', ?)",
    [participant.id, message]
  );

  // Build message history
  const history = db
    .query("SELECT role, content FROM messages WHERE participant_id = ? ORDER BY id")
    .all(participant.id) as { role: string; content: string }[];

  // Load session config for system prompt
  const sessionConfig = loadSessionConfig(participant.session_id);
  const archetypeInfo = sessionConfig.form_config.archetypes?.find((a: any) => a.key === participant.archetype);
  const roleLabel = participant.archetype === 'custom' && participant.custom_role
    ? participant.custom_role
    : (archetypeInfo?.label || participant.archetype);
  const roleDescription = participant.archetype === 'custom' && participant.custom_role
    ? `Self-described role: "${participant.custom_role}". Adapt your questions to explore their specific perspective on portable authorization.`
    : (archetypeInfo?.description || '');
  const interviewNotes = archetypeInfo?.interviewNotes || '';
  const systemPrompt = buildSystemPromptFromTemplate(
    sessionConfig.system_prompt,
    participant.name,
    participant.organization || "",
    sessionConfig.form_config,
    roleLabel,
    roleDescription,
    interviewNotes,
    turnCount,
    activeMinutes
  );

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Stream response
  return streamSSE(c, async (stream) => {
    let fullResponse = "";

    try {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        stream: true,
        max_tokens: 1024,
      });

      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          await stream.writeSSE({ data: JSON.stringify({ type: "delta", content: delta }) });
        }
      }

      // Check if the AI signaled interview completion
      const interviewComplete = fullResponse.includes("[[INTERVIEW_COMPLETE]]");
      const cleanResponse = fullResponse.replace("[[INTERVIEW_COMPLETE]]", "").trimEnd();

      // Store assistant message
      const assistantMsgResult = db.run(
        "INSERT INTO messages (participant_id, role, content) VALUES (?, 'assistant', ?)",
        [participant.id, cleanResponse]
      );

      if (interviewComplete) {
        db.run(
          "UPDATE participants SET status = 'completed', completed_at = datetime('now') WHERE id = ?",
          [participant.id]
        );
        notifyDashboard("participant_status", { id: participant.id, status: "completed" });

        // Generate the final per-conversation analysis once the interview is complete.
        runFullExtraction(participant.id).catch(console.error);
      }

      await stream.writeSSE({ data: JSON.stringify({ type: "done", complete: interviewComplete }) });

      notifyDashboard("new_message", {
        participantId: participant.id,
        role: "assistant",
        preview: cleanResponse.slice(0, 200),
      });

    } catch (err: any) {
      console.error("Chat error:", err);
      await stream.writeSSE({
        data: JSON.stringify({ type: "error", content: err.message || "Chat failed" }),
      });
    }
  });
});

// Start interview (get opening message)
app.post("/api/chat/start", async (c) => {
  const { token } = await c.req.json<{ token: string }>();

  const participant = db
    .query("SELECT * FROM participants WHERE token = ?")
    .get(token) as any;

  if (!participant) return c.json({ error: "Invalid token" }, 401);

  // Check if already has messages
  const existingMessages = db
    .query("SELECT COUNT(*) as count FROM messages WHERE participant_id = ?")
    .get(participant.id) as any;

  if (existingMessages.count > 0) {
    // Return existing messages
    const messages = db
      .query("SELECT role, content FROM messages WHERE participant_id = ? ORDER BY id")
      .all(participant.id);
    return c.json({ messages, status: participant.status });
  }

  // Mark as interviewing
  db.run("UPDATE participants SET status = 'interviewing' WHERE id = ?", [participant.id]);
  notifyDashboard("participant_status", { id: participant.id, status: "interviewing" });

  // Load session config for system prompt
  const startConfig = loadSessionConfig(participant.session_id);
  const startArchetype = startConfig.form_config.archetypes?.find((a: any) => a.key === participant.archetype);
  const startRoleLabel = participant.archetype === 'custom' && participant.custom_role
    ? participant.custom_role
    : (startArchetype?.label || participant.archetype);
  const startRoleDesc = participant.archetype === 'custom' && participant.custom_role
    ? `Self-described role: "${participant.custom_role}". Adapt your questions to explore their specific perspective on portable authorization.`
    : (startArchetype?.description || '');
  const startNotes = startArchetype?.interviewNotes || '';
  const systemPrompt = buildSystemPromptFromTemplate(
    startConfig.system_prompt,
    participant.name,
    participant.organization || "",
    startConfig.form_config,
    startRoleLabel,
    startRoleDesc,
    startNotes
  );

  return streamSSE(c, async (stream) => {
    let fullResponse = "";

    try {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Please begin the interview with your opening question. The participant has just joined and selected their role.",
          },
        ],
        stream: true,
        max_tokens: 1024,
      });

      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          await stream.writeSSE({ data: JSON.stringify({ type: "delta", content: delta }) });
        }
      }

      // Store the opening as an assistant message
      db.run(
        "INSERT INTO messages (participant_id, role, content) VALUES (?, 'assistant', ?)",
        [participant.id, fullResponse]
      );

      await stream.writeSSE({ data: JSON.stringify({ type: "done" }) });

      notifyDashboard("new_message", {
        participantId: participant.id,
        role: "assistant",
        preview: fullResponse.slice(0, 200),
      });
    } catch (err: any) {
      console.error("Start chat error:", err);
      await stream.writeSSE({
        data: JSON.stringify({ type: "error", content: err.message || "Failed to start" }),
      });
    }
  });
});

// Complete interview
app.post("/api/chat/complete", async (c) => {
  const { token, finalMessage } = await c.req.json<{ token: string; finalMessage?: string }>();

  const participant = db
    .query("SELECT * FROM participants WHERE token = ?")
    .get(token) as any;

  if (!participant) return c.json({ error: "Invalid token" }, 401);

  if (finalMessage) {
    db.run(
      "INSERT INTO messages (participant_id, role, content) VALUES (?, 'user', ?)",
      [participant.id, finalMessage]
    );
  }

  db.run(
    "UPDATE participants SET status = 'completed', completed_at = datetime('now') WHERE id = ?",
    [participant.id]
  );

  notifyDashboard("participant_status", { id: participant.id, status: "completed" });

  // Trigger full extraction async
  runFullExtraction(participant.id).catch(console.error);

  return c.json({ status: "completed" });
});

// Look up participant by token (for session resume)
app.get("/api/participants/by-token/:token", (c) => {
  const row = db
    .query("SELECT p.id, p.name, p.organization, p.archetype, p.status, p.session_id, s.name as session_name FROM participants p JOIN sessions s ON p.session_id = s.id WHERE p.token = ?")
    .get(c.req.param("token")) as any;
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// Download transcript as markdown
app.get("/api/transcript/:token", (c) => {
  const participant = db
    .query("SELECT p.*, s.name as session_name FROM participants p JOIN sessions s ON p.session_id = s.id WHERE p.token = ?")
    .get(c.req.param("token")) as any;
  if (!participant) return c.json({ error: "Not found" }, 404);

  const messages = db
    .query("SELECT role, content, created_at FROM messages WHERE participant_id = ? ORDER BY id")
    .all(participant.id) as { role: string; content: string; created_at: string }[];

  const transcriptConfig = loadSessionConfig(participant.session_id);
  const transcriptArchetype = transcriptConfig.form_config.archetypes?.find((a: any) => a.key === participant.archetype);
  const archLabel = transcriptArchetype?.label || participant.archetype;
  let md = `# Interview Transcript\n\n`;
  md += `**Session:** ${participant.session_name}\n`;
  md += `**Participant:** ${participant.name}`;
  if (participant.organization) md += ` (${participant.organization})`;
  md += `\n**Role:** ${archLabel}\n`;
  md += `**Date:** ${participant.created_at}\n\n---\n\n`;

  for (const msg of messages) {
    const speaker = msg.role === 'assistant' ? 'Interviewer' : participant.name;
    md += `**${speaker}:**\n${msg.content}\n\n`;
  }

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="transcript.md"`,
    },
  });
});

// Dump all conversations for a session as a single markdown string
app.get("/api/sessions/:sessionId/transcripts", (c) => {
  const sessionId = resolveSessionId(c.req.param("sessionId")) || c.req.param("sessionId");
  const session = db.query("SELECT * FROM sessions WHERE id = ?").get(sessionId) as any;
  if (!session) return c.json({ error: "Not found" }, 404);

  const participants = db
    .query("SELECT * FROM participants WHERE session_id = ? ORDER BY created_at")
    .all(sessionId) as any[];

  const allTranscriptsConfig = loadSessionConfig(sessionId);
  let md = `# All Interview Transcripts\n\n**Session:** ${session.name}\n**Exported:** ${new Date().toISOString()}\n**Participants:** ${participants.length}\n\n`;

  for (const p of participants) {
    const allArchetype = allTranscriptsConfig.form_config.archetypes?.find((a: any) => a.key === p.archetype);
    const archLabel = allArchetype?.label || p.archetype;
    md += `---\n\n## ${p.name}${p.organization ? ` (${p.organization})` : ''}\n`;
    md += `**Role:** ${archLabel} | **Status:** ${p.status}\n\n`;

    const messages = db
      .query("SELECT role, content FROM messages WHERE participant_id = ? ORDER BY id")
      .all(p.id) as { role: string; content: string }[];

    if (messages.length === 0) {
      md += `*No messages recorded.*\n\n`;
      continue;
    }

    for (const msg of messages) {
      const speaker = msg.role === 'assistant' ? 'Interviewer' : p.name;
      md += `**${speaker}:** ${msg.content}\n\n`;
    }
  }

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="all-transcripts-${sessionId}.md"`,
    },
  });
});

// Get latest per-conversation analysis
app.get("/api/participants/:id/analysis", (c) => {
  const row = db
    .query("SELECT data, created_at FROM analyses WHERE participant_id = ? AND analysis_type = 'per_conversation' ORDER BY created_at DESC LIMIT 1")
    .get(c.req.param("id")) as any;
  if (!row) return c.json({ analysis: null });
  return c.json({ analysis: row.data, created_at: row.created_at });
});

// Get full transcript
app.get("/api/participants/:id/transcript", (c) => {
  const messages = db
    .query("SELECT role, content, created_at FROM messages WHERE participant_id = ? ORDER BY id")
    .all(c.req.param("id"));
  return c.json(messages);
});

// Trigger synthesis (runs in background, notifies via SSE)
app.post("/api/sessions/:sessionId/synthesize", async (c) => {
  const sessionId = resolveSessionId(c.req.param("sessionId")) || c.req.param("sessionId");

  // Fire and forget — results come via SSE
  runSynthesis(sessionId).catch((err) => {
    console.error("Synthesis error:", err);
    notifyDashboard("synthesis_error", { sessionId, error: err.message });
  });

  return c.json({ status: "processing" });
});

const MIN_USER_TURNS = 3;
const MIN_USER_WORDS = 50;

function buildTranscriptsText(sessionId: string): { text: string; count: number; skipped: string[] } {
  const participants = db
    .query("SELECT * FROM participants WHERE session_id = ? ORDER BY created_at")
    .all(sessionId) as any[];

  const transcriptsConfig = loadSessionConfig(sessionId);
  let transcriptsText = '';
  let participantCount = 0;
  const skipped: string[] = [];

  for (const p of participants) {
    const messages = db
      .query("SELECT role, content FROM messages WHERE participant_id = ? ORDER BY id")
      .all(p.id) as { role: string; content: string }[];

    if (messages.length === 0) continue;

    const userMessages = messages.filter(m => m.role === 'user');
    const userWordCount = userMessages.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0);

    if (userMessages.length < MIN_USER_TURNS && userWordCount < MIN_USER_WORDS) {
      const tArchetype = transcriptsConfig.form_config.archetypes?.find((a: any) => a.key === p.archetype);
      skipped.push(`${p.name} (${userMessages.length} turns, ${userWordCount} words)`);
      console.log(`Skipping ${p.name} from synthesis: ${userMessages.length} user turns, ${userWordCount} user words (min: ${MIN_USER_TURNS} turns OR ${MIN_USER_WORDS} words)`);
      continue;
    }

    participantCount++;

    const tArchetype = transcriptsConfig.form_config.archetypes?.find((a: any) => a.key === p.archetype);
    const archLabel = tArchetype?.label || p.archetype;
    transcriptsText += `\n${'='.repeat(60)}\n`;
    transcriptsText += `## ${p.name}${p.organization ? ` (${p.organization})` : ''} — ${archLabel}\n`;
    transcriptsText += `Status: ${p.status}\n`;
    transcriptsText += `${'='.repeat(60)}\n\n`;

    for (const msg of messages) {
      const speaker = msg.role === 'assistant' ? 'INTERVIEWER' : p.name.toUpperCase();
      transcriptsText += `${speaker}: ${msg.content}\n\n`;
    }
  }

  return { text: transcriptsText, count: participantCount, skipped };
}

async function runSynthesis(sessionId: string) {
  const { text: transcriptsText, count: participantCount, skipped } = buildTranscriptsText(sessionId);

  if (participantCount === 0) {
    const reason = skipped.length > 0
      ? `No interviews met the minimum threshold (${MIN_USER_TURNS}+ turns OR ${MIN_USER_WORDS}+ words). Skipped: ${skipped.join(', ')}`
      : "No interviews with messages to synthesize";
    notifyDashboard("synthesis_error", { sessionId, error: reason });
    return;
  }

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} participant(s) from synthesis: ${skipped.join(', ')}`);
  }
  console.log(`Running synthesis across ${participantCount} participants from raw transcripts...`);

  // Load session's synthesis prompt from DB
  const synthConfig = loadSessionConfig(sessionId);
  const synthPrompt = synthConfig.synthesis_prompt;

  notifyDashboard("synthesis_streaming", { sessionId, text: "" });

  const stream = await openai.chat.completions.create({
    model: SYNTHESIS_MODEL,
    messages: [
      { role: "system", content: synthPrompt },
      {
        role: "user",
        content: `Here are the full interview transcripts from ${participantCount} participants:\n${transcriptsText}`,
      },
    ],
    max_tokens: 16384,
    stream: true,
  });

  let synthesisText = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      synthesisText += delta;
      notifyDashboard("synthesis_chunk", { sessionId, text: synthesisText });
    }
  }

  const jsonMatch = synthesisText.match(/\{[\s\S]*\}/);
  const synthesisJson = jsonMatch ? jsonMatch[0] : synthesisText;

  db.run(
    "INSERT INTO analyses (session_id, analysis_type, data) VALUES (?, 'synthesis', ?)",
    [sessionId, synthesisJson]
  );

  console.log("Synthesis complete");
  notifyDashboard("synthesis_complete", { sessionId });
}

// Get synthesis
app.get("/api/sessions/:sessionId/synthesis", (c) => {
  const sessionId = resolveSessionId(c.req.param("sessionId")) || c.req.param("sessionId");
  const row = db
    .query(
      "SELECT * FROM analyses WHERE session_id = ? AND analysis_type = 'synthesis' ORDER BY created_at DESC LIMIT 1"
    )
    .get(sessionId) as any;

  if (!row) return c.json({ error: "No synthesis available" }, 404);
  return c.json(JSON.parse(row.data));
});

// Get synthesis inputs (for copy-to-clipboard)
app.get("/api/sessions/:sessionId/synthesis-inputs", (c) => {
  const sessionId = resolveSessionId(c.req.param("sessionId")) || c.req.param("sessionId");
  const { text: transcriptsText, count: participantCount } = buildTranscriptsText(sessionId);
  const inputsConfig = loadSessionConfig(sessionId);
  return c.json({
    transcripts: `Interview transcripts from ${participantCount} participants:\n${transcriptsText}`,
    prompt: inputsConfig.synthesis_prompt,
  });
});

// Get all analyses for a session
app.get("/api/sessions/:sessionId/analyses", (c) => {
  const sessionId = resolveSessionId(c.req.param("sessionId")) || c.req.param("sessionId");
  const rows = db
    .query(
      "SELECT a.*, p.name as participant_name, p.archetype FROM analyses a LEFT JOIN participants p ON a.participant_id = p.id WHERE a.session_id = ? ORDER BY a.created_at DESC"
    )
    .all(sessionId);
  return c.json(rows);
});

// Dashboard SSE
app.get("/api/dashboard/events", (c) => {
  return streamSSE(c, async (stream) => {
    const encoder = new TextEncoder();
    let ctrl: ReadableStreamDefaultController | null = null;

    // We'll use a different approach - poll-based with heartbeat
    const interval = setInterval(async () => {
      try {
        await stream.writeSSE({ data: JSON.stringify({ type: "heartbeat" }) });
      } catch {
        clearInterval(interval);
      }
    }, 15000);

    // Register for updates using a simple callback approach
    const messageQueue: string[] = [];
    const originalNotify = notifyDashboard;

    // Add this stream to the broadcast list by creating a wrapper
    const streamController = {
      enqueue: (data: Uint8Array) => {
        const text = new TextDecoder().decode(data);
        messageQueue.push(text);
      },
    } as ReadableStreamDefaultController;

    dashboardClients.add(streamController);

    try {
      while (true) {
        while (messageQueue.length > 0) {
          const msg = messageQueue.shift()!;
          // Parse out event name and data from the raw SSE format
          const eventMatch = msg.match(/event: (.+)\ndata: (.+)\n/);
          if (eventMatch) {
            await stream.writeSSE({
              event: eventMatch[1],
              data: eventMatch[2],
            });
          }
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    } finally {
      clearInterval(interval);
      dashboardClients.delete(streamController);
    }
  });
});

// ─── Background Tasks ───

async function runFullExtraction(participantId: string) {
  try {
    const participant = db
      .query("SELECT * FROM participants WHERE id = ?")
      .get(participantId) as any;

    const messages = db
      .query("SELECT role, content FROM messages WHERE participant_id = ? ORDER BY id")
      .all(participantId) as { role: string; content: string }[];

    const transcript = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    // Load session's extraction prompt from DB
    const extractConfig = loadSessionConfig(participant.session_id);
    const extractPrompt = extractConfig.extraction_prompt;
    const extractArchetype = extractConfig.form_config.archetypes?.find((a: any) => a.key === participant.archetype);
    const extractArchLabel = extractArchetype?.label || participant.archetype;

    const completion = await openai.chat.completions.create({
      model: ANALYSIS_MODEL,
      messages: [
        { role: "system", content: extractPrompt },
        {
          role: "user",
          content: `Participant archetype: ${participant.archetype} (${extractArchLabel})\nOrganization: ${participant.organization || '(not specified)'}\n\nFull transcript:\n\n${transcript}`,
        },
      ],
      max_tokens: 8192,
    });

    const analysisText = completion.choices[0]?.message?.content || "";

    db.run(
      "INSERT INTO analyses (session_id, analysis_type, participant_id, data) VALUES (?, 'per_conversation', ?, ?)",
      [participant.session_id, participantId, analysisText]
    );

    notifyDashboard("analysis_complete", {
      participantId,
      type: "per_conversation",
    });
  } catch (err) {
    console.error("Full extraction error:", err);
  }
}

// ─── Static files via Bun HTML imports ───
import homepage from "../public/index.html";
import dashboard from "../public/dashboard.html";
import sessionInfo from "../public/session-info.html";

// ─── Start ───
const port = parseInt(process.env.PORT || "3000");
console.log(`Server running at http://localhost:${port}`);

export default {
  port,
  idleTimeout: 255,
  routes: {
    "/": homepage,
    "/sessions/*": homepage,
    "/session/*": homepage,
    "/dashboard": dashboard,
    "/dashboard.html": dashboard,
    "/session-info": sessionInfo,
  },
  fetch: app.fetch,
  development: {
    hmr: true,
    console: true,
  },
};
