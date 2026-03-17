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
          <dl className="inspector-meta">
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
        content: <pre className="inspector-pre">{session.system_prompt || ''}</pre>,
      },
      {
        id: 'form-config',
        title: 'Form Config',
        content: <pre className="inspector-pre">{parseFormConfig(session.form_config)}</pre>,
      },
      {
        id: 'extraction-prompt',
        title: 'Extraction Prompt',
        content: <pre className="inspector-pre">{session.extraction_prompt || ''}</pre>,
      },
      {
        id: 'synthesis-prompt',
        title: 'Synthesis Prompt',
        content: <pre className="inspector-pre">{session.synthesis_prompt || ''}</pre>,
      },
    ];
  }, [session]);

  return (
    <>
      {loading && (
        <div className="inspector-state">
          <div className="inspector-state-card">Loading session details...</div>
        </div>
      )}
      {!loading && error && (
        <div className="inspector-state">
          <div className="inspector-state-card">{error}</div>
        </div>
      )}
      {!loading && !error && session && (
        <div className="inspector-page">
          <header className="inspector-header">
            <div>
              <h1>Session Inspector</h1>
              <p className="inspector-subtitle">{session.name}</p>
            </div>
            <button className="btn btn-outline" onClick={() => window.close()}>Close Tab</button>
          </header>
          <div className="inspector-layout">
            <aside className="inspector-nav">
              <div className="inspector-nav-label">Jump To</div>
              <ul>
                {sections.map(section => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </ul>
            </aside>
            <main className="inspector-main">
              {sections.map(section => (
                <section key={section.id} className="inspector-section" id={section.id}>
                  <div className="inspector-section-header">{section.title}</div>
                  <div className="inspector-section-body">{section.content}</div>
                </section>
              ))}
            </main>
          </div>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
