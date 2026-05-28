import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "./src/screens/HomeScreen";
import AboutScreen from "./src/screens/AboutScreen";
import SkillsScreen from "./src/screens/SkillsScreen";
import ProjectsScreen from "./src/screens/ProjectsScreen";
import EducationScreen from "./src/screens/EducationScreen";
import LeadershipScreen from "./src/screens/LeadershipScreen";
import ContactScreen from "./src/screens/ContactScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

const iconMap = {
  Home: ["home", "home-outline"],
  About: ["person", "person-outline"],
  Skills: ["sparkles", "sparkles-outline"],
  Projects: ["briefcase", "briefcase-outline"],
  Education: ["school", "school-outline"],
  Leadership: ["trophy", "trophy-outline"],
  Contact: ["chatbubble", "chatbubble-outline"]
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
          tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
          tabBarStyle: {
            height: 70,
            paddingTop: 8,
            paddingBottom: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface
          },
          tabBarIcon: ({ focused, color, size }) => {
            const names = iconMap[route.name] || iconMap.Home;
            return <Ionicons name={focused ? names[0] : names[1]} size={size} color={color} />;
          }
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="About" component={AboutScreen} />
        <Tab.Screen name="Skills" component={SkillsScreen} />
        <Tab.Screen name="Projects" component={ProjectsScreen} />
        <Tab.Screen name="Education" component={EducationScreen} />
        <Tab.Screen name="Leadership" component={LeadershipScreen} />
        <Tab.Screen name="Contact" component={ContactScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
