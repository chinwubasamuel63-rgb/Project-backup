/**
 * App shell and layout styles
 * Includes TopNav, Sidebar, and main layout container styles
 */

import { COLORS } from "../data/colors";

export const appShellStyles = `
  @keyframes float3d { 0%, 100% { transform: translate3d(0,0,0) rotateX(58deg) rotateZ(-18deg); } 50% { transform: translate3d(0,-14px,20px) rotateX(58deg) rotateZ(8deg); } }
  @keyframes orbitPulse { 0%, 100% { transform: scale(1) rotate(0deg); opacity: .65; } 50% { transform: scale(1.08) rotate(12deg); opacity: 1; } }
  @keyframes shimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
  .app-frame {
    width: 100%;
    max-width: 100vw;
    min-height: 100vh;
    overflow-x: hidden;
    background: radial-gradient(circle at 18% 8%, rgba(34,197,94,.14), transparent 28%), radial-gradient(circle at 84% 14%, rgba(168,85,247,.18), transparent 28%), #07101d;
    color: ${COLORS.text};
  }
  .app-body { display: flex; min-height: calc(100vh - 68px); }
  .main-surface { flex: 1; overflow-y: auto; background: linear-gradient(180deg, rgba(15,23,42,.62), rgba(7,16,29,.94)); }
  .top-nav { height: 68px; display: flex; align-items: center; gap: 18px; padding: 0 24px; border-bottom: 1px solid rgba(148,163,184,.18); background: rgba(7,16,29,.82); backdrop-filter: blur(18px); position: sticky; top: 0; z-index: 20; }
  .top-title { display: flex; align-items: center; gap: 12px; min-width: 230px; }
  .pulse-dot { width: 11px; height: 11px; border-radius: 50%; box-shadow: 0 0 22px currentColor; }
  .top-kicker, .eyebrow, .mini-label { font-size: 10px; color: ${COLORS.muted}; letter-spacing: 1.4px; font-weight: 700; }
  .top-heading { font-size: 16px; font-weight: 800; color: #fff; }
  .top-search, .chat-search { flex: 1; min-width: 180px; border: 1px solid rgba(148,163,184,.18); background: rgba(15,23,42,.7); color: ${COLORS.textDim}; border-radius: 8px; padding: 10px 14px; font-size: 12px; }
  .lock-chip { font-size: 9px; color: ${COLORS.amber}; }
  .icon-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid rgba(148,163,184,.18); background: rgba(15,23,42,.7); color: ${COLORS.text}; font-weight: 800; }
  .avatar-orb { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-weight: 900; color: #fff; background: linear-gradient(135deg, ${COLORS.green}, ${COLORS.purple}); box-shadow: 0 14px 36px rgba(34,197,94,.18); }
  .shell-sidebar { width: 252px; min-height: calc(100vh - 68px); display: flex; flex-direction: column; gap: 14px; padding: 18px 14px; border-right: 1px solid rgba(148,163,184,.16); background: rgba(5,12,24,.74); backdrop-filter: blur(16px); }
  .brand-lockup { display: flex; align-items: center; gap: 12px; padding: 4px 4px 12px; }
  .brand-cube { width: 42px; height: 42px; border-radius: 9px; display: grid; place-items: center; background: linear-gradient(145deg, rgba(34,197,94,.28), rgba(168,85,247,.28)); transform: rotateX(18deg) rotateY(-22deg); box-shadow: 12px 16px 28px rgba(0,0,0,.3); }
  .brand-cube span { font-weight: 900; font-size: 12px; color: #fff; }
  .brand-title { font-size: 14px; font-weight: 800; color: #fff; }
  .brand-subtitle { font-size: 11px; color: ${COLORS.muted}; margin-top: 2px; }
  .role-mini-panel { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid rgba(148,163,184,.16); border-radius: 8px; background: rgba(15,23,42,.66); }
  .role-mini-panel span { width: 10px; height: 34px; border-radius: 99px; box-shadow: 0 0 24px currentColor; }
  .mini-value { color: #fff; font-weight: 800; margin-top: 4px; }
  .side-nav { display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .side-link { width: 100%; min-height: 42px; display: flex; align-items: center; gap: 10px; padding: 0 10px; border-radius: 8px; color: ${COLORS.muted}; background: transparent; border: 1px solid transparent; text-align: left; font-size: 13px; }
  .side-link.active { color: #fff; background: rgba(34,197,94,.1); border-color: rgba(34,197,94,.24); box-shadow: inset 0 0 0 1px rgba(255,255,255,.03); }
  .side-link.locked { opacity: .55; }
  .side-icon { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 7px; background: rgba(148,163,184,.1); font-size: 10px; font-weight: 900; color: #fff; }
  .lock-chip { margin-left: auto; }
  .sidebar-footer { padding-top: 12px; border-top: 1px solid rgba(148,163,184,.14); }
  
  /* Tablet: 1024px - 980px — Keep sidebar visible */
  @media (max-width: 1024px) {
    .top-search { display: none; }
    .shell-sidebar { width: 200px; padding: 14px 10px; }
  }
  
  /* Tablet: 980px and below — Sidebar visible but narrower */
  @media (max-width: 980px) {
    .shell-sidebar { width: 180px; padding: 12px 8px; }
    .side-nav { gap: 4px; }
    .side-link { font-size: 12px; min-height: 38px; padding: 0 8px; gap: 8px; }
    .side-icon { width: 24px; height: 24px; font-size: 9px; }
  }
  
  /* Mobile: 768px and below — Hide sidebar, show bottom nav */
  @media (max-width: 768px) {
    .shell-sidebar { display: none; }
    .app-body { min-height: calc(100vh - 138px); }
    .main-surface { padding-bottom: 0; }
  }
`;
