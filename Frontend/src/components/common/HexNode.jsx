import React, { useState } from "react";
import { Icon } from "./Icon";

export function HexNode({ node, x, y, delay }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="hex-node"
      style={{
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        animationDelay: `${delay}s`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={`hex-shape ${hover ? "hex-hover" : ""}`}
        style={{ "--node-color": node.color, "--node-glow": node.glow }}
      >
        <svg viewBox="0 0 100 100" className="hex-bg">
          <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" />
        </svg>
        <Icon
          name={node.icon}
          size={22}
          style={{ position: "relative", zIndex: 2, color: node.color }}
        />
      </div>
      <div className="hex-label">
        <div className="hex-title">{node.label}</div>
        <div className="hex-sub">{node.sub}</div>
      </div>
    </div>
  );
}
