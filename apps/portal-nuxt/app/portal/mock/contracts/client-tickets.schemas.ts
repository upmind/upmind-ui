// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-tickets.schemas
 * @description Schema/uischema for the forms the SCOPED `client-tickets`
 * module headless does not have yet carries (plan F4) — opening a thread,
 * renaming one, the composer's post options and the editor on a message the
 * client wrote. Written in the headless shape, so
 * `/scoped-composable-factory` consumes this file unchanged alongside
 * `client-tickets.ts`'s four-layer contract.
 *
 * The department control is CONDITIONAL on the context rather than on a rule:
 * a brand that publishes one desk has nothing to choose between, and every
 * thread it takes goes to that desk whether the form says so or not.
 *
 * @decision Attachments are a COMMA-SEPARATED string, not an array control.
 * The design system's one array renderer (`StringsRenderer`) is a multi-select
 * over a fixed `items.enum` / `items.oneOf`; a client's own file names are
 * neither fixed nor known, so an `array` of free strings resolves to no
 * renderer at all. Plan F9's own fallback ("else a string of file names")
 * applies until the library ships a file control. The facade splits on the
 * comma; nothing is uploaded either way.
 *
 * @module-oracle vue-app `ticketForm.vue`, `changeTicketSubjectModal.vue`,
 * `supportPreferencesModal.vue`, `ticketMessage.vue`.
 */

import { NEW_LINE_KEY } from "./client-tickets";
import { compact, map, size, split, trim } from "lodash-es";
import type {
  SupportPreferencesContext,
  TicketFormContext,
  TicketMessageContext,
  TicketRelatedProductContext
} from "./client-tickets";
import type {
  ControlElement,
  JsonSchema7,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/** One pick-list choice as the UI renderers read it — not a core schema keyword. */
type SchemaChoice = { label: string; value: string | number };

type SchemaProperty = JsonSchema7 & {
  options?: SchemaChoice[];
  trim?: boolean;
};

/** Legacy's own bound: a subject is one line long. */
const SUBJECT_MAX_LENGTH = 120;

/** How the attachment names are separated in the one field that carries them. */
const ATTACHMENT_SEPARATOR = ",";

/** The one field both forms carry — the thread's own name. */
function subjectProperty(): SchemaProperty {
  return {
    type: "string",
    title: "Subject",
    minLength: 1,
    maxLength: SUBJECT_MAX_LENGTH,
    trim: true
  };
}

/** Whether the brand publishes more than one desk to raise a thread with. */
export function offersDepartmentChoice(context: TicketFormContext): boolean {
  return size(context.departments) > 1;
}

/** The file names a client typed, as the list the facade records. */
export function parseAttachmentNames(value: string): string[] {
  return compact(map(split(value, ATTACHMENT_SEPARATOR), trim));
}

function departmentChoices(context: TicketFormContext): SchemaChoice[] {
  return map(context.departments, department => ({
    label: department.name,
    value: department.id
  }));
}

function productChoices(context: TicketFormContext): SchemaChoice[] {
  return map(context.products, product => ({
    label: product.name,
    value: product.id
  }));
}

/** Schema for the new-ticket form. */
export const useSchema = (context: TicketFormContext): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    subject: subjectProperty(),
    productId: {
      type: ["string", "null"],
      title: "Related product",
      description: "Tell us which product this is about, if it is about one.",
      enum: [null, ...map(context.products, "id")],
      options: productChoices(context)
    },
    body: {
      type: "string",
      title: "How can we help?",
      minLength: 1,
      trim: true
    },
    attachments: {
      type: "string",
      title: "Attachments",
      description: "Name the files you want to send, separated by commas."
    }
  };

  const required = ["subject", "body"];

  // Legacy showed the datetime under `canScheduleTicket` and nowhere else, so
  // a brand with the gate off has no field to leave empty.
  if (context.canSchedule) {
    properties["scheduledAt"] = {
      type: ["string", "null"],
      title: "Schedule for later",
      description:
        "Leave this empty to open the ticket now, or choose when it should open.",
      format: "date-time"
    };
  }

  if (offersDepartmentChoice(context)) {
    properties["departmentId"] = {
      type: "string",
      title: "Department",
      enum: map(context.departments, "id"),
      options: departmentChoices(context)
    };
    required.push("departmentId");
  }

  return {
    type: "object",
    title: "New ticket",
    required,
    properties
  };
};

function control(
  scope: string,
  options?: ControlElement["options"]
): ControlElement {
  return { type: "Control", scope: `#/properties/${scope}`, options };
}

/** UI schema for the new-ticket form. */
export const useUischema = (context: TicketFormContext): VerticalLayout => ({
  type: "VerticalLayout",
  elements: compact([
    control("subject", { placeholder: "What is this about?" }),
    offersDepartmentChoice(context) && control("departmentId"),
    control("productId"),
    control("body", {
      multi: true,
      placeholder: "Tell us what is happening, and what you have tried"
    }),
    control("attachments", { placeholder: "screenshot.png, invoice.pdf" }),
    context.canSchedule && control("scheduledAt")
  ])
});

/**
 * What the new-ticket form opens on. A client who followed a product's own
 * assistance link arrives about that product, so the picker opens on it; a
 * brand with one desk raises the thread with it, which is why no department
 * is carried here (the facade names the sole desk).
 */
export const newTicketDefaults = (context: TicketFormContext): FormModel => {
  const model: FormModel = {
    subject: "",
    productId: context.productId ?? null,
    body: "",
    attachments: ""
  };
  if (context.canSchedule) model["scheduledAt"] = null;
  return model;
};

/** Schema for the edit-subject form. */
export const useSubjectSchema = (): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    subject: subjectProperty()
  };
  return {
    type: "object",
    title: "Subject",
    required: ["subject"],
    properties
  };
};

/** UI schema for the edit-subject form. */
export const useSubjectUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/subject",
      i18n: "form.ticket_subject",
      options: { placeholder: "What this thread is about" }
    }
  ]
});

/** What the edit-subject form opens on — the subject on file. */
export const subjectDefaults = (subject: string): FormModel => ({ subject });

// --- the composer's post options (legacy `supportPreferencesModal`) -----------

/**
 * Schema for the post-options form. Legacy asked three things and kept ONE of
 * them for staff — only the message signature carries `v-if="isAdmin"`
 * (`supportPreferencesModal.vue:36`). Its new-line picker (`:6-12`) is
 * client-reachable, so the client half is two questions: which key opens a new
 * line, and whether the other one sends at all.
 */
export const useSupportPreferencesSchema = (): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    newLineKey: {
      type: "string",
      title: "New line key",
      enum: [NEW_LINE_KEY.ENTER, NEW_LINE_KEY.SHIFT_ENTER],
      options: NEW_LINE_CHOICES
    },
    submitWithShortcut: {
      type: "boolean",
      title: "Send with the other key",
      description: "Off leaves sending to the button."
    }
  };
  return {
    type: "object",
    title: "Post options",
    required: ["newLineKey"],
    properties
  };
};

/** How each new-line answer reads — legacy's two `newLineOptions` labels. */
const NEW_LINE_CHOICES: SchemaChoice[] = [
  { label: "Enter starts a new line", value: NEW_LINE_KEY.ENTER },
  {
    label: "Shift and Enter start a new line",
    value: NEW_LINE_KEY.SHIFT_ENTER
  }
];

/** UI schema for the post-options form. */
export const useSupportPreferencesUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [control("newLineKey"), control("submitWithShortcut")]
});

/** What the post-options form opens on — what the keys do today. */
export const supportPreferencesDefaults = (
  context: SupportPreferencesContext
): FormModel => ({
  newLineKey: context.newLineKey,
  submitWithShortcut: context.submitWithShortcut
});

// --- editing a message (legacy `ticketMessage.vue`'s inline editor) -----------

/**
 * Schema for the message-edit form. Legacy's editor asked for the body and
 * nothing else, and refused an empty one (`updateMessage` returned early on
 * an empty sanitised body) — the same bound the reply composer holds.
 */
export const useMessageSchema = (): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    body: {
      type: "string",
      title: "Message",
      minLength: 1,
      trim: true
    }
  };
  return {
    type: "object",
    title: "Edit message",
    required: ["body"],
    properties
  };
};

/** UI schema for the message-edit form. */
export const useMessageUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    control("body", { multi: true, placeholder: "Write your message" })
  ]
});

/** What the message-edit form opens on — the message as it reads now. */
export const messageDefaults = (context: TicketMessageContext): FormModel => ({
  body: context.body
});

// --- the related product (legacy `SelectContractProductsModal`) ---------------

/**
 * Schema for the related-product form. Legacy opened a single-select listing
 * of the client's own products; the enum is that listing, and a thread may
 * only ever be about ONE product, which is why nothing here is nullable —
 * detaching is its own control (`ticket-remove-product`).
 */
export const useRelatedProductSchema = (
  context: TicketRelatedProductContext
): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    productId: {
      type: "string",
      title: "Related product",
      enum: map(context.products, "id"),
      options: map(context.products, product => ({
        label: product.name,
        value: product.id
      }))
    }
  };
  return {
    type: "object",
    title: "Related product",
    required: ["productId"],
    properties
  };
};

/** UI schema for the related-product form. */
export const useRelatedProductUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [control("productId")]
});

/** What the related-product form opens on — the thread's own product, where it has one. */
export const relatedProductDefaults = (
  context: TicketRelatedProductContext
): FormModel => ({ productId: context.productId ?? "" });
