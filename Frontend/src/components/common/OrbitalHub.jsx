import React from "react";
import { HEX_NODES } from "./data/hexNodes.data";
import { HexNode } from "./HexNode";

export function OrbitalHub() {
  return (
    <div className="hub3d">
      <svg className="hub-rings-svg" viewBox="-300 -300 600 600">
        <defs>
          <radialGradient id="sphereGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#eafff5" stopOpacity="0.95" />
            <stop offset="22%" stopColor="#7af0c8" stopOpacity="0.85" />
            <stop offset="48%" stopColor="#7c5cff" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#4527a8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1a0f3d" stopOpacity="0.05" />
          </radialGradient>
          <radialGradient id="sphereHaze" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#34d399" stopOpacity="0" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.25" />
          </radialGradient>
        </defs>

        <g className="ring-group ring-spin-a">
          <ellipse
            cx="0"
            cy="0"
            rx="230"
            ry="62"
            fill="none"
            stroke="#c084fc"
            strokeWidth="1.1"
            opacity="0.55"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="230"
            ry="62"
            fill="none"
            stroke="#c084fc"
            strokeWidth="0.5"
            opacity="0.3"
            transform="rotate(4)"
          />
        </g>
        <g className="ring-group ring-spin-b">
          <ellipse
            cx="0"
            cy="0"
            rx="180"
            ry="48"
            fill="none"
            stroke="#5ad6ff"
            strokeWidth="1"
            opacity="0.5"
          />
        </g>
        <g className="ring-group ring-spin-c">
          <ellipse
            cx="0"
            cy="0"
            rx="135"
            ry="36"
            fill="none"
            stroke="#5ad6ff"
            strokeWidth="1"
            opacity="0.6"
          />
        </g>
        <g className="ring-group ring-spin-d">
          <ellipse
            cx="0"
            cy="0"
            rx="270"
            ry="74"
            fill="none"
            stroke="#34d399"
            strokeWidth="0.8"
            opacity="0.35"
          />
        </g>

        <circle cx="0" cy="0" r="95" fill="url(#sphereHaze)" />
        <circle cx="0" cy="0" r="78" fill="url(#sphereGrad)" />
      </svg>

      <div className="hub-core">
        <svg viewBox="0 0 100 100" className="core-logo">
          <polygon
            points="50,8 92,32 92,68 50,92 8,68 8,32"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
          />
          <path
            d="M30 70 V30 L70 70 V30"
            fill="none"
            stroke="white"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <svg className="hub-spokes" viewBox="-300 -300 600 600">
        {HEX_NODES.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = Math.cos(rad) * node.dist;
          const y = Math.sin(rad) * node.dist;
          const innerDist = 88;
          const ix = Math.cos(rad) * innerDist;
          const iy = Math.sin(rad) * innerDist;
          const midX = x * 0.6;
          const midY = y * 0.6;
          return (
            <g key={node.id}>
              <path
                d={`M ${ix} ${iy} L ${midX} ${midY}`}
                fill="none"
                stroke={node.color}
                strokeOpacity="0.45"
                strokeWidth="1.2"
              />
              <path
                d={`M ${midX} ${midY} L ${x} ${y}`}
                fill="none"
                stroke={node.color}
                strokeOpacity="0.3"
                strokeWidth="1"
                strokeDasharray="1 4"
              />
              <circle
                cx={midX}
                cy={midY}
                r="2"
                fill={node.color}
                opacity="0.7"
              />
            </g>
          );
        })}
      </svg>

      {HEX_NODES.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180;
        const x = Math.cos(rad) * node.dist;
        const y = Math.sin(rad) * node.dist;
        return (
          <HexNode key={node.id} node={node} x={x} y={y} delay={i * 0.18} />
        );
      })}
    </div>
  );
}
