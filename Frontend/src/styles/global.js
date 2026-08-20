/**
 * Global and base styles
 * Includes color variables and base element styling
 */

const COLORS = {
  bg: "#0b111e",
  surface: "#1e293b",
  border: "#334155",
  purple: "#a855f7",
  purpleDark: "#7c3aed",
  green: "#22c55e",
  amber: "#eab308",
  red: "#ef4444",
  muted: "#94a3b8",
  text: "#e2e8f0",
  textDim: "#64748b",
};

export const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root {
    max-width: 100%;
    overflow-x: hidden;
  }
  body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: 'Inter', system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${COLORS.surface}; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
  input, textarea { outline: none; background: #0f172a; border: 1px solid ${COLORS.border}; color: ${COLORS.text}; border-radius: 6px; padding: 8px 12px; font-family: inherit; font-size: 13px; }
  input:focus, textarea:focus { border-color: ${COLORS.purple}; }
  button { cursor: pointer; font-family: inherit; border: none; }
  .tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: 1px solid ${COLORS.border}; color: ${COLORS.muted}; background: #0f172a; }
  .badge-purple { background: rgba(168,85,247,0.15); color: ${COLORS.purple}; border: 1px solid rgba(168,85,247,0.3); border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .badge-green { background: rgba(34,197,94,0.15); color: ${COLORS.green}; border: 1px solid rgba(34,197,94,0.3); border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .badge-red { background: rgba(239,68,68,0.15); color: ${COLORS.red}; border: 1px solid rgba(239,68,68,0.3); border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .badge-amber { background: rgba(234,179,8,0.15); color: ${COLORS.amber}; border: 1px solid rgba(234,179,8,0.3); border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .card { background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; border-radius: 10px; }
  .btn-primary { background: ${COLORS.purple}; color: #fff; border-radius: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; transition: background 0.15s; }
  .btn-primary:hover { background: ${COLORS.purpleDark}; }
  .btn-ghost { background: transparent; color: ${COLORS.muted}; border: 1px solid ${COLORS.border}; border-radius: 6px; padding: 8px 16px; font-size: 13px; transition: all 0.15s; }
  .btn-ghost:hover { border-color: ${COLORS.purple}; color: ${COLORS.text}; }
  .btn-green { background: ${COLORS.green}; color: #fff; border-radius: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; }
  :root {
    --action-primary-start: #8b5cf6;
    --action-primary-end: #4f8ef7;
  }
  .btn-primary,
  .btn-create-project,
  .btn-accent-pill,
  .btn-follow,
  .btn-accept,
  .btn-join-stream,
  .admin-action-button:not(.admin-danger-button),
  .admin-add-user-button:not(.admin-danger-button),
  .support-create-btn,
  .ep-btn-primary,
  .ep-btn-upload,
  .pd-btn-primary,
  .pd-btn-accept,
  .cp-submit-btn,
  .btn-primary-cover,
  .msg-btn-primary,
  .td-edit-btn-save,
  .td-reply-btn,
  .cta-btn {
    background: linear-gradient(90deg, var(--action-primary-start), var(--action-primary-end)) !important;
    color: #fff !important;
  }
  .btn-primary:hover:not(:disabled),
  .btn-create-project:hover:not(:disabled),
  .btn-accent-pill:hover:not(:disabled),
  .btn-follow:hover:not(:disabled),
  .btn-accept:hover:not(:disabled),
  .btn-join-stream:hover:not(:disabled),
  .admin-action-button:not(.admin-danger-button):hover:not(:disabled),
  .admin-add-user-button:not(.admin-danger-button):hover:not(:disabled),
  .support-create-btn:hover:not(:disabled),
  .ep-btn-primary:hover:not(:disabled),
  .ep-btn-upload:hover:not(:disabled),
  .pd-btn-primary:hover:not(:disabled),
  .pd-btn-accept:hover:not(:disabled),
  .cp-submit-btn:hover:not(:disabled),
  .btn-primary-cover:hover:not(:disabled),
  .msg-btn-primary:hover:not(:disabled),
  .td-edit-btn-save:hover:not(:disabled),
  .td-reply-btn:hover:not(:disabled),
  .cta-btn:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
`;
