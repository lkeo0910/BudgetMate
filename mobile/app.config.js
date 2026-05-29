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
      usesCleartextTraffic: true
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        }
      }
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://54.179.178.52/api/v1"
    }
  }
};
