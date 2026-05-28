import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function BudgetScreen() {
  const { data: budgets, loading, error, fromFallback, reload } = useResource("/budgets");
  const [expandedId, setExpandedId] = useState(null);

  if (loading && !budgets) return <LoadingState />;

  const budgetList = budgets || [
    { id: 1, name: "Groceries", limit: "3.000.000 ₫", spent: "2.100.000 ₫", percentage: 70, icon: "basket" },
    { id: 2, name: "Utilities", limit: "1.500.000 ₫", spent: "980.000 ₫", percentage: 65, icon: "flash" },
    { id: 3, name: "Dining", limit: "2.000.000 ₫", spent: "1.850.000 ₫", percentage: 92, icon: "restaurant" },
    { id: 4, name: "Transport", limit: "2.500.000 ₫", spent: "1.200.000 ₫", percentage: 48, icon: "car" },
    { id: 5, name: "Entertainment", limit: "1.000.000 ₫", spent: "400.000 ₫", percentage: 40, icon: "film" }
  ];

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return colors.error;
    if (percentage >= 75) return colors.warning;
    return colors.success;
  };

  const renderBudget = ({ item }) => (
    <TouchableOpacity
      onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitle}>
            <View style={styles.budgetIcon}>
              <Ionicons name={item.icon} color={colors.primary} size={18} />
            </View>
            <View>
              <Text style={styles.budgetName}>{item.name}</Text>
              <Text style={styles.budgetLimit}>Limit: {item.limit}</Text>
            </View>
          </View>
          <Text style={styles.budgetSpent}>{item.spent}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.percentage}%`,
                  backgroundColor: getProgressColor(item.percentage)
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{item.percentage}% spent</Text>
        </View>

        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Remaining</Text>
              <Text style={styles.expandedValue}>
                {Math.max(0, item.limit.replace(/[^0-9]/g, "") - item.spent.replace(/[^0-9]/g, ""))} ₫
              </Text>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen
      eyebrow="BudgetMate"
      title="Budgets"
      subtitle="Manage your spending limits"
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Using demo data because API unavailable: ${error}` : null} />

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle" color={colors.surface} size={20} />
        <Text style={styles.addButtonText}>Add New Budget</Text>
      </TouchableOpacity>

      <FlatList
        data={budgetList}
        renderItem={renderBudget}
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
  budgetCard: {
    marginBottom: 12
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  budgetTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  budgetIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  budgetName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  budgetLimit: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  budgetSpent: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  progressContainer: {
    gap: 6
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 3
  },
  progressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
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
