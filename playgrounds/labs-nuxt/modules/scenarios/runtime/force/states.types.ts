// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/states.types
 * @description A forced state is a SCENARIO of the module's own feature — its
 * title is the label, its line the identity — bound to the one transport
 * recipe a fake network can perform for it. The recipes are the fixed part
 * (a fake network can only hold a request, refuse it, or answer it empty);
 * which of them a page offers, and what each is called, is the feature's.
 *
 * @graphify-citation `graphify query "existing forced state recipe id
 * vocabulary contract for a page's offered forced states"` (2026-09-12,
 * `graphify-out/graph.json`) — the only neighbours are this module's own
 * `forced-surface.harness.ts` and unrelated `state`/`offered` nodes in other
 * packages; no recipe / forced-state contract exists in the tree to consume.
 * What is MINTED here is the recipe vocabulary and `ForcedState`'s `label` /
 * `phrase`; what is NOT minted is the preset vocabulary it replaces —
 * `FORCE_URL_PRESETS` is retired from `composables/useForcedState.types.ts`
 * rather than duplicated, and `ForcePreset` still consumes `ForceRecipeId`
 * from here. See `graphify-out/GRAPH_REPORT.md`.
 */

/** What the fake network does to the request the state names. */
export const FORCE_RECIPE_KIND = {
  /** Hold the request open — the surface sits in its loading/processing state. */
  PENDING: "pending",
  /** Answer the request with the module's own recorded refusal. */
  REFUSED: "refused",
  /** Answer the read with its rows removed, or its absent-record capture. */
  ABSENT: "absent"
} as const;

export type ForceRecipeKind =
  (typeof FORCE_RECIPE_KIND)[keyof typeof FORCE_RECIPE_KIND];

/** Which side of the wire the recipe acts on. */
export const FORCE_RECIPE_TARGET = { READ: "read", WRITE: "write" } as const;

export type ForceRecipeTarget =
  (typeof FORCE_RECIPE_TARGET)[keyof typeof FORCE_RECIPE_TARGET];

export type ForceRecipe = {
  kind: ForceRecipeKind;
  target: ForceRecipeTarget;
};

// -----------------------------------------------------------------------------

/**
 * How a recipe is SPELT to the corpus — the answering vocabulary `presets.ts`
 * has always spoken, and the only fixed list left in the force system. It is
 * INTERNAL: nothing renders it, no url carries it, and a page's offer is never
 * filtered from it (that is the feature's, `states.ts`). It survives because a
 * recipe has to be named to be answered, and because these four are exactly the
 * answers the recordings are MEASURED for (`capabilities.ts`).
 *
 * It replaced `FORCE_URL_PRESETS`, which was a url vocabulary AND a label
 * source AND the offer itself: a single-record FORM page was offered
 * `error-collection` because its recordings held a refusal, and every page's
 * states were named from the same four keys whatever its feature said
 * (operator ruling, 2026-09-12).
 */
export const FORCE_RECIPES = [
  "empty",
  "loading",
  "error-action",
  "error-collection"
] as const;

/**
 * The recipe that holds a WRITE and serves the read as recorded — a form
 * presented with its save in flight. It is named APART from
 * {@link FORCE_RECIPES} because it is the one recipe that needs no recorded
 * answer of its own: a held request has no body, so there is nothing for
 * `capabilities.ts` to measure beyond the module having recorded a write at
 * all.
 */
export const FORCE_RECIPE_PENDING_WRITE = "loading-action" as const;

/**
 * A recipe whose answer the recordings are MEASURED for (`capabilities.ts`) —
 * the four this file's head citation records as minted here rather than
 * consumed (`graphify-out/GRAPH_REPORT.md`).
 */
export type ForceMeasuredRecipe = (typeof FORCE_RECIPES)[number];

export type ForceRecipeId =
  | ForceMeasuredRecipe
  | typeof FORCE_RECIPE_PENDING_WRITE;

/** One forced state, derived from one scenario of the module's feature. */
export type ForcedState = {
  /** Url-safe identity, derived from the title and the recipe; what `force=` carries. */
  slug: string;
  /** The scenario's own title — the label, verbatim. */
  title: string;
  /**
   * What a picker SHOWS, as an i18n key: one word per recipe, the same on every
   * page (`labs.force_preset_<recipe>` — `forcedStateLabel`). The feature's own
   * words stay on `phrase`; the button never takes them, so no two modules
   * spell one state two ways.
   */
  label: string;
  /** The words of the scenario that named this condition. */
  phrase: string;
  /**
   * The scenario's line in the feature, for receipts — `0` for the one state no
   * scenario names, the implicit `Loading` of a page that reads (`offer.ts`).
   */
  line: number;
  recipe: ForceRecipe;
};
