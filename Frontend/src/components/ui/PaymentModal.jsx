import { useState } from "react";
import { COLORS } from "../../data/colors";

/**
 * PaymentModal Component - Secure payment gateway modal
 * Handles payment form and processing states
 */
export default function PaymentModal({ onClose }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ name: "", card: "", expiry: "", cvc: "" });

  const handleSubmit = () => {
    setStep("processing");
    setTimeout(() => setStep("success"), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          overflow: "hidden",
          width: 720,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* Left Summary */}
        <div style={{ padding: 32, background: "#0f1a2e" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: "rgba(168,85,247,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🛡
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              Secure Payment Gateway
            </h2>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}
            >
              Itemized Order Summary
            </div>
            {[
              {
                label: "Senior React Developer Tier\nRef: MATCH-4829-X",
                price: "$1,200.00",
              },
              { label: "Platform Service Fee (3%)", price: "$36.00" },
              { label: "Priority Matching Tag", price: "$15.00" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  padding: "0 0 10px",
                  borderBottom: i < 2 ? `1px solid ${COLORS.border}` : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: i === 0 ? "#fff" : COLORS.muted,
                    fontWeight: i === 0 ? 600 : 400,
                    whiteSpace: "pre-line",
                  }}
                >
                  {item.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {item.price}
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                Total Amount
              </span>
              <span
                style={{ fontSize: 16, fontWeight: 700, color: COLORS.green }}
              >
                $1,251.00
              </span>
            </div>
          </div>
          <div
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 8,
              padding: 12,
              fontSize: 11,
              color: COLORS.green,
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span>✓</span>
              <span>
                Verified Secure Transaction. Your payment data is encrypted
                using AES-256 standards and processed via DevStream Protocol.
              </span>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div style={{ padding: 32 }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "none",
              border: "none",
              color: COLORS.muted,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>
              Credit Card Information
            </h3>
            <div style={{ display: "flex", gap: 8, fontSize: 20 }}>💳 📱</div>
          </div>

          {step === "success" ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.green,
                  marginBottom: 8,
                }}
              >
                Payment Successful!
              </div>
              <div
                style={{ fontSize: 13, color: COLORS.muted, marginBottom: 24 }}
              >
                Your access key has been generated.
              </div>
              <div
                style={{
                  background: "#0f172a",
                  border: `1px solid ${COLORS.green}`,
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 20,
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: COLORS.green,
                }}
              >
                ACCESS-KEY-4829-X-ALPHA
              </div>
              <button
                className="btn-primary"
                onClick={onClose}
                style={{ width: "100%" }}
              >
                Close & Access Platform
              </button>
            </div>
          ) : (
            <>
              {[
                {
                  label: "CARDHOLDER NAME",
                  key: "name",
                  placeholder: "ALEX MERCER",
                },
                {
                  label: "CARD NUMBER",
                  key: "card",
                  placeholder: "4532 0000 0000 0000",
                },
              ].map((f) => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: COLORS.muted,
                      marginBottom: 6,
                      letterSpacing: 1,
                    }}
                  >
                    {f.label}
                  </div>
                  <input
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 14px" }}
                  />
                </div>
              ))}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: COLORS.muted,
                      marginBottom: 6,
                      letterSpacing: 1,
                    }}
                  >
                    EXPIRY DATE
                  </div>
                  <input
                    placeholder="MM / YY"
                    style={{ width: "100%", padding: "10px 14px" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: COLORS.muted,
                      marginBottom: 6,
                      letterSpacing: 1,
                    }}
                  >
                    CVV
                  </div>
                  <input
                    placeholder="..."
                    style={{ width: "100%", padding: "10px 14px" }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <input type="checkbox" id="billing" />
                <label
                  htmlFor="billing"
                  style={{ fontSize: 12, color: COLORS.muted }}
                >
                  Billing address is same as contact information
                </label>
              </div>
              <button
                onClick={handleSubmit}
                style={{
                  width: "100%",
                  background: step === "processing" ? "#334155" : COLORS.purple,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 0",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: step === "processing" ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {step === "processing" ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        border: "2px solid #fff",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />{" "}
                    Processing...
                  </span>
                ) : (
                  <span>Complete Payment 🔒</span>
                )}
              </button>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  marginTop: 12,
                  fontSize: 11,
                  color: COLORS.muted,
                }}
              >
                <span>🔒 SSL SECURED</span>
                <span>✓ PCI COMPLIANT</span>
                <span>⚡ INSTANT AUTH</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
