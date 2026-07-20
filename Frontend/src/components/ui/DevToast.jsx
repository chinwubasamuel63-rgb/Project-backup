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
    <div className="dev-toast">
      <span>OK</span>
      {message}
    </div>
  );
}
