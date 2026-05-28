import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { MetricGrid } from "../components/MetricGrid";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function DashboardScreen() {
  const { data: dashboard, loading, error, fromFallback, reload } = useResource("/dashboard");

  if (loading && !dashboard) return <LoadingState />;

  const dashboardData = dashboard || {
    balance: "164.149.000 ₫",
    income: "45.000.000 ₫",
    expenses: "32.500.000 ₫",
    savings: "7.330.000 ₫",
    health_score: 100,
    currency: "VND"
  };

  return (
    <Screen
      eyebrow="BudgetMate"
      title="Financial Overview"
      subtitle="Your money, at a glance"
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Using demo data because API unavailable: ${error}` : null} />

      <Card style={styles.balanceCard}>
        <LinearGradient colors={[colors.primary, colors.teal]} style={styles.balanceGradient}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{dashboardData.balance}</Text>
        </LinearGradient>
      </Card>

      <View style={styles.metricsContainer}>
        <Card style={styles.metricCard}>
          <View style={styles.metricContent}>
            <View style={styles.metricIcon}>
              <Ionicons name="arrow-up-circle" color={colors.success} size={24} />
            </View>
            <View style={styles.metricText}>
              <Text style={styles.metricLabel}>Income</Text>
              <Text style={styles.metricValue}>{dashboardData.income}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricContent}>
            <View style={styles.metricIcon}>
              <Ionicons name="arrow-down-circle" color={colors.error} size={24} />
            </View>
            <View style={styles.metricText}>
              <Text style={styles.metricLabel}>Expenses</Text>
              <Text style={styles.metricValue}>{dashboardData.expenses}</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.metricsContainer}>
        <Card style={styles.metricCard}>
          <View style={styles.metricContent}>
            <View style={styles.metricIcon}>
              <Ionicons name="leaf" color={colors.success} size={24} />
            </View>
            <View style={styles.metricText}>
              <Text style={styles.metricLabel}>Savings</Text>
              <Text style={styles.metricValue}>{dashboardData.savings}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricContent}>
            <View style={styles.metricIcon}>
              <Ionicons name="checkmark-circle" color={colors.primary} size={24} />
            </View>
            <View style={styles.metricText}>
              <Text style={styles.metricLabel}>Health Score</Text>
              <Text style={styles.metricValue}>{dashboardData.health_score}</Text>
            </View>
          </View>
        </Card>
      </View>

      <SectionTitle title="Quick Insights" />
      <Card>
        <View style={styles.insightRow}>
          <Ionicons name="trending-up" color={colors.success} size={22} />
          <Text style={styles.insightText}>Budget health is excellent. All categories on track.</Text>
        </View>
      </Card>

      <Card>
        <View style={styles.insightRow}>
          <Ionicons name="warning" color={colors.warning} size={22} />
          <Text style={styles.insightText}>Groceries spending +42% vs last month.</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    padding: 0,
    marginBottom: 16,
    overflow: "hidden"
  },
  balanceGradient: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 14
  },
  balanceLabel: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9
  },
  balanceAmount: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8
  },
  metricsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12
  },
  metricCard: {
    flex: 1
  },
  metricContent: {
    flexDirection: "row",
    alignItems: "center"
  },
  metricIcon: {
    marginRight: 12
  },
  metricText: {
    flex: 1
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  metricValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  insightText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20
  }
});
