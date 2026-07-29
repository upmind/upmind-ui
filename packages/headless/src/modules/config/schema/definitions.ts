import type { UIDefinitions, DataDefinitions } from "./types";
import {
  UIContext,
  UIScope,
  ALL_CONTEXTS,
  VISIBILITY,
  IMAGE_RATIO,
  GRID_LAYOUT,
  TAXES_DISPLAY,
  LIST_STYLE,
  CATEGORY_GRID_LAYOUT,
  EDITABILITY,
  GATEWAY_CAP,
  BREADCRUMBS,
  OPTION_SELECTOR,
  DESCRIPTION_DISPLAY,
  PRODUCT_LIST_STYLE,
  IMAGES_STYLE,
  ORIENTATION,
  PRODUCT_STYLE,
  CLAMPABLE_VISIBILITY,
  CLAMP_LINES,
  ZERO_PRICE_DISPLAY,
  TERM_SELECTOR,
  ICON_VARIANT,
  DIVIDER_STYLE,
  OPTION_GROUP_SPACING,
  PRODUCT_SETUP_MODE
} from "./types";

export const UI_META_DEFINITIONS = {
  activeCategoryBadge: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND]
  },
  activeCategoryDescription: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND]
  },
  categoryBadge: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  categoryExcerpt: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  categoryIcon: {
    type: VISIBILITY,
    default: VISIBILITY.HIDDEN,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  categoryImageFallback: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  categoryImageRatio: {
    type: IMAGE_RATIO,
    default: IMAGE_RATIO["1:1"],
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  categoryImages: {
    type: VISIBILITY,
    default: VISIBILITY.HIDDEN,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  categoryList: {
    type: LIST_STYLE,
    default: LIST_STYLE.GRID,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  categoryListLayout: {
    type: CATEGORY_GRID_LAYOUT,
    default: CATEGORY_GRID_LAYOUT.THREE_COL,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  productAnchorPrice: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productBadge: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productBenefits: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productCategory: {
    type: VISIBILITY,
    default: VISIBILITY.HIDDEN,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productConfigFieldsSummary: {
    type: VISIBILITY,
    default: VISIBILITY.HIDDEN,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productConfigOptionsSummary: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CONFIGURE, UIContext.BASKET],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productConfigSummary: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CONFIGURE, UIContext.BASKET],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT],
    locked: { [UIContext.BASKET]: VISIBILITY.VISIBLE }
  },
  productDescription: {
    type: CLAMPABLE_VISIBILITY,
    default: CLAMPABLE_VISIBILITY.CLAMPED,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productDescriptionClamp: {
    type: CLAMP_LINES,
    default: CLAMP_LINES.THREE,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productExcerpt: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productImageFallback: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS,
      UIContext.BASKET,
      UIContext.CONFIRMATION
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productImageRatio: {
    type: IMAGE_RATIO,
    default: IMAGE_RATIO["1:1"],
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS,
      UIContext.BASKET,
      UIContext.CONFIRMATION
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productImages: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS,
      UIContext.BASKET,
      UIContext.CONFIRMATION
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productImagesStyle: {
    type: IMAGES_STYLE,
    default: IMAGES_STYLE.AUTO,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS,
      UIContext.BASKET,
      UIContext.CONFIRMATION
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productList: {
    type: PRODUCT_LIST_STYLE,
    default: PRODUCT_LIST_STYLE.GRID,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  productListLayout: {
    type: GRID_LAYOUT,
    default: GRID_LAYOUT.THREE_COL,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  productNativeRecommendations: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productOrientation: {
    type: ORIENTATION,
    default: ORIENTATION.VERTICAL,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productPriceSummary: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productStyle: {
    type: PRODUCT_STYLE,
    default: PRODUCT_STYLE.FLUSH,
    contexts: [UIContext.CATALOGUE, UIContext.RECOMMENDATIONS],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productTermSelector: {
    type: VISIBILITY,
    default: VISIBILITY.HIDDEN,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.RECOMMENDATIONS,
      UIContext.BASKET
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT],
    conditional: true
  },
  zeroPriceDisplay: {
    type: ZERO_PRICE_DISPLAY,
    default: ZERO_PRICE_DISPLAY.LABEL,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS,
      UIContext.BASKET,
      UIContext.AUTH,
      UIContext.CHECKOUT,
      UIContext.CONFIRMATION
    ],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY,
      UIScope.OPTION
    ],
    locked: {
      [UIContext.AUTH]: ZERO_PRICE_DISPLAY.NUMERIC,
      [UIContext.CHECKOUT]: ZERO_PRICE_DISPLAY.NUMERIC,
      [UIContext.CONFIRMATION]: ZERO_PRICE_DISPLAY.NUMERIC
    }
  },

  // --- Options ---
  optionGroupDescription: {
    type: DESCRIPTION_DISPLAY,
    default: DESCRIPTION_DISPLAY.TOOLTIP,
    contexts: [UIContext.CONFIGURE],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY
    ]
  },
  optionGroupDividers: {
    type: DIVIDER_STYLE,
    default: DIVIDER_STYLE.HIDDEN,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  optionGroupSpacing: {
    type: OPTION_GROUP_SPACING,
    default: OPTION_GROUP_SPACING.FOUR,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  optionItemBenefits: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CONFIGURE, UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY,
      UIScope.OPTION
    ],
    conditional: true
  },
  optionItemDescription: {
    type: DESCRIPTION_DISPLAY,
    default: DESCRIPTION_DISPLAY.INLINE,
    contexts: [UIContext.CONFIGURE],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY,
      UIScope.OPTION
    ]
  },
  optionSelector: {
    type: OPTION_SELECTOR,
    default: OPTION_SELECTOR.RADIO_ROWS,
    contexts: [UIContext.CONFIGURE],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY
    ],
    conditional: true
  },
  optionSelectorGrid: {
    type: GRID_LAYOUT,
    default: GRID_LAYOUT.TWO_COL,
    contexts: [UIContext.CONFIGURE],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY
    ]
  },
  optionSelectorIcons: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CONFIGURE],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY,
      UIScope.OPTION
    ]
  },
  optionUpsells: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY
    ],
    conditional: true
  },

  termSelector: {
    type: TERM_SELECTOR,
    default: TERM_SELECTOR.RADIO_GRID,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  termSelectorGrid: {
    type: GRID_LAYOUT,
    default: GRID_LAYOUT.TWO_COL,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  termSelectorSummary: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },

  basketFields: {
    type: VISIBILITY,
    default: VISIBILITY.HIDDEN,
    contexts: [UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [UIScope.BRAND],
    locked: { [UIContext.BASKET]: VISIBILITY.VISIBLE },
    conditional: true
  },
  basketItemConfig: {
    type: EDITABILITY,
    default: EDITABILITY.READONLY,
    contexts: [UIContext.BASKET],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  basketItems: {
    type: VISIBILITY,
    default: VISIBILITY.HIDDEN,
    contexts: [UIContext.CHECKOUT],
    scopes: [UIScope.BRAND]
  },
  basketPromotionCode: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    // basket only in practice — the checkout field stays on the legacy
    // `ui.checkout.hide_promotions_field` setting, so no brand changes on upgrade
    contexts: [UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [UIScope.BRAND]
  },
  basketSummary: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.AUTH, UIContext.CHECKOUT],
    scopes: [UIScope.BRAND],
    locked: { [UIContext.CHECKOUT]: VISIBILITY.VISIBLE }
  },
  basketSummaryDetails: {
    type: VISIBILITY,
    default: VISIBILITY.HIDDEN,
    contexts: [UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [UIScope.BRAND]
  },
  basketTaxes: {
    type: TAXES_DISPLAY,
    default: TAXES_DISPLAY.CONSOLIDATED,
    contexts: [
      UIContext.BASKET,
      UIContext.AUTH,
      UIContext.CHECKOUT,
      UIContext.CONFIRMATION
    ],
    scopes: [UIScope.BRAND]
  },
  billingDetails: {
    type: EDITABILITY,
    default: EDITABILITY.READONLY,
    contexts: [UIContext.BILLING_DETAILS, UIContext.CHECKOUT],
    scopes: [UIScope.BRAND],
    locked: { [UIContext.BILLING_DETAILS]: EDITABILITY.EDITABLE }
  },
  paymentGatewaysCap: {
    type: GATEWAY_CAP,
    default: GATEWAY_CAP.FIVE,
    contexts: [UIContext.CHECKOUT],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  trustMessaging: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: [UIContext.CONFIGURE, UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT],
    conditional: true
  },
  basketAction: {
    type: VISIBILITY,
    default: VISIBILITY.VISIBLE,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND]
  },
  breadcrumbs: {
    type: BREADCRUMBS,
    default: BREADCRUMBS.PARENT,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  iconVariant: {
    type: ICON_VARIANT,
    default: ICON_VARIANT.LINE,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND]
  },
  template: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND]
  },
  theme: {
    default: "default",
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND]
  },

  // --- SEO
  seoTitle: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  seoDescription: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  seoCanonical: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  seoOgTitle: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  seoOgDescription: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  seoOgImage: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  seoTwitterTitle: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  seoTwitterDescription: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  seoTwitterImage: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productSetup: {
    type: PRODUCT_SETUP_MODE,
    default: PRODUCT_SETUP_MODE.REQUIRED,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  }
} satisfies UIDefinitions;

export const DATA_DEFINITIONS = {
  billingDetailsDisabled: {
    default: false,
    contexts: [UIContext.BILLING_DETAILS],
    scopes: [UIScope.BRAND]
  },
  catalogueDisabled: {
    default: false,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND]
  },
  categoryBadge: {
    default: undefined,
    contexts: [UIContext.CATALOGUE, UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY]
  },
  clickwrapDisclaimer: {
    default: undefined,
    contexts: [UIContext.CHECKOUT],
    scopes: [UIScope.BRAND]
  },
  displayFontLink: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND]
  },
  optionBadge: {
    default: undefined,
    contexts: [UIContext.CONFIGURE, UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [UIScope.OPTION_CATEGORY, UIScope.OPTION]
  },
  optionBenefits: {
    default: [],
    contexts: [UIContext.CONFIGURE, UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [UIScope.OPTION_CATEGORY, UIScope.OPTION]
  },
  optionUpsellEnabled: {
    default: false,
    contexts: [UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [UIScope.OPTION]
  },
  productAutoUpdate: {
    default: false,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productBadge: {
    default: undefined,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS
    ],
    scopes: [UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productBenefits: {
    default: [],
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS
    ],
    scopes: [UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productName: {
    default: undefined,
    contexts: [
      UIContext.CONFIGURE,
      UIContext.BASKET,
      UIContext.AUTH,
      UIContext.CHECKOUT,
      UIContext.CONFIRMATION
    ],
    scopes: [UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productsToBundle: {
    default: [],
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productsToRecommend: {
    default: [],
    contexts: [UIContext.RECOMMENDATIONS],
    scopes: [UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productUnavailable: {
    default: false,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  productUnavailableReason: {
    default: undefined,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS
    ],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  storeBadge: {
    default: undefined,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND]
  },
  storeHeading: {
    default: undefined,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND]
  },
  storeSubHeading: {
    default: undefined,
    contexts: [UIContext.CATALOGUE],
    scopes: [UIScope.BRAND]
  },
  storeUrl: {
    default: undefined,
    contexts: ALL_CONTEXTS,
    scopes: [UIScope.BRAND]
  },
  trimTrailingZeroes: {
    default: true,
    contexts: [
      UIContext.CATALOGUE,
      UIContext.CONFIGURE,
      UIContext.RECOMMENDATIONS,
      UIContext.BASKET,
      UIContext.AUTH
    ],
    scopes: [
      UIScope.BRAND,
      UIScope.PRODUCT_CATEGORY,
      UIScope.PRODUCT,
      UIScope.OPTION_CATEGORY,
      UIScope.OPTION
    ]
  },
  trustMessagingMarkdown: {
    default: undefined,
    contexts: [UIContext.CONFIGURE, UIContext.BASKET, UIContext.CHECKOUT],
    scopes: [UIScope.BRAND, UIScope.PRODUCT_CATEGORY, UIScope.PRODUCT]
  },
  optionGroupLabel: {
    default: undefined,
    contexts: [UIContext.CONFIGURE, UIContext.BASKET],
    scopes: [UIScope.OPTION_CATEGORY, UIScope.OPTION]
  },
  optionGroupIcon: {
    default: undefined,
    contexts: [UIContext.CONFIGURE],
    scopes: [UIScope.OPTION_CATEGORY, UIScope.OPTION]
  },
  optionImgUrl: {
    default: undefined,
    contexts: [UIContext.CONFIGURE, UIContext.BASKET],
    scopes: [UIScope.OPTION_CATEGORY, UIScope.OPTION]
  }
} satisfies DataDefinitions;
