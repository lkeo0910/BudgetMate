import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LoadingState } from "../components/LoadingState";
import { Notice, Screen } from "../components/Layout";
import { useResource } from "../hooks/useResource";
import { colors } from "../theme";

export default function AIAssistantScreen() {
  const { data, loading, error, fromFallback, reload } = useResource("/ai-chat");
  const [messages, setMessages] = useState([
    { id: 1, type: "bot", text: "Hi! I'm your financial AI assistant. I can help you with budgeting insights, savings tips, and financial advice. What would you like to know?" },
    { id: 2, type: "bot", text: "💡 Tip: You're spending 42% more on groceries this month. Would you like suggestions to reduce this?" }
  ]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef(null);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() === "") return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputText
    };

    setMessages([...messages, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const botResponses = [
        "That's a great question! Based on your spending patterns, here's what I recommend...",
        "I analyzed your recent transactions. Here are some insights that might help you save more.",
        "Your budget health is looking good! Keep maintaining these spending habits.",
        "I notice a trend in your expenses. Would you like me to help you adjust your budget?",
        "That's an interesting question. Let me provide some personalized financial advice based on your data."
      ];

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        text: randomResponse
      };

      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInputText("");
  };

  const renderMessage = ({ item }) => {
    const isBot = item.type === "bot";
    
    return (
      <View style={[styles.messageContainer, isBot ? styles.botContainer : styles.userContainer]}>
        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botBubble : styles.userBubble
          ]}
        >
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.eyebrow}>BudgetMate</Text>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>Your financial advisor</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything about your finances..."
          placeholderTextColor={colors.muted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={18}
            color={inputText.trim() ? colors.surface : colors.muted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerContainer: {
    paddingTop: 58,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#eff6ff",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 8
  },
  messageList: {
    flex: 1
  },
  messageListContent: {
    paddingVertical: 12
  },
  messageContainer: {
    paddingHorizontal: 12,
    marginVertical: 6,
    justifyContent: "flex-end"
  },
  userContainer: {
    alignItems: "flex-end"
  },
  botContainer: {
    alignItems: "flex-start"
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4
  },
  botBubble: {
    backgroundColor: colors.border,
    borderBottomLeftRadius: 4
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  userText: {
    color: colors.surface,
    fontWeight: "500"
  },
  botText: {
    color: colors.text,
    fontWeight: "500"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    maxHeight: 100
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonDisabled: {
    backgroundColor: colors.border
  }
});
