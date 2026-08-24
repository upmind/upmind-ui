/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `LabEntry` / `LabFamily` / `NavSource` / `NavMeta` / `NavItem` / `NavSection`
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

// -----------------------------------------------------------------------------

export type NavMeta = {
  label: string;
  icon?: string;
  section?: string; // e.g., "Labs", "Portal", "Admin"
  order?: number; // Sort order within section
  hidden?: boolean; // Hide from nav (for dynamic routes like :id)
  parent?: string; // Parent route name for nesting
};

/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-24) — NavItem gains
 * count for north-star nav badge display.
 */
export type NavItem = {
  label: string;
  icon?: string;
  /** A named route record. */
  route?: string;
  /** A path, for an item the registry declares rather than a route record. */
  to?: string;
  dynamic?: boolean;
  children?: NavItem[];
  /** Scenario count for nav badge display (north-star .cellcount). */
  count?: number;
};

export type NavSection = {
  label: string;
  icon?: string;
  order: number;
  children: NavItem[];
};

/** One composable a developer can open, whichever source declared it. */
export type LabEntry = {
  key: string;
  label: string;
  icon: string;
  family: string;
  route?: string;
  to?: string;
  tags: string[];
};

/** Entries sharing a natural family — `client` owns email, phone, address… */
export type LabFamily = {
  name: string;
  label: string;
  icon: string;
  entries: LabEntry[];
};

/** Either declarative source, normalised — a route record's nav, or a registry entry's. */
export type NavSource = { nav: NavMeta; route?: string; to?: string };
