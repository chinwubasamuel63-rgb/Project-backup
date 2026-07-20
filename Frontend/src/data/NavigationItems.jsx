/* ===========================================================
   navigationItems.js
   Same ids, labels, and role structure as before — only the
   `icon` field changed from a 2-letter string to a real
   inline SVG icon (JSX), matching the Nexus visual language.
   =========================================================== */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const Icons = {
  // Dashboard (student / instructor / admin)
  dashboard: (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.6" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.6" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.6" />
    </svg>
  ),

  // Portfolio
  portfolio: (
    <svg {...iconProps}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A2 2 0 0110 3.5h4A2 2 0 0116 5.5V7" />
    </svg>
  ),

  // Marketplace
  Projects: (
    <svg {...iconProps}>
      <path d="M4 5h2l1.6 9.4a1.5 1.5 0 001.5 1.3h6.6a1.5 1.5 0 001.5-1.2l1.3-6.5H7" />
      <circle cx="9.5" cy="19" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="19" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),

  // Live Rooms
  live: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M8.5 13.2a5 5 0 017 0" />
      <path d="M5.8 10.4a9 9 0 0112.4 0" />
    </svg>
  ),

  // Chat / Cohort Chat
  chat: (
    <svg {...iconProps}>
      <path d="M4 5.5h16v10H9.5L5 19v-3.5H4v-10z" />
      <circle cx="8.3" cy="10.4" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10.4" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="10.4" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),

  // Shop
  shop: (
    <svg {...iconProps}>
      <path d="M4 8.5l1.4-4h13.2l1.4 4" />
      <rect x="3.5" y="8.5" width="17" height="11" rx="1.6" />
      <path d="M9 12.5a3 3 0 006 0" />
    </svg>
  ),

  // Hire Talent
  hire: (
    <svg {...iconProps}>
      <circle cx="9" cy="8.5" r="2.6" />
      <path d="M3.5 18c.6-2.8 2.7-4.4 5.5-4.4s4.9 1.6 5.5 4.4" />
      <circle cx="16.5" cy="9" r="2.1" />
      <path d="M15 13.8c2.2.2 3.8 1.6 4.3 4" />
    </svg>
  ),

  // Support
  support: (
    <svg {...iconProps}>
      <path d="M12 3.5l7 2.7v5.4c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6.2l7-2.7z" />
      <path d="M9.2 12l2 2 3.6-4.2" />
    </svg>
  ),

  // Blocker Queue (instructor)
  blockerQueue: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.2 1.9" />
    </svg>
  ),

  // Access Ledger (admin)
  accessLedger: (
    <svg {...iconProps}>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),

  // Track Control (admin)
  trackControl: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 000-2l2-1.5-2-3.4-2.3.6a8 8 0 00-1.7-1l-.4-2.4H9.9l-.4 2.4a8 8 0 00-1.7 1l-2.3-.6-2 3.4L5.5 11a7.97 7.97 0 000 2l-2 1.5 2 3.4 2.3-.6a8 8 0 001.7 1l.4 2.4h4.1l.4-2.4a8 8 0 001.7-1l2.3.6 2-3.4-2-1.5z" />
    </svg>
  ),
};

export const navByRole = {
  student: [
    {
      id: "/dashboard",
      label: "Student Dashboard",
      icon: Icons.dashboard,
    },
    {
      id: "/profile",
      label: "Profile",
      icon: Icons.portfolio,
    },
    {
      id: "/projects",
      label: "Projects",
      icon: Icons.Projects,
    },
    {
      id: "/live",
      label: "Live Rooms",
      icon: Icons.live,
    },
    {
      id: "/messages",
      label: "Chat",
      icon: Icons.chat,
    },
    {
      id: "/shop",
      label: "Shop",
      icon: Icons.shop,
    },
    {
      id: "/hire",
      label: "Hire Talent",
      icon: Icons.hire,
    },
    {
      id: "/support",
      label: "Support",
      icon: Icons.support,
    },
  ],

  instructor: [
    {
      id: "/instructor",
      label: "Instructor Dashboard",
      icon: Icons.dashboard,
    },
    {
      id: "/support-instructor",
      label: "Blocker Queue",
      icon: Icons.blockerQueue,
    },
    {
      id: "/projects",
      label: "Projects",
      icon: Icons.Projects,
    },
    {
      id: "/live",
      label: "Live Rooms",
      icon: Icons.live,
    },
    {
      id: "/messages",
      label: "Cohort Chat",
      icon: Icons.chat,
    },
    {
      id: "/shop",
      label: "Shop",
      icon: Icons.shop,
    },
    {
      id: "/hire",
      label: "Hire Talent",
      icon: Icons.hire,
    },
    {
      id: "/profile",
      label: "Profile",
      icon: Icons.portfolio,
    },
  ],

  admin: [
    {
      id: "/admin-dashboard",
      label: "Admin Dashboard",
      icon: Icons.dashboard,
    },
    {
      id: "/admin-users",
      label: "Access Ledger",
      icon: Icons.accessLedger,
    },
    {
      id: "/admin-tracks",
      label: "Track Control",
      icon: Icons.trackControl,
    },
  ],
};
