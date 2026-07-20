/**
 * Experience page and role-specific styles
 * Includes hero sections, dashboards, and role-specific UI
 */

import { COLORS } from "../data/colors";

export const experienceStyles = `
  .dashboard-stage { padding: 24px; }
  .hero-3d { min-height: 310px; display: grid; grid-template-columns: minmax(320px, 1fr) minmax(300px, 460px); gap: 24px; align-items: center; padding: 30px; border: 1px solid rgba(148,163,184,.16); border-radius: 12px; background: linear-gradient(135deg, rgba(15,23,42,.9), rgba(8,16,31,.74)); position: relative; overflow: hidden; margin-bottom: 22px; }
  .hero-3d:after, .conversation-card:after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); transform: translateX(-120%); animation: shimmer 7s linear infinite; pointer-events: none; }
  .hero-copy { position: relative; z-index: 2; max-width: 650px; }
  .hero-copy h1 { font-size: clamp(34px, 5vw, 64px); line-height: .98; margin: 12px 0 14px; letter-spacing: 0; color: #fff; }
  .hero-copy p { max-width: 590px; color: ${COLORS.muted}; font-size: 15px; line-height: 1.7; }
  .hero-actions { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
  .orbit-scene { height: 260px; position: relative; perspective: 900px; transform-style: preserve-3d; }
  .core-orb { position: absolute; left: 50%; top: 50%; width: 120px; height: 120px; margin: -60px; border-radius: 50%; background: radial-gradient(circle at 34% 30%, #fff, ${COLORS.green} 14%, ${COLORS.purple} 58%, #111827 100%); box-shadow: 0 0 70px rgba(34,197,94,.3), 0 32px 80px rgba(0,0,0,.4); animation: orbitPulse 5s ease-in-out infinite; }
  .orbit-ring { position: absolute; inset: 42px; border: 1px solid rgba(148,163,184,.28); border-radius: 50%; transform: rotateX(62deg) rotateZ(-20deg); }
  .ring-two { inset: 74px 18px; transform: rotateX(68deg) rotateZ(24deg); border-color: rgba(34,197,94,.28); }
  .holo-card { position: absolute; min-width: 132px; padding: 14px; border: 1px solid rgba(255,255,255,.18); border-radius: 8px; background: rgba(15,23,42,.72); box-shadow: 0 18px 48px rgba(0,0,0,.28); backdrop-filter: blur(14px); animation: float3d 6s ease-in-out infinite; }
  .holo-card b { display: block; color: #fff; font-size: 22px; } .holo-card span { color: ${COLORS.muted}; font-size: 11px; }
  .card-a { left: 20px; top: 18px; } .card-b { right: 10px; top: 76px; animation-delay: -1s; } .card-c { left: 112px; bottom: 8px; animation-delay: -2s; }
  .role-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0; }
  .metric-card { padding: 18px; } .metric-card span { font-size: 28px; font-weight: 900; } .metric-card p { color: ${COLORS.muted}; margin-top: 4px; }
  .access-denied { min-height: calc(100vh - 68px); display: grid; place-items: center; padding: 30px; }
  .access-panel { width: min(620px, 100%); text-align: center; padding: 34px; border: 1px solid rgba(239,68,68,.24); border-radius: 12px; background: rgba(15,23,42,.82); box-shadow: 0 30px 80px rgba(0,0,0,.32); }
  .shield-3d { width: 110px; height: 130px; margin: 0 auto 20px; display: grid; place-items: center; color: #fff; font-weight: 900; background: linear-gradient(145deg, rgba(239,68,68,.24), rgba(168,85,247,.26)); clip-path: polygon(50% 0, 92% 18%, 84% 76%, 50% 100%, 16% 76%, 8% 18%); transform: rotateX(18deg) rotateY(-18deg); }
  .access-panel h1 { color: #fff; margin: 10px 0; } .access-panel p { color: ${COLORS.muted}; line-height: 1.7; }
  .assigned-list { display: flex; justify-content: center; gap: 8px; margin: 20px 0; } .assigned-list span { border: 1px solid rgba(34,197,94,.28); color: ${COLORS.green}; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 800; }
  .top-command { text-align: left; cursor: pointer; transition: border-color .2s, transform .2s; }
  .top-command:hover { border-color: rgba(34,197,94,.42); transform: translateY(-1px); }
  .top-actions { display: flex; align-items: center; gap: 8px; }
  .notice-popover { position: absolute; right: 24px; top: 76px; width: 300px; padding: 14px; border: 1px solid rgba(148,163,184,.2); border-radius: 10px; background: rgba(7,16,29,.96); box-shadow: 0 24px 70px rgba(0,0,0,.38); z-index: 40; }
  .notice-popover button { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 10px; border-radius: 8px; background: rgba(15,23,42,.72); color: #fff; text-align: left; border: 1px solid rgba(148,163,184,.12); }
  .notice-popover small { color: ${COLORS.muted}; }
  .page-wrap { padding: 24px; }
  .page-head { display: flex; justify-content: space-between; gap: 20px; align-items: center; margin-bottom: 20px; }
  .page-head h1 { color: #fff; font-size: clamp(28px, 4vw, 48px); line-height: 1; margin: 8px 0; }
  .page-head p { color: ${COLORS.muted}; max-width: 620px; line-height: 1.7; }
  .dimensional-head { padding: 24px; border: 1px solid rgba(148,163,184,.16); border-radius: 12px; background: linear-gradient(135deg, rgba(15,23,42,.82), rgba(8,16,31,.7)); box-shadow: 0 28px 80px rgba(0,0,0,.25); }
  .head-stat { width: 150px; height: 120px; border-radius: 12px; display: grid; place-items: center; text-align: center; background: radial-gradient(circle at 30% 20%, rgba(34,197,94,.32), rgba(168,85,247,.12)); transform: rotateX(10deg) rotateY(-12deg); }
  .head-stat strong { display: block; color: #fff; font-size: 38px; } .head-stat span { color: ${COLORS.muted}; font-size: 11px; }
  .hero-premium { min-height: 360px; }
  .student-grid { display: grid; grid-template-columns: minmax(320px, 1.4fr) minmax(260px, .8fr); gap: 18px; margin-bottom: 18px; }
  .action-console, .next-panel, .experience-card, .project-tile { border: 1px solid rgba(148,163,184,.16); border-radius: 12px; background: rgba(15,23,42,.72); box-shadow: 0 22px 60px rgba(0,0,0,.22); }
  .action-console { padding: 20px; } .action-console h2 { color: #fff; margin: 8px 0 12px; } .action-console textarea { width: 100%; min-height: 130px; resize: vertical; background: rgba(5,12,24,.72); }
  .console-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
  .next-panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .next-panel button { display: flex; justify-content: space-between; align-items: center; padding: 14px; border-radius: 9px; color: #fff; background: rgba(255,255,255,.045); border: 1px solid rgba(148,163,184,.12); }
  .next-panel span { color: ${COLORS.green}; font-size: 11px; }
  .experience-grid, .market-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .experience-card, .project-tile { position: relative; overflow: hidden; padding: 18px; min-height: 210px; transform-style: preserve-3d; transition: transform .2s, border-color .2s; }
  .experience-card:hover, .project-tile:hover { transform: translateY(-4px) rotateX(2deg); border-color: rgba(34,197,94,.28); }
  .experience-card span, .project-tile > span { color: ${COLORS.green}; font-size: 10px; letter-spacing: 1px; font-weight: 900; }
  .experience-card h3, .project-tile h3 { color: #fff; margin: 12px 0 8px; } .experience-card strong { color: #fff; font-size: 34px; } .experience-card p, .project-tile p { color: ${COLORS.muted}; line-height: 1.7; font-size: 13px; }
  .card-orbit { position: absolute; right: -40px; top: -40px; width: 120px; height: 120px; border-radius: 50%; border: 1px solid rgba(34,197,94,.18); box-shadow: inset 0 0 40px rgba(168,85,247,.14); }
  .filter-bar { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
  .select-shell { position: relative; min-width: 210px; } .select-shell > button { width: 100%; display: flex; justify-content: space-between; padding: 11px 12px; border-radius: 8px; color: #fff; background: rgba(15,23,42,.78); border: 1px solid rgba(148,163,184,.18); }
  .select-menu { position: absolute; top: 100%; left: 0; width: 100%; margin-top: 6px; padding: 6px; border-radius: 10px; background: #111a2d; border: 1px solid rgba(148,163,184,.18); z-index: 20; } .select-menu button { width: 100%; padding: 9px; color: ${COLORS.text}; background: transparent; border-radius: 7px; text-align: left; } .select-menu button:hover { background: rgba(34,197,94,.1); }
  .project-icon { width: 58px; height: 58px; display: grid; place-items: center; margin-bottom: 14px; border-radius: 14px; color: #fff; font-weight: 900; background: linear-gradient(145deg, rgba(34,197,94,.28), rgba(168,85,247,.24)); box-shadow: 0 18px 40px rgba(0,0,0,.24); transform: rotateX(12deg) rotateY(-16deg); }
  .mini-list { display: grid; gap: 6px; margin: 14px 0; } .mini-list small { color: ${COLORS.green}; background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.14); border-radius: 6px; padding: 7px; }
  .chip-row { display: flex; flex-wrap: wrap; gap: 6px; } .chip-row b { color: ${COLORS.text}; border: 1px solid rgba(148,163,184,.18); border-radius: 999px; padding: 4px 8px; font-size: 11px; }
  .tile-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 16px; } .tile-foot em { color: ${COLORS.muted}; font-style: normal; font-size: 12px; }
  .dev-toast { position: fixed; right: 24px; bottom: 24px; z-index: 2000; display: flex; align-items: center; gap: 10px; max-width: 360px; padding: 14px 16px; border-radius: 10px; color: #fff; background: rgba(7,16,29,.94); border: 1px solid rgba(34,197,94,.3); box-shadow: 0 22px 70px rgba(0,0,0,.36); } .dev-toast span { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: rgba(34,197,94,.18); color: ${COLORS.green}; font-size: 10px; font-weight: 900; }
  .main-surface .card { background: rgba(15,23,42,.72); border-color: rgba(148,163,184,.16); box-shadow: 0 18px 52px rgba(0,0,0,.2); }
  .main-surface button { transition: transform .18s, border-color .18s, background .18s; } .main-surface button:hover, .top-nav button:hover { transform: translateY(-1px); }
  @media (max-width: 980px) { .hero-3d, .chat-shell { grid-template-columns: 1fr; } .chat-rail { min-height: 300px; } .role-grid { grid-template-columns: 1fr; } .page-head { align-items: flex-start; flex-direction: column; } .head-stat { width: 100%; height: 100px; } }
`;
