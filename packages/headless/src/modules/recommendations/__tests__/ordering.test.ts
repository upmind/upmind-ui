import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductTypes } from "@upmind-automation/types";
import { useConfig } from "../../config/useConfig";
import { parseRelatedProducts } from "../recommendations.utils";
import type { RelatedProduct } from "../recommendations.types";
import type {
  IBasket,
  IBasketProduct,
  IProduct
} from "@upmind-automation/types";

// Isolate recommendation ordering from product pricing and global app state.
vi.mock("../../config/useConfig", () => ({ useConfig: vi.fn() }));
vi.mock("../../product/product.utils", () => ({
  parseProductDetails: (product: IProduct) => ({ id: product.id })
}));
vi.mock("../../product", () => ({}));
vi.mock("../../../utils", () => ({}));
vi.mock("../../system-localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

function configure(meta: RelatedProduct[] = [], nativeVisible = true) {
  vi.mocked(useConfig).mockReturnValue({
    data: { productsToRecommend: meta },
    ui: { productNativeRecommendations: { isVisible: nativeVisible } }
  } as ReturnType<typeof useConfig>);
}

function recommendation(
  id: string,
  order: number,
  overrides: Partial<RelatedProduct> = {}
): RelatedProduct {
  return {
    id,
    object_id: `product-${id}`,
    object_type: "product",
    active: true,
    order,
    ...overrides
  } as RelatedProduct;
}

function basketProduct(id: string, related: RelatedProduct[]): IBasketProduct {
  return {
    id: `line-${id}`,
    product_id: id,
    product: { id, product_type: ProductTypes.SINGLE_PRODUCT, related }
  } as IBasketProduct;
}

function parse(...products: IBasketProduct[]) {
  return parseRelatedProducts({ products } as IBasket).map(rec => rec.id);
}

beforeEach(() => configure());

describe("recommendation ordering", () => {
  it("keeps meta array order before native recommendations sorted numerically", () => {
    const meta = [recommendation("meta-b", 20), recommendation("meta-a", 10)];
    const native = [
      recommendation("native-ten", 10),
      recommendation("native-two", 2),
      recommendation("native-zero", 0)
    ];
    configure(meta);

    expect(parse(basketProduct("parent", native))).toEqual([
      "meta-b",
      "meta-a",
      "native-zero",
      "native-two",
      "native-ten"
    ]);
    expect(meta.map(rec => rec.id)).toEqual(["meta-b", "meta-a"]);
    expect(native.map(rec => rec.id)).toEqual([
      "native-ten",
      "native-two",
      "native-zero"
    ]);
  });

  it("preserves backend order for native recommendations with equal order values", () => {
    expect(
      parse(
        basketProduct("parent", [
          recommendation("last", 2),
          recommendation("tie-b", 1),
          recommendation("tie-a", 1)
        ])
      )
    ).toEqual(["tie-b", "tie-a", "last"]);
  });

  it("sorts native recommendations within each originating basket product", () => {
    expect(
      parse(
        basketProduct("first", [
          recommendation("first-ten", 10),
          recommendation("first-two", 2)
        ]),
        basketProduct("second", [
          recommendation("second-three", 3),
          recommendation("second-zero", 0)
        ])
      )
    ).toEqual(["first-two", "first-ten", "second-zero", "second-three"]);
  });

  it("continues filtering inactive, non-product and conditionally hidden recommendations", () => {
    configure([
      recommendation("meta", 10),
      recommendation("inactive-meta", 0, { active: false })
    ]);

    expect(
      parse(
        basketProduct("parent", [
          recommendation("last", 2),
          recommendation("inactive-native", 0, { active: false }),
          recommendation("category", 0, { object_type: "category" }),
          recommendation("hidden", 0, {
            conditions: { default: "hidden", rules: [] }
          }),
          recommendation("first", 1)
        ])
      )
    ).toEqual(["meta", "first", "last"]);
  });

  it("keeps meta recommendations when native recommendations are disabled", () => {
    configure(
      [recommendation("meta-b", 20), recommendation("meta-a", 10)],
      false
    );

    expect(
      parse(basketProduct("parent", [recommendation("native", 0)]))
    ).toEqual(["meta-b", "meta-a"]);
  });
});
