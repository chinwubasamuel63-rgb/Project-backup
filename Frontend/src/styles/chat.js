/**
 * Chat and messaging styles
 * Includes chat shell, messages, conversation cards
 */

import { COLORS } from "../data/colors";

export const chatStyles = `
  .chat-shell { height: calc(100vh - 68px); display: grid; grid-template-columns: 340px 1fr; }
  .chat-rail { border-right: 1px solid rgba(148,163,184,.16); background: rgba(5,12,24,.54); display: flex; flex-direction: column; padding: 16px; gap: 12px; }
  .chat-rail-head { display: flex; justify-content: space-between; align-items: center; } .chat-rail-head h2, .chat-hero-bar h2 { color: #fff; margin: 3px 0 0; }
  .chat-search { flex: 0; }
  .conversation-list { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
  .conversation-card { position: relative; overflow: hidden; display: grid; grid-template-columns: 44px 1fr auto; gap: 10px; width: 100%; padding: 12px; border: 1px solid rgba(148,163,184,.14); border-radius: 8px; background: rgba(15,23,42,.52); color: ${COLORS.text}; text-align: left; }
  .conversation-card.active { border-color: rgba(34,197,94,.34); background: rgba(34,197,94,.08); }
  .conversation-avatar { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; border: 1px solid; background: rgba(255,255,255,.04); color: #fff; font-weight: 900; }
  .conversation-avatar.large { width: 54px; height: 54px; border-radius: 16px; }
  .conversation-main { display: flex; flex-direction: column; min-width: 0; } .conversation-main strong { font-size: 13px; } .conversation-main small { color: ${COLORS.green}; font-size: 10px; margin: 2px 0 6px; } .conversation-main em { color: ${COLORS.muted}; font-size: 11px; font-style: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .conversation-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; } .conversation-meta small { color: ${COLORS.textDim}; font-size: 10px; } .conversation-meta b { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; color: #fff; background: ${COLORS.purple}; font-size: 10px; }
  .chat-main { display: flex; flex-direction: column; min-width: 0; }
  .chat-hero-bar { min-height: 84px; display: flex; align-items: center; gap: 14px; padding: 16px 22px; border-bottom: 1px solid rgba(148,163,184,.16); background: rgba(7,16,29,.52); }
  .chat-hero-bar p { color: ${COLORS.muted}; font-size: 12px; margin-top: 4px; } .chat-tools { margin-left: auto; display: flex; gap: 8px; }
  .message-canvas { flex: 1; position: relative; overflow-y: auto; padding: 26px; display: flex; flex-direction: column; gap: 18px; }
  .ambient-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(148,163,184,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.05) 1px, transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent); pointer-events: none; }
  .message-row { position: relative; z-index: 1; display: flex; flex-direction: column; max-width: min(720px, 86%); } .message-row.mine { align-self: flex-end; align-items: flex-end; } .message-row.theirs { align-self: flex-start; }
  .message-bubble { border: 1px solid rgba(148,163,184,.18); border-radius: 10px; padding: 13px 15px; background: rgba(15,23,42,.82); box-shadow: 0 16px 42px rgba(0,0,0,.24); } .mine .message-bubble { background: linear-gradient(135deg, rgba(124,58,237,.9), rgba(34,197,94,.58)); border-color: rgba(255,255,255,.2); }
  .message-author { color: ${COLORS.green}; font-size: 11px; font-weight: 800; margin-bottom: 8px; } .message-author span, .receipt { color: ${COLORS.textDim}; font-weight: 500; }
  .message-bubble p { font-size: 13px; line-height: 1.7; } .message-bubble pre { margin-top: 12px; background: rgba(5,12,24,.84); border: 1px solid rgba(34,197,94,.18); border-radius: 8px; padding: 12px; color: ${COLORS.green}; font-size: 11px; overflow: auto; }
  .receipt { margin-top: 6px; font-size: 11px; }
  .composer-panel { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-top: 1px solid rgba(148,163,184,.16); background: rgba(7,16,29,.82); } .composer-panel input { flex: 1; min-height: 42px; }
`;
