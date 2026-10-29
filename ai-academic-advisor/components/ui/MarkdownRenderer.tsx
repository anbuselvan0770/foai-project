'use client';

import React, { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// ── Inline parser: handles **bold**, *italic*, `code`, and plain text ──
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Pattern order matters: bold before italic, code first to avoid conflicts
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const [full] = match;
    const start = match.index;

    // Push preceding plain text
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (full.startsWith('`') && full.endsWith('`')) {
      // Inline code
      nodes.push(
        <code key={start} className="md-inline-code">
          {full.slice(1, -1)}
        </code>
      );
    } else if ((full.startsWith('**') && full.endsWith('**')) || (full.startsWith('__') && full.endsWith('__'))) {
      // Bold
      nodes.push(
        <strong key={start} className="md-bold">
          {full.slice(2, -2)}
        </strong>
      );
    } else if ((full.startsWith('*') && full.endsWith('*')) || (full.startsWith('_') && full.endsWith('_'))) {
      // Italic
      nodes.push(
        <em key={start} className="md-italic">
          {full.slice(1, -1)}
        </em>
      );
    } else {
      nodes.push(full);
    }

    lastIndex = start + full.length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

// ── Block types ──
type BlockType =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'h4'; text: string }
  | { kind: 'blockquote'; lines: string[] }
  | { kind: 'code-block'; lang: string; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'hr' }
  | { kind: 'paragraph'; text: string }
  | { kind: 'blank' };

function parseBlocks(raw: string): BlockType[] {
  const lines = raw.split('\n');
  const blocks: BlockType[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ──
    const fenceMatch = line.match(/^```(\w*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      blocks.push({ kind: 'code-block', lang, lines: codeLines });
      continue;
    }

    // ── Heading ──
    const h4 = line.match(/^#### (.+)/);
    if (h4) { blocks.push({ kind: 'h4', text: h4[1] }); i++; continue; }
    const h3 = line.match(/^### (.+)/);
    if (h3) { blocks.push({ kind: 'h3', text: h3[1] }); i++; continue; }
    const h2 = line.match(/^## (.+)/);
    if (h2) { blocks.push({ kind: 'h2', text: h2[1] }); i++; continue; }
    const h1 = line.match(/^# (.+)/);
    if (h1) { blocks.push({ kind: 'h1', text: h1[1] }); i++; continue; }

    // ── Horizontal rule ──
    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }

    // ── Blockquote ──
    if (line.startsWith('> ') || line === '>') {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].replace(/^> ?/, ''));
        i++;
      }
      blocks.push({ kind: 'blockquote', lines: quoteLines });
      continue;
    }

    // ── Unordered list ──
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // ── Ordered list ──
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // ── Blank line ──
    if (line.trim() === '') {
      blocks.push({ kind: 'blank' });
      i++;
      continue;
    }

    // ── Paragraph (possibly multi-line) ──
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4} |> |[-*+] |\d+\. |```|---|___|\*\*\*)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ kind: 'paragraph', text: paraLines.join(' ') });
    }
  }

  return blocks;
}

// ── Render a single block ──
function renderBlock(block: BlockType, index: number): React.ReactNode {
  switch (block.kind) {
    case 'h1':
      return <h1 key={index} className="md-h1">{parseInline(block.text)}</h1>;
    case 'h2':
      return <h2 key={index} className="md-h2">{parseInline(block.text)}</h2>;
    case 'h3':
      return <h3 key={index} className="md-h3">{parseInline(block.text)}</h3>;
    case 'h4':
      return <h4 key={index} className="md-h4">{parseInline(block.text)}</h4>;

    case 'blockquote':
      return (
        <blockquote key={index} className="md-blockquote">
          {block.lines.map((l, li) => (
            <p key={li}>{parseInline(l)}</p>
          ))}
        </blockquote>
      );

    case 'code-block':
      return (
        <div key={index} className="md-code-block-wrapper">
          {block.lang && <span className="md-code-lang">{block.lang}</span>}
          <pre className="md-pre">
            <code className="md-code-block">{block.lines.join('\n')}</code>
          </pre>
        </div>
      );

    case 'ul':
      return (
        <ul key={index} className="md-ul">
          {block.items.map((item, ii) => (
            <li key={ii} className="md-li">{parseInline(item)}</li>
          ))}
        </ul>
      );

    case 'ol':
      return (
        <ol key={index} className="md-ol">
          {block.items.map((item, ii) => (
            <li key={ii} className="md-li">{parseInline(item)}</li>
          ))}
        </ol>
      );

    case 'hr':
      return <hr key={index} className="md-hr" />;

    case 'paragraph':
      return <p key={index} className="md-p">{parseInline(block.text)}</p>;

    case 'blank':
      return null;

    default:
      return null;
  }
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={`markdown-renderer chat-message-assistant ${className}`}>
      {blocks.map((block, i) => renderBlock(block, i))}

      <style jsx>{`
        .markdown-renderer {
          font-size: 14.5px;
          line-height: 1.75;
          color: var(--text-primary, #e2e8f0);
          word-break: break-word;
        }

        /* ── Headings ── */
        .markdown-renderer :global(.md-h1) {
          font-size: 1.5em;
          font-weight: 700;
          color: #f1f5f9;
          margin: 1.1em 0 0.5em;
          padding-bottom: 0.3em;
          border-bottom: 1px solid rgba(99, 102, 241, 0.3);
        }
        .markdown-renderer :global(.md-h2) {
          font-size: 1.25em;
          font-weight: 700;
          color: #f1f5f9;
          margin: 1em 0 0.4em;
          padding-bottom: 0.25em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .markdown-renderer :global(.md-h3) {
          font-size: 1.1em;
          font-weight: 600;
          color: #cbd5e1;
          margin: 0.9em 0 0.35em;
        }
        .markdown-renderer :global(.md-h4) {
          font-size: 1em;
          font-weight: 600;
          color: #94a3b8;
          margin: 0.8em 0 0.3em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.85em;
        }

        /* ── Paragraph ── */
        .markdown-renderer :global(.md-p) {
          margin: 0.55em 0;
        }
        .markdown-renderer :global(.md-p):first-child {
          margin-top: 0;
        }
        .markdown-renderer :global(.md-p):last-child {
          margin-bottom: 0;
        }

        /* ── Bold / Italic ── */
        .markdown-renderer :global(.md-bold) {
          font-weight: 700;
          color: #f1f5f9;
        }
        .markdown-renderer :global(.md-italic) {
          font-style: italic;
          color: #cbd5e1;
        }

        /* ── Inline code ── */
        .markdown-renderer :global(.md-inline-code) {
          font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
          font-size: 0.875em;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 4px;
          padding: 1px 6px;
          color: #a5b4fc;
        }

        /* ── Code block ── */
        .markdown-renderer :global(.md-code-block-wrapper) {
          position: relative;
          margin: 1em 0;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #0d1117;
        }
        .markdown-renderer :global(.md-code-lang) {
          display: block;
          padding: 6px 14px;
          font-size: 11px;
          font-family: 'Fira Code', monospace;
          color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-weight: 600;
        }
        .markdown-renderer :global(.md-pre) {
          margin: 0;
          padding: 16px;
          overflow-x: auto;
        }
        .markdown-renderer :global(.md-code-block) {
          font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: #e2e8f0;
          white-space: pre;
        }

        /* ── Lists ── */
        .markdown-renderer :global(.md-ul),
        .markdown-renderer :global(.md-ol) {
          margin: 0.6em 0;
          padding-left: 1.5em;
        }
        .markdown-renderer :global(.md-ul) {
          list-style: none;
          padding-left: 1em;
        }
        .markdown-renderer :global(.md-li) {
          margin: 0.25em 0;
          color: #cbd5e1;
        }
        .markdown-renderer :global(.md-ul .md-li)::before {
          content: '▸';
          color: #6366f1;
          font-size: 0.75em;
          margin-right: 8px;
          vertical-align: middle;
        }
        .markdown-renderer :global(.md-ol) {
          list-style: decimal;
        }
        .markdown-renderer :global(.md-ol .md-li) {
          padding-left: 4px;
        }
        .markdown-renderer :global(.md-ol .md-li)::marker {
          color: #6366f1;
          font-weight: 600;
        }

        /* ── Blockquote ── */
        .markdown-renderer :global(.md-blockquote) {
          margin: 0.8em 0;
          padding: 10px 16px;
          border-left: 3px solid #6366f1;
          background: rgba(99, 102, 241, 0.07);
          border-radius: 0 8px 8px 0;
          color: #94a3b8;
          font-style: italic;
        }
        .markdown-renderer :global(.md-blockquote p) {
          margin: 0;
        }

        /* ── Horizontal rule ── */
        .markdown-renderer :global(.md-hr) {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 1.2em 0;
        }
      `}</style>
    </div>
  );
}
