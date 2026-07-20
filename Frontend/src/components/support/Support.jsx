import { useState } from "react";
import { COLORS } from "../../data/colors";

/**
 * SupportStudent Component - Student support tickets and help
 */
export function SupportStudent({ notify }) {
  const [selected, setSelected] = useState(0);
  const tickets = [
    {
      id: "#TKT-4821",
      title: "Firewall Rule Misconfiguration",
      track: "Cybersecurity",
      status: "Active",
      statusColor: COLORS.green,
      time: "2 mins ago",
      sub: "Pending Review",
    },
    {
      id: "#TKT-4819",
      title: "Kubernetes Pod CrashloopBackOff",
      track: "Software Development",
      status: "Resolved",
      statusColor: COLORS.textDim,
      time: "4 hours ago",
      sub: "Solution Found",
    },
    {
      id: "#TKT-4815",
      title: "API Authentication Failure (401)",
      track: "Data Science & Analytics",
      status: "Critical",
      statusColor: COLORS.red,
      time: "Yesterday",
      sub: "Awaiting Student",
    },
  ];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 52px)" }}>
      {/* Left Tickets */}
      <div
        style={{
          width: 320,
          borderRight: `1px solid ${COLORS.border}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 16 }}>
          <button
            className="btn-primary"
            onClick={() =>
              notify("Support request submitted to the mentor queue.")
            }
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
            }}
          >
            <span style={{ fontSize: 18 }}>⊕</span> Raise a Blocker
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tickets.map((t, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              style={{
                padding: 16,
                borderBottom: `1px solid ${COLORS.border}`,
                cursor: "pointer",
                background:
                  selected === i ? "rgba(168,85,247,0.08)" : "transparent",
                borderLeft:
                  selected === i
                    ? `3px solid ${COLORS.purple}`
                    : i === 2
                      ? `3px solid ${COLORS.red}`
                      : "3px solid transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: COLORS.purple,
                    fontFamily: "monospace",
                  }}
                >
                  {t.id}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: t.statusColor,
                    fontWeight: 600,
                  }}
                >
                  {t.status}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 6,
                }}
              >
                {t.title}
              </div>
              <div
                style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}
              >
                <span
                  style={{
                    background: COLORS.border,
                    borderRadius: 3,
                    padding: "1px 6px",
                  }}
                >
                  {t.track}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: COLORS.muted,
                }}
              >
                <span>{t.sub}</span>
                <span>{t.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "rgba(168,85,247,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              🛡
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                Firewall Rule Misconfiguration
              </h2>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                Ticket ID: #TKT-4821 • Track: Cybersecurity
              </div>
            </div>
          </div>
          <span className="badge-amber" style={{ padding: "4px 10px" }}>
            IN PROGRESS
          </span>
        </div>

        {/* Student Message */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#1e3a5f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              👤
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Alex Rivero{" "}
                <span style={{ fontSize: 11, color: COLORS.muted }}>
                  Today at 10:42 AM
                </span>
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: COLORS.muted,
              marginBottom: 12,
            }}
          >
            I'm currently stuck on Phase 3 of the Network Security lab. I've
            configured the iptables rules as specified in the manual, but I'm
            still seeing a drop on inbound traffic for Port 8080. It feels like
            there's a shadowing rule I can't find.
          </p>
          <pre
            className="mono"
            style={{
              background: "#060e1a",
              border: `1px solid ${COLORS.border}`,
              padding: 12,
              borderRadius: 6,
              fontSize: 11,
              color: COLORS.green,
              lineHeight: 1.6,
            }}
          >
            {
              "$ sudo iptables -L -n -v --line-numbers\n# Output shows rule 4 dropping everything..."
            }
          </pre>
        </div>

        {/* Instructor Response */}
        <div
          className="card"
          style={{ padding: 20, borderLeft: `3px solid ${COLORS.green}` }}
        >
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🎓
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Instructor Sarah
                </span>
                <span
                  style={{
                    fontSize: 10,
                    background: "rgba(34,197,94,0.2)",
                    color: COLORS.green,
                    borderRadius: 3,
                    padding: "1px 6px",
                    fontWeight: 700,
                  }}
                >
                  STAFF
                </span>
                <span style={{ fontSize: 10, color: COLORS.muted }}>
                  Cybersecurity Lead
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: COLORS.muted,
                    marginLeft: "auto",
                  }}
                >
                  12 mins ago
                </span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: COLORS.muted }}>
            Hi Alex! Great catch on checking the line numbers. Rule 4 is indeed
            a generic DROP rule that might be superseding your specific ALLOW
            rule if it was appended rather than inserted. Try running sudo
            iptables -I INPUT 1 -p tcp --dport 8080 -j ACCEPT to insert it at
            the very top.
          </p>
        </div>

        {/* Reply */}
        <div style={{ marginTop: 20 }}>
          <textarea
            placeholder="Type your reply to Instructor Sarah..."
            style={{ width: "100%", height: 80, resize: "none", fontSize: 13 }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              onClick={() => notify("Voice note recorder ready.")}
              style={{
                background: "none",
                border: "none",
                color: COLORS.muted,
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              🎤
            </button>
            <button
              onClick={() => notify("Image attachment picker ready.")}
              style={{
                background: "none",
                border: "none",
                color: COLORS.muted,
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              🖼
            </button>
            <button
              className="btn-primary"
              onClick={() => notify("Reply sent to the support thread.")}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SupportInstructor Component - Instructor support queue
 */
export function SupportInstructor({ notify }) {
  const [track, setTrack] = useState("All Tracks");
  const [selected, setSelected] = useState(0);
  const tracks = [
    "All Tracks",
    "Full-Stack Dev",
    "Cybersecurity",
    "Data Science",
    "UI/UX",
  ];
  const blockers = [
    {
      initials: "JD",
      user: "@jdoe_dev",
      track: "FULL-STACK DEV",
      title: "Postgres Connection Timeout on Docker",
      tags: ["DATABASE", "DOCKER"],
      time: "12m ago",
      status: "PENDING",
    },
    {
      initials: "AX",
      user: "@alex_cipher",
      track: "CYBERSECURITY",
      title: "JWT Verification Failing in Auth Flow",
      tags: ["AUTHENTICATION", "NODE.JS"],
      time: "24m ago",
      status: "PENDING",
    },
    {
      initials: "SR",
      user: "@sarah_ds",
      track: "DATA SCIENCE",
      title: "Pandas Memory Leak on Large CSV",
      tags: ["PYTHON"],
      time: "2h ago",
      status: "RESOLVED",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 52px)",
      }}
    >
      <div
        style={{
          padding: "10px 24px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: COLORS.muted, marginRight: 4 }}>
          FILTER TRACKS:
        </span>
        {tracks.map((t) => (
          <button
            key={t}
            onClick={() => setTrack(t)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: track === t ? COLORS.purple : "transparent",
              color: track === t ? "#fff" : COLORS.muted,
              border: `1px solid ${track === t ? COLORS.purple : COLORS.border}`,
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div
        style={{ flex: 1, display: "grid", gridTemplateColumns: "380px 1fr" }}
      >
        {/* Blocker List */}
        <div
          style={{
            borderRight: `1px solid ${COLORS.border}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              ⬛ Incoming Blockers
            </span>
            <span
              style={{
                background: "rgba(239,68,68,0.15)",
                color: COLORS.red,
                border: "1px solid rgba(239,68,68,0.3)",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              14 ACTIVE
            </span>
          </div>
          {blockers.map((b, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              style={{
                padding: 16,
                borderBottom: `1px solid ${COLORS.border}`,
                cursor: "pointer",
                background:
                  selected === i ? "rgba(168,85,247,0.08)" : "transparent",
              }}
            >
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: COLORS.border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {b.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                    {b.user}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.muted }}>
                    {b.track}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 16,
                    color: COLORS.muted,
                  }}
                >
                  ›
                </span>
              </div>
              <div
                style={{ fontSize: 13, color: COLORS.text, marginBottom: 8 }}
              >
                {b.title}
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {b.tags.map((tag) => (
                  <span key={tag} className="tag" style={{ fontSize: 10 }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: COLORS.muted,
                }}
              >
                <span>⏱ {b.time}</span>
                <span
                  className={
                    b.status === "RESOLVED" ? "badge-green" : "badge-red"
                  }
                  style={{ padding: "1px 6px", fontSize: 10 }}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Ticket Detail */}
        <div style={{ padding: 24, overflowY: "auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Ticket ID: #DB-9902
              </h2>
              <p style={{ fontSize: 13, color: COLORS.muted }}>
                Postgres Connection Timeout on Docker
              </p>
            </div>
            <button
              className="btn-green"
              onClick={() =>
                notify("Blocker marked resolved and student notified.")
              }
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              RESOLVE BLOCKER
            </button>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: COLORS.muted,
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              📄 STUDENT DESCRIPTION
            </div>
            <p style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.7 }}>
              I'm getting a Connection timeout every time I try to run my
              integration tests using docker-compose. The database container
              starts fine, and I can see the "ready to accept connections" logs,
              but the API container fails to connect.
            </p>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: COLORS.muted,
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              💻 ENVIRONMENT LOGS
            </div>
            <pre
              className="mono"
              style={{
                background: "#060e1a",
                padding: 14,
                borderRadius: 6,
                fontSize: 11,
                color: COLORS.green,
                lineHeight: 1.8,
                overflow: "auto",
              }}
            >
              {`[2024-05-20 14:22:11] info: Starting containers...
[2024-05-20 14:22:15] db_1  | LOG: database system is ready to accept connections
[2024-05-20 14:22:20] api_1 | Error: connect ETIMEDOUT 172.18.0.3:5432
[2024-05-20 14:22:20] api_1 |   at TCPConnectWrap.afterConnect [as oncomplete]`}
            </pre>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: COLORS.muted,
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              💬 INTERACTION THREAD
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: COLORS.border,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                👤
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.purple,
                    marginBottom: 4,
                  }}
                >
                  @jdoe_dev{" "}
                  <span style={{ color: COLORS.muted }}>• 12m ago</span>
                </div>
                <p style={{ fontSize: 13, color: COLORS.muted }}>
                  I've verified the .env file matches the service name in the
                  compose file.
                </p>
              </div>
            </div>
          </div>

          <div>
            <textarea
              placeholder="Type technical feedback or solution..."
              style={{
                width: "100%",
                height: 80,
                resize: "none",
                fontSize: 13,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 11, color: COLORS.muted }}>
                SHIFT + ENTER TO POST
              </span>
              <button
                className="btn-primary"
                onClick={() => notify("Instructor feedback posted.")}
                style={{ padding: "6px 14px" }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
