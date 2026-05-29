import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { Screen } from "../components/Layout";
import { createCategory, deleteCategory, updateCategory } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFinanceData } from "../hooks/useFinanceData";
import { colors } from "../theme";

const presets = ["Food", "Travel", "Education", "Subscriptions", "Coffee", "Gifts"];
const icons = ["cart-outline", "home-outline", "car-outline", "cash-outline", "film-outline", "bag-outline", "heart-outline", "leaf-outline", "airplane-outline", "school-outline", "tv-outline", "cafe-outline", "gift-outline", "business-outline"];
const emptyForm = { name: "", type: "expense", icon: "cart-outline" };

export default function CategoriesScreen() {
  const auth = useAuth();
  const { categories, error, loading, refresh } = useFinanceData();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");

  const rows = useMemo(
    () => categories.filter((item) => filter === "all" || item.type === filter),
    [categories, filter]
  );

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ name: item.name, type: item.type, icon: item.icon || "cart-outline" });
    setFormError("");
    setListError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function saveCategory() {
    setFormError("");
    setListError("");
    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const payload = {
      category_name: form.name.trim(),
      category_type: form.type,
      category_icon: form.icon,
      monthly_limit: null
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(auth.access_token, editingId, payload);
      } else {
        await createCategory(auth.access_token, payload);
      }
      resetForm();
      await refresh();
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(item) {
    setListError("");
    setSaving(true);
    try {
      await deleteCategory(auth.access_token, item.id);
      if (editingId === item.id) {
        resetForm();
      }
      await refresh();
    } catch (err) {
      setListError(err.response?.data?.detail || err.message || "Could not delete category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen eyebrow="Categories" title="Manage Categories" subtitle="Create income or expense categories, choose the icon, and update or delete any existing category." refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load categories" message={error} />}

      <Card>
        <Text style={styles.cardTitle}>{editingId ? "Edit Category" : "Create Category"}</Text>
        <Text style={styles.helper}>Start by choosing whether this is an income or expense category.</Text>

        <View style={styles.segment}>
          {["expense", "income"].map((item) => (
            <Pressable key={item} style={[styles.segmentButton, form.type === item && styles.segmentActive]} onPress={() => setForm((current) => ({ ...current, type: item }))}>
              <Text style={[styles.segmentText, form.type === item && styles.segmentTextActive]}>{item === "expense" ? "Expense" : "Income"}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Available presets</Text>
        <View style={styles.presets}>
          {presets.map((item) => (
            <Pressable key={item} style={styles.preset} onPress={() => setForm((current) => ({ ...current, name: item }))}>
              <Ionicons name="sparkles-outline" color={colors.rose} size={14} />
              <Text style={styles.presetText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Category name</Text>
        <TextInput value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Enter category name" placeholderTextColor={colors.muted} style={styles.input} />

        <Text style={styles.label}>Choose logo</Text>
        <View style={styles.iconGrid}>
          {icons.map((icon) => (
            <Pressable key={icon} style={[styles.iconChoice, form.icon === icon && styles.iconChoiceActive]} onPress={() => setForm((current) => ({ ...current, icon }))}>
              <Ionicons name={icon} color={colors.rose} size={20} />
            </Pressable>
          ))}
        </View>

        {!!formError && <Text style={styles.errorText}>{formError}</Text>}
        <View style={styles.formActions}>
          {editingId && (
            <Pressable style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          )}
          <Pressable style={[styles.createButton, saving && styles.disabled]} disabled={saving} onPress={saveCategory}>
            <Ionicons name={editingId ? "save-outline" : "add"} color={colors.surface} size={17} />
            <Text style={styles.createText}>{editingId ? "Save Category" : "Create Category"}</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Current Categories</Text>
        <Text style={styles.helper}>Editing or deleting here updates the rest of the app because categories come from the backend.</Text>

        <View style={styles.filterTabs}>
          {["all", "income", "expense"].map((item) => (
            <Pressable key={item} style={[styles.filterTab, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === "all" ? "All" : item === "income" ? "Income" : "Expense"}</Text>
            </Pressable>
          ))}
        </View>

        {!!listError && <Text style={styles.errorText}>{listError}</Text>}
        {rows.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={[styles.iconBubble, item.type === "income" && styles.incomeBubble]}>
              <Ionicons name={item.icon || "pricetag-outline"} color={item.type === "income" ? colors.success : colors.rose} size={20} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={[styles.rowType, item.type === "income" && styles.incomeText]}>{item.type === "income" ? "Income" : "Expense"}</Text>
            </View>
            <Pressable style={styles.smallButton} onPress={() => startEdit(item)}>
              <Ionicons name="pencil-outline" color={colors.ink} size={15} />
              <Text style={styles.smallButtonText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => removeCategory(item)}>
              <Ionicons name="trash-outline" color={colors.ink} size={15} />
              <Text style={styles.smallButtonText}>Delete</Text>
            </Pressable>
          </View>
        ))}
        {!rows.length && <Text style={styles.emptyInline}>No categories yet. Create a category first, then you can add transactions.</Text>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: colors.ink, fontSize: 21, fontWeight: "900" },
  helper: { color: "#55708f", lineHeight: 19, marginTop: 6, fontSize: 12 },
  segment: { marginTop: 18, minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "#f8fafc", flexDirection: "row", padding: 3 },
  segmentButton: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: colors.rose },
  segmentText: { color: colors.rose, fontWeight: "900" },
  segmentTextActive: { color: colors.surface },
  label: { color: colors.text, fontWeight: "900", marginTop: 18, marginBottom: 8, fontSize: 12 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: { minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: "#fecdd3", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  presetText: { color: colors.rose, fontWeight: "800", fontSize: 12 },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.ink, fontWeight: "800" },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconChoice: { width: 70, height: 38, borderRadius: 14, borderWidth: 1, borderColor: "#fecdd3", alignItems: "center", justifyContent: "center" },
  iconChoiceActive: { backgroundColor: "#fff1f2", borderColor: colors.rose },
  errorText: { color: colors.rose, fontWeight: "800", marginTop: 12 },
  formActions: { marginTop: 16, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 10 },
  createButton: { minHeight: 42, borderRadius: 8, backgroundColor: "#fb7185", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18 },
  createText: { color: colors.surface, fontWeight: "900" },
  cancelButton: { minHeight: 42, justifyContent: "center", paddingHorizontal: 10 },
  cancelText: { color: colors.muted, fontWeight: "900" },
  disabled: { opacity: 0.65 },
  filterTabs: { marginTop: 18, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 3, flexDirection: "row" },
  filterTab: { minHeight: 34, borderRadius: 8, justifyContent: "center", paddingHorizontal: 14 },
  filterActive: { backgroundColor: colors.ink },
  filterText: { color: colors.rose, fontWeight: "800", fontSize: 12 },
  filterTextActive: { color: colors.surface },
  row: { marginTop: 12, minHeight: 62, borderRadius: 14, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  iconBubble: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#ffe4e6", alignItems: "center", justifyContent: "center" },
  incomeBubble: { backgroundColor: "#bbf7d0" },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.ink, fontWeight: "900" },
  rowType: { color: colors.rose, fontSize: 12, marginTop: 3, fontWeight: "800" },
  incomeText: { color: colors.success },
  smallButton: { minHeight: 34, borderRadius: 7, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  smallButtonText: { color: colors.ink, fontWeight: "800", fontSize: 12 },
  emptyInline: { color: colors.muted, fontWeight: "800", lineHeight: 20, marginTop: 16 }
});
