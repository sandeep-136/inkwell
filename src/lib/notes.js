// Pure note-store logic. The React layer keeps the state and syncs it to
// localStorage; everything here is a pure function for easy testing.

export function createNote(content = '', now = Date.now(), id = undefined) {
  return {
    id: id ?? `note-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    content,
    createdAt: now,
    updatedAt: now
  };
}

export function noteTitle(note) {
  const firstLine = note.content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return 'Untitled note';
  const cleaned = firstLine.replace(/^#+\s*/, '').replace(/[*_`>]/g, '').trim();
  return cleaned.length > 60 ? `${cleaned.slice(0, 60)}…` : cleaned || 'Untitled note';
}

export function wordCount(text) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// Case-insensitive search over note content. Returns matching ids, most
// recently updated first.
export function searchNotes(notes, query) {
  const q = query.trim().toLowerCase();
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  if (!q) return sorted.map((n) => n.id);
  return sorted.filter((n) => n.content.toLowerCase().includes(q)).map((n) => n.id);
}

export function updateNote(notes, id, content, now = Date.now()) {
  return notes.map((n) => (n.id === id ? { ...n, content, updatedAt: now } : n));
}

export function deleteNote(notes, id) {
  return notes.filter((n) => n.id !== id);
}

// --- persistence ---
export const STORAGE_KEY = 'inkwell-notes-v1';

export function serialize(notes) {
  return JSON.stringify({ version: 1, notes });
}

export function deserialize(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.notes)) return null;
    const notes = data.notes.filter(
      (n) => n && typeof n.id === 'string' && typeof n.content === 'string'
    );
    return notes.length ? notes : null;
  } catch {
    return null;
  }
}
