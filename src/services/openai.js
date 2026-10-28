import { supabase } from './supabase';
import { sectionsFromLegacy, totalOf, questionCount, stampMarks } from '../data/paperBlueprint';
import { findLibraryChapter } from '../data/textbooks';
import { withNeededFigures } from '../components/plotMath';
import { questionHasRenderableMath, mcqAnswerMatches } from '../components/examMath';
import { pdfText } from './pdfText';

export const getOpenAIConfig = () => {
  const envKey = import.meta.env.VITE_OPENAI_API_KEY;
  const hasEnv = envKey && envKey !== 'your_openai_api_key' && envKey !== '';
  if (hasEnv) return { key: envKey, isEnv: true };
  const localKey = localStorage.getItem('edu_openai_key');
  return { key: localKey || '', isEnv: false };
};

export const isOpenAIConfigured = () => !!getOpenAIConfig().key || import.meta.env.PROD;

export const updateOpenAIKey = (key) => {
  if (key) localStorage.setItem('edu_openai_key', key.trim());
};

export const clearOpenAIKey = () => {
  localStorage.removeItem('edu_openai_key');
  window.location.reload();
};

const MODEL = 'gpt-6-luna';
const ENDPOINT = 'https://api.openai.com/v1/responses';

// Luna has a 1,050,000-token context. Keep each request well inside it.
const SOURCE_CHARS_PER_BATCH = 200_000;
const MIN_USABLE_CHARS = 300;

const QUESTION_FIELDS = {
  type: { type: 'string', enum: ['mcq', 'short', 'long'] },
  marks: { type: 'integer' },
  question: { type: 'string' },
  options: {
    type: 'array',
    minItems: 4,
    maxItems: 4,
    items: { type: 'string' },
  },
  correctAnswer: { type: 'string' },
  explanation: { type: 'string' },
};

const QUESTION_REQUIRED = ['type', 'marks', 'question', 'options', 'correctAnswer', 'explanation'];

const FIGURE_ITEM = {
  type: 'object',
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['none', 'graph'] },
    xLabel: { type: 'string' },
    yLabel: { type: 'string' },
    xMin: { type: 'number' },
    xMax: { type: 'number' },
    yMin: { type: 'number' },
    yMax: { type: 'number' },
    curves: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          expression: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['expression', 'label'],
      },
    },
    points: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          label: { type: 'string' },
        },
        required: ['x', 'y', 'label'],
      },
    },
    segments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          x1: { type: 'number' },
          y1: { type: 'number' },
          x2: { type: 'number' },
          y2: { type: 'number' },
        },
        required: ['x1', 'y1', 'x2', 'y2'],
      },
    },
  },
  required: ['kind', 'xLabel', 'yLabel', 'xMin', 'xMax', 'yMin', 'yMax', 'curves', 'points', 'segments'],
};

const questionItem = (visual) => ({
  type: 'object',
  additionalProperties: false,
  properties: visual ? { ...QUESTION_FIELDS, figure: FIGURE_ITEM } : QUESTION_FIELDS,
  required: visual ? [...QUESTION_REQUIRED, 'figure'] : QUESTION_REQUIRED,
});

const paperSchema = (count, visual) => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      minItems: count,
      maxItems: count,
      items: questionItem(visual),
    },
  },
  required: ['questions'],
});

export const isVisualSubject = (subject) => /mathematics|physics/i.test(subject || '');

export const isMathematics = (subject) => /math/i.test(subject || '');

const asQuestions = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.questions)) return value.questions;
  return null;
};

const parseQuestions = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return asQuestions(JSON.parse(raw));
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return asQuestions(JSON.parse(raw.slice(start, end + 1)));
    } catch {
      return null;
    }
  }
};

const messageText = (message) => (message?.content || [])
  .filter((part) => part.type === 'output_text' && part.text)
  .map((part) => part.text)
  .join('');

const questionsFromResponse = (data) => {
  const messages = (data.output || []).filter((item) => item.type === 'message');
  const refusal = messages
    .flatMap((message) => message.content || [])
    .find((part) => part.type === 'refusal');
  if (refusal && !messages.some((message) => message.phase === 'final_answer')) {
    throw new Error(refusal.refusal || 'The model declined to write this paper.');
  }

  const ordered = [
    ...messages.filter((message) => message.phase === 'final_answer'),
    ...messages.filter((message) => message.phase !== 'commentary'),
  ];
  for (const message of ordered) {
    const questions = parseQuestions(messageText(message));
    if (questions) return questions;
  }
  const fallback = parseQuestions(data.output_text);
  if (fallback) return fallback;
  if (data.status === 'incomplete') {
    throw new Error('The paper was cut off before every question was written. Try again.');
  }
  throw new Error('Could not parse AI response. Please try again.');
};

const hostedAuth = async () => {
  if (!supabase) return {};
  const first = await supabase.auth.getSession();
  let session = first.data.session;
  const expiresAt = (session?.expires_at || 0) * 1000;
  if (session && expiresAt && expiresAt < Date.now() + 60_000) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session || session;
  }
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
};

const respond = async (key, instructions, prompt, count, temperature, visual) => {
  const hosted = !key;
  const headers = {
    'Content-Type': 'application/json',
    ...(hosted ? await hostedAuth() : { Authorization: `Bearer ${key}` }),
  };
  const res = await fetch(hosted ? '/api/openai' : ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      store: false,
      reasoning: { effort: 'none' },
      temperature,
      max_output_tokens: Math.min(32000, 1200 + count * (visual ? 800 : 400)),
      instructions,
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'exam_paper',
          strict: true,
          schema: paperSchema(count, visual),
        },
      },
    }),
  }).catch(() => {
    throw new Error('Could not reach OpenAI. Check your internet connection and the API key in Settings.');
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(hosted
        ? (data.error?.message || 'OpenAI rejected the server API key. Check OPENAI_API_KEY in the Vercel project settings.')
        : 'OpenAI rejected the API key. Check it in Settings.');
    }
    throw new Error(data.error?.message || `OpenAI request failed (${res.status}).`);
  }
  return questionsFromResponse(data);
};

// Evenly spaced windows keep coverage of the whole chapter when it has to be shortened.
const excerpt = (text, max) => {
  if (text.length <= max) return text;
  const windows = 4;
  const size = Math.floor(max / windows);
  const step = Math.floor((text.length - size) / (windows - 1));
  const parts = [];
  for (let i = 0; i < windows; i += 1) parts.push(text.slice(i * step, i * step + size));
  return parts.join('\n[…]\n');
};

const loadSources = async (className, subject, chapterList) => {
  const sources = new Map();
  for (const name of chapterList) {
    const entry = findLibraryChapter(className, subject, name);
    if (!entry) continue;
    try {
      let text = '';
      if (entry.textLoad) {
        const url = await entry.textLoad();
        const response = await fetch(url);
        text = await response.text();
      } else if (entry.load) {
        const url = await entry.load();
        text = await pdfText(url);
      }
      if (text.length >= MIN_USABLE_CHARS) sources.set(name, text);
    } catch {
      // The paper can still be written from the chapter title.
    }
  }
  return sources;
};

const sourceBlock = (focus, sources) => {
  const withText = focus.filter((name) => sources.has(name));
  if (!withText.length) return '';
  const share = Math.floor(SOURCE_CHARS_PER_BATCH / withText.length);
  return withText
    .map((name) => `=== ${name} ===\n${excerpt(sources.get(name), share)}`)
    .join('\n\n');
};

const TYPE_LINES = {
  mcq: 'Multiple choice — exactly 4 options, one correct answer',
  short: 'Short answer — model answer in 1–3 sentences',
  long: 'Long answer — model answer as a detailed paragraph',
};

// Marks set the level. A 1-mark slot stays a one-step recall item; a 5-mark slot is a full board question.
const levelForMarks = (marks, mathPaper) => {
  const n = Math.max(1, Math.round(Number(marks) || 1));
  if (mathPaper) {
    if (n <= 1) return 'Level easy. One direct step from a standard formula. One result.';
    if (n === 2) return 'Level basic. Apply one formula and show one line of working.';
    if (n === 3) return 'Level medium. Two steps. The student must choose the method.';
    if (n === 4) return 'Level medium. Three steps, or find an unknown from a condition.';
    return `Level hard. A ${n}-mark board problem with about ${Math.max(2, Math.round(n / 2))} steps. Use parts (a) and (b) when the marks are 5 or more.`;
  }
  if (n <= 1) return 'Level easy. Recall one fact, term, or definition. One line is enough to answer.';
  if (n === 2) return 'Level basic. State one point and give one short reason.';
  if (n === 3) return 'Level medium. Explain, compare, or apply one idea in about three clear points.';
  if (n === 4) return 'Level medium. Connect two ideas from the chapter and give the reasons.';
  return `Level hard. A ${n}-mark board answer with depth, causes, and an example. Use parts when the marks are 5 or more.`;
};

const BATCH_SIZE = 12;

const flattenSections = (sections) => {
  const items = [];
  for (const section of sections) {
    for (let i = 0; i < section.count; i += 1) items.push({ type: section.type, marksEach: section.marksEach });
  }
  return items;
};

const chunkSections = (sections, size) => {
  const items = flattenSections(sections);
  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    const grouped = [];
    for (const item of slice) {
      const last = grouped[grouped.length - 1];
      if (last && last.type === item.type && last.marksEach === item.marksEach) last.count += 1;
      else grouped.push({ type: item.type, marksEach: item.marksEach, count: 1 });
    }
    batches.push(grouped);
  }
  return batches;
};

const chaptersForBatch = (chapters, batchIndex, batchCount) => {
  if (!chapters.length || batchCount < 1) return chapters;
  if (chapters.length <= batchCount) return [chapters[batchIndex % chapters.length]];
  const size = Math.ceil(chapters.length / batchCount);
  const slice = chapters.slice(batchIndex * size, (batchIndex + 1) * size);
  return slice.length ? slice : [chapters[chapters.length - 1]];
};

const SYSTEM = 'You are a CBSE exam paper setter. Write original questions from the textbook text. The response schema fixes how many questions you return. Fill every slot. Do not stop early.';

const ANGLES = [
  'definitions and key terms',
  'worked examples and in-text activities',
  'steps of processes and what each step does',
  'differences, comparisons, and classifications',
  'causes, effects, and everyday uses described in the chapter',
  'diagrams, labels, and quantities mentioned in the text',
];

const MATH_ANGLES = [
  'unknown constants fixed by a continuity or boundary condition',
  'a composite, product, or quotient to differentiate and simplify',
  'a short proof of a derivative or an identity from the chapter',
  'a limit, or continuity and differentiability checked at a point',
  'a piecewise function with two or three pieces',
  'an implicitly defined relation, or a function of a function',
];

const stem = (text) => String(text || '')
  .toLowerCase()
  .replace(/[^a-z0-9 ]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 70);

const tooSimilar = (next, prior) => {
  if (!prior.length || !next.length) return false;
  const seen = new Set(prior.map(stem));
  const hits = next.filter((item) => seen.has(stem(item.question))).length;
  return hits >= Math.max(2, Math.ceil(next.length * 0.4));
};

/**
 * Generate a marks-based test for one or more NCERT chapters.
 * `blueprint` is [{ type, marksEach, count }].
 * `chapters` is the selected chapter list. Chapters that match a textbook PDF are sent to the model as source text.
 */
export const generateTest = async (className, subject, chapter, {
  blueprint,
  chapters,
  count = 10,
  types = ['mcq'],
  avoid = [],
} = {}) => {
  const { key } = getOpenAIConfig();
  if (!key && !import.meta.env.PROD) throw new Error('OpenAI API key is not configured. Please add it in Settings.');

  const sections = blueprint?.length ? blueprint : sectionsFromLegacy(count, types);
  const expected = questionCount(sections);
  const batches = chunkSections(sections, BATCH_SIZE);
  const chapterList = (Array.isArray(chapters) && chapters.length
    ? chapters
    : [chapter]
  ).map((name) => String(name || '').trim()).filter(Boolean);

  const sources = await loadSources(className, subject, chapterList);

  const mathPaper = isMathematics(subject);

  const coverage = chapterList.length > expected
    ? `There are more chapters than questions. Cover ${expected} different chapters from the list. Do not add extra questions.`
    : 'Include every listed chapter. Spread the questions across them.';

  const prior = [...new Set((avoid || []).map((text) => String(text || '').trim()).filter(Boolean))];
  const anglePool = mathPaper ? MATH_ANGLES : ANGLES;
  const angle = anglePool[(prior.length + Math.floor(Math.random() * anglePool.length)) % anglePool.length];
  const visual = isVisualSubject(subject);
  const instructions = mathPaper
    ? 'You are a CBSE mathematics paper setter. Every question is a solvable examination problem written with LaTeX, in the style of a printed board paper. The response schema fixes how many questions you return. Fill every slot.'
    : SYSTEM;
  const notation = mathPaper ? `
Mathematics paper:
- Write a problem the student solves. Do not write an English question about a concept.
- Do not ask which statement, description, or option-paragraph is correct. Do not ask the student to explain a definition in words when a calculation is possible.
- Put every expression in LaTeX between dollar signs. Inline: $x^{3}+ax^{2}+bx$. A formula on its own line: $$f(x)=x^{2}$$.
- Never use \\( \\) or \\[ \\]. Never write u0000, a null, or a box where a dollar sign belongs.
- Powers and subscripts stay inside the dollars, written with ^ and _: $x^{3}$, $a_{n}$, $x^{-1}$. Do not leave x^3 in the sentence, and do not use Unicode superscripts.
- Use \\dfrac for a displayed fraction, \\sqrt for roots, and \\sin \\cos \\tan \\lim \\int \\sum where the chapter needs them.
- A piecewise function is a display formula, for example $$f(x)=\\begin{cases} 2x+a & x<1 \\\\ x^{2}+3 & x\\ge 1 \\end{cases}$$
- Derivatives are $\\dfrac{dy}{dx}$ and $\\dfrac{d^{2}y}{dx^{2}}$. Do not write "dy by dx", "x squared", or "sin x" in words.
- Shape, which you must not copy: Differentiate with respect to $x$: $$y=x^{2}+3x$$
- Another shape, which you must not copy: $$\\text{Find }\\dfrac{dy}{dx}\\text{ if }y=\\sin(x^{2}).$$
- When a long question has genuine parts, put (a), (b), and (c) on their own lines. Do not split a one-step question.
- Vary the functions, constants, and what is asked. Every problem must be solvable and unambiguous, and must stay inside the named chapter.
- An MCQ stem is the problem. Each option is a short result in $...$, not a sentence. correctAnswer copies one option exactly.
- correctAnswer and explanation are the worked result in LaTeX. The explanation is the main steps, not a paragraph about the topic.

Figures:
- Every question has a figure object. kind is "none" unless the student must read a picture to answer.
- A formula, identity, derivative, or piecewise function does not get a graph.
- At most one question in this batch may use kind "graph", and only when the question says to read that picture.
- When kind is "none", labels are "", bounds are 0, and curves, points, and segments are empty.
` : visual ? `
Notation:
- Write every mathematical expression in LaTeX between dollar signs. Example: $v = u + at$, $\\frac{1}{2}mv^{2}$.
- Put a display equation on its own line between double dollar signs.
- Powers are $x^{2}$, not x^2 and not a Unicode superscript. Do not use words such as "x squared".

Figures:
- Every question has a figure object. Its kind is "none" unless the student cannot answer without seeing a picture.
- A formula, identity, numerical problem, definition, or derivation gets figure.kind "none". Do not add a graph to illustrate an equation the question already states.
- Use figure.kind "graph" only when the question asks the student to read the picture: a value, intercept, slope, or comparison that the words do not already give. Say so in the question, for example "from the graph below".
- At most one question in this batch may use a graph. Use a second only when this batch is about drawing or reading graphs. Never put a graph on every question or on most questions.
- When kind is "none", labels are "", bounds are 0, curves, points, and segments are empty, and the question must not mention a graph, figure, or diagram.
- A curve expression uses x as the variable, with + - * / ^ and the functions sin, cos, tan, sqrt, abs, pi, log. Examples: "x^2 - 4*x", "sin(x)", "2*x+1". Ray sketches use points and segments.
- Point labels are short plain names such as A or P.

Thinking:
- Ask multi-step and creative questions: compare two cases, find an unknown, or say what changes if a value changes.
- Do not make the whole paper one-line recall, and do not make it a set of graphs.
` : '';

  const slotsOf = (grouped) => {
    const slots = [];
    for (const section of grouped) {
      for (let i = 0; i < section.count; i += 1) slots.push(section);
    }
    return slots;
  };

  const slotReady = (question, slot) => {
    if (!String(question?.question || '').trim()) return false;
    if (slot?.type === 'mcq' && !mcqAnswerMatches(question)) return false;
    if (mathPaper && !questionHasRenderableMath(question)) return false;
    return true;
  };

  const ask = async (slots, blocked, temperature, index, redo = false) => {
    const focus = chaptersForBatch(chapterList, index, batches.length);
    const source = sourceBlock(focus, sources);
    const slotLines = slots.map((slot, slotIndex) => {
      const unit = slot.marksEach === 1 ? 'mark' : 'marks';
      const shape = slot.type === 'mcq'
        ? (mathPaper
          ? 'options has 4 short mathematical results, and correctAnswer equals one of them exactly'
          : 'options has 4 choices, and correctAnswer equals one of them')
        : (mathPaper
          ? 'options is ["", "", "", ""], and correctAnswer is the worked result in LaTeX'
          : 'options is ["", "", "", ""], and correctAnswer is a model answer a teacher could accept');
      const kind = mathPaper
        ? (slot.type === 'mcq'
          ? 'Multiple choice — a solvable problem whose four options are results, not sentences'
          : slot.type === 'long'
            ? 'Long answer — a multi-step problem, with the main equation on its own line'
            : 'Short answer — a calculation or a two-step result')
        : TYPE_LINES[slot.type];
      const level = levelForMarks(slot.marksEach, mathPaper);
      return `${slotIndex + 1}. type "${slot.type}", marks ${slot.marksEach} (${unit}). ${level} ${kind}. ${shape}.`;
    }).join('\n');
    const blockedLines = blocked
      .filter(Boolean)
      .slice(-60)
      .map((text) => `- ${String(text).slice(0, 140)}`)
      .join('\n');
    const grounding = mathPaper
      ? (source
        ? `- Use the methods and results in the textbook text below. Invent new functions, constants, and values. Do not copy an exercise, and do not ask what a sentence in the book says.
- Ignore page headers, footers, reprint notices, and broken characters left over from PDF extraction.`
        : `- Set original problems on the named chapters at this class, using standard board methods.
- Do not invent theorems that this class has not met.`)
      : (source
        ? `- Base every question and answer on the textbook text below. Every question must be answerable from it.
- Use the facts, terms, examples, and activities that appear in the text. Do not bring in facts that are not in it.
- Ignore page headers, footers, reprint notices, and broken characters left over from PDF extraction.`
        : `- Use the concepts, terms, and board-exam points a CBSE teacher expects from those chapter titles at this class.
- Do not invent statistics, dates, page numbers, experiment results, quotations, or named examples. If a specific fact is uncertain, ask about the concept in general terms.`);
    const fresh = mathPaper
      ? `- Build this batch around ${angle}. Change the functions and the constants from any earlier paper.
- A new paper on the same chapters must not reuse a stem, a function, or a set of constants from the already-asked list.`
      : `- Do not copy textbook sentences. Write new questions.
- Build this paper around ${angle}. A new paper on the same chapters must ask about different facts, examples, and activities.
- Give a brief explanation for every question.`;
    const redoLine = redo
      ? '\nThe previous draft was not an examination problem. Rewrite every slot with LaTeX between dollar signs, powers as $x^{2}$, and piecewise functions as $$...\\begin{cases}...\\end{cases}$$. Do not ask which statement is correct.\n'
      : '';

    const prompt = `Task: write exactly ${slots.length} questions. The schema rejects any other count. questions[0] is slot 1, questions[1] is slot 2, and so on. Do not skip a slot.

Class: ${className}
Subject: ${subject}
Chapters:
${chapterList.map((name) => `- ${name}`).join('\n')}
Draw this batch from:
${focus.map((name) => `- ${name}`).join('\n')}
Paper total: ${totalOf(sections)} marks
Batch ${index + 1} of ${batches.length}
Each question's level comes from its marks. A 1-mark question is easy recall or one step. A 3-mark question applies one idea. A 5-mark question is a full board answer. Do not make every question the same difficulty.

Slots, in order:
${slotLines}

Rules:
- Stay inside the listed chapters only.
- Match the working to the marks on that slot. Do not ask a multi-step problem for 1 mark, and do not ask a one-line recall for 5 marks.
${grounding}
- ${coverage}
${fresh}
${notation}${redoLine}${blockedLines ? `\nAlready asked. Do not reuse or rephrase any of these:\n${blockedLines}\n` : ''}${source ? `\nTextbook text:\n\n${source}\n` : ''}`;

    const questions = await respond(key, instructions, prompt, slots.length, temperature, visual);
    return questions.slice(0, slots.length).map((question, slotIndex) => ({
      ...question,
      type: slots[slotIndex].type,
      marks: slots[slotIndex].marksEach,
    }));
  };

  const writePaper = async (blocked, temperature) => {
    const collected = [];

    for (let index = 0; index < batches.length; index += 1) {
      const slots = slotsOf(batches[index]);
      const soFar = [...blocked, ...collected.map((item) => item.question)];
      let got = await ask(slots, soFar, temperature, index);
      const badAt = [];
      got.forEach((question, slotIndex) => {
        if (!slotReady(question, slots[slotIndex])) badAt.push(slotIndex);
      });
      if (badAt.length) {
        const repaired = await ask(
          badAt.map((slotIndex) => slots[slotIndex]),
          [...soFar, ...got.map((item) => item.question)],
          temperature,
          index,
          mathPaper,
        );
        badAt.forEach((slotIndex, repairIndex) => {
          if (repaired[repairIndex] && slotReady(repaired[repairIndex], slots[slotIndex])) {
            got[slotIndex] = repaired[repairIndex];
          }
        });
      }
      if (got.length < slots.length) {
        const rest = await ask(slots.slice(got.length), [...soFar, ...got.map((item) => item.question)], temperature, index);
        got = [...got, ...rest];
      }
      if (got.length < slots.length) {
        throw new Error(`The paper came back short (${collected.length + got.length} of ${expected} questions). Try again.`);
      }
      collected.push(...got.slice(0, slots.length));
    }

    return stampMarks(withNeededFigures(collected), sections);
  };

  const first = await writePaper(prior, prior.length ? 1 : 0.8);
  if (!tooSimilar(first, prior)) return first;
  return writePaper([...prior, ...first.map((item) => item.question)], 1.15);
};
