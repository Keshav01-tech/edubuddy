import katex from 'katex';
import 'katex/dist/katex.min.css';
import { splitMath } from './mathSplit';

function MathSpan({ tex, display }) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    trust: false,
    displayMode: display,
  });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function MathLine({ text }) {
  const parts = splitMath(text);
  if (!parts.length) return null;
  const display = parts.some((part) => part.display);
  const Tag = display ? 'div' : 'span';
  return (
    <Tag className={`math-text${display ? ' math-display' : ''}`}>
      {parts.map((part, index) => (
        part.tex != null
          ? <MathSpan key={index} tex={part.tex} display={part.display} />
          : <span key={index}>{part.text}</span>
      ))}
    </Tag>
  );
}

export function MathText({ text }) {
  const lines = String(text || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  if (lines.length === 1) return <MathLine text={lines[0]} />;
  return (
    <div className="math-stack">
      {lines.map((line, index) => <MathLine key={index} text={line} />)}
    </div>
  );
}
