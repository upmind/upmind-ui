// --- external

// --- internal

// --- utils

// --- types
import type { GatewayContext } from "./types";
import { GatewayContext as GatewayCtx } from "@upmind-automation/types";
import { RuleEffect, type Layout } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useSchema = (context: GatewayContext) => {
  const isAdding = context.ctx === GatewayCtx.ADD;

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: ["gateway_id"],
    properties: {
      gateway_id: {
        type: "string",
        title: "",
        const: context?.gateway?.id,
        readOnly: true
      },
      //  ---
      store_on_payment: {
        type: "boolean",
        const: isAdding ? true : undefined,
        default: context.canStore,
        readOnly: context.canStore == false
      },
      store_on_payment_auto_payment: {
        type: "boolean",
        title: "",
        description: "",
        default: context.canStore,
        readOnly: context.canStore == false
      }
    }
  };

  return schema;
};

export const useUischema = (context: GatewayContext) => {
  const isAdding = context.ctx === GatewayCtx.ADD;

  const uischema: Layout = {
    type: "VerticalLayout",
    elements: []
  };

  if (!isAdding && context.canStore && !context.mustStore) {
    uischema.elements.push({
      type: "Control",
      scope: "#/properties/store_on_payment",
      i18n: "form.store_on_payment"
    });
  }

  if (!context.mustAutoPay) {
    uischema.elements.push({
      type: "Control",
      scope: "#/properties/store_on_payment_auto_payment",
      i18n: "form.allow_auto_payment",
      options: {
        autocomplete: "off"
      },
      // only show this field if we have the store_on_payment flag
      rule: {
        effect: RuleEffect.SHOW,
        condition: {
          scope: "#",
          schema: {
            required: ["store_on_payment"],
            properties: { store_on_payment: { const: true } }
          }
        }
      }
    });
  }

  return uischema as Layout;
};
