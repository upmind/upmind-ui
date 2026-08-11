/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 19273 nodes) — no
 * `ScenarioDeclaration` / `ScenarioPresentation` / `ScenarioAction` / `RowCell` /
 * `ScenarioNav` node exists anywhere in the tree, so the presentation contract
 * below is minted rather than consumed. What it does NOT mint: the uischema
 * element, layout and rule shapes are `@jsonforms/core`'s own
 * (`UISchemaElement` / `Layout` / `ControlElement` / `Rule`), the same ones
 * `client-email.schemas.ts` already declares its query pair with, and the badge
 * / button variants are `@upmind-automation/upmind-ui`'s CVA props. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/scenario.types
 * @description The scenario CONTRACT. One declaration per composable, holding
 * everything scenario-specific: which composable a key boots, the scope it
 * boots at, the editor a row hands off to, how a row DRAWS as a table row and
 * as a card, and which actions a surface offers with what presentation and
 * under what precondition.
 *
 * The split is the ratified one (S-D3/S-D4): core declares what the API accepts
 * and what a record IS; this declares how a playground draws it. Nothing here
 * may live in `packages/headless`, which has no scenario concept at all.
 */

import type { LiveCompositionCell } from "./composables/useCompositionPort.types";
import type { ControlElement, Layout, Rule } from "@jsonforms/core";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { BadgeProps, ButtonProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

/** The default row identifier when a declaration names none. */
export const DEFAULT_ROW_IDENTIFIER = "id";

/**
 * A scenario key. A free string since Wave B: a scenario IS its own directory
 * under this module, so "declared but not registered" is unrepresentable and
 * there is no central union left for a registry to satisfy.
 */
export type ScenarioKey = string;

/**
 * A four-layer cell once an actor is named — plus the optional `.for()` step
 * for a matrix that declares contexts for that actor.
 */
export type ScenarioScopedCell = LiveCompositionCell & {
  for?(type: string, id: string): LiveCompositionCell;
  /** The module's own internals — reachable only where the raw cell is held. */
  useInternals?(): Record<string, unknown>;
};

/**
 * A scoped four-layer composable as a declaration names it — the BUILDER
 * (`useClientEmails`), never a booted cell, so enumerating the registry
 * instantiates no scope.
 */
export type FourLayerComposable = (...args: never[]) => {
  as(actor: ScopeActorTypes): ScenarioScopedCell;
};

/** Where a row action hands off to, and which row property supplies the target's id. */
export type ScenarioHandoff = {
  target: ScenarioKey;
  contextType: string;
  /** A JSON Pointer into the ROW, validated against the row schema — never a live composable reference. */
  contextFrom: string;
};

// -----------------------------------------------------------------------------
// PRESENTATION — how a row draws
// -----------------------------------------------------------------------------

/** What a declared column or card field renders its value AS. */
export enum RowCellTypes {
  /** The value, as text. */
  TEXT = "text",
  /** A set of badges, one per truthy flag the element's `options.badges` declares. */
  BADGES = "badges",
  /** A `useDate` descriptor (`{ date, relative }`), drawn as its relative form. */
  DATE = "date"
}

/** Where a card field sits in the card's own layout. */
export enum CardSlotTypes {
  TITLE = "title",
  SUBTITLE = "subtitle",
  BODY = "body"
}

/** One badge in a {@link RowCellTypes.BADGES} cell, keyed by a flag on the scoped value. */
export type RowBadge = {
  /** The flag's own property name on the scoped object — e.g. `isVerified` on the row's `meta`. */
  flag: string;
  /** The badge label — an i18n key, never English. */
  i18n: string;
  color?: BadgeProps["color"];
  icon?: string;
};

/** The presentation channel of a declared column / card field. */
export type RowCellOptions = {
  cell: RowCellTypes;
  /** Declared for a {@link RowCellTypes.BADGES} cell, ignored otherwise. */
  badges?: RowBadge[];
  /** Where the field sits when the row draws as a card. */
  slot?: CardSlotTypes;
};

/**
 * One declared column (or card field): WHAT it points at (`scope`, a pointer
 * into the row), what it is CALLED (`i18n`) and how it DRAWS (`options`). A
 * property with no element is not rendered — which is the whole answer to the
 * `id` column (C15): a system value is excluded by never being declared, while
 * {@link ScenarioBinding.identifier} keeps it functionally available.
 */
export type RowElement = ControlElement & {
  i18n: string;
  options: RowCellOptions;
};

/** The row's own marker treatment — the flag that makes one row read as special. */
export type RowMarker = {
  /** A pointer into the row, e.g. `#/properties/meta/properties/isDefault`. */
  scope: string;
  icon: string;
};

/**
 * How a row draws in one presentation. `elements` are the declared columns (in
 * order) for the table, or the declared fields for the card; a card is simply a
 * SECOND declaration over the same row.
 */
export type RowUischema = Layout & {
  elements: RowElement[];
  options?: { marker?: RowMarker };
};

/** Where an action sits among the surface's placements. */
export enum ActionPlacementTypes {
  /** Always visible beside the row. */
  VISIBLE = "visible",
  /** Behind the overflow trigger. */
  OVERFLOW = "overflow"
}

/**
 * One action a surface offers, with its presentation and its precondition.
 *
 * `rule` is a real JSONForms rule evaluated against the ROW (`DISABLE` greys
 * the control, `HIDE` removes it), so a per-row capability the record itself
 * carries — `meta.canDelete`, `meta.isVerified`, `meta.isDefault` — gates the
 * control declaratively instead of being hand-coded into a renderer (C11).
 */
export type ScenarioAction = {
  /** The action's live name on the composable's action map. */
  name: string;
  /** The control's label — an i18n key, never English. */
  i18n: string;
  icon?: string;
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  placement: ActionPlacementTypes;
  /** What the surface SAYS when the action settles — i18n keys. */
  feedback?: { success: string; failure: string };
  rule?: Rule;
};

/** Everything a scenario declares about how it is DRAWN. */
export type ScenarioPresentation = {
  /** The table row — the declared columns, in order. */
  row: RowUischema;
  /** The same row drawn as a card. */
  card?: RowUischema;
  /** Per-row actions, in declaration order. */
  rowActions?: ScenarioAction[];
  /** Collection-level actions (add, …). */
  collectionActions?: ScenarioAction[];
};

/** How a scenario appears in the navigation and on the landing page. */
export type ScenarioNav = {
  /** The menu label — an i18n key, never English. */
  i18n: string;
  icon?: string;
};

// -----------------------------------------------------------------------------

/**
 * How a scenario BOOTS.
 *
 * `useList` is the composable the key itself boots; `useMutate` is the editor
 * its rows hand off to. A key that IS an editor declares only `useList` — the
 * pairing is a relation between two keys, not a property of one.
 */
export type ScenarioBinding = {
  useList: FourLayerComposable;
  useMutate?: FourLayerComposable;
  /** How the cell is booted. `.as('self')` is a compile error on the client-email matrices. */
  scope: { actor: ScopeActorTypes; contextType?: string };
  /** The row property carrying a row's identity, when it is not {@link DEFAULT_ROW_IDENTIFIER}. */
  identifier?: string;
  /**
   * Opt in to persisting this scenario's request state to the browser url. The
   * shared playground reads it; the flag lives here because it is a
   * per-scenario choice and the playground is generic over every key.
   */
  persistCriteria?: boolean;
  handoff?: Record<string, ScenarioHandoff>;
};

/**
 * ONE scenario, whole — the single file a `scenario-factory` writes and
 * re-reconciles. `route` is deliberately absent: the url segment and the route
 * name are the declaring DIRECTORY's name, attached by the registry and by the
 * build-time route registrar from the same directory, so the two cannot
 * disagree and a declaration cannot misname its own url.
 */
export type ScenarioDeclaration = ScenarioBinding & {
  key: ScenarioKey;
  nav?: ScenarioNav;
  presentation?: ScenarioPresentation;
};

/** A declaration once the registry has attached the directory it was found in. */
export type RegisteredScenario = ScenarioDeclaration & {
  /** The url segment AND the route name — the declaring directory's name. */
  route: string;
};
