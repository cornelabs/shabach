import { useSyncExternalStore, useEffect } from "react";
import {
  getState,
  getServerState,
  hydrateDemoStore,
  subscribe,
} from "@/lib/demo/store";
import type { DemoState } from "@/lib/demo/types";

/**
 * Subscribe to the shared demo store. The server snapshot is the seed state;
 * localStorage is hydrated after first render to avoid a hydration mismatch,
 * and cross-tab changes arrive via the storage event.
 */
export function useDemoState(): DemoState {
  useEffect(() => {
    hydrateDemoStore();
  }, []);
  return useSyncExternalStore(subscribe, getState, getServerState);
}
