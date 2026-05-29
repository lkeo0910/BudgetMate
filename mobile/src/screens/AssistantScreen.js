import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, EmptyState } from "../components/Card";
import { Screen } from "../components/Layout";
import { createChatSection, deleteChatSection, getChatSection, getChatSections, sendChatMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

export default function AssistantScreen() {
  const auth = useAuth();
  const token = auth?.access_token;
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadSections(selectFirst = true) {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getChatSections(token);
      const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
      setSections(sorted);
      if (selectFirst && sorted.length && !activeId) {
        setActiveId(sorted[0].section_id);
      }
      if (!sorted.length) {
        setMessages([]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load chats.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(sectionId) {
    if (!token || !sectionId) return;
    setError("");
    try {
      const detail = await getChatSection(token, sectionId);
      setMessages(detail.messages || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load messages.");
    }
  }

  async function startChat() {
    setError("");
    setLoading(true);
    try {
      const section = await createChatSection(token, {});
      setSections((current) => [section, ...current]);
      setActiveId(section.section_id);
      setMessages([]);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not start a new chat.");
    } finally {
      setLoading(false);
    }
  }

  async function removeChat(sectionId) {
    setError("");
    try {
      await deleteChatSection(token, sectionId);
      const remaining = sections.filter((item) => item.section_id !== sectionId);
      setSections(remaining);
      setActiveId(remaining[0]?.section_id || null);
      setMessages([]);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not delete chat.");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    setInput("");
    try {
      let sectionId = activeId;
      if (!sectionId) {
        const section = await createChatSection(token, {});
        sectionId = section.section_id;
        setSections((current) => [section, ...current]);
        setActiveId(sectionId);
      }
      setMessages((current) => [...current, { role: "user", content: text, timestamp: new Date().toISOString() }]);
      const response = await sendChatMessage(token, { section_id: sectionId, message: text });
      setMessages((current) => [...current, { role: "ai", content: response.response, timestamp: new Date().toISOString() }]);
      await loadSections(false);
    } catch (err) {
      setInput(text);
      setError(err.response?.data?.detail || err.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, [token]);

  useEffect(() => {
    loadMessages(activeId);
  }, [activeId]);

  return (
    <Screen eyebrow="AI Assistant" title="BudgetMate AI" refreshing={loading || sending} onRefresh={() => loadSections(false)}>
      {!!error && <EmptyState title="Assistant error" message={error} />}

      <Card style={styles.headerCard}>
        <View style={styles.statusRow}>
          <View style={styles.sparkle}>
            <Ionicons name="sparkles-outline" color={colors.surface} size={22} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Online</Text>
            <Text style={styles.cardHelp}>Ask about spending, income, budgets, or savings goals.</Text>
          </View>
          {loading && <ActivityIndicator color={colors.primary} />}
        </View>
        <Pressable style={styles.newButton} onPress={startChat} disabled={loading}>
          <Ionicons name="add-circle-outline" color={colors.surface} size={18} />
          <Text style={styles.newButtonText}>New Chat</Text>
        </Pressable>
      </Card>

      {sections.length ? (
        <Card>
          <Text style={styles.sectionTitle}>Chats</Text>
          {sections.map((section) => (
            <Pressable key={section.section_id} style={[styles.sectionRow, activeId === section.section_id && styles.sectionActive]} onPress={() => setActiveId(section.section_id)}>
              <Ionicons name="chatbubble-ellipses-outline" color={activeId === section.section_id ? colors.primary : colors.muted} size={19} />
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionName}>{section.name || `Chat ${String(section.section_id).slice(0, 6)}`}</Text>
                <Text style={styles.sectionDate}>{formatDate(section.date)}</Text>
              </View>
              <Pressable style={styles.iconButton} onPress={() => removeChat(section.section_id)}>
                <Ionicons name="trash-outline" color={colors.rose} size={16} />
              </Pressable>
            </Pressable>
          ))}
        </Card>
      ) : (
        <EmptyState title="No previous chats" message="Start a new chat or type a message below to create one." />
      )}

      <Card>
        <Text style={styles.sectionTitle}>Conversation</Text>
        {messages.length ? (
          messages.map((message, index) => (
            <View key={`${message.timestamp}-${index}`} style={[styles.message, message.role === "user" ? styles.userMessage : styles.aiMessage]}>
              <Text style={[styles.messageRole, message.role === "user" ? styles.userRole : styles.aiRole]}>{message.role === "user" ? "You" : "BudgetMate AI"}</Text>
              <Text style={styles.messageText}>{message.content}</Text>
            </View>
          ))
        ) : (
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeTitle}>Welcome to BudgetMate AI</Text>
            <Text style={styles.welcomeText}>I can review your transactions, explain trends, and suggest budget adjustments from your local data.</Text>
          </View>
        )}
        {sending && <ActivityIndicator color={colors.primary} style={styles.sending} />}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your budget..."
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
          <Pressable style={[styles.sendButton, (!input.trim() || sending) && styles.disabled]} onPress={send} disabled={!input.trim() || sending}>
            <Ionicons name="send" color={colors.surface} size={18} />
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

function formatDate(value) {
  if (!value) return "New chat";
  try {
    return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return value;
  }
}

const styles = StyleSheet.create({
  headerCard: { backgroundColor: "#f0fdfa", borderColor: "#99f6e4" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sparkle: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  cardHelp: { color: colors.text, marginTop: 3, lineHeight: 19, fontWeight: "700" },
  newButton: { marginTop: 14, minHeight: 46, borderRadius: 12, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  newButtonText: { color: colors.surface, fontWeight: "900" },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: "900", marginBottom: 8 },
  sectionRow: { minHeight: 58, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, marginTop: 8 },
  sectionActive: { backgroundColor: "#ecfeff", borderColor: "#99f6e4" },
  sectionCopy: { flex: 1 },
  sectionName: { color: colors.ink, fontWeight: "900" },
  sectionDate: { color: colors.muted, fontSize: 12, marginTop: 3, fontWeight: "700" },
  iconButton: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  message: { borderRadius: 14, padding: 12, marginTop: 10, borderWidth: 1 },
  userMessage: { backgroundColor: "#ecfeff", borderColor: "#99f6e4" },
  aiMessage: { backgroundColor: "#f8fafc", borderColor: colors.border },
  messageRole: { fontSize: 11, fontWeight: "900", textTransform: "uppercase", marginBottom: 5 },
  userRole: { color: colors.primary },
  aiRole: { color: colors.violet },
  messageText: { color: colors.ink, lineHeight: 21, fontWeight: "700" },
  welcomeBox: { padding: 14, borderRadius: 14, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border },
  welcomeTitle: { color: colors.ink, fontWeight: "900" },
  welcomeText: { color: colors.text, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  sending: { marginTop: 12 },
  inputRow: { flexDirection: "row", gap: 8, marginTop: 14, alignItems: "flex-end" },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingTop: 12, color: colors.ink, fontWeight: "800", backgroundColor: colors.surface },
  sendButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.55 }
});
