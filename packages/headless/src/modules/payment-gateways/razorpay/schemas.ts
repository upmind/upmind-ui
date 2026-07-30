// --- internal

// --- utils
import { useSchema as useDefaultSchema } from "../schemas";
import { getPayerEmail, payerNeedsEmail } from "../utils";

// --- types
import type { GatewayContext } from "../types";
import type { JsonSchema, Layout, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------
// Razorpay Checkout needs the payer email to prefill its modal. Collect it into
// `payment_method_addition` when the payer has none on file — a guest, or a
// logged-in client without an email. A client who already has one gets no form.
// Storage/auto-pay stay backend-driven defaults, never a user-facing toggle
// here, matching this gateway's behaviour before it had any inline form —
// `store_on_payment`/`store_on_payment_auto_payment` are forced read-only and
// excluded from the uischema regardless of `canStore`.

export const useSchema = (context: GatewayContext) => {
  const defaultSchema = useDefaultSchema(context);

  const properties = {
    ...(defaultSchema?.properties || {}),
    store_on_payment: {
      ...(defaultSchema?.properties?.store_on_payment || {}),
      readOnly: true
    },
    store_on_payment_auto_payment: {
      ...(defaultSchema?.properties?.store_on_payment_auto_payment || {}),
      readOnly: true
    }
  };

  if (!payerNeedsEmail(context))
    return { ...defaultSchema, properties } as JsonSchema;

  return {
    ...defaultSchema,
    properties: {
      payment_method_addition: {
        type: "object",
        title: "Razorpay Payment Details",
        required: ["email"],
        properties: {
          email: {
            type: ["string", "null"],
            format: "email",
            title: "Email",
            default: getPayerEmail(context)
          }
        }
      },
      ...properties
    }
  } as JsonSchema;
};

export const useUischema = (context: GatewayContext) => {
  const elements: UISchemaElement[] = [];

  if (payerNeedsEmail(context)) {
    elements.push({
      type: "Control",
      scope: "#/properties/payment_method_addition/properties/email",
      i18n: "form.auth_email",
      options: {
        autocomplete: "email"
      }
    } as UISchemaElement);
  }

  return {
    type: "VerticalLayout",
    elements
  } as Layout;
};
