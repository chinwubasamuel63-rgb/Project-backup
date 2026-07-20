import { useState, useCallback } from "react";

/**
 * Custom hook for managing view/page state and navigation
 * @returns {Object} - Object with view state and setter
 */
export function useViewNavigation(initialView = "student-dashboard") {
  const [view, setView] = useState(initialView);

  const navigateTo = useCallback((nextView) => {
    setView(nextView);
  }, []);

  return {
    view,
    setView,
    navigateTo,
  };
}
