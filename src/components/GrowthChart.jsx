import React, { useEffect, useId, useRef, useState } from 'react';

// The axis has four steps, so its top is rounded up to a number a quarter of which is tidy.
function niceMax(max, integer) {
  if (max <= 0) return integer ? 4 : 1;
  if (integer) return Math.max(4, Math.ceil(max / 4) * 4);
  const pow = 10 ** Math.floor(Math.log10(max));
  return [1, 1.2, 1.6, 2, 2.4, 3.2, 4, 6, 8, 10].find((m) => max <= m * pow) * pow;
}

/**
 * A line chart for a single series over time.
 * data: [{ label: 'Jan', title: 'January 2026', value: 1200 }]
 * format: turns a value into the text shown on the axis and in the tooltip.
 */
export default function GrowthChart({ data, color = '#005a9c', format = (v) => String(v), height = 210, ariaLabel = 'Growth chart', partialLast = false, integer = false }) {
  const gradientId = useId();
  const boxRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [width, setWidth] = useState(360);

  // Draw at the real pixel width so axis text stays a readable size on any screen.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(Math.max(260, Math.round(el.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const W = width;
  const H = height;
  const pad = { l: 46, r: 14, t: 14, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const top = niceMax(Math.max(0, ...data.map((d) => d.value)), integer);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f);
  const x = (i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => pad.t + ih - (v / top) * ih;

  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const trace = (list) => list.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  // A month that is still running looks like a drop, so its segment is drawn dashed.
  const dashLast = partialLast && pts.length > 2;
  const line = trace(dashLast ? pts.slice(0, -1) : pts);
  const tail = dashLast ? trace(pts.slice(-2)) : '';
  const fullLine = trace(pts);
  const area = pts.length ? `${fullLine} L${pts[pts.length - 1][0].toFixed(1)},${pad.t + ih} L${pts[0][0].toFixed(1)},${pad.t + ih} Z` : '';

  const pick = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    let best = 0;
    pts.forEach(([cx], i) => { if (Math.abs(cx - px) < Math.abs(pts[best][0] - px)) best = i; });
    setHover(best);
  };

  const active = hover != null ? data[hover] : null;
  const labelEvery = data.length > 8 && W < 520 ? 2 : 1;

  return (
    <div className="relative" ref={boxRef}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block max-w-full touch-pan-y"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.18" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#ececec" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10.5" fill="#8a8a8a">{format(t)}</text>
          </g>
        ))}

        {area && <path d={area} fill={`url(#${gradientId})`} />}
        {line && <path d={line} fill="none" stroke={color} strokeWidth="2.75" strokeLinejoin="round" strokeLinecap="round" />}
        {tail && <path d={tail} fill="none" stroke={color} strokeWidth="2.75" strokeLinecap="round" strokeDasharray="2 6" />}

        {hover != null && (
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={pad.t} y2={pad.t + ih} stroke={color} strokeOpacity="0.35" strokeDasharray="4 4" />
        )}

        {data.map((d, i) => (
          <g key={d.title || d.label}>
            <circle cx={pts[i][0]} cy={pts[i][1]} r={hover === i ? 6 : i === data.length - 1 ? 4.5 : 3} fill="#fff" stroke={color} strokeWidth="2.25" />
            {(i % labelEvery === (data.length - 1) % labelEvery) && (
              <text x={pts[i][0]} y={H - 8} textAnchor="middle" fontSize="10.5" fill={hover === i ? '#262626' : '#8a8a8a'} fontWeight={hover === i ? 600 : 400}>{d.label}</text>
            )}
          </g>
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-xl bg-neutral-900 px-3 py-1.5 text-center text-white shadow-lg"
          style={{ left: Math.min(Math.max(pts[hover][0], 44), W - 44), top: 0 }}
        >
          <p className="text-[11px] text-white/60">{active.title || active.label}</p>
          <p className="text-sm font-semibold tabular-nums">{format(active.value)}</p>
        </div>
      )}
    </div>
  );
}
