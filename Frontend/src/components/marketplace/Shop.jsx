import { useState } from "react";
import { COLORS } from "../../data/colors";

/**
 * Shop Component - Browse and purchase services
 */
export default function Shop({ setPaymentOpen, notify }) {
  const [tab, setTab] = useState("All Work");
  const tabs = ["All Work", "Coding Scripts", "Courses"];
  const products = [
    {
      name: "HyperScale React Kit",
      creator: "@vector_ops",
      price: "$49.00",
      tags: ["React", "TypeScript", "Tailwind"],
      img: "🖥",
    },
    {
      name: "AuthGuard Pro V2",
      creator: "@cipher_ghost",
      price: "$120.00",
      tags: ["Node.js", "OAuth", "Redis"],
      img: "☁",
    },
    {
      name: "Mastering Microservices",
      creator: "@arch_master",
      price: "$199.00",
      tags: ["Docker", "K8s", "Go"],
      img: "🏗",
    },
    {
      name: "ScraperBot JS Edition",
      creator: "@automator_x",
      price: "$25.00",
      tags: ["Puppeteer", "Cheerio"],
      img: "🤖",
    },
    {
      name: "UI/UX Component",
      creator: "@design_ops",
      price: "$85.00",
      tags: ["Figma", "React"],
      img: "🎨",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
        Digital Marketplace Shop
      </h1>
      <p style={{ color: COLORS.muted, marginBottom: 24, fontSize: 13 }}>
        Curated assets, scripts, and educational resources built by elite
        developers.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: tab === t ? 700 : 400,
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? COLORS.bg : COLORS.muted,
                border: `1px solid ${tab === t ? "#fff" : COLORS.border}`,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          placeholder="Search marketplace..."
          style={{ padding: "6px 12px", fontSize: 12, width: 200 }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {products.map((p, i) => (
          <div key={i} className="card" style={{ overflow: "hidden" }}>
            <div
              style={{
                background: `hsl(${220 + i * 20}, 40%, 10%)`,
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                position: "relative",
              }}
            >
              {p.img}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: COLORS.green,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                {p.price}
              </div>
            </div>
            <div style={{ padding: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.3,
                  }}
                >
                  {p.name}
                </h3>
                <span
                  style={{
                    color: COLORS.muted,
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  🔖
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#1e3a5f",
                  }}
                />
                <span style={{ fontSize: 11, color: COLORS.muted }}>
                  {p.creator}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginBottom: 12,
                }}
              >
                {p.tags.map((t) => (
                  <span key={t} className="tag" style={{ fontSize: 10 }}>
                    {t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setPaymentOpen(true)}
                className="btn-ghost"
                style={{ width: "100%", fontSize: 12 }}
              >
                View Product
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
