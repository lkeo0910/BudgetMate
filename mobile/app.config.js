export default {
  expo: {
    name: "BudgetMate",
    slug: "budgetmate-mobile",
    version: "1.0.0",
    platforms: ["ios", "android"],
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#f8fafc"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true
    },
    android: {},
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.11.107:8000/api/v1"
    }
  }
};
