import React, { useMemo } from "react";

export function Skyline() {
  const buildings = useMemo(() => {
    const arr = [];
    let x = 0;
    let seed = 11;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    while (x < 1600) {
      const w = 22 + rand() * 50;
      const h = 40 + rand() * 240;
      arr.push({ x, w, h });
      x += w + rand() * 6;
    }
    return arr;
  }, []);

  return (
    <svg
      viewBox="0 0 1600 340"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: "38%",
        opacity: 0.6,
      }}
    >
      {buildings.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={340 - b.h}
            width={b.w}
            height={b.h}
            fill="#070914"
            stroke="#1c2340"
            strokeWidth="0.6"
          />
          {Array.from({ length: Math.floor(b.h / 18) }).map((_, r) =>
            Array.from({ length: Math.max(1, Math.floor(b.w / 14)) }).map(
              (_, c) => {
                const lit = (i * 7 + r * 3 + c) % 5 === 0;
                return lit ? (
                  <rect
                    key={`${r}-${c}`}
                    x={b.x + 4 + c * 13}
                    y={340 - b.h + 6 + r * 18}
                    width="4"
                    height="6"
                    fill={r % 2 === 0 ? "#22d3ee" : "#a855f7"}
                    opacity="0.55"
                  />
                ) : null;
              },
            ),
          )}
        </g>
      ))}
      {/* vertical light streaks rising from rooftops */}
      {buildings
        .filter((_, i) => i % 6 === 0)
        .map((b, i) => (
          <rect
            key={`streak-${i}`}
            x={b.x + b.w / 2 - 0.5}
            y={0}
            width="1.5"
            height={340 - b.h}
            fill="url(#streakGrad)"
            opacity="0.5"
          />
        ))}
      <defs>
        <linearGradient id="streakGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ef0ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#7ef0ff" stopOpacity="0.6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
