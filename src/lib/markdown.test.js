import { describe, it, expect } from 'vitest';
import { renderMarkdown, excerpt } from './markdown';

describe('renderMarkdown', () => {
  it('renders headings, bold, lists and code', () => {
    const html = renderMarkdown('# Title\n\nSome **bold** text\n\n- one\n- two\n\n`code`');
    expect(html).toContain('<h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<code>code</code>');
  });

  it('renders GFM tables and strikethrough', () => {
    const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\n\n~~gone~~');
    expect(html).toContain('<table>');
    expect(html).toContain('<del>gone</del>');
  });

  it('strips scripts and inline handlers', () => {
    const html = renderMarkdown('safe\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onerror');
  });

  it('neutralizes javascript: links', () => {
    const html = renderMarkdown('[x](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });
});

describe('excerpt', () => {
  it('strips markdown syntax and truncates', () => {
    const out = excerpt(`# Big title\n\n${'text '.repeat(50)}`);
    expect(out.startsWith('Big title')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(81);
  });
});
