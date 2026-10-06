// -----------------------------------------------------------------------------
/**
 * @module product
 * @description The `product` package: read, configure and seat, plus the shared product rendering kit.
 */
import { registerFormRenderers } from "@upmind-automation/foundation";
import { productRenderers } from "./renderers";
// -----------------------------------------------------------------------------

registerFormRenderers(productRenderers);

// --- The app-facing organisms
export { default as UpmProductConfigure } from "./components/Configure.vue";
export { default as UpmProductNotFound } from "./components/NotFound.vue";

// --- Config / views kit
export { default as Config } from "./components/Config.vue";
export { default as ConfigErrors } from "./components/ConfigErrors.vue";
export { default as ConfigSkeleton } from "./components/ConfigSkeleton.vue";

// --- Hero kit
export { default as ProductHero } from "./components/hero/ProductHero.vue";
export { default as ProductHeroSkeleton } from "./components/hero/ProductHeroSkeleton.vue";
export { default as ProductImage } from "./components/hero/ProductImage.vue";
export { PRODUCT_HERO_DIRECTION } from "./components/hero/types";

// --- Pricing atoms + list
export { default as CurrentPrice } from "./components/pricing/CurrentPrice.vue";
export { default as ExPrice } from "./components/pricing/ExPrice.vue";
export { default as Promotion } from "./components/pricing/Promotion.vue";
export { default as Pricing } from "./components/pricing-list/Pricing.vue";
export { default as PricingSkeleton } from "./components/pricing-list/PricingSkeleton.vue";
export { default as PricingTotal } from "./components/pricing-list/PricingTotal.vue";

// --- Term kit
export { default as TermRow } from "./components/terms/TermRow.vue";
export { default as UpmTermsSelect } from "./components/terms/TermsSelect.vue";

// --- Card kit
export * from "./components/card";

// --- Export Renderers
export * from "./renderers";

// --- Export Types
export type { ConfigProps, ConfigureProps, Item } from "./types";
