// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email query schema — the §4a ajv proof (Task 35, S-D9)
 *
 * ## Job To Be Done
 * The collection declares its whole request state as ONE Draft-07 schema
 * (`useContext().schemas.query.schema`). Prove, against the REAL shipped schema
 * and the repo's OWN ajv (`useValidation()` — its formats, keywords and
 * `ajvErrors`, never a fresh instance), that a valid query model passes and
 * that an undeclared filter column, a disallowed operator, a wrong value type,
 * a violated `const` and an empty search each FAIL with the expected ajv
 * keyword — and that a `query` term fails at the root, because this endpoint
 * does not honour one so the schema declares no `query` property (S-D9).
 *
 * Also settles the S-D16 OPEN question by EXECUTION, not argument: does a leaf
 * `const` alone inject a forced filter into an empty model?
 *
 * ## What Breaks If These Fail
 * A schema that admits an undeclared column ships a filter the API 500s on; a
 * schema that admits a `query` property revives the exact live defect Task 39
 * fixed. Green here over a broken schema is the FE-2824 cosplay class.
 */

import { describe, expect, it } from "vitest";
import { useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { seedClientSession } from "./client-email.int-helpers";
import { useValidation } from "../../../utils";
import type { ErrorObject } from "ajv";
import "./setup.integration";

// -----------------------------------------------------------------------------

type Validator = ((data: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

/** The repo's own ajv, and the REAL shipped query schema off the composable. */
async function bootQueryValidator(): Promise<{
  ajv: { compile: (schema: object) => Validator };
  schema: object;
}> {
  await seedClientSession();
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  const schema = (
    emails.useContext() as unknown as {
      schemas: { query: { schema: object } };
    }
  ).schemas.query.schema;
  const { ajv } = useValidation() as unknown as {
    ajv: { compile: (schema: object) => Validator };
  };
  return { ajv, schema };
}

/** The ajv error keywords a model produces against `validate`, or `[]` on pass. */
function keywordsFor(validate: Validator, model: unknown): string[] {
  return validate(model)
    ? []
    : (validate.errors ?? []).map(error => error.keyword);
}

// -----------------------------------------------------------------------------

describe("client-email query schema — §4a ajv proof (Task 35)", () => {
  it("accepts a valid query model", async () => {
    const { ajv, schema } = await bootQueryValidator();
    const validate = ajv.compile(schema);

    expect(validate({ filters: { email: { like: "nathan" } } })).toBe(true);
    expect(validate({ sort: [{ field: "created_at", dir: "desc" }] })).toBe(
      true
    );
    expect(validate({ pagination: { limit: 0, offset: 0 } })).toBe(true);
  });

  it("rejects an undeclared filter column with additionalProperties", async () => {
    const { ajv, schema } = await bootQueryValidator();
    const validate = ajv.compile(schema);

    const keywords = keywordsFor(validate, {
      filters: { title: { like: "x" } }
    });
    expect(keywords).toContain("additionalProperties");
  });

  it("rejects a disallowed operator with additionalProperties", async () => {
    const { ajv, schema } = await bootQueryValidator();
    const validate = ajv.compile(schema);

    const keywords = keywordsFor(validate, { filters: { email: { eq: "x" } } });
    expect(keywords).toContain("additionalProperties");
  });

  it("rejects a wrong value type with type", async () => {
    const { ajv, schema } = await bootQueryValidator();
    const validate = ajv.compile(schema);

    const keywords = keywordsFor(validate, {
      filters: { email: { like: 123 } }
    });
    expect(keywords).toContain("type");
  });

  it("rejects a violated const on a tri-state filter with const", async () => {
    const { ajv, schema } = await bootQueryValidator();
    const validate = ajv.compile(schema);

    const keywords = keywordsFor(validate, {
      filters: { verified: { eq: 1 } }
    });
    expect(keywords).toContain("const");
  });

  it("rejects an empty search term with minLength", async () => {
    const { ajv, schema } = await bootQueryValidator();
    const validate = ajv.compile(schema);

    const keywords = keywordsFor(validate, {
      filters: { email: { like: "" } }
    });
    expect(keywords).toContain("minLength");
  });

  it("declares no query property — a search term fails at the root (S-D9)", async () => {
    const { ajv, schema } = await bootQueryValidator();
    const validate = ajv.compile(schema);

    expect(validate({ query: "nathan" })).toBe(false);
    const rootErrors = (validate.errors ?? []).filter(
      error =>
        error.instancePath === "" && error.keyword === "additionalProperties"
    );
    expect(rootErrors.length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// S-D16 / FP-7 — settled by EXECUTION against the repo's ajv (useDefaults:true).
//
// The OPEN question (review-notes S-D16): does a leaf `const` alone inject a
// forced filter into an empty model? The operator's position was "yes — we
// already use this"; the council found "no — `default` must materialise it".
// The block below is the settlement transcript, not an argument.
// -----------------------------------------------------------------------------

describe("client-email query schema — S-D16 forced-filter injection (FP-7)", () => {
  const leafConstOnly = {
    type: "object",
    properties: {
      provision_blueprint: {
        type: "object",
        properties: {
          category: {
            type: "object",
            properties: {
              code: {
                type: "object",
                properties: { neq: { const: "domain_names" } }
              }
            }
          }
        }
      }
    }
  };

  const parentDefaultChain = {
    type: "object",
    properties: {
      provision_blueprint: {
        type: "object",
        default: {},
        properties: {
          category: {
            type: "object",
            default: {},
            properties: {
              code: {
                type: "object",
                default: {},
                properties: { neq: { const: "domain_names" } }
              }
            }
          }
        }
      }
    }
  };

  const overridableForcedLeaf = {
    type: "object",
    properties: {
      verified: {
        type: "object",
        default: {},
        properties: { eq: { type: "boolean", default: true } }
      }
    }
  };

  const lockedLeaf = {
    type: "object",
    properties: {
      verified: { type: "object", properties: { eq: { const: true } } }
    }
  };

  it("EXECUTED SETTLEMENT: a leaf `const` alone injects NOTHING — the operator's position is falsified", async () => {
    const { ajv } = await bootQueryValidator();
    const model: Record<string, unknown> = {};
    ajv.compile(leafConstOnly)(model);

    // Operator's position ("const alone injects") — falsified by execution.
    expect(model).toEqual({});
  });

  it("a parent-object `default` materialises the branch but still not the leaf value", async () => {
    const { ajv } = await bootQueryValidator();
    const model: Record<string, unknown> = {};
    ajv.compile(parentDefaultChain)(model);

    expect(model).toEqual({ provision_blueprint: { category: { code: {} } } });
  });

  it("only a `default` ON THE LEAF injects — the forced-but-overridable form (S-D16)", async () => {
    const { ajv } = await bootQueryValidator();
    const model: Record<string, unknown> = {};
    ajv.compile(overridableForcedLeaf)(model);

    expect(model).toEqual({ verified: { eq: true } });
  });

  it("`default` alone is overridable — a different user value survives validation", async () => {
    const { ajv } = await bootQueryValidator();
    const validate = ajv.compile(overridableForcedLeaf);

    expect(validate({ verified: { eq: false } })).toBe(true);
  });

  it("`const` locks — a different user value is rejected", async () => {
    const { ajv } = await bootQueryValidator();
    const validate = ajv.compile(lockedLeaf);

    const keywords = keywordsFor(validate, { verified: { eq: false } });
    expect(keywords).toContain("const");
  });
});
