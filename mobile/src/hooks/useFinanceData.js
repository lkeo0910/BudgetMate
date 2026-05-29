import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const colors = ["#14b8a6", "#f97316", "#8b5cf6", "#2563eb", "#d97706", "#e11d48", "#059669", "#0284c7"];
const icons = {
  Groceries: "cart-outline",
  Rent: "home-outline",
  Transport: "car-outline",
  Utilities: "receipt-outline",
  Entertainment: "film-outline",
  Shopping: "bag-outline",
  Healthcare: "medkit-outline",
  Goals: "flag-outline",
  Salary: "cash-outline",
  Freelance: "briefcase-outline"
};

const legacyIcons = {
  "shopping-cart": "cart-outline",
  house: "home-outline",
  car: "car-outline",
  receipt: "receipt-outline",
  film: "film-outline",
  "shopping-bag": "bag-outline",
  "heart-pulse": "heart-outline",
  "piggy-bank": "flag-outline",
  "banknote-arrow-up": "cash-outline",
  briefcase: "briefcase-outline",
  wallet: "wallet-outline"
};

const emptySummary = {
  balance: 0,
  income: 0,
  expenses: 0,
  budgetLimit: 0,
  remainingBudget: 0,
  savingsRate: 0,
  health: 0,
  projectedBalance: 0
};

function normalizeType(value) {
  return String(value || "").toUpperCase();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildFinanceData(categoryRows, transactionRows) {
  const categoryMap = new Map();
  categoryRows.forEach((item, index) => {
    const name = item.category_name || "Uncategorized";
    categoryMap.set(item.id, {
      id: String(item.id),
      name,
      type: item.category_type || "expense",
      icon: legacyIcons[item.category_icon] || item.category_icon || icons[name] || "pricetag-outline",
      assigned: toNumber(item.monthly_limit),
      activity: 0,
      color: colors[index % colors.length]
    });
  });

  const transactions = transactionRows.map((item) => {
    const category = categoryMap.get(item.category_id);
    const type = normalizeType(item.type);
    const amount = toNumber(item.amount);
    if (category) {
      category.activity += amount;
    }
    return {
      id: String(item.id),
      categoryId: item.category_id,
      date: item.date,
      vendor: item.vendor,
      note: item.notes || "",
      category: category?.name || "Uncategorized",
      type,
      amount
    };
  });

  const categories = Array.from(categoryMap.values()).map((item) => ({
    ...item,
    assigned: item.assigned || item.activity
  }));

  const income = transactions.filter((item) => item.type === "INCOME").reduce((total, item) => total + item.amount, 0);
  const expenses = transactions.filter((item) => item.type !== "INCOME").reduce((total, item) => total + item.amount, 0);
  const budgetLimit = categories.filter((item) => item.type === "expense").reduce((total, item) => total + item.assigned, 0);
  const remainingBudget = Math.max(budgetLimit - expenses, 0);
  const balance = income - expenses;
  const savingsRate = income ? Math.max(Math.round((balance / income) * 100), 0) : 0;

  return {
    categories,
    transactions,
    summary: {
      balance,
      income,
      expenses,
      budgetLimit,
      remainingBudget,
      savingsRate,
      health: transactions.length ? Math.min(100, savingsRate + 30) : 0,
      projectedBalance: balance
    },
    hasData: transactions.length > 0 || categories.length > 0
  };
}

export function useFinanceData() {
  const auth = useAuth();
  const token = auth?.access_token;
  const [state, setState] = useState({ loading: true, error: "", categoryRows: [], transactionRows: [] });

  const load = useCallback(async () => {
    if (!token) {
      setState({ loading: false, error: "", categoryRows: [], transactionRows: [] });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [categoryResponse, transactionResponse] = await Promise.all([
        api.get("/users/categories", { headers }),
        api.get("/transactions", { headers })
      ]);
      setState({
        loading: false,
        error: "",
        categoryRows: categoryResponse.data,
        transactionRows: transactionResponse.data
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.response?.data?.detail || error.message || "Unable to load finance data.",
        categoryRows: [],
        transactionRows: []
      });
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const data = useMemo(
    () => buildFinanceData(state.categoryRows, state.transactionRows),
    [state.categoryRows, state.transactionRows]
  );

  return {
    ...data,
    summary: data.summary || emptySummary,
    loading: state.loading,
    error: state.error,
    refresh: load
  };
}
