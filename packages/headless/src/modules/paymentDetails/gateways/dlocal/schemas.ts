// --- external

// --- internal

// --- utils
import {
  useSchema as useDefaultSchema,
  useUischema as useDefaultUischema
} from "../schemas";
import {
  getCountry,
  getCurrency,
  getDocumentName,
  needsDocument,
  needsPhone
} from "./utils";

// --- types
import type { GatewayContext } from "../types";
import type { DLocalContext } from "./types";
import { DOCUMENT_REGEX_RULES } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { GatewayProviderCodes } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const useSchema = (context: GatewayContext) => {
  const defaultSchema = useDefaultSchema(context);
  const country = getCountry(context);
  const currency = getCurrency(context);
  const documentName = getDocumentName(country, currency);

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: [...(defaultSchema?.required || []), "holder_name"],
    properties: {
      holder_name: {
        type: "string",
        title: "Cardholder Name"
      },
      payment_method_addition: {
        type: "object",
        title: "dLocal Payment Details",
        required: [] as string[],
        properties: {
          token: {
            type: ["string", "null"],
            title: "Payment Method ID", // this will be generated on pay
            readOnly: true
          },
          document: {
            type: ["string", "null"],
            title: documentName,
            ...(needsDocument(country) &&
            country &&
            DOCUMENT_REGEX_RULES[country]
              ? { pattern: DOCUMENT_REGEX_RULES[country].source }
              : {})
          },
          phone: {
            type: ["object", "null"],
            title: "Phone",
            phone_country_code: getCountry(context),
            properties: {
              number: {
                type: ["string", "null"],
                title: "Phone number ( with dialing code )"
              },
              country: {
                type: ["string", "null"],
                title: "Country",
                default: getCountry(context)
              },
              nationalNumber: {
                type: ["string", "null"],
                title: "Phone number"
              },
              countryCallingCode: {
                type: ["string", "null"],
                title: "Country calling code"
              }
            }
          }
        }
      },
      ...(defaultSchema?.properties || {})
    }
  };

  // --- document field — required in most LATAM countries
  if (needsDocument(country)) {
    schema.properties.payment_method_addition.required!.push("document");
  }

  // --- phone field — mandatory in India
  if (needsPhone(country)) {
    schema.properties.payment_method_addition.required!.push("phone");
  }

  return schema as JsonSchema;
};

export const useUischema = (context: DLocalContext) => {
  const defaultUischema = useDefaultUischema(context);
  const country = getCountry(context);
  const currency = getCurrency(context);
  const documentName = getDocumentName(country, currency);

  const dlocalElements: UISchemaElement[] = [
    {
      type: "Control",
      scope: "#/properties/holder_name",
      i18n: "form.cardholder_name",
      options: {
        autoFocus: true,
        autocomplete: "cc-name"
      }
    },
    // NB: Custom "Gateway" type — matched by GatewayDLocalRenderer in client-vue.
    //     The sdk fields reference is passed via options so the renderer can mount
    //     the dLocal smart fields iframe into its own template ref without needing
    //     a container passed from outside.
    {
      type: "Gateway",
      scope:
        "#/properties/payment_method_addition/properties/payment_method_id",
      i18n: "form.card_num",
      options: {
        provider: GatewayProviderCodes.D_LOCAL_CARD,
        fields: context.sdk?.fields
      }
    } as UISchemaElement
  ];

  // --- document field for LATAM countries
  if (needsDocument(country)) {
    dlocalElements.push({
      type: "Control",
      scope: "#/properties/payment_method_addition/properties/document",
      i18n: "form.document",
      label: documentName,
      options: {
        autocomplete: "off"
      }
    });
  }

  // --- phone field for India and other phone-required countries
  if (needsPhone(country)) {
    dlocalElements.push({
      type: "Control",
      scope: "#/properties/payment_method_addition/properties/phone",
      i18n: "form.phone",
      options: {
        autocomplete: "tel",
        suggestions: true,
        itemLabel: "number",
        itemValue: "number",
        align: "start",
        side: "bottom"
      }
    });
  }

  const uischema = {
    type: "VerticalLayout",
    elements: [...dlocalElements, ...(defaultUischema?.elements || [])]
  };

  return uischema as UISchemaElement;
};
