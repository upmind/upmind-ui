// -----------------------------------------------------------------------------
/**
 * @fileoverview A default option belongs to a product being added
 *
 * ## Job To Be Done
 * A product can flag one of an option's values as its default. The form selects
 * that value the first time the product is configured. After that, the choice
 * lives on the basket product. When we rebuild the config for a product that is
 * already in the basket, we must read the saved choice and nothing else.
 *
 * ## What Breaks If These Fail
 * A user removes a default option and the basket saves the removal. The user
 * reloads the page and the option is selected again, so the config and the
 * basket summary disagree. The next save puts the option back in the basket.
 */

import { describe, it, expect, vi } from "vitest";

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
    t: vi.fn((key: string) => key),
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

vi.mock("../services", () => ({ default: {} }));

// -----------------------------------------------------------------------------

const OPTIONAL_CATEGORY_ID = "cat-privacy";
const OPTIONAL_VALUE_ID = "opt-whois";
const REQUIRED_CATEGORY_ID = "cat-support";
const PRODUCT_ID = "prod-1";
const BASKET_PRODUCT_ID = "bp-1";

function makeValue(id: string, isDefault: boolean) {
  return {
    id,
    title: id,
    quantifiable: false,
    quantity: 1,
    cycle: 1,
    meta: isDefault ? { default: true } : {}
  };
}

// optional category, one value flagged as the product's default
const optionalLookup = {
  id: OPTIONAL_CATEGORY_ID,
  title: "Domain privacy",
  description: "",
  meta: { required: false, multiple: false },
  values: [makeValue(OPTIONAL_VALUE_ID, true)]
};

// required category with two values: a default, no const pin
const requiredLookup = {
  id: REQUIRED_CATEGORY_ID,
  title: "Support",
  description: "",
  meta: { required: true, multiple: false },
  values: [makeValue("opt-standard", true), makeValue("opt-premium", false)]
};

const lookups = { options: [optionalLookup, requiredLookup] };

async function buildSchema(isSaved: boolean) {
  const { useProductConfigSchema } = await import("../product.schemas");

  return useProductConfigSchema({
    lookups,
    baseModel: { productId: PRODUCT_ID },
    rawBasketProduct: isSaved
      ? { id: BASKET_PRODUCT_ID, product_id: PRODUCT_ID }
      : undefined
  } as any);
}

// -----------------------------------------------------------------------------

describe("useProductConfigSchema — default option values", () => {
  it("keeps an optional default for a product being added", async () => {
    const schema = await buildSchema(false);

    expect(
      schema.properties!.options.properties[OPTIONAL_CATEGORY_ID].default
    ).toEqual({
      [OPTIONAL_VALUE_ID]: {
        productId: OPTIONAL_VALUE_ID,
        quantity: 1,
        cycle: 1
      }
    });
  });

  it("does not set an optional default for a product already in the basket", async () => {
    const schema = await buildSchema(true);

    expect(
      schema.properties!.options.properties[OPTIONAL_CATEGORY_ID]
    ).not.toHaveProperty("default");
  });

  it("keeps a required default for a product already in the basket", async () => {
    const schema = await buildSchema(true);

    // a required category cannot be left empty, so there is no removal to keep
    expect(
      schema.properties!.options.properties[REQUIRED_CATEGORY_ID].default
    ).toMatchObject({ "opt-standard": { productId: "opt-standard" } });
  });
});

// -----------------------------------------------------------------------------

describe("cold load — the user already removed the default option", () => {
  async function parseOnLoad(isSaved: boolean) {
    const { useModelParser } = await import("../../../utils/useValidation");
    const schema = await buildSchema(isSaved);

    // the model the saved basket product yields: the option is gone
    const model = {
      productId: PRODUCT_ID,
      quantity: 1,
      term: 1,
      options: {},
      attributes: {},
      provisionFields: {}
    };

    return useModelParser(schema, model, {});
  }

  it("leaves the removed option out for a product already in the basket", async () => {
    const model = await parseOnLoad(true);

    expect(model.options).not.toHaveProperty(OPTIONAL_CATEGORY_ID);
  });

  it("still seeds it for a product being added", async () => {
    const model = await parseOnLoad(false);

    expect(model.options[OPTIONAL_CATEGORY_ID]).toMatchObject({
      [OPTIONAL_VALUE_ID]: { productId: OPTIONAL_VALUE_ID }
    });
  });
});
