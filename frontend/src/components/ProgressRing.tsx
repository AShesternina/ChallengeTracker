interface Props {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  white?: boolean;
}

export default function ProgressRing({ value, size = 80, stroke = 8, white }: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  const trackColor = white ? "rgba(255,255,255,0.2)" : "var(--color-accent-soft)";
  const arcColor = white ? "#ffffff" : "var(--color-accent)";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={arcColor} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}
