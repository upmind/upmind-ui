// -----------------------------------------------------------------------------
/**
 * @module portal/types
 * @description The portal composition framework's config contract: primitives,
 * slots, module references, and the product-group / custom-area shapes that
 * carry the reserved-pillar-segment guard (design.md §D3, §D4, §D9).
 */

import type {
  ContentAsideSize,
  ContentConfig,
  ContentRowConfig,
  RowHeaderConfig,
  RowSurface
} from "./content/types";
// -----------------------------------------------------------------------------

// Re-exported so `resolve.ts` (and anything importing the config contract as
// one module) can keep reading `ContentConfig` from here, the same as every
// other type this file declares directly — `content/types.ts` stays the
// source of truth (design.md §D7, tasks.md 4.2).
export type { ContentConfig };

// --- primitive ids

export const PRIMITIVE_ID = {
  TOPBAR: "topbar",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
  SIDEBAR: "sidebar",
  UTILITY: "utility",
  BOTTOM: "bottom"
} as const;

export type PrimitiveId = (typeof PRIMITIVE_ID)[keyof typeof PRIMITIVE_ID];

// --- module classification (§D4's two vocabularies — not the same set)

export const MODULE_CATEGORY = {
  NAV: "nav",
  INPUT: "input",
  FEEDBACK: "feedback",
  ACTION: "action",
  DATA: "data",
  GROUP: "group"
} as const;

export type ModuleCategory =
  (typeof MODULE_CATEGORY)[keyof typeof MODULE_CATEGORY];

export const ACCEPT_TAG = {
  IDENTITY: "identity",
  NAV: "nav",
  SEARCH: "search",
  STATUS: "status",
  UTILITY: "utility",
  ACTIONS: "actions",
  CONTENT: "content",
  GROUP: "group"
} as const;

export type AcceptTag = (typeof ACCEPT_TAG)[keyof typeof ACCEPT_TAG];

export const GROUP_AXIS = {
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
  STACKED: "stacked"
} as const;

export type GroupAxis = (typeof GROUP_AXIS)[keyof typeof GROUP_AXIS];

// --- module references

/** The well-known registry id every Module Group entry resolves to (§D6). */
export const MODULE_GROUP_ID = "module-group" as const;

/**
 * Nominal tag, same technique as `PRODUCT_GROUP_TAG`/`CUSTOM_AREA_TAG` below:
 * closes AC2.4's second authoring position. A `ModuleRef` naming a `variant`
 * can only get one by going through `moduleRef()` (registry.ts), the place
 * that checks it against the named module's declared set — a bare object
 * literal carrying `variant` is missing this tag and is rejected for it. A
 * `ModuleRef` naming no variant needs no such check, so it stays untagged
 * and free — that is what AC1.3 depends on: a config naming a module the
 * registry doesn't carry yet must still compile as a plain literal.
 */
export const MODULE_REF_TAG: unique symbol = Symbol("ModuleRef");

/**
 * A reference to one registered module by id. `id` stays a plain `string`
 * (never narrowed to the registry's known ids) so a config can name a module
 * the registry doesn't carry yet — AC1.3 requires that to compile, and be
 * rejected loudly at runtime instead. A variant is different: naming one is
 * only ever meaningful against a real registration, so it is gated by
 * `MODULE_REF_TAG` — `moduleRef()` (registry.ts) is the only place that can
 * supply it, and it is also the place the variant gets checked.
 */
export type ModuleRef =
  | {
      readonly kind: "module";
      readonly id: string;
      readonly variant?: undefined;
      /** Config-owned data the module renders (tasks.md 2.7) — opaque to the resolver, read only by the module component itself. */
      readonly props?: Readonly<Record<string, unknown>>;
    }
  | {
      readonly kind: "module";
      readonly id: string;
      readonly variant: string;
      readonly props?: Readonly<Record<string, unknown>>;
      readonly [MODULE_REF_TAG]: true;
    };

/**
 * A Module Group: itself a registered module (§D6), holding an ordered,
 * axis-carrying member list. `surface`/`header` present the group as a CARD —
 * the boards' `card.metrics` / `card.cta` tiles and Rockzone's streak card
 * are groups wearing a surface, not separate card modules. Absent, the group
 * renders bare exactly as before.
 */
export type ModuleGroupRef = {
  readonly kind: "module";
  readonly id: typeof MODULE_GROUP_ID;
  readonly axis: GroupAxis;
  readonly members: readonly SlotAssignment[];
  readonly surface?: RowSurface;
  readonly header?: RowHeaderConfig;
};

export type SlotAssignment = ModuleRef | ModuleGroupRef;

// --- per-primitive slot records and configs (the discriminated union)

export type TopbarVariant = "full" | "inset" | "docked" | "floating" | "mobile";
export type TopbarSlotId = "left" | "centre" | "right";

/**
 * Whether the chrome bars sit on their own raised surface or flush on the
 * page. The references split: folk.studio and Assets raise their topbar,
 * Rockzone runs both bars flush black against the canvas. Inherited by the
 * secondary and tertiary bars exactly as `variant` is (§D4).
 */
export type ChromeTone = "surface" | "flush";

/**
 * How wide the `floating` variant's glass box runs. `measure` rides the same
 * track as the page content, at every viewport; `viewport` spans the window
 * minus the box's own inset — the Assets reference's literal 1440 crop, which
 * outgrows the capped content on wider windows. Read only by `floating`; a
 * docked bar's surface already spans the viewport with measure-capped
 * contents. Absent = `measure`.
 */
export const TOPBAR_SPAN = {
  MEASURE: "measure",
  VIEWPORT: "viewport"
} as const;

export type TopbarSpan = (typeof TOPBAR_SPAN)[keyof typeof TOPBAR_SPAN];

/**
 * The topbar's height. The references split: Host·Grid draws a 64px bar,
 * the flush shapes ride the shell's own 56px default. Retunes the shell's
 * `--shell-header-h` variable (the library's own sizing channel), so the
 * sticky offsets below the bar stay consistent. Absent = `default`.
 */
export const TOPBAR_HEIGHT = {
  DEFAULT: "default",
  TALL: "tall"
} as const;

export type TopbarHeight = (typeof TOPBAR_HEIGHT)[keyof typeof TOPBAR_HEIGHT];

export type TopbarConfig = {
  readonly primitive: typeof PRIMITIVE_ID.TOPBAR;
  readonly variant?: TopbarVariant;
  readonly tone?: ChromeTone;
  readonly span?: TopbarSpan;
  readonly height?: TopbarHeight;
  readonly slots: Partial<Record<TopbarSlotId, SlotAssignment>>;
};

/** No position variants of its own — it inherits the topbar's (§D4). */
export type SecondaryVariant = "default" | "mobile";
export type SecondarySlotId = "left" | "centre" | "right";
export type SecondaryConfig = {
  readonly primitive: typeof PRIMITIVE_ID.SECONDARY;
  readonly variant?: SecondaryVariant;
  readonly slots: Partial<Record<SecondarySlotId, SlotAssignment>>;
};

/**
 * Reads the same way as `secondary` (§D4), plus `inline`: the rail renders
 * INSIDE the page, after the header region and before the rows — both boards
 * draw their dashboard rail there (Host·Grid under the title block, Strata
 * under its hero) — instead of as a chrome bar above the page.
 */
export type TertiaryVariant = "default" | "mobile" | "inline";
export type TertiarySlotId = "left" | "centre" | "right";
export type TertiaryConfig = {
  readonly primitive: typeof PRIMITIVE_ID.TERTIARY;
  readonly variant?: TertiaryVariant;
  /**
   * `inline` only — the rail renders as a full-measure bordered strip
   * (rules above and below, contents bottom-aligned so an underline tab's
   * indicator sits on the lower rule). The Host·Grid render draws its
   * dashboard rail this way; Strata's floats unruled. Absent = no rules.
   */
  readonly divider?: boolean;
  readonly slots: Partial<Record<TertiarySlotId, SlotAssignment>>;
};

/** `stacked` is cut (parity.yaml `sidebar-stacked` — no library ships it). */
export type SidebarVariant =
  | "default"
  | "floating"
  | "nested"
  | "collapsible"
  | "hidden"
  | "internal";
export type SidebarSlotId = "top" | "middle" | "bottom";

/**
 * Where the rail's collapse trigger sits at `lg`+. The references split:
 * Host·Grid draws it inside the sidebar's own header, beside the brand;
 * the flush shapes keep it in the topbar. Below `lg` the topbar always
 * carries it — the drawer's opener cannot live inside the closed drawer.
 * Absent = `topbar`.
 */
export const SIDEBAR_TRIGGER = {
  TOPBAR: "topbar",
  SIDEBAR: "sidebar"
} as const;

export type SidebarTrigger =
  (typeof SIDEBAR_TRIGGER)[keyof typeof SIDEBAR_TRIGGER];

export type SidebarConfig = {
  readonly primitive: typeof PRIMITIVE_ID.SIDEBAR;
  readonly variant?: SidebarVariant;
  readonly trigger?: SidebarTrigger;
  readonly slots: Partial<Record<SidebarSlotId, SlotAssignment>>;
};

/**
 * `floating`/`dynamic` are cut (parity.yaml `pane-floating-dynamic`; task
 * 3.2). `inline` (Rockzone board, NP.5): the pane renders as the PAGE's own
 * aside track — its occupied slots become `content.aside` rows in slot order
 * — never the shell's full-height rail, which starts above the topbar and
 * narrows the chrome.
 */
export type UtilityVariant = "persistent" | "hidden" | "inline";
export type UtilitySlotId = "top" | "topmid" | "botmid" | "bottom";
/** Which side of the page an `inline` utility pane sits on. The folk.studio board draws its rail LEFT of the content; Rockzone's sat right. Absent = `right`. */
export const UTILITY_SIDE = {
  LEFT: "left",
  RIGHT: "right"
} as const;

export type UtilitySide = (typeof UTILITY_SIDE)[keyof typeof UTILITY_SIDE];

export type UtilityConfig = {
  readonly primitive: typeof PRIMITIVE_ID.UTILITY;
  readonly variant?: UtilityVariant;
  /** `inline` only — which side of the page track the pane occupies. */
  readonly side?: UtilitySide;
  /** `inline` only — the pane's track width; the board's rail is narrower than the default. */
  readonly asideSize?: ContentAsideSize;
  /** `inline` only — the surface each generated aside row presents as (ROW_SURFACE); `panel` cards the pane. Absent = bare. */
  readonly surface?: RowSurface;
  readonly slots: Partial<Record<UtilitySlotId, SlotAssignment>>;
  /**
   * `inline` only — a slot's presence gate, read exactly as the aside row it
   * becomes reads its own (`ContentRowConfig.visible`). A pane slot behind a
   * brand gate (the support PIN panel) has nowhere else to state it: the
   * primitive is declared once for the whole pillar, and the gate is a fact
   * about the DATASET.
   */
  readonly slotVisible?: Partial<
    Record<UtilitySlotId, ContentRowConfig["visible"]>
  >;
};

/**
 * The board's "(single)" slot (§D4) — modelled as a one-key slot record
 * rather than a bespoke field, so the resolver has one shape for every
 * primitive (D6's "no special case anywhere", extended here to `bottom`).
 */
export type BottomSlotId = "default";
export type BottomConfig = {
  readonly primitive: typeof PRIMITIVE_ID.BOTTOM;
  /** The board lists no variants for `bottom` — present for the resolver's uniform per-primitive read. */
  readonly variant?: undefined;
  readonly slots: Partial<Record<BottomSlotId, SlotAssignment>>;
};

export type PrimitiveConfig =
  | TopbarConfig
  | SecondaryConfig
  | TertiaryConfig
  | SidebarConfig
  | UtilityConfig
  | BottomConfig;

/** Keyed by primitive id, each key's value narrowed to its own member of `PrimitiveConfig`. */
export type PrimitivesConfig = {
  readonly [Id in PrimitiveId]?: Extract<PrimitiveConfig, { primitive: Id }>;
};

/**
 * A route's area override (§D8): absent keeps the base, `false` removes the
 * primitive, present replaces the base's entry wholesale — never a deep merge.
 */
export type AreaOverride = {
  readonly [Id in PrimitiveId]?:
    | Extract<PrimitiveConfig, { primitive: Id }>
    | false;
};

// --- content (design.md §D7, tasks.md 4.2) — the real shape lives in
// content/types.ts, imported below, the same per-folder split shell/types.ts
// and modules/menu/types.ts already use for their own contracts.

// --- reserved pillar segments, product groups and custom areas (§D9)

export const RESERVED_PILLAR_SEGMENT = {
  BILLING: "billing",
  SUPPORT: "support",
  ACCOUNT: "account",
  // The logged-out screens (plan F11). Each is a real page file, so a brand
  // page published at one of these slugs would take the route off it.
  LOGIN: "login",
  REGISTER: "register",
  FORGOTTEN_PASSWORD: "forgotten-password",
  RESET_PASSWORD: "reset-password",
  VERIFY: "verify",
  VERIFY_EMAIL: "verify-email",
  LOGOUT: "logout",
  /** Legacy's two token screens — reached from a link, with no session behind them. */
  PREFERENCES: "preferences",
  /** Opening an ORGANISATION rather than a client account (plan F5 O3). */
  REGISTER_ORG: "register-org"
} as const;

/**
 * The five fixed pillars (§D9) — the AREA vocabulary a config's own
 * `areas` map is keyed by. `dashboard` has no URL segment of its own (it is
 * `/`), which is why this is a superset of `RESERVED_PILLAR_SEGMENT`.
 */
export const PORTAL_PILLAR = {
  DASHBOARD: "dashboard",
  PRODUCTS: "products",
  BILLING: "billing",
  SUPPORT: "support",
  ACCOUNT: "account"
} as const;

export type PortalPillar = (typeof PORTAL_PILLAR)[keyof typeof PORTAL_PILLAR];

export type ReservedPillarSegment =
  (typeof RESERVED_PILLAR_SEGMENT)[keyof typeof RESERVED_PILLAR_SEGMENT];

/**
 * A descriptive-string type for a reserved literal (never a plain `never`),
 * so assigning one to `slug` is a build-time error that names the segment —
 * AC1.6 asks for the reserved segment to be named, not just rejected.
 */
export type NotReservedSegment<Slug extends string> =
  Slug extends ReservedPillarSegment
    ? `"${Slug}" is a reserved pillar segment — choose a different slug`
    : Slug;

/**
 * Nominal tags: `Slug` alone can't carry the guard once it's the
 * array-element type of `PortalConfig.groups`/`customAreas` (`Slug` defaults
 * to `string` there, and `NotReservedSegment<string>` is `string` — the
 * conditional only fires against a literal). Only `defineProductGroup`/
 * `defineCustomArea` (routes.ts) attach these, so a group or area written as
 * a plain object literal is rejected for missing the tag, forcing every
 * entry through the function that actually checks its literal `slug`. Real
 * symbols (not `declare const`) since routes.ts sets them at runtime.
 */
export const PRODUCT_GROUP_TAG: unique symbol = Symbol("ProductGroup");
export const CUSTOM_AREA_TAG: unique symbol = Symbol("CustomArea");

/** A product group's URL segment is stable; its `label` is the only thing a rename touches (§D9 consequence 3). */
export type ProductGroup<Slug extends string = string> = {
  readonly slug: NotReservedSegment<Slug>;
  readonly label: string;
  readonly [PRODUCT_GROUP_TAG]: true;
};

/** An "Item Group" under the board's More/Custom Areas pillar. */
export type CustomArea<Slug extends string = string> = {
  readonly slug: NotReservedSegment<Slug>;
  readonly label: string;
  readonly [CUSTOM_AREA_TAG]: true;
};

// --- per-route content (OPEN-DECISION.md, settled by operator ruling 2026-08-26)

/**
 * The structural page positions a config can compose content for. STRUCTURAL,
 * never a literal group slug: a product group's slug is brand-chosen
 * (§D9 consequence 3), so a literal key could never address "any group's
 * listing". The static set enumerates the pillar pages the client-area IA
 * carries (docs/plans/portal-client-area-mock-rebuild.md §1.2); the product
 * hierarchy and custom areas ride the catch-all's own resolution kinds.
 */
/**
 * The three pillars themselves (billing, support, account) carry no key:
 * legacy had no pillar overview, so those routes redirect to the pillar's
 * first page and never request content (`pages/billing/index.vue`).
 */
export const PAGE_KEY = {
  DASHBOARD: "dashboard",
  BILLING_INVOICES: "billing/invoices",
  BILLING_INVOICE_DETAIL: "billing/invoices/detail",
  /** The same document, print-styled — where a "download" lands (plan R11). */
  BILLING_INVOICE_PRINT: "billing/invoices/print",
  BILLING_ORDERS: "billing/orders",
  BILLING_ORDER_DETAIL: "billing/orders/detail",
  BILLING_CREDIT_NOTES: "billing/credit-notes",
  BILLING_CREDIT_NOTE_DETAIL: "billing/credit-notes/detail",
  BILLING_CREDIT_NOTE_PRINT: "billing/credit-notes/print",
  BILLING_PAYMENT_METHODS: "billing/payment-methods",
  BILLING_CREDIT: "billing/credit",
  /** One filed credit statement, print-styled — where its "Download PDF" lands. */
  BILLING_CREDIT_STATEMENT_PRINT: "billing/credit-statements/print",
  BILLING_SETTINGS: "billing/settings",
  SUPPORT_TICKETS: "support/tickets",
  SUPPORT_TICKET_DETAIL: "support/tickets/detail",
  SUPPORT_TICKET_NEW: "support/tickets/new",
  ACCOUNT_PROFILE: "account/profile",
  ACCOUNT_NOTES: "account/notes",
  ACCOUNT_SECURITY: "account/security",
  ACCOUNT_NOTIFICATIONS: "account/notifications",
  ACCOUNT_DELEGATES: "account/delegates",
  ACCOUNT_DELEGATE_DETAIL: "account/delegates/detail",
  ACCOUNT_CHILD_ACCOUNTS: "account/child-accounts",
  ACCOUNT_CHILD_ACCOUNT_DETAIL: "account/child-accounts/detail",
  ACCOUNT_AFFILIATE: "account/affiliate",
  ACCOUNT_LOGS: "account/logs",
  /** One email from the history, previewed — legacy's own modal, as a route. */
  ACCOUNT_LOG_EMAIL_DETAIL: "account/logs/emails/detail",
  /**
   * The logged-out screens (plan F11). `verify` and `verify-email` each carry
   * their link's own outcomes as separate positions, because a link that has
   * expired and one that still needs a password are different pages, not one
   * page with two moods.
   */
  AUTH_RESET_PASSWORD: "auth/reset-password",
  AUTH_VERIFY: "auth/verify",
  AUTH_VERIFY_SET_PASSWORD: "auth/verify/set-password",
  AUTH_VERIFY_EXPIRED: "auth/verify/expired",
  /** The delegate invitation link's own landing (`acceptInviteModal`). */
  DELEGATE_ACCESS_ACCEPT: "delegate-access/accept",
  AUTH_VERIFY_EMAIL: "auth/verify-email",
  AUTH_VERIFY_EMAIL_EXPIRED: "auth/verify-email/expired",
  /**
   * The two token screens legacy served signed OUT: the notification matrix
   * reached from a link (`?token=`), and one address's own topic opt-ins
   * (`?email=&token=`).
   */
  AUTH_PREFERENCES: "auth/preferences",
  AUTH_EMAIL_OPT_INS: "auth/preferences/email-opt-ins",
  /** Opening an organisation — behind the brand's own org-context gate. */
  AUTH_REGISTER_ORG: "auth/register-org",
  /** One brand-authored page, whichever slug the dataset gave it (X15). */
  CUSTOM_PAGE: "custom-page",
  /** A path that names nothing — legacy's own 404 view, not a redirect. */
  NOT_FOUND: "not-found",
  GROUP_LISTING: "group-listing",
  PRODUCT_DETAIL: "product-detail",
  /** The generic action-area composition — `product-area/${area}` overrides it per area. */
  PRODUCT_AREA: "product-area",
  GROUP_ORDER: "group-order"
} as const;

export type StaticPageKey = (typeof PAGE_KEY)[keyof typeof PAGE_KEY];

/**
 * The logged-out screens' own query vocabulary (plan F11) — what a link says
 * about itself. Legacy carried the same three facts: which step the sign-in is
 * on, whether a verification link still wants a password, and whether the
 * link is past using.
 */
export const AUTH_QUERY_KEY = {
  CHALLENGE: "challenge",
  NEEDS_PASSWORD: "needsPassword",
  TOKEN: "token",
  /** The address the login screen carries across to password recovery. */
  USERNAME: "username",
  /** The address a token screen is about — the email opt-in link's own. */
  EMAIL: "email"
} as const;

export const AUTH_QUERY_VALUE = {
  TWOFA: "twofa",
  EXPIRED: "expired",
  /** The truthy spelling a link uses for a flag with no other value to give. */
  YES: "1"
} as const;

/**
 * `product-area/${area}` addresses one action area by its segment (a specific
 * composition for `/[group]/[id]/billing`); `custom/${slug}` addresses one
 * configured custom area. Both stay open strings for the same reason
 * `ModuleRef.id` does (AC1.3's spirit): the config names positions the app
 * discovers at runtime.
 */
export type PageKey =
  | StaticPageKey
  | `product-area/${string}`
  | `custom/${string}`;

export type PortalConfig = {
  readonly primitives: PrimitivesConfig;
  /**
   * The shape's own brand (tasks.md 6.0) — a `@upmind/tokens` theme name, fed
   * straight into the app's existing `data-theme` mechanism (`useTheme.ts`).
   * Optional so a fixture config with no branding concern (e.g. a resolver
   * test's bare `{ primitives, content: {}, ... }`) still type-checks;
   * absent, the default brand applies.
   */
  readonly theme?: string;
  /**
   * The one content primitive every page reads (design.md §D7). `ContentConfig`
   * carries no route dimension — every page in the running app resolves the
   * SAME `content.rows` for the active shape (Stage 6, tasks.md; see
   * `docs/sdd/portal-composition-framework/OPEN-DECISION.md` for the per-route
   * content question this leaves open, held for the operator rather than
   * invented here).
   */
  readonly content: ContentConfig;
  /**
   * Per-page content, keyed by structural position (OPEN-DECISION.md,
   * settled 2026-08-26): a page's candidate keys resolve most-specific-first,
   * and a position with no entry falls back to the singular `content` — a
   * config with no `pages` at all behaves exactly as before this existed.
   */
  readonly pages?: Partial<Record<PageKey, ContentConfig>>;
  /**
   * The brand's own per-area primitive overrides (§D8), keyed by pillar: the
   * mechanism was previously one override applied globally by the layout, so
   * a shape could not decide its own. A pillar absent here keeps the base
   * primitives. Legacy served no side menu on its dashboard, which is exactly
   * what `{ dashboard: { sidebar: false } }` expresses.
   */
  readonly areas?: Partial<Record<PortalPillar, AreaOverride>>;
  readonly groups: readonly ProductGroup[];
  readonly customAreas: readonly CustomArea[];
};
