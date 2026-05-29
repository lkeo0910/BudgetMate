import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { IconBubble, PrimaryButton } from "../components/FinanceUI";
import { Screen } from "../components/Layout";
import { createTransaction, deleteTransaction, updateTransaction } from "../api/client";
import { formatVND } from "../data/finance";
import { useAuth } from "../context/AuthContext";
import { useFinanceData } from "../hooks/useFinanceData";
import { colors } from "../theme";

const pageSize = 5;
const initialFilters = { categoryIds: [], from: "", to: "", min: "", max: "" };
const emptyForm = { type: "EXPENSE", amount: "", date: "", vendor: "", categoryId: "", notes: "" };

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionsScreen({ navigation }) {
  const auth = useAuth();
  const { categories, error, loading, refresh, transactions } = useFinanceData();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [filters, setFilters] = useState(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((item) => {
      const matchesSearch = !query || [item.vendor, item.category, item.note].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesType = type === "ALL" || item.type === type;
      const matchesCategory = !filters.categoryIds.length || filters.categoryIds.includes(String(item.categoryId));
      const matchesFrom = !filters.from || item.date >= filters.from;
      const matchesTo = !filters.to || item.date <= filters.to;
      const matchesMin = !filters.min || item.amount >= Number(filters.min);
      const matchesMax = !filters.max || item.amount <= Number(filters.max);
      return matchesSearch && matchesType && matchesCategory && matchesFrom && matchesTo && matchesMin && matchesMax;
    });
  }, [filters, search, transactions, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function openAdd() {
    const defaultType = "EXPENSE";
    const defaultCategory = categories.find((item) => item.type === defaultType.toLowerCase());
    setEditing(null);
    setForm({ ...emptyForm, type: defaultType, date: todayString(), categoryId: defaultCategory?.id || "" });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item) {
    const category = categories.find((row) => row.name === item.category);
    setEditing(item);
    setForm({
      type: item.type,
      amount: String(item.amount),
      date: item.date,
      vendor: item.vendor,
      categoryId: String(item.categoryId || category?.id || ""),
      notes: item.note || ""
    });
    setMenuId(null);
    setFormError("");
    setFormOpen(true);
  }

  async function saveTransaction() {
    setFormError("");
    if (!form.vendor.trim()) {
      setFormError("Vendor or source is required.");
      return;
    }
    if (!form.categoryId) {
      setFormError("Select a category first.");
      return;
    }
    if (!Number(form.amount) || Number(form.amount) <= 0) {
      setFormError("Amount must be greater than 0.");
      return;
    }

    const payload = {
      vendor: form.vendor.trim(),
      category_id: /^\d+$/.test(String(form.categoryId)) ? Number(form.categoryId) : form.categoryId,
      amount: Number(form.amount),
      date: form.date,
      type: form.type,
      notes: form.notes.trim() || null
    };

    setSaving(true);
    try {
      if (editing) {
        await updateTransaction(auth.access_token, editing.id, payload);
      } else {
        await createTransaction(auth.access_token, payload);
      }
      setFormOpen(false);
      await refresh();
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTransaction(item) {
    setMenuId(null);
    setSaving(true);
    try {
      await deleteTransaction(auth.access_token, item.id);
      await refresh();
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || "Could not delete transaction.");
    } finally {
      setSaving(false);
    }
  }

  function toggleFilterCategory(id) {
    setFilters((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id)
        ? current.categoryIds.filter((item) => item !== id)
        : [...current.categoryIds, id]
    }));
  }

  function exportCsv() {
    const rows = [
      ["Date", "Vendor", "Category", "Type", "Amount", "Note"],
      ...filtered.map((item) => [item.date, item.vendor, item.category, item.type, item.amount, item.note || ""])
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "budgetmate-transactions.csv";
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <Screen eyebrow="Transactions" title="Transaction History" subtitle="Search, review, and categorize spending from the mobile feed." refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load transactions" message={error} />}

      <Card>
        <View style={styles.toolbar}>
          <View style={styles.search}>
            <Ionicons name="search-outline" color={colors.muted} size={18} />
            <TextInput placeholder="Search by vendor, category, or note..." placeholderTextColor={colors.muted} style={styles.input} value={search} onChangeText={(value) => { setSearch(value); setPage(1); }} />
          </View>
          <View style={styles.segment}>
            {["ALL", "EXPENSE", "INCOME"].map((item) => (
              <Pressable key={item} style={[styles.segmentButton, type === item && styles.segmentActive]} onPress={() => { setType(item); setPage(1); }}>
                <Text style={[styles.segmentText, type === item && styles.segmentTextActive]}>{item === "ALL" ? "All" : item === "EXPENSE" ? "Expense" : "Income"}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.actionRow}>
          <PrimaryButton label="Filter" icon="options-outline" variant="outline" onPress={() => setFilterOpen(true)} />
          <PrimaryButton label="Export CSV" icon="download-outline" variant="outline" onPress={exportCsv} />
          <PrimaryButton label="Categories" icon="shapes-outline" variant="outline" onPress={() => navigation.navigate("Categories")} />
          <PrimaryButton label="Add Transaction" icon="add-circle-outline" onPress={openAdd} />
        </View>
      </Card>

      {pageItems.length ? (
        <Card style={styles.tableCard}>
          {pageItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.transactionMain}>
                <View style={styles.transactionTop}>
                  <Text style={styles.vendor} numberOfLines={1}>{item.vendor}</Text>
                  <Text style={[styles.amount, item.type === "INCOME" ? styles.income : styles.expense]}>
                    {item.type === "INCOME" ? "+" : "-"}{formatVND(item.amount)}
                  </Text>
                </View>
                <View style={styles.transactionMetaRow}>
                  <Text style={styles.cell}>{item.date}</Text>
                  <Text style={styles.badge}>{item.category}</Text>
                  <Text style={[styles.typeBadge, item.type === "INCOME" ? styles.incomeBadge : styles.expenseBadge]}>{item.type === "INCOME" ? "Income" : "Expense"}</Text>
                </View>
              </View>
              <View style={styles.menuCell}>
                <Pressable style={styles.dots} onPress={() => setMenuId(menuId === item.id ? null : item.id)}>
                  <Text style={styles.dotsText}>...</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState title="No transactions found" message="New accounts start empty. Add a transaction after creating categories for this account." />
      )}

      <View style={styles.pagination}>
        <Text style={styles.pageMeta}>Showing {pageItems.length} transactions on page {currentPage} (Total: {filtered.length})</Text>
        <View style={styles.pageControls}>
          <Pressable disabled={currentPage === 1} onPress={() => setPage((value) => Math.max(1, value - 1))}>
            <Text style={[styles.pageButton, currentPage === 1 && styles.disabled]}>Previous</Text>
          </Pressable>
          <Text style={styles.pageNumber}>{currentPage}</Text>
          <Pressable disabled={currentPage === totalPages} onPress={() => setPage((value) => Math.min(totalPages, value + 1))}>
            <Text style={[styles.pageButton, currentPage === totalPages && styles.disabled]}>Next</Text>
          </Pressable>
        </View>
      </View>

      <FilterModal
        categories={categories}
        filters={filters}
        open={filterOpen}
        setFilters={setFilters}
        toggleCategory={toggleFilterCategory}
        onClose={() => setFilterOpen(false)}
      />
      <TransactionModal
        categories={categories}
        editing={editing}
        error={formError}
        form={form}
        open={formOpen}
        saving={saving}
        setForm={setForm}
        onClose={() => setFormOpen(false)}
        onSave={saveTransaction}
      />
      <ActionMenu
        item={transactions.find((item) => item.id === menuId)}
        onClose={() => setMenuId(null)}
        onEdit={openEdit}
        onDelete={removeTransaction}
      />
    </Screen>
  );
}

function ActionMenu({ item, onClose, onEdit, onDelete }) {
  return (
    <Modal animationType="fade" transparent visible={!!item} onRequestClose={onClose}>
      <Pressable style={styles.actionBackdrop} onPress={onClose}>
        <View style={styles.actionSheet}>
          <Text style={styles.actionTitle}>{item?.vendor}</Text>
          <Pressable style={styles.sheetButton} onPress={() => item && onEdit(item)}>
            <Ionicons name="pencil-outline" color={colors.ink} size={18} />
            <Text style={styles.menuText}>Edit</Text>
          </Pressable>
          <Pressable style={styles.sheetButton} onPress={() => item && onDelete(item)}>
            <Ionicons name="trash-outline" color={colors.rose} size={18} />
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function FilterModal({ categories, filters, open, setFilters, toggleCategory, onClose }) {
  return (
    <Modal animationType="slide" transparent visible={open} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="options-outline" color={colors.primary} size={22} />
              <Text style={styles.modalTitle}>Advanced Filters</Text>
            </View>
            <Pressable onPress={onClose}><Ionicons name="close" color={colors.ink} size={22} /></Pressable>
          </View>
          <Text style={styles.modalSubtitle}>Combine category, type, date, and amount filters to narrow your ledger.</Text>

          <Text style={styles.formLabel}>Categories</Text>
          <ScrollView style={styles.categoryList}>
            {categories.map((item) => (
              <Pressable key={item.id} style={styles.checkRow} onPress={() => toggleCategory(item.id)}>
                <Text style={styles.checkLabel}>{item.name}</Text>
                <View style={[styles.checkbox, filters.categoryIds.includes(item.id) && styles.checkboxActive]}>
                  {filters.categoryIds.includes(item.id) && <Ionicons name="checkmark" color={colors.surface} size={14} />}
                </View>
              </Pressable>
            ))}
            {!categories.length && <Text style={styles.emptyText}>No categories yet.</Text>}
          </ScrollView>

          <Text style={styles.formLabel}>Date Range</Text>
          <View style={styles.twoColumns}>
            <Field label="From" value={filters.from} placeholder="yyyy-mm-dd" onChangeText={(from) => setFilters((current) => ({ ...current, from }))} />
            <Field label="To" value={filters.to} placeholder="yyyy-mm-dd" onChangeText={(to) => setFilters((current) => ({ ...current, to }))} />
          </View>

          <Text style={styles.formLabel}>Amount Range</Text>
          <View style={styles.twoColumns}>
            <Field label="Minimum" value={filters.min} placeholder="0" keyboardType="numeric" onChangeText={(min) => setFilters((current) => ({ ...current, min }))} />
            <Field label="Maximum" value={filters.max} placeholder="No limit" keyboardType="numeric" onChangeText={(max) => setFilters((current) => ({ ...current, max }))} />
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={() => setFilters(initialFilters)}>
              <Text style={styles.clearText}>Clear All</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TransactionModal({ categories, editing, error, form, open, saving, setForm, onClose, onSave }) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const availableCategories = categories.filter((item) => item.type === form.type.toLowerCase());
  const selectedCategory = availableCategories.find((item) => item.id === form.categoryId);

  function selectType(type) {
    const defaultCategory = categories.find((item) => item.type === type.toLowerCase());
    setCategoryOpen(false);
    setForm((current) => ({ ...current, type, categoryId: defaultCategory?.id || "" }));
  }

  return (
    <Modal animationType="slide" transparent visible={open} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{editing ? "Edit Transaction" : "Add Transaction"}</Text>
              <Text style={styles.modalSubtitle}>Upload a receipt or enter details manually below.</Text>
            </View>
            <Pressable onPress={onClose}><Ionicons name="close" color={colors.ink} size={22} /></Pressable>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.dropZone}>
              <View style={styles.uploadCircle}><Ionicons name="cloud-upload-outline" color={colors.primary} size={25} /></View>
              <Text style={styles.dropTitle}>Drop receipt here to auto-fill</Text>
              <Text style={styles.dropHelp}>PDF, JPG, PNG (Max 5MB)</Text>
            </View>

            <View style={styles.typeSwitch}>
              {["EXPENSE", "INCOME"].map((item) => (
                <Pressable key={item} style={[styles.typeSwitchButton, form.type === item && styles.typeSwitchActive]} onPress={() => selectType(item)}>
                  <Text style={styles.typeSwitchText}>{item === "EXPENSE" ? "Expense" : "Income"}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.twoColumns}>
              <Field label="Amount (₫)" value={form.amount} placeholder="0" keyboardType="numeric" onChangeText={(amount) => setForm((current) => ({ ...current, amount }))} />
              <Field label="Date" value={form.date} placeholder="yyyy-mm-dd" onChangeText={(date) => setForm((current) => ({ ...current, date }))} />
            </View>
            <Field label={form.type === "INCOME" ? "Source" : "Vendor"} value={form.vendor} placeholder="e.g. Highlands Coffee..." onChangeText={(vendor) => setForm((current) => ({ ...current, vendor }))} />

          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.dropdownWrap}>
            <Pressable style={styles.dropdownButton} onPress={() => setCategoryOpen((current) => !current)}>
              <Text style={[styles.dropdownText, !selectedCategory && styles.dropdownPlaceholder]}>{selectedCategory?.name || "Select a category"}</Text>
              <Ionicons name={categoryOpen ? "chevron-up" : "chevron-down"} color={colors.muted} size={18} />
            </Pressable>
            {categoryOpen && (
              <View style={styles.dropdownMenu}>
                {availableCategories.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.dropdownItem, form.categoryId === item.id && styles.dropdownItemActive]}
                    onPress={() => {
                      setForm((current) => ({ ...current, categoryId: item.id }));
                      setCategoryOpen(false);
                    }}
                  >
                    <Ionicons name={item.icon || "pricetag-outline"} color={form.categoryId === item.id ? colors.surface : colors.text} size={15} />
                    <Text style={[styles.dropdownItemText, form.categoryId === item.id && styles.dropdownItemTextActive]}>{item.name}</Text>
                  </Pressable>
                ))}
                {!availableCategories.length && <Text style={styles.emptyText}>No {form.type === "INCOME" ? "income" : "expense"} categories yet. Open Categories to create one.</Text>}
              </View>
            )}
          </View>

            <Field label="Note" multiline value={form.notes} placeholder="Add an optional note for this transaction" onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} />
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable style={[styles.saveButton, saving && styles.saveDisabled]} disabled={saving} onPress={onSave}>
              <Text style={styles.saveText}>{saving ? "Saving..." : "Save Transaction"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput {...props} placeholderTextColor="#8a8f98" style={[styles.fieldInput, props.multiline && styles.textArea]} />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { gap: 12 },
  search: { minHeight: 50, borderRadius: 8, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  input: { flex: 1, color: colors.ink, fontWeight: "700", marginLeft: 10 },
  segment: { minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", padding: 4 },
  segmentButton: { flex: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.ink },
  segmentText: { color: colors.text, fontWeight: "900" },
  segmentTextActive: { color: colors.surface },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 12 },
  tableCard: { padding: 0, overflow: "visible" },
  tableRow: { flexDirection: "row", minHeight: 74, alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 12 },
  cell: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  transactionMain: { flex: 1, paddingRight: 8 },
  transactionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  transactionMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7, marginTop: 8 },
  menuCell: { width: 38, alignItems: "flex-end" },
  vendor: { color: colors.ink, fontWeight: "900", fontSize: 12 },
  badge: { color: colors.ink, fontSize: 11, fontWeight: "800", borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadge: { alignSelf: "flex-start", fontSize: 11, fontWeight: "900", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  incomeBadge: { color: colors.success, backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#86efac" },
  expenseBadge: { color: colors.rose, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecdd3" },
  amount: { fontWeight: "900", fontSize: 12, textAlign: "right" },
  income: { color: colors.success },
  expense: { color: colors.rose },
  dots: { minWidth: 30, minHeight: 30, alignItems: "center", justifyContent: "center" },
  dotsText: { color: colors.ink, fontWeight: "900" },
  actionBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.3)", justifyContent: "flex-end", padding: 16 },
  actionSheet: { borderRadius: 16, backgroundColor: colors.surface, padding: 12, borderWidth: 1, borderColor: colors.border },
  actionTitle: { color: colors.ink, fontWeight: "900", paddingHorizontal: 8, paddingVertical: 10 },
  sheetButton: { minHeight: 50, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12 },
  menuText: { color: colors.ink, fontWeight: "900" },
  deleteText: { color: colors.rose, fontWeight: "900" },
  pagination: { marginHorizontal: 16, marginTop: 14, gap: 10 },
  pageMeta: { color: "#55708f", fontWeight: "700" },
  pageControls: { flexDirection: "row", alignItems: "center", gap: 16 },
  pageButton: { color: colors.ink, fontWeight: "900" },
  pageNumber: { minWidth: 36, minHeight: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, textAlign: "center", textAlignVertical: "center", paddingTop: 8, color: colors.ink, fontWeight: "900" },
  disabled: { color: "#9ca3af" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 12 },
  modalPanel: { maxHeight: "94%", borderRadius: 8, backgroundColor: "#fbfcfe", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  modalScroll: { marginTop: 10 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  modalSubtitle: { color: "#61728c", lineHeight: 21, marginTop: 8 },
  categoryList: { maxHeight: 220, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 10 },
  checkRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  checkLabel: { color: colors.text, fontWeight: "800" },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: "#6b7f9c", alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  formLabel: { color: colors.text, fontWeight: "900", marginTop: 18, marginBottom: 8 },
  twoColumns: { flexDirection: "row", gap: 12 },
  field: { flex: 1, marginTop: 12 },
  fieldLabel: { color: colors.ink, fontWeight: "800", marginBottom: 8 },
  fieldInput: { minHeight: 50, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.ink, backgroundColor: colors.surface },
  textArea: { minHeight: 96, paddingTop: 12, textAlignVertical: "top" },
  modalActions: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#edf2f7", flexDirection: "row", alignItems: "center", gap: 20 },
  clearText: { color: "#64748b", fontWeight: "900" },
  applyButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  applyText: { color: colors.surface, fontWeight: "900" },
  dropZone: { marginTop: 22, minHeight: 150, borderRadius: 20, borderWidth: 2, borderStyle: "dashed", borderColor: "#dbe6f2", alignItems: "center", justifyContent: "center" },
  uploadCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#ecfdf5", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  dropTitle: { color: colors.text, fontWeight: "900" },
  dropHelp: { color: "#8aa0bd", fontWeight: "800", marginTop: 8, fontSize: 12 },
  typeSwitch: { marginTop: 20, minHeight: 40, borderRadius: 8, backgroundColor: "#e5e7eb", flexDirection: "row", padding: 3 },
  typeSwitchButton: { flex: 1, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  typeSwitchActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  typeSwitchText: { color: colors.ink, fontWeight: "800" },
  dropdownWrap: { position: "relative", zIndex: 20 },
  dropdownButton: { width: 190, minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dropdownText: { color: colors.ink, fontWeight: "800" },
  dropdownPlaceholder: { color: colors.muted },
  dropdownMenu: { position: "absolute", top: 46, left: 0, width: 190, maxHeight: 230, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, zIndex: 30, overflow: "hidden" },
  dropdownItem: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10 },
  dropdownItemActive: { backgroundColor: "#fb7185" },
  dropdownItemText: { color: colors.text, fontWeight: "800", fontSize: 12 },
  dropdownItemTextActive: { color: colors.surface },
  errorText: { color: colors.rose, fontWeight: "800", marginTop: 10 },
  saveButton: { minHeight: 50, borderRadius: 8, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 16 },
  saveDisabled: { opacity: 0.65 },
  saveText: { color: colors.surface, fontWeight: "900" },
  emptyText: { color: colors.muted, padding: 16 }
});
