import { describe, it, expect } from 'vitest';
import {
  createNote, noteTitle, wordCount, searchNotes,
  updateNote, deleteNote, serialize, deserialize
} from './notes';

describe('createNote', () => {
  it('creates a note with unique ids', () => {
    const a = createNote('', 1000);
    const b = createNote('', 1000);
    expect(a.id).not.toBe(b.id);
    expect(a.createdAt).toBe(1000);
  });
});

describe('noteTitle', () => {
  it('uses the first non-empty line and strips markdown', () => {
    expect(noteTitle(createNote('\n# Shopping list\n- milk'))).toBe('Shopping list');
  });
  it('falls back to Untitled note', () => {
    expect(noteTitle(createNote('   \n  '))).toBe('Untitled note');
  });
  it('truncates long titles', () => {
    const long = `## ${'word '.repeat(30)}`;
    expect(noteTitle(createNote(long)).length).toBeLessThanOrEqual(61);
  });
});

describe('wordCount', () => {
  it('counts words and handles blanks', () => {
    expect(wordCount('one two  three')).toBe(3);
    expect(wordCount('   ')).toBe(0);
  });
});

describe('searchNotes', () => {
  const notes = [
    { ...createNote('meeting notes about Apollo', 100), id: 'a', updatedAt: 300 },
    { ...createNote('apollo recipes', 200), id: 'b', updatedAt: 400 },
    { ...createNote('unrelated entry', 300), id: 'c', updatedAt: 500 }
  ];
  it('matches case-insensitively and sorts by updatedAt desc', () => {
    expect(searchNotes(notes, 'APOLLO')).toEqual(['b', 'a']);
  });
  it('empty query returns all, most recent first', () => {
    expect(searchNotes(notes, '')).toEqual(['c', 'b', 'a']);
  });
});

describe('updateNote / deleteNote', () => {
  it('updates content and updatedAt only on the target', () => {
    const a = createNote('a', 1); const b = createNote('b', 2);
    const next = updateNote([a, b], b.id, 'b2', 999);
    expect(next[1].content).toBe('b2');
    expect(next[1].updatedAt).toBe(999);
    expect(next[0].content).toBe('a');
  });
  it('deletes by id', () => {
    const a = createNote('a'); const b = createNote('b');
    expect(deleteNote([a, b], a.id).map((n) => n.id)).toEqual([b.id]);
  });
});

describe('persistence', () => {
  it('round-trips through serialize/deserialize', () => {
    const notes = [createNote('hello', 1)];
    expect(deserialize(serialize(notes))).toEqual(notes);
  });
  it('rejects corrupt and wrong-shaped data', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize('{"version":1}')).toBeNull();
    expect(deserialize(null)).toBeNull();
  });
  it('drops malformed note entries', () => {
    const raw = JSON.stringify({ version: 1, notes: [{ id: 'x', content: 'ok' }, { bad: true }] });
    expect(deserialize(raw).length).toBe(1);
  });
});
