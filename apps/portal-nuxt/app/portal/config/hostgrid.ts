// -----------------------------------------------------------------------------
/**
 * @module portal/config/hostgrid
 * @description hostgrid — the shape this app ships, wearing the APP SHELL
 * (operator brief 2026-08-28): the framework diagram's own arrangement, the
 * one `@upmind/ui`'s `AdminShell` preset draws. The brand heads a
 * rail-collapsible SIDEBAR carrying the primary destinations, and the topbar
 * keeps a ⌘K launcher left with alerts + account right. The palette is
 * Host·Grid's — a white canvas, grey panels, ink CTAs.
 *
 * Its menus are the LEGACY client portal's, exactly (operator ruling
 * 2026-08-26): `ClientPrimaryTabigation`'s six tabs — now the
 * `pillar-nav-items` data ref, so each brand's own gates decide which of them
 * render — and each pillar's own side menu, sub-items and children included.
 * The dashboard carries no side menu, as legacy's did not (`areas`, below).
 *
 * TWO left-hand columns, both by design (the framework diagram): the shell's
 * SIDEBAR carries the primary destinations, and the INNER SIDEBAR — declared
 * here as an `inline` utility pane on the LEFT, which the framework maps onto
 * the page's own aside track — carries the current pillar's section menu.
 */

import { defineTheme } from "@upmind/tokens";
import { ArrowRight } from "lucide-vue-next";
import {
  CONTENT_ASIDE_SIZE,
  CONTENT_MEASURE,
  ROW_LAYOUT,
  ROW_SURFACE
} from "../content/types";
import {
  HOSTGRID_COMMAND_ITEMS,
  HOSTGRID_GROUPS
} from "../fixtures/hostgrid.fixture";
import { MOCK_ACTION, mockActionValue } from "../mock/actions";
import { DATA_REF_ID, dataRef } from "../mock/data-refs";
import { BRAND_MARK } from "../modules/brand/types";
import { BUTTON_MODULE_VARIANT } from "../modules/button/types";
import { LIST_MODULE_VARIANT } from "../modules/list/types";
import { PROSE_MODULE_VARIANT } from "../modules/prose/types";
import { SPEC_MODULE_VARIANT } from "../modules/spec/types";
import {
  ACCOUNT_MENU_MODULE_ID,
  BANNER_MODULE_ID,
  BRAND_MODULE_ID,
  BUTTON_MODULE_ID,
  COMMAND_MODULE_ID,
  EMPTY_STATE_MODULE_ID,
  LIST_MODULE_ID,
  MENU_MODULE_ID,
  METRIC_MODULE_ID,
  NOTIFICATIONS_MODULE_ID,
  PROSE_MODULE_ID,
  SETTINGS_MODULE_ID,
  SPEC_MODULE_ID,
  moduleGroup,
  moduleRef
} from "../registry";
import {
  GROUP_AXIS,
  PAGE_KEY,
  PORTAL_PILLAR,
  PRIMITIVE_ID,
  SIDEBAR_TRIGGER,
  UTILITY_SIDE
} from "../types";
import { accountPages } from "./account-pages";
import { authPages } from "./auth-pages";
import { billingPages } from "./billing-pages";
import { brandNoteRow } from "./pager";
import { productPages } from "./product-pages";
import { supportPages } from "./support-pages";
import type { PortalConfig, UtilityConfig } from "../types";

/**
 * Legacy's account sidebar summary: the avatar and display name over the
 * username, then the standing facts under it — one card, two modules, because
 * an identity row and a fact list are different shapes of the same panel.
 */
/** How many products waiting on setup show before the Show-more control — legacy's own two. */
const NEEDS_ATTENTION_SHOWN = 2;

const ACCOUNT_CARD = moduleGroup(GROUP_AXIS.STACKED, [
  moduleRef(LIST_MODULE_ID, {
    variant: LIST_MODULE_VARIANT.COMPACT,
    props: {
      items: dataRef(DATA_REF_ID.ACCOUNT_CARD_ITEMS),
      emptyTitle: "No account"
    }
  }),
  moduleRef(SPEC_MODULE_ID, {
    variant: SPEC_MODULE_VARIANT.MICRO,
    props: {
      items: dataRef(DATA_REF_ID.ACCOUNT_CARD_SPEC_ITEMS),
      emptyTitle: "No account facts",
      copyLabel: "Copy"
    }
  })
]);

/**
 * The support PIN panel — the number a client reads out to us, masked until
 * they ask for it. Gated on the brand's own `SUPPORT_PIN_ENABLED` through the
 * pane's slot gate, so a brand that offers no PIN renders no panel.
 */
const SUPPORT_PIN_PANEL = moduleGroup(
  GROUP_AXIS.STACKED,
  [
    moduleRef(SPEC_MODULE_ID, {
      props: {
        items: dataRef(DATA_REF_ID.SUPPORT_PIN_PANEL_ITEMS),
        emptyTitle: "No support PIN"
      }
    }),
    moduleRef(BUTTON_MODULE_ID, {
      variant: BUTTON_MODULE_VARIANT.GROUP,
      props: {
        label: "Support PIN",
        actions: dataRef(DATA_REF_ID.SUPPORT_PIN_ACTIONS),
        emptyTitle: "No PIN controls"
      }
    })
  ],
  {
    header: {
      title: "Support PIN",
      description: "Read this out when you call us."
    }
  }
);

/** The account pillar's own pane — the card, the section menu, then the PIN. */
const ACCOUNT_UTILITY_PANE = {
  primitive: PRIMITIVE_ID.UTILITY,
  variant: "inline",
  side: UTILITY_SIDE.RIGHT,
  asideSize: CONTENT_ASIDE_SIZE.MD,
  surface: ROW_SURFACE.PANEL,
  slots: {
    top: ACCOUNT_CARD,
    topmid: moduleRef(MENU_MODULE_ID, {
      props: {
        items: dataRef(DATA_REF_ID.PILLAR_SUBMENU_ITEMS),
        navLabel: "Section navigation"
      }
    }),
    botmid: SUPPORT_PIN_PANEL
  },
  slotVisible: {
    topmid: dataRef(DATA_REF_ID.HAS_PILLAR_SUBMENU),
    botmid: dataRef(DATA_REF_ID.IS_SUPPORT_PIN_ENABLED)
  }
} as const satisfies UtilityConfig;

/** hostgrid — Host·Grid's own palette (config/hostgrid.ts), on this shape. */
export const hostgridTheme = defineTheme({
  name: "hostgrid",
  label: "Host·Grid",
  description:
    "Host·Grid's identity on the topbar-primary shape — a white canvas, soft grey chips and panels, near-black CTAs.",
  colors: {
    // Host·Grid's render carries no accent: its only "colour" is ink.
    primary: { base: "#171717", label: "light" },
    promo: "#171717",
    gray: "#8A8A8A",
    control: "#171717"
  },
  preferredMode: "light",
  overrides: {
    // The render's canvas is pure white, flat — no derived neutral wash.
    canvas: "#FFFFFF",
    "canvas-stop": "#FFFFFF",
    // The no-accent identity extends to text links (the section View-alls):
    // muted grey at rest, darkening on hover — never the ink CTA colour.
    "text-button-link": "var(--muted)",
    "text-button-link-hover": "var(--body)",
    "radius-slot-button": "8px",
    "radius-slot-card": "12px",
    "radius-slot-field": "8px",
    "radius-slot-image": "8px"
  },
  brand: { logoText: "Host·Grid", tagline: "Domains, websites and email." }
});

/** The trailing View-all action every dashboard section carries alike — the quiet `link` tone, never a boxed button beside the heading. */
function viewAllButton(to: string) {
  return moduleRef(BUTTON_MODULE_ID, {
    variant: BUTTON_MODULE_VARIANT.SINGLE,
    props: {
      label: "View all",
      tone: "link",
      size: "xs",
      trailingIcon: ArrowRight,
      to
    }
  });
}

export const hostgridConfig: PortalConfig = {
  theme: "hostgrid",
  primitives: {
    // The app shell's bar: the ⌘K launcher left, alerts + account right. The
    // brand is NOT here — it heads the sidebar, as the shell puts it, and the
    // centre stays empty because the primary nav moved there too.
    [PRIMITIVE_ID.TOPBAR]: {
      primitive: PRIMITIVE_ID.TOPBAR,
      // `inset`, never `full`: a full-bleed bar spans BOTH shell columns
      // (PortalFrame's `FULL_BLEED_CLASS`) and paints over the sidebar's own
      // header, hiding the brand that heads it.
      variant: "inset",
      slots: {
        left: moduleRef(COMMAND_MODULE_ID, {
          props: {
            label: "Search…",
            title: "Command palette",
            placeholder: "Type a command or search…",
            emptyLabel: "No matches",
            heading: "Go to",
            // Legacy's own six destinations, plus the account rows a client
            // reaches most — every one the `navigate:` verb, like the
            // account menu's (mock/actions.ts).
            items: HOSTGRID_COMMAND_ITEMS
          }
        }),
        right: moduleGroup(GROUP_AXIS.HORIZONTAL, [
          moduleRef(NOTIFICATIONS_MODULE_ID, {
            props: {
              items: dataRef(DATA_REF_ID.NOTIFICATION_ITEMS),
              count: dataRef(DATA_REF_ID.UNREAD_NOTIFICATION_COUNT),
              label: "Notifications",
              // Legacy's own dropdown: a rail across the top, a dismiss on
              // every row and a load-more under them.
              filters: dataRef(DATA_REF_ID.NOTIFICATION_FILTERS),
              filterValue: dataRef(DATA_REF_ID.NOTIFICATION_FILTER_VALUE),
              filterAction: MOCK_ACTION.NOTIFICATION_FILTER,
              filterLabel: "Show notifications",
              dismissLabel: "Dismiss",
              loadMore: dataRef(DATA_REF_ID.NOTIFICATION_LOAD_MORE),
              markReadLabel: "Mark all read",
              markReadAction: MOCK_ACTION.MARK_NOTIFICATIONS_READ,
              emptyTitle: "No notifications",
              viewAllTo: "/account/notifications",
              viewAllLabel: "View all"
            }
          }),
          moduleRef(ACCOUNT_MENU_MODULE_ID, {
            props: {
              label: "Account",
              imageSrc: "/hostgrid/avatar.jpg",
              // Legacy's own dropdown: who is signed in, the support PIN
              // behind its brand gate, then the destinations — all data, so
              // a brand offering no PIN renders no PIN row.
              heading: dataRef(DATA_REF_ID.ACCOUNT_MENU_HEADING),
              items: dataRef(DATA_REF_ID.ACCOUNT_MENU_ITEMS)
            }
          })
        ])
      }
    },
    // The app shell's own column: the brand heads it, legacy's six primary
    // destinations run down it, and the sandbox's settings row closes it. The
    // rail collapses to icons at `lg`+ and single-mounts into a Sheet drawer
    // below it, which is why this shape ships no bottom bar.
    [PRIMITIVE_ID.SIDEBAR]: {
      primitive: PRIMITIVE_ID.SIDEBAR,
      variant: "default",
      trigger: SIDEBAR_TRIGGER.SIDEBAR,
      slots: {
        top: moduleRef(BRAND_MODULE_ID, {
          // Host·Grid's own logo — the bare wordmark, no mark chip. A brand
          // that publishes its own site sends the mark there instead of home
          // (`UI_LOGO_URL`, legacy `clientHeader.vue:36-42`).
          props: {
            label: "Host·Grid",
            mark: BRAND_MARK.NONE,
            to: "/",
            href: dataRef(DATA_REF_ID.BRAND_LOGO_HREF)
          }
        }),
        middle: moduleRef(MENU_MODULE_ID, {
          props: {
            // Legacy's six primary tabs, gated by the dataset's own brand
            // config (mock/selectors.ts `pillarNavItems`) — the entries a
            // brand switches off render nowhere, which a static list could
            // never show.
            items: dataRef(DATA_REF_ID.PILLAR_NAV_ITEMS),
            navLabel: "Client portal navigation"
          }
        }),
        // `rail`, not the default `bar`: the rail presentation wears the
        // same `sidebarNavLinkVariants()` as the nav links above it and
        // collapses to an icon with a tooltip, which is what the row beside
        // them has to do.
        bottom: moduleRef(SETTINGS_MODULE_ID, {
          props: { presentation: "rail" }
        })
      }
    },
    // The INNER SIDEBAR: the contextual side menu, in the page's own RIGHT
    // track (operator ruling 2026-08-28) rather than the shell's full-height
    // sidebar, which the primary nav now holds. The framework maps an
    // `inline` utility pane onto the content primitive's aside split
    // (shell/PortalFrame.vue) — declared once here, so every page inherits it.
    [PRIMITIVE_ID.UTILITY]: {
      primitive: PRIMITIVE_ID.UTILITY,
      variant: "inline",
      side: UTILITY_SIDE.RIGHT,
      // A ~240px bare rail was the board's measure; the card's own padding
      // eats ~48px of that, so the carded pane takes the 20rem track to keep
      // the menu at it.
      asideSize: CONTENT_ASIDE_SIZE.MD,
      // The pane presents as a bordered card, matching the content panels
      // beside it (operator request 2026-08-26).
      surface: ROW_SURFACE.PANEL,
      slots: {
        // The board's rail CTA is deliberately absent (operator ruling
        // 2026-08-26): the pane renders under EVERY pillar, and the primary
        // nav already carries legacy's own Place New Order tab.
        top: moduleRef(MENU_MODULE_ID, {
          props: {
            items: dataRef(DATA_REF_ID.PILLAR_SUBMENU_ITEMS),
            navLabel: "Section navigation"
          }
        })
      },
      // A pillar with no side menu (a custom page, the logged-out screens)
      // keeps no pane: gated off, the aside track goes with it.
      slotVisible: { top: dataRef(DATA_REF_ID.HAS_PILLAR_SUBMENU) }
    }
  },
  // The singular fallback — any position with no entry renders a bare titled
  // page, never a blank one (types.ts `PortalConfig.pages`).
  content: {
    measure: CONTENT_MEASURE.WIDE,
    title: "Host·Grid",
    footer: false
  },
  pages: {
    // The dashboard composition (plan §5, Phase C): needs-attention notice,
    // the metric row, the product list, recent activity — all fed by data
    // refs, so the mock actions (pay, complete setup) move this page live.
    [PAGE_KEY.DASHBOARD]: {
      title: "Overview",
      description: "Your products, billing and support at a glance.",
      rows: [
        // The brand's own welcome — its `dashboard_overview` slot (plan R12).
        brandNoteRow(
          DATA_REF_ID.TEMPLATE_DASHBOARD_MARKDOWN,
          DATA_REF_ID.TEMPLATE_HAS_DASHBOARD
        ),
        {
          layout: ROW_LAYOUT.FULL,
          slots: [
            moduleRef(BANNER_MODULE_ID, {
              variant: "notice",
              props: {
                title: "Needs attention",
                message: dataRef(DATA_REF_ID.NEEDS_ATTENTION_MESSAGE),
                // Legacy's notice DID something: it sent the client to the
                // setup waiting on them, or to the invoices that are.
                action: dataRef(DATA_REF_ID.NEEDS_ATTENTION_ACTION),
                label: "Review billing",
                dismissLabel: "Dismiss"
              }
            })
          ]
        },
        // Legacy's `contractProductsNeedsConfirmation` grid: the products
        // that cannot go live until the client answers their blueprint, each
        // naming what it is short of. Two show, as legacy's did, and the rest
        // arrive behind the Show-more control.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          visible: dataRef(DATA_REF_ID.HAS_PRODUCTS_AWAITING_SETUP),
          header: {
            title: "Almost ready",
            description:
              "We just need a few more details in order to complete setup."
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.ROW_CARDS,
              props: {
                items: dataRef(DATA_REF_ID.NEEDS_ATTENTION_PRODUCT_ITEMS),
                maxItems: NEEDS_ATTENTION_SHOWN,
                showMoreLabel: "Show more",
                showLessLabel: "Show fewer",
                emptyTitle: "Nothing waiting on you",
                moreLabel: "Product actions"
              }
            })
          ]
        },
        // One grammar for every group (operator request 2026-08-26): each
        // section IS a bordered panel — heading, description and a View-all
        // action inside it — over a flat divided list, so cards never nest.
        // The old mix (a panel of row-cards beside bare stacks) matched
        // nothing.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Your products",
            description:
              "Active services, grouped by what they run on, with anything awaiting setup flagged.",
            actions: viewAllButton("/products")
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.COMPACT,
              props: {
                items: dataRef(DATA_REF_ID.ACTIVE_PRODUCT_ITEMS),
                // Legacy stacked a client's services under what they run on
                // and let each run be folded away (`cProdsByGroup.vue`).
                grouped: true,
                // A dashboard summary — View all carries the rest.
                maxItems: 4,
                // The onboarding state legacy showed a client who owns
                // nothing yet; its CTA rides the brand's own store gate.
                emptyTitle: "Nothing here yet",
                emptyDescription:
                  "Your products and services will appear here once you place your first order.",
                emptyAction: dataRef(DATA_REF_ID.PLACE_ORDER_ACTION),
                moreLabel: "Product actions"
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Recent invoices",
            description: "The newest first, with totals and status.",
            actions: viewAllButton("/billing/invoices")
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.COMPACT,
              props: {
                items: dataRef(DATA_REF_ID.RECENT_INVOICE_ITEMS),
                maxItems: 4,
                emptyTitle: "No invoices yet",
                moreLabel: "Invoice actions"
              }
            })
          ]
        },
        // A parent account only: a persona with no children has no panel at
        // all, rather than one explaining that it has none.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          visible: dataRef(DATA_REF_ID.HAS_CHILD_ACCOUNTS),
          header: {
            title: "Child accounts",
            description: "The accounts you manage.",
            actions: viewAllButton("/account/child-accounts")
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.COMPACT,
              props: {
                items: dataRef(DATA_REF_ID.DASHBOARD_CHILD_ACCOUNT_ITEMS),
                maxItems: 3,
                emptyTitle: "No child accounts"
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Recent tickets",
            description: "The latest conversations with support.",
            actions: viewAllButton("/support/tickets")
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.COMPACT,
              props: {
                items: dataRef(DATA_REF_ID.RECENT_TICKET_ITEMS),
                maxItems: 4,
                emptyTitle: "No tickets yet"
              }
            })
          ]
        }
      ],
      // The stats column (operator request 2026-08-26): the metric tiles run
      // VERTICALLY on the page-level RIGHT aside — Host·Grid's own dashboard
      // rail — so the main track narrows to a readable two-column layout.
      // The dashboard's area override removes the inline utility, so this
      // explicit aside is the page's only side track and defaults to RIGHT.
      aside: [
        {
          layout: ROW_LAYOUT.FULL,
          slots: [
            moduleRef(METRIC_MODULE_ID, {
              variant: "tile",
              props: {
                items: dataRef(DATA_REF_ID.DASHBOARD_METRIC_ITEMS),
                columns: 1,
                emptyTitle: "No activity yet"
              }
            })
          ]
        }
      ],
      asideSize: CONTENT_ASIDE_SIZE.MD,
      footer: false
    },
    // No entry for the three pillar positions themselves: legacy had no
    // billing/support/account overview, so those routes redirect to their
    // first page (pages/billing/index.vue) and never request content.
    // The brand's own extra pages (gap doc X15): one composition for every
    // slug, since a page is DATA and its body arrives through the ref.
    [PAGE_KEY.CUSTOM_PAGE]: {
      title: "Page",
      rows: [
        {
          layout: ROW_LAYOUT.FULL,
          visible: dataRef(DATA_REF_ID.CUSTOM_PAGE_HAS_BODY),
          slots: [
            moduleRef(PROSE_MODULE_ID, {
              variant: PROSE_MODULE_VARIANT.MARKDOWN,
              props: {
                markdown: dataRef(DATA_REF_ID.CUSTOM_PAGE_MARKDOWN),
                showMoreLabel: "Read more",
                showLessLabel: "Show less",
                emptyTitle: "Nothing here yet"
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          visible: dataRef(DATA_REF_ID.CUSTOM_PAGE_HAS_FRAMES),
          slots: [
            moduleRef(PROSE_MODULE_ID, {
              variant: PROSE_MODULE_VARIANT.FRAMES,
              props: {
                frames: dataRef(DATA_REF_ID.CUSTOM_PAGE_FRAMES),
                emptyTitle: "Nothing to show"
              }
            })
          ]
        }
      ],
      footer: false
    },
    // A path that names nothing: legacy said so and offered the way back,
    // where this shape used to replace-navigate to the dashboard silently.
    [PAGE_KEY.NOT_FOUND]: {
      title: "Page not found",
      description: "That address does not match anything in your account.",
      rows: [
        {
          layout: ROW_LAYOUT.FULL,
          slots: [
            moduleRef(EMPTY_STATE_MODULE_ID, {
              props: {
                title: "Page not found",
                description:
                  "The page you asked for has moved, or never existed."
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          slots: [
            moduleRef(BUTTON_MODULE_ID, {
              variant: BUTTON_MODULE_VARIANT.SINGLE,
              props: {
                label: "Go back",
                value: mockActionValue(MOCK_ACTION.NAVIGATE, "/")
              }
            })
          ]
        }
      ],
      footer: false
    },
    ...billingPages(),
    ...supportPages({ pinRow: true }),
    // No horizontal section rail: this shape's inset LEFT pane already
    // carries the account submenu, and the two duplicated each other.
    ...accountPages({ sectionNav: false }),
    ...productPages(),
    // The logged-out screens (plan F11) — served in their own layout, so the
    // shape's chrome never reaches them.
    ...authPages()
  },
  // Legacy served no side menu on its dashboard — the rail is absent there.
  // PRODUCTS declares an EMPTY override: a brand's own declaration outranks
  // the framework's product-hierarchy override (portal/areas.ts), which
  // retargets a shell SIDEBAR this topbar shape does not have — applied, it
  // injected a stray filter-tab bar and a phantom sidebar column on every
  // nested product page.
  areas: {
    [PORTAL_PILLAR.DASHBOARD]: { [PRIMITIVE_ID.UTILITY]: false },
    [PORTAL_PILLAR.PRODUCTS]: {},
    // The account pillar's pane opens with the client THEMSELVES — legacy's
    // sidebar summary — over the section menu, with the support PIN under it.
    // An area override replaces a primitive wholesale (types.ts
    // `AreaOverride`), so the pane is restated here rather than merged.
    [PORTAL_PILLAR.ACCOUNT]: { [PRIMITIVE_ID.UTILITY]: ACCOUNT_UTILITY_PANE }
  },
  groups: HOSTGRID_GROUPS,
  customAreas: []
};
