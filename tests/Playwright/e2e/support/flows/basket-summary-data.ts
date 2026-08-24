import type { Page } from "@playwright/test";
import { waitForUpmindBridge } from "./headless-bridge";

/** One configuration detail the summary is expected to itemise. */
export type SummaryDetailData = {
  /** Which of the three summarisable kinds this detail is. */
  kind: "term" | "option" | "attribute";
  /** The served (translated) title of the item. */
  title: string;
  /** The served category label. */
  category: string | null;
  /** This item's quantity per single unit of the parent product. */
  unitQuantity: number | null;
  /** The served single-item figure, or null when the server prices none. */
  unitPrice: string | null;
  /** The served all-units figure, or null when the server prices none. */
  allUnitsPrice: string | null;
};

/** One basket product's served summary data. */
export type SummaryProductData = {
  /** The basket-product id (this product's identity within the basket). */
  id: string;
  /** The catalogue product id. */
  productId: string;
  /** The quantity of this product in the basket. */
  quantity: number;
  /** The selected term in months, if any. */
  term: number | null;
  /** The figure for the quantity actually in the basket. */
  allUnitsPrice: string;
  /** The figure for one unit of the whole configuration. */
  oneUnitPrice: string;
  /** The figure for one unit of the product alone, its options excluded. */
  productOnlyUnitPrice: string | null;
  /** The details worth summarising — term, options, attributes. */
  details: SummaryDetailData[];
  /** Details of any other kind (provision fields), which must not be lines. */
  otherDetailCount: number;
  /** Selections counted from the configuration model, not from the details. */
  selections: { term: number; options: number; attributes: number };
};

const SUMMARISABLE = ["term", "option", "attribute"] as const;

/**
 * Reads what the SERVER says each basket product's configuration is, through
 * the app's own live basket composable.
 *
 * This is the oracle a summary read-back asserts against: the counts come from
 * the configuration model (the selections that were committed), the figures
 * come from the served details (every figure the summary shows is a
 * server-formatted amount it only displays). Neither is read back off the
 * rendered summary, so an assertion built on this cannot mirror the template
 * it is grading.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function readSummaryData(
  page: Page
): Promise<SummaryProductData[]> {
  await waitForUpmindBridge(page);
  return page.evaluate(async summarisable => {
    if (!window.Upmind?.useBasket) {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    }
    const basket = window.Upmind.useBasket();
    const ready = await basket.isReady();
    if (!ready) {
      throw new Error("readSummaryData: basket did not become ready");
    }
    await basket.isRefreshed();

    const countValues = (model: unknown) =>
      Object.values((model ?? {}) as Record<string, Record<string, unknown>>)
        .map(values => Object.keys(values ?? {}).length)
        .reduce((sum, count) => sum + count, 0);

    return JSON.parse(
      JSON.stringify(
        (basket.products.value ?? []).map(product => {
          const details = product.details ?? [];
          const summarisableDetails = details.filter(detail =>
            summarisable.includes(detail?.name)
          );
          return {
            id: product.id,
            productId: product.configuration?.productId,
            quantity: product.configuration?.quantity ?? 1,
            term: product.configuration?.term ?? null,
            allUnitsPrice: product.price?.regularPrice,
            oneUnitPrice: product.price?.configurationUnitPrice,
            productOnlyUnitPrice: product.price?.unitPrice ?? null,
            details: summarisableDetails.map(detail => ({
              kind: detail.name,
              title: detail.title,
              category: detail.category ?? null,
              unitQuantity: detail.unitQuantity ?? null,
              unitPrice: detail.price?.unitPrice ?? null,
              allUnitsPrice: detail.price?.regularPrice ?? null
            })),
            otherDetailCount: details.length - summarisableDetails.length,
            selections: {
              term: product.configuration?.term === undefined ? 0 : 1,
              options: countValues(product.configuration?.options),
              attributes: countValues(product.configuration?.attributes)
            }
          };
        })
      )
    );
  }, SUMMARISABLE);
}

/**
 * Reads the served summary data for one basket product, failing loudly when
 * the basket does not hold exactly that product.
 *
 * @param page - The Playwright page.
 * @param basketProductId - The committed basket-product id to read.
 */
export async function readSummaryProduct(
  page: Page,
  basketProductId: string
): Promise<SummaryProductData> {
  const products = await readSummaryData(page);
  const product = products.find(entry => entry.id === basketProductId);
  if (!product) {
    throw new Error(
      `readSummaryProduct: ${basketProductId} is not in the live basket (holds: ${products
        .map(entry => entry.id)
        .join(", ")})`
    );
  }
  return product;
}
