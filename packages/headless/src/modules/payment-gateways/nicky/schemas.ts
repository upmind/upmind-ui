import {
  useSchema as useDefaultSchema,
  useUischema as useDefaultUischema
} from "../payment-gateways.schemas";
import { getPayerEmail, payerNeedsEmail } from "../payment-gateways.utils";
import type { GatewayContext } from "../payment-gateways.types";
import type { JsonSchema, Layout, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------
// Nicky needs a payer email to raise the payment request. Collect it into
// `payment_method_addition` when the payer has none on file — a guest, or a
// logged-in client without an email. A client who already has one gets no form.

export const useSchema = (context: GatewayContext) => {
  const defaultSchema = useDefaultSchema(context);

  if (!payerNeedsEmail(context)) return defaultSchema as JsonSchema;

  return {
    ...defaultSchema,
    properties: {
      payment_method_addition: {
        type: "object",
        title: "Nicky Payment Details",
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
      ...(defaultSchema?.properties || {})
    }
  } as JsonSchema;
};

export const useUischema = (context: GatewayContext) => {
  const defaultUischema = useDefaultUischema(context);

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
    elements: [...elements, ...(defaultUischema?.elements || [])]
  } as Layout;
};
