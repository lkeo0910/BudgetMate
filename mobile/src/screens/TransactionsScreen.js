import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Card, EmptyState } from "../components/Card";
import { IconBubble, PrimaryButton } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { colors } from "../theme";

export default function TransactionsScreen() {
  const { error, loading, refresh, transactions } = useFinanceData();

  return (
    <Screen eyebrow="Transactions" title="Transaction History" subtitle="Search, review, and categorize spending from the mobile feed." refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load transactions" message={error} />}
      <Card>
        <View style={styles.search}>
          <IconBubble name="search-outline" color={colors.muted} softColor="#f1f5f9" size={18} />
          <TextInput placeholder="Search transactions" placeholderTextColor={colors.muted} style={styles.input} />
        </View>
        <View style={styles.filterRow}>
          <PrimaryButton label="Add" icon="add" />
          <PrimaryButton label="Upload receipt" icon="document-attach-outline" variant="outline" />
        </View>
      </Card>

      {transactions.length ? (
        <Card>
          {transactions.map((item) => (
            <View key={item.id} style={styles.row}>
              <IconBubble name={item.type === "INCOME" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"} color={item.type === "INCOME" ? colors.success : colors.rose} size={18} />
              <View style={styles.copy}>
                <Text style={styles.vendor}>{item.vendor}</Text>
                <Text style={styles.note}>{item.note}</Text>
                <Text style={styles.meta}>{item.category} • {item.date}</Text>
              </View>
              <Text style={[styles.amount, item.type === "INCOME" ? styles.income : styles.expense]}>
                {item.type === "INCOME" ? "+" : "-"}{formatVND(item.amount)}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState title="No transactions yet" message="New accounts start empty. The seeded transaction history belongs only to test_user." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 50, borderRadius: 14, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  input: { flex: 1, color: colors.ink, fontWeight: "800", marginLeft: 8 },
  filterRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  copy: { flex: 1, marginLeft: 12 },
  vendor: { color: colors.ink, fontWeight: "900" },
  note: { color: colors.text, marginTop: 2, fontSize: 12 },
  meta: { color: colors.muted, marginTop: 3, fontSize: 11, fontWeight: "800" },
  amount: { maxWidth: 108, textAlign: "right", fontWeight: "900", fontSize: 12 },
  income: { color: colors.success },
  expense: { color: colors.rose }
});
