// -----------------------------------------------------------------------------
/**
 * @module portal/resolve
 * @description The pure resolver (design.md §D5, §D8): base config + route ->
 * resolved shell. Applies a route's area override wholesale per primitive
 * (never a deep merge), then resolves every slot a config actually assigned
 * against the registry and the primitive descriptor table — accepting or
 * rejecting it. A slot the config never assigned has no entry at all: absent
 * is the one representation of "nothing here" (tasks.md 2.0 F5). It never
 * imports a module; it only looks ids up.
 */

import { PRIMITIVES } from "./primitives";
import { getModuleDescriptor } from "./registry";
import { MODULE_GROUP_ID, PRIMITIVE_ID } from "./types";
import {
  assign,
  find,
  includes,
  isUndefined,
  keys,
  map,
  mapValues,
  omit,
  omitBy,
  reduce
} from "lodash-es";
import type {
  ContentAsideSize,
  ContentHeroConfig,
  ContentRowConfig,
  RowHeaderConfig,
  RowHeaderControls,
  RowSurface
} from "./content/types";
import type {
  AcceptTag,
  AreaOverride,
  ChromeTone,
  ContentConfig,
  GroupAxis,
  ModuleGroupRef,
  PageKey,
  PortalConfig,
  PrimitiveConfig,
  PrimitiveId,
  PrimitivesConfig,
  SlotAssignment,
  SidebarTrigger,
  TopbarHeight,
  TopbarSpan,
  UtilitySide
} from "./types";
// -----------------------------------------------------------------------------

export type PortalRoute = {
  /** The overriding area's primitive config, resolved by the caller (§D8). Absent = the base config applies unmodified. */
  readonly area?: AreaOverride;
  /**
   * The page's candidate content keys, most-specific first (types.ts
   * `PageKey`). The first with a `config.pages` entry wins; none (or absent)
   * resolves the singular `config.content` — the pre-`pages` behaviour.
   */
  readonly pageKeys?: readonly PageKey[];
};

export type ResolvedSlot =
  | { readonly status: "rejected"; readonly reason: string }
  | {
      readonly status: "module";
      readonly id: string;
      readonly variant?: string;
      /** Config-owned data, threaded through unread by the resolver (tasks.md 2.7). */
      readonly props?: Readonly<Record<string, unknown>>;
    }
  | {
      readonly status: "group";
      readonly axis: GroupAxis;
      readonly members: readonly ResolvedSlot[];
      /** The group presents as a CARD when set (types.ts `ModuleGroupRef`). */
      readonly surface?: RowSurface;
      readonly header?: ResolvedRowHeader;
    };

export type ResolvedPrimitive = {
  readonly variant?: string;
  /** Topbar only; the secondary and tertiary bars inherit it (§D4). */
  readonly tone?: ChromeTone;
  /** Topbar only — the floating box's width (`TOPBAR_SPAN`). */
  readonly span?: TopbarSpan;
  /** Topbar only — the bar's height (`TOPBAR_HEIGHT`). */
  readonly height?: TopbarHeight;
  /** Sidebar only — where the rail's collapse trigger sits (`SIDEBAR_TRIGGER`). */
  readonly trigger?: SidebarTrigger;
  /** Inline tertiary only — the rail is a full-measure bordered strip (types.ts `TertiaryConfig`). */
  readonly divider?: boolean;
  /** Keyed by slot id; a slot the config never assigned has no key (F5) — never read one without `?.`. */
  readonly slots: Readonly<Partial<Record<string, ResolvedSlot>>>;
};

/**
 * A content row's slots, resolved (design.md §D7, tasks.md 5's AC5.1). Rows
 * are not a primitive (`primitives.ts` carries no `content` entry), so a
 * row's slots carry no accept-tag gate — `resolveContentSlotAssignment`
 * admits any registered module, unlike a primitive's own `slotAccepts`.
 */
/** The control band's two positions, resolved through the same module seam a slot uses. */
export type ResolvedRowControls = {
  readonly start?: ResolvedSlot;
  readonly end?: ResolvedSlot;
};

export type ResolvedRowHeader = {
  readonly title: string;
  readonly description?: string;
  /** The header's trailing controls, resolved through the SAME module seam a slot uses — never a second rendering path. */
  readonly actions?: ResolvedSlot;
  /** The band beneath the description (`RowHeaderControls`). */
  readonly controls?: ResolvedRowControls;
};

export type ResolvedContentRow = {
  readonly layout: ContentRowConfig["layout"];
  readonly measure?: ContentRowConfig["measure"];
  readonly surface?: ContentRowConfig["surface"];
  readonly header?: ResolvedRowHeader;
  readonly footer?: ResolvedSlot;
  /** The row's own presence gate, still a REF — the dataset lives at render, not here (`PortalContent`). */
  readonly visible?: ContentRowConfig["visible"];
  readonly anchor?: ContentRowConfig["anchor"];
  readonly slots: readonly ResolvedSlot[];
};

/** The hero band, its two slots resolved through the SAME module seam a row's slots use. */
export type ResolvedHero = {
  readonly image?: string;
  readonly breadcrumb?: ResolvedSlot;
  readonly actions?: ResolvedSlot;
};

export type ResolvedContent = Omit<
  ContentConfig,
  "rows" | "aside" | "hero" | "breadcrumb"
> & {
  readonly rows: readonly ResolvedContentRow[];
  /** The page-level aside's rows, resolved exactly like `rows`. Empty, never undefined (F5). */
  readonly aside: readonly ResolvedContentRow[];
  readonly hero?: ResolvedHero;
  /** The plain header's trail, resolved through the module seam like any slot. */
  readonly breadcrumb?: ResolvedSlot;
};

export type ResolvedShell = {
  readonly primitives: Readonly<
    Partial<Record<PrimitiveId, ResolvedPrimitive>>
  >;
  readonly content: ResolvedContent;
};

export function resolve(
  config: PortalConfig,
  route: PortalRoute = {}
): ResolvedShell {
  const primitivesConfig = applyAreaOverride(config.primitives, route.area);
  const content = selectPageContent(config, route.pageKeys);

  const primitives = reduce(
    keys(primitivesConfig) as PrimitiveId[],
    (acc, primitiveId) => {
      const primitiveConfig = primitivesConfig[primitiveId];
      if (primitiveConfig === undefined) return acc;

      assign(acc, {
        [primitiveId]: {
          variant: primitiveConfig.variant,
          tone: "tone" in primitiveConfig ? primitiveConfig.tone : undefined,
          span: "span" in primitiveConfig ? primitiveConfig.span : undefined,
          height:
            "height" in primitiveConfig ? primitiveConfig.height : undefined,
          trigger:
            "trigger" in primitiveConfig ? primitiveConfig.trigger : undefined,
          divider:
            "divider" in primitiveConfig ? primitiveConfig.divider : undefined,
          // omitBy(isUndefined) first: a config-declared `slot: undefined` is
          // "never assigned", the same as the key being absent altogether —
          // one representation, not two (F5).
          slots: mapValues(
            omitBy(primitiveConfig.slots, isUndefined),
            (assignment: SlotAssignment, slotId: string) =>
              resolveSlotAssignment(primitiveId, slotId, assignment)
          )
        }
      });
      return acc;
    },
    {} as Partial<Record<PrimitiveId, ResolvedPrimitive>>
  );

  return {
    primitives,
    content: assign({}, content, {
      rows: resolveContentRows(content),
      aside: resolveRows(content.aside ?? inlineUtilityAside(primitivesConfig)),
      // The pane declares its own side once, in primitives; every page that
      // does not name its own inherits it (types.ts `UtilityConfig.side`).
      asideSide: content.asideSide ?? inlineUtilitySide(primitivesConfig),
      asideSize: content.asideSize ?? inlineUtilityAsideSize(primitivesConfig),
      hero: resolveHero(content.hero),
      breadcrumb:
        content.breadcrumb && resolveContentSlotAssignment(content.breadcrumb)
    })
  };
}

/**
 * The `pages` lookup (types.ts `PortalConfig.pages`): first candidate key
 * with an entry wins, in the caller's most-specific-first order; no entry —
 * or no `pageKeys` at all — resolves the singular `content`, so a config with
 * no `pages` behaves exactly as before the map existed.
 *
 * The entry MERGES over `content` rather than replacing it, so the shape
 * states a page-shell field (`measure`, `gutter`) once and every position
 * inherits it. Replacement made each of those fields a per-entry obligation:
 * an entry that omitted `measure` fell silently to `Page`'s own default, and
 * the chrome — which resolves with no page key at all — read a different
 * value from the page it frames.
 */
function selectPageContent(
  config: PortalConfig,
  pageKeys: readonly PageKey[] | undefined
): ContentConfig {
  const matched = find(
    pageKeys ?? [],
    pageKey => config.pages?.[pageKey] !== undefined
  );
  if (matched === undefined) return config.content;

  const page = config.pages?.[matched];
  if (page === undefined) return config.content;

  // `omitBy(isUndefined)` first: an entry built by a factory carries explicit
  // `undefined` for the fields it never set, and those must not overwrite the
  // shape's own value.
  return assign({}, config.content, omitBy(page, isUndefined));
}

/**
 * The `inline` utility variant (types.ts) — the pane IS the page aside: its
 * occupied slots become aside rows in slot order, so a shape declares its
 * right pane ONCE, in the primitive the boards name (Rockzone NP.5), and the
 * page's aside track renders it. An explicit `content.aside` wins; a
 * non-inline utility contributes nothing here (it renders as the shell rail).
 */
/** An `inline` utility pane's own track width. */
function inlineUtilityAsideSize(
  primitives: PrimitivesConfig
): ContentAsideSize | undefined {
  const utility = primitives[PRIMITIVE_ID.UTILITY];
  if (utility === undefined || utility.variant !== "inline") return undefined;
  return utility.asideSize;
}

/** An `inline` utility pane's own side, for the page track it becomes. */
function inlineUtilitySide(
  primitives: PrimitivesConfig
): UtilitySide | undefined {
  const utility = primitives[PRIMITIVE_ID.UTILITY];
  if (utility === undefined || utility.variant !== "inline") return undefined;
  return utility.side;
}

function inlineUtilityAside(
  primitives: PrimitivesConfig
): readonly ContentRowConfig[] {
  const utility = primitives[PRIMITIVE_ID.UTILITY];
  if (utility === undefined || utility.variant !== "inline") return [];
  const order = ["top", "topmid", "botmid", "bottom"] as const;
  return reduce(
    order,
    (acc: ContentRowConfig[], slotId) => {
      const assignment = utility.slots[slotId];
      if (assignment !== undefined) {
        acc.push({
          layout: "row-full",
          surface: utility.surface,
          visible: utility.slotVisible?.[slotId],
          slots: [assignment]
        });
      }
      return acc;
    },
    []
  );
}

/** AC5.1 (tasks.md Task 5) — resolves `content.rows` the same way a primitive's slots resolve, minus the accept-tag gate (`ResolvedContentRow`'s own doc). Absent `rows` resolves to an empty list, never `undefined` — one representation, matching F5's "absence is empty" for primitive slots. */
function resolveContentRows(
  content: ContentConfig
): readonly ResolvedContentRow[] {
  return resolveRows(content.rows ?? []);
}

function resolveRows(
  rows: readonly ContentRowConfig[]
): readonly ResolvedContentRow[] {
  return map(rows, (row: ContentRowConfig) => ({
    layout: row.layout,
    measure: row.measure,
    surface: row.surface,
    header: resolveRowHeader(row.header),
    footer: row.footer && resolveContentSlotAssignment(row.footer),
    visible: row.visible,
    anchor: row.anchor,
    slots: map(row.slots, resolveContentSlotAssignment)
  }));
}

/** The hero's two slots resolve like a row's — a breadcrumb or an action is a module, so an unregistered id is REJECTED, never rendered unchecked. */
function resolveHero(
  hero: ContentHeroConfig | undefined
): ResolvedHero | undefined {
  if (hero === undefined) return undefined;
  return {
    image: hero.image,
    breadcrumb:
      hero.breadcrumb && resolveContentSlotAssignment(hero.breadcrumb),
    actions: hero.actions && resolveContentSlotAssignment(hero.actions)
  };
}

/** A row's heading, with its trailing actions resolved as an ordinary content slot — a header action is a module, so an unregistered id is REJECTED there exactly as it is in a slot, rather than rendering unchecked. */
function resolveRowHeader(
  header: RowHeaderConfig | undefined
): ResolvedRowHeader | undefined {
  if (header === undefined) return undefined;
  return {
    title: header.title,
    description: header.description,
    actions: header.actions && resolveContentSlotAssignment(header.actions),
    controls: resolveRowControls(header.controls)
  };
}

/** Absent controls stay absent — the band renders only where a config asked for one. */
function resolveRowControls(
  controls: RowHeaderControls | undefined
): ResolvedRowControls | undefined {
  if (controls === undefined) return undefined;
  return {
    start: controls.start && resolveContentSlotAssignment(controls.start),
    end: controls.end && resolveContentSlotAssignment(controls.end)
  };
}

/** A content row is not a primitive (`primitives.ts` carries no `content` row), so it has no accept-tag list to gate against — any registered module is admitted, its members included. */
function resolveContentSlotAssignment(
  assignment: SlotAssignment
): ResolvedSlot {
  const descriptor = getModuleDescriptor(assignment.id);
  if (descriptor === undefined) {
    return {
      status: "rejected",
      reason: `Unregistered module id "${assignment.id}" in a content row.`
    };
  }

  if (isModuleGroupRef(assignment)) {
    return {
      status: "group",
      axis: assignment.axis,
      surface: assignment.surface,
      header: resolveRowHeader(assignment.header),
      members: map(assignment.members, resolveContentSlotAssignment)
    };
  }

  return {
    status: "module",
    id: assignment.id,
    variant: assignment.variant,
    props: assignment.props
  };
}

/** Never a deep merge (§D8): absent keeps the base, `false` removes, present replaces wholesale. */
function applyAreaOverride(
  base: PrimitivesConfig,
  area: AreaOverride | undefined
): PrimitivesConfig {
  if (area === undefined) return base;

  const ids = keys(area) as PrimitiveId[];
  const { removedIds, replaced } = reduce(
    ids,
    (acc, id) => {
      const value = area[id];
      if (value === false) acc.removedIds.push(id);
      else if (value !== undefined) assign(acc.replaced, { [id]: value });
      return acc;
    },
    {
      removedIds: [] as PrimitiveId[],
      replaced: {} as Partial<Record<PrimitiveId, PrimitiveConfig>>
    }
  );

  return assign(omit(base, removedIds), replaced) as PrimitivesConfig;
}

/**
 * `ModuleRef` and `ModuleGroupRef` share `kind: "module"`, so the well-known
 * id alone is not sound (F3): a plain `ModuleRef` literal naming
 * `MODULE_GROUP_ID` would pass an id-only check and then be read for `axis`
 * and `members` it does not have. Checking both fields present narrows on
 * the actual shape, matching what `moduleGroup()` (registry.ts) always
 * produces and what a bare `ModuleRef` literal never does.
 */
function isModuleGroupRef(
  assignment: SlotAssignment
): assignment is ModuleGroupRef {
  return (
    assignment.id === MODULE_GROUP_ID &&
    "axis" in assignment &&
    "members" in assignment
  );
}

/** `undefined` when `primitiveId` names no descriptor (F4) — a config typo is rejected, never a dereference of a row that isn't there. */
function slotAccepts(
  primitiveId: PrimitiveId,
  slotId: string,
  tag: AcceptTag
): boolean {
  const primitive = PRIMITIVES[primitiveId] as
    | (typeof PRIMITIVES)[PrimitiveId]
    | undefined;
  if (primitive === undefined) return false;

  const slot = find(primitive.slots, descriptor => descriptor.id === slotId);
  return slot !== undefined && includes(slot.accepts, tag);
}

/**
 * Resolves one slot's assignment. A group is admitted at this slot
 * unconditionally (§D4/§D6, board rule 2) — its MEMBERS are what get checked,
 * each against this SAME host slot's accept list, which is why the recursive
 * call keeps `primitiveId`/`slotId` unchanged.
 */
function resolveSlotAssignment(
  primitiveId: PrimitiveId,
  slotId: string,
  assignment: SlotAssignment
): ResolvedSlot {
  const descriptor = getModuleDescriptor(assignment.id);
  if (descriptor === undefined) {
    return {
      status: "rejected",
      reason: `Unregistered module id "${assignment.id}" in ${primitiveId}.${slotId}.`
    };
  }

  if (isModuleGroupRef(assignment)) {
    return {
      status: "group",
      axis: assignment.axis,
      surface: assignment.surface,
      header: resolveRowHeader(assignment.header),
      members: map(assignment.members, member =>
        resolveSlotAssignment(primitiveId, slotId, member)
      )
    };
  }

  if (!slotAccepts(primitiveId, slotId, descriptor.acceptTag)) {
    return {
      status: "rejected",
      reason: `${primitiveId}.${slotId} does not accept a "${descriptor.acceptTag}" module ("${assignment.id}").`
    };
  }

  return {
    status: "module",
    id: assignment.id,
    variant: assignment.variant,
    props: assignment.props
  };
}
