// -----------------------------------------------------------------------------
/**
 * @module sheets/usePlaygroundSheet
 * @description The one sheet host over the page. A page registers what it wants
 * inspectable and the host renders it; the registry is what makes Debug
 * PAGE-SCOPED (`AC3.2`, `P1-R12`), because a section is removed again when the
 * component that registered it unmounts — a section registered by one page can
 * therefore never appear on another. Code and Scenario are registered the same
 * way and on the same lifetime (`registerPane`): the host imports the panes but
 * never the pages, so it holds no knowledge of what is under it.
 *
 * Which sheet is open is url state, not component state (`S11`, `AC3.1`): `sheet`
 * and `tab` come from `usePlaygroundUrlState`, the playground's one query-string
 * writer, so a colleague can be sent to the exact pane and section. Absent them
 * the user's own persisted preference decides — closed on a first visit
 * (`P1-R4`), whatever they last chose after that. A page that registers nothing
 * has no sections to show, so it offers no toggle at all.
 */

import { useStorage } from "@vueuse/core";
import { computed, onUnmounted, shallowRef, triggerRef } from "vue";
import { usePlaygroundUrlState } from "../../composables/usePlaygroundUrlState";
import { PlaygroundSheetTypes } from "./usePlaygroundSheet.types";
import { find, first, includes, map, mapValues, values } from "lodash-es";
import type {
  InspectorSection,
  PlaygroundSheetState,
  SheetPaneKey,
  SheetPaneProps,
  SheetSectionConfig
} from "./usePlaygroundSheet.types";

// -----------------------------------------------------------------------------

// --- Global state (shared across all component instances)
const registry = shallowRef<Map<string, SheetSectionConfig>>(new Map());

// The Code and Scenario views the page on screen offers, on the same lifetime
// its sections have: a page that offers neither leaves those sheets empty
// rather than showing the last page's.
const paneRegistry = shallowRef<
  Partial<{ [K in SheetPaneKey]: () => SheetPaneProps[K] }>
>({});

// The user's own preference, closed until they say otherwise, and only the
// FALLBACK: `sheet=` in the url outranks it. It survives a reload deliberately,
// and is never written by navigation — a page that registers no sections hides
// the host (`hasSections`) without recording "closed", so returning to a page
// that has them restores what they last chose.
const isPreferred = useStorage("upmind.labs.inspector.open", false);

const DEFAULT_SHEET = PlaygroundSheetTypes.DEBUG;

/** A url value is a sheet only if it names one; a hand-edited value reads as closed. */
function resolveSheet(value: unknown): PlaygroundSheetTypes | undefined {
  return find(values(PlaygroundSheetTypes), sheet => sheet === value);
}

// -----------------------------------------------------------------------------

export function usePlaygroundSheet(): PlaygroundSheetState {
  const url = usePlaygroundUrlState();

  function add(config: SheetSectionConfig): void {
    registry.value.set(config.key, {
      key: config.key,
      factory: config.factory
    });
    triggerRef(registry);
  }

  function remove(key: string): void {
    registry.value.delete(key);
    triggerRef(registry);
  }

  function clear(): void {
    registry.value.clear();
    triggerRef(registry);
  }

  function register(
    config: SheetSectionConfig,
    persistent: boolean = false
  ): void {
    add(config);
    if (!persistent) {
      onUnmounted(() => remove(config.key));
    }
  }

  function registerPane<K extends SheetPaneKey>(
    sheet: K,
    factory: () => SheetPaneProps[K]
  ): void {
    paneRegistry.value = { ...paneRegistry.value, [sheet]: factory };

    onUnmounted(() => {
      // The factory IS the ownership token. Vue mounts the incoming page before
      // unmounting the outgoing one, so an A→B navigation where both offer the
      // same sheet would otherwise let A's teardown delete B's registration.
      if (paneRegistry.value[sheet] !== factory) return;

      const { [sheet]: _removed, ...rest } = paneRegistry.value;
      paneRegistry.value = rest;
    });
  }

  const sections = computed<InspectorSection[]>(() => {
    return map(Array.from(registry.value.values()), entry => entry.factory());
  });

  // Keyed by what is REGISTERED, never by the sheets that exist: a page
  // offering neither leaves an empty bag, so `panes` answers what is on offer
  // rather than always naming both and answering `undefined`.
  const panes = computed<Partial<SheetPaneProps>>(
    () =>
      mapValues(paneRegistry.value, factory =>
        factory?.()
      ) as Partial<SheetPaneProps>
  );

  const hasSections = computed(() => registry.value.size > 0);

  const sheet = computed<PlaygroundSheetTypes | undefined>({
    get: () => {
      if (!hasSections.value) return undefined;
      return (
        resolveSheet(url.sheet.value) ??
        (isPreferred.value ? DEFAULT_SHEET : undefined)
      );
    },
    set: value => {
      const named = resolveSheet(value);
      url.sheet.value = named;
      isPreferred.value = !!named;
    }
  });

  const isOpen = computed({
    get: () => !!sheet.value,
    set: value => (value ? open() : close())
  });

  const tab = computed<string | undefined>({
    get: () => {
      const registered = map(sections.value, "name");
      return includes(registered, url.tab.value)
        ? url.tab.value
        : first(registered);
    },
    set: value => (url.tab.value = value)
  });

  function open(target?: PlaygroundSheetTypes): void {
    sheet.value = target ?? sheet.value ?? DEFAULT_SHEET;
  }

  function close(): void {
    sheet.value = undefined;
  }

  function toggle(target?: unknown): void {
    const named = resolveSheet(target);
    if (named && named !== sheet.value) open(named);
    else if (isOpen.value) close();
    else open(named);
  }

  return {
    register,
    registerPane,
    add,
    remove,
    clear,
    sections,
    panes,
    hasSections,
    sheet,
    tab,
    isOpen,
    open,
    close,
    toggle
  };
}
