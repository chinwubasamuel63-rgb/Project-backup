import { useState, useEffect } from "react";
import { FEED_BASE } from "./data/feedData.data";
import { Icon } from "./Icon";

export function ActivityFeed() {
  const [items, setItems] = useState(FEED_BASE);
  useEffect(() => {
    const id = setInterval(
      () => setItems((prev) => prev.map((it) => ({ ...it, t: it.t + 1 }))),
      60000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-panel feed-panel">
      <div className="feed-header">
        <span className="live-dot" />
        LIVE ACTIVITY FEED
      </div>
      <div className="feed-list">
        {items.map((it, i) => (
          <div
            className="feed-row"
            key={i}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <span className="feed-icon">
              <Icon name={it.icon} size={14} />
            </span>
            <span className="feed-text">{it.text}</span>
            <span className="feed-time">{it.t}m ago</span>
          </div>
        ))}
      </div>
      <div className="feed-footer">
        Real-time updates from the <span className="accent-text">Nexus</span>
      </div>
    </div>
  );
}
