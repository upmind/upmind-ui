/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `LabEntry` / `LabFamily` / `NavSource` / `NavMeta` / `NavItem`
 * node exists in the tree; every shape here is RELOCATED from `useNavigation.ts`,
 * none minted. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module composables/useNavigation.types
 * @description The navigation derivation's shapes — what a route declares, the
 * tree it derives, what a developer can open, and the one normalised source both
 * declarative inputs (a route's `meta.nav` and the scenario contract) are read as.
 */

import type { Component } from "vue";

// -----------------------------------------------------------------------------

export type NavMeta = {
  label: string;
  icon?: string;
  order?: number; // Sort order among the top-level entries
  hidden?: boolean; // Hide from nav (for dynamic routes like :id)
  parent?: string; // Parent route name for nesting
};

/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-24) — NavItem gains
 * count for north-star nav badge display.
 */
export type NavItem = {
  label: string;
  icon?: Component;
  /** A named route record. */
  route?: string;
  /** A path, for an item the registry declares rather than a route record. */
  to?: string;
  dynamic?: boolean;
  children?: NavItem[];
  /** Scenario count for nav badge display (north-star .cellcount). */
  count?: number;
};

/** One composable a developer can open, whichever source declared it. */
export type LabEntry = {
  key: string;
  label: string;
  icon: Component;
  family: string;
  route?: string;
  to?: string;
  tags: string[];
};

/**
 * Entries sharing a natural family — `client` owns email, phone, address… A
 * family is a GROUP and nothing else: the icons belong to the entries.
 */
export type LabFamily = {
  name: string;
  label: string;
  entries: LabEntry[];
};

/** Either declarative source, normalised — a route record's nav, or a registry entry's. */
export type NavSource = { nav: NavMeta; route?: string; to?: string };
