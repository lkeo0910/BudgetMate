import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getSavingsGoals } from "../api/client";
import { useAuth } from "../context/AuthContext";

function asRows(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildGoalViews(goals, contributions) {
  return goals.map((goal) => {
    const contributionTotal = contributions
      .filter((item) => String(item.goal_id) === String(goal.id))
      .reduce((total, item) => total + toNumber(item.amount), 0);
    const current = toNumber(goal.initial_amount) + contributionTotal;
    const target = toNumber(goal.target_amount);
    return {
      id: String(goal.id),
      title: goal.title,
      current,
      target,
      targetDate: goal.target_date,
      categoryId: goal.category_id,
      progress: target ? Math.min(Math.round((current / target) * 100), 100) : 0
    };
  });
}

export function useSavingsGoals() {
  const auth = useAuth();
  const token = auth?.access_token;
  const [state, setState] = useState({ loading: true, error: "", goals: [], contributions: [] });

  const load = useCallback(async () => {
    if (!token) {
      setState({ loading: false, error: "", goals: [], contributions: [] });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await getSavingsGoals(token);
      setState({
        loading: false,
        error: "",
        goals: asRows(data.goals),
        contributions: asRows(data.contributions)
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.response?.data?.detail || error.message || "Unable to load savings goals.",
        goals: [],
        contributions: []
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

  const views = useMemo(() => buildGoalViews(state.goals, state.contributions), [state.contributions, state.goals]);
  const totalSaved = views.reduce((total, goal) => total + goal.current, 0);
  const totalTarget = views.reduce((total, goal) => total + goal.target, 0);

  return {
    goals: views,
    rawGoals: state.goals,
    contributions: state.contributions,
    totalSaved,
    totalTarget,
    loading: state.loading,
    error: state.error,
    refresh: load
  };
}
