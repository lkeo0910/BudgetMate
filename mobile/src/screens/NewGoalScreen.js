import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { Screen } from "../components/Layout";
import { createSavingsGoal } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

const emptyGoal = { title: "", target: "", initial: "", targetDate: "" };

export default function NewGoalScreen({ navigation }) {
  const auth = useAuth();
  const [form, setForm] = useState(emptyGoal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function saveGoal() {
    setError("");
    setSuccess("");
    const target = Number(form.target);
    const initial = Number(form.initial || 0);
    if (!form.title.trim()) {
      setError("Goal name is required.");
      return;
    }
    if (!target || target <= 0) {
      setError("Target amount must be greater than 0.");
      return;
    }
    if (initial < 0 || initial > target) {
      setError("Already saved must be between 0 and the target amount.");
      return;
    }
    if (form.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.targetDate)) {
      setError("Target date must use YYYY-MM-DD format.");
      return;
    }

    setSaving(true);
    try {
      await createSavingsGoal(auth.access_token, {
        title: form.title.trim(),
        target_amount: target,
        initial_amount: initial,
        target_date: form.targetDate || null
      });
      setForm(emptyGoal);
      setSuccess("Goal created.");
      navigation.navigate("Goals", { message: "Goal created. You can add another whenever you are ready." });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not create goal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen eyebrow="Goals" title="New Savings Goal">
      <Card>
        <Text style={styles.cardTitle}>Goal Details</Text>
        <Text style={styles.help}>Create one target at a time. The app will add a matching expense category so transactions can update progress.</Text>

        <Field label="Goal name" value={form.title} placeholder="Buy a bike" onChangeText={(title) => setForm((current) => ({ ...current, title }))} />
        <Field label="Target amount" value={form.target} placeholder="5000000" keyboardType="numeric" onChangeText={(target) => setForm((current) => ({ ...current, target }))} />
        <Field label="Already saved" value={form.initial} placeholder="0" keyboardType="numeric" onChangeText={(initial) => setForm((current) => ({ ...current, initial }))} />
        <Field label="Target date optional" value={form.targetDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" onChangeText={(targetDate) => setForm((current) => ({ ...current, targetDate }))} />

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {!!success && <Text style={styles.successText}>{success}</Text>}

        <Pressable accessibilityRole="button" accessibilityLabel="Create Goal" style={[styles.primaryButton, saving && styles.disabled]} disabled={saving} onPress={saveGoal}>
          <Ionicons name="checkmark-circle-outline" color={colors.surface} size={19} />
          <Text style={styles.primaryText}>{saving ? "Saving..." : "Create Goal"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Goals" style={styles.secondaryButton} onPress={() => navigation.navigate("Goals")}>
          <Text style={styles.secondaryText}>Back to Goals</Text>
        </Pressable>
      </Card>
    </Screen>
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
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  help: { color: colors.muted, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  field: { marginTop: 14 },
  label: { color: colors.text, fontWeight: "900", marginBottom: 7, fontSize: 12 },
  input: { minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: 12, fontWeight: "800" },
  primaryButton: { marginTop: 16, minHeight: 50, borderRadius: 12, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: colors.surface, fontWeight: "900" },
  secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondaryText: { color: colors.ink, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  errorText: { color: colors.rose, fontWeight: "800", marginTop: 12, lineHeight: 18 },
  successText: { color: colors.success, fontWeight: "800", marginTop: 12 }
});
