// -----------------------------------------------------------------------------
/**
 * @module tests/money
 * @description Plan R6: money is DATA. One formatter mints every display
 * string, every seeded amount's `formatted` is what that formatter would
 * produce for its own figure and currency, and nothing downstream of the mock
 * layer computes a figure — the static half of the rule, greppable in the
 * style of `module-fetch-forbidden`.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { flatMap, map } from "lodash-es";
import type { MockDataset, MockMoney } from "~/portal/mock/types";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { formatMoney, mockMoney } from "~/portal/mock/money";

/** Built from `fileURLToPath(import.meta.url)` alone — Vite rewrites the relative-URL form. */
const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(TESTS_DIR, "..", "app");
const PORTAL_DIR = join(APP_DIR, "portal");
const MODULES_DIR = join(PORTAL_DIR, "modules");
const SELECTORS_FILE = join(PORTAL_DIR, "mock", "selectors.ts");
const MONEY_FILE = join(PORTAL_DIR, "mock", "money.ts");

const AMOUNT_RIGHT = /\.amount\s*[-+*/]/;
const AMOUNT_LEFT = /[-+*/]\s*[\w.]+\.amount\b/;
const CURRENCY_FORMATTER = /Intl\.NumberFormat/;

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/** A JSDoc ending on the word "amount" reads as arithmetic to the regex; only code counts. */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function offenders(
  files: string[],
  test: (source: string) => boolean
): string[] {
  return map(
    files.filter(file => test(code(file))),
    file => relative(APP_DIR, file)
  );
}

/** Every money field the seed carries, wherever it hangs. */
function seededAmounts(data: MockDataset): MockMoney[] {
  return [
    ...map(data.invoices, "total"),
    ...flatMap(data.invoices, invoice => map(invoice.lines ?? [], "amount")),
    ...map(data.orders, "total"),
    ...map(data.creditNotes, "total"),
    ...map(data.catalogue, "price"),
    ...map(data.catalogue, "chargeTotal"),
    ...flatMap(data.products, product =>
      product.price === undefined ? [] : [product.price]
    ),
    ...data.wallet.balances,
    ...(data.affiliate === null
      ? []
      : [
          data.affiliate.balance,
          ...map(data.affiliate.commissions, "amount"),
          ...map(data.affiliate.payouts, "amount")
        ])
  ];
}

describe("money — R6: the amount, its currency, and one formatter", () => {
  it("renders sterling with its sign and two decimals, zero included", () => {
    expect(formatMoney(1234.5, "GBP")).toBe("£1,234.50");
    expect(formatMoney(99, "GBP")).toBe("£99.00");
    expect(formatMoney(0, "GBP")).toBe("£0.00");
  });

  it("renders another currency as itself, never as sterling", () => {
    const dollars = formatMoney(99, "USD");
    expect(dollars).not.toContain("£");
    expect(dollars).toContain("99.00");
    expect(/\$|USD/.test(dollars)).toBe(true);

    const euros = formatMoney(99, "EUR");
    expect(euros).not.toContain("£");
    expect(/€|EUR/.test(euros)).toBe(true);
  });

  it("mockMoney carries the figure, its currency and its display string together", () => {
    expect(mockMoney(12.5, "GBP")).toEqual({
      amount: 12.5,
      currency: "GBP",
      formatted: "£12.50"
    });
  });

  it("every seeded amount reads as its own figure — no hand-authored string drifts", () => {
    const drifted = seededAmounts(HOSTGRID_MOCK_DATASET).filter(
      money => money.formatted !== formatMoney(money.amount, money.currency)
    );

    expect(drifted).toEqual([]);
  });

  it("carries at least one seeded amount per money-bearing collection", () => {
    // A walk over an empty seed proves nothing; this is the walk's own floor.
    expect(seededAmounts(HOSTGRID_MOCK_DATASET).length).toBeGreaterThan(10);
  });
});

describe("money — R6: nothing downstream of the mock layer computes a figure", () => {
  it("the arithmetic patterns catch a figure being computed and spare one being read", () => {
    const computed = "const due = row.total.amount - paid.amount;";
    const read = "const label = row.total.formatted;";

    expect(AMOUNT_RIGHT.test(computed)).toBe(true);
    expect(AMOUNT_LEFT.test(computed)).toBe(true);
    expect(AMOUNT_RIGHT.test(read)).toBe(false);
    expect(AMOUNT_LEFT.test(read)).toBe(false);
    expect(AMOUNT_RIGHT.test(code(MONEY_FILE))).toBe(false);
  });

  it("selectors and modules do no arithmetic on an amount", () => {
    const files = [
      SELECTORS_FILE,
      ...listFiles(MODULES_DIR).filter(file => file.endsWith(".vue"))
    ];
    expect(files.length).toBeGreaterThan(5);

    expect(offenders(files, source => AMOUNT_RIGHT.test(source))).toEqual([]);
    expect(offenders(files, source => AMOUNT_LEFT.test(source))).toEqual([]);
  });

  it("only money.ts reaches for a currency formatter", () => {
    const files = listFiles(PORTAL_DIR)
      .filter(file => /\.(vue|ts)$/.test(file))
      .filter(file => file !== MONEY_FILE);
    expect(files.length).toBeGreaterThan(20);
    expect(CURRENCY_FORMATTER.test(code(MONEY_FILE))).toBe(true);

    expect(offenders(files, source => CURRENCY_FORMATTER.test(source))).toEqual(
      []
    );
  });
});
