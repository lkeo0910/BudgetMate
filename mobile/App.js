import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import DashboardScreen from "./src/screens/DashboardScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import BudgetScreen from "./src/screens/BudgetScreen";
import GoalsScreen from "./src/screens/GoalsScreen";
import AccountsScreen from "./src/screens/AccountsScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import AIAssistantScreen from "./src/screens/AIAssistantScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

const iconMap = {
  Dashboard: ["home", "home-outline"],
  Transactions: ["list", "list-outline"],
  Budget: ["pie-chart", "pie-chart-outline"],
  Goals: ["flag", "flag-outline"],
  Accounts: ["wallet", "wallet-outline"],
  Categories: ["layers", "layers-outline"],
  Reports: ["bar-chart", "bar-chart-outline"],
  AI: ["sparkles", "sparkles-outline"]
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
          tabBarLabelStyle: { fontSize: 9, fontWeight: "700" },
          tabBarStyle: {
            height: 70,
            paddingTop: 8,
            paddingBottom: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface
          },
          tabBarIcon: ({ focused, color, size }) => {
            const names = iconMap[route.name] || iconMap.Dashboard;
            return <Ionicons name={focused ? names[0] : names[1]} size={size} color={color} />;
          }
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Budget" component={BudgetScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
        <Tab.Screen name="Accounts" component={AccountsScreen} />
        <Tab.Screen name="Categories" component={CategoriesScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="AI" component={AIAssistantScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
