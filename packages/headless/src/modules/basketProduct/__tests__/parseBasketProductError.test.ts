// -----------------------------------------------------------------------------
/**
 * @fileoverview External Error Mapping Tests — parseBasketProductError
 *
 * ## Job To Be Done
 * Verify that API errors returned from the basket endpoint are correctly
 * parsed by `parseBasketProductError()` into AJV-compatible `ErrorObject[]`
 * with `instancePath` values that match the product config schema property
 * paths. This ensures `ConfigErrors.vue` displays each error against the
 * correct form control.
 *
 * ## What Breaks If These Fail
 * If an API error for `billing_cycle_months` is not mapped to `/term`, the
 * error banner will not scroll the user to the term selector. If provision
 * field errors are not mapped to `/provisionFields/{key}`, required domain
 * fields will appear valid while the API rejects the order.
 */

import { describe, it, expect, vi } from "vitest";

// --- utils
import {
  compact,
  filter,
  join,
  reduce,
  set,
  size,
  split,
  take,
  trimStart
} from "lodash-es";

// -----------------------------------------------------------------------------
// Mocks — all vi.mock calls must be at the top of the test file to be hoisted
// Path resolution: relative to this test file at src/modules/basketProduct/__tests__/
//   ../..      = src/modules/ (modules barrel)
//   ../../..   = src/ (headless src root)
//
// unflattenErrors note: the real unflattenErrors uses [] as reduce accumulator,
// causing isEmpty([]) === true even when string properties are attached (lodash
// isEmpty checks arr.length, not own string keys). Tests use a plain-object
// reduce with {} accumulator to correctly unflatten dot-notation keys.

vi.mock("@sentry/vue", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

// useCookies is called at module level — mock before any modules load
vi.mock("../../../utils/useCookies", () => ({
  useCookies: vi.fn(() => ({
    removeTopLevel: vi.fn(),
    setTopLevel: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }))
}));

// Mock the modules barrel — this is the primary guard.
// basketProduct/utils.ts imports brand, system, feedback via '../brand', '../system',
// which resolve through the modules barrel. Mocking "../.." prevents the entire
// module graph (including session machines with useCookies, useUpmind) from loading.
vi.mock("../..", () => ({
  useI18n: () => ({
    t: vi.fn((key: string) => key),
    tm: vi.fn()
  }),
  useSystem: () => ({
    getBillingCycle: vi.fn(() => ({})),
    getCountry: vi.fn(() => ({ code: "US" }))
  }),
  useBrand: () => ({
    includesTax: { value: false },
    getConfigValue: vi.fn()
  }),
  useFeedback: vi.fn(() => ({ add: vi.fn(), addError: vi.fn() })),
  useTranslateName: vi.fn((obj: any) => obj?.name ?? ""),
  useProductName: vi.fn(() => ""),
  useUischemaTitle: vi.fn(() => ""),
  parseProductDetails: vi.fn(() => ({})),
  parseBasketProductModel: vi.fn(() => ({})),
  parseSubproductDetails: vi.fn(() => []),
  invalidateQueryByKey: vi.fn(),
  useQuery: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    queryClient: {},
    useUrl: vi.fn((path: string) => path)
  }))
}));

// -----------------------------------------------------------------------------
// Inline toControlId — mirrors ConfigErrors.vue implementation
// Used to verify that parsed errors map to the correct jsonforms control IDs

function toControlId(error: {
  instancePath: string;
  keyword?: string;
  params?: any;
}): string {
  let path = trimStart(error.instancePath, "/");
  if (error.keyword === "required" && error.params?.missingProperty) {
    path = path
      ? `${path}/${error.params.missingProperty}`
      : error.params.missingProperty;
  }
  const segments = compact(split(path, "/"));
  const truncated = take(segments, 2);
  return `##/properties/${join(truncated, "/properties/")}`;
}

// -----------------------------------------------------------------------------
// Fixture data — loaded from real API recordings

import allFieldsFixture from "../../../../../../tests/__fixtures__/recordings/post-orders-03679424-products-error-allfields-a1b2c3d4.json";
import quantityOptionsFixture from "../../../../../../tests/__fixtures__/recordings/post-orders-03679424-products-error-quantityoptions-e5f6a7b8.json";

// -----------------------------------------------------------------------------

describe("parseBasketProductError — fixture: all-fields error", () => {
  it("parses quantity, options, and attributes errors from fixture", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = (allFieldsFixture as any).error.data;
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    // Should parse: quantity + 2x options + attributes = at minimum 4 errors
    expect(size(errors)).toBeGreaterThanOrEqual(4);

    // Every parsed error must be marked as external
    const nonExternal = filter(errors, e => !(e as any).external);
    expect(size(nonExternal)).toBe(0);
  });

  it("maps quantity error to /quantity with correct message", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = (allFieldsFixture as any).error.data;
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    const qtyErrors = filter(errors, e => e.instancePath === "/quantity");
    expect(size(qtyErrors)).toBe(1);
    expect(qtyErrors[0].message).toBe("The value must be at least 1.");
    expect((qtyErrors[0] as any).external).toBe(true);
    expect(toControlId(qtyErrors[0])).toBe("##/properties/quantity");
  });

  it("maps options errors to /options with correct messages", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = (allFieldsFixture as any).error.data;
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    const optErrors = filter(errors, e => e.instancePath === "/options");
    // Both options.0.product_id and options.0.unit_quantity map to /options
    expect(size(optErrors)).toBe(2);
    const messages = optErrors.map(e => e.message);
    expect(messages).toContain(
      "The identifier (options.0.product_id) is invalid!"
    );
    expect(messages).toContain("The value must be at least 1.");

    // Every options error must link to the options control
    optErrors.forEach(e => {
      expect(toControlId(e)).toBe("##/properties/options");
    });
  });

  it("maps attributes errors to /attributes with correct message", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = (allFieldsFixture as any).error.data;
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    const attrErrors = filter(errors, e => e.instancePath === "/attributes");
    expect(size(attrErrors)).toBe(1);
    expect(attrErrors[0].message).toBe(
      "The identifier (attributes.0.product_id) is invalid!"
    );
    expect((attrErrors[0] as any).external).toBe(true);
    expect(toControlId(attrErrors[0])).toBe("##/properties/attributes");
  });
});

// -----------------------------------------------------------------------------

describe("parseBasketProductError — fixture: quantity + options only", () => {
  it("parses quantity and options errors but no attributes", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = (quantityOptionsFixture as any).error.data;
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    // quantity (1) + options (2: product_id + unit_quantity)
    expect(size(errors)).toBe(3);

    const qtyErrors = filter(errors, e => e.instancePath === "/quantity");
    expect(size(qtyErrors)).toBe(1);

    const optErrors = filter(errors, e => e.instancePath === "/options");
    expect(size(optErrors)).toBe(2);

    // No attributes errors in this fixture
    const attrErrors = filter(errors, e => e.instancePath === "/attributes");
    expect(size(attrErrors)).toBe(0);
  });

  it("all errors are marked external=true", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = (quantityOptionsFixture as any).error.data;
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    errors.forEach(e => {
      expect((e as any).external).toBe(true);
    });
  });
});

// -----------------------------------------------------------------------------

describe("parseBasketProductError — synthetic: billing_cycle_months → /term", () => {
  it("maps billing_cycle_months error to instancePath /term", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = {
      billing_cycle_months: ["Not available."]
    };
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    expect(size(errors)).toBe(1);
    expect(errors[0].instancePath).toBe("/term");
    expect(errors[0].message).toBe("Not available.");
    expect((errors[0] as any).external).toBe(true);
    expect(toControlId(errors[0])).toBe("##/properties/term");
  });
});

// -----------------------------------------------------------------------------

describe("parseBasketProductError — synthetic: provision field errors", () => {
  it("maps provision_field_values.hostname → /provisionFields/hostname", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = {
      "provision_field_values.hostname": ["Required."],
      "provision_field_values.domain": ["Required."]
    };
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    expect(size(errors)).toBe(2);

    const hostnameError = filter(
      errors,
      e => e.instancePath === "/provisionFields/hostname"
    );
    expect(size(hostnameError)).toBe(1);
    expect(hostnameError[0].message).toBe("Required.");
    expect((hostnameError[0] as any).external).toBe(true);
    expect(toControlId(hostnameError[0])).toBe(
      "##/properties/provisionFields/properties/hostname"
    );

    const domainError = filter(
      errors,
      e => e.instancePath === "/provisionFields/domain"
    );
    expect(size(domainError)).toBe(1);
    expect(domainError[0].message).toBe("Required.");
    expect(toControlId(domainError[0])).toBe(
      "##/properties/provisionFields/properties/domain"
    );
  });
});

// -----------------------------------------------------------------------------

describe("parseBasketProductError — synthetic: multiple option errors", () => {
  it("maps all options array errors to /options", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = {
      "options.0.product_id": ["Invalid!"],
      "options.0.unit_quantity": ["Too low."],
      "options.1.product_id": ["Invalid!"]
    };
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    // All three fields roll up to /options
    const optErrors = filter(errors, e => e.instancePath === "/options");
    expect(size(optErrors)).toBe(3);

    optErrors.forEach(e => {
      expect((e as any).external).toBe(true);
      expect(toControlId(e)).toBe("##/properties/options");
    });
  });
});

// -----------------------------------------------------------------------------

describe("parseBasketProductError — synthetic: multiple attribute errors", () => {
  it("maps all attributes array errors to /attributes", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = {
      "attributes.0.product_id": ["Invalid!"],
      "attributes.1.product_id": ["Invalid!"]
    };
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    const attrErrors = filter(errors, e => e.instancePath === "/attributes");
    expect(size(attrErrors)).toBe(2);

    attrErrors.forEach(e => {
      expect((e as any).external).toBe(true);
      expect(toControlId(e)).toBe("##/properties/attributes");
    });
  });
});

// -----------------------------------------------------------------------------

describe("parseBasketProductError — synthetic: mixed all sections", () => {
  it("parses all sections and returns correct total + per-section counts", async () => {
    const { parseBasketProductError } = await import("../utils");

    const rawData = {
      quantity: ["Too low."],
      billing_cycle_months: ["Invalid cycle."],
      "options.0.product_id": ["Invalid option!"],
      "attributes.0.product_id": ["Invalid attribute!"],
      "provision_field_values.ns1": ["Required."],
      "provision_field_values.ns2": ["Required."]
    };
    const unflattened = reduce(
      rawData as Record<string, any>,
      (result: Record<string, any>, value, key) => set(result, key, value),
      {} as Record<string, any>
    );
    const errors = parseBasketProductError(unflattened);

    // 1 quantity + 1 term + 1 options + 1 attributes + 2 provisionFields = 6
    expect(size(errors)).toBe(6);

    expect(size(filter(errors, e => e.instancePath === "/quantity"))).toBe(1);
    expect(size(filter(errors, e => e.instancePath === "/term"))).toBe(1);
    expect(size(filter(errors, e => e.instancePath === "/options"))).toBe(1);
    expect(size(filter(errors, e => e.instancePath === "/attributes"))).toBe(1);
    expect(
      size(filter(errors, e => e.instancePath.startsWith("/provisionFields/")))
    ).toBe(2);
  });
});

// -----------------------------------------------------------------------------

describe("parseBasketProductError — edge cases: empty/nil input", () => {
  it("returns empty array for undefined input", async () => {
    const { parseBasketProductError } = await import("../utils");
    const errors = parseBasketProductError(undefined);
    expect(errors).toEqual([]);
  });

  it("returns empty array for empty object input", async () => {
    const { parseBasketProductError } = await import("../utils");
    const errors = parseBasketProductError({});
    expect(errors).toEqual([]);
  });

  it("returns empty array for null input", async () => {
    const { parseBasketProductError } = await import("../utils");
    const errors = parseBasketProductError(null);
    expect(errors).toEqual([]);
  });
});
