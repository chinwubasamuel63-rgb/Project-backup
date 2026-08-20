import { Icon } from "./Icon";
import { Sparkline } from "./Sparkline";

export function StatCard({ stat, delay }) {
  return (
    <div
      className="glass-panel stat-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="stat-icon" style={{ color: stat.color }}>
        <Icon name={stat.icon} size={19} />
      </div>
      <div className="stat-value">{stat.value}</div>
      <div className="stat-label">{stat.label}</div>
      <Sparkline data={stat.data} color={stat.color} />
    </div>
  );
}
