// --- external

// --- internal

// --- utils
import {
  useSchema as useDefaultSchema,
  useUischema as useDefaultUischema
} from "../payment-gateways.schemas";
import {
  getPayerEmail,
  payerNeedsEmail,
  payerNeedsPhone
} from "../payment-gateways.utils";

// --- types
import type { GatewayContext } from "../payment-gateways.types";
import { CURRENCY_TO_COUNTRY } from "./types";
import type { JsonSchema, Layout } from "@jsonforms/core";
import {
  DOCUMENT_REGEX_RULES,
  getDocumentName
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// The dLocal "redirect" gateway (D_LOCAL) is renderless (no Smart Fields SDK).
// It always collects the payer document into `payment_method_addition`, plus the
// payer's email/phone when they have none on file (guest, or a client missing
// them). The document label/format are country-specific (client country, else
// billing, else the payment currency's country).

function getDocumentCountry(context: GatewayContext): string | undefined {
  return (
    context.client?.location_country_code ||
    context.address?.country?.code ||
    CURRENCY_TO_COUNTRY[context.currency?.code?.toUpperCase() ?? ""]
  );
}

export const useSchema = (context: GatewayContext) => {
  const defaultSchema = useDefaultSchema(context);
  const country = getDocumentCountry(context);
  const currency = context.currency?.code;
  const documentName = getDocumentName(country, currency);
  const regex = country
    ? DOCUMENT_REGEX_RULES[country.toUpperCase()]
    : undefined;
  const needsEmail = payerNeedsEmail(context);
  const needsPhone = payerNeedsPhone(context);

  const properties: Record<string, JsonSchema> = {
    document: {
      type: ["string", "null"],
      title: documentName,
      ...(regex ? { pattern: regex.source } : {})
    }
  };
  const required = ["document"];

  if (needsEmail) {
    properties.email = {
      type: ["string", "null"],
      format: "email",
      title: "Email",
      default: getPayerEmail(context)
    };
    required.push("email");
  }

  if (needsPhone) {
    properties.phone = {
      type: ["string", "null"],
      title: "Phone",
      // @ts-expect-error: 'phone_country_code' is a custom AJV keyword
      phone_country_code: country
    };
    required.push("phone");
  }

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: [...(defaultSchema?.required || [])],
    properties: {
      payment_method_addition: {
        type: "object",
        title: "dLocal Payment Details",
        required,
        properties
      },
      ...(defaultSchema?.properties || {})
    }
  };

  return schema as JsonSchema;
};

export const useUischema = (context: GatewayContext) => {
  const defaultUischema = useDefaultUischema(context);
  const country = getDocumentCountry(context);
  const currency = context.currency?.code;
  const documentName = getDocumentName(country, currency);

  const elements: Layout["elements"] = [
    {
      type: "Control",
      scope: "#/properties/payment_method_addition/properties/document",
      i18n: "form.document",
      label: documentName,
      options: { autocomplete: "off" }
    }
  ];

  if (payerNeedsEmail(context)) {
    elements.push({
      type: "Control",
      scope: "#/properties/payment_method_addition/properties/email",
      i18n: "form.auth_email",
      options: { autocomplete: "email" }
    });
  }

  if (payerNeedsPhone(context)) {
    elements.push({
      type: "Control",
      scope: "#/properties/payment_method_addition/properties/phone",
      i18n: "form.phone",
      options: { autocomplete: "tel" }
    });
  }

  return {
    type: "VerticalLayout",
    elements: [...elements, ...(defaultUischema?.elements || [])]
  } as Layout;
};
