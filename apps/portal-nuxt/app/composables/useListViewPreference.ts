/**
 * How a listing that offers a choice is laid out — legacy's own
 * `cProdsViewSwitcher`, which stored the pick against the user and applied it
 * on every visit. Persisted to localStorage and MODULE-scoped, so the switch,
 * the selector that reads it and any other consumer share one source of truth
 * — the shape `useTheme.ts` and `usePortalConfig.ts` already established.
 *
 * `useLocalStorage` validates nothing at runtime: a renamed view, or a
 * hand-edited storage entry, leaves an unrecognised string sitting there. So
 * the read runs through the same guard the config switcher uses, and an
 * unrecognised value falls back to the default rather than rendering nothing.
 */
import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------

export const LIST_VIEW = {
  GRID: "grid",
  TABLE: "table"
} as const;

export type ListView = (typeof LIST_VIEW)[keyof typeof LIST_VIEW];

/** A grid of cards is what legacy opened its products listing in. */
export const DEFAULT_LIST_VIEW: ListView = LIST_VIEW.GRID;

export function isListView(value: unknown): value is ListView {
  return value === LIST_VIEW.GRID || value === LIST_VIEW.TABLE;
}

const storedView = useLocalStorage<ListView | null>(
  "upmind-portal-list-view",
  null
);

export function useListViewPreference(): {
  view: ComputedRef<ListView>;
  setView: (value: string) => void;
} {
  return {
    view: computed<ListView>(() => {
      const stored = storedView.value;
      if (isListView(stored)) return stored;
      return DEFAULT_LIST_VIEW;
    }),
    setView: (value: string) => {
      if (isListView(value)) storedView.value = value;
    }
  };
}
