import { pct } from '../lib/format';

interface Props {
  value: number | null;
  size?: number;
  label?: string;
}

export function ProgressRing({ value, size = 120, label }: Props) {
  const stroke = size / 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={v >= 1 ? 'var(--good)' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 300ms ease' }}
        />
      </svg>
      <div className="ring-label">
        <strong style={{ fontSize: size / 4.5 }}>{pct(value)}</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}
