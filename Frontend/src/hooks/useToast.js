import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useState,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState("");

  const notify = useCallback((message) => {
    setToast(message);
  }, []);

  const clearToast = useCallback(() => {
    setToast("");
  }, []);

  return createElement(
    ToastContext.Provider,
    { value: { toast, notify, clearToast, setToast } },
    children,
  );
}

/**
 * Custom hook for managing toast notifications
 * @returns {Object} - Object with notify function and toast message state
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
