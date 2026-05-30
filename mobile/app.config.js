export default {
  expo: {
    name: "BudgetMate",
    slug: "budgetmate-mobile",
    version: "1.0.0",
    platforms: ["ios", "android", "web"],
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#f8fafc"
    },
    assetBundlePatterns: ["**/*"],
    android: {
      package: "com.lkeo0910.budgetmate"
    },
    ios: {
      bundleIdentifier: "com.lkeo0910.budgetmate",
      supportsTablet: true
    },
    extra: {
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ||
        "https://budgetmate-msgt.onrender.com/api/v1"
    }
  }
};
