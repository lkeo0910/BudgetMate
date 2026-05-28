import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { ProgressBar } from "../components/ProgressBar";
import { colors } from "../theme";

export default function GoalsScreen() {
  const { data: goals, loading, error, fromFallback, reload } = useResource("/goals");
  const [expandedId, setExpandedId] = useState(null);

  if (loading && !goals) return <LoadingState />;

  const goalList = goals || [
    { id: 1, name: "Emergency Fund", target: "50.000.000 ₫", current: "28.500.000 ₫", percentage: 57, deadline: "Dec 2025", icon: "shield" },
    { id: 2, name: "Vacation", target: "20.000.000 ₫", current: "14.200.000 ₫", percentage: 71, deadline: "Jun 2025", icon: "airplane" },
    { id: 3, name: "New Laptop", target: "30.000.000 ₫", current: "9.800.000 ₫", percentage: 33, deadline: "Sep 2025", icon: "laptop" },
    { id: 4, name: "Car Down Payment", target: "100.000.000 ₫", current: "45.300.000 ₫", percentage: 45, deadline: "Dec 2026", icon: "car" }
  ];

  const renderGoal = ({ item }) => (
    <TouchableOpacity
      onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitle}>
            <View style={styles.goalIcon}>
              <Ionicons name={item.icon} color={colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalName}>{item.name}</Text>
              <Text style={styles.goalDeadline}>{item.deadline}</Text>
            </View>
          </View>
          <Text style={styles.goalPercentage}>{item.percentage}%</Text>
        </View>

        <View style={styles.progressSection}>
          <ProgressBar value={item.percentage} />
          <View style={styles.goalAmounts}>
            <Text style={styles.goalCurrent}>{item.current}</Text>
            <Text style={styles.goalSeparator}>/</Text>
            <Text style={styles.goalTarget}>{item.target}</Text>
          </View>
        </View>

        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Remaining to save</Text>
              <Text style={styles.expandedValue}>5.800.000 ₫</Text>
            </View>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Monthly target</Text>
              <Text style={styles.expandedValue}>725.000 ₫/mo</Text>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen
      eyebrow="BudgetMate"
      title="Financial Goals"
      subtitle="Track your savings targets"
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Using demo data because API unavailable: ${error}` : null} />

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle" color={colors.surface} size={20} />
        <Text style={styles.addButtonText}>Set New Goal</Text>
      </TouchableOpacity>

      <FlatList
        data={goalList}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8
  },
  addButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 14
  },
  goalCard: {
    marginBottom: 12
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  goalTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  goalName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  goalDeadline: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  goalPercentage: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900"
  },
  progressSection: {
    gap: 8
  },
  goalAmounts: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between"
  },
  goalCurrent: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  goalSeparator: {
    color: colors.muted
  },
  goalTarget: {
    color: colors.muted,
    fontSize: 13
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8
  },
  expandedRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  expandedLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600"
  },
  expandedValue: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700"
  }
});
