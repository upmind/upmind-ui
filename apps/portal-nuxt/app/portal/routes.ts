// -----------------------------------------------------------------------------
/**
 * @module portal/routes
 * @description The route tree (design.md §D9), transcribed: the product
 * hierarchy beneath a group, the contextual buy flow, and how an arbitrary
 * top-level path resolves against the configured product groups and custom
 * areas. Pure — the catch-all page ([...slug].vue) is the only caller.
 */

import {
  CUSTOM_AREA_TAG,
  PORTAL_PILLAR,
  PRODUCT_GROUP_TAG,
  RESERVED_PILLAR_SEGMENT
} from "./types";
import { compact, find, includes, some } from "lodash-es";
import type {
  CustomArea,
  PortalPillar,
  NotReservedSegment,
  PortalConfig,
  ProductGroup
} from "./types";

/**
 * The compile-time-checked way to declare a product group: `slug` must not
 * be a reserved pillar segment (§D9 consequence 2 — `NotReservedSegment`,
 * types.ts). A rename only ever touches `label` (consequence 3). Attaches
 * `PRODUCT_GROUP_TAG` so a plain object literal can't stand in for a
 * `ProductGroup` and skip this check (types.ts). The return type's `Slug` is
 * wrapped in `NoInfer` so a call site with its own contextual type (a
 * `PortalConfig`-typed `groups` array, a `ProductGroup`-typed variable) can't
 * supply `Slug = string` from that context and starve the guard — `Slug` is
 * inferred only from the `slug` argument, every time.
 */
export function defineProductGroup<Slug extends string>(group: {
  readonly slug: NotReservedSegment<Slug>;
  readonly label: string;
}): ProductGroup<NoInfer<Slug>> {
  return { ...group, [PRODUCT_GROUP_TAG]: true };
}

/** Same reserved-segment guard, tagging and `NoInfer` treatment as `defineProductGroup`, for a Custom Area's slug. */
export function defineCustomArea<Slug extends string>(area: {
  readonly slug: NotReservedSegment<Slug>;
  readonly label: string;
}): CustomArea<NoInfer<Slug>> {
  return { ...area, [CUSTOM_AREA_TAG]: true };
}

/**
 * Which pillar a path belongs to, for the contextual side menu (legacy served
 * one per section). A configured product group's own path is the products
 * pillar; a custom area belongs to none, exactly as legacy's custom pages
 * carried no side menu.
 */
export function pillarForPath(
  config: PortalConfig,
  path: string
): PortalPillar | undefined {
  const segments = compact(path.split("/"));
  const [head] = segments;
  if (head === undefined) return PORTAL_PILLAR.DASHBOARD;
  if (head === RESERVED_PILLAR_SEGMENT.BILLING) return PORTAL_PILLAR.BILLING;
  if (head === RESERVED_PILLAR_SEGMENT.SUPPORT) return PORTAL_PILLAR.SUPPORT;
  if (head === RESERVED_PILLAR_SEGMENT.ACCOUNT) return PORTAL_PILLAR.ACCOUNT;
  if (some(config.groups, group => group.slug === head)) {
    return PORTAL_PILLAR.PRODUCTS;
  }
  return undefined;
}

export type CatchAllResolution =
  | { readonly kind: "group-listing"; readonly group: ProductGroup }
  | { readonly kind: "group-order"; readonly group: ProductGroup }
  | {
      readonly kind: "product-detail";
      readonly group: ProductGroup;
      readonly id: string;
    }
  | {
      readonly kind: "product-action-area";
      readonly group: ProductGroup;
      readonly id: string;
      readonly area: string;
    }
  | { readonly kind: "custom-area"; readonly area: CustomArea }
  | { readonly kind: "unmatched" };

/**
 * Resolves the catch-all's segments against §D9's product hierarchy first,
 * then the configured custom areas, in that order — a group and a custom
 * area sharing a slug is not a case the board specifies; the group wins.
 */
export function resolveCatchAll(
  config: PortalConfig,
  segments: readonly string[]
): CatchAllResolution {
  const [head, ...rest] = segments;
  if (head === undefined) return { kind: "unmatched" };

  const group = find(config.groups, entry => entry.slug === head);
  if (group !== undefined) return resolveProductHierarchy(group, rest);

  const area = find(config.customAreas, entry => entry.slug === head);
  if (area !== undefined) return { kind: "custom-area", area };

  return { kind: "unmatched" };
}

/**
 * design.md §D8's own board quote — "Nested area in dashboard" — decided
 * here on real path segments (tasks.md 6.4). A path beneath a CONFIGURED
 * product group (more segments than the group's own listing) is inside the
 * area; the group's listing page itself, and any path whose head names no
 * configured group, is outside it. The caller (`app/layouts/default.vue`)
 * applies `config/areas/product-hierarchy.ts`'s override only when this is
 * `true`, so a config with no groups (tasks.md 6.2, 6.3) is never reached.
 */
export function isNestedProductArea(
  config: PortalConfig,
  path: string
): boolean {
  const segments = compact(path.split("/"));
  const [head, ...rest] = segments;
  if (head === undefined || rest.length === 0) return false;
  return some(config.groups, group => group.slug === head);
}

/** The support pillar's thread listing — `/support/tickets/<id>` is one thread of it. */
const TICKETS_SEGMENT = "tickets";

/** The listing's own compose route, which is a form rather than a thread. */
const NEW_TICKET_SEGMENT = "new";

/** The resolution kinds that are ABOUT one product rather than about the group. */
const PRODUCT_DETAIL_KINDS: readonly CatchAllResolution["kind"][] = [
  "product-detail",
  "product-action-area"
];

/**
 * Whether a path is ABOUT one entity rather than about its section. The pillar
 * rail navigates the SECTION, so on a page about one product or one ticket it
 * offers siblings the reader did not ask for and pushes the page into a narrow
 * track; these routes take a back link instead (`config/areas/detail.ts`).
 */
export function isDetailRoute(config: PortalConfig, path: string): boolean {
  const segments = compact(path.split("/"));
  if (isTicketDetail(segments)) return true;
  const { kind } = resolveCatchAll(config, segments);
  return includes(PRODUCT_DETAIL_KINDS, kind);
}

/** One thread, never the listing above it and never its compose form. */
function isTicketDetail(segments: readonly string[]): boolean {
  const [pillar, section, id, ...rest] = segments;
  const isThreadPath =
    pillar === RESERVED_PILLAR_SEGMENT.SUPPORT && section === TICKETS_SEGMENT;
  const namesOneThread =
    id !== undefined && id !== NEW_TICKET_SEGMENT && rest.length === 0;
  return isThreadPath && namesOneThread;
}

function resolveProductHierarchy(
  group: ProductGroup,
  rest: readonly string[]
): CatchAllResolution {
  if (rest.length === 0) return { kind: "group-listing", group };

  const [id, ...tail] = rest;
  if (id === "order" && tail.length === 0)
    return { kind: "group-order", group };
  if (tail.length === 0) return { kind: "product-detail", group, id };
  if (tail.length === 1)
    return { kind: "product-action-area", group, id, area: tail[0] };

  return { kind: "unmatched" };
}
