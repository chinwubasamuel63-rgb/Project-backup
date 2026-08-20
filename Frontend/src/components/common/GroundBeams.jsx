export function GroundBeams() {
  return (
    <svg
      viewBox="0 0 1600 500"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: "46%",
        opacity: 0.55,
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ad6ff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#5ad6ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[-60, -20, 20, 60, 100, 140, 180].map((off, i) => (
        <polygon
          key={i}
          points={`800,500 ${800 + off - 4},0 ${800 + off + 4},0`}
          fill="url(#beamGrad)"
          opacity={0.35}
        />
      ))}
    </svg>
  );
}
