import { useEffect } from "react";

/**
 * DevToast Component - Toast notification display
 * Automatically closes after 2.6 seconds
 */
export default function DevToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onClose, 2600);
    return () => clearTimeout(id);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="dev-toast" role="status" aria-live="polite">
      <span className="dev-toast-indicator" aria-hidden="true" />
      <span className="dev-toast-message">{message}</span>
    </div>
  );
}
