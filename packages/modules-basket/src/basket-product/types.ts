import type { StorefrontRoute } from "@upmind-automation/foundation";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

export type BasketProductEditProps = {
  storefrontRoute: StorefrontRoute;
  catalogueRoute?: RouteLocationAsRelativeGeneric;
  hideSlots?: string[];
  hideTerms?: boolean;
};
