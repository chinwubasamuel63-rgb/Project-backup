import { Skyline } from "./Skyline";
import { GroundBeams } from "./GroundBeams";
import { ParticleField } from "./ParticleField";
import { OrbitalHub } from "./OrbitalHub";
import { LoginPanel } from "./LoginPanel";
import { ActivityFeed } from "./ActivityFeed";
import { StatCard } from "./StatCard";
import { CSS_STYLES } from "./data/styles.data";
import { STATS } from "./data/stats.data";

export default function DevStreamNexus() {
  return (
    <div className="nexus-root">
      <style>{CSS_STYLES}</style>
      <Skyline />
      <GroundBeams />
      <ParticleField />
      <div className="grid-floor" />

      <header className="nexus-header">
        <div className="brand">
          <svg viewBox="0 0 48 48" className="brand-mark">
            <polygon
              points="24,3 43,14 43,34 24,45 5,34 5,14"
              fill="none"
              stroke="url(#brandGrad)"
              strokeWidth="2.4"
            />
            <path
              d="M16 32V16l16 16V16"
              fill="none"
              stroke="url(#brandGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <div className="brand-text">
            <div className="brand-line1">DEVSTREAM</div>
            <div className="brand-line2">NEXUS</div>
          </div>
        </div>
        <div className="version-pill">
          v1.0 <span className="version-dot" />
        </div>
      </header>

      <div className="tagline">
        <div className="tagline-bar" />
        <div className="tagline-text">
          The Operating System
          <br />
          for <span className="accent-text">Builders</span>
        </div>
      </div>

      <main className="nexus-main">
        <div className="hub-column">
          <OrbitalHub />
        </div>
        <div className="login-column">
          <LoginPanel />
        </div>
      </main>

      <section className="bottom-row">
        <ActivityFeed />
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} delay={i * 0.1} />
          ))}
        </div>
      </section>

      <footer className="nexus-footer">
        BUILD <span className="dot">•</span> COLLABORATE{" "}
        <span className="dot">•</span> STREAM <span className="dot">•</span>{" "}
        HIRE <span className="dot">•</span> SCALE
      </footer>
    </div>
  );
}
