import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { Screen } from "../components/Layout";
import { changePassword } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePasswordScreen() {
  const auth = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [visible, setVisible] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit() {
    setError("");
    setSuccess("");
    if (!form.currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/.test(form.newPassword)) {
      setError("New password must be 8+ characters and include a letter, number, and special character.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation must match.");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(auth.access_token, {
        current_password: form.currentPassword,
        new_password: form.newPassword
      });
      setForm(emptyForm);
      setSuccess("Password updated successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen eyebrow="Security" title="Change Password">
      <Card>
        <Text style={styles.cardTitle}>Update Password</Text>
        <Text style={styles.help}>Use a strong password that you do not use anywhere else.</Text>
        <PasswordField
          label="Current password"
          value={form.currentPassword}
          visible={!!visible.currentPassword}
          onToggle={() => setVisible((current) => ({ ...current, currentPassword: !current.currentPassword }))}
          onChangeText={(currentPassword) => setForm((current) => ({ ...current, currentPassword }))}
        />
        <PasswordField
          label="New password"
          value={form.newPassword}
          visible={!!visible.newPassword}
          onToggle={() => setVisible((current) => ({ ...current, newPassword: !current.newPassword }))}
          onChangeText={(newPassword) => setForm((current) => ({ ...current, newPassword }))}
        />
        <PasswordField
          label="Confirm new password"
          value={form.confirmPassword}
          visible={!!visible.confirmPassword}
          onToggle={() => setVisible((current) => ({ ...current, confirmPassword: !current.confirmPassword }))}
          onChangeText={(confirmPassword) => setForm((current) => ({ ...current, confirmPassword }))}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!success && <Text style={styles.success}>{success}</Text>}
        <Pressable style={[styles.button, saving && styles.disabled]} disabled={saving} onPress={submit}>
          <Ionicons name="shield-checkmark-outline" color={colors.surface} size={18} />
          <Text style={styles.buttonText}>{saving ? "Updating..." : "Update Password"}</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

function PasswordField({ label, value, visible, onToggle, onChangeText }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          secureTextEntry={!visible}
          onChangeText={onChangeText}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable style={styles.eyeButton} onPress={onToggle}>
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} color={colors.muted} size={19} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  help: { color: colors.muted, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  field: { marginTop: 14 },
  label: { color: colors.text, fontWeight: "900", marginBottom: 7, fontSize: 12 },
  inputWrap: { minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" },
  input: { flex: 1, minHeight: 48, color: colors.ink, fontWeight: "800" },
  eyeButton: { width: 38, minHeight: 44, alignItems: "center", justifyContent: "center" },
  button: { marginTop: 16, minHeight: 50, borderRadius: 12, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { color: colors.surface, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  error: { color: colors.rose, fontWeight: "800", marginTop: 12, lineHeight: 18 },
  success: { color: colors.success, fontWeight: "800", marginTop: 12 }
});
