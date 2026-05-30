export const reportColors = ["#14b8a6", "#22c55e", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"];

export function parseDateValue(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return startOfDay(date);
}

export function formatDateValue(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : parseDateValue(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateCustomRange(range) {
  const hasFrom = !!String(range?.from || "").trim();
  const hasTo = !!String(range?.to || "").trim();
  if (!hasFrom && !hasTo) {
    return { from: null, to: null, error: "Select a start date and end date." };
  }
  if (!hasFrom || !hasTo) {
    return { from: null, to: null, error: "Select both start and end dates." };
  }

  const from = parseDateValue(range.from);
  const to = parseDateValue(range.to);
  if (!from || !to) {
    return { from: null, to: null, error: "Enter dates in YYYY-MM-DD format." };
  }
  if (from > to) {
    return { from: null, to: null, error: "Start date cannot be after end date." };
  }
  return { from, to, error: "" };
}

export function getReportRangeBounds(range, transactions, customRange = {}) {
  if (range === "custom") return validateCustomRange(customRange);

  if (range === "all") {
    const dates = transactions.map((item) => parseDateValue(item.date)).filter(Boolean).sort((a, b) => a - b);
    return { from: dates[0] || null, to: dates[dates.length - 1] || null, error: "" };
  }

  const to = startOfDay(new Date());
  const from = new Date(to);
  if (range === "1w") from.setDate(to.getDate() - 6);
  if (range === "1m") from.setMonth(to.getMonth() - 1);
  if (range === "6m") from.setMonth(to.getMonth() - 5);
  if (range === "12m") from.setMonth(to.getMonth() - 11);
  return { from: startOfDay(from), to, error: "" };
}

export function getDashboardRangeBounds(preset, customRange = {}) {
  if (preset === "custom") return validateCustomRange(customRange);

  const to = startOfDay(new Date());
  const from = new Date(to);
  if (preset === "week") {
    const day = from.getDay() || 7;
    from.setDate(from.getDate() - day + 1);
  } else if (preset === "year") {
    from.setMonth(0, 1);
  } else {
    from.setDate(1);
  }
  return { from, to, error: "" };
}

export function getPreviousRange(range) {
  if (!range?.from || !range?.to) return { from: null, to: null, error: "" };
  const days = Math.max(Math.round((range.to - range.from) / 86400000) + 1, 1);
  const to = new Date(range.from);
  to.setDate(to.getDate() - 1);
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  return { from, to, error: "" };
}

export function filterTransactionsByDate(transactions, bounds) {
  if (bounds?.error) return [];
  return transactions
    .filter((item) => {
      const date = parseDateValue(item.date);
      if (!date) return false;
      if (bounds?.from && date < bounds.from) return false;
      if (bounds?.to && date > bounds.to) return false;
      return true;
    })
    .sort((a, b) => {
      const left = parseDateValue(a.date);
      const right = parseDateValue(b.date);
      return (left?.getTime() || 0) - (right?.getTime() || 0);
    });
}

export function getTotals(transactions) {
  const income = transactions.filter((item) => item.type === "INCOME").reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + item.amount, 0);
  const net = income - expense;
  return { income, expense, net, savingsRate: income > 0 ? (net / income) * 100 : 0 };
}

export function groupByCategory(transactions, categories, type, limit = Infinity) {
  const categoryByName = new Map(categories.map((item) => [item.name, item]));
  const map = new Map();
  transactions
    .filter((item) => item.type === type)
    .forEach((item) => {
      const key = item.category || "Uncategorized";
      const current = map.get(key) || { name: key, value: 0, categoryId: item.categoryId };
      current.value += item.amount;
      if (!current.categoryId) current.categoryId = item.categoryId;
      map.set(key, current);
    });

  return Array.from(map.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      id: String(item.categoryId || item.name),
      activity: item.value,
      color: type === "EXPENSE" ? reportColors[index % reportColors.length] : categoryByName.get(item.name)?.color || "#10b981"
    }));
}

export function getRangeLabel(bounds, fallback = "Select date range") {
  if (bounds?.error) return fallback;
  if (bounds?.from && !bounds?.to) return `${formatDisplayDate(bounds.from)} - Select end date`;
  if (!bounds?.from && bounds?.to) return `Select start date - ${formatDisplayDate(bounds.to)}`;
  if (!bounds?.from || !bounds?.to) return fallback;
  return `${formatDisplayDate(bounds.from)} - ${formatDisplayDate(bounds.to)}`;
}

export function startOfDay(value) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function formatDisplayDate(value) {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
