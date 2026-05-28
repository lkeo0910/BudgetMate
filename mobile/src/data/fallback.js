export const fallbackProfile = {
  brand_name: "BudgetMate",
  tagline: "Smart Financial Management",
  owner_name: "demo_user",
  username: "demo_user",
  email: "demo@example.com",
  phone: null,
  location: "Vietnam",
  avatar_initials: "DE",
  joined_label: "Joined March 2024",
  status_label: "Verified Account",
  summary:
    "BudgetMate is a polished financial management experience for tracking cash flow, budgets, categories, transactions, savings goals, and AI-assisted money insights.",
  hero_metrics: [
    { label: "Total Balance", value: "164.149.000 ₫" },
    { label: "Period Income", value: "18.000.000 ₫" },
    { label: "Savings Rate", value: "70%" },
    { label: "Budget Health", value: "100" }
  ]
};

export const fallbackProjects = [
  {
    id: 1,
    title: "Dashboard Intelligence",
    subtitle: "Cash flow at a glance",
    description:
      "Tracks total balance, spending, income, remaining budget, recent transactions, smart insights, savings goals, cashflow notes, and health score.",
    accent: "#2563eb",
    link_url: "http://54.179.178.52/dashboard",
    link_label: "Open dashboard",
    stats: [
      { label: "Balance", value: "164.149.000 ₫" },
      { label: "Transactions", value: "14" }
    ]
  },
  {
    id: 2,
    title: "Cash Flow Reports",
    subtitle: "Income, expense, and net trend reporting",
    description:
      "Shows income, expenses, net income, savings rate, period highlights, spending mix, and salary income sources.",
    accent: "#14b8a6",
    link_url: "http://54.179.178.52/reports",
    link_label: "Open reports",
    stats: [
      { label: "Income", value: "36.000.000 ₫" },
      { label: "Net", value: "25.330.000 ₫" }
    ]
  },
  {
    id: 3,
    title: "Budget Planner",
    subtitle: "Monthly category assignment",
    description:
      "Organizes expense and income categories including groceries, rent, utilities, salary, freelance, and other income.",
    accent: "#f97316",
    link_url: "http://54.179.178.52/budget",
    link_label: "Open budget",
    stats: [
      { label: "Available", value: "18.000.000 ₫" },
      { label: "Spent", value: "10.670.000 ₫" }
    ]
  },
  {
    id: 4,
    title: "AI Assistant",
    subtitle: "Real-time financial guidance",
    description:
      "A chat assistant designed to review transactions, analyze spending trends, and help create custom budgets.",
    accent: "#8b5cf6",
    link_url: "http://54.179.178.52/chat",
    link_label: "Open assistant",
    stats: [
      { label: "Status", value: "Online" },
      { label: "Mode", value: "Real-time" }
    ]
  }
];

export const fallbackSkills = [
  { id: 1, name: "Budget tracking", category: "Finance", level: 94, description: "Monthly pools, category activity, balances, income, and expenses." },
  { id: 2, name: "Cash flow forecasting", category: "Analytics", level: 88, description: "End-of-month projections from recurring transaction patterns." },
  { id: 3, name: "Transaction management", category: "Product", level: 91, description: "History, review queue, filters, CSV export, and category filing." },
  { id: 4, name: "AI insights", category: "Automation", level: 82, description: "Trend detection, savings progress, and spending suggestions." },
  { id: 5, name: "Account security", category: "Trust", level: 86, description: "Verified account state, profile details, and active sessions." },
  { id: 6, name: "Mobile UX", category: "Design", level: 90, description: "Native cards, tactile buttons, bottom tabs, and polished states." }
];

export const fallbackEducation = [
  {
    id: 1,
    title: "Financial Dashboard System",
    institution: "BudgetMate Product Lab",
    period: "2026",
    description: "A product learning track focused on finance workflows, chart reading, category planning, and dashboard decisions.",
    highlights: ["Cash flow reports", "Savings goals", "Budget health scoring"]
  },
  {
    id: 2,
    title: "Data-Driven Planning",
    institution: "BudgetMate Analytics",
    period: "2024 - Present",
    description: "Practical experience turning transaction records into insights, summaries, forecasts, and recommendations.",
    highlights: ["Spending mix", "Net trend", "Period highlights"]
  }
];

export const fallbackLeadership = [
  {
    id: 1,
    title: "Personal Finance Command Center",
    organization: "BudgetMate",
    period: "2026",
    description: "Leads the user from scattered spending records to one calm, actionable view of what changed and what to do next.",
    impact: ["Healthy cash flow score of 100", "7.330.000 ₫ savings trajectory", "14 recent transactions organized"]
  },
  {
    id: 2,
    title: "AI-Assisted Budget Coaching",
    organization: "BudgetMate AI",
    period: "2026",
    description: "Guides users through transaction review, trend analysis, and custom budget creation with an approachable assistant flow.",
    impact: ["Real-time data", "New chat workflow", "Trend explanations"]
  }
];
