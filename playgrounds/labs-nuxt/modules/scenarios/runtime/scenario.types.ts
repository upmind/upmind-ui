/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 19273 nodes) — no
 * `ScenarioDeclaration` / `ScenarioPresentation` / `ScenarioAction` /
 * `TableCell*` node exists anywhere in the tree, so the presentation contract
 * below is minted rather than consumed. What it does NOT mint: the uischema
 * element, layout and rule shapes are `@jsonforms/core`'s own
 * (`UISchemaElement` / `Layout` / `ControlElement` / `Rule`), the same ones
 * `client-email.schemas.ts` already declares its query pair with, a scope is
 * headless's own `ScopeContext` and a matrix headless's own
 * `ActorContextMatrix` (`R6-30d`), the badge / button variants are
 * `@upmind-automation/upmind-ui`'s CVA props, and `tracks` is the MODULE NAME
 * its own committed test artefacts are keyed by rather than a second playlist
 * shape. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/scenario.types
 * @description The scenario CONTRACT. One module, ONE declaration, holding
 * everything scenario-specific: which composables a key boots, the editor a row
 * hands off to, how a row DRAWS as a table row and as a card, which actions a
 * surface offers, and which module's committed scenarios it plays.
 *
 * Every channel here is one no other surface owns. A fact the COMPOSABLE
 * already owns is never restated: the filter bar and the sort control render
 * off the criteria schema, the editor's fields off the mutate composable's own
 * schemas, and the offerable actors off the composable's own scope matrix. Nor
 * does it declare a boot scope — a page boots as self with no context, and only
 * the url's `/as/:actor` and `/for/:type/:id` segments move it (`R6-30b`).
 *
 * The split is the ratified one (S-D3/S-D4): core declares what the API accepts
 * and what a record IS; this declares how a playground draws it. Nothing here
 * may live in `packages/headless`, which has no scenario concept at all.
 */

import type { LiveCompositionCell } from "./composables/useCompositionPort.types";
import type { ControlElement, Layout, Rule } from "@jsonforms/core";
import type {
  ActorContextMatrix,
  ScopeActorTypes,
  ScopeContext
} from "@upmind-automation/headless";
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
 * for a matrix that declares contexts for that actor, and the `.fresh()` step a
 * caller opening a NEW record takes.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — both
 * steps are `scope.builder.ts`'s own builder methods, named here rather than
 * minted.
 */
export type ScenarioScopedCell = LiveCompositionCell & {
  for?(type: string, id: string): LiveCompositionCell;
  /**
   * A distinct instance, never served from the scope registry's cache — what an
   * editor opened on a record that does not exist yet is booted with.
   */
  fresh?(): LiveCompositionCell;
  /** The module's own internals — reachable only where the raw cell is held. */
  useInternals?(): Record<string, unknown>;
};

/**
 * A scoped four-layer composable as a declaration names it — the BUILDER
 * (`useClientEmails`), never a booted cell, so enumerating the registry
 * instantiates no scope.
 */
export type FourLayerComposable = ((...args: never[]) => {
  as(actor: ScopeActorTypes): ScenarioScopedCell;
}) & {
  /**
   * The module's OWN matrix, carried by the builder that created it — which
   * actors the page may offer, read off the composable rather than restated
   * beside it (`R6-31`). Absent for a composable registered without one, and
   * the acting-for picker then offers nothing rather than guessing.
   *
   * @graphify-citation `graphify-out/graph.json` (2026-08-13, 7394 nodes) — no
   * `ActorContextMatrix` / `scopeMatrix` node exists here; the shape is
   * headless's own `ActorContextMatrix`, consumed rather than re-spelt
   * (`R6-30d`).
   */
  scopeMatrix?: ActorContextMatrix;
};

/**
 * The editor a control opens, declared INLINE (`R6-27`): the declaration's own
 * `useMutate` drives it and its fields come from that composable's schemas, so
 * a handoff names no second declaration and an editor needs no directory of its
 * own.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * handoff node exists; the scope it resolves to is headless's `ScopeContext`.
 */
export type ScenarioHandoff = {
  /**
   * The scope context the editor boots at, as a TEMPLATE: the `type` is
   * declared and the `id` is read off the ROW at `from`, a JSON Pointer
   * validated against the row schema. The two are named together because a
   * context is only ever complete (`R6-30c`) — declared alone would be a type
   * with no id. Absent, the editor opens a record that does not exist yet, so
   * it boots `.fresh()` with an empty model.
   */
  context?: { type: ScopeContext["type"]; from: string };
  /** What the surface SAYS when the editor's save settles — i18n keys. */
  feedback?: { success: string; failure: string };
};

/**
 * A declared handoff once the playground has bound it: the editor composable to
 * boot, at the actor the collection itself is driven at. A surface never reads
 * the registry — it opens what it was handed.
 */
export type ResolvedHandoff = ScenarioHandoff & {
  useMutate: FourLayerComposable;
  actor: ScopeActorTypes;
};

// -----------------------------------------------------------------------------
// PRESENTATION — how a row draws
// -----------------------------------------------------------------------------

/** Where a card field sits in the card's own layout. */
export enum CardSlotTypes {
  TITLE = "title",
  SUBTITLE = "subtitle",
  BODY = "body"
}

/** One badge in a {@link TableCellBadges} cell, keyed by a flag on the scoped value. */
export type TableBadge = {
  /** The flag's own property name on the scoped object — e.g. `isVerified` on the row's `meta`. */
  flag: string;
  /** The badge label — an i18n key, never English. */
  i18n: string;
  color?: BadgeProps["color"];
  icon?: string;
};

/**
 * What every declared cell carries: the field it points at (`scope`, a pointer
 * into the row) and what it is CALLED (`i18n`, the column header and the card
 * label). A property with no element is not rendered — which is the whole
 * answer to the `id` column (C15): a system value is excluded by never being
 * declared, while {@link ScenarioBinding.identifier} keeps it functionally
 * available.
 *
 * `type` is dropped from the borrowed shape and re-declared by each member
 * below: `ControlElement`'s own is the LITERAL `'Control'`, so intersecting it
 * with a renderer's name collapses the whole cell to `never` and every
 * `element.scope` in every surface stops type-checking. Everything else the
 * ecosystem type carries — the scope, the rule, the options — is consumed
 * as-is rather than re-spelt (`graphify-out/graph.json`: `ControlElement` is
 * `@jsonforms/core`'s, not a shape minted here).
 */
type TableCellElement = Omit<ControlElement, "type"> & {
  /** The column header / card label — an i18n key, never English. */
  i18n: string;
  options?: {
    /** Where the field sits when the row draws as a CARD; the table ignores it. */
    slot?: CardSlotTypes;
  };
};

/** The value, as text. */
export type TableCellText = TableCellElement & { type: "TableCellText" };

/** A `useDate` descriptor (`{ date, relative }`), drawn as its relative form. */
export type TableCellDate = TableCellElement & { type: "TableCellDate" };

/**
 * A boolean drawn as ONE glyph on every row — filled where the flag is true,
 * outlined where it is not, so the flagged row reads as one choice among many
 * (`R6-34`). The two treatments are the renderer's; only the glyph is declared.
 */
export type TableCellIcon = TableCellElement & {
  type: "TableCellIcon";
  options: TableCellElement["options"] & { icon: string };
};

/** A set of badges, one per truthy flag the cell declares. */
export type TableCellBadges = TableCellElement & {
  type: "TableCellBadges";
  options: TableCellElement["options"] & { badges: TableBadge[] };
};

/**
 * One declared cell, under the renderer its `type` NAMES (`R6-36`) — each one a
 * registered JSONForms renderer with its own `uiTypeIs` tester, never a
 * discriminator a surface switches on.
 */
export type TableCell =
  | TableCellText
  | TableCellDate
  | TableCellIcon
  | TableCellBadges;

/**
 * The WHOLE table: its header labels, its column order, every cell's renderer
 * and the column picker's default visible set are this one element list
 * (`R6-35`).
 */
export type TableUischema = Layout & {
  type: "TableLayout";
  elements: TableCell[];
};

/** The same row drawn as a card — a second declaration over the same record. */
export type CardUischema = Layout & {
  type: "CardLayout";
  elements: TableCell[];
};

/** Where an action sits among the surface's placements. */
export enum ActionPlacementTypes {
  /** Always visible beside the row. */
  VISIBLE = "visible",
  /** Behind the overflow trigger. */
  OVERFLOW = "overflow",
  /** Beside the page's own title — the COLLECTION's control, fired with no row (G4). */
  HEADER = "header"
}

/**
 * One action a surface offers, with its presentation and its precondition —
 * drawn identically on a table row and on a card, which is why there is ONE
 * list rather than one per surface (`R6-33`).
 *
 * `rule` is a real JSONForms rule evaluated against the ROW (`DISABLE` greys
 * the control, `HIDE` removes it), so a per-row capability the record itself
 * carries — `meta.canDelete`, `meta.isVerified`, `meta.isDefault` — gates the
 * control declaratively instead of being hand-coded into a renderer (C11).
 */
export type ScenarioAction = {
  type: "Action";
  /**
   * The action's live name on the composable's action map — or, for a
   * {@link ScenarioAction.handoff} control, the name the surface keys it by.
   *
   * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — the
   * handoff member below extends this existing type; no action-handoff node
   * exists anywhere in the tree.
   */
  name: string;
  /**
   * The declared handoff this control OPENS instead of calling an action: the
   * editor gathers the model the composable could never be handed by a bare
   * click (C1/C2). A control declaring one is offered only where the scenario
   * declares that handoff and the module publishes an editor to drive it.
   */
  handoff?: string;
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

/** Every action the module offers, in the order they are drawn. */
export type ActionsUischema = Layout & {
  type: "ActionsLayout";
  elements: ScenarioAction[];
};

/**
 * Everything a scenario declares about how it is DRAWN, and nothing a
 * composable already owns: no sort (the criteria schema's own enum, `R6-28`)
 * and no form (the mutate composable's own schemas, `R6-29`).
 */
export type ScenarioPresentation = {
  /** The MODULE's icon — the sidebar, the page header, the card, anywhere one is drawn. */
  icon?: string;
  /** The table — the declared columns, in order. Absent on a module with no collection. */
  table?: TableUischema;
  /** The same row drawn as a card. */
  card?: CardUischema;
  /** Every offered action, row-level and collection-level alike. */
  actions?: ActionsUischema;
};

/**
 * The module whose committed `.feature` and step catalog this page plays — the
 * module's own NAME, which is the key its artefacts are collected under.
 * Nothing is registered by naming it: the artefacts are discovered from the
 * module's own `__tests__/` layout (`R6-37`).
 *
 * A scenario declaring none renders Live alone and no transport, which is the
 * state every page boots into anyway (`S12`).
 */
export type ScenarioTracks = string;

// -----------------------------------------------------------------------------

/**
 * WHICH composables a scenario boots — at least one, and either may be given.
 * A collection alone is a read-only list, an editor alone is a form, and both
 * is the collection whose rows hand off to it. With neither there is nothing to
 * build, which the two-member union makes a compile error rather than a page
 * that boots nothing.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 19273 nodes) — no
 * binding node exists in the tree; the composables it names are the modules'
 * own exported builders, not a shape minted here.
 */
export type ScenarioBinding = (
  | { useList: FourLayerComposable; useMutate?: FourLayerComposable }
  | { useList?: FourLayerComposable; useMutate: FourLayerComposable }
) & {
  /** The editors this scenario's controls open, keyed by the name they declare. */
  handoff?: Record<string, ScenarioHandoff>;
  /** The row property carrying a row's identity, when it is not {@link DEFAULT_ROW_IDENTIFIER}. */
  identifier?: string;
  /**
   * Opt in to persisting this scenario's request state to the browser url. The
   * shared playground reads it; the flag lives here because it is a
   * per-scenario choice and the playground is generic over every key.
   */
  persistCriteria?: boolean;
};

/**
 * ONE scenario, whole — the single file the factory writes and re-reconciles.
 * `route` is deliberately absent: the url segment and the route name are the
 * declaring DIRECTORY's name, attached by the registry and by the build-time
 * route registrar from the same directory, so the two cannot disagree and a
 * declaration cannot misname its own url.
 */
export type ScenarioDeclaration = ScenarioBinding & {
  key: ScenarioKey;
  presentation: ScenarioPresentation;
  tracks?: ScenarioTracks;
};

/** A declaration once the registry has attached the directory it was found in. */
export type RegisteredScenario = ScenarioDeclaration & {
  /** The url segment AND the route name — the declaring directory's name. */
  route: string;
};
