// -----------------------------------------------------------------------------
/**
 * @module product/__tests__/recorded-prices
 * @description The recorded money strings the pricing atoms read back.
 */

import { join } from "node:path";
import { getFixture } from "@upmind-automation/test-fixtures";

// -----------------------------------------------------------------------------

const SETUP = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "headless",
  "src",
  "modules",
  "product-setup",
  "__tests__",
  "fixtures"
);

const RECORDINGS = [
  "get-basket-id-products-id-basket-id-basket-product-id",
  "get-orders-current"
];

function harvest(body: unknown, into: Set<string>): void {
  if (Array.isArray(body)) {
    for (const entry of body) harvest(entry, into);
    return;
  }
  if (!body || typeof body !== "object") return;

  for (const [key, value] of Object.entries(body)) {
    const isMoneyKey = key.endsWith("_formatted") || key === "display_price";

    if (isMoneyKey && typeof value === "string" && /\d\.\d{2}$/.test(value)) {
      into.add(value);
    }
    harvest(value, into);
  }
}

const harvested = new Set<string>();

for (const key of RECORDINGS) {
  harvest(getFixture(key, { recordingsDir: SETUP }).response.body, harvested);
}

const money = [...harvested].sort();
const isZero = (figure: string) => /^\D*0+\.00$/.test(figure);
const isWhole = (figure: string) => figure.endsWith(".00") && !isZero(figure);

function required(figure: string | undefined, what: string): string {
  if (figure) return figure;

  throw new Error(
    `The recorded pool no longer carries ${what}, which the pricing atoms are ` +
      `read back against. Harvested: ${money.join(", ") || "(none)"}. Re-run ` +
      "`pnpm fixtures:generate product-setup`."
  );
}

export const recordedWholePrice = required(
  money.find(isWhole),
  "a whole formatted figure"
);

export const recordedOtherWholePrice = required(
  money.find(figure => isWhole(figure) && figure !== recordedWholePrice),
  "a second, different whole formatted figure"
);

export const recordedFractionalPrice = required(
  money.find(figure => !figure.endsWith(".00")),
  "a formatted figure with real minor units"
);

export const recordedZeroPrice = required(
  money.find(isZero),
  "a formatted zero figure"
);

export function amountOf(figure: string): number {
  return Number(figure.replace(/[^\d.]/g, ""));
}
