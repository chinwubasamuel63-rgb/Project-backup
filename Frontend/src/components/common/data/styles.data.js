export const CSS_STYLES = `
* { box-sizing: border-box; }
.nexus-root {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(ellipse at 28% 15%, #0d1330 0%, #070a1a 40%, #02030a 100%);
  overflow: hidden;
  font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
  color: #e8edf7;
  padding: 28px 44px 40px;
}

.grid-floor {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 42%;
  background-image:
    linear-gradient(rgba(80,140,255,0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(80,140,255,0.16) 1px, transparent 1px);
  background-size: 44px 44px;
  transform: perspective(420px) rotateX(64deg);
  transform-origin: bottom;
  mask-image: linear-gradient(to top, rgba(0,0,0,0.95), transparent);
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.95), transparent);
  opacity: 0.6;
  pointer-events: none;
}

.nexus-header { position: relative; z-index: 6; display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 12px; }
.brand-mark { width: 40px; height: 40px; flex-shrink: 0; }
.brand-line1 { font-size: 12px; font-weight: 600; letter-spacing: 3px; color: #cfd6e8; }
.brand-line2 { font-size: 21px; font-weight: 800; letter-spacing: 6px; color: #ffffff; line-height: 1.15; }

.version-pill {
  border: 1px solid rgba(140,160,210,0.3);
  background: rgba(20,26,48,0.55);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 12px;
  color: #cfd6e8;
  display: flex; align-items: center; gap: 8px;
  backdrop-filter: blur(6px);
}
.version-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px 2px rgba(52,211,153,0.8); }

.tagline { position: relative; z-index: 6; margin-top: 26px; display: flex; gap: 14px; }
.tagline-bar { width: 4px; border-radius: 3px; background: linear-gradient(180deg,#a855f7,#34d399); }
.tagline-text { font-size: 24px; line-height: 1.32; font-weight: 300; color: #d7dcec; }
.accent-text { color: #4ade80; font-weight: 600; }

.nexus-main {
  position: relative;
  z-index: 6;
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 10px;
  margin-top: 6px;
  align-items: center;
  min-height: 600px;
}

/* ---------------- orbital hub ---------------- */
.hub-column { display: flex; justify-content: center; align-items: center; height: 100%; }
.hub3d { position: relative; width: 600px; height: 600px; }

.hub-rings-svg {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  overflow: visible;
}

.ring-group { transform-origin: 0px 0px; }
.ring-spin-a { animation: ringspin 16s linear infinite; }
.ring-spin-b { animation: ringspin 11s linear infinite reverse; }
.ring-spin-c { animation: ringspin 8s linear infinite; }
.ring-spin-d { animation: ringspin 24s linear infinite reverse; }

@keyframes ringspin {
  from { transform: rotate(0deg) scaleY(1); }
  50% { transform: rotate(180deg) scaleY(0.94); }
  to { transform: rotate(360deg) scaleY(1); }
}

.hub-core {
  position: absolute;
  top: 50%; left: 50%;
  width: 70px; height: 70px;
  transform: translate(-50%, -50%);
  display: flex; align-items: center; justify-content: center;
  z-index: 3;
  animation: corepulse 4.2s ease-in-out infinite;
  filter: drop-shadow(0 0 18px rgba(255,255,255,0.55));
}
.core-logo { width: 56px; height: 56px; }

@keyframes corepulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.07); }
}

.hub-spokes {
  position: absolute;
  top: 50%; left: 50%;
  width: 600px; height: 600px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.hex-node {
  position: absolute;
  top: 50%; left: 50%;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  animation: hexfloat 6s ease-in-out infinite;
  z-index: 4;
}
@keyframes hexfloat {
  0%, 100% { margin-top: 0px; }
  50% { margin-top: -9px; }
}

.hex-shape {
  position: relative;
  width: 72px; height: 72px;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.25s ease, filter 0.25s ease;
  cursor: pointer;
  filter: drop-shadow(0 0 10px var(--node-glow));
}
.hex-bg { position: absolute; inset: 0; width: 100%; height: 100%; }
.hex-bg polygon {
  fill: rgba(14,20,40,0.8);
  stroke: var(--node-color);
  stroke-width: 1.6;
  transition: stroke 0.25s ease, fill 0.25s ease;
}
.hex-hover { transform: scale(1.13) translateY(-3px); filter: drop-shadow(0 0 22px var(--node-glow)); }
.hex-hover .hex-bg polygon { fill: rgba(26,34,60,0.92); }

.hex-label { text-align: center; }
.hex-title { font-size: 12px; font-weight: 700; letter-spacing: 1.4px; color: #f1f5fb; }
.hex-sub { font-size: 10.5px; color: #9aa6c2; margin-top: 1px; }

/* ---------------- login tablet ---------------- */
.login-column { display: flex; justify-content: center; perspective: 1600px; }

.tablet-wrap {
  position: relative;
  animation: tabletfloat 7s ease-in-out infinite;
}
@keyframes tabletfloat {
  0%, 100% { transform: rotateY(-9deg) rotateX(3deg) translateY(0px); }
  50% { transform: rotateY(-7deg) rotateX(2deg) translateY(-10px); }
}

.tablet-bezel {
  width: 432px;
  border-radius: 30px;
  padding: 3px;
  background: linear-gradient(160deg, #b487ff 0%, #6ee0ff 45%, #5af0c2 100%);
  box-shadow:
    0 40px 90px -20px rgba(90,40,200,0.55),
    0 0 80px rgba(80,220,180,0.18),
    0 10px 40px rgba(0,0,0,0.5);
}

.tablet-screen {
  background: linear-gradient(165deg, rgba(10,13,28,0.97), rgba(8,10,22,0.99));
  border-radius: 28px;
  overflow: hidden;
  position: relative;
}
.tablet-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 85% -10%, rgba(168,85,247,0.18), transparent 55%);
  pointer-events: none;
}

.login-tabs {
  display: flex;
  padding: 14px 14px 0;
  gap: 6px;
}
.login-tab {
  flex: 1;
  padding: 13px 0;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: #8d97b8;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}
.login-tab.active {
  color: #ffffff;
  background: linear-gradient(90deg, #8b5cf6, #4f8ef7);
  box-shadow: 0 6px 18px -4px rgba(139,92,246,0.55);
}

.login-body { padding: 22px 28px 26px; position: relative; z-index: 1; }
.eyebrow { font-size: 11px; letter-spacing: 2px; color: #6ee7b7; font-weight: 700; }
.login-title { font-size: 23px; font-weight: 700; margin: 7px 0 4px; color: #ffffff; }
.login-subtitle { font-size: 13px; color: #92a0c2; margin: 0 0 20px; }

.field-label { font-size: 12px; color: #aab4d1; display: block; margin: 13px 0 6px; }
.input-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  background: rgba(6,9,20,0.7);
  border: 1px solid rgba(120,135,180,0.25);
  border-radius: 11px;
  padding: 0 13px;
  height: 44px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-wrap:focus-within { border-color: #7ef0ff; box-shadow: 0 0 0 3px rgba(126,240,255,0.12); }
.input-wrap input { flex: 1; background: transparent; border: none; outline: none; color: #eef1fa; font-size: 13.5px; height: 100%; padding: 0 4px; vertical-align: middle; line-height: 1.5; }
.input-wrap input::placeholder { color: #5d6786; }
/* Force the autofill background to match your design */
.input-wrap input:-webkit-autofill,
.input-wrap input:-webkit-autofill:hover,
.input-wrap input:-webkit-autofill:focus {
  -webkit-text-fill-color: #eef1fa; /* Keeps your text color */
  -webkit-box-shadow: 0 0 0px 1000px rgba(6, 9, 20, 0.7) inset; /* Matches your background */
  transition: background-color 5000s ease-in-out 0s; /* Prevents the browser from reverting the color */
}
.eye-btn { background: transparent; border: none; cursor: pointer; display: flex; padding: 4px; }

.row-between { display: flex; align-items: center; justify-content: space-between; margin: 14px 0 20px; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #aab4d1; cursor: pointer; }
.checkbox-row input { width: 14px; height: 14px; accent-color: #34d399; }
.link-muted { font-size: 12px; color: #6ee7b7; text-decoration: none; }
.link-muted:hover { text-decoration: underline; }

.cta-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(90deg, #8b5cf6, #4f8ef7, #34d399);
  color: #05140d;
  font-size: 14.5px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer;
  transition: filter 0.2s ease, transform 0.15s ease;
  box-shadow: 0 10px 30px -8px rgba(120,100,240,0.6);
}
.cta-btn:hover { filter: brightness(1.08); }
.cta-btn:active { transform: scale(0.98); }
.cta-btn:disabled { opacity: 0.7; cursor: default; }

.divider { display: flex; align-items: center; gap: 10px; margin: 20px 0 15px; color: #5d6786; font-size: 11px; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08); }

.oauth-btn {
  width: 100%;
  height: 44px;
  border-radius: 11px;
  border: 1px solid rgba(140,150,190,0.22);
  background: rgba(255,255,255,0.03);
  color: #e3e7f4;
  font-size: 13.5px;
  font-weight: 500;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  cursor: pointer;
  margin-bottom: 9px;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.oauth-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(160,180,230,0.4); }

.secure-line { text-align: center; font-size: 11.5px; color: #7c87a8; margin-top: 16px; }

/* ---------------- bottom row ---------------- */
.bottom-row { position: relative; z-index: 6; display: grid; grid-template-columns: 0.85fr 1.6fr; gap: 18px; margin-top: 18px; }

.glass-panel {
  background: rgba(8,11,24,0.55);
  border: 1px solid rgba(120,140,200,0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  padding: 15px 17px;
}

.feed-panel { display: flex; flex-direction: column; }
.feed-header { font-size: 11px; letter-spacing: 1.5px; color: #9aa6c2; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 11px; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px 2px rgba(52,211,153,0.7); animation: blink 1.6s ease-in-out infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

.feed-list { display: flex; flex-direction: column; gap: 10px; flex: 1; }
.feed-row { display: flex; align-items: center; gap: 10px; font-size: 12.5px; animation: fadein 0.5s ease both; }
@keyframes fadein { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
.feed-icon { width: 24px; height: 24px; border-radius: 50%; background: rgba(120,200,255,0.1); display: flex; align-items: center; justify-content: center; color: #7ef0ff; flex-shrink: 0; }
.feed-text { flex: 1; color: #d9deee; }
.feed-time { color: #6b7494; font-size: 11px; flex-shrink: 0; }
.feed-footer { font-size: 11px; color: #6b7494; margin-top: 13px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 11px; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card { display: flex; flex-direction: column; gap: 5px; animation: fadein 0.6s ease both; transition: transform 0.2s ease, border-color 0.2s ease; }
.stat-card:hover { transform: translateY(-4px); border-color: rgba(120,200,255,0.3); }
.stat-value { font-size: 21px; font-weight: 700; color: #ffffff; }
.stat-label { font-size: 10px; letter-spacing: 1px; color: #8a95b6; margin-bottom: 3px; }

.nexus-footer { position: relative; z-index: 6; text-align: center; margin-top: 28px; font-size: 11.5px; letter-spacing: 3px; color: #6b7494; }
.nexus-footer .dot { color: #4a5278; margin: 0 4px; }

@media (max-width: 1100px) {
  .nexus-main { grid-template-columns: 1fr; }
  .hub3d { width: 460px; height: 460px; transform: scale(0.85); }
  .bottom-row { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 820px) {
  .nexus-root {
    padding: 18px 16px 28px;
  }

  .nexus-header {
    align-items: flex-start;
    gap: 12px;
  }

  .brand-line2 {
    font-size: 18px;
    letter-spacing: 4px;
  }

  .tagline {
    margin-top: 18px;
  }

  .tagline-text {
    font-size: 20px;
  }

  .nexus-main {
    min-height: auto;
    margin-top: 12px;
    gap: 18px;
  }

  .hub-column {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
  }

  .hub3d {
    width: 360px;
    height: 360px;
    transform: scale(0.82);
  }

  .nexus-main {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .login-column {
    width: 100%;
    justify-content: center;
  }

  .tablet-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .tablet-bezel {
    width: min(100%, 430px);
  }
}

@media (max-width: 560px) {
  .nexus-root {
    padding: 14px 12px 24px;
  }

  .brand {
    gap: 10px;
  }

  .brand-mark {
    width: 32px;
    height: 32px;
  }

  .brand-line1 {
    font-size: 10px;
    letter-spacing: 2.2px;
  }

  .brand-line2 {
    font-size: 15px;
    letter-spacing: 3px;
  }

  .version-pill {
    padding: 6px 10px;
    font-size: 11px;
  }

  .tagline-bar {
    width: 3px;
  }

  .tagline-text {
    font-size: 17px;
    line-height: 1.4;
  }

  .hub-column {
    display: flex;
    width: 100%;
  }

  .hub3d {
    width: 280px;
    height: 280px;
    transform: scale(0.7);
  }

  .login-tabs {
    gap: 5px;
    padding: 10px 10px 0;
  }

  .login-tab {
    font-size: 13px;
    padding: 11px 0;
  }

  .login-body {
    padding: 18px 16px 20px;
  }

  .login-title {
    font-size: 20px;
  }

  .login-subtitle {
    font-size: 12px;
    margin-bottom: 16px;
  }

  .field-label {
    margin-top: 10px;
  }

  .input-wrap {
    height: 42px;
  }

  .row-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin: 12px 0 16px;
  }

  .cta-btn {
    height: 44px;
  }

  .divider {
    margin-top: 18px;
  }

  .oauth-btn {
    height: 42px;
    font-size: 12.8px;
  }

  .secure-line {
    line-height: 1.5;
    margin-top: 14px;
  }
}

@media (max-width: 420px) {
  .tablet-bezel {
    width: 100%;
    border-radius: 24px;
  }

  .tablet-screen {
    border-radius: 22px;
  }

  .login-tabs {
    padding-top: 8px;
  }

  .login-body {
    padding: 16px 14px 18px;
  }

  .input-wrap {
    gap: 7px;
    padding: 0 10px;
  }
}
`;
