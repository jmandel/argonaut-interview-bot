import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';

const API = '';

type SessionRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  system_prompt?: string;
  form_config?: string | Record<string, unknown>;
  extraction_prompt?: string;
  synthesis_prompt?: string;
};

function parseFormConfig(value: SessionRecord['form_config']): string {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function useSessionRecord() {
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('session');
    if (!id) {
      setError('Missing session id');
      setLoading(false);
      return;
    }

    fetch(`${API}/api/sessions/${id}`)
      .then(r => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSession(data);
      })
      .catch((err: any) => setError(err.message || 'Failed to load session'))
      .finally(() => setLoading(false));
  }, []);

  return { session, error, loading };
}

function App() {
  const { session, error, loading } = useSessionRecord();

  const sections = useMemo(() => {
    if (!session) return [];
    return [
      {
        id: 'metadata',
        title: 'Metadata',
        content: (
          <dl className="meta-grid">
            <div><dt>ID</dt><dd>{session.id}</dd></div>
            <div><dt>Name</dt><dd>{session.name}</dd></div>
            <div><dt>Slug</dt><dd>{session.slug}</dd></div>
            <div><dt>Status</dt><dd>{session.status}</dd></div>
            <div><dt>Created</dt><dd>{session.created_at}</dd></div>
          </dl>
        ),
      },
      {
        id: 'system-prompt',
        title: 'System Prompt',
        content: <pre>{session.system_prompt || ''}</pre>,
      },
      {
        id: 'form-config',
        title: 'Form Config',
        content: <pre>{parseFormConfig(session.form_config)}</pre>,
      },
      {
        id: 'extraction-prompt',
        title: 'Extraction Prompt',
        content: <pre>{session.extraction_prompt || ''}</pre>,
      },
      {
        id: 'synthesis-prompt',
        title: 'Synthesis Prompt',
        content: <pre>{session.synthesis_prompt || ''}</pre>,
      },
    ];
  }, [session]);

  return (
    <>
      <style>{`
        :root {
          color-scheme: light;
          --bg: #f5f1e8;
          --paper: rgba(255, 252, 247, 0.94);
          --panel: #1f2937;
          --text: #1e293b;
          --muted: #5b6472;
          --line: rgba(30, 41, 59, 0.12);
          --accent: #bb3e03;
          --accent-soft: rgba(187, 62, 3, 0.08);
          --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          color: var(--text);
          background:
            radial-gradient(circle at top left, rgba(187, 62, 3, 0.18), transparent 26rem),
            linear-gradient(180deg, #f8f4eb 0%, #f1eadc 100%);
        }

        .layout {
          display: grid;
          grid-template-columns: 18rem minmax(0, 1fr);
          gap: 2rem;
          max-width: 96rem;
          margin: 0 auto;
          padding: 2rem;
        }

        .nav {
          position: sticky;
          top: 1.25rem;
          align-self: start;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 1rem;
          box-shadow: var(--shadow);
          padding: 1.25rem;
          backdrop-filter: blur(10px);
        }

        .eyebrow {
          margin: 0 0 0.4rem;
          font: 700 0.72rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
        }

        h1 {
          margin: 0 0 1rem;
          font-size: 1.5rem;
          line-height: 1.1;
        }

        .session-name {
          margin: 0 0 1rem;
          color: var(--muted);
          font-size: 0.98rem;
        }

        .nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 0.55rem;
        }

        .nav a {
          display: block;
          text-decoration: none;
          color: var(--text);
          padding: 0.65rem 0.8rem;
          border-radius: 0.75rem;
          background: transparent;
          border: 1px solid transparent;
        }

        .nav a:hover {
          background: var(--accent-soft);
          border-color: rgba(187, 62, 3, 0.18);
        }

        main {
          min-width: 0;
          display: grid;
          gap: 1.25rem;
        }

        .section {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 1.15rem;
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .section-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--line);
          background: linear-gradient(180deg, rgba(255,255,255,0.52), rgba(255,255,255,0.18));
        }

        .section-header h2 {
          margin: 0;
          font-size: 1.1rem;
        }

        .section-body {
          padding: 1.25rem;
        }

        .meta-grid {
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
          gap: 1rem;
        }

        .meta-grid div {
          padding: 0.9rem 1rem;
          border: 1px solid var(--line);
          border-radius: 0.85rem;
          background: rgba(255,255,255,0.45);
        }

        dt {
          font: 700 0.72rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 0.4rem;
        }

        dd {
          margin: 0;
          word-break: break-word;
        }

        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font: 0.92rem/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
          color: #e5eef7;
          background: var(--panel);
          border-radius: 0.95rem;
          padding: 1rem;
          overflow: auto;
        }

        .state {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 2rem;
          font-size: 1.05rem;
        }

        .state-card {
          max-width: 40rem;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 1rem;
          box-shadow: var(--shadow);
          padding: 1.25rem 1.5rem;
        }

        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
            padding: 1rem;
          }

          .nav {
            position: static;
          }
        }
      `}</style>
      {loading && (
        <div className="state">
          <div className="state-card">Loading session details...</div>
        </div>
      )}
      {!loading && error && (
        <div className="state">
          <div className="state-card">{error}</div>
        </div>
      )}
      {!loading && !error && session && (
        <div className="layout">
          <aside className="nav">
            <p className="eyebrow">Session Inspector</p>
            <h1>Project Spec</h1>
            <p className="session-name">{session.name}</p>
            <ul>
              {sections.map(section => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </aside>
          <main>
            {sections.map(section => (
              <section key={section.id} className="section" id={section.id}>
                <div className="section-header">
                  <h2>{section.title}</h2>
                </div>
                <div className="section-body">{section.content}</div>
              </section>
            ))}
          </main>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
