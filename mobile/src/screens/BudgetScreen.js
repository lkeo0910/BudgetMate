import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, EmptyState, SectionTitle } from "../components/Card";
import { IconBubble, ProgressBar, PrimaryButton } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { colors } from "../theme";

export default function BudgetScreen() {
  const { categories, error, loading, refresh, summary } = useFinanceData();
  const expenseRows = categories.filter((item) => item.type === "expense");
  const incomeRows = categories.filter((item) => item.type === "income");

  return (
    <Screen eyebrow="Budget" title="Monthly Plan" subtitle="A mobile version of the web budget planner with assigned, activity, and available amounts." refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load budget" message={error} />}
      <Card>
        <View style={styles.availableTop}>
          <View>
            <Text style={styles.overline}>Available to assign</Text>
            <Text style={styles.available}>{formatVND(summary.remainingBudget)}</Text>
          </View>
          <IconBubble name="wallet-outline" color={colors.primary} softColor="#ccfbf1" />
        </View>
        <View style={styles.actions}>
          <PrimaryButton label="Assign funds" icon="add" />
          <PrimaryButton label="Previous month" icon="chevron-back" variant="outline" />
        </View>
      </Card>

      <SectionTitle title="Expense Categories" />
      {expenseRows.length ? <Card>{expenseRows.map((item) => <BudgetRow key={item.id} item={item} />)}</Card> : <EmptyState title="No expense categories" message="This account has no budget categories yet." />}

      <SectionTitle title="Income Categories" />
      {incomeRows.length ? <Card>{incomeRows.map((item) => <BudgetRow key={item.id} item={item} income />)}</Card> : <EmptyState title="No income categories" message="This account has no income categories yet." />}
    </Screen>
  );
}

function BudgetRow({ item, income }) {
  const percent = item.assigned ? Math.round((item.activity / item.assigned) * 100) : 0;
  return (
    <View style={styles.row}>
      <IconBubble name={item.icon} color={item.color} size={18} />
      <View style={styles.copy}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={[styles.availableSmall, income && styles.income]}>{formatVND(item.assigned - item.activity)}</Text>
        </View>
        <ProgressBar progress={percent} color={item.color} />
        <Text style={styles.meta}>{formatVND(item.activity)} activity • {formatVND(item.assigned)} assigned</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  availableTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  overline: { color: colors.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.5 },
  available: { color: colors.primary, fontSize: 28, fontWeight: "900", marginTop: 6 },
  actions: { gap: 10, marginTop: 16 },
  row: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  copy: { flex: 1, marginLeft: 12 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  name: { color: colors.ink, fontWeight: "900" },
  availableSmall: { color: colors.rose, fontWeight: "900", fontSize: 12 },
  income: { color: colors.success },
  meta: { color: colors.muted, marginTop: 6, fontSize: 12, fontWeight: "700" }
});
