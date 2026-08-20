import { COLORS } from "./colors";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function OverviewDonut({ data }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offsets = data.reduce((result, item, index) => {
    result[index] = data
      .slice(0, index)
      .reduce(
        (total, previous) => total + (previous.pct / 100) * circumference,
        0,
      );
    return result;
  }, []);

  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <g transform="rotate(-90 70 70)">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={COLORS.border}
          strokeWidth="18"
        />
        {data.map((item, index) => {
          const length = (item.pct / 100) * circumference;
          return (
            <circle
              key={item.label || index}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offsets[index]}
              strokeLinecap="butt"
            />
          );
        })}
      </g>
    </svg>
  );
}

export function FunnelIcon() {
  return (
    <svg {...iconProps} width={16} height={16}>
      <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />
    </svg>
  );
}
