// -----------------------------------------------------------------------------
/**
 * @module portal/config/account-pages
 * @description The account pillar's shared page compositions (plan Phase F)
 * — legacy's account menu, gated as vue-app gated it (notes and affiliate
 * behind their brand facts, child accounts behind data), with each page's
 * information from the dataset. Profile, contact data and security are
 * EDITABLE here (plan F1): the inline panels are `form` modules and every
 * "Add" control opens the shell's one dialog. Notes, delegates, notifications
 * and the affiliate programme are editable here too (plan F3): every CTA the
 * no-form phase withheld is back, wired to a form (plan F12).
 *
 * One grammar throughout (operator request 2026-08-26, extending the
 * dashboard pass): every group is a PANEL with a title and description;
 * header actions are quiet (outline, sm).
 */

import { ROW_LAYOUT, ROW_SURFACE } from "../content/types";
import { MOCK_ACTION, mockActionValue } from "../mock/actions";
import { DATA_REF_ID, dataRef } from "../mock/data-refs";
import { FORM_ID } from "../mock/forms/ids";
import { BANNER_VARIANT } from "../modules/banner/types";
import { BUTTON_MODULE_VARIANT } from "../modules/button/types";
import { LIST_MODULE_VARIANT } from "../modules/list/types";
import { MENU_VARIANT } from "../modules/menu/types";
import { METRIC_MODULE_VARIANT } from "../modules/metric/types";
import { PROSE_MODULE_VARIANT } from "../modules/prose/types";
import {
  BANNER_MODULE_ID,
  BUTTON_MODULE_ID,
  FORM_MODULE_ID,
  LIST_MODULE_ID,
  MENU_MODULE_ID,
  METRIC_MODULE_ID,
  PROSE_MODULE_ID,
  SPEC_MODULE_ID,
  moduleRef
} from "../registry";
import { PAGE_KEY } from "../types";
import { NAV_EMPHASIS } from "../variants";
import { brandNoteRow, pagerFooter, panelControls, statusRail } from "./pager";
import type { ContentRowConfig, RowHeaderControls } from "../content/types";
import type { DataRef } from "../mock/data-refs";
import type { FormId } from "../mock/forms/ids";
import type { ContentConfig, PageKey, SlotAssignment } from "../types";
// -----------------------------------------------------------------------------

/** What the enrol screen says — legacy's own opt-in copy, as brand prose. */
const AFFILIATE_PITCH = [
  "Refer accounts to us and earn commission on what they spend.",
  "",
  "You get a referral link to share however you like. Anyone who signs up",
  "through it is counted against your account, and their spend earns you",
  "commission you can withdraw."
].join("\n");

/**
 * Legacy's `clientProfileBasicConfigurationForm`, inline where it always was
 * — the client's own name and interface language, on the REAL
 * `client-personal-details` module's own schema (plan F3).
 */
const PROFILE_FORM_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  surface: ROW_SURFACE.PANEL,
  header: {
    title: "Personal details",
    description: "Your name, and the language we show you the portal in."
  },
  slots: [
    moduleRef(FORM_MODULE_ID, {
      props: {
        schema: dataRef(DATA_REF_ID.PROFILE_FORM_SCHEMA),
        uischema: dataRef(DATA_REF_ID.PROFILE_FORM_UISCHEMA),
        model: dataRef(DATA_REF_ID.PROFILE_FORM_MODEL),
        submit: MOCK_ACTION.PROFILE_SAVE,
        submitLabel: "Save changes",
        resetLabel: "Cancel"
      }
    })
  ]
};

/**
 * Legacy's `clientCustomFieldsComp`, inline under the profile form — the
 * brand's own questions, on the REAL `client-custom-fields` parsers' output
 * (plan F3). Absent definitions, the panel is absent: a form of no fields is
 * a heading over nothing.
 */
const CUSTOM_FIELDS_FORM_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  surface: ROW_SURFACE.PANEL,
  visible: dataRef(DATA_REF_ID.HAS_CUSTOM_FIELDS),
  header: {
    title: "About your account",
    description: "What we asked when you signed up."
  },
  slots: [
    moduleRef(FORM_MODULE_ID, {
      props: {
        schema: dataRef(DATA_REF_ID.CUSTOM_FIELDS_FORM_SCHEMA),
        uischema: dataRef(DATA_REF_ID.CUSTOM_FIELDS_FORM_UISCHEMA),
        model: dataRef(DATA_REF_ID.CUSTOM_FIELDS_FORM_MODEL),
        submit: MOCK_ACTION.CUSTOM_FIELDS_SAVE,
        submitLabel: "Save answers",
        resetLabel: "Cancel"
      }
    })
  ]
};

/** Legacy's `changeUsernameForm`, inline on the security page. */
const USERNAME_FORM_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  surface: ROW_SURFACE.PANEL,
  header: {
    title: "Username",
    description: "The name you sign in with."
  },
  slots: [
    moduleRef(FORM_MODULE_ID, {
      props: {
        schema: dataRef(DATA_REF_ID.USERNAME_FORM_SCHEMA),
        uischema: dataRef(DATA_REF_ID.USERNAME_FORM_UISCHEMA),
        model: dataRef(DATA_REF_ID.USERNAME_FORM_MODEL),
        submit: MOCK_ACTION.USERNAME_CHANGE,
        submitLabel: "Change username",
        resetLabel: "Cancel"
      }
    })
  ]
};

/** Legacy's `changePasswordForm`, inline on the security page. */
const PASSWORD_FORM_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  surface: ROW_SURFACE.PANEL,
  header: {
    title: "Password",
    description: "Choose a new one and type it twice."
  },
  slots: [
    moduleRef(FORM_MODULE_ID, {
      props: {
        schema: dataRef(DATA_REF_ID.PASSWORD_FORM_SCHEMA),
        uischema: dataRef(DATA_REF_ID.PASSWORD_FORM_UISCHEMA),
        model: dataRef(DATA_REF_ID.PASSWORD_FORM_MODEL),
        submit: MOCK_ACTION.PASSWORD_CHANGE,
        submitLabel: "Change password",
        resetLabel: "Cancel"
      }
    })
  ]
};

/** Legacy's account menu as a horizontal rail on every account page — gate-aware through its selector. */
const ACCOUNT_NAV_ROW: ContentRowConfig = {
  layout: ROW_LAYOUT.FULL,
  slots: [
    moduleRef(MENU_MODULE_ID, {
      variant: MENU_VARIANT.HORIZONTAL,
      props: {
        items: dataRef(DATA_REF_ID.ACCOUNT_SECTION_NAV_ITEMS),
        navLabel: "Account sections",
        emphasis: NAV_EMPHASIS.MUTED
      }
    })
  ]
};

function specRow(
  title: string,
  description: string,
  refId: Parameters<typeof dataRef>[0],
  emptyTitle: string,
  heading?: PanelHeading
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    surface: ROW_SURFACE.PANEL,
    header: { title, description, actions: heading?.actions },
    visible: heading?.visible,
    anchor: heading?.anchor,
    slots: [
      moduleRef(SPEC_MODULE_ID, {
        props: {
          items: dataRef(refId),
          emptyTitle,
          copyLabel: "Copy",
          revealLabel: "Reveal"
        }
      })
    ]
  };
}

/**
 * What a panel carries beyond its words: trailing actions, the control band
 * under them, its own fragment id, and whether it belongs on the page at all.
 */
type PanelHeading = {
  readonly actions?: SlotAssignment;
  readonly controls?: RowHeaderControls;
  readonly visible?: DataRef;
  readonly anchor?: string;
};

function listRow(
  title: string,
  description: string,
  refId: Parameters<typeof dataRef>[0],
  emptyTitle: string,
  heading?: PanelHeading
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    surface: ROW_SURFACE.PANEL,
    header: {
      title,
      description,
      actions: heading?.actions,
      controls: heading?.controls
    },
    visible: heading?.visible,
    anchor: heading?.anchor,
    slots: [
      moduleRef(LIST_MODULE_ID, {
        variant: LIST_MODULE_VARIANT.COMPACT,
        props: {
          items: dataRef(refId),
          emptyTitle,
          // Named for the rows that carry them — a list with no secret and no
          // overflow menu never renders a control to label.
          moreLabel: "More",
          revealLabel: "Reveal",
          copyLabel: "Copy"
        }
      })
    ],
    // Paged collections carry their pager; anything unmapped gets none.
    footer: pagerFooter(title, refId)
  };
}

/** The same panel, laid out as a TABLE — a row of columns rather than a line of prose. */
function tableRow(
  title: string,
  description: string,
  refId: Parameters<typeof dataRef>[0],
  headingsRefId: Parameters<typeof dataRef>[0],
  emptyTitle: string,
  heading?: PanelHeading
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    surface: ROW_SURFACE.PANEL,
    header: {
      title,
      description,
      actions: heading?.actions,
      controls: heading?.controls
    },
    visible: heading?.visible,
    anchor: heading?.anchor,
    slots: [
      moduleRef(LIST_MODULE_ID, {
        variant: LIST_MODULE_VARIANT.TABLE,
        props: {
          items: dataRef(refId),
          headings: dataRef(headingsRefId),
          emptyTitle,
          moreLabel: "More",
          copyLabel: "Copy"
        }
      })
    ],
    footer: pagerFooter(title, refId)
  };
}

/** A panel's trailing controls, from whatever the dataset says apply right now. */
function panelActions(refId: Parameters<typeof dataRef>[0]): SlotAssignment {
  return moduleRef(BUTTON_MODULE_ID, {
    variant: BUTTON_MODULE_VARIANT.GROUP,
    props: { label: "Actions", actions: dataRef(refId) }
  });
}

/** One panel control that opens a registered form (plan F2, F12). */
function openFormAction(formId: FormId): string {
  return mockActionValue(MOCK_ACTION.OPEN_FORM, formId);
}

/** A quiet header control that opens one form — the "Add …" every list panel carries. */
function addFormButton(label: string, formId: FormId): SlotAssignment {
  return moduleRef(BUTTON_MODULE_ID, {
    variant: BUTTON_MODULE_VARIANT.SINGLE,
    props: {
      label,
      tone: "outline",
      size: "sm",
      value: openFormAction(formId)
    }
  });
}

export function accountPages(options?: {
  /** The horizontal section rail. A shape whose own sidebar already carries the account submenu turns it off — rendered twice, the two duplicate each other. Absent = on. */
  readonly sectionNav?: boolean;
}): Partial<Record<PageKey, ContentConfig>> {
  const navRows: readonly ContentRowConfig[] =
    options?.sectionNav === false ? [] : [ACCOUNT_NAV_ROW];
  const page = (
    title: string,
    description: string,
    rows: readonly ContentRowConfig[]
  ): ContentConfig => ({
    title,
    description,
    rows: [...navRows, ...rows],
    footer: false
  });

  return {
    [PAGE_KEY.ACCOUNT_PROFILE]: page(
      "Profile",
      "Your contact and company details.",
      [
        PROFILE_FORM_ROW,
        CUSTOM_FIELDS_FORM_ROW,
        // Legacy's three section boxes under the profile form
        // (`clientEmailsComp`, `clientPhonesComp`, `billableEntitiesComp`).
        listRow(
          "Emails",
          "Here you can manage the different emails linked to your account.",
          DATA_REF_ID.PROFILE_EMAIL_ITEMS,
          "No email addresses",
          { actions: addFormButton("Add new", FORM_ID.EMAIL_CREATE) }
        ),
        listRow(
          "Phones",
          "Here you can manage the different phone numbers linked to your account.",
          DATA_REF_ID.PROFILE_PHONE_ITEMS,
          "No phone numbers",
          { actions: addFormButton("Add new", FORM_ID.PHONE_CREATE) }
        ),
        listRow(
          "Address and company details",
          "Here you can manage all address and company records associated with your account. If you have more than one address, you can choose which to use at the time of placing a new order.",
          DATA_REF_ID.BILLABLE_ENTITY_ITEMS,
          "No addresses or companies",
          {
            // Quiet, like the other panels' "Add new" — legacy's one control
            // fans out into an address or a company.
            actions: moduleRef(BUTTON_MODULE_ID, {
              variant: BUTTON_MODULE_VARIANT.GROUP,
              props: {
                label: "Add new",
                tone: "outline",
                actions: dataRef(DATA_REF_ID.BILLABLE_ENTITY_ACTIONS),
                emptyTitle: "No entity controls"
              }
            }),
            controls: panelControls(
              DATA_REF_ID.BILLABLE_ENTITY_ITEMS,
              "entities",
              "Find an address or company"
            )
          }
        )
      ]
    ),
    // Two panels, as legacy drew them: notes read plainly, secrets stay
    // masked until they are asked for (plan R13).
    [PAGE_KEY.ACCOUNT_NOTES]: page(
      "Notes & secrets",
      "Private notes and access codes for your account.",
      [
        listRow(
          "Notes",
          "Visible only to you and the people you delegate.",
          DATA_REF_ID.ACCOUNT_NOTE_ITEMS,
          "No notes yet",
          {
            actions: panelActions(DATA_REF_ID.ACCOUNT_NOTE_ACTIONS)
          }
        ),
        listRow(
          "Secrets",
          "Hidden until you ask for them, and copyable without reading.",
          DATA_REF_ID.ACCOUNT_SECRET_ITEMS,
          "No secrets yet",
          {
            actions: panelActions(DATA_REF_ID.ACCOUNT_SECRET_ACTIONS)
          }
        )
      ]
    ),
    [PAGE_KEY.ACCOUNT_SECURITY]: page(
      "Security",
      "Password and sign-in protection.",
      [
        specRow(
          "Security",
          "Your password age, two-factor status and sign-in history.",
          DATA_REF_ID.SECURITY_SPEC_ITEMS,
          "No security facts",
          {
            actions: panelActions(DATA_REF_ID.SECURITY_TWOFA_ACTIONS)
          }
        ),
        USERNAME_FORM_ROW,
        PASSWORD_FORM_ROW,
        listRow(
          "Restrict access by IP",
          "Only these addresses can sign in to this account. With none listed, any address can.",
          DATA_REF_ID.IP_WHITELIST_ITEMS,
          "Sign-in is not restricted",
          {
            actions: addFormButton(
              "Add IP address",
              FORM_ID.IP_WHITELIST_CREATE
            ),
            // Legacy's own search over the two columns it drew
            // (`ipWhitelistTags.vue:10-17`). The collection declares no sorts
            // and no filters, so the band renders the search alone.
            controls: panelControls(
              DATA_REF_ID.IP_WHITELIST_ITEMS,
              "addresses",
              "Search by address or name"
            )
          }
        )
      ]
    ),
    [PAGE_KEY.ACCOUNT_NOTIFICATIONS]: page(
      "Notifications",
      "Everything we have sent you recently.",
      [
        listRow(
          "Notifications",
          "Billing and product updates land here and in your inbox.",
          DATA_REF_ID.NOTIFICATION_PAGE_ITEMS,
          "No notifications",
          {
            actions: moduleRef(BUTTON_MODULE_ID, {
              variant: BUTTON_MODULE_VARIANT.SINGLE,
              props: {
                label: "Mark all read",
                tone: "outline",
                size: "sm",
                value: MOCK_ACTION.MARK_NOTIFICATIONS_READ
              }
            })
          }
        ),
        // Legacy's `manageNotificationsOptOuts` (plan F4): a group per topic,
        // a control per channel. The topics the brand makes mandatory render
        // readonly — they are its call, not the client's.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Preferences",
            description: "Which updates reach you, and where.",
            // Legacy's per-row select-all/clear-all link. The form engine has
            // no group-action renderer, so the one control per topic rides on
            // the panel that holds the groups (plan §10 O-3). In the controls
            // band, not the header's action corner: three sentence-long
            // buttons there squeeze the title into a column a word wide.
            controls: {
              start: moduleRef(BUTTON_MODULE_ID, {
                variant: BUTTON_MODULE_VARIANT.GROUP,
                props: {
                  label: "Set a whole topic",
                  tone: "outline",
                  size: "sm",
                  actions: dataRef(DATA_REF_ID.NOTIFICATION_TOPIC_ACTIONS),
                  emptyTitle: "Nothing to set"
                }
              })
            }
          },
          slots: [
            moduleRef(FORM_MODULE_ID, {
              props: {
                schema: dataRef(
                  DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_SCHEMA
                ),
                uischema: dataRef(
                  DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_UISCHEMA
                ),
                model: dataRef(DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL),
                submit: MOCK_ACTION.NOTIFICATION_PREFERENCES_SAVE,
                submitLabel: "Save preferences",
                resetLabel: "Cancel"
              }
            })
          ]
        }
      ]
    ),
    // Legacy's `clientDelegateInviteModal` is back on its own header (plan
    // F12); the product Settings area's own control opens the same dialog.
    [PAGE_KEY.ACCOUNT_DELEGATES]: page(
      "Delegates",
      "People you have given access to.",
      [
        listRow(
          "Delegates",
          "Each delegate's permissions are listed on their page.",
          DATA_REF_ID.ACCOUNT_DELEGATE_ITEMS,
          "No delegates",
          {
            actions: addFormButton("Invite delegate", FORM_ID.DELEGATE_INVITE),
            controls: panelControls(
              DATA_REF_ID.ACCOUNT_DELEGATE_ITEMS,
              "delegates",
              "Search delegates"
            )
          }
        )
      ]
    ),
    [PAGE_KEY.ACCOUNT_DELEGATE_DETAIL]: page(
      "Delegate",
      "Who they are and what they can do.",
      [
        specRow(
          "Delegate",
          "Name, email and permissions.",
          DATA_REF_ID.DELEGATE_SPEC_ITEMS,
          "No such delegate",
          {
            actions: panelActions(DATA_REF_ID.DELEGATE_HEADER_ACTIONS)
          }
        ),
        listRow(
          "Access type",
          "A full delegate reaches everything on the account; a specific one reaches only what you name.",
          DATA_REF_ID.DELEGATE_ACCESS_ITEMS,
          "No such delegate"
        ),
        // Both grant panels apply only to a SPECIFIC delegate — a full one
        // reaches every row already, so a switch here could turn nothing off.
        listRow(
          "Delegated products",
          "Which of your products this delegate can manage.",
          DATA_REF_ID.DELEGATE_PRODUCT_ITEMS,
          "No products to delegate",
          {
            visible: dataRef(DATA_REF_ID.DELEGATE_IS_SPECIFIC),
            controls: panelControls(
              DATA_REF_ID.DELEGATE_PRODUCT_ITEMS,
              "products",
              "Search products"
            )
          }
        ),
        listRow(
          "Delegated tickets",
          "Which of your tickets this delegate can read and reply to.",
          DATA_REF_ID.DELEGATE_TICKET_ITEMS,
          "No tickets to delegate",
          {
            visible: dataRef(DATA_REF_ID.DELEGATE_IS_SPECIFIC),
            controls: panelControls(
              DATA_REF_ID.DELEGATE_TICKET_ITEMS,
              "tickets",
              "Search tickets"
            )
          }
        )
      ]
    ),
    // The delegate invitation link's own landing — one banner, whose whole
    // reading (verifying / accepted / spent) is data off the route's hash.
    [PAGE_KEY.DELEGATE_ACCESS_ACCEPT]: page(
      "Delegate invitation",
      "What this link gives you access to.",
      [
        {
          layout: ROW_LAYOUT.FULL,
          slots: [
            moduleRef(BANNER_MODULE_ID, {
              variant: BANNER_VARIANT.NOTICE,
              props: {
                title: dataRef(DATA_REF_ID.DELEGATE_INVITE_TITLE),
                message: dataRef(DATA_REF_ID.DELEGATE_INVITE_MESSAGE),
                tone: dataRef(DATA_REF_ID.DELEGATE_INVITE_TONE),
                action: dataRef(DATA_REF_ID.DELEGATE_INVITE_ACTION),
                label: "Delegate invitation",
                dismissLabel: "Dismiss"
              }
            })
          ]
        }
      ]
    ),
    [PAGE_KEY.ACCOUNT_CHILD_ACCOUNTS]: page(
      "Child accounts",
      "Accounts you manage under this one.",
      [
        listRow(
          "Child accounts",
          "Sign in to any of them from here.",
          DATA_REF_ID.CHILD_ACCOUNT_ITEMS,
          "No child accounts",
          {
            controls: panelControls(
              DATA_REF_ID.CHILD_ACCOUNT_ITEMS,
              "child accounts",
              "Search child accounts"
            )
          }
        ),
        // Only where an appearance is actually lent: a panel describing a
        // brand nobody wears states nothing about this account.
        specRow(
          "Brand appearance",
          "What the accounts inheriting your branding see.",
          DATA_REF_ID.PARENT_BRANDING_ITEMS,
          "No brand appearance",
          {
            visible: dataRef(DATA_REF_ID.HAS_PARENT_BRANDING),
            // Legacy's own form, in the shell's one dialog (plan F2).
            actions: panelActions(DATA_REF_ID.PARENT_BRANDING_ACTIONS)
          }
        ),
        listRow(
          "Logo",
          "The mark those accounts carry.",
          DATA_REF_ID.PARENT_BRANDING_LOGO_ITEMS,
          "No logo",
          { visible: dataRef(DATA_REF_ID.HAS_PARENT_BRANDING) }
        )
      ]
    ),
    [PAGE_KEY.ACCOUNT_CHILD_ACCOUNT_DETAIL]: page(
      "Child account",
      "What this account is, and what it inherits from yours.",
      [
        specRow(
          "Account",
          "Who they are and where you stand with them.",
          DATA_REF_ID.RELATION_SPEC_ITEMS,
          "No such account",
          {
            actions: panelActions(DATA_REF_ID.RELATION_HEADER_ACTIONS)
          }
        ),
        listRow(
          "Relation",
          "What this account inherits from yours, and what you may do with it.",
          DATA_REF_ID.RELATION_TOGGLE_ITEMS,
          "No such account"
        )
      ]
    ),
    // Legacy's own three affiliate forms are back (plan F3, F12): a
    // withdrawal request on the stats panel, the link dialogs on the links
    // table, and the payout destination inline where it was stated.
    [PAGE_KEY.ACCOUNT_AFFILIATE]: page(
      "Affiliate",
      "Referral earnings and payouts.",
      [
        brandNoteRow(
          DATA_REF_ID.TEMPLATE_AFFILIATES_MARKDOWN,
          DATA_REF_ID.TEMPLATE_HAS_AFFILIATES
        ),
        // The three faces of one page. hostgrid ships an ENROLLED, live
        // account; the not-enrolled and suspended branches are driven on
        // clones of that seed, so each gate here has a live exercise.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          visible: dataRef(DATA_REF_ID.AFFILIATE_NEEDS_ENROLLING),
          header: {
            title: "Join the affiliate programme",
            description: "Earn commission on every account you refer to us.",
            actions: panelActions(DATA_REF_ID.AFFILIATE_ENROL_ACTION)
          },
          slots: [
            moduleRef(PROSE_MODULE_ID, {
              variant: PROSE_MODULE_VARIANT.MARKDOWN,
              props: {
                markdown: AFFILIATE_PITCH,
                emptyTitle: "Nothing to read"
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          visible: dataRef(DATA_REF_ID.AFFILIATE_IS_UNAVAILABLE),
          slots: [
            moduleRef(BANNER_MODULE_ID, {
              variant: BANNER_VARIANT.NOTICE,
              props: {
                title: "This brand runs no affiliate programme",
                message:
                  "There is nothing to join here. If you were expecting one, talk to us.",
                tone: "info",
                label: "Affiliate programme availability",
                dismissLabel: "Dismiss"
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          visible: dataRef(DATA_REF_ID.AFFILIATE_IS_DISABLED),
          slots: [
            moduleRef(BANNER_MODULE_ID, {
              variant: BANNER_VARIANT.NOTICE,
              props: {
                title: "Your affiliate account is suspended",
                message:
                  "Your referral links have stopped earning. Open a ticket and we will look into it with you.",
                tone: "warning",
                label: "Affiliate account status",
                dismissLabel: "Dismiss"
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          visible: dataRef(DATA_REF_ID.AFFILIATE_IS_ENROLLED),
          header: {
            title: "Your programme",
            description:
              "What your links have brought in, and what you are owed.",
            actions: panelActions(DATA_REF_ID.AFFILIATE_WITHDRAWAL_ACTIONS)
          },
          slots: [
            moduleRef(METRIC_MODULE_ID, {
              variant: METRIC_MODULE_VARIANT.TILE,
              props: {
                items: dataRef(DATA_REF_ID.AFFILIATE_STAT_ITEMS),
                columns: 3,
                emptyTitle: "No figures yet"
              }
            })
          ]
        },
        tableRow(
          "Referral links",
          "Share any of these; each one counts its own clicks and signups.",
          DATA_REF_ID.AFFILIATE_LINK_ITEMS,
          DATA_REF_ID.AFFILIATE_LINK_HEADINGS,
          "No referral links",
          {
            visible: dataRef(DATA_REF_ID.AFFILIATE_IS_ENROLLED),
            actions: panelActions(DATA_REF_ID.AFFILIATE_LINK_HEADER_ACTIONS),
            // Legacy's own links toolbar (`affiliateLinksTable.vue:10-15`):
            // searched by name and redirect, ordered by how each has done.
            controls: panelControls(
              DATA_REF_ID.AFFILIATE_LINK_ITEMS,
              "referral links",
              "Search links"
            )
          }
        ),
        tableRow(
          "Referrals",
          "The accounts your links brought in.",
          DATA_REF_ID.AFFILIATE_REFERRAL_ITEMS,
          DATA_REF_ID.AFFILIATE_REFERRAL_HEADINGS,
          "No referrals yet",
          {
            visible: dataRef(DATA_REF_ID.AFFILIATE_IS_ENROLLED),
            controls: panelControls(
              DATA_REF_ID.AFFILIATE_REFERRAL_ITEMS,
              "referrals",
              "Search referrals"
            )
          }
        ),
        listRow(
          "Commissions",
          "What each referral earned you.",
          DATA_REF_ID.AFFILIATE_COMMISSION_ITEMS,
          "No commissions yet",
          {
            visible: dataRef(DATA_REF_ID.AFFILIATE_IS_ENROLLED),
            anchor: "commissions",
            // Legacy's commissions toolbar (`commissionsHistoryTable.vue:10-16`).
            controls: panelControls(
              DATA_REF_ID.AFFILIATE_COMMISSION_ITEMS,
              "commissions",
              "Search commissions"
            )
          }
        ),
        tableRow(
          "Payouts",
          "Transfers already made to you.",
          DATA_REF_ID.AFFILIATE_PAYOUT_ITEMS,
          DATA_REF_ID.AFFILIATE_PAYOUT_HEADINGS,
          "No payouts yet",
          {
            visible: dataRef(DATA_REF_ID.AFFILIATE_IS_ENROLLED),
            anchor: "payouts",
            // Legacy's payouts toolbar (`payoutsHistoryTable.vue:10-16`).
            controls: panelControls(
              DATA_REF_ID.AFFILIATE_PAYOUT_ITEMS,
              "payouts",
              "Search payouts"
            )
          }
        ),
        // Legacy's `payoutDestination` (plan F4) — the PayPal address is
        // picked from the client's own emails, and asked for by that
        // destination alone.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          visible: dataRef(DATA_REF_ID.AFFILIATE_IS_ENROLLED),
          header: {
            title: "Payout destination",
            description: "Where your withdrawals are sent."
          },
          slots: [
            moduleRef(FORM_MODULE_ID, {
              props: {
                schema: dataRef(DATA_REF_ID.AFFILIATE_PAYOUT_FORM_SCHEMA),
                uischema: dataRef(DATA_REF_ID.AFFILIATE_PAYOUT_FORM_UISCHEMA),
                model: dataRef(DATA_REF_ID.AFFILIATE_PAYOUT_FORM_MODEL),
                submit: MOCK_ACTION.AFFILIATE_PAYOUT_DESTINATION_SAVE,
                submitLabel: "Save destination",
                resetLabel: "Cancel"
              }
            })
          ]
        }
      ]
    ),
    [PAGE_KEY.ACCOUNT_LOGS]: page("Logs", "A record of emails and sign-ins.", [
      // Legacy's delivery-delay notice over the email history, shown while
      // the brand says mail is running behind.
      // No surface: an alert already carries its own tone and border, so a
      // panel around one draws a second box holding nothing else.
      {
        layout: ROW_LAYOUT.FULL,
        visible: dataRef(DATA_REF_ID.IS_EMAIL_DELIVERY_DELAYED),
        slots: [
          moduleRef(BANNER_MODULE_ID, {
            variant: BANNER_VARIANT.NOTICE,
            props: {
              title: "Email history",
              message:
                "Please note – it can take up to five minutes for email messages to show in this list.",
              tone: "info",
              label: "Delivery notice",
              dismissLabel: "Dismiss"
            }
          })
        ]
      },
      // Legacy's `emailHistoryTable`: All / Sent / Bounced / Failed tabs in
      // the control band, the subject and recipient per row, the outcome
      // as its badge, and the row opening the preview.
      listRow(
        "Email history",
        "Every email we have sent you, and how it went.",
        DATA_REF_ID.SENT_EMAIL_ITEMS,
        "We found no emails matching the applied filters.",
        {
          controls: panelControls(
            DATA_REF_ID.SENT_EMAIL_ITEMS,
            "emails",
            "Search by subject or recipient",
            statusRail(
              DATA_REF_ID.SENT_EMAIL_TABS,
              DATA_REF_ID.SENT_EMAIL_STATUS
            )
          )
        }
      ),
      listRow(
        "Login attempts",
        "Recent sign-ins to your account.",
        DATA_REF_ID.LOGIN_ATTEMPT_ITEMS,
        "No login attempts",
        {
          controls: panelControls(
            DATA_REF_ID.LOGIN_ATTEMPT_ITEMS,
            "login attempts",
            "Search login attempts"
          )
        }
      )
    ]),
    // Legacy's `viewEmailModal`, as a page: the header facts, then the
    // message. Its two header controls were staff's (resend, retry).
    [PAGE_KEY.ACCOUNT_LOG_EMAIL_DETAIL]: page(
      "Email",
      "What we sent, and how it went.",
      [
        specRow(
          "Message",
          "Who it went to, and how it went.",
          DATA_REF_ID.SENT_EMAIL_SPEC_ITEMS,
          "No such email"
        ),
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: { title: "Body", description: "The message as it was sent." },
          slots: [
            moduleRef(PROSE_MODULE_ID, {
              variant: PROSE_MODULE_VARIANT.MARKDOWN,
              props: {
                markdown: dataRef(DATA_REF_ID.SENT_EMAIL_BODY),
                emptyTitle: "Nothing to read"
              }
            })
          ]
        }
      ]
    )
  };
}
