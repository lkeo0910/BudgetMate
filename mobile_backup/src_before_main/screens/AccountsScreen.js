import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, SectionTitle } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function AccountsScreen() {
  const { data: accounts, loading, error, fromFallback, reload } = useResource("/accounts");
  const [selectedId, setSelectedId] = useState(null);

  if (loading && !accounts) return <LoadingState />;

  const accountList = accounts || [
    { id: 1, name: "Main Checking", bank: "Techcombank", type: "Checking", balance: "85.500.000 ₫", icon: "card", color: "#2563eb" },
    { id: 2, name: "Savings", bank: "Vietcombank", type: "Savings", balance: "78.649.000 ₫", icon: "piggy-bank", color: "#16a34a" },
    { id: 3, name: "Emergency Fund", bank: "BIDV", type: "Savings", balance: "28.500.000 ₫", icon: "shield", color: "#ca8a04" },
    { id: 4, name: "Credit Card", bank: "Visa", type: "Credit", balance: "-5.200.000 ₫", icon: "card", color: "#7c3aed" }
  ];

  const renderAccount = ({ item }) => (
    <TouchableOpacity
      onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <View style={styles.accountLeft}>
            <View style={[styles.accountIcon, { backgroundColor: item.color + "20" }]}>
              <Ionicons name={item.icon} color={item.color} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName}>{item.name}</Text>
              <Text style={styles.accountBank}>{item.bank} • {item.type}</Text>
            </View>
          </View>
          <Ionicons
            name={selectedId === item.id ? "chevron-up" : "chevron-down"}
            color={colors.muted}
            size={20}
          />
        </View>

        {selectedId === item.id && (
          <View style={styles.expandedContent}>
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={[styles.balanceValue, { color: item.balance.startsWith("-") ? colors.error : colors.ink }]}>
                {item.balance}
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="arrow-up-circle" color={colors.error} size={18} />
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="arrow-down-circle" color={colors.success} size={18} />
                <Text style={styles.actionText}>Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="swap-horizontal" color={colors.primary} size={18} />
                <Text style={styles.actionText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen
      eyebrow="BudgetMate"
      title="Accounts"
      subtitle="Your connected accounts"
      refreshing={loading}
      onRefresh={reload}
    >
      <Notice text={fromFallback ? `Using demo data because API unavailable: ${error}` : null} />

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle" color={colors.surface} size={20} />
        <Text style={styles.addButtonText}>Connect Account</Text>
      </TouchableOpacity>

      <FlatList
        data={accountList}
        renderItem={renderAccount}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />

      <SectionTitle title="Total Balance" />
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>All Accounts</Text>
        <Text style={styles.totalAmount}>187.949.000 ₫</Text>
      </Card>
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
  accountCard: {
    marginBottom: 12
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  accountName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  accountBank: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  balanceSection: {
    marginBottom: 12
  },
  balanceLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "900"
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  actionButton: {
    alignItems: "center",
    gap: 4
  },
  actionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600"
  },
  totalCard: {
    alignItems: "center"
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600"
  },
  totalAmount: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6
  }
});
