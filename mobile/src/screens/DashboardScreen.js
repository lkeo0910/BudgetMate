import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { Card, EmptyState, SectionTitle } from "../components/Card";
import { ProgressBar } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { colors } from "../theme";

const goals = [
  { id: "laptop", title: "Buy a Laptop", current: 12000000, target: 20000000 },
  { id: "trip", title: "Vacation Trip", current: 8500000, target: 15000000 },
  { id: "emergency", title: "Emergency Fund", current: 24000000, target: 50000000 }
];

export default function DashboardScreen() {
  const { categories, error, hasData, loading, refresh, summary, transactions } = useFinanceData();
  const { width } = useWindowDimensions();
  const [preset, setPreset] = useState("month");
  const [selectedForecast, setSelectedForecast] = useState(null);

  const { currentTransactions, previousTransactions } = useMemo(
    () => getTransactionsForPreset(transactions, preset),
    [preset, transactions]
  );
  const dashboardSummary = useMemo(
    () => getTransactionSummary(currentTransactions, categories),
    [categories, currentTransactions]
  );
  const categoryActivity = useMemo(
    () => buildCategoryActivity(categories, currentTransactions),
    [categories, currentTransactions]
  );
  const budgetHealth = useMemo(
    () => calculateBudgetHealth(currentTransactions, previousTransactions, categories),
    [categories, currentTransactions, previousTransactions]
  );
  const insights = useMemo(
    () => generateSmartInsights(currentTransactions, previousTransactions, categories),
    [categories, currentTransactions, previousTransactions]
  );

  const recent = currentTransactions.slice(0, 6);
  const expenseCategories = categoryActivity.filter((item) => item.type === "expense");
  const spendingRows = expenseCategories
    .filter((item) => item.activity > 0)
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 5);
  const budgetRows = expenseCategories.slice(0, 3);

  const forecastPoints = useMemo(() => buildForecastPoints(currentTransactions), [currentTransactions]);

  return (
    <Screen eyebrow="Dashboard" title="Dashboard" refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load finance data" message={error} />}

      <View style={styles.rangeRow}>
        {["week", "month", "year"].map((item) => (
          <Pressable key={item} style={[styles.rangeButton, preset === item && styles.rangeActive]} onPress={() => setPreset(item)}>
            <Text style={[styles.rangeText, preset === item && styles.rangeTextActive]}>{capitalize(item)}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.rangeButton} onPress={() => setPreset("custom")}>
          <Ionicons name="calendar-outline" color={preset === "custom" ? colors.surface : colors.text} size={15} />
          <Text style={[styles.rangeText, preset === "custom" && styles.rangeTextActive]}>Custom</Text>
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard title="Total Balance" value={formatVND(summary.balance)} note={`${currentTransactions.length} transactions in range`} icon="wallet-outline" color={colors.sky} positive={summary.balance >= 0} />
        <SummaryCard title="This Period Spending" value={formatVND(dashboardSummary.expenses)} note={dashboardSummary.expenses > 0 ? "Expenses in selected period" : "No expenses yet"} icon="arrow-down-circle-outline" color={colors.rose} />
        <SummaryCard title="This Period Income" value={formatVND(dashboardSummary.income)} note={dashboardSummary.income > 0 ? "Income in selected period" : "No income yet"} icon="arrow-up-circle-outline" color={colors.success} positive />
        <SummaryCard title="Budget Remaining" value={formatVND(dashboardSummary.remainingBudget)} note={dashboardSummary.budgetLimit > 0 ? `${Math.round((dashboardSummary.remainingBudget / dashboardSummary.budgetLimit) * 100)}% of budget left` : "No budgets configured"} icon="flag-outline" color={colors.blue} positive={dashboardSummary.remainingBudget >= 0} />
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Cash Flow Forecast</Text>
            <Text style={styles.cardHelp}>Projected end-of-month balance from your transaction history.</Text>
          </View>
          <Ionicons name="arrow-up-outline" color={colors.muted} size={20} />
        </View>
        <ForecastChart points={forecastPoints} selected={selectedForecast} onSelect={setSelectedForecast} viewportWidth={width} />
        <Text style={styles.forecastText}>
          You will have <Text style={styles.forecastAmount}>{formatVND(dashboardSummary.projectedBalance)}</Text> by the end of the month
        </Text>
        <Text style={[styles.forecastChange, dashboardSummary.balance >= 0 ? styles.income : styles.expense]}>
          {dashboardSummary.balance >= 0 ? "+" : "-"}{formatVND(Math.abs(dashboardSummary.balance))} in selected range
        </Text>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          <Text style={styles.viewAll}>View all</Text>
        </View>
        {recent.map((item) => (
          <View key={item.id} style={styles.recentRow}>
            <View style={[styles.roundIcon, item.type === "INCOME" ? styles.incomeSoft : styles.neutralSoft]}>
              <Ionicons name={item.type === "INCOME" ? "cash-outline" : "receipt-outline"} color={item.type === "INCOME" ? colors.success : colors.text} size={20} />
            </View>
            <View style={styles.recentCopy}>
              <Text style={styles.recentVendor} numberOfLines={1}>{item.vendor}</Text>
              <Text style={styles.recentMeta}>{item.category} • {formatDate(item.date)}</Text>
            </View>
            <Text style={[styles.recentAmount, item.type === "INCOME" ? styles.income : styles.expense]}>
              {item.type === "INCOME" ? "+" : "-"}{formatVND(item.amount)}
            </Text>
          </View>
        ))}
        {!recent.length && <Text style={styles.emptyInline}>No recent transactions in this time range.</Text>}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Spending by Category</Text>
        {spendingRows.length ? (
          <View style={styles.donutWrap}>
            <PieApproximation rows={spendingRows} total={dashboardSummary.expenses} />
            <View style={styles.legend}>
              {spendingRows.map((item) => (
                <View key={item.id} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendName}>{item.name}</Text>
                  <Text style={styles.legendValue}>{formatVND(item.activity)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyInline}>No spending data in this time range.</Text>
        )}
      </Card>

      <Card>
        <View style={styles.cardTitleRow}>
          <Ionicons name="sparkles-outline" color={colors.primary} size={20} />
          <Text style={styles.cardTitle}>Smart Insights</Text>
        </View>
        {insights.map((item) => (
          <View key={item.id} style={styles.insightRow}>
            <Ionicons name={iconForSeverity(item.severity)} color={colorForSeverity(item.severity)} size={20} />
            <Text style={styles.insightText}>{item.text}</Text>
          </View>
        ))}
        {!insights.length && <Text style={styles.emptyInline}>No insights yet. Add more activity to surface trends.</Text>}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Savings Goals</Text>
        {goals.map((goal) => {
          const progress = Math.round((goal.current / goal.target) * 100);
          return (
            <View key={goal.id} style={styles.goalBox}>
              <View style={styles.goalTop}>
                <View>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalMeta}>{formatVND(goal.current)} of {formatVND(goal.target)}</Text>
                </View>
                <Text style={styles.goalPercent}>{progress}%</Text>
              </View>
              <ProgressBar progress={progress} color={colors.primary} />
              <Text style={styles.goalNote}>Estimated completion updates as savings activity grows.</Text>
            </View>
          );
        })}
      </Card>

      <SectionTitle title="Budget Progress" />
      {budgetRows.length ? (
        budgetRows.map((item) => <BudgetProgress key={item.id} item={item} />)
      ) : (
        <EmptyState title="No category budgets" message="No category budgets available for this range yet." />
      )}

      <Card>
        <View style={styles.cardTitleRow}>
          <Ionicons name="sparkles-outline" color={colors.primary} size={20} />
          <Text style={styles.cardTitle}>Cashflow Notes</Text>
        </View>
        <Note icon="checkmark-circle-outline" tone={colors.success} text={`Forecast ends with ${formatVND(dashboardSummary.projectedBalance)} remaining.`} />
        <Note icon={dashboardSummary.balance >= 0 ? "trending-up-outline" : "trending-down-outline"} tone={dashboardSummary.balance >= 0 ? colors.success : colors.rose} text={`Net cash flow ${dashboardSummary.balance >= 0 ? "improves" : "drops"} by ${formatVND(Math.abs(dashboardSummary.balance))}.`} />
        <Note icon="time-outline" tone={colors.sky} text={hasData ? "No major cash flow swings are forecast in this period." : "Add transactions to forecast cash flow swings."} />
      </Card>

      <Card>
        <View style={styles.cardTitleRow}>
          <Ionicons name="shield-checkmark-outline" color={colors.primary} size={20} />
          <Text style={styles.cardTitle}>Budget Health Score</Text>
        </View>
        <View style={[styles.scorePill, budgetHealth.score >= 75 ? styles.goodScore : budgetHealth.score >= 50 ? styles.warningScore : styles.poorScore]}>
          <Text style={styles.scoreText}>{budgetHealth.score}</Text>
        </View>
        <Text style={styles.scoreStatus}>{budgetHealth.status.toUpperCase()}</Text>
        <Text style={styles.scoreCopy}>{budgetHealth.explanation}</Text>
      </Card>
    </Screen>
  );
}

function SummaryCard({ title, value, note, icon, color, positive = false }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summaryValue}>{value}</Text>
        </View>
        <View style={[styles.summaryIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} color={colors.surface} size={23} />
        </View>
      </View>
      <Text style={[styles.summaryNote, positive ? styles.income : styles.expense]}>{note}</Text>
    </View>
  );
}

function PieApproximation({ rows, total }) {
  const safeTotal = Math.max(total, 1);
  const slices = rows.slice(0, 5);

  return (
    <View style={styles.pieWrap}>
      {slices.map((item, index) => {
        const percent = Math.max((item.activity / safeTotal) * 100, 4);
        return (
          <View
            key={item.id}
            style={[
              styles.pieSlice,
              {
                backgroundColor: item.color,
                width: `${Math.min(percent + 24, 72)}%`,
                height: `${Math.min(percent + 24, 72)}%`,
                transform: [{ rotate: `${index * 38}deg` }]
              }
            ]}
          />
        );
      })}
      <View style={styles.pieHole}>
        <Text style={styles.donutValue}>{formatVND(total)}</Text>
        <Text style={styles.donutLabel}>spent</Text>
      </View>
    </View>
  );
}

function BudgetProgress({ item }) {
  const percent = item.assigned ? Math.min(Math.round((item.activity / item.assigned) * 100), 100) : 0;
  const color = percent > 85 ? colors.rose : percent > 50 ? colors.amber : colors.success;

  return (
    <Card>
      <Text style={styles.budgetLabel}>{item.name}</Text>
      <View style={styles.budgetTop}>
        <Text style={styles.budgetSpent}>{formatVND(item.activity)}</Text>
        <Text style={styles.budgetLimit}>of {formatVND(item.assigned)}</Text>
      </View>
      <ProgressBar progress={percent} color={color} />
      <View style={styles.budgetFooter}>
        <Text style={[styles.budgetPercent, { color }]}>{percent}% used</Text>
        <Text style={styles.budgetLeft}>{formatVND(Math.max(item.assigned - item.activity, 0))} left</Text>
      </View>
    </Card>
  );
}

function Note({ icon, tone, text }) {
  return (
    <View style={styles.noteRow}>
      <View style={[styles.noteIcon, { backgroundColor: `${tone}18` }]}>
        <Ionicons name={icon} color={tone} size={20} />
      </View>
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

function ForecastChart({ points, selected, onSelect, viewportWidth }) {
  const width = Math.min(Math.max(viewportWidth - 72, 248), 360);
  const height = 206;
  const left = width < 290 ? 58 : 74;
  const right = 12;
  const top = 18;
  const bottom = 34;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const values = points.map((item) => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const span = Math.max(maxValue - minValue, 1);
  const ticks = [maxValue, minValue + span * 0.67, minValue + span * 0.33, minValue];
  const plotted = points.map((item, index) => {
    const x = left + (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
    const y = top + ((maxValue - item.value) / span) * chartHeight;
    return { ...item, x, y };
  });
  const linePath = plotted.map((item, index) => `${index ? "L" : "M"}${item.x},${item.y}`).join(" ");
  const active = selected ? plotted.find((item) => item.id === selected.id) : null;

  return (
    <View style={styles.forecastChartWrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {ticks.map((tick) => {
          const y = top + ((maxValue - tick) / span) * chartHeight;
          return (
            <React.Fragment key={tick}>
              <SvgText x={left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b">{formatVND(tick)}</SvgText>
              <Line x1={left} y1={y} x2={width - right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
            </React.Fragment>
          );
        })}
        <Line x1={left} y1={top} x2={left} y2={height - bottom} stroke="#94a3b8" />
        <Line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="#94a3b8" />
        <Path d={linePath} stroke={colors.success} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {plotted.map((point, index) => (
          <React.Fragment key={point.id}>
            <Circle cx={point.x} cy={point.y} r="4" fill={colors.success} />
            <Circle cx={point.x} cy={point.y} r="14" fill="transparent" onPress={() => onSelect(point)} />
            {index % 2 === 0 || index === plotted.length - 1 ? (
              <SvgText x={point.x} y={height - 9} textAnchor="middle" fontSize="9" fill="#64748b">{point.label}</SvgText>
            ) : null}
          </React.Fragment>
        ))}
        {active && (
          <React.Fragment>
            <Line x1={active.x} y1={top} x2={active.x} y2={height - bottom} stroke="#99f6e4" strokeDasharray="4 4" />
            <Rect x={Math.min(Math.max(active.x - 58, 84), width - 122)} y={Math.max(active.y - 54, 8)} width="116" height="42" rx="10" fill="#0f172a" />
            <SvgText x={Math.min(Math.max(active.x, 142), width - 64)} y={Math.max(active.y - 34, 28)} textAnchor="middle" fontSize="10" fontWeight="800" fill="#ffffff">{active.dateLabel}</SvgText>
            <SvgText x={Math.min(Math.max(active.x, 142), width - 64)} y={Math.max(active.y - 18, 44)} textAnchor="middle" fontSize="10" fill="#d1fae5">{formatVND(active.value)}</SvgText>
          </React.Fragment>
        )}
      </Svg>
    </View>
  );
}

function buildForecastPoints(transactions) {
  const sorted = [...transactions].sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const baseDate = sorted[0]?.date ? parseDate(sorted[0].date) : new Date();
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const byDay = new Map();
  sorted.forEach((item) => {
    const day = parseDate(item.date).getDate();
    const signedAmount = item.type === "INCOME" ? item.amount : -item.amount;
    byDay.set(day, (byDay.get(day) || 0) + signedAmount);
  });

  let running = 0;
  const points = [];
  for (let day = 1; day <= daysInMonth; day += day === 1 ? 2 : 2) {
    for (let cursor = points.length ? points[points.length - 1].day + 1 : 1; cursor <= day; cursor++) {
      running += byDay.get(cursor) || 0;
    }
    const date = new Date(year, month, day);
    points.push({
      id: `${year}-${month}-${day}`,
      day,
      label: `May ${day}`.replace("May", date.toLocaleDateString("en-US", { month: "short" })),
      dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      value: running
    });
  }

  if (!points.some((item) => item.day === daysInMonth)) {
    for (let cursor = points[points.length - 1]?.day + 1 || 1; cursor <= daysInMonth; cursor++) {
      running += byDay.get(cursor) || 0;
    }
    const date = new Date(year, month, daysInMonth);
    points.push({
      id: `${year}-${month}-${daysInMonth}`,
      day: daysInMonth,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      value: running
    });
  }

  return points;
}

function getTransactionsForPreset(transactions, preset) {
  const today = new Date();
  const current = getDateRange(preset, today);
  const previous = getPreviousRange(current);
  const currentTransactions = transactions.filter((item) => isDateInRange(item.date, current));
  const previousTransactions = transactions.filter((item) => isDateInRange(item.date, previous));
  return { currentTransactions, previousTransactions };
}

function getDateRange(preset, today) {
  const end = startOfDay(today);
  const start = new Date(end);

  if (preset === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  } else if (preset === "year") {
    start.setMonth(0, 1);
  } else {
    start.setDate(1);
  }

  return { from: start, to: end };
}

function getPreviousRange(range) {
  const days = Math.max(Math.round((range.to - range.from) / 86400000) + 1, 1);
  const to = new Date(range.from);
  to.setDate(to.getDate() - 1);
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  return { from, to };
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isDateInRange(value, range) {
  const date = parseDate(value);
  return date >= range.from && date <= range.to;
}

function getTransactionSummary(transactions, categories) {
  const income = transactions.filter((item) => item.type === "INCOME").reduce((total, item) => total + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === "EXPENSE").reduce((total, item) => total + item.amount, 0);
  const budgetLimit = categories.filter((item) => item.type === "expense").reduce((total, item) => total + (item.assigned || 0), 0);
  const remainingBudget = Math.max(budgetLimit - expenses, 0);
  const balance = income - expenses;
  return {
    income,
    expenses,
    balance,
    budgetLimit,
    remainingBudget,
    projectedBalance: balance
  };
}

function buildCategoryActivity(categories, transactions) {
  const spendByCategory = new Map();
  transactions
    .filter((item) => item.type === "EXPENSE")
    .forEach((item) => {
      spendByCategory.set(String(item.categoryId), (spendByCategory.get(String(item.categoryId)) || 0) + item.amount);
    });

  return categories.map((item) => ({
    ...item,
    activity: spendByCategory.get(String(item.id)) || 0
  }));
}

function generateSmartInsights(currentTransactions, previousTransactions, categories) {
  const insights = [];
  const seen = new Set();
  const currentExpenses = groupExpensesByCategory(currentTransactions);
  const previousExpenses = groupExpensesByCategory(previousTransactions);

  function add(insight) {
    if (!seen.has(insight.id) && insights.length < 5) {
      seen.add(insight.id);
      insights.push(insight);
    }
  }

  const topIncrease = Array.from(currentExpenses.entries())
    .map(([categoryId, value]) => ({ categoryId, current: value, previous: previousExpenses.get(categoryId) || 0 }))
    .filter((item) => item.previous > 0 && item.current > item.previous)
    .sort((a, b) => b.current - b.previous - (a.current - a.previous))[0];

  if (topIncrease) {
    const categoryName = getCategoryName(categories, topIncrease.categoryId);
    const percentIncrease = Math.round(((topIncrease.current - topIncrease.previous) / topIncrease.previous) * 100);
    add({
      id: `increase-${topIncrease.categoryId}`,
      severity: "warning",
      text: `${categoryName} spending is up ${percentIncrease}% versus the previous period.`
    });
  }

  getBudgetProgress(categories, currentTransactions)
    .filter((item) => item.ratio >= 0.85)
    .slice(0, 2)
    .forEach((item) => {
      add({
        id: `budget-${item.categoryId}`,
        severity: "warning",
        text: item.ratio >= 1 ? `${item.categoryName} is already over budget.` : `${item.categoryName} is at ${Math.round(item.ratio * 100)}% of budget.`
      });
    });

  const summary = getTransactionSummary(currentTransactions, categories);
  if (summary.balance > 0) {
    add({
      id: "positive-cash-flow",
      severity: "positive",
      text: `You are on track to save ${formatVND(summary.balance)} this period.`
    });
  } else if (summary.balance < 0) {
    add({
      id: "negative-cash-flow",
      severity: "warning",
      text: `Your expenses exceed income by ${formatVND(Math.abs(summary.balance))}.`
    });
  }

  const highestExpense = Array.from(currentExpenses.entries()).sort((a, b) => b[1] - a[1])[0];
  if (highestExpense) {
    add({
      id: `opportunity-${highestExpense[0]}`,
      severity: "info",
      text: `Reducing ${getCategoryName(categories, highestExpense[0])} could free up ${formatVND(highestExpense[1] * 0.1)} this period.`
    });
  }

  return insights;
}

function calculateBudgetHealth(currentTransactions, previousTransactions, categories) {
  const currentSummary = getTransactionSummary(currentTransactions, categories);
  const previousSummary = getTransactionSummary(previousTransactions, categories);
  const savingsRate = currentSummary.income > 0 ? Math.max(Math.min((currentSummary.balance / currentSummary.income) * 100, 100), -100) : 0;
  const adherence = getBudgetProgress(categories, currentTransactions);
  const averageBudgetUse = adherence.length
    ? adherence.reduce((total, item) => total + Math.min(item.ratio, 1.5), 0) / adherence.length
    : 0;
  const spendingTrend = previousSummary.expenses > 0 ? (currentSummary.expenses - previousSummary.expenses) / previousSummary.expenses : 0;
  const savingsScore = currentSummary.income === 0 && currentSummary.expenses > 0 ? 0 : clamp((savingsRate + 20) * 2, 0, 100);
  const budgetScore = clamp(100 - averageBudgetUse * 75, 0, 100);
  const billScore = 100;
  const trendScore = clamp(100 - Math.max(spendingTrend, 0) * 100, 0, 100);
  const score = Math.round(savingsScore * 0.35 + budgetScore * 0.3 + billScore * 0.2 + trendScore * 0.15);

  if (score >= 75) {
    return { score, status: "good", explanation: "Healthy cash flow, steady budgets, and bills are under control." };
  }
  if (score >= 50) {
    return { score, status: "warning", explanation: "You are stable, but spending trends or bills need attention." };
  }
  return { score, status: "poor", explanation: "Cash flow pressure is building and needs intervention soon." };
}

function getBudgetProgress(categories, transactions) {
  const activity = buildCategoryActivity(categories, transactions);
  return activity
    .filter((item) => item.type === "expense" && (item.assigned || 0) > 0)
    .map((item) => ({
      categoryId: item.id,
      categoryName: item.name,
      spent: item.activity,
      limit: item.assigned,
      ratio: item.assigned ? item.activity / item.assigned : 0
    }))
    .sort((a, b) => b.ratio - a.ratio);
}

function groupExpensesByCategory(transactions) {
  const grouped = new Map();
  transactions
    .filter((item) => item.type === "EXPENSE")
    .forEach((item) => {
      const key = String(item.categoryId);
      grouped.set(key, (grouped.get(key) || 0) + item.amount);
    });
  return grouped;
}

function getCategoryName(categories, categoryId) {
  return categories.find((item) => String(item.id) === String(categoryId))?.name || "this category";
}

function iconForSeverity(severity) {
  if (severity === "positive") return "checkmark-circle-outline";
  if (severity === "warning") return "warning-outline";
  return "time-outline";
}

function colorForSeverity(severity) {
  if (severity === "positive") return colors.success;
  if (severity === "warning") return colors.amber;
  return colors.sky;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  rangeRow: { marginHorizontal: 16, marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rangeButton: { minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 6 },
  rangeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeText: { color: colors.text, fontWeight: "900" },
  rangeTextActive: { color: colors.surface },
  summaryGrid: { marginHorizontal: 16, marginTop: 14, gap: 10 },
  summaryCard: { borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16 },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  summaryValue: { color: colors.ink, fontSize: 24, fontWeight: "900", marginTop: 7 },
  summaryIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  summaryNote: { marginTop: 12, fontSize: 12, fontWeight: "900" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  cardHelp: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  forecastChartWrap: { height: 206, marginTop: 18 },
  lineChart: { height: 155, marginTop: 18, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  linePointWrap: { flex: 1, alignItems: "center", position: "relative" },
  lineBar: { width: 10, borderRadius: 999, backgroundColor: colors.success },
  lineConnector: { position: "absolute", top: 64, right: "-48%", width: "96%", height: 3, backgroundColor: "#bbf7d0" },
  chartLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 8 },
  forecastText: { color: colors.ink, fontSize: 20, fontWeight: "900", lineHeight: 28, marginTop: 12 },
  forecastAmount: { color: colors.success },
  forecastChange: { marginTop: 8, fontWeight: "900" },
  viewAll: { color: colors.primary, fontWeight: "900" },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 66, borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 16, padding: 12, marginTop: 12 },
  roundIcon: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  incomeSoft: { backgroundColor: "#d1fae5" },
  neutralSoft: { backgroundColor: "#f1f5f9" },
  recentCopy: { flex: 1 },
  recentVendor: { color: colors.ink, fontWeight: "900" },
  recentMeta: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 3 },
  recentAmount: { maxWidth: 112, textAlign: "right", fontWeight: "900", fontSize: 12 },
  donutWrap: { marginTop: 18, alignItems: "center", gap: 18 },
  pieWrap: { width: 178, height: 178, borderRadius: 89, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  pieSlice: { position: "absolute", borderRadius: 999 },
  pieHole: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  donutValue: { color: colors.ink, fontWeight: "900", fontSize: 15, textAlign: "center" },
  donutLabel: { color: colors.muted, fontWeight: "800", fontSize: 11, marginTop: 3 },
  legend: { width: "100%", gap: 10 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, color: colors.text, fontWeight: "800" },
  legendValue: { color: colors.ink, fontWeight: "900", fontSize: 12 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 16 },
  insightText: { flex: 1, color: colors.text, lineHeight: 21, fontWeight: "700" },
  goalBox: { marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", padding: 14 },
  goalTop: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  goalTitle: { color: colors.ink, fontWeight: "900" },
  goalMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  goalPercent: { color: colors.ink, fontWeight: "900" },
  goalNote: { color: colors.muted, fontSize: 11, marginTop: 9 },
  budgetLabel: { color: colors.muted, fontWeight: "900" },
  budgetTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 10, marginBottom: 10 },
  budgetSpent: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  budgetLimit: { color: colors.muted, fontWeight: "800" },
  budgetFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  budgetPercent: { fontSize: 12, fontWeight: "900" },
  budgetLeft: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 16, padding: 14, marginTop: 12 },
  noteIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  noteText: { flex: 1, color: colors.text, lineHeight: 21, fontWeight: "700" },
  scorePill: { alignSelf: "flex-start", marginTop: 18, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  goodScore: { backgroundColor: "#dcfce7" },
  warningScore: { backgroundColor: "#fef3c7" },
  poorScore: { backgroundColor: "#ffe4e6" },
  scoreText: { color: colors.ink, fontSize: 30, fontWeight: "900" },
  scoreStatus: { color: colors.muted, marginTop: 14, fontSize: 12, fontWeight: "900" },
  scoreCopy: { color: colors.text, lineHeight: 21, marginTop: 8, fontWeight: "700" },
  emptyInline: { color: colors.muted, fontWeight: "800", lineHeight: 20, marginTop: 12 },
  income: { color: colors.success },
  expense: { color: colors.rose }
});
