import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { PrimaryButton, ProgressBar } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { useSavingsGoals } from "../hooks/useSavingsGoals";
import { colors } from "../theme";

export default function GoalsScreen({ navigation, route }) {
  const { refresh: refreshFinance } = useFinanceData();
  const { error, goals, loading, refresh, totalSaved, totalTarget } = useSavingsGoals();
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (route?.params?.message) {
      setMessage(route.params.message);
      navigation.setParams?.({ message: undefined });
      refreshAll();
    }
  }, [route?.params?.message]);

  async function refreshAll() {
    await Promise.all([refresh(), refreshFinance()]);
  }

  return (
    <Screen eyebrow="Goals" title="Savings Goals" refreshing={loading} onRefresh={refreshAll}>
      {!!error && <EmptyState title="Could not load goals" message={error} />}

      <Card style={styles.summaryCard}>
        <Summary label="Saved So Far" value={formatVND(totalSaved)} icon="wallet-outline" />
        <Summary label="Target Across Goals" value={formatVND(totalTarget)} icon="flag-outline" />
        <Summary label="Active Goals" value={String(goals.length)} icon="analytics-outline" />
      </Card>

      {!!formError && <Text style={styles.screenError}>{formError}</Text>}
      {!!message && <Text style={styles.screenSuccess}>{message}</Text>}

      <View style={styles.createRow}>
        <PrimaryButton label="Create Goal" icon="add-circle-outline" onPress={() => navigation.navigate("NewGoal")} />
      </View>

      {goals.length ? (
        goals.map((goal) => (
          <Card key={goal.id}>
            <View style={styles.goalTop}>
              <View style={styles.goalCopy}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalMeta}>{formatVND(goal.current)} of {formatVND(goal.target)}</Text>
                <Text style={styles.goalRemaining}>{formatVND(Math.max(goal.target - goal.current, 0))} remaining</Text>
              </View>
              <Text style={styles.goalPercent}>{goal.progress}%</Text>
            </View>
            <ProgressBar progress={goal.progress} color={colors.primary} />
            {!!goal.targetDate && <Text style={styles.goalDate}>Target date: {goal.targetDate}</Text>}
            <Text style={styles.goalHelp}>Add savings activity from Transactions by choosing the savings goal option.</Text>
          </Card>
        ))
      ) : (
        <EmptyState title="No goals yet" message="Create your first savings goal and it will also appear on the dashboard." />
      )}
    </Screen>
  );
}

function Summary({ label, value, icon }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} color={colors.primary} size={18} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" },
  summaryRow: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#dbeafe" },
  summaryLabel: { flex: 1, color: colors.text, fontWeight: "800" },
  summaryValue: { color: colors.ink, fontWeight: "900" },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  help: { color: colors.muted, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  field: { marginTop: 14, flex: 1 },
  label: { color: colors.text, fontWeight: "900", marginBottom: 7, fontSize: 12 },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: 12, fontWeight: "800" },
  twoColumns: { flexDirection: "row", gap: 10 },
  createRow: { marginHorizontal: 16, marginTop: 12, alignItems: "stretch" },
  primaryButton: { marginTop: 16, minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: colors.surface, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  errorText: { color: colors.rose, fontWeight: "800", marginTop: 12 },
  successText: { color: colors.success, fontWeight: "800", marginTop: 12 },
  screenError: { color: colors.rose, fontWeight: "800", marginHorizontal: 16, marginTop: 12 },
  screenSuccess: { color: colors.success, fontWeight: "800", marginHorizontal: 16, marginTop: 12 },
  goalTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  goalCopy: { flex: 1 },
  goalTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  goalMeta: { color: colors.muted, marginTop: 4, fontWeight: "800" },
  goalRemaining: { color: colors.text, marginTop: 4, fontWeight: "800", fontSize: 12 },
  goalPercent: { color: colors.primary, fontWeight: "900", fontSize: 17 },
  goalDate: { color: colors.text, marginTop: 10, fontWeight: "700" },
  goalHelp: { color: colors.muted, lineHeight: 19, marginTop: 12, fontWeight: "700", fontSize: 12 }
});
