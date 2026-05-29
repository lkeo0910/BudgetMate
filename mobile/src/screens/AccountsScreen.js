import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { IconBubble } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { colors } from "../theme";

export default function AccountsScreen() {
  const { error, hasData, loading, refresh, summary, transactions } = useFinanceData();

  const rows = [
    { id: "balance", title: "Total Balance", value: formatVND(summary.balance), icon: "wallet-outline", color: colors.primary },
    { id: "income", title: "Income Tracked", value: formatVND(summary.income), icon: "trending-up-outline", color: colors.success },
    { id: "expense", title: "Expenses Tracked", value: formatVND(summary.expenses), icon: "trending-down-outline", color: colors.rose }
  ];

  return (
    <Screen eyebrow="Accounts" title="Accounts Overview" refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load accounts" message={error} />}
      {!hasData && <EmptyState title="No account activity yet" message="Add income and expense transactions to populate your account overview." />}

      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>Safe Sync</Text>
        <Text style={styles.heroValue}>{formatVND(summary.balance)}</Text>
        <Text style={styles.heroCopy}>This mobile view summarizes tracked cash flow from your transaction ledger.</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Balances</Text>
        {rows.map((item) => (
          <View key={item.id} style={styles.row}>
            <IconBubble name={item.icon} color={item.color} />
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>{item.value}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Cards</Text>
        <View style={styles.placeholderRow}>
          <Ionicons name="card-outline" color={colors.violet} size={22} />
          <Text style={styles.placeholderText}>Card linking is ready for a future provider. Current totals come from local transactions.</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Activity Health</Text>
        <Info label="Transactions" value={String(transactions.length)} />
        <Info label="Savings rate" value={`${summary.savingsRate}%`} />
        <Info label="Budget health" value={`${summary.health}/100`} />
      </Card>
    </Screen>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: "#ecfeff", borderColor: "#99f6e4" },
  heroLabel: { color: colors.primary, fontWeight: "900", textTransform: "uppercase", fontSize: 11 },
  heroValue: { color: colors.ink, fontSize: 30, fontWeight: "900", marginTop: 8 },
  heroCopy: { color: colors.text, lineHeight: 21, marginTop: 8, fontWeight: "700" },
  cardTitle: { color: colors.ink, fontSize: 19, fontWeight: "900", marginBottom: 8 },
  row: { minHeight: 62, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 },
  rowCopy: { flex: 1, marginLeft: 12 },
  rowTitle: { color: colors.ink, fontWeight: "900" },
  rowMeta: { color: colors.muted, marginTop: 3, fontWeight: "800" },
  placeholderRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  placeholderText: { flex: 1, color: colors.text, lineHeight: 20, fontWeight: "700" },
  infoRow: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.text, fontWeight: "800" },
  infoValue: { color: colors.ink, fontWeight: "900" }
});
