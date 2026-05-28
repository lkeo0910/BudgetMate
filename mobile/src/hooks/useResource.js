import { useEffect, useState } from "react";
import { getResource } from "../api/client";

export function useResource(path) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    fromFallback: false
  });

  async function load() {
    setState((current) => ({ ...current, loading: true }));
    const result = await getResource(path);
    setState({ ...result, loading: false });
  }

  useEffect(() => {
    load();
  }, [path]);

  return { ...state, reload: load };
}
