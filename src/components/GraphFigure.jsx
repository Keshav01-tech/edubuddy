import { useId } from 'react';
import { sampleCurve, usableFigure } from './plotMath';
import { MathText } from './MathText';

const WIDTH = 360;
const HEIGHT = 230;
const PAD = { left: 42, right: 14, top: 14, bottom: 28 };
const COLORS = ['#1d4ed8', '#b45309', '#047857', '#7c3aed'];

function ticks(min, max, count = 4) {
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, index) => min + step * index);
}

function formatTick(value) {
  if (!Number.isFinite(value)) return '';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1000 || abs < 0.01)) return value.toExponential(0);
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function GraphFigure({ figure }) {
  const clipId = useId().replace(/:/g, '');
  const data = usableFigure(figure);
  if (!data) return null;

  const { xMin, xMax, yMin, yMax } = data;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const sx = (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * innerW;
  const sy = (y) => PAD.top + ((yMax - y) / (yMax - yMin)) * innerH;
  const xTicks = ticks(xMin, xMax);
  const yTicks = ticks(yMin, yMax);
  const originX = Math.min(Math.max(sx(0), PAD.left), PAD.left + innerW);
  const originY = Math.min(Math.max(sy(0), PAD.top), PAD.top + innerH);

  return (
    <figure className="q-figure">
      <div className="q-figure-plot">
        {data.yLabel && (
          <span className="q-figure-y"><MathText text={data.yLabel} /></span>
        )}
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={data.yLabel && data.xLabel ? `${data.yLabel} against ${data.xLabel}` : 'Graph'}>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} />
          </clipPath>
          <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} fill="#fafaf9" stroke="#d6d3d1" />
          {xTicks.map((tick) => (
            <line key={`vx-${tick}`} x1={sx(tick)} x2={sx(tick)} y1={PAD.top} y2={PAD.top + innerH} stroke="#e7e5e4" />
          ))}
          {yTicks.map((tick) => (
            <line key={`hy-${tick}`} y1={sy(tick)} y2={sy(tick)} x1={PAD.left} x2={PAD.left + innerW} stroke="#e7e5e4" />
          ))}
          <line x1={originX} x2={originX} y1={PAD.top} y2={PAD.top + innerH} stroke="#44403c" />
          <line y1={originY} y2={originY} x1={PAD.left} x2={PAD.left + innerW} stroke="#44403c" />
          <g clipPath={`url(#${clipId})`}>
            {data.segments.map((segment, index) => (
              <line
                key={`seg-${index}`}
                x1={sx(segment.x1)}
                y1={sy(segment.y1)}
                x2={sx(segment.x2)}
                y2={sy(segment.y2)}
                stroke="#1c1917"
                strokeWidth="1.6"
              />
            ))}
            {data.curves.map((curve, index) => (
              sampleCurve(curve.fn, xMin, xMax, yMin, yMax).map((path, pathIndex) => (
                <polyline
                  key={`curve-${index}-${pathIndex}`}
                  fill="none"
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth="2"
                  points={path.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')}
                />
              ))
            ))}
          </g>
          {data.points.map((point, index) => (
            <g key={`pt-${index}`}>
              <circle cx={sx(point.x)} cy={sy(point.y)} r="3.2" fill="#1c1917" />
              {point.label && (
                <text x={sx(point.x) + 6} y={sy(point.y) - 6} fontSize="12" fill="#1c1917">
                  {point.label}
                </text>
              )}
            </g>
          ))}
          {xTicks.map((tick) => (
            <text key={`xt-${tick}`} x={sx(tick)} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill="#57534e">
              {formatTick(tick)}
            </text>
          ))}
          {yTicks.map((tick) => (
            <text key={`yt-${tick}`} x={PAD.left - 6} y={sy(tick) + 4} textAnchor="end" fontSize="11" fill="#57534e">
              {formatTick(tick)}
            </text>
          ))}
        </svg>
      </div>
      {data.xLabel && (
        <div className="q-figure-x"><MathText text={data.xLabel} /></div>
      )}
      {data.curves.some((curve) => curve.label) && (
        <ul className="q-figure-key">
          {data.curves.map((curve, index) => curve.label && (
            <li key={`${curve.label}-${index}`}>
              <span style={{ background: COLORS[index % COLORS.length] }} />
              <MathText text={curve.label} />
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
