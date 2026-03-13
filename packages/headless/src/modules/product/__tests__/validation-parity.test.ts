// -----------------------------------------------------------------------------
/**
 * @fileoverview Product Config Schema Validation Tests
 *
 * ## Job To Be Done
 * Verify that the AJV schema-based validation catches all invalid product
 * configurations — quantity, term, options, and attributes. These tests
 * replaced the deprecated `check*` functions after proving full parity.
 *
 * ## What Breaks If These Fail
 * Invalid orders will reach the API and be rejected at checkout — a
 * user-facing error that is hard to debug.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- utils
import { filter, size } from "lodash-es";

// -----------------------------------------------------------------------------
// Mocks — must be declared before any imports that trigger module loading

vi.mock("../../../utils/useCookies", () => ({
  useCookies: vi.fn(() => ({
    removeTopLevel: vi.fn(),
    setTopLevel: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }))
}));

vi.mock("@sentry/vue", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

vi.mock("../../system", () => ({
  useI18n: () => ({
    t: vi.fn((key: string, params?: any) => {
      if (key === "text.quantity") return "Quantity";
      if (key === "text.billing_cycle") return "Billing Cycle";
      if (key === "term.label") return "Term";
      if (params?.title) return `${params.title}: ${key}`;
      return key;
    }),
    tm: vi.fn()
  }),
  useSystem: () => ({
    getBillingCycle: vi.fn(() => ({})),
    getCountry: vi.fn(() => ({ code: "US" }))
  }),
  useDataLayer: () => ({ push: vi.fn() }),
  useLocale: () => ({ locale: { value: "en" }, setLocale: vi.fn() })
}));

vi.mock("../../brand", () => ({
  useBrand: () => ({
    includesTax: { value: false },
    getConfigValue: vi.fn()
  })
}));

vi.mock("../../config/useConfig", () => ({
  useConfig: () => ({
    getConfigValue: vi.fn()
  })
}));

vi.mock("../../config", () => ({
  UIContext: {}
}));

vi.mock("../../query", () => ({
  useQuery: vi.fn(() => ({
    queryClient: {},
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
    useUrl: vi.fn((path: string) => path)
  }))
}));

vi.mock("../../", () => ({
  default: {
    storefrontUrl: undefined,
    queryClient: {},
    use: vi.fn()
  },
  invalidateQueryByKey: vi.fn(),
  useQuery: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
    queryClient: {},
    useUrl: vi.fn((path: string) => path)
  }))
}));

// -----------------------------------------------------------------------------

describe("Schema Validation — Quantity", () => {
  let useProductConfigSchema: typeof import("../schemas").useProductConfigSchema;
  let useValidation: typeof import("../../../utils/useValidation").useValidation;

  beforeEach(async () => {
    const schemas = await import("../schemas");
    const validation = await import("../../../utils/useValidation");

    useProductConfigSchema = schemas.useProductConfigSchema;
    useValidation = validation.useValidation;
  });

  function makeQuantityContext(
    min = 1,
    max: number | undefined = 10,
    step: number | undefined = 2
  ) {
    return {
      id: "test",
      baseModel: { productId: "prod-1", quantity: 1 },
      lookups: {
        product: {
          id: "prod-1",
          name: "Test Product",
          title: "Test Product",
          brand: "test",
          categoryId: "cat-1",
          category: "Cat",
          cycle: 0,
          quantifiable: true,
          quantity: min,
          step: step ?? 1,
          min,
          max: max ?? Infinity
        }
      }
    } as any;
  }

  it("rejects quantity below minimum (min=1, value=0)", () => {
    const ctx = makeQuantityContext(1, 10, 2);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, { productId: "prod-1", quantity: 0 });
    const qtyErrors = filter(errors, e => e.instancePath === "/quantity");
    expect(size(qtyErrors)).toBeGreaterThan(0);
  });

  it("rejects quantity above maximum (max=10, value=100)", () => {
    const ctx = makeQuantityContext(1, 10, 2);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, { productId: "prod-1", quantity: 100 });
    const qtyErrors = filter(errors, e => e.instancePath === "/quantity");
    expect(size(qtyErrors)).toBeGreaterThan(0);
  });

  it("rejects quantity violating step (step=2, value=3)", () => {
    const ctx = makeQuantityContext(1, 10, 2);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, { productId: "prod-1", quantity: 3 });
    const qtyErrors = filter(errors, e => e.instancePath === "/quantity");
    expect(size(qtyErrors)).toBeGreaterThan(0);
    expect(qtyErrors[0].keyword).toBe("multipleOf");
  });

  it("rejects non-numeric quantity ('abc')", () => {
    const ctx = makeQuantityContext(1, 10, 2);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, { productId: "prod-1", quantity: "abc" });
    const qtyErrors = filter(errors, e => e.instancePath === "/quantity");
    expect(size(qtyErrors)).toBeGreaterThan(0);
  });

  it("fills schema default for undefined quantity (AJV useDefaults:true)", () => {
    const ctx = makeQuantityContext(1, 10, 2);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: undefined
    });
    // AJV fills default=1 which satisfies minimum:1 — no quantity errors
    const qtyErrors = filter(errors, e => e.instancePath === "/quantity");
    expect(size(qtyErrors)).toBe(0);
  });

  it("accepts a valid quantity (value=4, step=2, min=1, max=10)", () => {
    const ctx = makeQuantityContext(1, 10, 2);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, { productId: "prod-1", quantity: 4 });
    const qtyErrors = filter(errors, e => e.instancePath === "/quantity");
    expect(size(qtyErrors)).toBe(0);
  });
});

// -----------------------------------------------------------------------------

describe("Schema Validation — Term", () => {
  let useProductConfigSchema: typeof import("../schemas").useProductConfigSchema;
  let useValidation: typeof import("../../../utils/useValidation").useValidation;

  function makeTerm(cycle: number, title: string): any {
    return {
      id: `term-${cycle}`,
      name: title,
      title,
      cycle,
      meta: {},
      price: {
        currentAmount: 0,
        currentPrice: "$0",
        regularAmount: 0,
        regularPrice: "$0",
        savingAmount: 0,
        savingPrice: "$0",
        savingPercent: "0%"
      }
    };
  }

  function makeTermContext() {
    return {
      id: "test",
      baseModel: { productId: "prod-1", quantity: 1 },
      lookups: {
        product: {
          id: "prod-1",
          name: "Test Product",
          title: "Test Product",
          brand: "test",
          categoryId: "cat-1",
          category: "Cat",
          cycle: 1,
          quantifiable: false,
          quantity: 1,
          step: 1,
          min: 1,
          max: Infinity
        },
        terms: [makeTerm(1, "Monthly"), makeTerm(12, "Annual")]
      }
    } as any;
  }

  beforeEach(async () => {
    const schemas = await import("../schemas");
    const validation = await import("../../../utils/useValidation");

    useProductConfigSchema = schemas.useProductConfigSchema;
    useValidation = validation.useValidation;
  });

  it("rejects invalid term cycle (99 not in [1,12])", () => {
    const ctx = makeTermContext();
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      term: 99
    });
    const termErrors = filter(errors, e => e.instancePath === "/term");
    expect(size(termErrors)).toBeGreaterThan(0);
    expect(termErrors[0].keyword).toBe("enum");
  });

  it("rejects term=0 when no 0-cycle term exists", () => {
    const ctx = makeTermContext();
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      term: 0
    });
    const termErrors = filter(errors, e => e.instancePath === "/term");
    expect(size(termErrors)).toBeGreaterThan(0);
  });

  it("fills schema default for undefined term (AJV useDefaults:true)", () => {
    const ctx = makeTermContext();
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, { productId: "prod-1", quantity: 1 });
    // AJV fills default cycle from calculateBillingTerm — no error
    const termErrors = filter(
      errors,
      e =>
        e.instancePath === "/term" ||
        (e.keyword === "required" && e.params?.missingProperty === "term")
    );
    expect(size(termErrors)).toBe(0);
  });

  it("accepts a valid term (cycle=1)", () => {
    const ctx = makeTermContext();
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      term: 1
    });
    const termErrors = filter(errors, e => e.instancePath === "/term");
    expect(size(termErrors)).toBe(0);
  });
});

// -----------------------------------------------------------------------------

describe("Schema Validation — Options (subproducts)", () => {
  let useProductConfigSchema: typeof import("../schemas").useProductConfigSchema;
  let useValidation: typeof import("../../../utils/useValidation").useValidation;

  const CAT_ID = "cat-opt-1";
  const PROD_US = "prod-loc-us";
  const PROD_EU = "prod-loc-eu";

  function makeSubproductValue(id: string, name: string): any {
    return {
      id,
      name,
      title: name,
      brand: "test",
      categoryId: CAT_ID,
      category: "Options",
      cycle: 0,
      quantifiable: false,
      quantity: 1,
      step: 1,
      min: 1,
      max: Infinity,
      order: 0,
      meta: {}
    };
  }

  function makeOptionsContext(required = true, multiple = false): any {
    return {
      id: "test",
      baseModel: { productId: "prod-1", quantity: 1 },
      lookups: {
        product: {
          id: "prod-1",
          name: "Test Product",
          title: "Test Product",
          brand: "test",
          categoryId: "cat-main",
          category: "Cat",
          cycle: 0,
          quantifiable: false,
          quantity: 1,
          step: 1,
          min: 1,
          max: Infinity
        },
        options: [
          {
            id: CAT_ID,
            name: "server_location",
            title: "Server Location",
            meta: { required, multiple, overrides: false },
            values: [
              makeSubproductValue(PROD_US, "US East"),
              makeSubproductValue(PROD_EU, "EU West")
            ]
          }
        ]
      }
    };
  }

  beforeEach(async () => {
    const schemas = await import("../schemas");
    const validation = await import("../../../utils/useValidation");

    useProductConfigSchema = schemas.useProductConfigSchema;
    useValidation = validation.useValidation;
  });

  it("rejects missing required option group", () => {
    const ctx = makeOptionsContext(true, false);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      options: {}
    });
    const optErrors = filter(
      errors,
      e =>
        e.instancePath.startsWith("/options") ||
        (e.keyword === "required" && e.params?.missingProperty === CAT_ID)
    );
    expect(size(optErrors)).toBeGreaterThan(0);
  });

  it("rejects invalid product ID in option", () => {
    const ctx = makeOptionsContext(true, false);
    const invalidId = "bad-uuid-xxxx";
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      options: {
        [CAT_ID]: {
          [invalidId]: { productId: invalidId, cycle: 0, quantity: 1 }
        }
      }
    });
    const optErrors = filter(errors, e =>
      e.instancePath.startsWith(`/options/${CAT_ID}`)
    );
    expect(size(optErrors)).toBeGreaterThan(0);
  });

  it("rejects too many selections when multiple=false", () => {
    const ctx = makeOptionsContext(true, false);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      options: {
        [CAT_ID]: {
          [PROD_US]: { productId: PROD_US, cycle: 0, quantity: 1 },
          [PROD_EU]: { productId: PROD_EU, cycle: 0, quantity: 1 }
        }
      }
    });
    const optErrors = filter(errors, e =>
      e.instancePath.startsWith(`/options/${CAT_ID}`)
    );
    expect(size(optErrors)).toBeGreaterThan(0);
  });

  it("rejects invalid sub-quantity (min=2, value=1)", () => {
    const quantifiableValue: any = {
      id: PROD_US,
      name: "US East",
      title: "US East",
      brand: "test",
      categoryId: CAT_ID,
      category: "Options",
      cycle: 0,
      quantifiable: true,
      quantity: 2,
      step: 1,
      min: 2,
      max: Infinity,
      order: 0,
      meta: {}
    };
    const ctx: any = {
      id: "test",
      baseModel: { productId: "prod-1", quantity: 1 },
      lookups: {
        product: {
          id: "prod-1",
          name: "Test Product",
          title: "Test Product",
          brand: "test",
          categoryId: "cat-main",
          category: "Cat",
          cycle: 0,
          quantifiable: false,
          quantity: 1,
          step: 1,
          min: 1,
          max: Infinity
        },
        options: [
          {
            id: CAT_ID,
            name: "server_location",
            title: "Server Location",
            meta: { required: true, multiple: false, overrides: false },
            values: [quantifiableValue]
          }
        ]
      }
    };

    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      options: {
        [CAT_ID]: {
          [PROD_US]: { productId: PROD_US, cycle: 0, quantity: 1 }
        }
      }
    });
    expect(size(errors)).toBeGreaterThan(0);
  });

  it("accepts a valid option selection", () => {
    const ctx = makeOptionsContext(true, false);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      options: {
        [CAT_ID]: {
          [PROD_US]: { productId: PROD_US, cycle: 0, quantity: 1 }
        }
      }
    });
    const optErrors = filter(errors, e =>
      e.instancePath.startsWith("/options")
    );
    expect(size(optErrors)).toBe(0);
  });
});

// -----------------------------------------------------------------------------

describe("Schema Validation — Attributes (subproducts)", () => {
  let useProductConfigSchema: typeof import("../schemas").useProductConfigSchema;
  let useValidation: typeof import("../../../utils/useValidation").useValidation;

  const CAT_ID = "cat-attr-1";
  const PROD_BASIC = "prod-sup-basic";
  const PROD_PREMIUM = "prod-sup-premium";

  function makeSubproductValue(id: string, name: string): any {
    return {
      id,
      name,
      title: name,
      brand: "test",
      categoryId: CAT_ID,
      category: "Attributes",
      cycle: 0,
      quantifiable: false,
      quantity: 1,
      step: 1,
      min: 1,
      max: Infinity,
      order: 0,
      meta: {}
    };
  }

  function makeAttributesContext(required = true, multiple = false): any {
    return {
      id: "test",
      baseModel: { productId: "prod-1", quantity: 1 },
      lookups: {
        product: {
          id: "prod-1",
          name: "Test Product",
          title: "Test Product",
          brand: "test",
          categoryId: "cat-main",
          category: "Cat",
          cycle: 0,
          quantifiable: false,
          quantity: 1,
          step: 1,
          min: 1,
          max: Infinity
        },
        attributes: [
          {
            id: CAT_ID,
            name: "support_level",
            title: "Support Level",
            meta: { required, multiple, overrides: false },
            values: [
              makeSubproductValue(PROD_BASIC, "Basic"),
              makeSubproductValue(PROD_PREMIUM, "Premium")
            ]
          }
        ]
      }
    };
  }

  beforeEach(async () => {
    const schemas = await import("../schemas");
    const validation = await import("../../../utils/useValidation");

    useProductConfigSchema = schemas.useProductConfigSchema;
    useValidation = validation.useValidation;
  });

  it("rejects missing required attribute group", () => {
    const ctx = makeAttributesContext(true, false);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      attributes: {}
    });
    const attrErrors = filter(
      errors,
      e =>
        e.instancePath.startsWith("/attributes") ||
        (e.keyword === "required" && e.params?.missingProperty === CAT_ID)
    );
    expect(size(attrErrors)).toBeGreaterThan(0);
  });

  it("rejects invalid product ID in attribute", () => {
    const ctx = makeAttributesContext(true, false);
    const invalidId = "bad-uuid-attr";
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      attributes: {
        [CAT_ID]: {
          [invalidId]: { productId: invalidId, cycle: 0, quantity: 1 }
        }
      }
    });
    const attrErrors = filter(errors, e =>
      e.instancePath.startsWith(`/attributes/${CAT_ID}`)
    );
    expect(size(attrErrors)).toBeGreaterThan(0);
  });

  it("rejects too many attribute selections when multiple=false", () => {
    const ctx = makeAttributesContext(true, false);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      attributes: {
        [CAT_ID]: {
          [PROD_BASIC]: { productId: PROD_BASIC, cycle: 0, quantity: 1 },
          [PROD_PREMIUM]: { productId: PROD_PREMIUM, cycle: 0, quantity: 1 }
        }
      }
    });
    const attrErrors = filter(errors, e =>
      e.instancePath.startsWith(`/attributes/${CAT_ID}`)
    );
    expect(size(attrErrors)).toBeGreaterThan(0);
  });

  it("accepts a valid attribute selection", () => {
    const ctx = makeAttributesContext(true, false);
    const schema = useProductConfigSchema(ctx);
    const { validate } = useValidation();
    const errors = validate(schema, {
      productId: "prod-1",
      quantity: 1,
      attributes: {
        [CAT_ID]: {
          [PROD_BASIC]: { productId: PROD_BASIC, cycle: 0, quantity: 1 }
        }
      }
    });
    const attrErrors = filter(errors, e =>
      e.instancePath.startsWith("/attributes")
    );
    expect(size(attrErrors)).toBe(0);
  });
});
