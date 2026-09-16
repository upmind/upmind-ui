// -----------------------------------------------------------------------------
/**
 * @fileoverview useModelParser — `allowEmpty` keeps an emptied value empty
 *
 * ## Job To Be Done
 * The parser merges the model with a base model (the server's copy) and with
 * the schema defaults. A user who removes a selection leaves an empty object
 * behind, and both of those sources fill it back in. `allowEmpty` tells the
 * parser that an empty object or array is a removal, not a gap.
 *
 * ## What Breaks If These Fail
 * A removed subproduct comes back selected after the basket refreshes, and
 * saves itself again on the next update.
 */

import { describe, it, expect, vi } from "vitest";
// -----------------------------------------------------------------------------
import { useModelParser } from "../useValidation";

// -----------------------------------------------------------------------------
// Mocks — must be declared before any imports that trigger module loading

vi.mock("../../modules/system", () => ({
  useI18n: () => ({
    t: vi.fn((key: string) => key),
    tm: vi.fn()
  })
}));

// the package entry builds an Upmind instance on import
vi.mock("../../modules", () => ({
  useQuery: vi.fn(() => ({ queryClient: {} }))
}));

vi.mock("@sentry/vue", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

const CATEGORY_ID = "cat-privacy";
const VALUE_ID = "opt-whois";

const selection = { [VALUE_ID]: { productId: VALUE_ID, quantity: 1 } };

// mirrors the product config schema: named categories, free-form values
const schema = {
  type: "object",
  properties: {
    options: {
      type: "object",
      properties: {
        [CATEGORY_ID]: {
          type: ["object", "null"],
          additionalProperties: true,
          default: selection
        }
      }
    }
  }
};

// -----------------------------------------------------------------------------

describe("useModelParser — allowEmpty", () => {
  it("refills an emptied value from the base model by default", () => {
    const model = useModelParser(
      undefined,
      { options: { [CATEGORY_ID]: {} } },
      { options: { [CATEGORY_ID]: selection } }
    );

    expect(model.options[CATEGORY_ID]).toEqual(selection);
  });

  it("keeps an emptied value empty when allowEmpty is on", () => {
    const model = useModelParser(
      undefined,
      { options: { [CATEGORY_ID]: {} } },
      { options: { [CATEGORY_ID]: selection } },
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.options[CATEGORY_ID]).toEqual({});
  });

  it("keeps an emptied array empty when allowEmpty is on", () => {
    const model = useModelParser(
      undefined,
      { options: { [CATEGORY_ID]: [] } },
      { options: { [CATEGORY_ID]: ["SAVE10"] } },
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.options[CATEGORY_ID]).toEqual([]);
  });

  it("fills the gaps inside a selection the user kept", () => {
    const model = useModelParser(
      undefined,
      { options: { [CATEGORY_ID]: { [VALUE_ID]: { productId: VALUE_ID } } } },
      {
        options: {
          [CATEGORY_ID]: { [VALUE_ID]: { productId: VALUE_ID, cycle: 12 } }
        }
      },
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.options[CATEGORY_ID][VALUE_ID].cycle).toBe(12);
  });

  it("treats an empty top level group as nothing set, not a removal", () => {
    const model = useModelParser(
      undefined,
      { options: {} },
      { options: { [CATEGORY_ID]: selection } },
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.options[CATEGORY_ID]).toEqual(selection);
  });

  it("still merges the base model into the keys the user kept", () => {
    const model = useModelParser(
      undefined,
      { options: { [CATEGORY_ID]: {} }, quantity: undefined },
      { options: { "cat-backups": selection }, quantity: 3 },
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.options["cat-backups"]).toEqual(selection);
    expect(model.quantity).toBe(3);
  });

  it("blocks the base model and the schema default together", () => {
    // the base model must carry the selection, or the schema default is the only
    // thing under test and the option makes no difference
    const model = useModelParser(
      schema,
      { options: { [CATEGORY_ID]: {} } },
      { options: { [CATEGORY_ID]: selection } },
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.options[CATEGORY_ID]).toEqual({});
  });

  it("applies the schema default to a value the user never set", () => {
    const model = useModelParser(
      schema,
      { options: {} },
      {},
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.options[CATEGORY_ID]).toEqual(selection);
  });

  it("leaves the caller's base model untouched", () => {
    const baseModel = {
      options: {
        [CATEGORY_ID]: { [VALUE_ID]: { productId: VALUE_ID, quantity: 1 } }
      }
    };

    useModelParser(undefined, { options: { [CATEGORY_ID]: {} } }, baseModel, {
      allowExtraProps: true,
      allowEmpty: ["options"]
    });

    // compare against a fresh literal: `selection` is the object the base model
    // holds, so asserting against it would compare it with itself and miss an
    // edit made in place
    expect(baseModel).toEqual({
      options: {
        [CATEGORY_ID]: { [VALUE_ID]: { productId: VALUE_ID, quantity: 1 } }
      }
    });
  });

  it("refills a group the caller did not name", () => {
    // an empty list is only a removal where the caller says so; elsewhere it is
    // a gap the base model is there to fill
    const model = useModelParser(
      undefined,
      {
        options: { [CATEGORY_ID]: {} },
        provisionFields: { nameservers: [] }
      },
      {
        options: { [CATEGORY_ID]: selection },
        provisionFields: { nameservers: ["ns1.example.com"] }
      },
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.options[CATEGORY_ID]).toEqual({});
    expect(model.provisionFields.nameservers).toEqual(["ns1.example.com"]);
  });

  it("keeps extra props when both flags are passed", () => {
    const model = useModelParser(
      schema,
      { options: {}, note: "keep me" },
      {},
      { allowExtraProps: true, allowEmpty: ["options"] }
    );

    expect(model.note).toBe("keep me");
  });
});
