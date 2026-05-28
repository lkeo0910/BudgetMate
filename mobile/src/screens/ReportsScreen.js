import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, SectionTitle } from "../components/Card";
import { IconBubble, MetricCard, ProgressBar } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { categories, formatVND, summary } from "../data/finance";
import { colors } from "../theme";

export default function ReportsScreen() {
  const spendRows = categories.filter((item) => item.type === "expense").slice(0, 6);
  return (
    <Screen eyebrow="Reports" title="Cash Flow Reports" subtitle="Mobile snapshots of income, expenses, trend, savings rate, and spending mix.">
      <View style={styles.metrics}>
        <MetricCard label="Income" value={formatVND(summary.income)} icon="trending-up-outline" color={colors.success} />
        <MetricCard label="Expenses" value={formatVND(summary.expenses)} icon="trending-down-outline" color={colors.rose} />
        <MetricCard label="Net Income" value={formatVND(summary.income - summary.expenses)} icon="analytics-outline" color={colors.blue} />
        <MetricCard label="Savings Rate" value={`${summary.savingsRate}%`} icon="leaf-outline" color={colors.teal} />
      </View>

      <SectionTitle title="Monthly Trend" />
      <Card>
        <View style={styles.chart}>
          {[42, 58, 44, 72, 66, 84].map((height, index) => (
            <View key={index} style={styles.barWrap}>
              <View style={[styles.bar, { height, backgroundColor: index % 2 ? colors.teal : colors.blue }]} />
              <Text style={styles.barLabel}>{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle title="Spending Mix" />
      <Card>
        {spendRows.map((item) => {
          const percent = Math.round((item.activity / summary.expenses) * 100);
          return (
            <View key={item.id} style={styles.mixRow}>
              <IconBubble name={item.icon} color={item.color} size={17} />
              <View style={styles.mixCopy}>
                <View style={styles.mixTop}>
                  <Text style={styles.mixName}>{item.name}</Text>
                  <Text style={styles.mixValue}>{percent}%</Text>
                </View>
                <ProgressBar progress={percent} color={item.color} />
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: { marginHorizontal: 16, marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chart: { height: 150, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  barWrap: { alignItems: "center", flex: 1 },
  bar: { width: 24, borderRadius: 8 },
  barLabel: { color: colors.muted, fontSize: 11, marginTop: 8, fontWeight: "800" },
  mixRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  mixCopy: { flex: 1, marginLeft: 12 },
  mixTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  mixName: { color: colors.ink, fontWeight: "900" },
  mixValue: { color: colors.muted, fontWeight: "900" }
});
