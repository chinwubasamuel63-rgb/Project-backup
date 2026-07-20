import { useState, useCallback } from "react";

/**
 * Custom hook for managing modal/panel state
 * @param {boolean} initialState - Initial open/closed state
 * @returns {Object} - Object with open state and toggle/set functions
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
  };
}
