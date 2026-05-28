import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { IconBubble, ProgressBar, PrimaryButton } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { accounts, categories, formatVND, goals } from "../data/finance";
import { colors } from "../theme";

export default function MoreScreen() {
  return (
    <Screen eyebrow="More" title="Workspace" subtitle="Accounts, goals, categories, AI assistant, profile, and settings from the web dashboard.">
      <Card>
        <Text style={styles.section}>Accounts</Text>
        {accounts.map((item) => (
          <View key={item.id} style={styles.row}>
            <IconBubble name={item.icon} color={item.color} />
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.section}>Savings Goals</Text>
        {goals.map((goal) => {
          const progress = Math.round((goal.current / goal.target) * 100);
          return (
            <View key={goal.id} style={styles.goal}>
              <View style={styles.goalTop}>
                <Text style={styles.title}>{goal.title}</Text>
                <Text style={styles.percent}>{progress}%</Text>
              </View>
              <ProgressBar progress={progress} color={goal.color} />
              <Text style={styles.meta}>{formatVND(goal.current)} of {formatVND(goal.target)}</Text>
            </View>
          );
        })}
      </Card>

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

      <Card>
        <Text style={styles.section}>AI Assistant</Text>
        <View style={styles.chatBubble}>
          <Text style={styles.chatText}>Ask me to review transactions, explain trends, or create a custom budget for next month.</Text>
        </View>
        <PrimaryButton label="Start new chat" icon="sparkles-outline" />
      </Card>

      <Card>
        <Text style={styles.section}>Settings</Text>
        {["General Preferences", "Security & Privacy", "Active Sessions", "Export Your Data"].map((item) => (
          <Pressable key={item} style={styles.settingRow}>
            <Text style={styles.title}>{item}</Text>
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  chipText: { fontSize: 12, fontWeight: "900" },
  chatBubble: { borderRadius: 18, padding: 14, backgroundColor: "#f0fdfa", borderWidth: 1, borderColor: "#99f6e4", marginBottom: 12 },
  chatText: { color: colors.primaryDark, lineHeight: 20, fontWeight: "700" },
  settingRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  chevron: { color: colors.muted, fontSize: 28 }
});
