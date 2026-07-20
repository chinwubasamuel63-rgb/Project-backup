import { COLORS } from "../../data/colors";

/**
 * Hire Component - Freelancer discovery and hiring
 */
export default function Hire({ setPaymentOpen, setView, notify }) {
  const talents = [
    {
      name: "Alex Rivera",
      title: "STAFF SYSTEMS ENGINEER",
      badge: "TOP 1%",
      badgeColor: COLORS.green,
      rate: "$185/hr",
      followers: "12.4k",
      views: "840k",
      stars: "4.2k",
      repos: 98,
      match: 95,
    },
    {
      name: "Sarah Chen",
      title: "BLOCKCHAIN ARCHITECT",
      badge: "PLATINUM",
      badgeColor: COLORS.purple,
      rate: "$220/hr",
      followers: "28.1k",
      views: "2.1M",
      stars: "9.1k",
      repos: 211,
      match: 91,
    },
    {
      name: "Jordan Smyth",
      title: "KUBERNETES SPECIALIST",
      badge: null,
      rate: "$210/hr",
      followers: "5.2k",
      views: "390k",
      stars: "5.2k",
      repos: 128,
      match: 98,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: COLORS.green,
              fontWeight: 600,
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            ELITE TALENT REGISTRY
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
            Talent Sourcing Platform
          </h1>
          <p style={{ fontSize: 13, color: COLORS.muted, maxWidth: 500 }}>
            Connect with verified engineers through performance metrics and live
            project artifacts.
          </p>
        </div>
        <div
          className="card"
          style={{ padding: "12px 20px", textAlign: "center" }}
        >
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
            AVAILABLE NOW
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            2,481{" "}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: COLORS.green,
                display: "inline-block",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}
      >
        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: COLORS.muted,
                marginBottom: 12,
                letterSpacing: 1,
              }}
            >
              FILTERS
            </div>
            <div style={{ marginBottom: 12 }}>
              <div
                style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}
              >
                SPECIALIZATION
              </div>
              <div
                style={{
                  background: "#0f172a",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 13,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                Distributed Systems <span>▾</span>
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}
              >
                HOURLY RATE
              </div>
              <input
                type="range"
                min={80}
                max={450}
                defaultValue={250}
                style={{ width: "100%" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: COLORS.muted,
                  marginTop: 4,
                }}
              >
                <span>$80/hr</span>
                <span>$450/hr</span>
              </div>
            </div>
          </div>
          <div
            className="card"
            style={{ padding: 16, border: `1px solid rgba(34,197,94,0.3)` }}
          >
            <div
              style={{
                fontSize: 11,
                color: COLORS.green,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              ✦ MATCH RECOMMENDATIONS
            </div>
            <p
              style={{
                fontSize: 11,
                color: COLORS.muted,
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              Our neural engine has identified 12 engineers that perfectly match
              your tech stack profile.
            </p>
            <button
              onClick={() => notify("Talent audit started.")}
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.green}`,
                color: COLORS.green,
                borderRadius: 4,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 600,
                width: "100%",
                cursor: "pointer",
              }}
            >
              RUN NEW AUDIT
            </button>
          </div>
        </div>

        {/* Talent Grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {talents.map((t, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    background: `hsl(${200 + i * 20}, 50%, 20%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    border: `2px solid ${COLORS.purple}`,
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  👤
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: COLORS.green,
                      border: "2px solid " + COLORS.surface,
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: COLORS.muted,
                          letterSpacing: 0.5,
                        }}
                      >
                        {t.title}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}
                      >
                        {t.rate}
                      </div>
                      {t.badge && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: t.badgeColor,
                            background: `${t.badgeColor}22`,
                            border: `1px solid ${t.badgeColor}44`,
                            borderRadius: 3,
                            padding: "1px 5px",
                          }}
                        >
                          {t.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  fontSize: 11,
                }}
              >
                <div>
                  <div style={{ color: COLORS.textDim, marginBottom: 2 }}>
                    FOLLOWERS
                  </div>
                  <div style={{ fontWeight: 600 }}>{t.followers}</div>
                </div>
                <div>
                  <div style={{ color: COLORS.textDim, marginBottom: 2 }}>
                    TOTAL VIEWS
                  </div>
                  <div style={{ fontWeight: 600 }}>{t.views}</div>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textDim,
                    marginBottom: 6,
                  }}
                >
                  LATEST PROJECTS
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 4,
                        background: `hsl(${220 + n * 15 + i * 30}, 40%, 12%)`,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    />
                  ))}
                </div>
              </div>
              {t.match && (
                <div style={{ fontSize: 11 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: COLORS.muted }}>
                      Cloud Infrastructure Optimization
                    </span>
                    <span style={{ color: COLORS.green, fontWeight: 600 }}>
                      {t.match}% Match
                    </span>
                  </div>
                  <div
                    style={{
                      height: 3,
                      background: COLORS.border,
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        width: `${t.match}%`,
                        height: "100%",
                        background: COLORS.green,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <button
                  className="btn-ghost"
                  onClick={() => setView("messages")}
                  style={{ fontSize: 12 }}
                >
                  Message
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setPaymentOpen(true)}
                  style={{ fontSize: 12 }}
                >
                  ⚡ Hire Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}