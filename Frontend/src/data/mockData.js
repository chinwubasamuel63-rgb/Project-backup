import { COLORS } from "./colors";

// Mock data for marketplace projects
export const marketplaceProjects = [
  {
    name: "AI-Powered Resume Parser",
    badge: "NEW",
    badgeColor: COLORS.green,
    desc: "Extract structured metadata from messy resumes with a clean LLM pipeline and audit-ready JSON output.",
    mvp: ["LLM pipeline optimization", "JSON-LD export schema"],
    stack: ["Python", "OpenAI", "FastAPI"],
    role: "ML Engineer",
    icon: "AI",
  },
  {
    name: "Distributed Vector DB",
    badge: "TRENDING",
    badgeColor: COLORS.amber,
    desc: "An edge-compatible vector database in Rust for fast semantic search and memory-safe indexing.",
    mvp: ["HNSW indexing engine", "WASM runtime support"],
    stack: ["Rust", "gRPC", "RocksDB"],
    role: "Systems Architect",
    icon: "DB",
  },
  {
    name: "Bento Grid UI Builder",
    badge: "2 DAYS LEFT",
    badgeColor: COLORS.red,
    desc: "No-code visual builder for high-end React layouts with responsive export logic.",
    mvp: ["Code generation engine", "Tailwind export"],
    stack: ["TypeScript", "Next.js", "DND Kit"],
    role: "Frontend Expert",
    icon: "UI",
  },
  {
    name: "Peer-to-Peer CDN",
    badge: "NEW",
    badgeColor: COLORS.green,
    desc: "WebRTC asset delivery mesh to reduce server cost for high-bandwidth applications.",
    mvp: ["WebRTC mesh routing", "IPFS fallback"],
    stack: ["Go", "WebRTC", "IPFS"],
    role: "Network Engineer",
    icon: "CD",
  },
];

// Mock data for live chat messages
export const initialLiveMessages = [
  {
    user: "leocoder_23",
    time: "14:05",
    text: "That borrow checker logic is super clean. Can you show the trait implementation again?",
    system: false,
  },
  {
    user: "mia_fullstack",
    time: "14:06",
    text: "Wait, doesn't Arc clone increase overhead here significantly?",
    system: false,
  },
  {
    user: "System",
    time: "",
    text: "dev_guru subscribed at Level 2!",
    system: true,
  },
  {
    user: "ben_rust_fan",
    time: "14:08",
    text: "Check the docs on Pin<P> for async streams, might help with that future issue.",
    system: false,
  },
];

// Mock data for initial standups
export const initialStandups = [
  {
    id: 1,
    user: "Alex Rivera",
    handle: "YOU",
    time: "2 hours ago",
    project: "CloudMesh Node",
    content:
      "Refactored the WebSocket handshake logic to support horizontal scaling. Switched to Redis Pub/Sub for state management across nodes. Performance increased by 22% in stress tests.",
    likes: 12,
    comments: 4,
    color: COLORS.green,
  },
  {
    id: 2,
    user: "@coder_jane",
    handle: "",
    time: "5 hours ago",
    project: "CloudMesh Node",
    content:
      "Completed the GraphQL schema migration for the core analytics module. Added depth limiters to prevent nested query DOS attacks. Ready for peer review @alex_rivera! 🚀",
    likes: 8,
    comments: 2,
    color: "",
  },
];

// Mock data for shop products
export const shopProducts = [
  {
    name: "HyperScale React Kit",
    creator: "@vector_ops",
    price: "$49.00",
    tags: ["React", "TypeScript", "Tailwind"],
    img: "🖥",
  },
  {
    name: "AuthGuard Pro V2",
    creator: "@cipher_ghost",
    price: "$120.00",
    tags: ["Node.js", "OAuth", "Redis"],
    img: "☁",
  },
  {
    name: "Mastering Microservices",
    creator: "@arch_master",
    price: "$199.00",
    tags: ["Docker", "K8s", "Go"],
    img: "🏗",
  },
  {
    name: "ScraperBot JS Edition",
    creator: "@automator_x",
    price: "$25.00",
    tags: ["Puppeteer", "Cheerio"],
    img: "🤖",
  },
  {
    name: "UI/UX Component",
    creator: "@design_ops",
    price: "$85.00",
    tags: ["Figma", "React"],
    img: "🎨",
  },
];

// Mock data for talent registry
export const talentRegistry = [
  {
    name: "Alex Rivera",
    title: "STAFF SYSTEMS ENGINEER",
    badge: "TOP 1%",
    badgeColor: COLORS.green,
    rate: "$185/hr",
    followers: "12.4k",
    views: "840k",
    stars: "4.2k",
    repos: 98,
    match: 95,
  },
  {
    name: "Sarah Chen",
    title: "BLOCKCHAIN ARCHITECT",
    badge: "PLATINUM",
    badgeColor: COLORS.purple,
    rate: "$220/hr",
    followers: "28.1k",
    views: "2.1M",
    stars: "9.1k",
    repos: 211,
    match: 91,
  },
  {
    name: "Jordan Smyth",
    title: "KUBERNETES SPECIALIST",
    badge: null,
    rate: "$210/hr",
    followers: "5.2k",
    views: "390k",
    stars: "5.2k",
    repos: 128,
    match: 98,
  },
];

// Mock data for admin audit logs
export const adminAuditLogs = [
  {
    type: "AUTH",
    text: "User 'jdoe' logged in via SSH from 192.168.1.10 - 14:32:01 EST.",
    color: COLORS.purple,
  },
  {
    type: "MARKET",
    text: "Order S82A-B7 processed, +$1,250.00 - 14:32:01 EST.",
    color: COLORS.green,
  },
  {
    type: "SYSTEM",
    text: "API latency spike detected in cluster 'eu-west' - 14:32:05 EST.",
    color: COLORS.amber,
  },
  {
    type: "AUTH",
    text: "Role modification: @jdoe_dev elevated to INSTRUCTOR",
    color: COLORS.purple,
  },
  {
    type: "MARKET",
    text: 'New project card "Kubernetes-Ready Microservices" published',
    color: COLORS.green,
  },
  {
    type: "AUTH",
    text: "User 'admin_2' logged in - 14:32:06 EST.",
    color: COLORS.purple,
  },
  {
    type: "MARKET",
    text: "Order S82A-C2 processed, +$890.00 - 14:32:08 EST.",
    color: COLORS.green,
  },
  {
    type: "SYSTEM",
    text: "DB replica shard 4 reports high IO wait - 14:32:10 EST.",
    color: COLORS.amber,
  },
  {
    type: "AUTH",
    text: "Token refreshed for session id: 0x82f...",
    color: COLORS.purple,
  },
  {
    type: "AUTH",
    text: "User 'dev_mike' logged in - 14:32:15 EST.",
    color: COLORS.purple,
  },
  {
    type: "SYSTEM",
    text: "Cluster 'us-east' health check failed (Retrying...)",
    color: COLORS.red,
  },
  {
    type: "AUTH",
    text: "Password rotation forced for @legacy_user_01",
    color: COLORS.purple,
  },
  {
    type: "MARKET",
    text: "Subscription renewed: DevStream Enterprise Plan",
    color: COLORS.green,
  },
];

// Mock data for admin users ledger
export const adminUsers = [
  {
    name: "Alex Rivera",
    handle: "@alex_dev",
    track: "Software Dev",
    trackColor: COLORS.purple,
    role: "ADMIN",
    roleColor: COLORS.purple,
    avatar: "AR",
    online: true,
  },
  {
    name: "Jordan Shield",
    handle: "@j_cyber_sec",
    track: "Cybersecurity",
    trackColor: COLORS.amber,
    role: "INSTRUCTOR",
    roleColor: COLORS.amber,
    avatar: "JS",
    online: true,
  },
  {
    name: "Liam Chen",
    handle: "@data_liam",
    track: "Data Science",
    trackColor: COLORS.green,
    role: "STUDENT",
    roleColor: COLORS.muted,
    avatar: "LC",
    online: false,
  },
  {
    name: "Sarah Jenkins",
    handle: "@sarah_ux",
    track: "UI/UX Design",
    trackColor: "#06b6d4",
    role: "STUDENT",
    roleColor: COLORS.muted,
    avatar: "SJ",
    online: true,
  },
  {
    name: "Marcus Void",
    handle: "@sys_void [LOCKED]",
    track: "N/A",
    trackColor: COLORS.textDim,
    role: "SUSPENDED",
    roleColor: COLORS.red,
    avatar: "MV",
    online: false,
  },
];

// Mock data for admin tracks
export const adminTracks = [
  {
    name: "Software Development",
    id: "TRACK_SDE_01",
    enrolled: "8.4K",
    icon: "</>",
  },
  { name: "Cybersecurity", id: "TRACK_SEC_02", enrolled: "3.1K", icon: "🛡" },
  {
    name: "Cloud Architecture",
    id: "TRACK_CLD_03",
    enrolled: "1.9K",
    icon: "☁",
  },
  {
    name: "AI & Data Science",
    id: "TRACK_AIS_04",
    enrolled: "0.8K",
    icon: "🧠",
  },
];

export const allowedFrameworks = [
  "REACT",
  "NODE.JS",
  "TYPESCRIPT",
  "DOCKER",
  "KUBERNETES",
  "GRAPHQL",
];


export const MOCK_MARKETPLACE = [
  {
    id: 1,
    title: "Custom Website Development",
    by: "Alex Developer",
    rating: 4.9,
  },
  { id: 2, title: "UI/UX Design Services", by: "Sarah Design", rating: 4.8 },
  { id: 3, title: "API Integration", by: "CodeMaster", rating: 4.7 },
];

export const MOCK_JOBS = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "DevStream Labs",
    type: "Full-time",
  },
  {
    id: 2,
    title: "Backend Developer",
    company: "TechSolutions",
    type: "Full-time",
  },
  {
    id: 3,
    title: "UI/UX Designer",
    company: "Design Studio",
    type: "Part-time",
  },
];


/* ---------------- instructor mock data ---------------- */

export const MOCK_INSTRUCTOR_STATS = [
  {
    icon: "folder",
    value: 8,
    label: "My Projects",
    sub: "Active Projects",
    color: "#a855f7",
    data: [3, 4, 5, 5, 6, 7, 8],
  },
  {
    icon: "team",
    value: 24,
    label: "Active Team Members",
    sub: "+4 this week",
    color: "#34d399",
    data: [16, 17, 19, 20, 21, 22, 24],
  },
  {
    icon: "wifi",
    value: 5,
    label: "Live Streams Hosted",
    sub: "+2 this week",
    color: "#38bdf8",
    data: [2, 2, 3, 3, 4, 4, 5],
  },
  {
    icon: "partner",
    value: 6,
    label: "Pending Partnerships",
    sub: "Requires your action",
    color: "#f59e0b",
    data: [2, 3, 3, 4, 5, 5, 6],
  },
];

export const MOCK_INSTRUCTOR_PROJECTS = [
  {
    id: 1,
    name: "DevStream Mobile App",
    desc: "Real-time dev collaboration platform",
    members: 8,
    apps: 3,
    art: "nexus",
  },
  {
    id: 2,
    name: "AI Code Assistant",
    desc: "AI-powered code suggestions",
    members: 6,
    apps: 1,
    art: "ai",
  },
  {
    id: 3,
    name: "Nexus Team Platform",
    desc: "Project management for dev teams",
    members: 10,
    apps: 2,
    art: "mobile",
  },
  {
    id: 4,
    name: "TaskFlow Productivity",
    desc: "Productivity app for developers",
    members: 5,
    apps: 0,
    art: "nexus",
  },
];

export const MOCK_INSTRUCTOR_STREAMS = [
  {
    id: 1,
    title: "Building a Scalable Web App",
    desc: "Live coding session on React, Node.js and MongoDB",
    host: "Alex Johnson",
    viewers: 126,
    art: "orb",
  },
  {
    id: 2,
    title: "UI/UX Design System Deep Dive",
    desc: "Designing scalable components with Figma",
    host: "Alex Johnson",
    viewers: 89,
    art: "ring",
  },
];

export const MOCK_INSTRUCTOR_PARTNERSHIPS = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "UI/UX Designer",
    project: "DevStream Mobile App",
  },
  {
    id: 2,
    name: "David Okafor",
    role: "Backend Developer",
    project: "AI Code Assistant",
  },
  {
    id: 3,
    name: "Daniel Kim",
    role: "Frontend Developer",
    project: "TaskFlow Productivity",
  },
];

export const MOCK_INSTRUCTOR_MESSAGES = [
  {
    id: 1,
    name: "Sarah Chen",
    text: "Hey, can you review the new design?",
    time: "2m ago",
    unread: 2,
  },
  {
    id: 2,
    name: "DevStream Team",
    text: "Project update: New features added",
    time: "1h ago",
    unread: 0,
  },
  {
    id: 3,
    name: "Mike Ross",
    text: "Let's discuss the API integration",
    time: "3h ago",
    unread: 1,
  },
  {
    id: 4,
    name: "Daniel Kim",
    text: "I have some questions about...",
    time: "6h ago",
    unread: 0,
  },
];

export const MOCK_JOB_POSTS = [
  { id: 1, title: "Frontend Developer", type: "Full-time", applications: 6 },
  { id: 2, title: "Backend Developer", type: "Full-time", applications: 7 },
  { id: 3, title: "UI/UX Designer", type: "Part-time", applications: 5 },
];

export const MOCK_SERVICES = [
  { id: 1, title: "Full Stack Web Development", price: "$1,500", inquiries: 3 },
  { id: 2, title: "UI/UX Design Service", price: "$800", inquiries: 4 },
  { id: 3, title: "API Integration", price: "$600", inquiries: 2 },
];

export const MOCK_INSTRUCTOR_NOTIFICATIONS = [
  {
    id: 1,
    icon: "partner",
    title: "Partnership request accepted",
    sub: "Sarah Chen joined your project",
    time: "2m ago",
  },
  {
    id: 2,
    icon: "chat",
    title: "New message received",
    sub: "From Sarah Chen",
    time: "5m ago",
  },
  {
    id: 3,
    icon: "folder",
    title: "New project application received",
    sub: "David Okafor applied to your project",
    time: "15m ago",
  },
  {
    id: 4,
    icon: "ticket",
    title: "Support ticket updated",
    sub: "Your ticket #12 was updated",
    time: "2h ago",
  },
  {
    id: 5,
    icon: "wifi",
    title: "Stream report generated",
    sub: '"Building a Scalable Web App" stream report is ready',
    time: "1h ago",
  },
  {
    id: 6,
    icon: "team",
    title: "New team member joined",
    sub: "Daniel Kim joined AI Code Assistant",
    time: "3h ago",
  },
];
