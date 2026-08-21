/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) —
 * queried for `sheet` · `pane` · `playground` · `inspectorItem` /
 * `inspectorSection`: every `Sheet*` node in the tree is a `packages/ui`
 * component (`packages/ui/src/ui/sheet/**`), never a state shape, and the only
 * registry-item types anywhere were `InspectorItemConfig` / `InspectorItemEntry`
 * in `app/components/inspector/useInspector.types.ts` — the file this one
 * replaced. So the open-state contract below is minted, while the SECTION shape
 * is the Inspector's own, relocated here by T3.2 with the rest of its body
 * rather than re-minted, and the two pane payloads are the panes' own props.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module sheets/usePlaygroundSheet.types
 * @description What a page registers into the one sheet host, and the open state
 * the url owns — which sheet is over the page, and which section is showing
 * inside it (`AC3.1`, `AC3.2`).
 */

import type { CodePaneProps } from "./CodePane.types";
import type { ScenarioPaneProps } from "./ScenarioPane.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { ComputedRef, WritableComputedRef } from "vue";

// -----------------------------------------------------------------------------

/** The sheets the toggle offers, and nothing else (`AC3.1`, `G14 refined`). */
export enum PlaygroundSheetTypes {
  DEBUG = "debug",
  CODE = "code",
  SCENARIO = "scenario"
}

/**
 * What each sheet is CALLED, in offered order (`S21` — a rendered name is a key,
 * never a literal). Two surfaces draw the same three names: the toggle in the
 * page's scenario bar, and the switcher inside the open panel — the one that
 * stays reachable while the panel covers the bar's own tail. The catalogue is
 * stated here so neither surface can call a sheet something the other does not.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-13, 7394 nodes) — no
 * sheet-label / sheet-title catalogue node exists anywhere in the tree; the
 * `SHEET_TITLES` this replaces was a local const inside `SheetHost.vue`. The
 * shape is NOT minted: it is `ForcedCanvas.types.ts`'s `FORCE_PRESET_LABELS`
 * — one i18n key per member of an existing enum — applied to the enum above.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
export const SHEET_LABELS: Record<PlaygroundSheetTypes, string> = {
  [PlaygroundSheetTypes.DEBUG]: "labs.sheet_debug",
  [PlaygroundSheetTypes.CODE]: "labs.sheet_code",
  [PlaygroundSheetTypes.SCENARIO]: "labs.sheet_scenario"
};

/** A context entry that names its own emptiness rule. */
export type ContextItem = {
  /** The value to display. */
  value: unknown;
  /** Hide this item while the value is empty/null/undefined. */
  hideIfEmpty?: boolean;
};

/**
 * One Debug tab: a live read of what a page wants inspectable — the
 * Inspector's own section shape, unchanged (`AC3.2`).
 */
export type InspectorSection = {
  /** Section name, which is also its tab and its `tab=` url value. */
  name: string;
  /** Machine state value — a string path or a parallel-state object. */
  state?: unknown;
  /** Whatever the cell is carrying as errors. */
  errors?: unknown;
  /** Meta flags, resolved or still wrapped in their own computed. */
  meta?: Record<string, boolean | ComputedRef<boolean> | undefined>;
  /** Context values, raw or with an emptiness rule. */
  context?: Record<string, unknown | ContextItem>;
  /** The scope the cell was built at, and the matrix it resolves against. */
  scope?: {
    actor: ScopeActorTypes;
    context?: Record<string, unknown>;
    brandId?: string;
    matrix: Record<ScopeActorTypes, unknown>;
  };
};

/** A section a page hands the host. */
export type SheetSectionConfig = {
  /** Unique key for this section — what the unmount cleanup removes. */
  key: string;
  /** Read on every access, so a section's values stay live without the registry watching them. */
  factory: () => InspectorSection;
};

/**
 * The two sheets that are ONE view of the page rather than a set of tabs, and
 * the props each is drawn from. Debug is absent deliberately: it is the section
 * registry above, so a page fills it by registering sections.
 */
export type SheetPaneProps = {
  [PlaygroundSheetTypes.CODE]: CodePaneProps;
  [PlaygroundSheetTypes.SCENARIO]: ScenarioPaneProps;
};

export type SheetPaneKey = keyof SheetPaneProps;

export type PlaygroundSheetState = {
  /** Register a section, removed again when the registering component unmounts. */
  register: (config: SheetSectionConfig, persistent?: boolean) => void;
  /**
   * Offer the page's Code or Scenario view, on the same page-scoped lifetime a
   * section has: content is registered, never imported by the host, so the one
   * host over the page holds no knowledge of which page is under it.
   */
  registerPane: <K extends SheetPaneKey>(
    sheet: K,
    factory: () => SheetPaneProps[K]
  ) => void;
  /** Each offered pane's live props, re-read from its own factory. */
  panes: ComputedRef<Partial<SheetPaneProps>>;
  /** Add a section without auto-cleanup, for a caller owning its own lifecycle. */
  add: (config: SheetSectionConfig) => void;
  /** Remove one section by key. */
  remove: (key: string) => void;
  /** Drop every section. */
  clear: () => void;
  /** Every registered section, re-read from its own factory. */
  sections: ComputedRef<InspectorSection[]>;
  /** True while any section is registered — the toggle's own gate (`P1-R4`). */
  hasSections: ComputedRef<boolean>;
  /** Which sheet is open; `undefined` while none is. */
  sheet: WritableComputedRef<PlaygroundSheetTypes | undefined>;
  /** The open sheet's section, falling back to the first registered one. */
  tab: WritableComputedRef<string | undefined>;
  /** Whether a sheet is open at all. */
  isOpen: WritableComputedRef<boolean>;
  /** Open a sheet, recording the preference a silent url falls back to. */
  open: (sheet?: PlaygroundSheetTypes) => void;
  /** Close whatever is open, recording the same preference. */
  close: () => void;
  /**
   * Open ⇄ close, or switch straight to another sheet while one is open.
   * Anything that does not name a sheet toggles the current one, because the app
   * chrome binds this directly to a click.
   */
  toggle: (sheet?: unknown) => void;
};
