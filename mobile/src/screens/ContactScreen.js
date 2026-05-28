import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendContact } from "../api/client";
import { Card } from "../components/Card";
import { Screen } from "../components/Layout";
import { colors } from "../theme";

const initialForm = { name: "", email: "", message: "" };

export default function ContactScreen() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.message.trim().length < 10) next.message = "Message must be at least 10 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    setStatus(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await sendContact(form);
      setForm(initialForm);
      setStatus({ type: "success", text: "Message sent. BudgetMate will get back to you soon." });
    } catch (error) {
      const responseErrors = error.response?.data?.errors || {};
      setErrors(responseErrors);
      setStatus({ type: "error", text: error.response?.data?.message || "Could not send message. Check the API connection." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen eyebrow="Contact" title="Talk to BudgetMate" subtitle="Send a message through the Express API with native validation.">
      <Card>
        <Field
          label="Name"
          value={form.name}
          error={errors.name}
          autoCapitalize="words"
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />
        <Field
          label="Email"
          value={form.email}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(email) => setForm((current) => ({ ...current, email }))}
        />
        <Field
          label="Message"
          value={form.message}
          error={errors.message}
          multiline
          onChangeText={(message) => setForm((current) => ({ ...current, message }))}
        />
        {!!status && (
          <View style={[styles.status, status.type === "success" ? styles.success : styles.errorBox]}>
            <Ionicons
              name={status.type === "success" ? "checkmark-circle" : "alert-circle"}
              color={status.type === "success" ? colors.success : colors.danger}
              size={18}
            />
            <Text style={[styles.statusText, status.type === "error" && styles.errorText]}>{status.text}</Text>
          </View>
        )}
        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={submit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? "Sending..." : "Send Message"}</Text>
          <Ionicons name="send" color={colors.surface} size={18} />
        </Pressable>
      </Card>
    </Screen>
  );
}

function Field({ label, error, multiline, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#94a3b8"
        style={[styles.input, multiline && styles.textarea, error && styles.inputError]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14
  },
  label: {
    color: colors.ink,
    fontWeight: "900",
    marginBottom: 8
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.ink,
    fontWeight: "700"
  },
  textarea: {
    minHeight: 120,
    paddingTop: 14,
    textAlignVertical: "top"
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    color: colors.danger,
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700"
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    marginBottom: 14
  },
  success: {
    backgroundColor: "#dcfce7"
  },
  errorBox: {
    backgroundColor: "#fee2e2"
  },
  statusText: {
    color: colors.success,
    marginLeft: 8,
    flex: 1,
    fontWeight: "800"
  },
  errorText: {
    color: colors.danger
  },
  button: {
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  buttonDisabled: {
    opacity: 0.65
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "900"
  }
});
