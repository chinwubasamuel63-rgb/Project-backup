import { useState } from "react";
import { COLORS } from "../../data/colors";

/**
 * Messages Component - Chat and conversation interface
 */
export default function Messages({ notify }) {
  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState("");
  const conversations = [
    {
      user: "@alex_dev",
      badge: "Software Dev",
      preview: "Review the updated Rust implementation...",
      time: "12:45 PM",
      tone: COLORS.green,
      unread: 2,
    },
    {
      user: "@sarah_recruits",
      badge: "Lead Talent",
      preview: "The team loved your portfolio project.",
      time: "Yesterday",
      tone: COLORS.purple,
      unread: 0,
    },
    {
      user: "DevStream Bot",
      badge: "System",
      preview: "Deployment successful for repo: alpha-core",
      time: "2d ago",
      tone: COLORS.amber,
      unread: 0,
    },
  ];
  const [chats, setChats] = useState([
    [
      {
        sender: "alex",
        user: "@alex_dev",
        time: "12:30 PM",
        text: "Hey, I've finished the initial draft for the consensus logic. Can you take a look at the encryption wrapper?",
        code: `pub fn encrypt_payload(data: Vec<u8>) -> Result<Vec<u8>, Error> {
  let cipher = Aes256Gcm::new(KEY);
  cipher.encrypt(&nonce, data.as_ref())
}`,
      },
      {
        sender: "me",
        time: "12:35 PM",
        text: "Looks clean. I'm worried about nonce reuse in high-frequency loops. Let's add a monotonic counter to the nonce generation.",
      },
      {
        sender: "alex",
        user: "@alex_dev",
        time: "12:45 PM",
        text: "Good catch. I'll push the fix to the security-patch-v2 branch. Check the CI logs once you're back.",
      },
    ],
    [
      {
        sender: "sarah",
        user: "@sarah_recruits",
        time: "Yesterday",
        text: "The team loved your portfolio project. They asked for a short architecture walkthrough before the next interview loop.",
      },
    ],
    [
      {
        sender: "bot",
        user: "DevStream Bot",
        time: "2d ago",
        text: "Deployment successful for repo: alpha-core. Preview environment is healthy and ready for review.",
      },
    ],
  ]);
  const current = conversations[active];
  const send = () => {
    if (!msg.trim()) return;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setChats((prev) =>
      prev.map((thread, i) =>
        i === active
          ? [...thread, { sender: "me", time, text: msg.trim() }]
          : thread,
      ),
    );
    setMsg("");
    notify("Message sent securely.");
  };

  return (
    <div className="chat-shell">
      <section className="chat-rail">
        <div className="chat-rail-head">
          <div>
            <span className="eyebrow">SECURE CHAT</span>
            <h2>Messages</h2>
          </div>
          <button
            className="icon-btn"
            onClick={() => notify("New conversation composer opened.")}
          >
            +
          </button>
        </div>
        <div className="chat-search">Filter conversations...</div>
        <div className="conversation-list">
          {conversations.map((c, i) => (
            <button
              key={c.user}
              onClick={() => setActive(i)}
              className={`conversation-card ${active === i ? "active" : ""}`}
            >
              <span
                className="conversation-avatar"
                style={{ borderColor: c.tone }}
              >
                {c.user === "DevStream Bot"
                  ? "DB"
                  : c.user.slice(1, 3).toUpperCase()}
              </span>
              <span className="conversation-main">
                <strong>{c.user}</strong>
                <small>{c.badge}</small>
                <em>{c.preview}</em>
              </span>
              <span className="conversation-meta">
                <small>{c.time}</small>
                {c.unread > 0 && <b>{c.unread}</b>}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="chat-main">
        <div className="chat-hero-bar">
          <div
            className="conversation-avatar large"
            style={{ borderColor: current.tone }}
          >
            {current.user === "DevStream Bot"
              ? "DB"
              : current.user.slice(1, 3).toUpperCase()}
          </div>
          <div>
            <h2>{current.user.replace("@", "")}</h2>
            <p>Active now - encrypted project room - {current.badge}</p>
          </div>
          <div className="chat-tools">
            <button
              className="icon-btn"
              onClick={() => notify("Video room starting...")}
            >
              V
            </button>
            <button
              className="icon-btn"
              onClick={() => notify("Audio call starting...")}
            >
              A
            </button>
            <button
              className="icon-btn"
              onClick={() => notify("Thread tools opened.")}
            >
              ...
            </button>
          </div>
        </div>
        <div className="message-canvas">
          <div className="ambient-grid" />
          {chats[active].map((m, i) => (
            <div
              key={i}
              className={`message-row ${m.sender === "me" ? "mine" : "theirs"}`}
            >
              <div className="message-bubble">
                {m.sender !== "me" && (
                  <div className="message-author">
                    {m.user} <span>{m.time}</span>
                  </div>
                )}
                <p>{m.text}</p>
                {m.code && <pre className="mono">{m.code}</pre>}
              </div>
              {m.sender === "me" && (
                <small className="receipt">{m.time} - sent securely</small>
              )}
            </div>
          ))}
        </div>
        <div className="composer-panel">
          <button
            className="icon-btn"
            onClick={() => notify("Attachment picker ready.")}
          >
            +
          </button>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message, paste code, or attach a project update..."
          />
          <button className="btn-primary" onClick={send}>
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
