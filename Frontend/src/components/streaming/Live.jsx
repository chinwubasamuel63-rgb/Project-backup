import { useState } from "react";
import { COLORS } from "../../data/colors";

/**
 * Live Component - Live streaming and labs interface
 */
export default function Live() {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([
    {
      user: "leocoder_23",
      time: "14:05",
      text: "That borrow checker logic is super clean. Can you show the trait implementation again?",
      system: false,
    },
    {
      user: "mia_fullstack",
      time: "14:06",
      text: "Wait, doesn't Arc clone increase overhead here significantly?",
      system: false,
    },
    {
      user: "System",
      time: "",
      text: "dev_guru subscribed at Level 2!",
      system: true,
    },
    {
      user: "ben_rust_fan",
      time: "14:08",
      text: "Check the docs on Pin<P> for async streams, might help with that future issue.",
      system: false,
    },
  ]);

  const send = () => {
    if (!msg.trim()) return;
    setMessages([
      ...messages,
      {
        user: "you",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: msg,
        system: false,
      },
    ]);
    setMsg("");
  };

  return (
    <div
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}
      >
        {/* Video */}
        <div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              style={{
                background: "#060e1a",
                height: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#1e3a5f",
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Architecting Microservices in Rust
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.green }}>
                    with @alex_rustacean
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  ● LIVE
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                >
                  1,429 viewers
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(168,85,247,0.3)",
                  border: `2px solid ${COLORS.purple}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                ▶
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(to right, ${COLORS.purple} 40%, ${COLORS.border} 40%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Chat */}
        <div
          className="card"
          style={{ display: "flex", flexDirection: "column", height: 320 }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Live Chat</span>
            <div style={{ display: "flex", gap: 8 }}>👥 ⋯</div>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.map((m, i) =>
              m.system ? (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    color: COLORS.amber,
                    textAlign: "center",
                  }}
                >
                  ★ System: {m.text}
                </div>
              ) : (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#1e3a5f",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                    }}
                  >
                    👤
                  </div>
                  <div>
                    <div style={{ fontSize: 11, marginBottom: 2 }}>
                      <span style={{ color: COLORS.purple, fontWeight: 600 }}>
                        {m.user}
                      </span>
                      <span style={{ color: COLORS.textDim, marginLeft: 6 }}>
                        {m.time}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        lineHeight: 1.5,
                      }}
                    >
                      {m.text}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
          <div
            style={{
              padding: "10px 16px",
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {["🔥", "❤️", "😂", "🚀"].map((e) => (
                <span key={e} style={{ cursor: "pointer", fontSize: 16 }}>
                  {e}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Send a message..."
                style={{ flex: 1, padding: "6px 10px", fontSize: 12 }}
              />
              <button
                className="btn-primary"
                onClick={send}
                style={{ padding: "6px 12px", fontSize: 14 }}
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Gallery */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Live Now</h3>
          <span
            style={{ fontSize: 12, color: COLORS.purple, cursor: "pointer" }}
          >
            View All Gallery →
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {[
            {
              user: "@sarah_dev",
              desc: "Refactoring...",
              tags: ["Go", "Architecture"],
              viewers: "842",
            },
            {
              user: "@marcus_cloud",
              desc: "Building a SaaS...",
              tags: ["NextJS", "SaaS"],
              viewers: "1.2k",
            },
            {
              user: "@elena_ops",
              desc: "K8s Cluster...",
              tags: ["DevOps", "K8s"],
              viewers: "529",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="card"
              style={{ overflow: "hidden", cursor: "pointer" }}
            >
              <div
                style={{
                  background: `hsl(${220 + i * 15}, 50%, 12%)`,
                  height: 100,
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "8px 10px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                >
                  ● LIVE
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    fontSize: 10,
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}
                >
                  {s.viewers} watching
                </div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#1e3a5f",
                    }}
                  />
                  <span style={{ fontSize: 11, color: COLORS.purple }}>
                    {s.user}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  {s.desc}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {s.tags.map((t) => (
                    <span key={t} className="tag" style={{ fontSize: 10 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
