import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

// Render markdown to HTML and strip anything that could run script. Notes are
// local-only, but exported/shared HTML should still be safe to open anywhere.
export function renderMarkdown(source) {
  const raw = marked.parse(source || '', { async: false });
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/href="javascript:[^"]*"/gi, 'href="#"');
}

export function excerpt(text, length = 80) {
  const plain = text
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`>\-[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}
