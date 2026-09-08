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

import { PRODUCT_HIERARCHY_AREA_OVERRIDE } from "./config/areas/product-hierarchy";
import { isNestedProductArea, pillarForPath } from "./routes";
import type { AreaOverride, PortalConfig } from "./types";

export function areaForPath(
  config: PortalConfig,
  path: string
): AreaOverride | undefined {
  const pillar = pillarForPath(config, path);
  const declared = pillar === undefined ? undefined : config.areas?.[pillar];
  if (declared !== undefined) return declared;

  if (isNestedProductArea(config, path)) {
    return PRODUCT_HIERARCHY_AREA_OVERRIDE;
  }
  return undefined;
}
