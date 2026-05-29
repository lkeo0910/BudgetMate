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
  const { categories, error, hasData, loading, refresh, summary } = useFinanceData();
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
      <Card>
        <Text style={styles.section}>Navigation</Text>
        <View style={styles.navGrid}>
          <NavButton label="Accounts" icon="business-outline" color={colors.sky} onPress={() => navigation.navigate("Accounts")} />
          <NavButton label="Goals" icon="flag-outline" color={colors.primary} onPress={() => navigation.navigate("Goals")} />
          <NavButton label="Assistant" icon="sparkles-outline" color={colors.violet} onPress={() => navigation.navigate("Assistant")} />
          <NavButton label="Profile" icon="person-outline" color={colors.blue} onPress={() => navigation.navigate("Profile")} />
          <NavButton label="Settings" icon="settings-outline" color={colors.amber} onPress={() => navigation.navigate("Settings")} />
          <NavButton label="Categories" icon="pricetags-outline" color={colors.rose} onPress={() => navigation.navigate("Categories")} />
        </View>
      </Card>

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
          <PrimaryButton label="Create goal" icon="flag-outline" onPress={() => navigation.navigate("Goals")} />
        </Card>
      )}

      {categories.length ? (
        <Card>
          <Text style={styles.section}>Categories</Text>
          <View style={styles.chips}>
            {categories.map((item) => (
              <View key={item.id} style={[styles.chip, { borderColor: `${item.color}44`, backgroundColor: `${item.color}10` }]}>
                <Text style={[styles.chipText, { color: item.color }]}>{item.name}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.section}>AI Assistant</Text>
        <View style={styles.chatBubble}>
          <Text style={styles.chatText}>Ask me to review transactions, explain trends, or create a custom budget for next month.</Text>
        </View>
        <PrimaryButton label="Start new chat" icon="sparkles-outline" onPress={() => navigation.navigate("Assistant")} />
      </Card>

      <Card>
        <Text style={styles.section}>Settings</Text>
        {[
          ["General Preferences", "Settings"],
          ["Security & Privacy", "Settings"],
          ["Profile Details", "Profile"],
          ["Accounts Overview", "Accounts"]
        ].map(([item, route]) => (
          <Pressable key={item} style={styles.settingRow} onPress={() => navigation.navigate(route)}>
            <Text style={styles.title}>{item}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

function NavButton({ label, icon, color, onPress }) {
  return (
    <Pressable style={styles.navButton} onPress={onPress}>
      <IconBubble name={icon} color={color} size={20} />
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.ink, fontSize: 19, fontWeight: "900", marginBottom: 10 },
  navGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  navButton: { width: "47%", minHeight: 94, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#f8fafc" },
  navLabel: { color: colors.ink, fontWeight: "900", fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  copy: { flex: 1, marginLeft: 12 },
  title: { color: colors.ink, fontWeight: "900" },
  meta: { color: colors.muted, marginTop: 4, fontSize: 12, lineHeight: 18 },
  goal: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  goalTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  percent: { color: colors.primary, fontWeight: "900" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  chipText: { fontSize: 12, fontWeight: "900" },
  chatBubble: { borderRadius: 18, padding: 14, backgroundColor: "#f0fdfa", borderWidth: 1, borderColor: "#99f6e4", marginBottom: 12 },
  chatText: { color: colors.primaryDark, lineHeight: 20, fontWeight: "700" },
  settingRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  chevron: { color: colors.muted, fontSize: 28 }
});
