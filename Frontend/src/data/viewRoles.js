export const VIEW_ROLES = {
  // Strict, exclusive routes
  "/dashboard": "student",
  "/support": "student",

  "/instructor": "instructor",
  "/support-instructor": "instructor",

  "/admin-dashboard": "admin",
  "/admin-users": "admin",
  "/admin-tracks": "admin",

  // Shared routes (Explicitly allowing multiple roles)
  "/profile": ["student", "instructor"],
  "/projects": ["student", "instructor"],
  "/shop": ["student", "instructor"],
  "/hire": ["student", "instructor"],
  "/live": null,
  "/messages": null,
};

export function canAccess(route, assignedRoles) {
  const requiredRole = VIEW_ROLES[route];

  if (!requiredRole) return true;

  // Handle both array matching and string matching gracefully
  if (Array.isArray(requiredRole)) {
    return assignedRoles.some((role) => requiredRole.includes(role));
  }

  return assignedRoles.includes(requiredRole);
}
