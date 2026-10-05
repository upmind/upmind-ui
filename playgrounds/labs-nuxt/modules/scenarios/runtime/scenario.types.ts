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
 * `@upmind/ui`'s props, and `tracks` is the MODULE NAME
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
import type {
  ControlElement,
  JsonSchema7,
  Layout,
  Rule,
  UISchemaElement
} from "@jsonforms/core";
import type { AlertProps, BadgeVariants, ButtonVariants } from "@upmind/ui";
import type {
  ActorContextMatrix,
  ScopeActorTypes,
  ScopeContext
} from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
// graphify-out/: types consumed as variants; ButtonProps/BadgeProps not exported, use Variants

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
 * minted. The `.for()` overload pair mirrors `ScopeForStep`
 * (`scope.builder.ts`, FE-3239), likewise named rather than minted.
 */
export type ScenarioScopedCell = LiveCompositionCell & {
  /** RETARGET — the id names the entity the actor acts upon. */
  for?(type: string, id: string): LiveCompositionCell;
  /** SELECTOR — the type IS the whole answer; an id is forbidden. */
  for?(type: string): LiveCompositionCell;
  /**
   * The ONE record a single read fetches — the builder's own `.withId(id)`, and
   * NOT a context: a leaf record has no context type (`graphify-out/graph.json`
   * carries no single-record-id node of its own).
   *
   * Returns the scoped cell, not a bare one: the builder returns ITSELF from
   * every step, so marking the record withdraws neither `.for()` nor `.fresh()`.
   */
  withId?(id: string): ScenarioScopedCell;
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
  /**
   * The ONE record the editor opens on, as a JSON Pointer into the row. It is
   * the builder's own `.withId(id)` and NOT a context: a leaf record has no
   * context type (ADR-001, Amendment 2026-09-15), so the editor boots the row's
   * own record rather than `.for(type, id)`. Absent, the editor opens on
   * `context` if declared, else a record that does not exist yet.
   */
  record?: { from: string };
  /**
   * Narrows the editor to ONE field — the field code read off the ROW at
   * `from`. When present, the editor draws only the control whose scope
   * matches this field; when absent, the full form renders. Save stays
   * diff-only either way, so only the edited field is sent.
   */
  fieldScope?: { from: string };
  /** What the surface SAYS when the editor's save settles — i18n keys. */
  feedback?: { success: string; failure: string };
};

/**
 * A declared handoff once the playground has bound it: the editor composable to
 * boot, at the actor the collection itself is driven at. A surface never reads
 * the registry — it opens what it was handed.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * handoff node exists; the scope it resolves to is headless's `ScopeContext`.
 */
export type ResolvedHandoff = ScenarioHandoff & {
  useMutate: FourLayerComposable;
  actor: ScopeActorTypes;
  /**
   * The declaration's own `actors`, relayed so the overlay's port serves the
   * same actors the list does. The dialog builds its OWN port, so without
   * this the editor refuses an actor the collection behind it just served.
   */
  offeredActors?: ScopeActorTypes[];
  // graphify-out/: no handoff-token node in the tree; a plain string relay, no
  // type minted.
  /**
   * The `?token=` link token, relayed so a token-only editor boots `.withId`
   * against the same identity the collection did. Absent, the editor addresses
   * itself from the active session as before.
   */
  id?: string;
};

/**
 * The scenario's read composable once the playground has bound it — the read
 * twin of {@link ResolvedHandoff}: the single-read composable to boot, the
 * actor the collection is driven at, and the row property the freshly-fetched
 * record is keyed by. The read boots `.withId(id)` with the `identifier`
 * property read off the clicked row, so it carries no context block of its own
 * (`R6-30b`) and none is synthesised for it (FE-3095). Absent, the detail
 * overlay renders the clicked row's own data with no fetch.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-14, 7457 nodes) — no
 * `ResolvedDetail` / `useDetail` node exists in the tree; this is the read peer
 * of the already-minted `ResolvedHandoff`, and the composable it names is the
 * module's own exported builder, not a shape minted here.
 */
export type ResolvedDetail = {
  useDetail: FourLayerComposable;
  actor: ScopeActorTypes;
  identifier: string;
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

/**
 * One badge in a {@link TableCellBadges} cell, keyed by a flag on the scoped value.
 * @graphify-citation graphify-out/: BadgeVariants consumed from @upmind/ui (BadgeProps not exported)
 */
export type TableBadge = {
  /** The flag's own property name on the scoped object — e.g. `isVerified` on the row's `meta`. */
  flag: string;
  /** The badge label — an i18n key, never English. */
  i18n: string;
  color?: BadgeVariants["variant"];
  icon?: string;
  /**
   * A uischema scope resolved against the ROW itself, for a flag that lives
   * outside the cell's scoped value — e.g. a status flag on the record when the
   * cell reads `meta`. When set, the badge shows if this resolves truthy and
   * `flag` is the key only.
   */
  scope?: string;
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
/**
 * The share of the row a declared column reserves — the presentation knob for
 * the one table that needs two FLUID columns sized unequally, so a long
 * `subject` no longer starves a short `recipient`. It is declaration-level and
 * presentation-only (it moves no data), the peer of the renderer's own
 * {@link CellSizingTypes}: that answers whether a column measures to its glyph,
 * this answers what share the fluid ones take. Absent, a column is fluid and
 * shares the remainder equally, which is where every column without one stands.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-14, 7457 nodes) — the
 * 2026-08-13 re-query recorded on `cells.types` found no cell/column WIDTH
 * vocabulary anywhere in the tree; this is the declaration-level peer of that
 * renderer-level `CellSizingTypes`, minted here once beside the cell it sizes.
 */
export enum TableColumnWidthTypes {
  // graphify-out/ query (2026-09-02) confirmed this enum is the ONLY column-width
  // vocabulary in the tree; the members below extend it, they do not fork it.
  /** A twelfth of the row — the narrowest reservable share. */
  TWELFTH = "twelfth",
  /** A sixth of the row (2/12) — a short value a fluid share would otherwise starve. */
  SIXTH = "sixth",
  /** A quarter of the row (3/12). */
  QUARTER = "quarter",
  /** A third of the row (4/12). */
  THIRD = "third",
  /** Five-twelfths of the row. */
  FIVE_TWELFTHS = "five-twelfths",
  /** Half the row (6/12). */
  HALF = "half",
  /** Seven-twelfths of the row. */
  SEVEN_TWELFTHS = "seven-twelfths",
  /** Two-thirds of the row (8/12). */
  TWO_THIRDS = "two-thirds",
  /** Three-quarters of the row (9/12). */
  THREE_QUARTERS = "three-quarters",
  /** Five-sixths of the row (10/12). */
  FIVE_SIXTHS = "five-sixths",
  /** Eleven-twelfths of the row. */
  ELEVEN_TWELFTHS = "eleven-twelfths",
  /** The whole row — a long value on a record (an options summary). */
  FULL = "full"
}

type TableCellElement = Omit<ControlElement, "type"> & {
  /** The column header / card label — an i18n key, never English. */
  i18n: string;
  options?: {
    /** Where the field sits when the row draws as a CARD; the table ignores it. */
    slot?: CardSlotTypes;
    /**
     * The share of the row this column reserves when it is fluid; the table
     * reads it, and a record field takes the same share of its section's row.
     * The card ignores it. Absent, a table column shares the remainder equally
     * (`R7-2`) and a record field takes a quarter.
     */
    width?: TableColumnWidthTypes;
  };
};

/**
 * The value, as text. With `i18nValue`, a value that is a CODE (`recurrent`)
 * draws as the label `t("<i18nValue>.<code>")` names; a code with no label
 * draws as itself.
 */
export type TableCellText = Omit<TableCellElement, "options"> & {
  type: "TableCellText";
  options?: TableCellElement["options"] & { i18nValue?: string };
};

/**
 * The value as SANITIZED HTML — rich text (an email body, a note) drawn through
 * the ui `Sanitized` component, never escaped as text and never rendered raw.
 * The read twin of {@link TableCellText} for a field the API returns as markup.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-14, 7457 nodes) — no
 * `TableCellHtml` node exists in the tree; it extends the same borrowed
 * `ControlElement` shape as its sibling `TableCellText`, and the sanitizer it
 * draws through is `@upmind/ui`'s own `Sanitized`, consumed rather than minted.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
export type TableCellHtml = TableCellElement & { type: "TableCellHtml" };

/** A `useDate` descriptor (`{ date, relative }`), drawn as its relative form. */
export type TableCellDate = TableCellElement & {
  type: "TableCellDate";
  options?: TableCellElement["options"] & {
    /** Draw the descriptor's FULL date as a tooltip over its relative form. */
    tooltip?: boolean;
    /** Pull the value to the row's end — the trailing date column legacy draws. */
    align?: "right";
  };
};

/**
 * A referral's IDENTITY block, the client path of the legacy
 * `affiliateReferralsTable` as one cell: a leading avatar, a MASKED primary line
 * that never shows the real name (the client area may not reveal who a referral
 * is), and an optional muted second line naming the link the referral arrived
 * through. The two lines stack in one column, which is why this is one composite
 * cell rather than a column each.
 */
export type TableCellReferral = TableCellElement & {
  type: "TableCellReferral";
  options: TableCellElement["options"] & {
    /** i18n key for the word drawn before the mask (e.g. "Client"); the real name is never shown. */
    label: string;
    /** Key on the scoped object for the display name — the avatar's initials and its alt. */
    name: string;
    /** Key on the scoped object for the avatar image source. */
    image: string;
    /** The fallback glyph when the scoped object carries neither image nor name. */
    icon?: string;
    /** The muted second line — the link a referral came through, drawn only where it exists. */
    via?: {
      /** i18n key, given `{link}` and `{url}`. */
      i18n: string;
      /** Scope on the row for the link name; its `"{name}: "` is omitted when absent. */
      name: string;
      /** Scope on the row for the redirect url; its protocol and trailing slash are stripped. */
      url: string;
    };
  };
};

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
 * A nested collection on the record — a ticket's messages, an invoice's lines
 * — each item drawn through its own declared cells, scoped to the ITEM.
 */
/** How a {@link TableCellList} lays its items out. */
export enum TableCellListLayoutTypes {
  /** Each item a bordered card of its cells — the default. */
  CARDS = "cards",
  /** Each item one line, its first cell leading and its last trailing — a label and its amount. */
  ROWS = "rows"
}

export type TableCellList = TableCellElement & {
  type: "TableCellList";
  options: TableCellElement["options"] & {
    elements: TableCell[];
    layout?: TableCellListLayoutTypes;
  };
};

/** A record's ONE status (`{ code, name }` or its label), drawn as a status badge. */
export type TableCellStatus = TableCellElement & { type: "TableCellStatus" };

/**
 * One declared cell, under the renderer its `type` NAMES (`R6-36`) — each one a
 * registered JSONForms renderer with its own `uiTypeIs` tester, never a
 * discriminator a surface switches on.
 */
export type TableCell =
  | TableCellText
  | TableCellHtml
  | TableCellDate
  | TableCellIcon
  | TableCellBadges
  | TableCellList
  | TableCellStatus
  | TableCellReferral;

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

/** Which upmind-ui overlay primitive hosts the read detail. */
export enum DetailSurfaceTypes {
  /** A side drawer — the default. */
  DRAWER = "drawer",
  /** A centred modal dialog. */
  MODAL = "modal"
}

/**
 * Which edge a {@link DetailSurfaceTypes.DRAWER} detail slides in from — the ui
 * `Drawer`'s own `direction`, named as a presentation knob and defaulting to
 * {@link DetailSurfacePositionTypes.RIGHT} so a record reads as a right-hand
 * reading pane at full height rather than a bottom sheet. Presentation-only: it
 * moves no data and the modal host ignores it.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-14, 7457 nodes) — no
 * `DetailSurfacePositionTypes` node exists in the tree; the values mirror
 * `vaul-vue`'s own `DrawerDirection` (minus `top`), consumed through the ui
 * `Drawer` rather than minted here.
 */
export enum DetailSurfacePositionTypes {
  /** From the right edge — the default reading pane. */
  RIGHT = "right",
  /** From the bottom edge — a sheet. */
  BOTTOM = "bottom",
  /** From the left edge. */
  LEFT = "left"
}

/**
 * ONE record drawn READ-ONLY — a plain sibling of {@link TableUischema} and
 * {@link CardUischema} over the same fields, through the same declared-cell
 * renderers, so a detail column cannot mean one thing here and another in the
 * table. Its fields may exceed the table's: a record fetched in full carries
 * more than a list row holds. The overlay it draws in is the surface knob,
 * defaulting to {@link DetailSurfaceTypes.DRAWER}.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-14, 7457 nodes) — no
 * `DetailUischema` / `DetailLayout` / `DetailSurfaceTypes` node exists in the
 * tree; this is the read sibling of the already-minted `TableUischema` /
 * `CardUischema`, and the element and layout shapes are `@jsonforms/core`'s own
 * `Layout`, consumed rather than re-spelt.
 */
export type DetailUischema = Layout & {
  type: "DetailLayout";
  elements: TableCell[];
  surface?: DetailSurfaceTypes;
  /**
   * The edge a {@link DetailSurfaceTypes.DRAWER} detail slides in from,
   * defaulting to {@link DetailSurfacePositionTypes.RIGHT}. Ignored by the
   * modal host.
   */
  position?: DetailSurfacePositionTypes;
  /**
   * Context keys that live BESIDE `data` rather than inside it (e.g. a
   * single-read composable's own `unpaidAmount`), folded additively into the
   * fetched-detail's `model` so an element above can scope into one by name.
   * Absent, `model` is `data` alone, exactly as before this field existed.
   *
   * @graphify-citation `graphify-out/graph.json` (2026-09-09) — queried
   * "detail uischema sibling context field model data": no sibling-scope
   * node exists in the tree; `DetailDialog.vue`'s `model: snap.context.data`
   * assembly is the seam this field extends, additively.
   */
  siblings?: string[];
  /**
   * Detail-port controls the overlay declares — drawn in the drawer's existing
   * `#footer` group beside Close, bound to the booted READ composable's own
   * action map (`DetailDialog`'s `port.actions`), never the list's. Drawn only
   * where a control's `name` is a live function there, the same gate
   * `ListSurface`'s row actions already apply. Absent, the footer draws only
   * Close and the row actions, exactly as before this field existed.
   *
   * @graphify-citation `graphify query "detail uischema action control read
   * composable"` (2026-09-28) — no detail-action-list node exists in the
   * tree; this reuses the existing `ScenarioAction` shape rather than
   * minting a second one.
   */
  actions?: ScenarioAction[];
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
 *
 * @graphify-citation graphify-out/: ButtonVariants consumed from @upmind/ui (ButtonProps not exported)
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
  /**
   * This control OPENS the read-only detail overlay for its row instead of
   * calling an action — the read twin of {@link ScenarioAction.handoff}. The
   * record shown is the scenario's `useDetail` fetch keyed by the row's
   * identity where one is declared, else the clicked row's own data.
   *
   * @graphify-citation `graphify-out/graph.json` (2026-08-14, 7457 nodes) — no
   * detail-action node exists in the tree; this member extends the existing
   * `ScenarioAction`, the read peer of its `handoff` member.
   */
  detail?: boolean;
  /**
   * This control NAVIGATES to another route instead of calling an action or
   * opening an overlay — a route-path template where the `:id` placeholder is
   * replaced with the row's own id. The surface owns the push (it never reaches
   * the module), so it is the navigation twin of {@link ScenarioAction.detail}:
   * a control the page handles itself, not a member bound off `useList`'s
   * action map.
   *
   * @graphify-citation `graphify-out/graph.json` (query "ScenarioAction navigate
   * row action router push") — no per-row navigation node exists in the tree;
   * page-level navigation lives only on {@link ScenarioPageAction}
   * (`usePreferencesLink`). This member extends the existing `ScenarioAction`.
   */
  navigate?: string;
  /** The control's label — an i18n key, never English. */
  i18n: string;
  icon?: string;
  /**
   * The Button treatment — `danger` for a destructive control. There is no
   * second `color` channel beside it: one existed, nothing bound it, and every
   * destructive action that declared it rendered neutral.
   *
   * @graphify-citation `graphify-out/graph.json` (2026-08-26) — queried
   * `ScenarioAction` · `ButtonVariants`: the treatment vocabulary is
   * `@upmind/ui`'s own `ButtonVariants`
   * (`design-system/packages/ui/src/components/button/variants.ts`), consumed
   * here rather than re-declared. Nothing is minted; `color` is DELETED, its
   * only reader having been the two `ListSurface` mappings that fed a prop
   * `ActionSlots.vue` never bound.
   */
  variant?: ButtonVariants["variant"];
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

// -----------------------------------------------------------------------------
// PRESENTATION — how ONE managed record draws
// -----------------------------------------------------------------------------

/** Where a record action sits on the record surface. */
export enum RecordActionPlacementTypes {
  /** The footer bar — the DEFAULT for every write; the first two draw as buttons, the rest under "More". */
  FOOTER = "footer",
  /** Under the footer's "More" menu — the gated extras. */
  OVERFLOW = "overflow",
  /** The footer bar's trailing low-emphasis utilities (refresh, reset). */
  UTILITY = "utility",
  /** Beside the title — an explicit opt-in, never the default. */
  HEADER = "header",
  /** In one collection item's section header, as a link. */
  ROW = "row"
}

/** The tone a footer control is tinted with, in the bar's one soft treatment. */
export enum RecordActionColorTypes {
  PRIMARY = "primary",
  /** A destructive write. */
  DANGER = "danger"
}

/**
 * The write form a record action opens in the surface's ONE shared drawer. The
 * drawer renders `context[context]` (`{ schema, uischema, model }`), routes a
 * change to `set`, the save to `submit` and a dismissal to `cancel` — each a
 * member of the manager's own action map — and closes when `submit` settles.
 *
 * A manager whose write takes ARGUMENTS publishes no model: the form then
 * declares its own `schema` (and `uischema`, or reads them off `context`), the
 * drawer holds the model, and `submit` is called with `args`.
 */
export type RecordFormDeclaration = {
  /** The context key holding `{ schema, uischema, model }`, or any part of it. */
  context?: string;
  schema?: JsonSchema7;
  uischema?: UISchemaElement;
  /** Seed the held model from the same-named members of the row or record. */
  prefill?: boolean;
  /**
   * Scopes `submit` is called with, resolved against the held model over the
   * row (or record) the form opened on.
   */
  args?: string[];
  /** The action a model change is written through; absent, the drawer holds it. */
  set?: string;
  submit: string;
  cancel?: string;
  /** A leading argument `set` and `cancel` take — the module's own form key. */
  target?: string;
  /** The meta flag that must be true before submit is offered. */
  valid?: string;
  /** The drawer title — an i18n key. */
  i18n?: string;
  /** The submit label — an i18n key. */
  submitI18n?: string;
};

/**
 * A route a record action NAVIGATES to. `route` is a path template whose `:id`
 * is the value `idScope` resolves to (against the row for a ROW action, else
 * the record); the current scope suffix (`/as/:actor`) is appended. Absent
 * `route`, the current path is kept and only `query` is merged.
 */
export type RecordNavigateDeclaration = {
  route?: string;
  idScope?: string;
  query?: Record<string, string>;
  /** An app route outside the scenario tree (`/auth/register`) carries no scope suffix. */
  unscoped?: boolean;
};

/**
 * A hand-off of the signed-in session to the client area: a transfer code is
 * minted and the browser leaves for the area's own transfer page, which signs
 * the client in and lands them on `redirect` — a path template whose `:id` is
 * the value `idScope` resolves to against the record.
 */
export type RecordTransferDeclaration = {
  redirect: string;
  idScope?: string;
};

/**
 * One action a record surface offers. `gate` names a meta flag, or a `#/` scope
 * into the row (else the record) it is bound against (`!` reads either's
 * negation): while it is false the action is HIDDEN, never greyed. While
 * any action is busy every other write is disabled. `run`
 * fires a manager action; with a `form` it is the open transition that fills
 * the form's context slot before the drawer draws it.
 */
export type RecordActionDeclaration = {
  name: string;
  /** The control's label — an i18n key, never English. */
  i18n: string;
  icon?: string;
  /** The Button treatment of a HEADER control; footer controls share one. */
  variant?: ButtonVariants["variant"];
  /** The footer control's tint; absent, primary. */
  color?: RecordActionColorTypes;
  /** Absent, the action sits in the footer bar. */
  placement?: RecordActionPlacementTypes;
  gate?: string;
  /**
   * The meta flag this action's control spins on. Absent, it spins while its
   * own form is open or its own `run` is in flight.
   */
  busy?: string;
  run?: string;
  /** Scopes `run` is called with, resolved against the row (else the record). */
  args?: string[];
  form?: RecordFormDeclaration;
  navigate?: RecordNavigateDeclaration;
  transfer?: RecordTransferDeclaration;
};

/**
 * One message a record says about itself — the header's lead line, or an
 * alert in an `alert` section. Of a list, the FIRST whose gates all open is
 * drawn. A gate reads as a {@link RecordActionDeclaration} gate does.
 */
export type RecordNoticeDeclaration = {
  name: string;
  gate?: string | string[];
  /** i18n keys; each is given `values`. */
  i18n: { title: string; text?: string };
  /** i18n params, each a scope into the record model. */
  values?: Record<string, string>;
  variant?: AlertProps["variant"];
  icon?: string;
  /** Drawn as the alert's own call to action, bound against the record. */
  action?: RecordActionDeclaration;
};

/** The record's heading: its title, its ONE status and its flag badges. */
export type RecordHeaderDeclaration = {
  /** A scope into the record model. */
  title?: string;
  /** The title when `title` resolves nothing (or is absent) — an i18n key. */
  titleI18n?: string;
  /** A scope into the record model; drawn as the one status badge. */
  status?: string;
  /**
   * Each badge's `flag` is a meta flag, or its `scope` a model scope whose
   * value the label is given as `{value}`.
   */
  badges?: TableBadge[];
  /** The line under the title that says where the record stands. */
  lead?: RecordNoticeDeclaration[];
};

/** A group of the record's own declared fields. */
export type RecordFieldsSection = {
  kind: "fields";
  key: string;
  i18n?: string;
  icon?: string;
  /** Section-level controls, drawn in the section header's actions slot. */
  actions?: RecordActionDeclaration[];
  elements: TableCell[];
};

/**
 * A related collection on the record, each item drawn as its own section. It
 * never draws a group heading: its `i18n` names it, nothing more.
 */
export type RecordCollectionSection = {
  kind: "collection";
  key: string;
  i18n?: string;
  icon?: string;
  /** Section-level controls, drawn in the section header's actions slot. */
  actions?: RecordActionDeclaration[];
  /** A scope into the record model addressing the item array. */
  scope: string;
  /**
   * Scopes into each item, the first one populated naming its section header
   * (the `{name}` of `itemLabel`).
   */
  rowTitle?: string | string[];
  /** The i18n key each item's header label reads, given `{name}`; absent, the name alone. */
  itemLabel?: string;
  /** The icon of each item's section header. */
  rowIcon?: string;
  /** The item's cells, drawn under its header. */
  row: TableCell[];
  /** Drawn as links in each item's section header. */
  rowActions?: RecordActionDeclaration[];
  summary?: TableCell[];
  /** A second composable, booted for this record, whose rows fill `scope`. */
  source?: RecordSectionSource;
};

/**
 * A collection a record section reads from ANOTHER composable — booted through
 * the same port as a list page, at `actor`, `.for(context.type, id)` with the
 * id read off the record at `context.idScope`.
 */
export type RecordSectionSource = {
  use: FourLayerComposable;
  actor: ScopeActorTypes;
  context: { type: string; idScope: string };
  /** The context key holding the rows; absent, `data`. */
  rows?: string;
};

/**
 * Any other section kind, resolved through the record-section registry by its
 * `kind` — what lets a later record add a kind (`thread`) with no surface edit.
 */
export type RecordCustomSection = {
  kind: string;
  key: string;
  i18n?: string;
  icon?: string;
  actions?: RecordActionDeclaration[];
  [option: string]: unknown;
};

/** How a thread draws one MESSAGE entry, every scope read off that entry. */
export type RecordThreadMessage = {
  /** The message inside its entry. */
  scope: string;
  /** Scopes into the message. */
  author: string;
  date?: string;
  files?: string;
  /** Flags on the message, each drawn as a badge beside its author. */
  badges?: TableBadge[];
  /** The message's cells, drawn under its heading. */
  body: TableCell[];
  /** Bound against the message, drawn as links in its heading. */
  actions?: RecordActionDeclaration[];
  /** Bound against `{ ...file, messageId }`, drawn in each file's menu. */
  fileActions?: RecordActionDeclaration[];
};

/** How a thread draws one LOG entry: a line given the value at `value`. */
export type RecordThreadLog = {
  scope: string;
  value: string;
  /** Given `{value}`. */
  i18n: string;
};

/** One view of the thread — a READ the manager makes, never a filter. */
export type RecordThreadView = {
  value: string;
  i18n: string;
  run: string;
};

/**
 * The reply composer under the thread. Each picked file goes up through
 * `upload` first; `submit` is then called with the body and `{ files }`, and a
 * submit resolving nothing was REFUSED — the draft is kept and `refusedI18n`
 * said beside it.
 */
export type RecordThreadComposer = {
  submit: string;
  upload?: string;
  /** A meta flag; while it is false the composer is not drawn. */
  gate?: string;
  i18n: {
    placeholder: string;
    submit: string;
    attach: string;
    /** The accessible labels of a file that went up, and one that did not. */
    uploaded: string;
    failed: string;
    refused: string;
  };
};

/**
 * A conversation on the record: its entries as a timeline, its views, per
 * message and per file controls, and the reply composer beneath it. Paging
 * rides the section's own `actions`, gated on the record's scopes.
 */
export type RecordThreadSection = {
  kind: "thread";
  key: string;
  i18n?: string;
  icon?: string;
  actions?: RecordActionDeclaration[];
  /** A scope into the record model addressing the entry array. */
  entries: string;
  /** The entry member naming its kind, and the value each kind carries. */
  discriminator: { scope: string; message: string; log: string };
  message: RecordThreadMessage;
  log?: RecordThreadLog;
  views?: RecordThreadView[];
  /** A file's bytes, read through `run` given the file id; `done` is given `{name}` and `{bytes}`. */
  download?: { run: string; i18n: string; done: string };
  /** Copies a file's name to the clipboard. */
  copyI18n?: string;
  composer?: RecordThreadComposer;
  empty: { title: string; text: string };
};

/**
 * A banner on the record — the first of `alerts` whose gates open, drawn as
 * one alert with its call to action. With none open the section is not drawn.
 */
export type RecordAlertSection = {
  kind: "alert";
  key: string;
  i18n?: string;
  icon?: string;
  actions?: RecordActionDeclaration[];
  alerts: RecordNoticeDeclaration[];
};

export type RecordSectionDeclaration =
  | RecordFieldsSection
  | RecordCollectionSection
  | RecordThreadSection
  | RecordAlertSection
  | RecordCustomSection;

/**
 * What the page offers with no record in the url: the collection's own picker
 * form (`context.<schema>`), whose `field` write is the record to open, beside a
 * direct id input.
 */
export type RecordPickerDeclaration = {
  use: FourLayerComposable;
  actor: ScopeActorTypes;
  /** The context path of the picker's `{ schema, uischema }`. */
  schema: string;
  /** The model field the picker writes the picked id to. */
  field: string;
  /**
   * An input that is not an id is resolved through the collection's own
   * criteria filter of this name, and the first match opened.
   */
  resolve?: {
    filter: string;
    /** i18n keys for no match; `text` is given `{reference}`. */
    i18n: { title: string; text: string };
  };
  icon?: string;
  /** i18n keys for the empty state, the id input and its open button. */
  i18n: { title: string; text: string; input: string; open: string };
};

/**
 * ONE managed record, drawn whole by the shared record surface: its header,
 * its sections, every action and where each sits. `record` names the context
 * key holding the mapped record; `siblings` fold further context keys into the
 * model beside it, as the detail overlay's do.
 */
export type RecordUischema = {
  type: "RecordLayout";
  record: string;
  header: RecordHeaderDeclaration;
  sections: RecordSectionDeclaration[];
  actions: RecordActionDeclaration[];
  siblings?: string[];
  picker?: RecordPickerDeclaration;
  /**
   * The record has no fetch to wait on, so the surface draws as soon as the
   * cell is served — an empty record is its starting state, not a load. Only an
   * unserved scope still replaces it.
   */
  drawsEmpty?: boolean;
};

/**
 * ONE collection-level `useMeta()` member surfaced beside the list — a flag
 * reads as an on/off notice, a number as itself. Never a table column: this
 * is the collection's own answer, not a per-row fact.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-09-09) — queried
 * "collection meta notice badge count hasUnpaid consolidatableCount": no
 * meta-notice declaration node exists in the tree; `MetaPanel.vue`
 * (`runtime/components/`) is the nearest neighbour, but it is the Inspector's
 * own ALL-FLAGS debug dump (`app/components/sheets/DebugPane.vue`), not a
 * scenario-declared, filtered product surface — the wrong vehicle for a
 * DECLARED subset with a number rendered as itself, so this is minted rather
 * than reused.
 */
export type MetaNoticeElement = {
  /** Which `useMeta()` member this notice reads. Absent on the cell, the notice draws nothing. */
  scope: string;
  i18n: string;
};

/**
 * A labs-side page action's live instance — the reactive half of a {@link
 * ScenarioPageAction}, driven by a labs composable rather than the booted
 * cell's own action map. The host offers it only while `isOffered`, disables it
 * while `isRunning` (or while `isDisabled`, surfacing `disabledReason` where the
 * hand lands), and calls `run` when it is pressed — the collection's port never
 * sees it.
 *
 * @graphify-citation `graphify query "scenario page action labs orchestration
 * header action instance"` (2026-09-08, `graphify-out/graph.json`) — no
 * page-action node exists; this is the labs-behaviour peer of the presentation
 * `ScenarioAction`, not a re-mint of it.
 */
export type ScenarioPageActionInstance = {
  isOffered: ComputedRef<boolean>;
  isRunning: ComputedRef<boolean>;
  /** Offered but not pressable — a precondition the run needs is unmet. */
  isDisabled?: ComputedRef<boolean>;
  /** Why the action is disabled, said on the control it disables. */
  disabledReason?: ComputedRef<string | undefined>;
  run: () => void | Promise<void>;
};

/**
 * A labs-side page action, whole: its own HEADER presentation and the factory
 * that boots its {@link ScenarioPageActionInstance}. A page action is NOT a
 * collection action — it never sits in {@link ScenarioPresentation.actions}, so
 * the list's port never sees it — which is why it carries its own label, icon
 * and treatment here rather than borrowing a declared action's.
 *
 * @graphify-citation `graphify query "scenario page action labs orchestration
 * header action instance"` (2026-09-08, `graphify-out/graph.json`) — the
 * declaration peer of {@link ScenarioPageActionInstance}; no page-action node
 * exists in the tree, and the treatment vocabulary is `@upmind/ui`'s own
 * `ButtonVariants`, consumed not re-minted.
 */
export type ScenarioPageAction = {
  /** The control's label — an i18n key, never English. */
  i18n: string;
  icon?: string;
  variant?: ButtonVariants["variant"];
  /** Boots the labs composable that drives the action. */
  use: () => ScenarioPageActionInstance;
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
  /**
   * The same record drawn READ-ONLY in the detail overlay. A plain sibling of
   * {@link ScenarioPresentation.table}; absent, the overlay dumps the record
   * raw. See `graphify-out/graph.json` head citation for the minted-here note.
   */
  detail?: DetailUischema;
  /** Every offered action, row-level and collection-level alike. */
  actions?: ActionsUischema;
  /**
   * The collection's own meta, surfaced beside the list — absent, the list
   * draws none, exactly as before this field existed.
   */
  notices?: MetaNoticeElement[];
  /**
   * ONE managed record drawn by the shared record surface. Read only with
   * `useManage`; that pair is what routes a declaration to the RECORD archetype.
   */
  record?: RecordUischema;
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
export type ScenarioTracks =
  | string
  | {
      /** The module's own name, exactly as the bare-string form carries it. */
      module: string;
      /**
       * Scenario tags this page does NOT play, for a module whose ONE feature
       * serves two pages. `tickets` is the first such module: its feature tags
       * every scenario `@collection` or `@manager`, and without this both pages
       * listed all 24 driveable tracks — the collection offering "Reply to a
       * ticket" and "Rename a ticket's subject", which belong to the manager.
       *
       * It names what a page is NOT rather than what it is, so there is no lane
       * vocabulary to keep in step across two files, and a scenario carrying
       * NEITHER lane tag stays on both pages — the honest default for behaviour
       * two pages genuinely share. `tickets` has no such scenario: each of the
       * three its feature left untagged turned out to fire a collection action,
       * so the lane a scenario belongs to is read off the composable that
       * implements it, never off how the title reads.
       */
      without?: readonly string[];
    };

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
  /**
   * A module that DRAWS ITSELF binds nothing: its own `*.page.vue` is the
   * route's component, so no collection or editor is booted for it and the
   * shared renderer never sees it. It still declares, still registers, still
   * carries its nav entry — a module whose composable is not four-layer yet
   * reaches the playground this way rather than as a page outside it.
   *
   * Such a page may still OPT IN to a playlist by naming {@link
   * ScenarioBinding.useManage} — see that member.
   */
  | { useList?: never; useMutate?: never }
) & {
  /**
   * The composable a SELF-DRAWN page boots so its own scenario bar has a cell
   * to drive — the third verb beside `useList` (the collection) and
   * `useMutate` (the editor), and the one a module that renders itself needs.
   *
   * WHY IT EXISTS. `boundKeys` is the set of keys the harness can build a
   * boot thunk for, and it was the two renderer bindings alone — so a
   * self-drawn declaration was excluded from `scenarioRegistry`, and
   * `World.boot` on its key threw. That is the correct answer for a page with
   * nothing to boot; it is the wrong one for a page that boots the module
   * ITSELF and simply draws it by hand, which is every manager whose thread,
   * composer or wizard no generic surface can render.
   *
   * PURELY OPT-IN. A declaration that does not name it is unchanged in every
   * respect: it stays out of `boundKeys`, out of `scenarioRegistry`, and
   * asking the world to boot it still throws. Nothing here is inferred from a
   * page file's presence — the declaration says it or it does not.
   *
   * It is read LAST, after `useList` and `useMutate`, so a declaration that
   * binds a renderer cannot have its boot moved by naming one.
   *
   * @graphify-citation `graphify query "scenario binding self-drawn boot
   * composable useManage"` (2026-09-17, `graphify-out/graph.json`, 482 nodes)
   * — no self-drawn-boot node and no binding member of this name exist in the
   * tree; the one `useManage*` hit is `useValidationKeywords.ts`'s
   * `useManageKeyword`, an unrelated JSON-schema keyword. Nothing is minted:
   * this member extends the existing `ScenarioBinding` and names the module's
   * own exported builder, exactly as its two siblings do.
   */
  useManage?: FourLayerComposable;
  /**
   * The single-read composable a row opens READ-ONLY — the read twin of
   * `useMutate`. Omitted, the detail overlay renders the clicked row's own data
   * (the list already holds it) with no fetch; provided, the framework boots it
   * through `useModulePort`, keyed by row identity, and renders the
   * freshly-fetched full record. See `graphify-out/graph.json` head citation.
   */
  useDetail?: FourLayerComposable;
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

  /**
   * The actors this page offers, beyond the implicit SELF every scenario
   * serves — the `/as/:actor` segments its picker may reach.
   *
   * `useModulePort` otherwise refuses an actor the module's matrix marks
   * `never`, on the grounds that such a module resolves its request target
   * from the ACTIVE SESSION and so would answer the previous actor's
   * identity. In this playground that divergence cannot occur: `switchScope`
   * sets the actor scope, ACTIVATES the matching session in the store, and
   * pushes the url in one step, so the active session always IS the actor
   * the url names. The store already holds a guest session with its own
   * access token — nothing further is needed to identify the caller.
   *
   * A module whose matrix marks an actor `never` because that actor genuinely
   * may not act (a guest managing someone's phone numbers) simply does not
   * list it, and the refusal stands. Absent, every scenario behaves exactly
   * as before.
   */
  actors?: ScopeActorTypes[];

  /**
   * Labs-side page actions, keyed by name and rendered in the page header while
   * offered. Each carries its OWN presentation and the factory that boots its
   * instance — a page action is not a collection action and never appears in
   * {@link ScenarioPresentation.actions}, so the list's port never sees it. See
   * {@link ScenarioPageAction}. graphify-out/: page-action peer, not re-minted.
   */
  pageActions?: Record<string, ScenarioPageAction>;
};

/**
 * One panel of a tab — the existing surface for its own binding (a record, a
 * collection with its editor, or a form), drawn under the tab it belongs to.
 * `key` is local to the area; the harness addresses the panel as
 * `<area key>.<panel key>`.
 */
export type ScenarioPanel = ScenarioBinding & {
  key: string;
  /** The panel's heading — an i18n key. Absent, the panel draws no heading. */
  i18n?: string;
  presentation: ScenarioPresentation;
  tracks?: ScenarioTracks;
};

/** One tab of an area: its label, its icon and the panels stacked under it. */
export type ScenarioTab = {
  key: string;
  /** The tab's label — an i18n key. */
  i18n: string;
  icon: string;
  panels: ScenarioPanel[];
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
  /** Route params this module's url carries — `["oid"]` gives `/useInvoice/:oid`. */
  params?: string[];
  /**
   * Makes the declaration an AREA: one page header, a tab strip and the panels
   * of the active tab, each panel booting its own binding. An area binds
   * nothing itself; its `presentation` carries the page icon only.
   */
  tabs?: ScenarioTab[];
};

/** A declaration once the registry has attached the directory it was found in. */
export type RegisteredScenario = ScenarioDeclaration & {
  /** The url segment AND the route name — the declaring directory's name. */
  route: string;
};

/**
 * An area's panel once the registry has flattened it: addressed by the harness
 * key `<area>.<panel>`, carrying the area's route and its own local key.
 */
export type RegisteredPanel = RegisteredScenario & {
  /** The panel's key local to its area — also its url namespace. */
  panel: string;
};
