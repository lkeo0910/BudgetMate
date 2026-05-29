import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import BudgetScreen from "./src/screens/BudgetScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import MoreScreen from "./src/screens/MoreScreen";
import { AuthProvider } from "./src/context/AuthContext";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

const iconMap = {
  Dashboard: ["bar-chart", "bar-chart-outline"],
  Budget: ["wallet", "wallet-outline"],
  Transactions: ["receipt", "receipt-outline"],
  Categories: ["pricetags", "pricetags-outline"],
  Reports: ["analytics", "analytics-outline"],
  More: ["grid", "grid-outline"]
};

const AUTH_STORAGE_KEY = "budgetmate.auth";

function AppTabs() {
  const { width } = useWindowDimensions();
  const compactTabs = width < 375;

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarShowLabel: !compactTabs,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
          tabBarStyle: {
            height: compactTabs ? 62 : 72,
            paddingTop: 8,
            paddingBottom: compactTabs ? 8 : 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            shadowColor: "#0f172a",
            shadowOpacity: 0.08,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: -6 },
            elevation: 10
          },
          tabBarIcon: ({ focused, color, size }) => {
            const names = iconMap[route.name] || iconMap.Dashboard;
            return <Ionicons name={focused ? names[0] : names[1]} size={size} color={color} />;
          }
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Budget" component={BudgetScreen} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Categories" component={CategoriesScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [restoringSession, setRestoringSession] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then((storedUser) => {
        if (active && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      })
      .catch(() => {
        AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      })
      .finally(() => {
        if (active) {
          setRestoringSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleAuthenticated(result) {
    setUser(result);
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result));
    } catch {
      // The in-memory session still works if device storage is unavailable.
    }
  }

  async function logout() {
    setUser(null);
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Clearing local React state is enough to return to the login screen.
    }
  }

  if (restoringSession) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Restoring your session...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  return (
    <AuthProvider value={{ ...user, logout }}>
      <AppTabs />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24
  },
  loadingText: {
    color: colors.muted,
    fontWeight: "800",
    marginTop: 14
  }
});
