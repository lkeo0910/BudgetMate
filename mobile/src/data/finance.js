export const formatVND = (value) => `${Math.round(value).toLocaleString("vi-VN")} ₫`;

export const transactions = [
  { id: "t1", date: "2026-05-28", vendor: "Company Inc.", note: "Monthly Salary - May", category: "Salary", type: "INCOME", amount: 18000000 },
  { id: "t2", date: "2026-05-25", vendor: "VNPT", note: "Internet bill", category: "Utilities", type: "EXPENSE", amount: 250000 },
  { id: "t3", date: "2026-05-23", vendor: "Pharmacity", note: "Sunscreen and skincare", category: "Healthcare", type: "EXPENSE", amount: 230000 },
  { id: "t4", date: "2026-05-21", vendor: "BigC", note: "Grocery shopping", category: "Groceries", type: "EXPENSE", amount: 520000 },
  { id: "t5", date: "2026-05-19", vendor: "Steam", note: "DLC purchase", category: "Entertainment", type: "EXPENSE", amount: 180000 },
  { id: "t6", date: "2026-05-15", vendor: "Zara", note: "New jeans", category: "Shopping", type: "EXPENSE", amount: 1100000 },
  { id: "t7", date: "2026-05-12", vendor: "Spotify", note: "Monthly subscription", category: "Entertainment", type: "EXPENSE", amount: 59000 },
  { id: "t8", date: "2026-05-10", vendor: "Co.op Mart", note: "Weekly grocery run", category: "Groceries", type: "EXPENSE", amount: 495000 },
  { id: "t9", date: "2026-05-08", vendor: "Shopee", note: "Home decor items", category: "Shopping", type: "EXPENSE", amount: 620000 },
  { id: "t10", date: "2026-05-07", vendor: "EVN", note: "Electricity bill", category: "Utilities", type: "EXPENSE", amount: 810000 },
  { id: "t11", date: "2026-05-05", vendor: "Landlord", note: "Monthly rent", category: "Rent", type: "EXPENSE", amount: 6500000 },
  { id: "t12", date: "2026-05-01", vendor: "VinMart", note: "Grocery shopping", category: "Groceries", type: "EXPENSE", amount: 435000 }
];

export const categories = [
  { id: "c1", name: "Groceries", type: "expense", icon: "cart-outline", assigned: 2500000, activity: 1518000, color: "#14b8a6" },
  { id: "c2", name: "Rent", type: "expense", icon: "home-outline", assigned: 6500000, activity: 6500000, color: "#f97316" },
  { id: "c3", name: "Shopping", type: "expense", icon: "bag-outline", assigned: 2500000, activity: 1720000, color: "#8b5cf6" },
  { id: "c4", name: "Utilities", type: "expense", icon: "receipt-outline", assigned: 1400000, activity: 1060000, color: "#2563eb" },
  { id: "c5", name: "Entertainment", type: "expense", icon: "film-outline", assigned: 700000, activity: 499000, color: "#d97706" },
  { id: "c6", name: "Healthcare", type: "expense", icon: "medkit-outline", assigned: 500000, activity: 230000, color: "#e11d48" },
  { id: "c7", name: "Salary", type: "income", icon: "cash-outline", assigned: 18000000, activity: 18000000, color: "#059669" },
  { id: "c8", name: "Freelance", type: "income", icon: "briefcase-outline", assigned: 6000000, activity: 0, color: "#0284c7" }
];

export const goals = [
  { id: "g1", title: "Buy a Laptop", current: 12000000, target: 20000000, color: "#14b8a6" },
  { id: "g2", title: "Vacation Trip", current: 8500000, target: 15000000, color: "#2563eb" },
  { id: "g3", title: "Emergency Fund", current: 24000000, target: 50000000, color: "#f97316" }
];

export const insights = [
  { id: "i1", severity: "warning", text: "Groceries spending is up 42% versus the previous period." },
  { id: "i2", severity: "positive", text: "You are on track to save 7.330.000 ₫ this period." },
  { id: "i3", severity: "info", text: "Reducing rent could free up 650.000 ₫ this period." }
];

export const accounts = [
  { id: "a1", title: "Bank Accounts", subtitle: "Connected checking and savings accounts", icon: "business-outline", color: "#0284c7" },
  { id: "a2", title: "Cards", subtitle: "Credit and debit cards can be added here", icon: "card-outline", color: "#8b5cf6" },
  { id: "a3", title: "Safe Sync", subtitle: "Balances sync without affecting goals", icon: "shield-checkmark-outline", color: "#059669" }
];

export const summary = {
  balance: 164149000,
  income: 18000000,
  expenses: 10670000,
  budgetLimit: 34480000,
  remainingBudget: 23810000,
  savingsRate: 70,
  health: 100,
  projectedBalance: 171479000
};
