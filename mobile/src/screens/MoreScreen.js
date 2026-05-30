import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, EmptyState } from "../components/Card";
import { IconBubble, ProgressBar, PrimaryButton } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { useSavingsGoals } from "../hooks/useSavingsGoals";
import { colors } from "../theme";

export default function MoreScreen({ navigation }) {
  const { error, hasData, loading, refresh, summary } = useFinanceData();
  const { goals, loading: goalsLoading, refresh: refreshGoals } = useSavingsGoals();
  const accountCards = hasData
    ? [
        { id: "income", title: "Tracked Income", subtitle: formatVND(summary.income), icon: "trending-up-outline", color: colors.success },
        { id: "expenses", title: "Tracked Expenses", subtitle: formatVND(summary.expenses), icon: "trending-down-outline", color: colors.rose },
        { id: "balance", title: "Net Balance", subtitle: formatVND(summary.balance), icon: "wallet-outline", color: colors.primary }
      ]
    : [];

  async function refreshAll() {
    await Promise.all([refresh(), refreshGoals()]);
  }

  return (
    <Screen eyebrow="More" title="Workspace" refreshing={loading || goalsLoading} onRefresh={refreshAll}>
      {!!error && <EmptyState title="Could not load workspace" message={error} />}
      {accountCards.length ? (
        <Card>
          <Text style={styles.section}>Accounts</Text>
          {accountCards.map((item) => (
            <Pressable key={item.id} style={styles.row} onPress={() => navigation.navigate("Accounts")}>
              <IconBubble name={item.icon} color={item.color} />
              <View style={styles.copy}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>{item.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : (
        <EmptyState title="No workspace data yet" message="Add transactions or use the demo account to populate finance summaries." />
      )}

      {goals.length ? (
        <Card>
          <Text style={styles.section}>Savings Goals</Text>
          {goals.map((goal) => {
            return (
              <Pressable key={goal.id} style={styles.goal} onPress={() => navigation.navigate("Goals")}>
                <View style={styles.goalTop}>
                  <Text style={styles.title}>{goal.title}</Text>
                  <Text style={styles.percent}>{goal.progress}%</Text>
                </View>
                <ProgressBar progress={goal.progress} color={colors.primary} />
                <Text style={styles.meta}>{formatVND(goal.current)} of {formatVND(goal.target)}</Text>
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Card>
          <Text style={styles.section}>Savings Goals</Text>
          <Text style={styles.meta}>No savings goals yet.</Text>
          <PrimaryButton label="Create goal" icon="flag-outline" onPress={() => navigation.navigate("NewGoal")} />
        </Card>
      )}

      <Card>
        <Text style={styles.section}>Account</Text>
        {[
          ["Profile Details", "Profile", "person-outline"],
          ["Accounts Overview", "Accounts", "business-outline"],
          ["Change Password", "ChangePassword", "key-outline"],
          ["Change Profile Photo", "ChangeProfilePhoto", "camera-outline"]
        ].map(([item, route, icon]) => (
          <Pressable key={item} style={styles.settingRow} onPress={() => navigation.navigate(route)}>
            <View style={styles.settingCopy}>
              <IconBubble name={icon} color={route === "ChangePassword" ? colors.rose : colors.primary} size={18} />
              <Text style={styles.title}>{item}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.ink, fontSize: 19, fontWeight: "900", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  copy: { flex: 1, marginLeft: 12 },
  title: { color: colors.ink, fontWeight: "900" },
  meta: { color: colors.muted, marginTop: 4, fontSize: 12, lineHeight: 18 },
  goal: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  goalTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  percent: { color: colors.primary, fontWeight: "900" },
  settingRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  settingCopy: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  chevron: { color: colors.muted, fontSize: 28 }
});
