// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email action schemas — per-action input schemas (Task 33)
 *
 * ## Job To Be Done
 * Every input-taking collection action (`ensure`, `remove`, `setDefault`,
 * `verify`) resolves a REAL JSON Schema from `useInternals().actionSchemas` —
 * the map the coverage-gate wrapper enumerates to decide "input-taking"
 * (ADR-027 Am.6). A non-input action has NO entry: absence is what "not
 * input-taking" means. Proven against the real composable, and each schema
 * proven real by compiling it with the repo's OWN ajv and exercising its
 * `required`.
 *
 * ## What Breaks If These Fail
 * A missing entry makes an input-taking action read as non-input and skip
 * coverage; a spurious entry makes a query action (`filterBy`/`sortBy`) demand
 * an input schema it has no argument for.
 */

import { describe, expect, it } from "vitest";
import { useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installFilteredEmailsHandler,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import { useValidation } from "../../../utils";
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

type Validator = ((data: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

const INPUT_TAKING = ["ensure", "remove", "setDefault", "verify"] as const;
const NON_INPUT = ["filterBy", "sortBy", "refresh", "invalidate"] as const;

async function bootActionSchemas(): Promise<{
  actionSchemas: Record<string, object | undefined>;
  ajv: { compile: (schema: object) => Validator };
}> {
  const { clientId } = await seedClientSession();
  installFilteredEmailsHandler(server, clientId);
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();

  const internals = emails.useInternals() as unknown as {
    actionSchemas: { value?: unknown } & Record<string, unknown>;
  };
  const actionSchemas = (internals.actionSchemas.value ??
    internals.actionSchemas) as Record<string, object | undefined>;
  const { ajv } = useValidation() as unknown as {
    ajv: { compile: (schema: object) => Validator };
  };
  return { actionSchemas, ajv };
}

// -----------------------------------------------------------------------------

describe("client-email action schemas — the input-taking map (Task 33)", () => {
  it("exposes an entry for exactly the input-taking actions and none other", async () => {
    const { actionSchemas } = await bootActionSchemas();

    expect(Object.keys(actionSchemas).sort()).toEqual([...INPUT_TAKING].sort());
  });

  it("has no entry for a non-input action — absence is the not-input-taking signal", async () => {
    const { actionSchemas } = await bootActionSchemas();

    for (const action of NON_INPUT) {
      expect(actionSchemas[action]).toBeUndefined();
    }
  });

  it("every entry is a real, compilable Draft-07 object schema", async () => {
    const { actionSchemas, ajv } = await bootActionSchemas();

    for (const action of INPUT_TAKING) {
      const schema = actionSchemas[action] as {
        type?: string;
        properties?: object;
      };
      expect(schema, action).toBeTypeOf("object");
      expect(schema.type, action).toBe("object");
      expect(schema.properties, action).toBeTypeOf("object");
      expect(() => ajv.compile(schema), action).not.toThrow();
    }
  });

  it("the id-taking actions require an id; ensure requires an email", async () => {
    const { actionSchemas, ajv } = await bootActionSchemas();

    for (const action of ["remove", "setDefault", "verify"] as const) {
      const validate = ajv.compile(actionSchemas[action] as object);
      expect(
        validate({ id: "20e43579-5e78-d184-430c-31643202d986" }),
        action
      ).toBe(true);
      expect(validate({}), action).toBe(false);
    }

    const ensure = ajv.compile(actionSchemas.ensure as object);
    expect(ensure({ email: "mock-email-1@example.com" })).toBe(true);
    expect(ensure({})).toBe(false);
  });
});
