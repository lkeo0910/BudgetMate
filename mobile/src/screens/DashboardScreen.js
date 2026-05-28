import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState, SectionTitle } from "../components/Card";
import { GradientPanel, IconBubble, MetricCard, ProgressBar } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { colors } from "../theme";

export default function DashboardScreen() {
  const { categories, error, hasData, loading, refresh, summary, transactions } = useFinanceData();
  const recent = transactions.slice(0, 5);
  const insights = hasData
    ? [
        { id: "positive", severity: "positive", text: `You saved ${formatVND(Math.max(summary.income - summary.expenses, 0))} from tracked activity.` },
        { id: "info", severity: "info", text: `${transactions.length} transactions are connected to this account.` }
      ]
    : [];

  return (
    <Screen eyebrow="Dashboard" title="Financial Overview" subtitle="Cash flow, budget health, upcoming pressure, and recent activity in one mobile command center." refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load finance data" message={error} />}
      <Card style={styles.heroCard}>
        <GradientPanel colors={["#0f766e", "#14b8a6"]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Total Balance</Text>
              <Text style={styles.heroAmount}>{formatVND(summary.balance)}</Text>
            </View>
            <Ionicons name="wallet-outline" color="rgba(255,255,255,0.75)" size={34} />
          </View>
          <View style={styles.heroStats}>
            <View>
              <Text style={styles.heroStatLabel}>Income</Text>
              <Text style={styles.heroStatValue}>{formatVND(summary.income)}</Text>
            </View>
            <View>
              <Text style={styles.heroStatLabel}>Expenses</Text>
              <Text style={styles.heroStatValue}>{formatVND(summary.expenses)}</Text>
            </View>
          </View>
        </GradientPanel>
      </Card>

      {!hasData && <EmptyState title="No finance data yet" message="This account has no transactions or categories. The seeded demo data belongs only to test_user." />}

      <View style={styles.metrics}>
        <MetricCard label="Remaining" value={formatVND(summary.remainingBudget)} icon="pie-chart-outline" color={colors.teal} />
        <MetricCard label="Savings Rate" value={`${summary.savingsRate}%`} icon="trending-up-outline" color={colors.success} />
        <MetricCard label="Health Score" value={`${summary.health}`} icon="shield-checkmark-outline" color={colors.blue} />
        <MetricCard label="Projected" value={formatVND(summary.projectedBalance)} icon="analytics-outline" color={colors.orange} />
      </View>

      <SectionTitle title="Budget Health" />
      <Card>
        <View style={styles.healthRow}>
          <IconBubble name="checkmark-circle-outline" color={colors.success} softColor="#dcfce7" />
          <View style={styles.healthCopy}>
            <Text style={styles.cardTitle}>Healthy cash flow score of 100</Text>
            <Text style={styles.body}>Your spending is below assigned budget, income is stable, and savings goals are moving.</Text>
          </View>
        </View>
        <View style={styles.healthProgress}>
          <ProgressBar progress={100} color={colors.success} />
        </View>
      </Card>

      <SectionTitle title="Category Activity" />
      <Card>
        {categories.filter((item) => item.type === "expense").slice(0, 5).map((item) => {
          const ratio = item.assigned ? Math.round((item.activity / item.assigned) * 100) : 0;
          return (
            <View key={item.id} style={styles.categoryRow}>
              <IconBubble name={item.icon} color={item.color} size={18} />
              <View style={styles.categoryCopy}>
                <View style={styles.categoryTop}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <Text style={styles.categoryValue}>{ratio}%</Text>
                </View>
                <ProgressBar progress={ratio} color={item.color} />
                <Text style={styles.categoryMeta}>{formatVND(item.activity)} of {formatVND(item.assigned)}</Text>
              </View>
            </View>
          );
        })}
        {!categories.length && <Text style={styles.emptyInline}>No categories yet.</Text>}
      </Card>

      <SectionTitle title="Smart Insights" />
      {insights.map((item) => (
        <Card key={item.id} style={styles.compactCard}>
          <View style={styles.insightRow}>
            <IconBubble
              name={item.severity === "positive" ? "sparkles-outline" : item.severity === "warning" ? "warning-outline" : "information-circle-outline"}
              color={item.severity === "positive" ? colors.success : item.severity === "warning" ? colors.orange : colors.blue}
            />
            <Text style={styles.insightText}>{item.text}</Text>
          </View>
        </Card>
      ))}

      <SectionTitle title="Recent Transactions" />
      <Card>
        {recent.map((item) => (
          <View key={item.id} style={styles.transactionRow}>
            <IconBubble name={item.type === "INCOME" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"} color={item.type === "INCOME" ? colors.success : colors.rose} size={18} />
            <View style={styles.transactionCopy}>
              <Text style={styles.transactionTitle}>{item.vendor}</Text>
              <Text style={styles.transactionMeta}>{item.category} • {item.date}</Text>
            </View>
            <Text style={[styles.transactionAmount, item.type === "INCOME" ? styles.income : styles.expense]}>
              {item.type === "INCOME" ? "+" : "-"}{formatVND(item.amount)}
            </Text>
          </View>
        ))}
        {!recent.length && <Text style={styles.emptyInline}>No transactions yet.</Text>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 0, overflow: "hidden" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { color: "rgba(255,255,255,0.78)", fontWeight: "800", textTransform: "uppercase", fontSize: 11, letterSpacing: 1.5 },
  heroAmount: { color: colors.surface, fontSize: 31, fontWeight: "900", marginTop: 8 },
  heroStats: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.25)", flexDirection: "row", justifyContent: "space-between" },
  heroStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "800" },
  heroStatValue: { color: colors.surface, fontWeight: "900", marginTop: 4 },
  metrics: { marginHorizontal: 16, marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  healthRow: { flexDirection: "row" },
  healthCopy: { flex: 1, marginLeft: 12 },
  healthProgress: { marginTop: 14 },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  body: { color: colors.text, lineHeight: 21, marginTop: 5 },
  categoryRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryCopy: { flex: 1, marginLeft: 12 },
  categoryTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  categoryName: { color: colors.ink, fontWeight: "900" },
  categoryValue: { color: colors.muted, fontWeight: "900" },
  categoryMeta: { color: colors.muted, fontSize: 12, marginTop: 6, fontWeight: "700" },
  compactCard: { paddingVertical: 13 },
  insightRow: { flexDirection: "row", alignItems: "center" },
  insightText: { flex: 1, color: colors.text, lineHeight: 20, marginLeft: 12, fontWeight: "700" },
  transactionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  transactionCopy: { flex: 1, marginLeft: 12 },
  transactionTitle: { color: colors.ink, fontWeight: "900" },
  transactionMeta: { color: colors.muted, marginTop: 3, fontSize: 12, fontWeight: "700" },
  transactionAmount: { maxWidth: 110, textAlign: "right", fontWeight: "900", fontSize: 12 },
  emptyInline: { color: colors.muted, fontWeight: "800", lineHeight: 20 },
  income: { color: colors.success },
  expense: { color: colors.rose }
});
