import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

const windowWidth = Dimensions.get("window").width;

export default function ReportsScreen() {
  const { data: reports, loading, error, fromFallback, reload } = useResource("/reports");
  const [timeframe, setTimeframe] = useState("month");

  if (loading && !reports) return <LoadingState />;

  const reportData = {
    month: {
      topCategories: [
        { name: "Groceries", amount: "8.500.000 ₫", percentage: 28 },
        { name: "Utilities", amount: "4.200.000 ₫", percentage: 14 },
        { name: "Dining", amount: "6.800.000 ₫", percentage: 22 },
        { name: "Transport", amount: "3.500.000 ₫", percentage: 12 },
        { name: "Entertainment", amount: "3.200.000 ₫", percentage: 11 },
        { name: "Other", amount: "3.800.000 ₫", percentage: 13 }
      ],
      totalExpenses: "30.000.000 ₫",
      totalIncome: "45.000.000 ₫",
      savings: "15.000.000 ₫",
      savingsRate: "33%"
    }
  };

  const data = reportData[timeframe];

  const renderChart = () => {
    const maxValue = Math.max(...data.topCategories.map(c => c.percentage));
    
    return (
      <View style={styles.chartContainer}>
        {data.topCategories.map((item, index) => (
          <View key={index} style={styles.chartRow}>
            <View style={styles.chartLabel}>
              <Text style={styles.chartLabelText}>{item.name}</Text>
              <Text style={styles.chartAmount}>{item.amount}</Text>
            </View>
            <View style={styles.chartBar}>
              <View
                style={[
                  styles.chartBarFill,
                  {
                    width: `${(item.percentage / maxValue) * 100}%`,
                    backgroundColor: [
                      colors.primary,
                      colors.success,
                      colors.warning,
                      colors.error,
                      "#8b5cf6",
                      "#06b6d4"
                    ][index % 6]
                  }
                ]}
              />
            </View>
            <Text style={styles.chartPercent}>{item.percentage}%</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Screen
      eyebrow="BudgetMate"
      title="Reports"
      subtitle="Spending analysis"
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Using demo data because API unavailable: ${error}` : null} />

      <View style={styles.timeframeContainer}>
        {["month", "quarter", "year"].map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.timeframeButton, timeframe === period && styles.timeframeButtonActive]}
            onPress={() => setTimeframe(period)}
          >
            <Text style={[styles.timeframeText, timeframe === period && styles.timeframeTextActive]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryAmount, { color: colors.success }]}>{data.totalIncome}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={[styles.summaryAmount, { color: colors.error }]}>{data.totalExpenses}</Text>
        </Card>
      </View>

      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Savings</Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>{data.savings}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Savings Rate</Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>{data.savingsRate}</Text>
        </Card>
      </View>

      <SectionTitle title="Spending by Category" />
      {renderChart()}
    </Screen>
  );
}

import { TouchableOpacity } from "react-native";

const styles = StyleSheet.create({
  timeframeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: "center"
  },
  timeframeButtonActive: {
    backgroundColor: colors.primary
  },
  timeframeText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 12
  },
  timeframeTextActive: {
    color: colors.surface
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12
  },
  summaryCard: {
    flex: 1,
    alignItems: "center"
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "900"
  },
  chartContainer: {
    gap: 12
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  chartLabel: {
    width: 90
  },
  chartLabelText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600"
  },
  chartAmount: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2
  },
  chartBar: {
    flex: 1,
    height: 24,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden"
  },
  chartBarFill: {
    height: "100%",
    borderRadius: 4
  },
  chartPercent: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    width: 30,
    textAlign: "right"
  }
});
