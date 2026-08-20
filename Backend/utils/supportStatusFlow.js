const supportStatusFlow = {
  Open: ["Claimed"],

  Claimed: ["In Progress"],

  "In Progress": ["Waiting For Student", "Resolved"],

  "Waiting For Student": ["In Progress", "Resolved"],

  Resolved: ["Closed"],

  Closed: [],
};

export default supportStatusFlow;
