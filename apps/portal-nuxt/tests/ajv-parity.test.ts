// -----------------------------------------------------------------------------
/**
 * @module tests/ajv-parity
 * @description Plan F5: the portal's Ajv is the PLATFORM's, copied — same
 * options, same formats, same keywords as headless `useValidation`. A form
 * validated by a default instance passes fields the real app refuses, and
 * nothing says so, so the copy is graded rather than trusted.
 *
 * The oracle is headless's own source. It cannot be imported here (it pulls
 * the localisation module and its transitive graph), so the NAMES are read
 * from its text, following its own two namespace imports; the portal side is
 * read from the live instance, which is what actually validates.
 */

import { createAjv } from "@jsonforms/core";
import ajvErrors from "ajv-errors";
import { describe, expect, it } from "vitest";
import validationSource from "../../../packages/headless/src/utils/useValidation.ts?raw";
import formatsSource from "../../../packages/headless/src/utils/useValidationFormats.ts?raw";
import keywordsSource from "../../../packages/headless/src/utils/useValidationKeywords.ts?raw";
import { difference, map, sortBy, uniq } from "lodash-es";
import type Ajv from "ajv";
import { usePortalAjv } from "~/portal/mock/forms/ajv";

/** Every value a named property is assigned a string literal for, deduped. */
function literalsAssignedTo(source: string, property: string): string[] {
  const found = source.matchAll(
    new RegExp(`\\b${property}:\\s*"([^"]+)"`, "g")
  );
  return sortBy(uniq(map([...found], match => match[1] ?? "")));
}

const HEADLESS_FORMATS = literalsAssignedTo(formatsSource, "name");

const HEADLESS_KEYWORDS = literalsAssignedTo(keywordsSource, "keyword");

/** `createAjv` before the portal touches it — anything beyond this is the copy. */
function platformAjv(): Ajv {
  return createAjv({ useDefaults: true, verbose: false });
}

function registeredFormats(ajv: Ajv): string[] {
  return Object.keys(ajv.formats);
}

function registeredKeywords(ajv: Ajv): string[] {
  return Object.keys(ajv.RULES.keywords);
}

describe("ajv parity — F5: the platform's validator, not a default one", () => {
  it("reads a non-empty oracle out of the modules useValidation itself registers", () => {
    expect(validationSource).toContain(
      'import * as formats from "./useValidationFormats"'
    );
    expect(validationSource).toContain(
      'import * as keywords from "./useValidationKeywords"'
    );
    expect(validationSource).toContain("addFormat(format.name, format)");
    expect(validationSource).toContain("addKeyword(keyword)");
    expect(HEADLESS_FORMATS.length).toBeGreaterThan(0);
    expect(HEADLESS_KEYWORDS.length).toBeGreaterThan(0);
  });

  it("registers exactly the formats headless registers", () => {
    const added = difference(
      registeredFormats(usePortalAjv()),
      registeredFormats(platformAjv())
    );

    expect(sortBy(added)).toEqual(HEADLESS_FORMATS);
  });

  it("registers exactly the keywords headless registers", () => {
    const baseline = platformAjv();
    ajvErrors(baseline, { keepErrors: false, singleError: true });
    const added = difference(
      registeredKeywords(usePortalAjv()),
      registeredKeywords(baseline)
    );

    expect(sortBy(added)).toEqual(HEADLESS_KEYWORDS);
  });

  it("mints one instance — every form validates against the same registrations", () => {
    expect(usePortalAjv()).toBe(usePortalAjv());
  });

  it("takes a valid email address and refuses a malformed one", () => {
    const validate = usePortalAjv().compile({
      type: "object",
      properties: { email: { type: "string", format: "email" } }
    });

    expect(validate({ email: "ada@example.com" })).toBe(true);
    expect(validate({ email: "ada@@example" })).toBe(false);
    expect(map(validate.errors, "keyword")).toEqual(["format"]);
  });

  it("fills an absent field from the schema's own default (useDefaults)", () => {
    const validate = usePortalAjv().compile({
      type: "object",
      properties: { tier: { type: "string", default: "standard" } }
    });
    const model: Record<string, unknown> = {};

    expect(validate(model)).toBe(true);
    expect(model).toEqual({ tier: "standard" });
  });

  it("reports ONE message per field, not a stack of keyword failures", () => {
    const message = "Handle is five or more lowercase letters";
    const validate = usePortalAjv().compile({
      type: "object",
      properties: {
        handle: {
          type: "string",
          minLength: 5,
          pattern: "^[a-z]+$",
          errorMessage: message
        }
      }
    });

    expect(validate({ handle: "A1" })).toBe(false);
    expect(validate.errors).toHaveLength(1);
    expect(validate.errors?.[0]?.message).toBe(message);
    expect(validate.errors?.[0]?.instancePath).toBe("/handle");
  });

  it("keeps errors terse — no schema or data echoed back (verbose: false)", () => {
    const validate = usePortalAjv().compile({
      type: "object",
      required: ["handle"],
      properties: { handle: { type: "string" } }
    });

    validate({});
    const error = validate.errors?.[0];
    expect(error).toBeDefined();
    expect(error).not.toHaveProperty("schema");
    expect(error).not.toHaveProperty("parentSchema");
    expect(error).not.toHaveProperty("data");
  });
});
