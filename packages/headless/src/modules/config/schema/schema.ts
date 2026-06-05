import type {
  Visibility,
  ImageRatio,
  GridLayout,
  ListStyle,
  CategoryGridLayout,
  ProductListStyle,
  ImagesStyle,
  Orientation,
  ProductStyle,
  ClampableVisibility,
  ClampLines,
  ZeroPriceDisplay,
  OptionSelector,
  DescriptionDisplay,
  TermSelector,
  TaxesDisplay,
  Editability,
  GatewayCap,
  Breadcrumbs,
  IconVariant,
  DividerStyle,
  OptionGroupSpacing,
  ProductSetupMode,
  Benefit,
  ProductBundleConfig,
  ProductRecommendConfig,
  Badge,
  LabelContent
} from "./types";

export interface UISchema {
  // --- Categories
  /** Display active category badge */
  activeCategoryBadge?: Visibility;
  /** Display active category description */
  activeCategoryDescription?: Visibility;
  /** Display category badge */
  categoryBadge?: Visibility;
  /** Display category excerpt */
  categoryExcerpt?: Visibility;
  /** Display category icon */
  categoryIcon?: Visibility;
  /** Display category fallback image */
  categoryImageFallback?: Visibility;
  /** Aspect ratio for category images */
  categoryImageRatio?: ImageRatio;
  /** Display category image(s) */
  categoryImages?: Visibility;
  /** Display for categories list */
  categoryList?: ListStyle;
  /** Layout for categories list (if grid). @requires categoryList = 'grid' */
  categoryListLayout?: CategoryGridLayout;

  // --- Product properties
  /** Display anchor price (eg. 'From $X.XX') */
  productAnchorPrice?: Visibility;
  /** Display product badges set in @data (eg. 'Most Popular') */
  productBadge?: Visibility;
  /** Display product benefits set in @data */
  productBenefits?: Visibility;
  /** Display product category */
  productCategory?: Visibility;
  /** Display fields in the configuration summary */
  productConfigFieldsSummary?: Visibility;
  /** Display options in the configuration summary */
  productConfigOptionsSummary?: Visibility;
  /** Display product configuration summary */
  productConfigSummary?: Visibility;
  /** Display product description */
  productDescription?: ClampableVisibility;
  /** Number of lines to clamp description. @requires productDescription = 'clamped' */
  productDescriptionClamp?: ClampLines;
  /** Display product description */
  productExcerpt?: Visibility;
  /** Display product fallback image */
  productImageFallback?: Visibility;
  /** Aspect ratio for product images */
  productImageRatio?: ImageRatio;
  /** Display product image(s) */
  productImages?: Visibility;
  /** Style of product image(s) */
  productImagesStyle?: ImagesStyle;
  /** Layout for products list */
  productList?: ProductListStyle;
  /** Product list grid layout (if applicable). @requires productList = 'grid' */
  productListLayout?: GridLayout;
  /** Display native product recommendations */
  productNativeRecommendations?: Visibility;
  /** Orientation of product content */
  productOrientation?: Orientation;
  /** Display detailed price summary (eg. 'Was/Now/Next') */
  productPriceSummary?: Visibility;
  /** Product style */
  productStyle?: ProductStyle;
  /** Display product term selector */
  productTermSelector?: Visibility;

  // --- Options
  /** Display option group descriptions (eg. Location) */
  optionGroupDescription?: DescriptionDisplay;
  /** Divider style between option groups */
  optionGroupDividers?: DividerStyle;
  /** Spacing between option groups (in Tailwind spacing units) */
  optionGroupSpacing?: OptionGroupSpacing;
  /** Display option item benefits (if set in option @data) */
  optionItemBenefits?: Visibility;
  /** Display option item descriptions (eg. US Central 1) */
  optionItemDescription?: DescriptionDisplay;
  /** Component for option selector */
  optionSelector?: OptionSelector;
  /** Layout for option selector (if grid). @requires optionSelector = 'radio-grid' */
  optionSelectorGrid?: GridLayout;
  /** Show icons for option */
  optionSelectorIcons?: Visibility;
  /** Display option item upsells (requires enablement from option @data) */
  optionUpsells?: Visibility;

  // --- Terms
  /** Component for term selector (eg. Pay Monthly | Pay Yearly) */
  termSelector?: TermSelector;
  /** Grid layout for term selector. @requires termSelector = 'radio-grid' */
  termSelectorGrid?: GridLayout;
  /** Show term summary (eg. 'Pay $X.XX today...') */
  termSelectorSummary?: Visibility;

  // --- Basket
  /** Display custom basket fields */
  basketFields?: Visibility;
  /** Display basket items */
  basketItems?: Visibility;
  /** Display basket summary */
  basketSummary?: Visibility;
  /** Display basket taxes (if consolidated, show breakdown in popover) */
  basketTaxes?: TaxesDisplay;

  // --- Checkout/Billing
  /** Display billing details */
  billingDetails?: Editability;
  /** Cap the number of gateways to initially show */
  paymentGatewaysCap?: GatewayCap;

  // --- Product Setup
  /** Controls which products require setup before checkout. 'required' = only invalid, 'deferred' = invalid + deferred with empty fields */
  productSetup?: ProductSetupMode;

  // --- SEO
  /** Page title for <title> tag */
  seoTitle?: string;
  /** Meta description for <meta name="description"> */
  seoDescription?: string;
  /** Canonical URL for <link rel="canonical"> */
  seoCanonical?: string;
  /** Open Graph title for og:title */
  seoOgTitle?: string;
  /** Open Graph description for og:description */
  seoOgDescription?: string;
  /** Open Graph image URL for og:image */
  seoOgImage?: string;
  /** Twitter Card title for twitter:title */
  seoTwitterTitle?: string;
  /** Twitter Card description for twitter:description */
  seoTwitterDescription?: string;
  /** Twitter Card image URL for twitter:image */
  seoTwitterImage?: string;

  // --- Global
  /** Display breadcrumbs (defaults to showing immediate parent category) */
  breadcrumbs?: Breadcrumbs;
  /** Icon variant/style */
  iconVariant?: IconVariant;
  /** Template for screen */
  template?: string;
  /** Theme for screen */
  theme?: string;
  /** Display slot for trust messaging */
  trustMessaging?: Visibility;
  /** Control the presentation of zero prices (eg. '$0.00' or 'Free') */
  zeroPriceDisplay?: ZeroPriceDisplay;
}

export interface DataSchema {
  /** Disable standalone billing details screen */
  billingDetailsDisabled?: boolean;

  /** Disable store catalogue (link direct to products from external site) */
  catalogueDisabled?: boolean;

  /** Optional category badge. Eg. 'Popular' or { label: 'Popular', icon: 'star' } */
  categoryBadge?: Badge;

  /** Optional clickwrap disclaimer shown below 'Place order' button */
  clickwrapDisclaimer?: string;

  /** Optional display font link/url for custom families or weights */
  displayFontLink?: string;

  /** Optional product option badge. Eg. 'Recommended' or { label: 'Recommended', icon: 'check' } */
  optionBadge?: Badge;

  /** Array of option benefits to show within configure step / basket upsells */
  optionBenefits?: Benefit[];

  /** Enable in-basket product option upsells (Eg. Domain Privacy Addon) */
  optionUpsellEnabled?: boolean;

  /** Optional product badge. Eg. 'Hot Right Now' or { label: 'Hot Right Now', icon: 'fire' } */
  productBadge?: Badge;

  /** Array of product benefits to show within catalogue listing */
  productBenefits?: Benefit[];

  /**
   * Optional product name override with dynamic template interpolation.
   *
   * Supports template variables in {{ }} format that will be replaced with product properties.
   *
   * Available properties:
   * - {{ name }} - Product name (auto-resolved from productDetails.name)
   * - {{ title }} - Product title (auto-resolved from productDetails.title)
   * - {{ service_identifier }} - Service identifier (from basket product, supports both snake_case and camelCase)
   * - {{ brand }} - Brand name (auto-resolved from productDetails.brand)
   * - {{ category }} - Category name (auto-resolved from productDetails.category)
   * - {{ productDetails.* }} - Any nested property from productDetails
   *
   * Examples:
   * - "{{ service_identifier }} - {{ name }}" → "example.com - Domain Registration"
   * - "{{ name }}" → "Web Hosting"
   * - "{{ brand }} {{ title }}" → "Acme Web Hosting Pro"
   */
  productName?: string;

  /**
   * Product configs to bundle with another product add (fails silently).
   * Can be either:
   * - An array of bundle configs (used directly)
   * - A keyed object of bundle configs (selected by `?bundle=key` URL param)
   */
  productsToBundle?:
    | ProductBundleConfig[]
    | Record<string, ProductBundleConfig[]>;

  /** Array of cross-sell product configs used for the recommendations step */
  productsToRecommend?: ProductRecommendConfig[];

  /** Mark a product as unavailable (sold out). Disables the CTA and shows an "unavailable" badge in catalogue/configure/recommendations. */
  productUnavailable?: boolean;

  /** Optional reason paired with `productUnavailable`. Accepts a label string or {@link LabelContent}, and is bound to whichever surface is visible — the overlay badge in catalogue/recommendations, or the disabled CTA in configure / `hideImage` mode. */
  productUnavailableReason?: string | LabelContent;

  /** Optional store badge, shown on primary (no category) catalogue screen */
  storeBadge?: Badge;

  /** Optional store heading, shown on primary (no category) catalogue screen */
  storeHeading?: string;

  /** Optional store sub-heading, shown on primary (no category) catalogue screen */
  storeSubHeading?: string;

  /** Optional store URL. If set, store logo and 'Continue shopping' CTAs redirect off-site. */
  storeUrl?: string;

  /** Trim trailing zeroes from catalogue prices. Eg. '$49.00' becomes '$49'. */
  trimTrailingZeroes?: boolean;

  /** Optional markdown for trust messaging. */
  trustMessagingMarkdown?: string;

  /** Option group name for grouping items in select-grouped */
  optionGroupLabel?: string;
  /** Option group icon name */
  optionGroupIcon?: string;
  /** Option image URL */
  optionImgUrl?: string;
}
