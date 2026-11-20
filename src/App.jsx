import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createNote, noteTitle, wordCount, searchNotes,
  updateNote, deleteNote, serialize, deserialize, STORAGE_KEY
} from './lib/notes';
import { renderMarkdown, excerpt } from './lib/markdown';

const THEME_KEY = 'inkwell-theme';
const MODES = ['edit', 'split', 'preview'];

const WELCOME = `# Welcome to Inkwell

Inkwell keeps markdown notes entirely in your browser - no account, no server, nothing leaves this page.

## Try it out

- **Write** in markdown on the left, see it rendered on the right
- Create a note with the *New note* button or **Ctrl/Cmd + N**
- Switch editor modes with **Ctrl/Cmd + E**
- Export the current note with **Ctrl/Cmd + S**
- Everything is saved automatically as you type

## Markdown works as you expect

> Blockquotes, \`inline code\`, and the rest of GitHub-flavored markdown.

\`\`\`
fences work too
\`\`\`

| Feature | Status |
|---|---|
| Auto-save | on |
| Search | on |
| Export | .md file |

Delete this note whenever you are ready to start your own.`;

function loadInitialNotes() {
  const stored = deserialize(localStorage.getItem(STORAGE_KEY));
  if (stored) return stored;
  return [createNote(WELCOME)];
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function App() {
  const [notes, setNotes] = useState(loadInitialNotes);
  const [activeId, setActiveId] = useState(() => notes[0]?.id);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('split');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const editorRef = useRef(null);

  const active = notes.find((n) => n.id === activeId) || notes[0] || null;
  const visibleIds = useMemo(() => searchNotes(notes, query), [notes, query]);
  const visible = visibleIds.map((id) => notes.find((n) => n.id === id)).filter(Boolean);

  // Persist, debounced.
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(STORAGE_KEY, serialize(notes)), 300);
    return () => clearTimeout(t);
  }, [notes]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const newNote = () => {
    const note = createNote('# ');
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    setMode('edit');
    setTimeout(() => editorRef.current?.focus(), 50);
  };

  const removeNote = (id) => {
    setNotes((prev) => {
      const next = deleteNote(prev, id);
      if (id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const exportNote = () => {
    if (!active) return;
    const blob = new Blob([active.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteTitle(active).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedFlash(true);
    setTimeout(() => setCopiedFlash(false), 1500);
  };

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'n') { e.preventDefault(); newNote(); }
      if (k === 'e') { e.preventDefault(); setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length]); }
      if (k === 's') { e.preventDefault(); exportNote(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="brand">
          <span className="brand-mark">I</span>
          <span className="brand-name">Inkwell</span>
          <button className="icon-btn theme-toggle" title="Toggle theme"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
            {theme === 'light' ? '◐' : '◑'}
          </button>
        </div>
        <button className="new-note" onClick={newNote}>+ New note</button>
        <input
          className="search"
          type="search"
          placeholder="Search notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <nav className="note-list">
          {visible.map((n) => (
            <button
              key={n.id}
              className={`note-item ${n.id === active?.id ? 'active' : ''}`}
              onClick={() => setActiveId(n.id)}
            >
              <span className="note-title">{noteTitle(n)}</span>
              <span className="note-excerpt">{excerpt(n.content, 60) || 'No content yet'}</span>
              <span className="note-date">{formatDate(n.updatedAt)}</span>
            </button>
          ))}
          {visible.length === 0 && <p className="empty">No notes match “{query}”.</p>}
        </nav>
      </aside>

      <main className="workspace">
        <header className="toolbar">
          <button className="icon-btn sidebar-toggle" title="Toggle sidebar"
            onClick={() => setSidebarOpen((s) => !s)}>☰</button>
          <div className="mode-switch">
            {MODES.map((m) => (
              <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <div className="toolbar-actions">
            <span className="wordcount">{active ? wordCount(active.content) : 0} words</span>
            <button className="icon-btn" title="Export as .md (Ctrl/Cmd+S)" onClick={exportNote}>
              {copiedFlash ? 'Saved' : '↓ .md'}
            </button>
            {active && (
              <button className="icon-btn danger" title="Delete note"
                onClick={() => removeNote(active.id)}>✕</button>
            )}
          </div>
        </header>

        {active ? (
          <div className={`panes mode-${mode}`}>
            {mode !== 'preview' && (
              <textarea
                ref={editorRef}
                className="editor"
                value={active.content}
                placeholder="Start writing in markdown…"
                onChange={(e) => setNotes((prev) => updateNote(prev, active.id, e.target.value))}
              />
            )}
            {mode !== 'edit' && (
              <article
                className="preview"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(active.content) }}
              />
            )}
          </div>
        ) : (
          <div className="blank">
            <p>No notes yet.</p>
            <button className="new-note" onClick={newNote}>Write your first note</button>
          </div>
        )}
      </main>

      <footer className="credit">A project by Sandeep Sagar</footer>
    </div>
  );
}
