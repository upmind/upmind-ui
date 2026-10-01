// -----------------------------------------------------------------------------
/**
 * @fileoverview The account-credit tile
 *
 * ## Job To Be Done
 * Ticking the tile applies the smaller of the amount due and the credit held, and the
 * unticked label names the same figure the tick applies.
 *
 * ## What Breaks If These Fail
 * A tick applies more credit than the invoice owes, or the label promises one figure and the tick sends another.
 */

import { join } from "node:path";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import AccountCredit from "../components/AccountCredit.vue";
import { get } from "lodash-es";
import type { AccountCreditProps } from "../types";

// -----------------------------------------------------------------------------

const recordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "headless",
  "src",
  "modules",
  "payment-details",
  "__tests__",
  "fixtures"
);

type Money = { value: number; amount: string };

function recordedWallet(row: "total" | "offline"): Money {
  const body = getFixtureBody<object>("get-wallet-balance", { recordingsDir });
  const value: unknown = get(body, ["data", row, "USD", "amount_converted"]);
  const amount: unknown = get(body, [
    "data",
    row,
    "USD",
    "amount_converted_formatted"
  ]);

  if (typeof value !== "number" || typeof amount !== "string") {
    throw new Error(
      "Missing fixture. Run `pnpm fixtures:generate payment-details` to capture " +
        "the client's wallet balance."
    );
  }
  return { value, amount };
}

function recordedInvoice(key: string): Money {
  const body = getFixtureBody<object>(key, { recordingsDir });
  const value: unknown = get(body, ["data", "total"]);
  const amount: unknown = get(body, ["data", "total_formatted"]);

  if (typeof value !== "number" || typeof amount !== "string") {
    throw new Error(
      `Missing fixture "${key}". Run \`pnpm fixtures:generate payment-details\`.`
    );
  }
  return { value, amount };
}

const credit = recordedWallet("total");
const owesMore = recordedInvoice("post-cart-calculate-case-wallet");
const owesLess = recordedInvoice("post-cart-calculate-case-wallet-small");

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false,
  messages: { en: { cart: { account_credit_use: "Use {amount}" } } }
});

function mountTile(due: Money) {
  const props: AccountCreditProps = {
    amount: due.value,
    amountsFormatted: {
      amount: due.amount,
      outstanding: due.amount,
      wallet: ""
    },
    accountCredit: {
      owned: credit,
      credit: recordedWallet("offline"),
      total: credit
    },
    modelValue: 0,
    schema: {},
    uischema: {}
  };

  return mount(AccountCredit, {
    props,
    global: { plugins: [i18n], stubs: { RouterLink: true } }
  });
}

function tile(wrapper: ReturnType<typeof mountTile>) {
  return wrapper.find('[data-test-key="account-credit"]');
}

async function tick(wrapper: ReturnType<typeof mountTile>) {
  await tile(wrapper).trigger("click");
  await flushPromises();

  return wrapper.emitted("update:modelValue");
}

// -----------------------------------------------------------------------------

describe("the account-credit tile", () => {
  it("records an invoice that owes more than the credit, and one that owes less", () => {
    expect(owesMore.value).toBeGreaterThan(credit.value);
    expect(owesLess.value).toBeLessThan(credit.value);
  });

  it("applies the whole credit to an invoice that owes more, and names it", async () => {
    const wrapper = mountTile(owesMore);

    expect(tile(wrapper).text()).toContain(`Use ${credit.amount}`);
    expect(await tick(wrapper)).toEqual([[credit.value]]);
  });

  it("applies only the amount due to an invoice that owes less, and names it", async () => {
    const wrapper = mountTile(owesLess);

    expect(tile(wrapper).text()).toContain(`Use ${owesLess.amount}`);
    expect(await tick(wrapper)).toEqual([[owesLess.value]]);
  });
});
