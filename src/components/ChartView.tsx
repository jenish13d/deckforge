import { formatChartValue, type CardChart } from "@/lib/cards";

// A chart on a slide, drawn as SVG in the theme's colours (so it shows the same in the editor, the
// presenter and the PDF). Bars compare groups and run across, so long labels stay readable; a line
// shows change over time, its points in the order given. Sizes are in the drawing's own units and
// scale with the slide.

const W = 1000;
const H = 440;

/** The value range to draw: from zero, unless all values sit high above it (then from a little below the lowest). */
function domain(values: number[], fromZero: boolean): [number, number] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (fromZero || lo <= 0 || lo < hi * 0.5) return [Math.min(0, lo), Math.max(0, hi) || 1];
  const pad = (hi - lo) * 0.25 || hi * 0.1;
  return [lo - pad, hi + pad * 0.4];
}

export function ChartView({ chart }: { chart: CardChart }) {
  const label = chart.points.map((p) => `${p.label}: ${formatChartValue(p.value, chart.unit)}`).join("; ");
  return (
    <svg className="card__chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      {chart.kind === "line" ? <Line chart={chart} /> : <Bars chart={chart} />}
    </svg>
  );
}

function Bars({ chart }: { chart: CardChart }) {
  const n = chart.points.length;
  const [lo, hi] = domain(chart.points.map((p) => p.value), true);
  const left = 290;
  const right = W - 150;
  const x = (v: number) => left + ((v - lo) / (hi - lo)) * (right - left);
  const row = H / n;
  const bar = Math.min(row * 0.62, 64);
  return (
    <g>
      {chart.points.map((p, i) => {
        const y = row * i + (row - bar) / 2;
        const start = x(Math.max(lo, Math.min(0, hi)));
        const end = x(p.value);
        return (
          <g key={i}>
            <text className="card__chart-label" x={left - 18} y={y + bar / 2} textAnchor="end" dominantBaseline="central">{p.label}</text>
            <rect className="card__chart-bar" x={Math.min(start, end)} y={y} width={Math.max(2, Math.abs(end - start))} height={bar} rx={6} />
            <text className="card__chart-value" x={Math.max(start, end) + 14} y={y + bar / 2} dominantBaseline="central">{formatChartValue(p.value, chart.unit)}</text>
          </g>
        );
      })}
    </g>
  );
}

function Line({ chart }: { chart: CardChart }) {
  const n = chart.points.length;
  const [lo, hi] = domain(chart.points.map((p) => p.value), false);
  const left = 40;
  const right = W - 40;
  const top = 60;
  const bottom = H - 70;
  const x = (i: number) => left + (n === 1 ? 0.5 : i / (n - 1)) * (right - left);
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const path = chart.points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(n - 1).toFixed(1)},${bottom} L${x(0).toFixed(1)},${bottom} Z`;
  return (
    <g>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} className="card__chart-grid" x1={left} x2={right} y1={bottom - f * (bottom - top)} y2={bottom - f * (bottom - top)} />
      ))}
      <line className="card__chart-axis" x1={left} x2={right} y1={bottom} y2={bottom} />
      <path className="card__chart-area" d={area} />
      <path className="card__chart-line" d={path} />
      {chart.points.map((p, i) => (
        <g key={i}>
          <circle className="card__chart-dot" cx={x(i)} cy={y(p.value)} r={9} />
          <text className="card__chart-value" x={x(i)} y={y(p.value) - 22} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
            {formatChartValue(p.value, chart.unit)}
          </text>
          <text className="card__chart-label" x={x(i)} y={bottom + 42} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{p.label}</text>
        </g>
      ))}
    </g>
  );
}
