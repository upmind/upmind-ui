// -----------------------------------------------------------------------------
/**
 * @fileoverview useBasketInlineEditors Tests
 *
 * ## Job To Be Done
 * Verify that the inline editors composable correctly resolves per-product
 * meta, conditionally spawns config machines, and cleans up stale entries.
 *
 * ## What Breaks If These Fail
 * - Inline editing controls (term selector, option toggles) may show or
 *   hide incorrectly on basket product cards.
 * - Machine instances may leak if products are removed without cleanup.
 * - The editors map may contain stale entries for removed products.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

// --- utils
import { keys, size } from "lodash-es";

// -----------------------------------------------------------------------------
// Mocks — vi.mock calls are hoisted, must come before imports

vi.mock("@sentry/vue", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

vi.mock("../../../utils/useCookies", () => ({
  useCookies: vi.fn(() => ({
    removeTopLevel: vi.fn(),
    setTopLevel: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }))
}));

// --- Mock useBasket
const mockProducts = ref<any[]>([]);
const mockBasketIsReady = vi.fn(async () => true);

vi.mock("../../basket", () => ({
  useBasket: () => ({
    products: mockProducts,
    isReady: mockBasketIsReady
  })
}));

// --- Mock useBasketProduct
const mockStop = vi.fn();

vi.mock("../useBasketProduct", () => ({
  useBasketProduct: vi.fn((bpid: string) => ({
    id: { value: bpid },
    terms: ref([]),
    options: ref([]),
    model: ref({}),
    meta: ref({ isProcessing: false }),
    stop: mockStop,
    updateTerm: vi.fn(),
    setOptions: vi.fn(),
    update: vi.fn()
  }))
}));

// --- Mock useConfig
const mockUiConfig = {
  optionUpsells: { isVisible: false },
  productTermSelector: { isVisible: false }
};
const mockDataConfig = {
  optionUpsellEnabled: false
};

vi.mock("../../config", () => ({
  useConfig: () => ({
    with: () => ({
      ui: mockUiConfig,
      data: mockDataConfig
    })
  })
}));

// Mock the modules barrel to prevent deep dependency loading
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
// Import AFTER mocks are defined (vi.mock is hoisted)

import { useBasketInlineEditors } from "../useBasketInlineEditors";

// -----------------------------------------------------------------------------

/**
 * Create a minimal basket product fixture.
 */
function createProduct(id: string, overrides: Record<string, any> = {}): any {
  return {
    id,
    productDetails: { quantifiable: false },
    ...overrides
  };
}

// -----------------------------------------------------------------------------

describe("useBasketInlineEditors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProducts.value = [];

    // Reset config to defaults
    mockUiConfig.optionUpsells.isVisible = false;
    mockUiConfig.productTermSelector.isVisible = false;
    mockDataConfig.optionUpsellEnabled = false;
  });

  it("builds editors for products when basket is ready", async () => {
    mockProducts.value = [createProduct("bp-1"), createProduct("bp-2")];

    const { isReady, editors } = useBasketInlineEditors();
    await isReady();

    expect(size(keys(editors))).toBe(2);
    expect(editors["bp-1"]).toBeDefined();
    expect(editors["bp-2"]).toBeDefined();
  });

  it("sets hasInlineControls=false when no meta flags are enabled", async () => {
    mockProducts.value = [createProduct("bp-1")];

    const { isReady, getEditor } = useBasketInlineEditors();
    await isReady();

    const editor = getEditor("bp-1");
    expect(editor).toBeDefined();
    expect(editor!.hasInlineControls).toBe(false);
    expect(editor!.showOptionUpsells).toBe(false);
    expect(editor!.showTermSelector).toBe(false);
    expect(editor!.config).toBeUndefined();
  });

  it("enables term selector when productTermSelector is visible", async () => {
    mockUiConfig.productTermSelector.isVisible = true;
    mockProducts.value = [createProduct("bp-1")];

    const { isReady, getEditor } = useBasketInlineEditors();
    await isReady();

    const editor = getEditor("bp-1");
    expect(editor!.showTermSelector).toBe(true);
    expect(editor!.hasInlineControls).toBe(true);
    expect(editor!.config).toBeDefined();
  });

  it("does not show option upsells when only data flag is set", async () => {
    mockDataConfig.optionUpsellEnabled = true;
    mockUiConfig.optionUpsells.isVisible = false;
    mockProducts.value = [createProduct("bp-1")];

    const { isReady, getEditor } = useBasketInlineEditors();
    await isReady();

    const editor = getEditor("bp-1");
    expect(editor!.showOptionUpsells).toBe(false);
  });

  it("enables option upsells when both flags are true", async () => {
    mockDataConfig.optionUpsellEnabled = true;
    mockUiConfig.optionUpsells.isVisible = true;
    mockProducts.value = [createProduct("bp-1")];

    const { isReady, getEditor } = useBasketInlineEditors();
    await isReady();

    const editor = getEditor("bp-1");
    expect(editor!.showOptionUpsells).toBe(true);
    expect(editor!.hasInlineControls).toBe(true);
    expect(editor!.config).toBeDefined();
  });

  it("cleans up stale editors on refresh", async () => {
    mockProducts.value = [createProduct("bp-1"), createProduct("bp-2")];

    const { isReady, editors, refresh } = useBasketInlineEditors();
    await isReady();
    expect(size(keys(editors))).toBe(2);

    // Remove bp-2 from basket
    mockProducts.value = [createProduct("bp-1")];
    refresh();

    expect(size(keys(editors))).toBe(1);
    expect(editors["bp-1"]).toBeDefined();
    expect(editors["bp-2"]).toBeUndefined();
  });

  it("does not rebuild already-resolved editors on refresh", async () => {
    mockUiConfig.productTermSelector.isVisible = true;
    mockProducts.value = [createProduct("bp-1")];

    const { isReady, editors, refresh } = useBasketInlineEditors();
    await isReady();

    const firstEditor = editors["bp-1"];
    refresh();

    // Same reference — not rebuilt
    expect(editors["bp-1"]).toBe(firstEditor);
  });

  it("getEditor returns undefined for unknown product IDs", async () => {
    mockProducts.value = [createProduct("bp-1")];

    const { isReady, getEditor } = useBasketInlineEditors();
    await isReady();

    expect(getEditor("unknown-id")).toBeUndefined();
  });

  it("editableProducts includes only products with inline controls", async () => {
    mockUiConfig.productTermSelector.isVisible = true;
    mockProducts.value = [createProduct("bp-1"), createProduct("bp-2")];

    const { isReady, editableProducts, hasEditableProducts } =
      useBasketInlineEditors();
    await isReady();

    expect(editableProducts.value).toContain("bp-1");
    expect(editableProducts.value).toContain("bp-2");
    expect(hasEditableProducts.value).toBe(true);
  });

  it("hasEditableProducts is false when no products have controls", async () => {
    mockProducts.value = [createProduct("bp-1")];

    const { isReady, hasEditableProducts } = useBasketInlineEditors();
    await isReady();

    expect(hasEditableProducts.value).toBe(false);
  });
});
