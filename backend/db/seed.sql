truncate table contact_messages, leadership, education, skills, projects, profile restart identity cascade;

insert into profile (
  brand_name, tagline, owner_name, username, email, phone, location, summary,
  avatar_initials, joined_label, status_label, hero_metrics
) values (
  'BudgetMate',
  'Smart Financial Management',
  'demo_user',
  'demo_user',
  'demo@example.com',
  null,
  'Vietnam',
  'BudgetMate is a polished financial management experience for tracking cash flow, budgets, categories, transactions, savings goals, and AI-assisted money insights.',
  'DE',
  'Joined March 2024',
  'Verified Account',
  '[{"label":"Total Balance","value":"164.149.000 ₫"},{"label":"Period Income","value":"18.000.000 ₫"},{"label":"Savings Rate","value":"70%"},{"label":"Budget Health","value":"100"}]'::jsonb
);

insert into projects (title, subtitle, description, accent, link_url, link_label, stats, sort_order) values
('Dashboard Intelligence', 'Cash flow at a glance', 'Tracks total balance, spending, income, remaining budget, recent transactions, smart insights, savings goals, cashflow notes, and health score in one fast mobile summary.', '#2563eb', 'http://54.179.178.52/dashboard', 'Open dashboard', '[{"label":"Balance","value":"164.149.000 ₫"},{"label":"Transactions","value":"14"}]'::jsonb, 1),
('Cash Flow Reports', 'Income, expense, and net trend reporting', 'Shows total income, total expenses, net income, savings rate, strongest periods, weakest periods, spending mix, and salary income sources.', '#14b8a6', 'http://54.179.178.52/reports', 'Open reports', '[{"label":"Income","value":"36.000.000 ₫"},{"label":"Net","value":"25.330.000 ₫"}]'::jsonb, 2),
('Budget Planner', 'Monthly category assignment', 'Organizes expense and income categories, including groceries, rent, shopping, utilities, entertainment, transport, salary, freelance, and other income.', '#f97316', 'http://54.179.178.52/budget', 'Open budget', '[{"label":"Available","value":"18.000.000 ₫"},{"label":"Spent","value":"10.670.000 ₫"}]'::jsonb, 3),
('AI Assistant', 'Real-time financial guidance', 'A chat assistant designed to review transactions, analyze spending trends, and help create custom budgets.', '#8b5cf6', 'http://54.179.178.52/chat', 'Open assistant', '[{"label":"Status","value":"Online"},{"label":"Mode","value":"Real-time"}]'::jsonb, 4);

insert into skills (name, category, level, description, sort_order) values
('Budget tracking', 'Finance', 94, 'Monthly budget pools, category activity, available balances, and clear separation between income and expense categories.', 1),
('Cash flow forecasting', 'Analytics', 88, 'Projected end-of-month balance using recurring patterns from transaction history.', 2),
('Transaction management', 'Product', 91, 'Full transaction history, pending review queue, filters, CSV export, and category filing.', 3),
('AI insights', 'Automation', 82, 'Smart insights for spending increases, savings progress, and category reduction opportunities.', 4),
('Account security', 'Trust', 86, 'Verified account state, active session handling, and profile details for a secured finance experience.', 5),
('Mobile UX', 'Design', 90, 'Native card layout, tactile buttons, bottom tabs, animated content, and clean loading and empty states.', 6);

insert into education (title, institution, period, description, highlights, sort_order) values
('Financial Dashboard System', 'BudgetMate Product Lab', '2026', 'A product learning track focused on personal finance workflows, chart reading, category planning, and dashboard decision-making.', '["Cash flow reports", "Savings goals", "Budget health scoring"]'::jsonb, 1),
('Data-Driven Planning', 'BudgetMate Analytics', '2024 - Present', 'Practical experience turning transaction records into insights, summaries, forecasts, and recommendations.', '["Spending mix", "Net trend", "Period highlights"]'::jsonb, 2);

insert into leadership (title, organization, period, description, impact, sort_order) values
('Personal Finance Command Center', 'BudgetMate', '2026', 'Leads the user from scattered spending records to one calm, actionable view of what changed and what to do next.', '["Healthy cash flow score of 100", "7.330.000 ₫ savings trajectory", "14 recent transactions organized"]'::jsonb, 1),
('AI-Assisted Budget Coaching', 'BudgetMate AI', '2026', 'Guides users through transaction review, trend analysis, and custom budget creation with an approachable assistant flow.', '["Real-time data", "New chat workflow", "Trend explanations"]'::jsonb, 2);
