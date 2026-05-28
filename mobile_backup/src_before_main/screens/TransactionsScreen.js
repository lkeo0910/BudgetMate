import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function TransactionsScreen() {
  const { data: transactions, loading, error, fromFallback, reload } = useResource("/transactions");
  const [filter, setFilter] = useState("all");

  if (loading && !transactions) return <LoadingState />;

  const transactionList = transactions || [
    { id: 1, title: "Grocery Store", category: "Food", amount: "-850.000 ₫", date: "Today", icon: "basket" },
    { id: 2, title: "Salary Deposit", category: "Income", amount: "+25.000.000 ₫", date: "Yesterday", icon: "cash" },
    { id: 3, title: "Electricity Bill", category: "Utilities", amount: "-450.000 ₫", date: "3 days ago", icon: "flash" },
    { id: 4, title: "Restaurant", category: "Dining", amount: "-320.000 ₫", date: "3 days ago", icon: "restaurant" },
    { id: 5, title: "Gas Station", category: "Transport", amount: "-600.000 ₫", date: "1 week ago", icon: "car" }
  ];

  const getCategoryColor = (category) => {
    const categoryColors = {
      Food: "#f97316",
      Income: colors.success,
      Utilities: "#8b5cf6",
      Dining: "#ec4899",
      Transport: "#06b6d4"
    };
    return categoryColors[category] || colors.primary;
  };

  const renderTransaction = ({ item }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionRow}>
        <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
          <Ionicons name={item.icon} color={getCategoryColor(item.category)} size={20} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionCategory}>{item.category} • {item.date}</Text>
        </View>
        <Text style={[styles.transactionAmount, { color: item.amount.startsWith("-") ? colors.error : colors.success }]}>
          {item.amount}
        </Text>
      </View>
    </Card>
  );

  return (
    <Screen
      eyebrow="BudgetMate"
      title="Transactions"
      subtitle="Your spending history"
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Using demo data because API unavailable: ${error}` : null} />

      <View style={styles.filterContainer}>
        {["all", "income", "expenses"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transactionList}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 13
  },
  filterTextActive: {
    color: colors.surface
  },
  transactionCard: {
    marginBottom: 8
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  transactionInfo: {
    flex: 1
  },
  transactionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  transactionCategory: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  transactionAmount: {
    fontWeight: "900",
    fontSize: 14
  }
});
