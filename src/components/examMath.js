import katex from 'katex';
import { splitMath, sourceIsBroken } from './mathSplit.js';

function renders(part) {
  try {
    katex.renderToString(part.tex, {
      throwOnError: true,
      trust: false,
      displayMode: !!part.display,
    });
    return true;
  } catch {
    return false;
  }
}

function texParts(source) {
  return splitMath(source).filter((part) => part.tex);
}

// A mathematics question is usable when the stem contains LaTeX KaTeX can draw,
// and every other expression on the question also draws.
export function questionHasRenderableMath(question) {
  const fields = [question?.question, question?.correctAnswer, question?.explanation, ...(question?.options || [])];
  if (fields.some((field) => sourceIsBroken(field))) return false;
  const stem = texParts(question?.question);
  if (!stem.length || !stem.every(renders)) return false;
  const rest = [
    ...(question?.options || []),
    question?.correctAnswer,
  ];
  return rest.every((source) => {
    const text = String(source || '').trim();
    if (!text) return true;
    return texParts(text).every(renders);
  });
}

export function mcqAnswerMatches(question) {
  const options = (question?.options || []).map((option) => String(option || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (options.length < 4) return false;
  const answer = String(question?.correctAnswer || '').replace(/\s+/g, ' ').trim();
  return options.includes(answer);
}
