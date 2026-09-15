// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-contacts.schemas
 * @description Stand-ins for the four contact forms legacy's profile page
 * opens (`addEditClientEmailsModal`, `addEditClientPhoneModal`,
 * `addEditClientAddressModal`, `addEditClientCompanyModal`), mirroring the
 * `client-{email,phone,address,company}` schemas headless ships. Headless is
 * a types-only dependency here, so the shapes are restated, not imported.
 */

import { PORTAL_FORM_COUNTRIES, regionsFor } from "../forms/engine-data";
import { MOCK_ADDRESS_TYPE } from "../types";
import { assign, map } from "lodash-es";
import type { MockAddress, MockCompany, MockEmail, MockPhone } from "../types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/** Legacy's verification mail carries a six-digit code. */
export const VERIFICATION_CODE_PATTERN = "^\\d{6}$";

const ADDRESS_TYPE_CHOICES = [
  { const: MOCK_ADDRESS_TYPE.HOME, title: "Home" },
  { const: MOCK_ADDRESS_TYPE.OFFICE, title: "Office" },
  { const: MOCK_ADDRESS_TYPE.COMPANY, title: "Company" }
];

function control(
  scope: string,
  options?: Record<string, unknown>
): ControlElement {
  if (options === undefined) return { type: "Control", scope };
  return { type: "Control", scope, options };
}

function vertical(elements: UISchemaElement[]): VerticalLayout {
  return { type: "VerticalLayout", elements };
}

// --- emails ------------------------------------------------------------------

export const useEmailSchema = (): JsonSchema7 => ({
  type: "object",
  required: ["email"],
  properties: {
    email: { type: "string", format: "email", title: "Email address" }
  }
});

export const useEmailUischema = (): VerticalLayout =>
  vertical([
    control("#/properties/email", { autoFocus: true, autocomplete: "email" })
  ]);

export const emailDefaults = (row?: MockEmail): FormModel => ({
  email: row?.email ?? ""
});

/** Legacy's `enter_verification_code` modal — the code alone. */
export const useVerificationCodeSchema = (): JsonSchema7 => ({
  type: "object",
  required: ["code"],
  properties: {
    code: {
      type: "string",
      title: "Verification code",
      pattern: VERIFICATION_CODE_PATTERN
    }
  }
});

export const useVerificationCodeUischema = (): VerticalLayout =>
  vertical([
    control("#/properties/code", {
      autoFocus: true,
      autocomplete: "one-time-code"
    })
  ]);

export const verificationCodeDefaults = (): FormModel => ({ code: "" });

// --- phones ------------------------------------------------------------------

/** One phone control; the design system's `phone` format carries the dial code. */
export const usePhoneSchema = (): JsonSchema7 => ({
  type: "object",
  required: ["phone"],
  properties: {
    phone: { type: "string", format: "phone", title: "Phone number" }
  }
});

export const usePhoneUischema = (): VerticalLayout =>
  vertical([
    control("#/properties/phone", { autoFocus: true, autocomplete: "tel" })
  ]);

export const phoneDefaults = (row?: MockPhone): FormModel => ({
  phone: row?.phone.number ?? ""
});

// --- addresses ---------------------------------------------------------------

/** The address block both the address and the company form carry — headless's `useSchemaDefinitions`. */
function addressBlock(countryId: string | null | undefined): JsonSchema7 {
  const regions = regionsFor(countryId);
  const regionId: JsonSchema7 = { type: ["string", "null"], title: "Region" };
  if (regions.length > 0) {
    assign(regionId, {
      oneOf: map(regions, region => ({ const: region.id, title: region.name }))
    });
  }
  return {
    type: "object",
    title: "Address",
    required: ["address1", "city", "postcode", "countryId"],
    properties: {
      address1: { type: "string", title: "Address" },
      address2: { type: ["string", "null"], title: "Address line 2" },
      city: { type: "string", title: "City" },
      postcode: { type: "string", title: "Postcode" },
      regionId,
      countryId: {
        type: "string",
        title: "Country",
        oneOf: map(PORTAL_FORM_COUNTRIES, country => ({
          const: country.id,
          title: country.name
        }))
      }
    }
  };
}

const ADDRESS_BLOCK_CONTROLS = [
  control("#/properties/address/properties/address1", { autoFocus: true }),
  control("#/properties/address/properties/address2"),
  control("#/properties/address/properties/city"),
  control("#/properties/address/properties/postcode"),
  control("#/properties/address/properties/countryId"),
  control("#/properties/address/properties/regionId")
];

/**
 * Schema for one address. The region choices follow the country the form
 * OPENS on; the real machine rebuilds them as the country changes.
 */
export const useAddressSchema = (
  countryId: string | null | undefined
): JsonSchema7 => ({
  type: "object",
  required: ["name", "address"],
  properties: {
    name: { type: "string", title: "Name", minLength: 1 },
    type: { type: "number", title: "Type", oneOf: ADDRESS_TYPE_CHOICES },
    address: addressBlock(countryId)
  }
});

export const useAddressUischema = (): VerticalLayout =>
  vertical([
    control("#/properties/name"),
    control("#/properties/type"),
    ...ADDRESS_BLOCK_CONTROLS
  ]);

/** What the address form opens on — the row's own values, or a blank address in the given country. */
export const addressDefaults = (
  countryId: string,
  row?: MockAddress
): FormModel => ({
  name: row?.name ?? "",
  type: row?.type ?? MOCK_ADDRESS_TYPE.HOME,
  address: {
    address1: row?.address.address1 ?? "",
    address2: row?.address.address2 ?? null,
    city: row?.address.city ?? "",
    postcode: row?.address.postcode ?? "",
    regionId: row?.address.regionId ?? null,
    countryId: row?.address.countryId ?? countryId
  }
});

// --- companies ---------------------------------------------------------------

/** Schema for one company — headless's `useCompanySchema`: name, numbers, and its own address. */
export const useCompanySchema = (
  countryId: string | null | undefined
): JsonSchema7 => ({
  type: "object",
  required: ["name", "address"],
  properties: {
    name: { type: "string", title: "Company name", minLength: 1 },
    regNumber: { type: ["string", "null"], title: "Company number" },
    tax: {
      type: "object",
      title: "Tax details",
      properties: {
        number: { type: ["string", "null"], title: "Registered tax ID" }
      }
    },
    address: addressBlock(countryId)
  }
});

export const useCompanyUischema = (): VerticalLayout =>
  vertical([
    control("#/properties/name"),
    control("#/properties/regNumber"),
    control("#/properties/tax/properties/number"),
    ...ADDRESS_BLOCK_CONTROLS
  ]);

/** What the company form opens on — the row's own values, its address read from the address book. */
export const companyDefaults = (
  countryId: string,
  row?: MockCompany,
  address?: MockAddress
): FormModel => ({
  name: row?.name ?? "",
  regNumber: row?.regNumber ?? null,
  tax: { number: row?.tax.number ?? null },
  address: {
    address1: address?.address.address1 ?? "",
    address2: address?.address.address2 ?? null,
    city: address?.address.city ?? "",
    postcode: address?.address.postcode ?? "",
    regionId: address?.address.regionId ?? null,
    countryId: address?.address.countryId ?? countryId
  }
});
