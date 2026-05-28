import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function CategoriesScreen() {
  const { data: categories, loading, error, fromFallback, reload } = useResource("/categories");
  const [expandedId, setExpandedId] = useState(null);

  if (loading && !categories) return <LoadingState />;

  const categoryList = categories || [
    { id: 1, name: "Groceries", icon: "basket", color: "#f97316", type: "Expense", enabled: true },
    { id: 2, name: "Utilities", icon: "flash", color: "#8b5cf6", type: "Expense", enabled: true },
    { id: 3, name: "Dining", icon: "restaurant", color: "#ec4899", type: "Expense", enabled: true },
    { id: 4, name: "Transport", icon: "car", color: "#06b6d4", type: "Expense", enabled: true },
    { id: 5, name: "Entertainment", icon: "film", color: "#f43f5e", type: "Expense", enabled: true },
    { id: 6, name: "Salary", icon: "cash", color: colors.success, type: "Income", enabled: true },
    { id: 7, name: "Bonus", icon: "gift", color: colors.success, type: "Income", enabled: true },
    { id: 8, name: "Freelance", icon: "briefcase", color: colors.success, type: "Income", enabled: false }
  ];

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color + "20" }]}>
              <Ionicons name={item.icon} color={item.color} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryType}>{item.type}</Text>
            </View>
          </View>
          <View style={styles.toggleContainer}>
            <Switch
              value={item.enabled}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.success + "40" }}
              thumbColor={item.enabled ? colors.success : colors.muted}
            />
          </View>
        </View>

        {expandedId === item.id && (
          <View style={styles.expandedContent}>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="pencil" color={colors.primary} size={16} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="color-palette" color={colors.primary} size={16} />
              <Text style={styles.actionText}>Change Color</Text>
            </TouchableOpacity>
            {item.type === "Expense" && (
              <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="pie-chart" color={colors.primary} size={16} />
                <Text style={styles.actionText}>Set Budget</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const expenseCategories = categoryList.filter(c => c.type === "Expense");
  const incomeCategories = categoryList.filter(c => c.type === "Income");

  return (
    <Screen
      eyebrow="BudgetMate"
      title="Categories"
      subtitle="Organize your spending"
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Using demo data because API unavailable: ${error}` : null} />

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle" color={colors.surface} size={20} />
        <Text style={styles.addButtonText}>Create Category</Text>
      </TouchableOpacity>

      <SectionTitle title="Expense Categories" />
      <FlatList
        data={expenseCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />

      <SectionTitle title="Income Categories" />
      <FlatList
        data={incomeCategories}
        renderItem={renderCategory}
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
  categoryCard: {
    marginBottom: 10
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  categoryName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  categoryType: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  toggleContainer: {
    marginLeft: 12
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8
  },
  actionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600"
  }
});
