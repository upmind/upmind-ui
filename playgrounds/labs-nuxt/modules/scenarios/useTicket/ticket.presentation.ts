// -----------------------------------------------------------------------------
/**
 * @module scenarios/useTicket/ticket.presentation
 * @description How one support ticket DRAWS as a record on the shared record
 * surface: its subject, its status, its flags, its fields, its conversation
 * and every write, each gated by the record's own meta or — per message — by
 * that message's own `can_manage`.
 *
 * Every write that takes an argument (`setSubject`, `setRelatedProduct`,
 * `editMessage`, `deleteMessage`) publishes no model, so its form declares its
 * own schema and the shared drawer holds the model. The product link reads its
 * control off the manager's own bound lookup (`schemas.productLookup`).
 *
 * The reply composer sits INSIDE the thread section, not in the drawer: each
 * picked file is uploaded before the reply and its ref rides out on it, which
 * no drawn form can carry, and the stale-reply caution must sit under the newer
 * reply the manager pages in, beside the draft it kept.
 */

import { ScopeActorTypes, useTickets } from "@upmind-automation/headless";
import {
  RecordActionColorTypes,
  RecordActionPlacementTypes
} from "../runtime/scenario.types";
import { contractProductSummary } from "../useContractProduct/contract-product.summary";
import { ticketSummary } from "./ticket.summary";
import type { RecordUischema } from "../runtime/scenario.types";
import type { UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const SCHEMA = "http://json-schema.org/draft-07/schema#";

/** One required string field, drawn by its own control. */
function textForm(field: string, i18n: string, multi = false) {
  return {
    schema: {
      $schema: SCHEMA,
      type: "object" as const,
      required: [field],
      properties: { [field]: { type: "string" as const, minLength: 1 } }
    },
    uischema: {
      type: "Control",
      scope: `#/properties/${field}`,
      i18n,
      ...(multi ? { options: { multi: true } } : {})
    } as UISchemaElement
  };
}

/** The ticket, drawn whole as one record. */
export const ticketRecord: RecordUischema = {
  type: "RecordLayout",
  record: "data",
  siblings: ["feed"],
  header: {
    title: "#/properties/subject",
    status: "#/properties/status/properties/name",
    badges: [
      {
        flag: "department",
        scope: "#/properties/department/properties/name",
        i18n: "labs.ticket_badge_department"
      },
      { flag: "isClosed", i18n: "labs.ticket_meta_closed" },
      { flag: "isLocked", i18n: "labs.ticket_meta_locked", color: "danger" },
      { flag: "isScheduled", i18n: "text.ticket_scheduled" },
      { flag: "isDelegated", i18n: "labs.ticket_meta_delegated" },
      { flag: "canReply", i18n: "labs.ticket_meta_can_reply" }
    ]
  },
  sections: [
    {
      kind: "fields",
      key: "details",
      i18n: "labs.record_details",
      icon: "info-circle",
      elements: ticketSummary
    },
    {
      kind: "collection",
      key: "product",
      // The linked product reads the contract-product record's own Details
      // fields, as each product of the contract record does. The ticket's read
      // maps it through `mapContractEmbeddedProduct`, so it carries a title.
      scope: "#/properties/contract_product",
      rowTitle: [
        "#/properties/title",
        "#/properties/service_identifier",
        "#/properties/product_name"
      ],
      rowIcon: "layers-three-01",
      row: contractProductSummary,
      rowActions: [
        {
          name: "open",
          i18n: "labs.contract_product_open",
          icon: "arrow-right",
          placement: RecordActionPlacementTypes.ROW,
          navigate: {
            route: "/useContractProduct/:id",
            idScope: "#/properties/id"
          }
        },
        {
          name: "unlink-product",
          i18n: "labs.ticket_product_unlink",
          placement: RecordActionPlacementTypes.ROW,
          color: RecordActionColorTypes.DANGER,
          gate: "!isLocked",
          run: "removeRelatedProduct"
        }
      ]
    },
    {
      kind: "thread",
      key: "thread",
      i18n: "labs.ticket_thread",
      icon: "inbox-01",
      entries: "#/properties/feed/properties/entries",
      discriminator: {
        scope: "#/properties/kind",
        message: "message",
        log: "log"
      },
      actions: [
        {
          name: "load-older",
          i18n: "labs.ticket_load_older",
          icon: "arrow-up",
          gate: "#/properties/feed/properties/hasOlder",
          run: "loadOlder"
        },
        {
          name: "load-newer",
          i18n: "labs.ticket_load_newer",
          icon: "arrow-down",
          gate: "#/properties/feed/properties/hasNewer",
          run: "loadNewer"
        }
      ],
      views: [
        { value: "all", i18n: "labs.ticket_view_all", run: "loadOlder" },
        {
          value: "attachments",
          i18n: "labs.ticket_view_attachments",
          run: "loadAttachments"
        }
      ],
      message: {
        scope: "#/properties/message",
        author: "#/properties/actor_name",
        date: "#/properties/dateCreated",
        files: "#/properties/files",
        badges: [{ flag: "is_private", i18n: "labs.ticket_private_label" }],
        body: [
          {
            type: "TableCellHtml",
            scope: "#/properties/body",
            i18n: "text.body"
          }
        ],
        actions: [
          {
            name: "reload",
            i18n: "labs.ticket_message_reload",
            run: "getMessage",
            args: ["#/properties/id"]
          },
          {
            name: "edit",
            i18n: "labs.ticket_message_edit",
            gate: "#/properties/can_manage",
            form: {
              ...textForm("body", "form.message", true),
              prefill: true,
              submit: "editMessage",
              args: ["#/properties/id", "#/properties/body"],
              submitI18n: "labs.ticket_message_edit_save"
            }
          },
          {
            name: "delete",
            i18n: "labs.ticket_message_delete",
            color: RecordActionColorTypes.DANGER,
            gate: "#/properties/can_manage",
            form: {
              ...textForm("reason", "labs.ticket_withdraw_reason"),
              submit: "deleteMessage",
              args: ["#/properties/id", "#/properties/reason"],
              i18n: "labs.ticket_message_delete_confirm",
              submitI18n: "labs.ticket_message_delete_confirm"
            }
          }
        ],
        fileActions: [
          {
            name: "delete-attachment",
            i18n: "labs.ticket_attachment_delete",
            color: RecordActionColorTypes.DANGER,
            run: "deleteAttachment",
            args: ["#/properties/messageId", "#/properties/id"]
          }
        ]
      },
      log: {
        scope: "#/properties/log",
        value: "#/properties/statusCode",
        i18n: "labs.ticket_log_status"
      },
      download: {
        run: "downloadAttachment",
        i18n: "labs.ticket_attachment_download",
        done: "labs.ticket_attachment_downloaded"
      },
      copyI18n: "labs.ticket_attachment_copy",
      composer: {
        submit: "reply",
        upload: "uploadAttachment",
        gate: "canReply",
        i18n: {
          placeholder: "labs.ticket_reply_placeholder",
          submit: "labs.ticket_send",
          attach: "labs.ticket_attach",
          uploaded: "labs.ticket_attachment_uploaded",
          failed: "labs.ticket_attachment_failed",
          refused: "labs.ticket_reply_stale"
        }
      },
      empty: {
        title: "labs.ticket_thread_empty",
        text: "labs.ticket_thread_empty_text"
      }
    }
  ],
  actions: [
    {
      name: "close",
      i18n: "labs.ticket_close",
      icon: "x-close",
      color: RecordActionColorTypes.DANGER,
      gate: "!isClosed",
      run: "close"
    },
    {
      name: "reopen",
      i18n: "labs.ticket_reopen",
      icon: "flip-backward",
      gate: "isClosed",
      run: "reopen"
    },
    {
      name: "subject",
      i18n: "labs.ticket_subject_edit",
      icon: "edit-01",
      gate: "!isLocked",
      form: {
        ...textForm("subject", "form.subject"),
        prefill: true,
        submit: "setSubject",
        args: ["#/properties/subject"],
        i18n: "labs.ticket_subject_edit",
        submitI18n: "labs.ticket_subject_save"
      }
    },
    {
      name: "link-product",
      i18n: "labs.ticket_product_link",
      icon: "layers-three-01",
      gate: "!isLocked",
      form: {
        context: "schemas.productLookup",
        schema: {
          $schema: SCHEMA,
          type: "object",
          required: ["contract_product_id"],
          properties: { contract_product_id: { type: "string", minLength: 1 } }
        },
        prefill: true,
        submit: "setRelatedProduct",
        args: ["#/properties/contract_product_id"]
      }
    },
    {
      name: "link-product-id",
      i18n: "labs.ticket_product_link_id",
      placement: RecordActionPlacementTypes.OVERFLOW,
      gate: "!isLocked",
      form: {
        ...textForm("contract_product_id", "labs.ticket_product_id"),
        submit: "setRelatedProduct",
        args: ["#/properties/contract_product_id"],
        submitI18n: "labs.ticket_product_link"
      }
    },
    {
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "refresh"
    }
  ],
  picker: {
    use: useTickets,
    actor: ScopeActorTypes.SELF,
    schema: "schemas.ticketPicker",
    field: "ticket",
    resolve: {
      filter: "reference",
      i18n: {
        title: "labs.ticket_not_found",
        text: "labs.ticket_not_found_text"
      }
    },
    icon: "message-question-circle",
    i18n: {
      title: "labs.ticket_needs_id",
      text: "labs.ticket_needs_id_text",
      input: "labs.ticket_id_label",
      open: "labs.ticket_open"
    }
  }
};
