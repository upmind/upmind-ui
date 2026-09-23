// -----------------------------------------------------------------------------
/**
 * @module portal/config/product-pages
 * @description The products pillar's shared page compositions (plan Phase D)
 * — the group listing, the product detail, and the legacy action areas
 * (setup · overview · billing · tickets · settings · delegates, gated as
 * vue-app gated them). Structural positions, so one set serves every group
 * of every brand; a brand spreads these into its `pages` and may override
 * any entry after the spread. Every row feeds from data refs — the route
 * position arrives through `DataRouteContext` (mock/injection.ts).
 *
 * One grammar throughout (operator request 2026-08-26, extending the
 * dashboard pass): every group is a PANEL with a title and description over
 * a flat list; the catalogue's media cards render under a bare SECTION
 * heading instead, so cards never nest inside a panel.
 */

import { ROW_LAYOUT, ROW_SURFACE } from "../content/types";
import { MOCK_ACTION, mockActionValue } from "../mock/actions";
import { INVOICE_STATUS_TAB } from "../mock/collection-defs";
import { DATA_REF_ID, dataRef } from "../mock/data-refs";
import { FORM_ID } from "../mock/forms/ids";
import { BANNER_VARIANT } from "../modules/banner/types";
import { BUTTON_MODULE_VARIANT } from "../modules/button/types";
import { LIST_MODULE_MEDIA, LIST_MODULE_VARIANT } from "../modules/list/types";
import { MENU_VARIANT } from "../modules/menu/types";
import { PROSE_MODULE_VARIANT } from "../modules/prose/types";
import {
  BANNER_MODULE_ID,
  BUTTON_MODULE_ID,
  EMPTY_STATE_MODULE_ID,
  FORM_MODULE_ID,
  LIST_MODULE_ID,
  MENU_MODULE_ID,
  PROSE_MODULE_ID,
  SPEC_MODULE_ID,
  TABS_MODULE_ID,
  TIMELINE_MODULE_ID,
  moduleGroup,
  moduleRef
} from "../registry";
import { GROUP_AXIS, PAGE_KEY } from "../types";
import { NAV_EMPHASIS } from "../variants";
import { CLIENT_VUE_STUB_TITLE, clientVueProse } from "./client-vue";
import { backLink, brandNoteRow, pagerFooter, panelControls } from "./pager";
import { assign } from "lodash-es";
import type { ContentRowConfig, RowHeaderControls } from "../content/types";
import type { DataRef } from "../mock/data-refs";
import type { ListModuleHeading } from "../modules/list/types";
import type { ContentConfig, PageKey, SlotAssignment } from "../types";

// The listing's table columns — what a product IS, when it was bought, how
// often it bills and what it costs. The last heading names the status column.
const PRODUCT_HEADINGS: readonly ListModuleHeading[] = [
  { label: "Product" },
  { label: "Service" },
  { label: "Purchased" },
  { label: "Billing" },
  { label: "Price", numeric: true },
  { label: "Status" }
];

// This product's own ledgers read as the billing pillar's do: the document,
// its dates, its amount and its state.
const PRODUCT_INVOICE_HEADINGS: readonly ListModuleHeading[] = [
  { label: "Invoice" },
  { label: "Issued" },
  { label: "Due" },
  { label: "Total", numeric: true },
  { label: "Status" },
  { label: "" }
];

const PRODUCT_CREDIT_NOTE_HEADINGS: readonly ListModuleHeading[] = [
  { label: "Credit note" },
  { label: "Issued" },
  { label: "Against" },
  { label: "Total", numeric: true },
  { label: "Status" }
];

/** Legacy's product menu, as a horizontal rail on every product page — gated per product by the selector (Setup only while pending). */
const AREA_NAV_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  slots: [
    moduleRef(MENU_MODULE_ID, {
      variant: MENU_VARIANT.HORIZONTAL,
      props: {
        items: dataRef(DATA_REF_ID.PRODUCT_AREA_NAV_ITEMS),
        navLabel: "Product areas",
        emphasis: NAV_EMPHASIS.MUTED
      }
    })
  ]
};

/** How much of a description shows before the reader asks for the rest. */
const ABOUT_LINES = 5;

/** How many provisioning details show before the Show-all control takes over. */
const PROVISION_FIELDS_SHOWN = 4;

/** How many of this product's notes the overview shows before View all takes over. */
const PRODUCT_NOTES_SHOWN = 3;

/** What a product panel varies by beyond its words: a header control, and whether it belongs on the page at all. */
type PanelOptions = {
  readonly actions?: SlotAssignment;
  readonly controls?: RowHeaderControls;
  readonly visible?: DataRef;
  readonly footer?: SlotAssignment;
  /** The fragment a `#anchor` link elsewhere lands on (a ticket's own pair). */
  readonly anchor?: string;
};

/** A panel with a title, a description and one thing inside it — this pillar's one grammar. */
function panelRow(
  title: string,
  description: string,
  slot: SlotAssignment,
  options?: PanelOptions
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    surface: ROW_SURFACE.PANEL,
    header: {
      title,
      description,
      actions: options?.actions,
      controls: options?.controls
    },
    visible: options?.visible,
    footer: options?.footer,
    anchor: options?.anchor,
    slots: [slot]
  };
}

/** How many needs-setup products show before "Show more" — the dashboard's own cap. */
const NEEDS_ATTENTION_SHOWN = 2;

/**
 * The products still waiting on the client's setup — legacy's needs-confirmation
 * billboard, which heads BOTH the dashboard and the products list. One row, so
 * the two pages cannot drift.
 */
export const NEEDS_SETUP_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  surface: ROW_SURFACE.PANEL,
  visible: dataRef(DATA_REF_ID.HAS_PRODUCTS_AWAITING_SETUP),
  header: {
    title: "Almost ready",
    description: "We just need a few more details in order to complete setup."
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
};

/**
 * The product's billboard — what it IS: its image or glyph, the category over
 * the name, the lifecycle badge and whatever else is standing true of it. A
 * one-row card rather than a panel, so it reads as the page's own subject.
 */
const BILLBOARD_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  slots: [
    moduleRef(LIST_MODULE_ID, {
      variant: LIST_MODULE_VARIANT.ROW_CARDS,
      props: {
        items: dataRef(DATA_REF_ID.PRODUCT_BILLBOARD_ITEMS),
        emptyTitle: "No such product",
        moreLabel: "More"
      }
    })
  ]
};

/**
 * Legacy's condition banner — the one thing standing between this product and
 * the client, with the control that answers it. The selector decides whether
 * there is anything to say; the row's own gate keeps it off the page when
 * there is not.
 */
const CONDITION_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  visible: dataRef(DATA_REF_ID.PRODUCT_HAS_CONDITION),
  slots: [
    moduleRef(BANNER_MODULE_ID, {
      variant: BANNER_VARIANT.NOTICE,
      props: {
        title: dataRef(DATA_REF_ID.PRODUCT_CONDITION_TITLE),
        message: dataRef(DATA_REF_ID.PRODUCT_CONDITION_MESSAGE),
        tone: dataRef(DATA_REF_ID.PRODUCT_CONDITION_TONE),
        action: dataRef(DATA_REF_ID.PRODUCT_CONDITION_ACTION),
        label: "Product status",
        dismissLabel: "Dismiss"
      }
    })
  ]
};

/**
 * Legacy's own trial banner (`cProdTrialMsg.vue`), which stood beside the
 * condition notice and carried the early-end control inline.
 */
const TRIAL_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  visible: dataRef(DATA_REF_ID.PRODUCT_HAS_TRIAL_MESSAGE),
  slots: [
    moduleRef(BANNER_MODULE_ID, {
      variant: BANNER_VARIANT.NOTICE,
      props: {
        title: "Free trial",
        message: dataRef(DATA_REF_ID.PRODUCT_TRIAL_MESSAGE),
        tone: "info",
        action: dataRef(DATA_REF_ID.PRODUCT_TRIAL_ACTION),
        label: "Free trial",
        dismissLabel: "Dismiss"
      }
    })
  ]
};

/**
 * The product's facts, on the overview only. The billboard above every product
 * page already states what the product is, so this repeats none of it.
 */
const SUMMARY_ROW: ContentRowConfig = panelRow(
  "Summary",
  "This product's key facts at a glance.",
  moduleRef(SPEC_MODULE_ID, {
    props: {
      items: dataRef(DATA_REF_ID.PRODUCT_SPEC_ITEMS),
      emptyTitle: "No such product",
      copyLabel: "Copy",
      revealLabel: "Reveal"
    }
  })
);

/** Legacy's "About this product" — the brand's own markdown, clamped. */
const ABOUT_ROW: ContentRowConfig = panelRow(
  "About this product",
  "What this product does, in the brand's own words.",
  moduleRef(PROSE_MODULE_ID, {
    variant: PROSE_MODULE_VARIANT.MARKDOWN,
    props: {
      markdown: dataRef(DATA_REF_ID.PRODUCT_ABOUT_MARKDOWN),
      lines: ABOUT_LINES,
      showMoreLabel: "Show more",
      showLessLabel: "Show less",
      emptyTitle: "No description"
    }
  }),
  { visible: dataRef(DATA_REF_ID.PRODUCT_HAS_ABOUT) }
);

/** Legacy's assistance panel — a ticket, with this product already chosen. */
const ASSISTANCE_ROW: ContentRowConfig = panelRow(
  "Need assistance?",
  "Open a ticket about this product and we will pick it up.",
  moduleRef(BUTTON_MODULE_ID, {
    variant: BUTTON_MODULE_VARIANT.SINGLE,
    props: {
      label: "Open a support ticket",
      value: dataRef(DATA_REF_ID.PRODUCT_SUPPORT_ACTION),
      tone: "outline",
      size: "sm"
    }
  }),
  { visible: dataRef(DATA_REF_ID.IS_SUPPORT_ENABLED) }
);

/**
 * The provider surface legacy's overview drew: the details it handed back
 * (copyable, and masked where they are secrets), the functions it exposes,
 * and the panels it embeds.
 */
const PROVISIONING_ROWS: readonly ContentRowConfig[] = [
  panelRow(
    "Provisioning details",
    "What your provider set up for this product.",
    moduleRef(SPEC_MODULE_ID, {
      props: {
        items: dataRef(DATA_REF_ID.PRODUCT_PROVISION_FIELD_ITEMS),
        emptyTitle: "No provisioning details",
        maxItems: PROVISION_FIELDS_SHOWN,
        moreLabel: "Show all details",
        lessLabel: "Show fewer",
        copyLabel: "Copy",
        revealLabel: "Reveal"
      }
    }),
    { visible: dataRef(DATA_REF_ID.PRODUCT_HAS_PROVISION_FIELDS) }
  ),
  panelRow(
    "Provisioning actions",
    "Run these against your product with your provider.",
    moduleRef(BUTTON_MODULE_ID, {
      variant: BUTTON_MODULE_VARIANT.GROUP,
      props: {
        label: "Provisioning actions",
        actions: dataRef(DATA_REF_ID.PRODUCT_PROVISION_ACTIONS)
      }
    }),
    { visible: dataRef(DATA_REF_ID.PRODUCT_HAS_PROVISION_ACTIONS) }
  ),
  panelRow(
    "From your provider",
    "Panels your provider publishes for this product.",
    moduleRef(PROSE_MODULE_ID, {
      variant: PROSE_MODULE_VARIANT.FRAMES,
      props: {
        frames: dataRef(DATA_REF_ID.PRODUCT_PROVISION_FRAMES),
        emptyTitle: "No provider panels"
      }
    }),
    { visible: dataRef(DATA_REF_ID.PRODUCT_HAS_PROVISION_FRAMES) }
  )
];

/** This product's own notes and secrets — two panels, behind the brand's gate. */
const VAULT_ROWS: readonly ContentRowConfig[] = [
  panelRow(
    "Notes",
    "Private notes about this product.",
    moduleRef(LIST_MODULE_ID, {
      variant: LIST_MODULE_VARIANT.COMPACT,
      props: {
        items: dataRef(DATA_REF_ID.PRODUCT_NOTE_ITEMS),
        maxItems: PRODUCT_NOTES_SHOWN,
        emptyTitle: "No notes yet",
        moreLabel: "More"
      }
    }),
    {
      anchor: "notes",
      visible: dataRef(DATA_REF_ID.ARE_NOTES_ENABLED),
      // Adding one here attaches it to THIS product (plan F3); the rest of
      // them live on the account's own page, which is legacy's own
      // destination from here.
      actions: moduleGroup(GROUP_AXIS.HORIZONTAL, [
        moduleRef(BUTTON_MODULE_ID, {
          variant: BUTTON_MODULE_VARIANT.GROUP,
          props: {
            label: "Notes",
            actions: dataRef(DATA_REF_ID.PRODUCT_NOTE_ACTIONS)
          }
        }),
        moduleRef(BUTTON_MODULE_ID, {
          variant: BUTTON_MODULE_VARIANT.SINGLE,
          props: {
            label: "View all",
            value: mockActionValue(MOCK_ACTION.NAVIGATE, "/account/notes"),
            tone: "outline",
            size: "sm"
          }
        })
      ])
    }
  ),
  panelRow(
    "Secrets",
    "Access codes for this product, hidden until you ask.",
    moduleRef(LIST_MODULE_ID, {
      variant: LIST_MODULE_VARIANT.COMPACT,
      props: {
        items: dataRef(DATA_REF_ID.PRODUCT_SECRET_ITEMS),
        emptyTitle: "No secrets yet",
        moreLabel: "More",
        revealLabel: "Reveal",
        copyLabel: "Copy"
      }
    }),
    {
      anchor: "secrets",
      visible: dataRef(DATA_REF_ID.ARE_NOTES_ENABLED),
      actions: moduleRef(BUTTON_MODULE_ID, {
        variant: BUTTON_MODULE_VARIANT.GROUP,
        props: {
          label: "Secrets",
          actions: dataRef(DATA_REF_ID.PRODUCT_SECRET_ACTIONS)
        }
      })
    }
  )
];

/** How many change targets show before the picker asks the client to expand it. */
const MIGRATION_OPTIONS_SHOWN = 5;

/**
 * The lifecycle notices the BILLING area owns. The two a client can still act
 * on — a lodged cancellation and a scheduled expiry — ride the product's own
 * condition banner in the chrome above, so they are not repeated here; these
 * are the two that belong to billing alone.
 */
const BILLING_NOTICE_ROWS: readonly ContentRowConfig[] = [
  {
    layout: ROW_LAYOUT.FULL,
    visible: dataRef(DATA_REF_ID.PRODUCT_HAS_ACCEPTED_CANCELLATION),
    slots: [
      moduleRef(BANNER_MODULE_ID, {
        variant: BANNER_VARIANT.NOTICE,
        props: {
          title: "Cancellation accepted",
          message: dataRef(DATA_REF_ID.PRODUCT_ACCEPTED_CANCELLATION_MESSAGE),
          tone: "warning",
          label: "Cancellation",
          dismissLabel: "Dismiss"
        }
      })
    ]
  },
  {
    layout: ROW_LAYOUT.FULL,
    visible: dataRef(DATA_REF_ID.PRODUCT_HAS_PENDING_PRO_RATA),
    slots: [
      moduleRef(BANNER_MODULE_ID, {
        variant: BANNER_VARIANT.NOTICE,
        props: {
          title: "A change is still being applied",
          message:
            "The pro-rata adjustment for your recent change is still landing, so this product cannot be changed again just yet.",
          tone: "warning",
          label: "Pending change",
          dismissLabel: "Dismiss"
        }
      })
    ]
  }
];

/** Legacy's manage-subscription band, and the picker the change control points at. */
const SUBSCRIPTION_ROWS: readonly ContentRowConfig[] = [
  panelRow(
    "Manage your subscription",
    "End the trial early, or move onto a different product.",
    moduleRef(BUTTON_MODULE_ID, {
      variant: BUTTON_MODULE_VARIANT.GROUP,
      props: {
        label: "Manage your subscription",
        actions: dataRef(DATA_REF_ID.PRODUCT_MANAGE_ACTIONS),
        emptyTitle: "Nothing to manage",
        emptyDescription:
          "This product has no changes you can make from here yet."
      }
    }),
    { visible: dataRef(DATA_REF_ID.PRODUCT_IS_SUBSCRIPTION) }
  ),
  panelRow(
    "Change product",
    "What this product can move onto, and what each one costs.",
    moduleRef(LIST_MODULE_ID, {
      variant: LIST_MODULE_VARIANT.COMPACT,
      props: {
        items: dataRef(DATA_REF_ID.PRODUCT_MIGRATION_ITEMS),
        maxItems: MIGRATION_OPTIONS_SHOWN,
        emptyTitle: "Nothing to change to",
        moreLabel: "More"
      }
    }),
    { visible: dataRef(DATA_REF_ID.PRODUCT_HAS_MIGRATION_OPTIONS) }
  )
];

/** Legacy's cProdTimeline — the billing automation standing against this product. */
const TIMELINE_ROW: ContentRowConfig = panelRow(
  "What is scheduled",
  "Changes the brand has queued against this product.",
  moduleRef(TIMELINE_MODULE_ID, {
    props: {
      items: dataRef(DATA_REF_ID.PRODUCT_TIMELINE_ITEMS),
      emptyTitle: "Nothing scheduled"
    }
  }),
  { visible: dataRef(DATA_REF_ID.PRODUCT_HAS_TIMELINE) }
);

/** Legacy's own settings area — the label, the card, the renewal and the address, then who else may reach it. */
const SETTINGS_ROWS: readonly ContentRowConfig[] = [
  panelRow(
    "Label",
    "What you call this product in your own lists. Clear it to go back to its own name.",
    moduleRef(FORM_MODULE_ID, {
      props: {
        schema: dataRef(DATA_REF_ID.PRODUCT_LABEL_FORM_SCHEMA),
        uischema: dataRef(DATA_REF_ID.PRODUCT_LABEL_FORM_UISCHEMA),
        model: dataRef(DATA_REF_ID.PRODUCT_LABEL_FORM_MODEL),
        submit: dataRef(DATA_REF_ID.PRODUCT_LABEL_FORM_SUBMIT),
        submitLabel: "Save label",
        resetLabel: "Cancel"
      }
    })
  ),
  panelRow(
    "Payment method",
    "Which of your cards this product renews on.",
    moduleRef(EMPTY_STATE_MODULE_ID, {
      props: {
        title: CLIENT_VUE_STUB_TITLE,
        description: clientVueProse("StoredPaymentMethods", "payment-details")
      }
    })
  ),
  panelRow(
    "Auto-renew",
    "Whether this product renews itself when its term is up.",
    moduleRef(LIST_MODULE_ID, {
      variant: LIST_MODULE_VARIANT.COMPACT,
      props: {
        items: dataRef(DATA_REF_ID.PRODUCT_AUTO_RENEW_ITEMS),
        emptyTitle: "No renewal controls"
      }
    }),
    { visible: dataRef(DATA_REF_ID.PRODUCT_HAS_AUTO_RENEW_CONTROLS) }
  ),
  {
    layout: ROW_LAYOUT.FULL,
    visible: dataRef(DATA_REF_ID.PRODUCT_HAS_AUTO_RENEW_NOTICE),
    slots: [
      moduleRef(BANNER_MODULE_ID, {
        variant: BANNER_VARIANT.NOTICE,
        props: {
          title: "Automatic renewal",
          message: dataRef(DATA_REF_ID.PRODUCT_AUTO_RENEW_NOTICE),
          tone: "info",
          label: "Automatic renewal",
          dismissLabel: "Dismiss"
        }
      })
    ]
  },
  {
    layout: ROW_LAYOUT.FULL,
    visible: dataRef(DATA_REF_ID.PRODUCT_HAS_UNPAID_INVOICES),
    slots: [
      moduleRef(BANNER_MODULE_ID, {
        variant: BANNER_VARIANT.NOTICE,
        props: {
          title: "An invoice is still owed",
          message:
            "This product renews automatically, and something raised against it has not been settled yet.",
          // Louder where the product is suspended or the invoice has already
          // fallen due — a debt in hand is not a debt in prospect.
          tone: dataRef(DATA_REF_ID.PRODUCT_UNPAID_INVOICE_TONE),
          label: "Unpaid invoices",
          dismissLabel: "Dismiss",
          action: {
            value: mockActionValue(
              MOCK_ACTION.NAVIGATE,
              `/billing/invoices?status=${INVOICE_STATUS_TAB.UNPAID}`
            ),
            label: "View unpaid invoices"
          }
        }
      })
    ]
  },
  panelRow(
    "Billing details",
    "Where this product's invoices are addressed, and who they are raised to.",
    moduleGroup(GROUP_AXIS.VERTICAL, [
      moduleRef(SPEC_MODULE_ID, {
        props: {
          items: dataRef(DATA_REF_ID.PRODUCT_BILLING_ADDRESS_SPEC_ITEMS),
          emptyTitle: "No billing address"
        }
      }),
      moduleRef(LIST_MODULE_ID, {
        variant: LIST_MODULE_VARIANT.COMPACT,
        props: {
          items: dataRef(DATA_REF_ID.PRODUCT_ADDRESS_ITEMS),
          emptyTitle: "No addresses yet"
        }
      }),
      // Legacy offered the account's COMPANIES in the same panel: a product is
      // invoiced to an address as a party, and both are the client's to pick.
      moduleRef(LIST_MODULE_ID, {
        variant: LIST_MODULE_VARIANT.COMPACT,
        props: {
          items: dataRef(DATA_REF_ID.PRODUCT_COMPANY_ITEMS),
          emptyTitle: "No companies yet"
        }
      })
    ])
  ),
  panelRow(
    "Delegate access",
    "Who else may manage this product on your behalf.",
    moduleRef(LIST_MODULE_ID, {
      variant: LIST_MODULE_VARIANT.COMPACT,
      props: {
        items: dataRef(DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS),
        emptyTitle: "No delegates yet"
      }
    }),
    {
      controls: panelControls(
        DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS,
        "delegates",
        "Search by name or email"
      ),
      footer: pagerFooter(
        "Delegates",
        DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS
      ),
      // Legacy's own control, wired to the invitation itself now the form
      // can answer it (plan F12) — it used to point at the delegates page.
      actions: moduleRef(BUTTON_MODULE_ID, {
        variant: BUTTON_MODULE_VARIANT.SINGLE,
        props: {
          label: "Invite new delegate",
          value: mockActionValue(
            MOCK_ACTION.OPEN_FORM,
            FORM_ID.DELEGATE_INVITE
          ),
          tone: "outline",
          size: "sm"
        }
      })
    }
  )
];

/** Legacy's post-order screen, as a band on the listing the order was placed from. */
const ORDER_COMPLETE_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  visible: dataRef(DATA_REF_ID.HAS_ORDER_COMPLETE),
  slots: [
    moduleRef(BANNER_MODULE_ID, {
      variant: BANNER_VARIANT.BANNER,
      props: {
        message: dataRef(DATA_REF_ID.ORDER_COMPLETE_MESSAGE),
        tone: "success",
        label: "Order complete",
        dismissLabel: "Dismiss",
        dismissible: true,
        dismissValue: dataRef(DATA_REF_ID.ORDER_COMPLETE_DISMISS),
        action: dataRef(DATA_REF_ID.ORDER_COMPLETE_ACTION)
      }
    })
  ]
};

/**
 * The chrome every product page wears, in legacy's own order: what the
 * product is, what it needs from the client, and where else to go on it. The
 * summary is NOT here: every area repeated it under its own rows. Nor are the
 * promoted functions — legacy's quick-actions panel — which ride the
 * billboard itself.
 */
const PRODUCT_CHROME_ROWS: readonly ContentRowConfig[] = [
  BILLBOARD_ROW,
  CONDITION_ROW,
  TRIAL_ROW,
  AREA_NAV_ROW
];

/** Legacy's overview area — the provider surface and this product's own notes. The detail page IS the overview, as legacy's detail redirect made it. */
const OVERVIEW_ROWS: readonly ContentRowConfig[] = [
  SUMMARY_ROW,
  // The brand's own note on every product page — its `contract_product_overview` slot.
  brandNoteRow(
    DATA_REF_ID.TEMPLATE_PRODUCT_MARKDOWN,
    DATA_REF_ID.TEMPLATE_HAS_PRODUCT
  ),
  ABOUT_ROW,
  ...PROVISIONING_ROWS,
  ...VAULT_ROWS,
  ASSISTANCE_ROW
];

export function productPages(): Partial<Record<PageKey, ContentConfig>> {
  const page = (
    title: string,
    description: string,
    rows: readonly ContentRowConfig[]
  ): ContentConfig => ({ title, description, rows, footer: false });

  /**
   * A page ABOUT one product: every one of them leads with the same chrome —
   * the billboard, whatever the product needs answering and the area nav —
   * and then its own rows. The listing and the buy flow are not about a
   * product, so they keep the plain page above.
   */
  const productPage = (
    title: string,
    description: string,
    rows: readonly ContentRowConfig[]
  ): ContentConfig =>
    assign(page(title, description, [...PRODUCT_CHROME_ROWS, ...rows]), {
      // A product page serves no pillar rail (`config/areas/detail.ts`), so
      // this link above the title is the whole way back to the group.
      breadcrumb: backLink(
        "All products and services",
        dataRef(DATA_REF_ID.PRODUCT_BACK_TO)
      )
    });

  return {
    // Legacy's All / Active / Cancelled listing routes, as a tab rail over ONE
    // results list with the status in the route's query (plan §1.2). The rail
    // switches the list below it; it renders no panel of its own.
    [PAGE_KEY.GROUP_LISTING]: page(
      "Products",
      "Everything in this group, running and past.",
      [
        ORDER_COMPLETE_ROW,
        NEEDS_SETUP_ROW,
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          // The status rail rides the panel's own header, beside the title it
          // filters — the row's `actions` position, where every other panel
          // puts its controls. In the body it read as a floating stray, and a
          // vertical group shrink-wraps its members (`portalGroupClass`), so
          // the list lost its full width too.
          header: {
            title: "Products",
            description: "Manage each from its own page.",
            controls: panelControls(
              DATA_REF_ID.GROUP_PRODUCT_ITEMS,
              "products",
              "Search by name",
              moduleRef(TABS_MODULE_ID, {
                variant: "segmented",
                props: {
                  tabs: dataRef(DATA_REF_ID.GROUP_PRODUCT_TABS),
                  selected: dataRef(DATA_REF_ID.GROUP_PRODUCT_STATUS),
                  emptyTitle: "No product filters"
                }
              })
            )
          },
          slots: [
            // No `variant` on the ref: the listing's layout is the client's
            // own pick (legacy's `cProdsViewSwitcher`), so it arrives as a
            // data ref like every other live value, and the band's switch
            // changes it. The grid and the table props both ride along —
            // the module reads whichever its variant needs.
            moduleRef(LIST_MODULE_ID, {
              props: {
                variant: dataRef(DATA_REF_ID.GROUP_PRODUCT_VIEW),
                items: dataRef(DATA_REF_ID.GROUP_PRODUCT_ITEMS),
                columns: 3,
                media: LIST_MODULE_MEDIA.BANNER,
                headings: PRODUCT_HEADINGS,
                emptyTitle: "No products in this view",
                emptyAction: dataRef(DATA_REF_ID.PLACE_ORDER_ACTION)
              }
            })
          ],
          footer: pagerFooter("Products", DATA_REF_ID.GROUP_PRODUCT_ITEMS)
        }
      ]
    ),
    [PAGE_KEY.PRODUCT_DETAIL]: productPage(
      "Product",
      "Status, billing and everything about this product.",
      OVERVIEW_ROWS
    ),
    // Legacy's place-new-order, contextual to the group (§D9): the brand's
    // catalogue for this bucket; Order creates the order, its unpaid invoice
    // and the pending product, then lands on the order (mock/actions.ts).
    // The catalogue's media cards stay OUTSIDE a panel, so cards never nest —
    // and the row carries NO header of its own: the page header sits directly
    // above it saying the same thing, and two stacked headings read as a bug.
    [PAGE_KEY.GROUP_ORDER]: page(
      "Order",
      "Choose a product — you can pay right after.",
      [
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.SECTION,
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.CARDS,
              props: {
                items: dataRef(DATA_REF_ID.GROUP_CATALOGUE_ITEMS),
                columns: 3,
                emptyTitle: "Nothing to order in this group"
              }
            })
          ],
          footer: pagerFooter(
            "Place new order",
            DATA_REF_ID.GROUP_CATALOGUE_ITEMS
          )
        }
      ]
    ),
    "product-area/overview": productPage(
      "Overview",
      "Status, billing and everything about this product.",
      OVERVIEW_ROWS
    ),
    // Legacy's `cProdProvConfigManageForm` (plan F4): the provider's own
    // blueprint, answered and confirmed in one step. A provider that asks
    // nothing still renders the form — its Confirm control IS the setup step.
    "product-area/setup": productPage(
      "Setup",
      "A few details stand between this product and going live.",
      [
        panelRow(
          "Setup required",
          "Your new product is almost ready. We need to confirm a few details before you can get going. Enter the required information and click Confirm to complete setup.",
          moduleRef(FORM_MODULE_ID, {
            props: {
              schema: dataRef(DATA_REF_ID.PRODUCT_SETUP_FORM_SCHEMA),
              uischema: dataRef(DATA_REF_ID.PRODUCT_SETUP_FORM_UISCHEMA),
              model: dataRef(DATA_REF_ID.PRODUCT_SETUP_FORM_MODEL),
              submit: dataRef(DATA_REF_ID.PRODUCT_SETUP_FORM_SUBMIT),
              submitLabel: "Confirm",
              resetLabel: "Revert changes"
            }
          })
        )
      ]
    ),
    "product-area/billing": productPage(
      "Billing",
      "What this product costs and when it renews.",
      [
        ...BILLING_NOTICE_ROWS,
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Billing",
            description: "Price, billing cycle and the next renewal."
          },
          slots: [
            moduleRef(SPEC_MODULE_ID, {
              props: {
                items: dataRef(DATA_REF_ID.PRODUCT_BILLING_SPEC_ITEMS),
                emptyTitle: "No billing details"
              }
            })
          ]
        },
        panelRow(
          "What you are charged for",
          "The base product and every option on it, line by line.",
          moduleRef(SPEC_MODULE_ID, {
            props: {
              items: dataRef(DATA_REF_ID.PRODUCT_LINE_ITEM_SPEC_ITEMS),
              emptyTitle: "No breakdown for this product"
            }
          })
        ),
        // Legacy's `cProdInvoiceConsolidationComp` (plan F4) — present only
        // where the brand consolidates and leaves the choice to the client.
        panelRow(
          "Invoice consolidation",
          "Whether this product is billed on its own or joins your one invoice.",
          moduleRef(FORM_MODULE_ID, {
            props: {
              schema: dataRef(DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_SCHEMA),
              uischema: dataRef(
                DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_UISCHEMA
              ),
              model: dataRef(DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_MODEL),
              submit: dataRef(DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_SUBMIT),
              submitLabel: "Save preference",
              resetLabel: "Cancel"
            }
          }),
          { visible: dataRef(DATA_REF_ID.PRODUCT_HAS_CONSOLIDATION_FORM) }
        ),
        ...SUBSCRIPTION_ROWS,
        TIMELINE_ROW,
        // This product's own documents — the same ledgers billing keeps,
        // narrowed by the discriminator the seeds carry (plan R6).
        panelRow(
          "Invoices",
          "Every invoice raised for this product.",
          moduleRef(LIST_MODULE_ID, {
            variant: LIST_MODULE_VARIANT.TABLE,
            props: {
              items: dataRef(DATA_REF_ID.PRODUCT_INVOICE_ITEMS),
              headings: PRODUCT_INVOICE_HEADINGS,
              emptyTitle: "No invoices for this product"
            }
          }),
          {
            controls: panelControls(
              DATA_REF_ID.PRODUCT_INVOICE_ITEMS,
              "invoices",
              "Search by number"
            ),
            footer: pagerFooter("Invoices", DATA_REF_ID.PRODUCT_INVOICE_ITEMS)
          }
        ),
        panelRow(
          "Credit notes",
          "Anything credited back against this product.",
          moduleRef(LIST_MODULE_ID, {
            variant: LIST_MODULE_VARIANT.TABLE,
            props: {
              items: dataRef(DATA_REF_ID.PRODUCT_CREDIT_NOTE_ITEMS),
              headings: PRODUCT_CREDIT_NOTE_HEADINGS,
              emptyTitle: "No credit notes for this product"
            }
          }),
          {
            controls: panelControls(
              DATA_REF_ID.PRODUCT_CREDIT_NOTE_ITEMS,
              "credit notes",
              "Search by number"
            ),
            footer: pagerFooter(
              "Credit notes",
              DATA_REF_ID.PRODUCT_CREDIT_NOTE_ITEMS
            )
          }
        )
      ]
    ),
    "product-area/tickets": productPage(
      "Tickets",
      "Support conversations about this product.",
      [
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Tickets",
            description: "Conversations linked to this product.",
            // Legacy mounted the whole tickets listing on this tab
            // (`cProdTicketsComp.vue:12`), toolbar and all.
            controls: panelControls(
              DATA_REF_ID.PRODUCT_TICKET_ITEMS,
              "tickets",
              "Search by reference or subject"
            )
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.COMPACT,
              props: {
                items: dataRef(DATA_REF_ID.PRODUCT_TICKET_ITEMS),
                emptyTitle: "No tickets for this product"
              }
            })
          ],
          footer: pagerFooter("Tickets", DATA_REF_ID.PRODUCT_TICKET_ITEMS)
        }
      ]
    ),
    // An area segment outside the legacy set — the nav stays, the body says so.
    [PAGE_KEY.PRODUCT_AREA]: productPage(
      "Product area",
      "This product has no area by that name.",
      [
        {
          layout: ROW_LAYOUT.FULL,
          slots: [
            moduleRef(EMPTY_STATE_MODULE_ID, {
              props: {
                title: "No such area",
                description: "This product has no area by that name."
              }
            })
          ]
        }
      ]
    ),
    "product-area/settings": productPage(
      "Settings",
      "Preferences for this product.",
      SETTINGS_ROWS
    ),
    "product-area/delegates": productPage(
      "Delegates",
      "Who else can manage this product.",
      [
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Delegates",
            description: "People with access to this product.",
            controls: panelControls(
              DATA_REF_ID.PRODUCT_DELEGATE_ITEMS,
              "delegates",
              "Search by name or email"
            )
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.COMPACT,
              props: {
                items: dataRef(DATA_REF_ID.PRODUCT_DELEGATE_ITEMS),
                emptyTitle: "No delegates"
              }
            })
          ],
          footer: pagerFooter("Delegates", DATA_REF_ID.PRODUCT_DELEGATE_ITEMS)
        }
      ]
    )
  };
}
