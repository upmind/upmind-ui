// --- internal

import type { UIMeta } from "../product/types";

// -----------------------------------------------------------------------------

/**
 * The contexts available for the Brand/Product/Category Meta uI.
 * Contexts always apply to an entity type, e.g., Product, Category, etc.
 * @enum {string}
 * @remarks
 * - DATA: for data-related UI overrides.
 * - ROUTE: settings and configurations for entities at a ROUTING level: eg: pages, routes, etc.
 * - DISPLAY: settings and configurations when showing an entity in a SINGULAR context. eg: Route view, Detail pages, Hero Sections, etc.
 * - CAPTURE: settings and configurations for CAPTURING USER INPUT for an entity. eg: forms.
 * - LIST: settings and configurations for showing an entity in a LIST context. eg: Category view, grids, tables, etc.
 */
enum UI_CONTEXT {
  ROUTE = "@route",
  DATA = "@data",
  DISPLAY = "@display",
  CAPTURE = "@capture",
  LIST = "@list"
}

/**
 * The entities available for the Brand/Product/Category Meta uI.
 * @enum {string}
 * @remarks
 * Each entity type represents a configurable UI component within the application.
 * This may be route views, sections, or specific UI elements related to the entity.
 * But whenever that component is used for a specific entity, the uI for that entity will apply.
 * That way Users can configure the UI for each entity type with fine-grained control.
 *
 * NB: Different entity types may have different applicable contexts and different options within those contexts.
 *     but there will be some commonalities across entities.
 *    For example, most entities will have DISPLAY and LIST contexts, but only some may have CAPTURE contexts.
 */
enum UI_ENTITY {
  BASKET = "basket",
  BASKET_FIELDS = "basket_fields",
  BASKET_BILLING = "basket_billing",
  BASKET_PRODUCTS = "basket_products",

  CATALOGUE = "catalogue",
  CHECKOUT = "checkout",
  FOOTER = "footer",
  HEADER = "header",
  ORDER = "order",
  PRODUCT = "product",
  PRODUCT_CATEGORY = "product_category",
  PRODUCT_OPTION = "product_option",
  PRODUCT_OPTION_ITEM = "product_option_item",
  TERM = "term",
  RECOMMENDATIONS = "recommendations",
  SESSION = "session"
}

/**
 * The route-specific options for the Brand/Product/Category Meta uI.
 * @type {object}
 * @property {("default" | "enclosed" | "full")} [layout] - The layout type for the route.
 */
export type UIRouteOptions = {
  template?: "default" | "enclosed" | "full";
};

/**
 * The uI structure for the Brand/Product/Category Meta.
 * @type {object}
 * @remarks
 * The uI is organized by context, with specific options for routes and entities.
 * Each context can have its own set of configurations to customize the UI behavior.
 * NB: UI contexts cascade like css  (EXCEPT ROUTE),
 *     In that Brand Meta UI is the lowest priority,
 *     followed by Category Meta UI, with each category in the hierarchy overriding the previous one, The lowest category has the highest priority,
 *     and Finally the Product Meta UI having the highest priority.
 *
 * eg:
 * - Brand Meta UI defines the base layout for the product route.
 * - Category Meta UI for a parent category overrides the product route layout for all products in that category.
 * - Category Meta UI for a child category further overrides the product route layout for all products in that child category.
 * - Product Meta UI finally overrides the product route layout for that specific product.
 */
export type UI = {
  [UI_CONTEXT.DISPLAY]?: {
    // eg:
    // uischema.@display.checkout.basketProducts : 'hidden' (default) | 'visible'  | 'on_error'
    // uischema.@display.checkout.basketFields : 'hidden' (default)| 'visible' | 'on_error'
    // uischema.@display.checkout.basketBilling : 'hidden' | 'visible' (default) | 'on_error'
    [UI_ENTITY.CHECKOUT]?: {
      basketProducts?: "hidden" | "visible" | "on_error";
      basketFields?: "hidden" | "visible" | "on_error";
      basketBilling?: "hidden" | "visible" | "on_error";
    };
  };

  // NB: Only Brand Meta UI has route context as its global
  //     We will enable routes with layout overrides as they become supported in the app
  [UI_CONTEXT.ROUTE]: Record<string, UIRouteOptions>;
};

/**
 * The Brand Meta data structure.
 * @type {object}
 * @remarks
 * This structure defines the meta information for a brand, including cart settings and UI schema.
 * The `cart` property is deprecated and will be replaced by the `uI` property for UI configurations.
 */
export type BrandMeta = {
  // DEPRECATED: use uI instead
  cart: {
    storefront_url?: string; // URL of the storefront
    layout?: "default" | "enclosed" | "full";
    clickwrap_disclaimer?: string;
    tagline?: string;
    description?: string;
    catalogue?: {
      disabled?: boolean;
      facet?: boolean;
      inSitu?: boolean;
    };
    ui: UIMeta;
  };

  /**
   * i18n message overrides for the brand
   * This allows brands to override sprcific keys for i18n at a brand level for some/all locales
   * @type {Record<string, Record<string, string>>}
   * eg:
   * Where we have a key that has locale specific messages
   * "i18n": {
        "text.empty": {
          "en": "Your **cart** is empty",
          "fr": "Votre **panier** est vide"
          "*": "Your **cart** is empty" // global unless specifically defined
        },
      }
  */
  i18n?: Record<string, Record<string, string>>;

  // ---
  uischema: UI;
  icon_variant?: string; // the preferred icon variant to be used
  variant?: string; // the preferred variant/token id to be used
  theme?: string; // the preferred data-theme id to be used
};
