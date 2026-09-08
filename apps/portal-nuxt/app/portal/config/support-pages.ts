// -----------------------------------------------------------------------------
/**
 * @module portal/config/support-pages
 * @description The support pillar's shared page compositions (plan Phase G)
 * — legacy's tickets (Active/Closed), the ticket thread with a working reply
 * composer, the gated support-PIN row a brand opts into, and the new-ticket
 * form (plan F4: subject, department where the brand publishes more than one,
 * related product, body and named attachments).
 *
 * One grammar throughout (operator request 2026-08-26, extending the
 * dashboard pass): every group is a PANEL with a title and description.
 */

import { ROW_LAYOUT, ROW_SURFACE } from "../content/types";
import { MOCK_ACTION, mockActionValue } from "../mock/actions";
import { DATA_REF_ID, dataRef } from "../mock/data-refs";
import { FORM_ID } from "../mock/forms/ids";
import { BUTTON_MODULE_VARIANT } from "../modules/button/types";
import { LIST_MODULE_VARIANT } from "../modules/list/types";
import {
  BANNER_MODULE_ID,
  BUTTON_MODULE_ID,
  COMPOSER_MODULE_ID,
  FORM_MODULE_ID,
  LIST_MODULE_ID,
  SPEC_MODULE_ID,
  moduleRef
} from "../registry";
import { PAGE_KEY } from "../types";
import { brandNoteRow, pagerFooter, panelControls, statusRail } from "./pager";
import type { ContentRowConfig, RowHeaderControls } from "../content/types";
import type { ContentConfig, PageKey, SlotAssignment } from "../types";

/** Legacy's one header action on this panel — the way in to a new conversation. */
const NEW_TICKET_ACTION = moduleRef(BUTTON_MODULE_ID, {
  variant: BUTTON_MODULE_VARIANT.SINGLE,
  props: {
    label: "Open new ticket",
    tone: "outline",
    size: "sm",
    value: mockActionValue(MOCK_ACTION.NAVIGATE, "/support/tickets/new")
  }
});

function ticketList(
  title: string,
  description: string,
  refId: Parameters<typeof dataRef>[0],
  emptyTitle: string,
  controls?: RowHeaderControls,
  actions?: SlotAssignment
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    surface: ROW_SURFACE.PANEL,
    header: { title, description, actions, controls },
    slots: [
      moduleRef(LIST_MODULE_ID, {
        variant: LIST_MODULE_VARIANT.COMPACT,
        props: { items: dataRef(refId), emptyTitle }
      })
    ],
    // Paged collections carry their pager; anything unmapped gets none.
    footer: pagerFooter(title, refId)
  };
}

export function supportPages(options?: {
  /** SUPPORT_PIN_ENABLED — the brand opts the PIN row in; the value comes from its dataset. */
  readonly pinRow?: boolean;
}): Partial<Record<PageKey, ContentConfig>> {
  const page = (
    title: string,
    description: string,
    rows: readonly ContentRowConfig[]
  ): ContentConfig => ({ title, description, rows, footer: false });

  const pinRows: readonly ContentRowConfig[] = options?.pinRow
    ? [
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.MUTED,
          slots: [
            moduleRef(SPEC_MODULE_ID, {
              variant: "micro",
              props: {
                items: dataRef(DATA_REF_ID.SUPPORT_PIN_SPEC_ITEMS),
                emptyTitle: "No support PIN"
              }
            })
          ]
        }
      ]
    : [];

  return {
    [PAGE_KEY.SUPPORT_TICKETS]: page(
      "Tickets",
      "Get help and track your conversations with our team.",
      [
        brandNoteRow(
          DATA_REF_ID.TEMPLATE_SUPPORT_MARKDOWN,
          DATA_REF_ID.TEMPLATE_HAS_SUPPORT
        ),
        ...pinRows,
        // Legacy's Active / Closed tabs, as a rail in the panel's control band.
        ticketList(
          "Tickets",
          "We reply here and by email.",
          DATA_REF_ID.TICKET_ITEMS,
          "No tickets in this view",
          panelControls(
            DATA_REF_ID.TICKET_ITEMS,
            "tickets",
            "Search by reference or subject",
            statusRail(DATA_REF_ID.TICKET_TABS, DATA_REF_ID.TICKET_STATUS)
          ),
          NEW_TICKET_ACTION
        )
      ]
    ),
    [PAGE_KEY.SUPPORT_TICKET_DETAIL]: page(
      "Ticket",
      "The conversation and its status.",
      [
        // Legacy's status band: where the thread stands, and since when.
        {
          layout: ROW_LAYOUT.FULL,
          visible: dataRef(DATA_REF_ID.TICKET_HAS_STATUS_BANNER),
          slots: [
            moduleRef(BANNER_MODULE_ID, {
              variant: "notice",
              props: {
                title: dataRef(DATA_REF_ID.TICKET_STATUS_TITLE),
                message: dataRef(DATA_REF_ID.TICKET_STATUS_MESSAGE),
                tone: dataRef(DATA_REF_ID.TICKET_STATUS_TONE),
                label: "Ticket status",
                dismissLabel: "Dismiss"
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Summary",
            description: "Subject, department and status.",
            // Legacy's Manage-ticket control: a menu where more than one
            // action applies, the action itself where only one does
            // (mock/selectors.ts `ticketManageVariant`).
            actions: moduleRef(BUTTON_MODULE_ID, {
              props: {
                variant: dataRef(DATA_REF_ID.TICKET_MANAGE_VARIANT),
                label: "Manage ticket",
                tone: "outline",
                size: "sm",
                actions: dataRef(DATA_REF_ID.TICKET_MANAGE_ACTIONS)
              }
            })
          },
          slots: [
            moduleRef(SPEC_MODULE_ID, {
              props: {
                items: dataRef(DATA_REF_ID.TICKET_SPEC_ITEMS),
                emptyTitle: "No such ticket",
                copyLabel: "Copy",
                revealLabel: "Reveal"
              }
            })
          ]
        },
        // Legacy's `relatedProductComp` pair — the notes and secrets kept
        // about the product this thread is about, where the brand keeps them.
        // The product itself is already stated on the summary above, so this
        // row carries only the two ways into it.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          visible: dataRef(DATA_REF_ID.TICKET_HAS_RELATED_PRODUCT_LINKS),
          header: {
            title: "Related product",
            description: "What you keep about the product this ticket is about."
          },
          slots: [
            moduleRef(BUTTON_MODULE_ID, {
              variant: BUTTON_MODULE_VARIANT.GROUP,
              props: {
                label: "Related product",
                tone: "outline",
                actions: dataRef(DATA_REF_ID.TICKET_RELATED_PRODUCT_LINKS),
                emptyTitle: "Nothing kept about this product"
              }
            })
          ]
        },
        // Legacy's delegate-access picker — offered only while the thread is
        // open and nobody else holds it.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          visible: dataRef(DATA_REF_ID.TICKET_CAN_DELEGATE),
          header: {
            title: "Delegate access",
            description: "Let somebody else read and reply to this ticket."
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.COMPACT,
              props: {
                items: dataRef(DATA_REF_ID.TICKET_DELEGATE_ITEMS),
                emptyTitle: "Nobody to delegate to"
              }
            })
          ]
        },
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Conversation",
            description: "Oldest message first.",
            // Legacy's own Messages / Attachments rail over the thread
            // (`ticketMessages.vue:42-46`).
            controls: {
              end: statusRail(
                DATA_REF_ID.TICKET_THREAD_TABS,
                DATA_REF_ID.TICKET_THREAD_ACTIVE_TAB
              )
            }
          },
          slots: [
            moduleRef(LIST_MODULE_ID, {
              variant: LIST_MODULE_VARIANT.TIMELINE,
              props: {
                items: dataRef(DATA_REF_ID.TICKET_MESSAGE_ITEMS),
                emptyTitle: dataRef(DATA_REF_ID.TICKET_THREAD_EMPTY_TITLE)
              }
            })
          ],
          // A thread longer than one page fetches the rest a page at a time.
          // GROUP, not SINGLE: the single variant renders its own `label` and
          // `value` props and reads no action, so a DATA-fed control has to be
          // a set. With no empty copy an empty set renders nothing at all,
          // which is what a thread with nothing behind the fold shows.
          footer: moduleRef(BUTTON_MODULE_ID, {
            variant: BUTTON_MODULE_VARIANT.GROUP,
            props: {
              label: "Earlier messages",
              actions: dataRef(DATA_REF_ID.TICKET_THREAD_MORE_ACTIONS)
            }
          })
        },
        // A closed thread takes no reply — legacy hid the box outright.
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          visible: dataRef(DATA_REF_ID.TICKET_IS_OPEN),
          header: {
            title: "Reply",
            description: "We will email you when the team responds."
          },
          slots: [
            moduleRef(COMPOSER_MODULE_ID, {
              props: {
                label: "Your reply",
                placeholder: "Write a reply…",
                submitLabel: "Send reply",
                action: MOCK_ACTION.REPLY_TICKET,
                // Legacy's file picker, as the names it would have sent
                // (plan F9) — the same control the new-ticket form carries.
                attachmentsLabel: "Attachments",
                attachmentsPlaceholder: "screenshot.png, invoice.pdf",
                // Legacy's cog beside the post button — its client half is the
                // new-line picker and the shortcut question beside it.
                optionsLabel: "Post options",
                optionsValue: mockActionValue(
                  MOCK_ACTION.OPEN_FORM,
                  FORM_ID.SUPPORT_PREFERENCES
                ),
                submitWithShortcut: dataRef(
                  DATA_REF_ID.TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT
                ),
                submitKey: dataRef(DATA_REF_ID.TICKET_COMPOSER_SUBMIT_KEY)
              }
            })
          ]
        }
      ]
    ),
    // Legacy's `ticketForm`, inline where it always was (plan F4). A client who
    // followed a product's assistance link arrives with that product already
    // chosen — the query carries it, and the form's model opens on it.
    [PAGE_KEY.SUPPORT_TICKET_NEW]: page(
      "New ticket",
      "Open a new conversation with support.",
      [
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.PANEL,
          header: {
            title: "Tell us what you need",
            description: "We reply here and by email."
          },
          slots: [
            moduleRef(FORM_MODULE_ID, {
              props: {
                schema: dataRef(DATA_REF_ID.NEW_TICKET_FORM_SCHEMA),
                uischema: dataRef(DATA_REF_ID.NEW_TICKET_FORM_UISCHEMA),
                model: dataRef(DATA_REF_ID.NEW_TICKET_FORM_MODEL),
                submit: MOCK_ACTION.TICKET_CREATE,
                submitLabel: "Open ticket",
                resetLabel: "Cancel"
              }
            })
          ]
        }
      ]
    )
  };
}
