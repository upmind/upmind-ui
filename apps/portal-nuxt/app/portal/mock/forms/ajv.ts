// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/ajv
 * @description The one Ajv instance every mounted form validates against
 * (plan F5) — built exactly as the platform's own wrapper builds it
 * (`packages/headless/src/utils/useValidation.ts`), so a schema that passes
 * here passes there. The formats and keywords below are TRANSCRIBED from
 * `useValidation`'s own `useValidationFormats.ts` / `useValidationKeywords.ts`
 * rather than imported: those files sit outside `modules/`, which is the only
 * runtime reach into headless this app allows (eslint.config.mjs).
 *
 * Business-rule refusals (a duplicate email, the last address, a default that
 * cannot be deleted) never arrive here — they come back from a facade as a
 * receipt and are toasted (plan F5, R4).
 */

import { createAjv } from "@jsonforms/core";
import ajvErrors from "ajv-errors";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  forEach,
  get,
  isEmpty,
  isEqual,
  isNil,
  isObject,
  isString,
  startsWith,
  trim
} from "lodash-es";
import type Ajv from "ajv";
import type { FormatDefinition, KeywordDefinition } from "ajv";
import type { CountryCode, PhoneNumber } from "libphonenumber-js";

/**
 * A hostname, ASCII only. Allows `example.com` and `foo.bar.example.solutions`;
 * rejects `-foo.com`, `foo-.com`, `foo..com`, `foo.com-`.
 */
const DOMAIN_LIKE_VALIDATION =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i;

type NamedFormatDefinition = FormatDefinition<string> & { name: string };

/** The parsed-number bag the phone control hands over, beside a bare string. */
function isPhoneNumber(value: unknown): value is PhoneNumber {
  return isObject(value);
}

/** A pattern format, absent-tolerant: an empty field is `required`'s business, not a format's. */
function patternFormat(name: string, pattern: RegExp): NamedFormatDefinition {
  return {
    name,
    type: "string",
    validate: (data: string): boolean => {
      if (isNil(data)) return true;
      if (!isString(data)) return false;
      return pattern.test(data);
    }
  };
}

/** The five formats `useValidation` registers, in its own order. */
const FORMATS: readonly NamedFormatDefinition[] = [
  patternFormat("domain_name", DOMAIN_LIKE_VALIDATION),
  patternFormat("alpha", /^[a-zA-Z]+$/),
  patternFormat("alpha-dash", /^[a-zA-Z0-9_-]+$/),
  patternFormat("alpha-num", /^[a-zA-Z0-9]+$/),
  patternFormat("alpha-dash-dot", /^[a-zA-Z.-]+$/)
];

const manageKeyword: KeywordDefinition = {
  keyword: "manage",
  schemaType: "object",
  errors: false
};

const semanticTypeKeyword: KeywordDefinition = {
  keyword: "semantic_type",
  schemaType: "string",
  errors: false
};

const trimKeyword: KeywordDefinition = {
  keyword: "trim",
  schemaType: "boolean",
  validate: (schema, data, _parentSchema, dataCxt) => {
    if (schema && isString(data) && dataCxt) {
      dataCxt.parentData[dataCxt.parentDataProperty] = trim(data);
    }
    return true;
  },
  modifying: true,
  errors: false
};

const phoneCountryCodeKeyword: KeywordDefinition = {
  keyword: "phone_country_code",
  type: ["string", "object", "null"],
  schemaType: "string",
  // `schema` is the keyword's own value — the default country the schema
  // named — so it is typed as one rather than narrowed from `any` at the call.
  validate: (schema: CountryCode, data: unknown) => {
    if (isEmpty(data)) return true;
    if (isString(data) && startsWith(data, "+"))
      return isValidPhoneNumber(data);
    if (!isPhoneNumber(data)) return false;
    const { number, nationalNumber, country } = data;
    // Nothing typed yet, so there is nothing to call invalid.
    if (!number && !nationalNumber) return true;
    return isValidPhoneNumber(
      number || nationalNumber || "",
      country ?? schema
    );
  },
  error: { message: () => "Invalid phone number format" }
};

const requiredIfKeyword: KeywordDefinition = {
  keyword: "required_if",
  schemaType: "object",
  validate: (schema, data, _parentSchema, dataCxt) => {
    const field = get(schema, "field");
    const value = get(data, field);
    if (!value || !field) return false;
    return isEqual(get(dataCxt?.parentData, field), value);
  },
  error: {
    message: cxt => `is required if ${cxt.schema.field} is ${cxt.schema.value}`
  }
};

const requiredUnlessKeyword: KeywordDefinition = {
  keyword: "required_unless",
  schemaType: "object",
  validate: (schema, data, _parentSchema, dataCxt) => {
    const field = get(schema, "field");
    const value = get(data, field);
    if (!value || !field) return false;
    return !isEqual(get(dataCxt?.parentData, field), value);
  },
  error: {
    message: cxt =>
      `is required unless ${cxt.schema.field} is ${cxt.schema.value}`
  }
};

/** Declared, never enforced — the platform's own pair is a standing TODO there. */
const requiredWithKeyword: KeywordDefinition = {
  keyword: "required_with",
  schemaType: "string",
  validate: () => true,
  error: { message: cxt => `is required with ${cxt.schema}` }
};

const requiredWithoutKeyword: KeywordDefinition = {
  keyword: "required_without",
  schemaType: "string",
  validate: () => true,
  error: { message: cxt => `is required without ${cxt.schema}` }
};

const sameKeyword: KeywordDefinition = {
  keyword: "same",
  schemaType: "string",
  validate: (schema: string, data: unknown) => {
    if (!schema) return true;
    return isEqual(get(data, schema), data);
  },
  error: { message: cxt => `must be the same as ${cxt.schema}` }
};

const differentKeyword: KeywordDefinition = {
  keyword: "different",
  schemaType: "string",
  validate: (schema: string, data: unknown) => {
    if (!schema) return true;
    return !isEqual(get(data, schema), data);
  },
  error: { message: cxt => `must be different from ${cxt.schema}` }
};

/** The ten keywords `useValidation` registers, in its own order. */
const KEYWORDS: readonly KeywordDefinition[] = [
  manageKeyword,
  semanticTypeKeyword,
  trimKeyword,
  phoneCountryCodeKeyword,
  requiredIfKeyword,
  requiredUnlessKeyword,
  requiredWithKeyword,
  requiredWithoutKeyword,
  sameKeyword,
  differentKeyword
];

let instance: Ajv | undefined;

/**
 * The platform's Ajv, minted once. `useDefaults` is what fills a create form
 * from its schema's own defaults; `singleError` is what makes a field read as
 * one message rather than a stack of keyword failures.
 */
export function usePortalAjv(): Ajv {
  if (instance !== undefined) return instance;

  const ajv = createAjv({ useDefaults: true, verbose: false });
  ajvErrors(ajv, { keepErrors: false, singleError: true });
  forEach(FORMATS, format => ajv.addFormat(format.name, format));
  forEach(KEYWORDS, keyword => ajv.addKeyword(keyword));

  instance = ajv;
  return ajv;
}
