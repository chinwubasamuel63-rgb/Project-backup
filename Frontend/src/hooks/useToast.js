import { useState, useCallback } from "react";

/**
 * Custom hook for managing toast notifications
 * @returns {Object} - Object with notify function and toast message state
 */
export function useToast() {
  const [toast, setToast] = useState("");

  const notify = useCallback((message) => {
    setToast(message);
  }, []);

  const clearToast = useCallback(() => {
    setToast("");
  }, []);

  return {
    toast,
    notify,
    clearToast,
    setToast,
  };
}
