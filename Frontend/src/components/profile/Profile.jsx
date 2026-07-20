import { useState } from "react";
import { COLORS } from "../../data/colors";

/**
 * Profile Component - User profile and settings
 */
export default function Profile({ setView, notify }) {
  return (
    <div
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 20,
        maxWidth: 1000,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: 10,
                background: "#1e3a5f",
                margin: "0 auto",
                border: `2px solid ${COLORS.purple}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
              }}
            >
              👤
            </div>
            <div
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: COLORS.green,
                border: "2px solid " + COLORS.surface,
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: COLORS.green, marginBottom: 8 }}>
            ● Available
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Alexander Vance
          </div>
          <div
            style={{
              fontSize: 11,
              color: COLORS.muted,
              letterSpacing: 0.5,
              marginBottom: 16,
            }}
          >
            SENIOR SPECIALIST @ CLOUDARCH
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginBottom: 16,
              color: COLORS.muted,
              fontSize: 20,
            }}
          >
            🖼 🔗 💼
          </div>
          <button
            className="btn-primary"
            onClick={() => setView("messages")}
            style={{ width: "100%", fontSize: 12 }}
          >
            Contact Specialist
          </button>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            ⚙ Profile Settings
          </div>
          {[
            { label: "System Appearance", on: true },
            { label: "Public Visibility", on: true },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: i === 0 ? 12 : 0,
              }}
            >
              <span style={{ fontSize: 13, color: COLORS.muted }}>
                {s.label}
              </span>
              <div
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: s.on ? COLORS.green : COLORS.border,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    right: s.on ? 2 : "auto",
                    left: s.on ? "auto" : 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              color: COLORS.purple,
            }}
          >
            <span>📋</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Professional Summary
            </span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: COLORS.muted }}>
            I architect scalable distributed systems with a focus on
            high-concurrency environments and real-time data processing. With
            over 12 years of experience in the Silicon Valley ecosystem, I
            bridge the gap between low-level performance optimization and
            high-level architectural elegance. Specialized in Rust and
            Kubernetes, currently pioneering decentralized infrastructure for
            global talent marketplaces.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              color: COLORS.purple,
            }}
          >
            <span>💻</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Core Tech Stack
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {[
              ["Rust", "6y"],
              ["Go", "8y"],
              ["TypeScript", "10y"],
              ["K8s", "5y"],
              ["PostgreSQL", "12y"],
              ["Redis", "7y"],
              ["GraphQL", "4y"],
              ["React", "9y"],
            ].map(([tech, exp]) => (
              <div
                key={tech}
                style={{
                  background: "#0f172a",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: "8px 12px",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tech}</span>
                <span
                  style={{ fontSize: 10, color: COLORS.muted, marginLeft: 4 }}
                >
                  Exp: {exp}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              color: COLORS.purple,
            }}
          >
            <span>◎</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Project History & Highlights
            </span>
          </div>
          {[
            {
              name: "Vector Nexus Engine",
              sub: "Infrastructure Partnership • Completed Mar 2024",
              badge: "100% SUCCESS",
              badgeColor: COLORS.green,
              quote:
                "Resolved critical bottleneck in the indexing layer by implementing a custom SIMD-accelerated search algorithm, reducing latency by 450ms across all shards.",
            },
            {
              name: "HyperStream Protocol",
              sub: "Systems Architecture Lead",
              badge: "LEGACY BUILD",
              badgeColor: COLORS.textDim,
              quote: null,
            },
          ].map((p, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 20,
                marginBottom: 12,
                borderLeft: `3px solid ${COLORS.purple}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: "monospace",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.muted,
                      fontFamily: "monospace",
                    }}
                  >
                    {p.sub}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: p.badgeColor,
                    background: `${p.badgeColor}22`,
                    border: `1px solid ${p.badgeColor}44`,
                    borderRadius: 3,
                    padding: "2px 8px",
                    height: "fit-content",
                  }}
                >
                  {p.badge}
                </span>
              </div>
              {p.quote && (
                <div
                  style={{
                    background: "#060e1a",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 6,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: COLORS.green,
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    ❝ Key Standup Highlight
                  </div>
                  <p
                    className="mono"
                    style={{
                      fontSize: 12,
                      color: COLORS.muted,
                      lineHeight: 1.7,
                      fontStyle: "italic",
                    }}
                  >
                    "{p.quote}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
