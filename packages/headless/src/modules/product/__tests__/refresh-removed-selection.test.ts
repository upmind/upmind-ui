// -----------------------------------------------------------------------------
/**
 * @fileoverview refreshContext — deselected subproducts survive a basket refresh
 *
 * ## Job To Be Done
 * A user deselects an option, the update lands, and the follow-up basket
 * REFRESH runs `refreshContext`. The merge must keep the removal: the emptied
 * category (`{}`) must not be refilled from the schema `default` (a
 * catalogue default-flagged value, e.g. domain privacy) nor from a basket
 * snapshot that still contains the old selection.
 *
 * ## What Breaks If These Fail
 * Deselecting a default-flagged option "sticks" only until processing ends,
 * then reappears selected — and silently re-adds the option on the next save.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("../../basketProduct/helper", () => ({
  basketSubscription: vi.fn()
}));

// -----------------------------------------------------------------------------

const CATEGORY_ID = "cat-domain-privacy";
const DEFAULT_VALUE_ID = "opt-whois-privacy";
const PLAIN_CATEGORY_ID = "cat-backups";
const PLAIN_VALUE_ID = "opt-daily-backups";
const BASKET_PRODUCT_ID = "bp-1";
const PRODUCT_ID = "prod-1";

// SubproductDetails lookup: single-select category with a catalogue default
const optionLookup = {
  id: CATEGORY_ID,
  title: "Domain privacy",
  description: "",
  meta: { required: false, multiple: false },
  values: [
    {
      id: DEFAULT_VALUE_ID,
      title: "WHOIS privacy",
      quantifiable: false,
      quantity: 1,
      cycle: 1,
      meta: { default: true }
    }
  ]
};

// the same, without a catalogue default: only the basket can select it
const plainOptionLookup = {
  id: PLAIN_CATEGORY_ID,
  title: "Backups",
  description: "",
  meta: { required: false, multiple: false },
  values: [
    {
      id: PLAIN_VALUE_ID,
      title: "Daily backups",
      quantifiable: false,
      quantity: 1,
      cycle: 1,
      meta: {}
    }
  ]
};

// a required category cannot be left empty: with one value the schema pins it
const REQUIRED_CATEGORY_ID = "cat-support";
const REQUIRED_VALUE_ID = "opt-standard-support";

const requiredOptionLookup = {
  id: REQUIRED_CATEGORY_ID,
  title: "Support",
  description: "",
  meta: { required: true, multiple: false },
  values: [
    {
      id: REQUIRED_VALUE_ID,
      title: "Standard support",
      quantifiable: false,
      quantity: 1,
      cycle: 1,
      meta: {}
    }
  ]
};

const selectedChoice = {
  [DEFAULT_VALUE_ID]: { productId: DEFAULT_VALUE_ID, quantity: 1, cycle: 1 }
};

function makeModel(options: Record<string, any>) {
  return {
    productId: PRODUCT_ID,
    quantity: 1,
    term: 1,
    options,
    attributes: {},
    provisionFields: {}
  };
}

function makeRawOption(valueId: string, categoryId: string) {
  return {
    product_id: valueId,
    unit_quantity: 1,
    billing_cycle_months: 1,
    product: { id: valueId, category_id: categoryId }
  };
}

// raw IBasketProduct as delivered inside a basket REFRESH payload
function makeRawBasketProduct(withOption: boolean) {
  const options = [];
  if (withOption) options.push(makeRawOption(DEFAULT_VALUE_ID, CATEGORY_ID));

  return {
    id: BASKET_PRODUCT_ID,
    product_id: PRODUCT_ID,
    quantity: 1,
    billing_cycle_months: 1,
    provision_fields: {},
    attributes: [],
    options
  };
}

function makeRefreshEvent(withOption: boolean) {
  return {
    type: "REFRESH",
    data: {
      id: "basket-1",
      client_id: "client-1",
      currency_id: "cur-1",
      promotions: [],
      products: [makeRawBasketProduct(withOption)]
    }
  };
}

// -----------------------------------------------------------------------------

describe("refreshContext — deselected option survives a basket refresh", () => {
  let refreshContext: (context: any, event: any) => any;
  let makeContext: (model: any) => any;

  beforeEach(async () => {
    const { default: machine } = await import("../product.machine");
    const { useProductConfigSchema } = await import("../schemas");

    refreshContext = (machine.options.actions!.refreshContext as any)
      .assignment;

    const lookups = {
      options: [optionLookup, plainOptionLookup, requiredOptionLookup]
    };
    const schema = useProductConfigSchema({
      lookups,
      baseModel: { productId: PRODUCT_ID }
    } as any);

    makeContext = (model: any) => ({
      schema,
      lookups,
      model,
      baseModel: makeModel({ [CATEGORY_ID]: { ...selectedChoice } }),
      rawBasketProduct: makeRawBasketProduct(true)
    });
  });

  it("keeps the removal when the refreshed basket has the option removed (schema default must not refill)", () => {
    const context = makeContext(makeModel({ [CATEGORY_ID]: {} }));

    const result = refreshContext(context, makeRefreshEvent(false));

    expect(result.model.options[CATEGORY_ID]).toEqual({});
  });

  it("keeps the removal when the refreshed basket still contains the option (stale snapshot must not refill)", () => {
    const context = makeContext(makeModel({ [CATEGORY_ID]: {} }));

    const result = refreshContext(context, makeRefreshEvent(true));

    expect(result.model.options[CATEGORY_ID]).toEqual({});
  });

  it("keeps an active selection intact across a refresh", () => {
    const context = makeContext(
      makeModel({ [CATEGORY_ID]: { ...selectedChoice } })
    );

    const result = refreshContext(context, makeRefreshEvent(true));

    expect(result.model.options[CATEGORY_ID]).toMatchObject({
      [DEFAULT_VALUE_ID]: { productId: DEFAULT_VALUE_ID }
    });
  });

  it("takes an option from the refreshed basket when the model holds none", () => {
    // an empty options group is "nothing set yet", so the basket still wins
    const context = makeContext(makeModel({}));
    const event = makeRefreshEvent(false);
    event.data.products[0].options = [
      makeRawOption(PLAIN_VALUE_ID, PLAIN_CATEGORY_ID)
    ];

    const result = refreshContext(context, event);

    expect(result.model.options[PLAIN_CATEGORY_ID]).toMatchObject({
      [PLAIN_VALUE_ID]: { productId: PLAIN_VALUE_ID }
    });
  });

  it("restores a required category the user emptied", () => {
    // the schema pins a required single-value category, so it cannot be removed
    const context = makeContext(makeModel({ [REQUIRED_CATEGORY_ID]: {} }));

    const result = refreshContext(context, makeRefreshEvent(false));

    expect(result.model.options[REQUIRED_CATEGORY_ID]).toMatchObject({
      [REQUIRED_VALUE_ID]: { productId: REQUIRED_VALUE_ID }
    });
  });

  it("still seeds the schema default for a category the user never touched", () => {
    // no category key at all = never configured — defaults must still apply
    const context = makeContext(makeModel({}));

    const result = refreshContext(context, makeRefreshEvent(false));

    expect(result.model.options[CATEGORY_ID]).toMatchObject({
      [DEFAULT_VALUE_ID]: { productId: DEFAULT_VALUE_ID }
    });
  });
});
