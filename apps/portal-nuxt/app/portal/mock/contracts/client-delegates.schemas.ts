// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-delegates.schemas
 * @description Schema/uischema for the invitation the SCOPED
 * `client-delegates` module headless does not have yet carries (plan F4) —
 * legacy's `clientDelegateInviteModal`. Written in the headless shape, so
 * `/scoped-composable-factory` consumes this file unchanged alongside
 * `client-delegates.ts`'s four-layer contract.
 *
 * The two pickers are stated TWICE, once in each layer, and both are needed:
 * the uischema rule HIDES them while the invitation is for the whole account,
 * and the schema's `if`/`then` is what stops a specific invitation naming
 * nothing (plan F5 — validation is the engine's, and a hidden control is
 * still a field on the model).
 *
 * @module-oracle vue-app `clientDelegateInviteModal.vue`.
 */

import { RuleEffect } from "@jsonforms/core";
import { DelegateAccessTypes } from "./client-delegates";
import { assign, compact, map, size } from "lodash-es";
import type { DelegateInviteContext } from "./client-delegates";
import type {
  ControlElement,
  JsonSchema7,
  Rule,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** One pick-list choice as the UI renderers read it — not a core schema keyword. */
type SchemaChoice = { label: string; value: string | number };

type SchemaProperty = JsonSchema7 & { options?: SchemaChoice[] };

/** What each access type says to the person choosing it. */
const ACCESS_TYPE_LABEL: Readonly<Record<DelegateAccessTypes, string>> = {
  [DelegateAccessTypes.FULL]: "Everything on my account",
  [DelegateAccessTypes.SPECIFIC]: "Only what I name below"
};

/** A specific invitation that names nothing grants nothing. */
const MINIMUM_GRANTS = 1;

/** Whether this client holds anything a specific invitation could name. */
export function offersGrants(context: DelegateInviteContext): boolean {
  return size(context.products) > 0 || size(context.tickets) > 0;
}

function accessChoices(): SchemaChoice[] {
  return map(ACCESS_TYPE_LABEL, (label, value) => ({ label, value }));
}

/** A thread reads as its subject; the reference is what the client sees on the row. */
function ticketChoices(context: DelegateInviteContext): SchemaChoice[] {
  return map(context.tickets, ticket => ({
    label: compact([ticket.reference, ticket.subject]).join(" · "),
    value: ticket.id
  }));
}

function productChoices(context: DelegateInviteContext): SchemaChoice[] {
  return map(context.products, product => ({
    label: product.name,
    value: product.id
  }));
}

/**
 * One multi-select over a fixed list, in the shape the design system's array
 * renderer tests for (`uniqueItems` + `items.oneOf` of consts).
 */
function multiSelect(title: string, choices: SchemaChoice[]): SchemaProperty {
  return {
    type: "array",
    title,
    uniqueItems: true,
    items: {
      type: "string",
      oneOf: map(choices, choice => ({
        const: String(choice.value),
        title: choice.label
      }))
    }
  };
}

/**
 * Schema for the invite-delegate form. An account holding nothing to grant
 * offers neither picker NOR the access choice: every invitation it can send
 * reaches the whole account, so a control between two answers would have one.
 */
export const useSchema = (context: DelegateInviteContext): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    email: {
      type: "string",
      title: "Their email address",
      description: "We send the invitation here.",
      format: "email",
      minLength: 1
    }
  };

  if (!offersGrants(context)) {
    return {
      type: "object",
      title: "Invite a delegate",
      required: ["email"],
      properties
    };
  }

  properties["accessType"] = {
    type: "string",
    title: "How much can they reach?",
    enum: map(accessChoices(), "value"),
    options: accessChoices()
  };
  const hasProducts = size(context.products) > 0;
  const hasTickets = size(context.tickets) > 0;
  const grants = compact([
    hasProducts && "productIds",
    hasTickets && "ticketIds"
  ]);
  if (hasProducts) {
    properties["productIds"] = multiSelect("Products", productChoices(context));
  }
  if (hasTickets) {
    properties["ticketIds"] = multiSelect("Tickets", ticketChoices(context));
  }

  return {
    type: "object",
    title: "Invite a delegate",
    required: ["email", "accessType"],
    properties,
    // An invitation that reaches only what it names has to name something —
    // either list will do, which is what legacy's own pickers allowed. The
    // uischema hides both on the other branch, and this is what keeps a
    // hidden field from being submitted empty.
    if: {
      properties: { accessType: { const: DelegateAccessTypes.SPECIFIC } },
      required: ["accessType"]
    },
    then: {
      // `required` beside `minItems`: a schema says nothing about a key the
      // model does not carry, so without it an absent picker would satisfy
      // the branch and an invitation could name nothing at all.
      anyOf: map(grants, grant => ({
        required: [grant],
        properties: { [grant]: { minItems: MINIMUM_GRANTS } }
      }))
    }
  };
};

function control(scope: string, rule?: Rule): ControlElement {
  return { type: "Control", scope: `#/properties/${scope}`, rule };
}

/** Shown while the invitation reaches only what it names, and nowhere else. */
function whileSpecific(): Rule {
  return {
    effect: RuleEffect.SHOW,
    condition: {
      scope: "#/properties/accessType",
      schema: { enum: [DelegateAccessTypes.SPECIFIC] }
    }
  };
}

/** UI schema for the invite-delegate form. */
export const useUischema = (
  context: DelegateInviteContext
): VerticalLayout => ({
  type: "VerticalLayout",
  elements: compact([
    {
      type: "Control",
      scope: "#/properties/email",
      i18n: "form.email",
      options: { autocomplete: "email", placeholder: "them@example.com" }
    },
    offersGrants(context) && {
      type: "Control",
      scope: "#/properties/accessType",
      i18n: "form.delegate_access_type",
      options: { format: "radio" }
    },
    size(context.products) > 0 && control("productIds", whileSpecific()),
    size(context.tickets) > 0 && control("ticketIds", whileSpecific())
  ])
});

/**
 * What the invitation opens on — the narrower access type where there is a
 * choice, and the whole account where there is not.
 */
export const delegateInviteDefaults = (
  context: DelegateInviteContext
): FormModel => {
  const model: FormModel = { email: "", accessType: DelegateAccessTypes.FULL };
  if (!offersGrants(context)) return model;
  return assign(model, {
    accessType: DelegateAccessTypes.SPECIFIC,
    productIds: [],
    ticketIds: []
  });
};
