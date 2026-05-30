import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { formatDateValue, formatDisplayDate, parseDateValue, validateCustomRange } from "../utils/reporting";

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

export function DateRangePicker({ open, range, title = "Choose dates", onApply, onClose }) {
  const [draft, setDraft] = useState({ from: "", to: "" });
  const [activeField, setActiveField] = useState("from");
  const [monthDate, setMonthDate] = useState(startOfMonth(new Date()));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const nextDraft = { from: range?.from || "", to: range?.to || "" };
    setDraft(nextDraft);
    setError("");
    const focusDate = parseDateValue(nextDraft.from) || parseDateValue(nextDraft.to) || new Date();
    setMonthDate(startOfMonth(focusDate));
    setActiveField(nextDraft.from && !nextDraft.to ? "to" : "from");
  }, [open, range?.from, range?.to]);

  const cells = useMemo(() => buildMonthCells(monthDate), [monthDate]);
  const selected = validateCustomRange(draft);

  function shiftMonth(amount) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function selectDate(value) {
    setError("");
    setDraft((current) => {
      if (activeField === "from") {
        const currentTo = parseDateValue(current.to);
        const nextFrom = parseDateValue(value);
        return {
          from: value,
          to: currentTo && nextFrom && currentTo < nextFrom ? "" : current.to
        };
      }
      return { ...current, to: value };
    });
    setActiveField(activeField === "from" ? "to" : "from");
  }

  function apply() {
    const validation = validateCustomRange(draft);
    if (validation.error) {
      setError(validation.error);
      return;
    }
    onApply?.(draft);
    onClose?.();
  }

  if (!open) return null;

  return (
    <Modal animationType="slide" transparent visible={open} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>Pick a start date and end date.</Text>
            </View>
            <Pressable style={styles.iconButton} onPress={onClose}>
              <Ionicons name="close" color={colors.ink} size={20} />
            </Pressable>
          </View>

          <View style={styles.fields}>
            <DateField
              label="Start"
              active={activeField === "from"}
              value={draft.from}
              onFocus={() => setActiveField("from")}
              onChangeText={(from) => {
                setError("");
                setDraft((current) => ({ ...current, from }));
              }}
            />
            <DateField
              label="End"
              active={activeField === "to"}
              value={draft.to}
              onFocus={() => setActiveField("to")}
              onChangeText={(to) => {
                setError("");
                setDraft((current) => ({ ...current, to }));
              }}
            />
          </View>

          <View style={styles.monthHeader}>
            <Pressable style={styles.monthButton} onPress={() => shiftMonth(-1)}>
              <Ionicons name="chevron-back" color={colors.ink} size={18} />
            </Pressable>
            <Text style={styles.monthTitle}>{monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</Text>
            <Pressable style={styles.monthButton} onPress={() => shiftMonth(1)}>
              <Ionicons name="chevron-forward" color={colors.ink} size={18} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.weekDay}>{item}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {cells.map((cell) => (
              <Pressable
                key={cell.key}
                disabled={!cell.value}
                style={[
                  styles.day,
                  !cell.value && styles.dayBlank,
                  isInSelectedRange(cell.value, selected) && styles.dayRange,
                  isBoundary(cell.value, draft.from, draft.to) && styles.daySelected
                ]}
                onPress={() => cell.value && selectDate(cell.value)}
              >
                <Text style={[
                  styles.dayText,
                  !cell.value && styles.dayTextBlank,
                  isBoundary(cell.value, draft.from, draft.to) && styles.dayTextSelected
                ]}>
                  {cell.day || ""}
                </Text>
              </Pressable>
            ))}
          </View>

          {!!(error || selected.error) && <Text style={styles.error}>{error || selected.error}</Text>}
          {!error && !selected.error && selected.from && selected.to ? (
            <Text style={styles.success}>{formatDisplayDate(selected.from)} to {formatDisplayDate(selected.to)}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setError("");
                setDraft({ from: "", to: "" });
                setActiveField("from");
              }}
            >
              <Text style={styles.secondaryText}>Clear</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={apply}>
              <Text style={styles.applyText}>Apply Dates</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DateField({ label, value, active, onFocus, onChangeText }) {
  return (
    <Pressable style={[styles.dateField, active && styles.dateFieldActive]} onPress={onFocus}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onFocus={onFocus}
        onChangeText={onChangeText}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.muted}
        keyboardType="numbers-and-punctuation"
        style={styles.input}
      />
    </Pressable>
  );
}

function buildMonthCells(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let index = 0; index < first.getDay(); index += 1) {
    cells.push({ key: `blank-${index}`, day: "", value: "" });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ key: formatDateValue(date), day, value: formatDateValue(date) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}`, day: "", value: "" });
  }
  return cells;
}

function isBoundary(value, from, to) {
  return !!value && (value === from || value === to);
}

function isInSelectedRange(value, selected) {
  if (!value || selected.error || !selected.from || !selected.to) return false;
  const date = parseDateValue(value);
  return date >= selected.from && date <= selected.to;
}

function startOfMonth(value) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "center", padding: 14 },
  panel: { maxHeight: "94%", borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  title: { color: colors.ink, fontSize: 21, fontWeight: "900" },
  subtitle: { color: colors.muted, marginTop: 4, fontWeight: "700" },
  iconButton: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  fields: { flexDirection: "row", gap: 10, marginTop: 16 },
  dateField: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "#f8fafc", padding: 10 },
  dateFieldActive: { borderColor: colors.primary, backgroundColor: "#f0fdfa" },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  input: { minHeight: 34, color: colors.ink, fontWeight: "900", padding: 0, marginTop: 2 },
  monthHeader: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  monthButton: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  monthTitle: { color: colors.ink, fontWeight: "900", fontSize: 16 },
  weekRow: { flexDirection: "row", marginTop: 8 },
  weekDay: { flex: 1, textAlign: "center", color: colors.muted, fontWeight: "900", fontSize: 12 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  day: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  dayBlank: { opacity: 0 },
  dayRange: { backgroundColor: "#ccfbf1" },
  daySelected: { backgroundColor: colors.primary },
  dayText: { color: colors.ink, fontWeight: "900" },
  dayTextBlank: { color: "transparent" },
  dayTextSelected: { color: colors.surface },
  error: { color: colors.rose, fontWeight: "800", marginTop: 12, lineHeight: 18 },
  success: { color: colors.success, fontWeight: "800", marginTop: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  secondaryButton: { minHeight: 46, minWidth: 94, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.ink, fontWeight: "900" },
  applyButton: { flex: 1, minHeight: 46, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  applyText: { color: colors.surface, fontWeight: "900" }
});
