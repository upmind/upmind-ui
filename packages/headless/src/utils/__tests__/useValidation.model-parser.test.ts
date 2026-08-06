// -----------------------------------------------------------------------------
/**
 * @fileoverview useModelParser — the `preserveContainers` option (unit)
 *
 * ## Job To Be Done
 * `useModelParser` is the ONE schema-walking parser 14 modules already call; it
 * compacted with containers hard-preserved, so an emptied `{ email: {} }` or a
 * cleared `[]` survived the parse. The operator ruling (FB5a) surfaced the
 * option `compactDeep` already had instead of letting a module hand-roll its own
 * pruner. Prove the extension both ways: OMITTED behaves exactly as before — the
 * 14 shipped call sites are untouched — and `false` strips the empty container
 * so an absent key can take the schema's `default` on the next parse.
 *
 * The schema here is a SPECIMEN — the parser's input under test, not response
 * data. The same behaviour against the REAL shipped client-email query schema is
 * proven through the composable in
 * `modules/client-email/__tests__/translate-query.int.test.ts`.
 *
 * ## What Breaks If These Fail
 * A default that is not `true` silently changes all 14 call sites (a filter bag
 * that used to keep its shape starts collapsing mid-form); a `false` that does
 * not reach both `compactDeep` calls leaves the emptied container on the wire as
 * the stale `filter[…]` param the ruling deleted `pruneQuery` to stop.
 */

import { describe, expect, it } from "vitest";
import { useModelParser } from "../useValidation";
import type { JsonSchema7 } from "@jsonforms/core";

// -----------------------------------------------------------------------------

type Specimen = {
  filters?: { email?: { like?: string } };
  sort?: { field: string; dir: string }[];
};

const SORT_DEFAULT = [{ field: "created_at", dir: "desc" }];

/** A nested-container schema with a defaulted array — the two shapes at issue. */
const specimen = {
  type: "object",
  additionalProperties: false,
  properties: {
    filters: {
      type: "object",
      additionalProperties: false,
      properties: {
        email: {
          type: "object",
          additionalProperties: false,
          properties: { like: { type: "string" } }
        }
      }
    },
    sort: {
      type: "array",
      default: SORT_DEFAULT,
      items: { type: "object" }
    }
  }
} as JsonSchema7;

function parse(
  values: Partial<Specimen>,
  options?: { preserveContainers?: boolean; allowExtraProps?: boolean },
  baseModel?: Partial<Specimen>
): Specimen | undefined {
  return useModelParser<Specimen>(specimen, values, baseModel, options);
}

// -----------------------------------------------------------------------------

describe("useModelParser — preserveContainers defaults to true (FB5a)", () => {
  it("keeps an emptied object container when the option is omitted", () => {
    expect(parse({ filters: { email: {} } })).toEqual({
      filters: { email: {} },
      sort: SORT_DEFAULT
    });
  });

  it("keeps a cleared array when the option is omitted", () => {
    expect(parse({ sort: [] })?.sort).toEqual([]);
  });

  it("an explicit true is identical to omitting it — the 14 call sites are untouched", () => {
    expect(
      parse({ filters: { email: {} } }, { preserveContainers: true })
    ).toEqual(parse({ filters: { email: {} } }));
  });

  it("keeps an emptied container reached through baseModel when omitted", () => {
    expect(parse({}, undefined, { filters: { email: {} } })).toEqual({
      filters: { email: {} },
      sort: SORT_DEFAULT
    });
  });
});

describe("useModelParser — preserveContainers false strips empty containers", () => {
  it("strips an emptied object container", () => {
    expect(
      parse({ filters: { email: {} } }, { preserveContainers: false })
    ).toEqual({ sort: SORT_DEFAULT });
  });

  it("leaves a live sibling value alone", () => {
    expect(
      parse(
        { filters: { email: { like: "x" } } },
        { preserveContainers: false }
      )
    ).toEqual({ filters: { email: { like: "x" } }, sort: SORT_DEFAULT });
  });

  it("reaches the baseModel branch too — both compactDeep calls are threaded", () => {
    expect(
      parse({}, { preserveContainers: false }, { filters: { email: {} } })
    ).toEqual({ sort: SORT_DEFAULT });
  });

  it("strips a cleared array so the next parse takes the schema default (FB5e)", () => {
    expect(parse({ sort: [] }, { preserveContainers: false })).toBeUndefined();
    expect(parse({}, { preserveContainers: false })).toEqual({
      sort: SORT_DEFAULT
    });
  });

  it("still drops an undeclared key under allowExtraProps false", () => {
    expect(
      parse({ filters: { title: { like: "x" } } } as Partial<Specimen>, {
        preserveContainers: false,
        allowExtraProps: false
      })
    ).toEqual({ sort: SORT_DEFAULT });
  });
});
