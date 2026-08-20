// mockProfileExtras.js
//
// Everything in this file is PLACEHOLDER data.
// None of it comes from the backend yet — swap each piece out for a real
// service call as soon as the matching endpoint exists (see TODOs below).
// Keeping it in one file means deleting mock data later is a one-file diff.

// TODO: replace with GET /profile/stats (or derive from real collections)
export const MOCK_STATS = {
  projects: 12,
  products: 15,
  jobsPosted: 6,
  streams: 20,
  partnerships: 9,
};

// TODO: replace with GET /projects?owner=me
export const MOCK_PROJECTS = [
  {
    id: "p1",
    title: "DevStream Nexus",
    description: "Live streaming & collaboration platform for developers.",
    tags: ["React", "Node.js", "Socket.IO"],
    status: "Active",
    contributors: 12,
  },
  {
    id: "p2",
    title: "Nexus Marketplace",
    description: "Buy and sell digital products built by developers.",
    tags: ["React", "Stripe", "MongoDB"],
    status: "Active",
    contributors: 8,
  },
  {
    id: "p3",
    title: "AI Tutor",
    description: "AI powered coding tutor for learners and developers.",
    tags: ["Python", "LLM", "FastAPI"],
    status: "Active",
    contributors: 5,
  },
];

// TODO: replace with GET /marketplace/products?owner=me
export const MOCK_PRODUCTS = [
  { id: "prod1", title: "Node.js Mastery Course", price: 29.99 },
  { id: "prod2", title: "DevStream UI Kit", price: 19.99 },
  { id: "prod3", title: "Admin Dashboard Template", price: 24.99 },
];

// TODO: replace with GET /jobs?postedBy=me
export const MOCK_JOBS = [
  { id: "j1", title: "Full Stack Developer", status: "Open" },
  { id: "j2", title: "Backend Developer (Node.js)", status: "Open" },
  { id: "j3", title: "UI/UX Designer", status: "Open" },
];

// TODO: replace with GET /streams?hostedBy=me
export const MOCK_STREAMS = [
  { id: "s1", title: "Building Real-time Apps", viewers: 2400, live: true },
  { id: "s2", title: "Advanced React Patterns", viewers: 1800, live: true },
  { id: "s3", title: "Dev Career Roadmap", viewers: 950, live: false },
];

// TODO: replace with GET /activity?user=me
export const MOCK_ACTIVITY = [
  {
    id: "a1",
    label: "Created a new project",
    detail: "DevStream Nexus",
    when: "2h ago",
  },
  {
    id: "a2",
    label: "Uploaded a new product",
    detail: "Node.js Mastery Course",
    when: "5h ago",
  },
  {
    id: "a3",
    label: "Posted a new job",
    detail: "Full Stack Developer",
    when: "1d ago",
  },
  {
    id: "a4",
    label: "Accepted partnership",
    detail: "CodeWithSam",
    when: "2d ago",
  },
  {
    id: "a5",
    label: "Went live",
    detail: "Building Real-time Apps",
    when: "3d ago",
  },
];
