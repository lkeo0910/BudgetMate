import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { ProgressBar } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { createGoalContribution, createSavingsGoal, deleteSavingsGoal } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { useSavingsGoals } from "../hooks/useSavingsGoals";
import { colors } from "../theme";

const emptyGoal = { title: "", target: "", initial: "", targetDate: "" };

export default function GoalsScreen() {
  const auth = useAuth();
  const { refresh: refreshFinance } = useFinanceData();
  const { error, goals, loading, refresh, totalSaved, totalTarget } = useSavingsGoals();
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  async function refreshAll() {
    await Promise.all([refresh(), refreshFinance()]);
  }

  async function addGoal() {
    setFormError("");
    setMessage("");
    const target = Number(goalForm.target);
    const initial = Number(goalForm.initial || 0);
    if (!goalForm.title.trim()) {
      setFormError("Goal name is required.");
      return;
    }
    if (!target || target <= 0) {
      setFormError("Target amount must be greater than 0.");
      return;
    }
    if (initial < 0 || initial > target) {
      setFormError("Already saved must be between 0 and the target amount.");
      return;
    }

    setSaving(true);
    try {
      await createSavingsGoal(auth.access_token, {
        title: goalForm.title.trim(),
        target_amount: target,
        initial_amount: initial,
        target_date: goalForm.targetDate || null
      });
      setGoalForm(emptyGoal);
      setMessage("Goal added.");
      await refreshAll();
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || "Could not add goal.");
    } finally {
      setSaving(false);
    }
  }

  async function addContribution(goal) {
    setFormError("");
    setMessage("");
    const amount = Number(drafts[goal.id]);
    if (!amount || amount <= 0) {
      setFormError("Enter a contribution amount greater than 0.");
      return;
    }

    setSaving(true);
    try {
      await createGoalContribution(auth.access_token, goal.id, {
        amount,
        date: new Date().toISOString().slice(0, 10),
        note: `Contribution to ${goal.title}`
      });
      setDrafts((current) => ({ ...current, [goal.id]: "" }));
      setMessage("Contribution saved and recorded as an expense.");
      await refreshAll();
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || "Could not add contribution.");
    } finally {
      setSaving(false);
    }
  }

  async function removeGoal(goal) {
    setSaving(true);
    setFormError("");
    setMessage("");
    try {
      await deleteSavingsGoal(auth.access_token, goal.id);
      setMessage("Goal removed.");
      await refreshAll();
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || "Could not delete goal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen eyebrow="Goals" title="Savings Goals" refreshing={loading || saving} onRefresh={refreshAll}>
      {!!error && <EmptyState title="Could not load goals" message={error} />}

      <Card style={styles.summaryCard}>
        <Summary label="Saved So Far" value={formatVND(totalSaved)} icon="wallet-outline" />
        <Summary label="Target Across Goals" value={formatVND(totalTarget)} icon="flag-outline" />
        <Summary label="Active Goals" value={String(goals.length)} icon="analytics-outline" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Add Goal</Text>
        <Text style={styles.help}>Set a target, optionally include money already saved, then add contributions over time.</Text>
        <Field label="Goal name" value={goalForm.title} placeholder="Emergency fund" onChangeText={(title) => setGoalForm((current) => ({ ...current, title }))} />
        <View style={styles.twoColumns}>
          <Field label="Target amount" value={goalForm.target} placeholder="5000000" keyboardType="numeric" onChangeText={(target) => setGoalForm((current) => ({ ...current, target }))} />
          <Field label="Already saved" value={goalForm.initial} placeholder="0" keyboardType="numeric" onChangeText={(initial) => setGoalForm((current) => ({ ...current, initial }))} />
        </View>
        <Field label="Target date" value={goalForm.targetDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" onChangeText={(targetDate) => setGoalForm((current) => ({ ...current, targetDate }))} />
        {!!formError && <Text style={styles.errorText}>{formError}</Text>}
        {!!message && <Text style={styles.successText}>{message}</Text>}
        <Pressable style={[styles.primaryButton, saving && styles.disabled]} disabled={saving} onPress={addGoal}>
          <Ionicons name="add-circle-outline" color={colors.surface} size={18} />
          <Text style={styles.primaryText}>{saving ? "Saving..." : "Add Goal"}</Text>
        </Pressable>
      </Card>

      {goals.length ? (
        goals.map((goal) => (
          <Card key={goal.id}>
            <View style={styles.goalTop}>
              <View style={styles.goalCopy}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalMeta}>{formatVND(goal.current)} of {formatVND(goal.target)}</Text>
              </View>
              <Text style={styles.goalPercent}>{goal.progress}%</Text>
            </View>
            <ProgressBar progress={goal.progress} color={colors.primary} />
            {!!goal.targetDate && <Text style={styles.goalDate}>Target date: {goal.targetDate}</Text>}
            <View style={styles.contributionRow}>
              <TextInput
                value={drafts[goal.id] || ""}
                placeholder="Contribution amount"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={styles.contributionInput}
                onChangeText={(value) => setDrafts((current) => ({ ...current, [goal.id]: value }))}
              />
              <Pressable style={styles.smallButton} onPress={() => addContribution(goal)} disabled={saving}>
                <Text style={styles.smallButtonText}>Add</Text>
              </Pressable>
            </View>
            <Pressable style={styles.deleteButton} onPress={() => removeGoal(goal)} disabled={saving}>
              <Ionicons name="trash-outline" color={colors.rose} size={16} />
              <Text style={styles.deleteText}>Delete goal</Text>
            </Pressable>
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

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.muted} style={styles.input} />
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
  primaryButton: { marginTop: 16, minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: colors.surface, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  errorText: { color: colors.rose, fontWeight: "800", marginTop: 12 },
  successText: { color: colors.success, fontWeight: "800", marginTop: 12 },
  goalTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  goalCopy: { flex: 1 },
  goalTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  goalMeta: { color: colors.muted, marginTop: 4, fontWeight: "800" },
  goalPercent: { color: colors.primary, fontWeight: "900", fontSize: 17 },
  goalDate: { color: colors.text, marginTop: 10, fontWeight: "700" },
  contributionRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  contributionInput: { flex: 1, minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, color: colors.ink, fontWeight: "800" },
  smallButton: { minWidth: 72, minHeight: 46, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  smallButtonText: { color: colors.surface, fontWeight: "900" },
  deleteButton: { alignSelf: "flex-start", minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
  deleteText: { color: colors.rose, fontWeight: "900" }
});
