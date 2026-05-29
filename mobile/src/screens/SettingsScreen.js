import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { Screen } from "../components/Layout";
import { getCurrentUser, getUserSettings, updateUserSettings } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

const currencies = [
  { id: "vnd", label: "Vietnamese Dong (₫)" },
  { id: "usd", label: "US Dollar ($)" },
  { id: "eur", label: "Euro (€)" }
];

export default function SettingsScreen() {
  const auth = useAuth();
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState({ preferred_currency: "vnd", phone_number: "", avatar_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [settings, user] = await Promise.all([
        getUserSettings(auth.access_token),
        getCurrentUser(auth.access_token)
      ]);
      setForm({
        preferred_currency: settings.preferred_currency || "vnd",
        phone_number: user.phone_number || "",
        avatar_url: user.avatar_url || user.profile_avatar || ""
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateUserSettings(auth.access_token, {
        preferred_currency: form.preferred_currency,
        phone_number: form.phone_number || null,
        avatar_url: form.avatar_url || null
      });
      setMessage("Settings saved.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen eyebrow="Settings" title="Settings" refreshing={loading || saving} onRefresh={load}>
      {!!error && <EmptyState title="Settings error" message={error} />}

      <Card>
        <View style={styles.tabs}>
          <TabButton active={tab === "general"} label="General" icon="settings-outline" onPress={() => setTab("general")} />
          <TabButton active={tab === "security"} label="Security" icon="lock-closed-outline" onPress={() => setTab("security")} />
        </View>
      </Card>

      {loading ? (
        <Card><ActivityIndicator color={colors.primary} /></Card>
      ) : tab === "general" ? (
        <Card>
          <Text style={styles.cardTitle}>General Preferences</Text>
          <Text style={styles.help}>Manage your profile details and local display preferences.</Text>
          <Text style={styles.label}>Preferred Currency</Text>
          {currencies.map((currency) => (
            <Pressable key={currency.id} style={[styles.optionRow, form.preferred_currency === currency.id && styles.optionActive]} onPress={() => setForm((current) => ({ ...current, preferred_currency: currency.id }))}>
              <Text style={styles.optionText}>{currency.label}</Text>
              {form.preferred_currency === currency.id && <Ionicons name="checkmark-circle" color={colors.primary} size={19} />}
            </Pressable>
          ))}

          <Field label="Phone Number" value={form.phone_number} placeholder="Optional" keyboardType="phone-pad" onChangeText={(phone_number) => setForm((current) => ({ ...current, phone_number }))} />
          <Field label="Avatar URL" value={form.avatar_url} placeholder="https://..." autoCapitalize="none" onChangeText={(avatar_url) => setForm((current) => ({ ...current, avatar_url }))} />

          {!!message && <Text style={styles.successText}>{message}</Text>}
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={load}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={save} disabled={saving}>
              <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Changes"}</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>Security & Privacy</Text>
          <SecurityRow icon="shield-checkmark-outline" title="Identity Verification" detail="Verified • Level 1 Complete" />
          <SecurityRow icon="phone-portrait-outline" title="Current Session" detail="Mobile web session active" />
          <SecurityRow icon="download-outline" title="Export Your Data" detail="Use Transactions export for CSV data." />
          <Pressable style={styles.logoutButton} onPress={auth.logout}>
            <Ionicons name="log-out-outline" color={colors.surface} size={18} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </Card>
      )}
    </Screen>
  );
}

function TabButton({ active, label, icon, onPress }) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabActive]} onPress={onPress}>
      <Ionicons name={icon} color={active ? colors.surface : colors.text} size={16} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
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

function SecurityRow({ icon, title, detail }) {
  return (
    <View style={styles.securityRow}>
      <Ionicons name={icon} color={colors.primary} size={20} />
      <View style={styles.securityCopy}>
        <Text style={styles.securityTitle}>{title}</Text>
        <Text style={styles.securityDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 8 },
  tabButton: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: "900" },
  tabTextActive: { color: colors.surface },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  help: { color: colors.muted, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  label: { color: colors.text, fontSize: 12, fontWeight: "900", marginTop: 14, marginBottom: 7 },
  optionRow: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, marginTop: 8 },
  optionActive: { backgroundColor: "#ecfeff", borderColor: "#99f6e4" },
  optionText: { color: colors.ink, fontWeight: "800" },
  field: { marginTop: 4 },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.ink, fontWeight: "800", paddingHorizontal: 12, backgroundColor: colors.surface },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  primaryButton: { flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.surface, fontWeight: "900" },
  secondaryButton: { minWidth: 92, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.ink, fontWeight: "900" },
  successText: { color: colors.success, fontWeight: "800", marginTop: 12 },
  disabled: { opacity: 0.6 },
  securityRow: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  securityCopy: { flex: 1 },
  securityTitle: { color: colors.ink, fontWeight: "900" },
  securityDetail: { color: colors.muted, marginTop: 4, fontWeight: "700" },
  logoutButton: { marginTop: 16, minHeight: 46, borderRadius: 12, backgroundColor: colors.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { color: colors.surface, fontWeight: "900" }
});
