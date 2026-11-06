import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

/* Shared building blocks for the logged-in app: one look for headers, stat cards, panels and charts.
   Charts are plain SVG so they print, scale and need no extra dependency. */

export const TONES = {
  brand: { solid: '#0a0a0a', soft: 'bg-neutral-100', text: 'text-neutral-900', ring: 'ring-neutral-200', icon: 'bg-neutral-950 text-white' },
  emerald: { solid: '#0a0a0a', soft: 'bg-neutral-100', text: 'text-neutral-900', ring: 'ring-neutral-200', icon: 'bg-neutral-950 text-white' },
  amber: { solid: '#0a0a0a', soft: 'bg-neutral-100', text: 'text-neutral-900', ring: 'ring-neutral-200', icon: 'bg-neutral-950 text-white' },
  rose: { solid: '#0a0a0a', soft: 'bg-neutral-100', text: 'text-neutral-900', ring: 'ring-neutral-200', icon: 'bg-neutral-950 text-white' },
  sky: { solid: '#0a0a0a', soft: 'bg-neutral-100', text: 'text-neutral-900', ring: 'ring-neutral-200', icon: 'bg-neutral-950 text-white' },
  slate: { solid: '#a3a3a3', soft: 'bg-neutral-100', text: 'text-neutral-600', ring: 'ring-neutral-200', icon: 'bg-neutral-950 text-white' },
};

/** Page title row: optional icon + eyebrow, title, one-line explanation, and actions on the right. */
export function PageHeader({ icon: Icon, eyebrow, title, subtitle, actions, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex items-start gap-3.5">
        {Icon && (
          <span className="hidden sm:grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white ring-1 ring-neutral-200 shadow-card text-brand-600">
            <Icon className="h-5.5 w-5.5" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600 mb-1">{eyebrow}</p>}
          <h1 className="text-2xl sm:text-[1.7rem] font-extrabold tracking-tight text-neutral-900 leading-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-500 max-w-2xl">{subtitle}</p>}
          {children}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White card with an optional header row. */
export function Panel({ title, subtitle, icon: Icon, tone = 'brand', action, className = '', bodyClass = '', children }) {
  const t = TONES[tone] || TONES.brand;
  return (
    <section className={`bg-white rounded-2xl ring-1 ring-neutral-200/80 shadow-card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <span className={`h-9 w-9 shrink-0 rounded-xl grid place-items-center ${t.soft} ${t.text}`}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-neutral-900 truncate">{title}</h2>
              {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={`px-5 pb-5 ${title || action ? '' : 'pt-5'} ${bodyClass}`}>{children}</div>
    </section>
  );
}

export function PanelLink({ to, children }) {
  return (
    <Link to={to} className="shrink-0 h-8 px-2.5 rounded-lg text-xs font-semibold text-brand-700 hover:bg-brand-50 inline-flex items-center gap-1 transition-colors">
      {children} <ArrowUpRight className="w-3.5 h-3.5" />
    </Link>
  );
}

/** KPI tile: label, big value, hint line, optional sparkline. Renders as a link when `to` is set. */
export function StatCard({ label, value, hint, hintTone, icon: Icon, tone = 'brand', trend, to, active, onClick }) {
  const t = TONES[tone] || TONES.brand;
  const Tag = to ? Link : onClick ? 'button' : 'div';
  return (
    <Tag
      to={to}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      aria-pressed={onClick ? !!active : undefined}
      className={`group relative text-left overflow-hidden bg-white rounded-2xl p-4 sm:p-5 shadow-card ring-1 transition-all ${
        active ? 'ring-2 ring-brand-400' : 'ring-neutral-200/80'
      } ${to || onClick ? 'hover:-translate-y-0.5 hover:shadow-lift' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-neutral-500">{label}</p>
        {Icon && (
          <span className={`h-9 w-9 shrink-0 rounded-xl grid place-items-center ${t.icon} shadow-sm`}>
            <Icon className="w-[18px] h-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-2 text-[1.35rem] sm:text-[1.7rem] leading-none font-extrabold tracking-tight text-neutral-900 tabular-nums">{value}</p>
      <div className="mt-2.5 flex items-end justify-between gap-3 min-h-6">
        {hint && <p className={`text-xs font-medium truncate ${hintTone ? TONES[hintTone].text : 'text-neutral-500'}`}>{hint}</p>}
        {trend && trend.length > 1 && <span className="hidden sm:block"><Sparkline data={trend} color={t.solid} /></span>}
      </div>
    </Tag>
  );
}

export function Sparkline({ data, color = '#0a0a0a', width = 84, height = 26 }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const id = `sp${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

/** Vertical bars with labels underneath and values on top. data: [{ label, value, tone? }] */
export function BarChart({ data, height = 160, format = (v) => v, tone = 'brand', highlightLast = false }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height: height + 40 }}>
      {data.map((d, i) => {
        const fill = highlightLast ? (i === data.length - 1 ? '#0a0a0a' : '#d4d4d4') : (TONES[d.tone || tone] || TONES.brand).solid;
        const h = Math.max(4, (d.value / max) * height);
        return (
          <div key={d.label + i} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1.5 h-full">
            <span className="text-[11px] font-semibold text-neutral-600 tabular-nums truncate max-w-full">{d.value ? format(d.value) : ''}</span>
            <div className="w-full max-w-11 rounded-t-lg rounded-b-sm transition-all" style={{ height: h, background: fill, opacity: d.value ? 1 : 0.35 }} title={`${d.label}: ${format(d.value)}`} />
            <span className="text-[11px] font-medium text-neutral-400 truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Smooth line/area chart for a 0–100 series (e.g. attendance %). data: [{ label, value|null }] */
export function TrendChart({ data, height = 170, color = '#0a0a0a', target, suffix = '%' }) {
  const W = 600;
  const H = height;
  const pad = { l: 34, r: 10, t: 12, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => pad.t + ih - (v / 100) * ih;
  const pts = data.map((d, i) => (d.value == null ? null : [x(i), y(d.value)])).filter(Boolean);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${pad.t + ih} L${pts[0][0]},${pad.t + ih} Z` : '';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.10" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="#ededed" strokeWidth="1" />
          <text x={pad.l - 8} y={y(g) + 4} textAnchor="end" fontSize="10" fill="#a3a3a3">{g}{suffix}</text>
        </g>
      ))}
      {target != null && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="#a3a3a3" strokeDasharray="5 5" strokeWidth="1.5" />
          <text x={pad.l + 6} y={y(target) + 14} textAnchor="start" fontSize="10" fontWeight="600" fill="#525252">Target {target}{suffix}</text>
        </g>
      )}
      {area && <path d={area} fill="url(#trendFill)" />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {data.map((d, i) => (
        <g key={i}>
          {d.value != null && <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="#fff" stroke={color} strokeWidth="2"><title>{`${d.label}: ${d.value}${suffix}`}</title></circle>}
          {(data.length <= 8 || i % 2 === data.length % 2 || i === data.length - 1) && (
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#a3a3a3">{d.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Ring chart. segments: [{ value, color, label }] */
export function Donut({ segments, size = 150, thickness = 18, children }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ededed" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap={segments.length === 1 ? 'round' : 'butt'}>
              <title>{s.label}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** Horizontal progress bar with optional label row. */
export function Meter({ value, max = 100, tone = 'brand', label, right, className = '' }) {
  const t = TONES[tone] || TONES.brand;
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={className}>
      {(label || right) && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-neutral-600 truncate">{label}</span>
          <span className="font-semibold text-neutral-800 tabular-nums">{right}</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.solid }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="py-10 px-6 text-center">
      {Icon && (
        <span className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-neutral-950 text-white grid place-items-center">
          <Icon className="w-6 h-6" />
        </span>
      )}
      <p className="text-sm font-bold text-neutral-800">{title}</p>
      {text && <p className="mt-1 text-xs text-neutral-500 max-w-xs mx-auto">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Initials({ name, className = 'h-9 w-9 text-xs' }) {
  const letters = String(name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <span className={`${className} shrink-0 rounded-full grid place-items-center font-bold`} style={{ background: '#ececec', color: '#171717' }}>
      {letters}
    </span>
  );
}

/* ---------- date helpers for charts ---------- */
export function lastDays(n, endISO) {
  const end = endISO ? new Date(`${endISO}T00:00:00`) : new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    out.push(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  }
  return out;
}

export const shortDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function lastMonths(n) {
  const now = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-IN', { month: 'short' }) });
  }
  return out;
}

export const compactMoney = (v) => {
  const n = Number(v) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}k`;
  return `₹${n}`;
};

/** Attendance % for one date: present / marked, or null if nobody was marked. */
export function attendanceRate(marks = {}, ids) {
  const vals = ids ? ids.map((id) => marks[id]).filter(Boolean) : Object.values(marks);
  if (!vals.length) return null;
  return Math.round((vals.filter((v) => v === 'P').length / vals.length) * 100);
}
