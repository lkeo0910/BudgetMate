import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { updateCategory } from "../api/client";
import { formatVND } from "../data/finance";
import { useAuth } from "../context/AuthContext";
import { useFinanceData } from "../hooks/useFinanceData";
import { Screen } from "../components/Layout";
import { colors } from "../theme";

export default function BudgetScreen() {
  const auth = useAuth();
  const { categories, error, loading, refresh, transactions } = useFinanceData();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [manualAvailableInput, setManualAvailableInput] = useState("");
  const [manualAvailable, setManualAvailable] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState("");

  const monthTransactions = useMemo(
    () => transactions.filter((item) => isSameMonth(item.date, selectedMonth)),
    [selectedMonth, transactions]
  );
  const expenseByCategory = useMemo(() => groupByCategory(monthTransactions, "EXPENSE"), [monthTransactions]);
  const incomeByCategory = useMemo(() => groupByCategory(monthTransactions, "INCOME"), [monthTransactions]);
  const expenseRows = useMemo(
    () => categories
      .filter((item) => item.type === "expense")
      .map((item) => buildBudgetRow(item, expenseByCategory))
      .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name)),
    [categories, expenseByCategory]
  );
  const incomeRows = useMemo(
    () => categories
      .filter((item) => item.type === "income")
      .map((item) => buildBudgetRow(item, incomeByCategory)),
    [categories, incomeByCategory]
  );
  const incomeThisMonth = incomeRows.reduce((total, item) => total + item.activity, 0);
  const totalAssigned = expenseRows.reduce((total, item) => total + item.assigned, 0);
  const totalSpent = expenseRows.reduce((total, item) => total + item.activity, 0);
  const moneyLeftFromPreviousMonths = transactions
    .filter((item) => parseDate(item.date) < new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1))
    .reduce((total, item) => total + (item.type === "INCOME" ? item.amount : -item.amount), 0);
  const availableToAssign = manualAvailable + incomeThisMonth - totalAssigned;

  function changeMonth(offset) {
    setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function saveManualAvailable() {
    setManualAvailable(Number(manualAvailableInput) || 0);
  }

  async function saveAssignment(item) {
    const draft = drafts[item.id] ?? String(item.assigned || "");
    setSaveError("");
    setSavingId(item.id);
    try {
      await updateCategory(auth.access_token, item.id, {
        monthly_limit: draft.trim() === "" ? null : Number(draft)
      });
      await refresh();
    } catch (err) {
      setSaveError(err.response?.data?.detail || err.message || "Could not save assigned amount.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Screen eyebrow="Budget" title="Budget" refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load budget" message={error} />}

      <Card style={styles.heroCard}>
        <View>
          <Text style={styles.eyebrow}>Budget</Text>
          <View style={styles.monthRow}>
            <Pressable style={styles.monthButton} onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" color={colors.ink} size={18} />
            </Pressable>
            <Text style={styles.monthTitle}>{monthLabel(selectedMonth)}</Text>
            <Pressable style={styles.monthButton} onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" color={colors.ink} size={18} />
            </Pressable>
          </View>
        </View>

        <View style={styles.availableBox}>
          <View style={styles.availableTop}>
            <View style={styles.availableIcon}>
              <Ionicons name="wallet-outline" color={colors.primary} size={18} />
            </View>
            <View>
              <Text style={styles.smallMuted}>Available To Assign</Text>
              <Text style={[styles.availableValue, availableToAssign < 0 && styles.expense]}>{formatVND(availableToAssign)}</Text>
            </View>
          </View>
          <View style={styles.manualRow}>
            <TextInput
              value={manualAvailableInput}
              onChangeText={setManualAvailableInput}
              placeholder="Add manual available amount"
              keyboardType="numeric"
              placeholderTextColor={colors.muted}
              style={styles.manualInput}
            />
            <Pressable style={styles.saveAmountButton} onPress={saveManualAvailable}>
              <Text style={styles.saveAmountText}>Save Amount</Text>
            </Pressable>
          </View>
          <Text style={styles.formula}>Formula: manual amount + income this month - assigned expense budgets</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>This Month Summary</Text>
        <SummaryRow label="Income Added" value={formatVND(incomeThisMonth)} icon="cash-outline" tone={colors.success} />
        <SummaryRow label="Money Left From Previous Months" value={formatVND(moneyLeftFromPreviousMonths)} icon="trending-up-outline" tone={colors.blue} />
        <SummaryRow label="Assigned" value={formatVND(totalAssigned)} icon="options-outline" tone={colors.blue} />
        <SummaryRow label="Spent" value={formatVND(totalSpent)} icon="receipt-outline" tone={colors.amber} />
        <SummaryRow label="Left To Assign" value={formatVND(availableToAssign)} icon="wallet-outline" tone={availableToAssign >= 0 ? colors.success : colors.rose} />
      </Card>

      <Card style={styles.assignCard}>
        <Text style={styles.cardTitle}>Assign Your Categories</Text>
        <Text style={styles.cardHelp}>Expense categories represent money going out.</Text>
        {!!saveError && <Text style={styles.errorText}>{saveError}</Text>}
      </Card>

      <Card style={styles.expenseTable}>
        <Text style={styles.tableTitle}>Expense Categories</Text>
        {expenseRows.map((item) => (
          <View key={item.id} style={styles.expenseRow}>
            <View style={styles.categoryNameRow}>
              <View style={styles.expenseIcon}>
                <Ionicons name={item.icon || "pricetag-outline"} color={colors.rose} size={16} />
              </View>
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <Text style={styles.expenseTag}>Expense</Text>
              </View>
              <Pressable style={styles.rowSaveButton} onPress={() => saveAssignment(item)} disabled={savingId === item.id}>
                <Text style={styles.rowSaveText}>{savingId === item.id ? "..." : "Save"}</Text>
              </Pressable>
            </View>

            <View style={styles.budgetStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Assigned</Text>
                <TextInput
                  value={drafts[item.id] ?? (item.assigned ? String(item.assigned) : "")}
                  onChangeText={(value) => setDrafts((current) => ({ ...current, [item.id]: value }))}
                  keyboardType="numeric"
                  style={styles.assignedInput}
                />
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Activity</Text>
                <Text style={styles.activityText}>-{formatVND(item.activity)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Available</Text>
                <View style={[styles.availablePill, item.available < 0 ? styles.availableNegative : styles.availablePositive]}>
                  <Text style={[styles.availablePillText, item.available < 0 ? styles.expense : styles.income]}>{formatVND(item.available)}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        {!expenseRows.length && <Text style={styles.emptyInline}>No expense categories yet.</Text>}
      </Card>

      <Card style={styles.incomeCard}>
        <View style={styles.incomeHeader}>
          <Text style={styles.cardTitle}>Income Categories</Text>
          <Text style={styles.incomeCount}>{incomeRows.length} income categories</Text>
        </View>
        {incomeRows.map((item) => (
          <View key={item.id} style={styles.incomeRow}>
            <View style={styles.categoryNameRow}>
              <View style={styles.incomeIcon}>
                <Ionicons name={item.icon || "wallet-outline"} color={colors.success} size={16} />
              </View>
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <Text style={styles.incomeTag}>Income</Text>
              </View>
            </View>
            <View style={styles.budgetStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Assigned</Text>
                <Text style={styles.incomeValue}>{formatVND(item.assigned)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Activity</Text>
                <Text style={styles.incomeValue}>{formatVND(item.activity)}</Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>How This Works</Text>
        <Text style={styles.helpText}>Income transactions in {monthLabel(selectedMonth)} automatically increase your budget pool.</Text>
        <Text style={styles.helpText}>Only expense categories get assigned amounts and use monthly_limit as their monthly budget target.</Text>
        <Text style={styles.helpText}>Activity comes from transactions already logged this month.</Text>
      </Card>
    </Screen>
  );
}

function buildBudgetRow(category, activityMap) {
  const activity = activityMap.get(String(category.id)) || 0;
  const assigned = category.assigned || 0;
  return {
    ...category,
    activity,
    assigned,
    available: assigned - activity
  };
}

function groupByCategory(transactions, type) {
  const map = new Map();
  transactions
    .filter((item) => item.type === type)
    .forEach((item) => {
      const key = String(item.categoryId);
      map.set(key, (map.get(key) || 0) + item.amount);
    });
  return map;
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isSameMonth(value, month) {
  const date = parseDate(value);
  return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
}

function monthLabel(value) {
  return value.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function SummaryRow({ label, value, icon, tone }) {
  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryIcon, { backgroundColor: `${tone}18` }]}>
        <Ionicons name={icon} color={tone} size={17} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { backgroundColor: "#ecfccb", borderColor: "#86efac", gap: 18 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2 },
  monthRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  monthButton: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  monthTitle: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  availableBox: { borderRadius: 18, borderWidth: 1, borderColor: "#6ee7b7", backgroundColor: "rgba(255,255,255,0.9)", padding: 14 },
  availableTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  availableIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  smallMuted: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  availableValue: { color: colors.primary, fontSize: 24, fontWeight: "900" },
  manualRow: { gap: 8, marginTop: 12 },
  manualInput: { width: "100%", minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: "#a7f3d0", paddingHorizontal: 12, color: colors.ink, backgroundColor: "#f0fdf4" },
  saveAmountButton: { width: "100%", minHeight: 42, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  saveAmountText: { color: colors.surface, fontWeight: "900", fontSize: 12 },
  formula: { color: colors.muted, fontSize: 11, marginTop: 8 },
  assignCard: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  cardTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  cardHelp: { color: colors.rose, fontSize: 12, fontWeight: "800", marginTop: 5 },
  expenseTable: { borderColor: "#fecdd3" },
  tableTitle: { color: colors.rose, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.8, marginBottom: 8 },
  expenseRow: { borderRadius: 16, borderWidth: 1, borderColor: "#fecdd3", backgroundColor: colors.surface, padding: 12, marginTop: 10 },
  categoryNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  expenseIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#ffe4e6", alignItems: "center", justifyContent: "center" },
  incomeIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  categoryCopy: { flex: 1 },
  categoryName: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  expenseTag: { color: colors.rose, fontSize: 10, fontWeight: "800", marginTop: 2 },
  incomeTag: { color: colors.success, fontSize: 10, fontWeight: "800", marginTop: 2 },
  budgetStats: { flexDirection: "row", gap: 6, marginTop: 10 },
  statBox: { flex: 1, minHeight: 62, borderRadius: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, padding: 6, justifyContent: "center" },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: "900", textTransform: "uppercase", marginBottom: 5 },
  assignedInput: { minHeight: 30, borderRadius: 7, borderWidth: 1, borderColor: "#fda4af", paddingHorizontal: 5, color: colors.ink, backgroundColor: colors.surface, fontSize: 10, fontWeight: "800" },
  activityText: { color: colors.rose, fontSize: 9, fontWeight: "900" },
  availablePill: { minHeight: 26, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  availableNegative: { backgroundColor: "#fee2e2" },
  availablePositive: { backgroundColor: "#d1fae5" },
  availablePillText: { fontSize: 9, fontWeight: "900" },
  rowSaveButton: { minHeight: 34, borderRadius: 10, backgroundColor: colors.rose, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  rowSaveText: { color: colors.surface, fontSize: 12, fontWeight: "900" },
  incomeCard: { borderColor: "#86efac" },
  incomeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  incomeCount: { color: colors.success, backgroundColor: "#ecfdf5", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 11, fontWeight: "900" },
  incomeRow: { borderRadius: 16, borderWidth: 1, borderColor: "#bbf7d0", padding: 12, marginTop: 10 },
  incomeValue: { color: colors.success, fontSize: 12, fontWeight: "900" },
  summaryRow: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: "#f1f5f9", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, marginTop: 10 },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  summaryLabel: { flex: 1, color: colors.text, fontWeight: "800", fontSize: 12 },
  summaryValue: { color: colors.ink, fontWeight: "900", fontSize: 12, textAlign: "right" },
  helpText: { color: colors.text, lineHeight: 21, fontWeight: "700", marginTop: 10 },
  errorText: { color: colors.rose, fontWeight: "800", marginTop: 8 },
  emptyInline: { color: colors.muted, fontWeight: "800", padding: 14 },
  income: { color: colors.success },
  expense: { color: colors.rose }
});
