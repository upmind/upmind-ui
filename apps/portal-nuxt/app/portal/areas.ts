// -----------------------------------------------------------------------------
/**
 * @module portal/areas
 * @description The route's area override, derived in ONE place (design.md
 * §D8): the shape's own `areas` declaration by pillar outranks the
 * framework's single product-hierarchy override. Both resolve() callers use
 * this — the layout for the chrome, `PortalPageHost` for the page content.
 * The page host resolving WITHOUT it is how the dashboard kept a reserved
 * (and, once the rail CTA left, visibly empty) aside track the shape's
 * `areas` had removed from the chrome.
 */

import { DETAIL_AREA_OVERRIDE } from "./config/areas/detail";
import { PRODUCT_HIERARCHY_AREA_OVERRIDE } from "./config/areas/product-hierarchy";
import { isDetailRoute, isNestedProductArea, pillarForPath } from "./routes";
import type { AreaOverride, PortalConfig } from "./types";

export function areaForPath(
  config: PortalConfig,
  path: string
): AreaOverride | undefined {
  // Ahead of the shape's own `areas`: a page about ONE product or ticket takes
  // a back link over its section's rail, whatever the pillar declares.
  if (isDetailRoute(config, path)) return DETAIL_AREA_OVERRIDE;

  const pillar = pillarForPath(config, path);
  const declared = pillar === undefined ? undefined : config.areas?.[pillar];
  if (declared !== undefined) return declared;

  if (isNestedProductArea(config, path)) {
    return PRODUCT_HIERARCHY_AREA_OVERRIDE;
  }
  return undefined;
}
