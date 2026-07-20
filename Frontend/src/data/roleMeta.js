import { COLORS } from "./colors";

// Role metadata for UI rendering and role-specific displays
export const ROLE_META = {
  student: {
    label: "Student",
    home: "student-dashboard",
    accent: COLORS.green,
    initials: "AR",
    title: "Student Dashboard",
    subtitle:
      "Projects, mentors, live rooms, and career momentum in one focused workspace.",
  },
  instructor: {
    label: "Instructor",
    home: "instructor-dashboard",
    accent: COLORS.amber,
    initials: "IS",
    title: "Instructor Dashboard",
    subtitle:
      "Review blockers, guide cohorts, and keep technical support moving with clarity.",
  },
  admin: {
    label: "Admin",
    home: "admin-dashboard",
    accent: COLORS.purple,
    initials: "AD",
    title: "Admin Dashboard",
    subtitle:
      "Govern platform access, audit activity, and monitor marketplace health.",
  },
};
