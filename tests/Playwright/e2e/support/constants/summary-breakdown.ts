/**
 * Catalogue ids for the itemised basket-summary breakdown specs.
 *
 * Every id below was read from the live QA catalogue
 * (`GET /api/basket/products?with=products_options,products_options.category,
 * products_attributes,products_attributes.category`) — none is hand-authored.
 * The `cycle` values are the billing cycles that catalogue actually prices each
 * subproduct at; seeding a cycle it does not price is rejected by the pending
 * machine ("Failed to validate pending products").
 */

/**
 * Starter Hosting: sold on 1/12/24-month terms, carries two option categories
 * and one attribute category — the Background product ("a configurable product
 * sold on a term, with a selectable option and an attribute").
 *
 * Not quantifiable: seeding quantity > 1 is rejected. Multi-quantity coverage
 * uses `QUANTIFIABLE_PRODUCT` instead.
 */
export const CONFIGURED_PRODUCT = {
  id: "3de78642-de53-9714-76df-21208469530d",
  name: "Starter Hosting",
  /** Term to seed. 12 months so the term line's adverbial form is unambiguous. */
  billingCycle: 12,
  option: {
    /** Location — one value per unit, priced per unit. */
    categoryId: "4d036794-24d0-e710-9e7f-3153698d582e",
    valueId: "78985742-6489-7012-820a-21e325d0ed36",
    cycle: 12
  },
  /**
   * Mailboxes — seeded at quantity 2 so the line's own unit quantity is greater
   * than one (the C10 read-back: the count sits beside the item with the
   * single-item price, never beside the line's figure).
   */
  multiUnitOption: {
    categoryId: "8d632507-9806-5d1e-32eb-8174e234e98d",
    valueId: "4d036794-24d0-e710-42eb-3153698d582e",
    cycle: 0,
    unitQuantity: 2
  },
  /**
   * Operating System — the catalogue prices this attribute at no cycle at all,
   * so the served detail carries no figure. It is the unpriced-line case.
   */
  unpricedAttribute: {
    categoryId: "47d73824-8507-9315-322f-81e642d59e06",
    valueId: "5952098d-3de4-0917-793c-31578626e347",
    cycle: 0
  }
} as const;

/**
 * Consulting Block: a quantifiable one-off with a term and no subproducts —
 * the only shape that seeds cleanly above quantity 1.
 */
export const QUANTIFIABLE_PRODUCT = {
  id: "20403869-6e54-721d-264c-518d9305e7d2",
  name: "Consulting Block",
  billingCycle: 0,
  quantity: 3
} as const;

/**
 * Dev Block: its required "Bundle" option category is flagged
 * `price_override`, so the selected bundle carries the whole configuration
 * price and the product's own term price is served as zero.
 *
 * This is the product design.md §7 item 1 / parity GAP-02 records as unknown:
 * the catalogue does carry price-overriding option categories (Dev Block's
 * "Bundle", and the "Domain Setup (Free)" category on .au / .uk / .co.uk). The
 * domain-side ones need a full registrant configuration to commit; Dev Block
 * needs none, so the reconciliation criterion is drivable after all.
 */
export const PRICE_OVERRIDE_PRODUCT = {
  id: "78985742-6489-7012-8e2b-21e325d0ed36",
  name: "Dev Block",
  billingCycle: 0,
  overridingOption: {
    categoryId: "2785d26e-9678-3d16-7deb-314502e70439",
    valueId: "2785d26e-9678-3d16-984a-314502e70439",
    cycle: 0
  }
} as const;

/** Cart-meta keys selecting the itemised presentation, per context. */
export const SUMMARY_DETAILS_KEYS = {
  BASKET: "@context.basket.basketSummaryDetails",
  CHECKOUT: "@context.checkout.basketSummaryDetails"
} as const;

/** Cart-meta values for a `ui.*` visibility setting. */
export const VISIBILITY = {
  VISIBLE: "visible",
  HIDDEN: "hidden"
} as const;
