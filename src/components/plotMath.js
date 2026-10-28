const FUNCS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: Math.log10,
};

// Compiles a school-math expression in x. Returns a function, or null if the expression is not allowed.
export function compileExpression(source) {
  const s = String(source || '').replace(/\s+/g, '');
  if (!s || s.length > 200) return null;
  let i = 0;
  const peek = () => s[i];
  const eat = (char) => {
    if (s[i] !== char) return false;
    i += 1;
    return true;
  };

  const parseExpr = () => {
    let node = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = s[i];
      i += 1;
      const right = parseTerm();
      const left = node;
      node = (x) => (op === '+' ? left(x) + right(x) : left(x) - right(x));
    }
    return node;
  };

  const parseTerm = () => {
    let node = parseUnary();
    while (peek() === '*' || peek() === '/') {
      const op = s[i];
      i += 1;
      const right = parseUnary();
      const left = node;
      node = (x) => (op === '*' ? left(x) * right(x) : left(x) / right(x));
    }
    return node;
  };

  const parseUnary = () => {
    if (eat('-')) {
      const inner = parseUnary();
      return (x) => -inner(x);
    }
    if (eat('+')) return parseUnary();
    return parsePower();
  };

  const parsePower = () => {
    const base = parsePrimary();
    if (!eat('^')) return base;
    const exponent = parseUnary();
    return (x) => base(x) ** exponent(x);
  };

  const parsePrimary = () => {
    if (eat('(')) {
      const inner = parseExpr();
      if (!eat(')')) throw new Error('paren');
      return inner;
    }
    if (/[a-z]/i.test(peek() || '')) {
      let name = '';
      while (/[a-z]/i.test(peek() || '')) {
        name += s[i];
        i += 1;
      }
      if (name === 'x' || name === 't') return (x) => x;
      if (name === 'pi') return () => Math.PI;
      if (name === 'e') return () => Math.E;
      const fn = FUNCS[name];
      if (!fn || !eat('(')) throw new Error('name');
      const arg = parseExpr();
      if (!eat(')')) throw new Error('paren');
      return (x) => fn(arg(x));
    }
    let num = '';
    while (/[0-9.]/.test(peek() || '')) {
      num += s[i];
      i += 1;
    }
    const value = Number(num);
    if (!num || !Number.isFinite(value)) throw new Error('num');
    return () => value;
  };

  try {
    const fn = parseExpr();
    if (i !== s.length) return null;
    return fn;
  } catch {
    return null;
  }
}

// Splits a curve into polylines so an asymptote is not drawn as one long stroke.
export function sampleCurve(fn, xMin, xMax, yMin, yMax, steps = 96) {
  const span = Math.max(yMax - yMin, 1e-6);
  const paths = [];
  let current = [];
  let previous = null;

  const flush = () => {
    if (current.length > 1) paths.push(current);
    current = [];
  };

  for (let step = 0; step <= steps; step += 1) {
    const x = xMin + ((xMax - xMin) * step) / steps;
    const y = fn(x);
    const finite = Number.isFinite(y);
    const outside = finite && (y < yMin - span || y > yMax + span);
    const jump = finite && previous != null && Math.abs(y - previous) > span * 1.5;
    if (!finite || outside || jump) {
      flush();
      previous = finite && !outside ? y : null;
      if (finite && !outside && !jump) current.push([x, y]);
      continue;
    }
    current.push([x, y]);
    previous = y;
  }
  flush();
  return paths;
}

export function usableFigure(figure) {
  if (!figure || figure.kind !== 'graph') return null;
  const xMin = Number(figure.xMin);
  const xMax = Number(figure.xMax);
  const yMin = Number(figure.yMin);
  const yMax = Number(figure.yMax);
  if (![xMin, xMax, yMin, yMax].every(Number.isFinite)) return null;
  if (xMax <= xMin || yMax <= yMin) return null;

  const curves = (figure.curves || [])
    .map((curve) => ({
      expression: String(curve?.expression || '').trim(),
      label: String(curve?.label || '').trim(),
      fn: compileExpression(curve?.expression),
    }))
    .filter((curve) => curve.fn);

  const points = (figure.points || [])
    .map((point) => ({
      x: Number(point?.x),
      y: Number(point?.y),
      label: String(point?.label || '').replace(/\\\(|\\\)|\\\[|\\\]/g, '').trim(),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  const segments = (figure.segments || [])
    .map((segment) => ({
      x1: Number(segment?.x1),
      y1: Number(segment?.y1),
      x2: Number(segment?.x2),
      y2: Number(segment?.y2),
    }))
    .filter((segment) => [segment.x1, segment.y1, segment.x2, segment.y2].every(Number.isFinite));

  if (!curves.length && !points.length && !segments.length) return null;
  return {
    xLabel: String(figure.xLabel || '').trim(),
    yLabel: String(figure.yLabel || '').trim(),
    xMin,
    xMax,
    yMin,
    yMax,
    curves,
    points,
    segments,
  };
}

// A graph stays only when the question tells the student to use the picture.
const NEEDS_GRAPH = /\b(?:from|using|in|on|see|read|interpret|study)\s+(?:the\s+)?(?:given\s+|following\s+)?(?:graph|diagram|figure|plot)\b|\b(?:graph|diagram|figure|plot)\s+(?:below|above|shown)\b|\b(?:shown|given)\s+in\s+the\s+(?:graph|diagram|figure|plot)\b/i;

export function questionNeedsGraph(question) {
  return NEEDS_GRAPH.test(String(question?.question || ''));
}

const blankFigure = () => ({
  kind: 'none',
  xLabel: '',
  yLabel: '',
  xMin: 0,
  xMax: 0,
  yMin: 0,
  yMax: 0,
  curves: [],
  points: [],
  segments: [],
});

export function withNeededFigures(questions) {
  const cap = questions.length >= 8 ? 2 : 1;
  let kept = 0;
  return questions.map((question) => {
    if (!question?.figure || question.figure.kind !== 'graph') return question;
    if (!questionNeedsGraph(question) || kept >= cap) {
      return { ...question, figure: blankFigure() };
    }
    kept += 1;
    return question;
  });
}
