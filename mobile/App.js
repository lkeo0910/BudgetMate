import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import LandingScreen from "./src/screens/LandingScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import BudgetScreen from "./src/screens/BudgetScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import MoreScreen from "./src/screens/MoreScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

const iconMap = {
  Home: ["home", "home-outline"],
  Dashboard: ["bar-chart", "bar-chart-outline"],
  Budget: ["wallet", "wallet-outline"],
  Transactions: ["receipt", "receipt-outline"],
  Reports: ["analytics", "analytics-outline"],
  More: ["grid", "grid-outline"]
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
          tabBarStyle: {
            height: 72,
            paddingTop: 8,
            paddingBottom: 10,
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
        <Tab.Screen name="Home" component={LandingScreen} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Budget" component={BudgetScreen} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
