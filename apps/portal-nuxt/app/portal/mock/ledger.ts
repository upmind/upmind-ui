// -----------------------------------------------------------------------------
/**
 * @module portal/mock/ledger
 * @description The wallet ledger's running balance, worked out once.
 *
 * A seeded movement records what MOVED; what the balance stood at afterwards
 * is the server's own total (plan R6), and this is where the mock's server
 * keeps it. Two facts make the derivation necessary rather than decorative:
 * the rows do not arrive in date order (the padded ones are appended after the
 * hand-authored block), and a seed cannot author a figure that follows from
 * the rows around it — the moment padding lands between two authored movements
 * the chain it was authored into no longer exists.
 *
 * The chain is anchored on the balance the account actually holds and walked
 * back across every movement, so the newest row lands on that same balance and
 * each statement period closes exactly where the next one opens.
 *
 * A LEAF on purpose: the statements panel and the ledger pager both read it,
 * and `collection-defs.ts` cannot import the facade barrel — that edge closes
 * a module-load cycle through the store and the seeds.
 */

import { mockMoney } from "./money";
import {
  assign,
  filter,
  find,
  flatten,
  map,
  orderBy,
  sortBy,
  sumBy,
  take,
  uniq
} from "lodash-es";
import type { MockDataset, MockMoney, MockWalletTransaction } from "./types";
// -----------------------------------------------------------------------------

/** Two decimal places, the minor unit every seeded currency trades in. */
const MONEY_PRECISION = 2;

/**
 * One movement with its running balance settled. The seed's own
 * `balanceAfter` is optional because a seed cannot know it; every row that
 * reaches a reader has been through the chain, so this is what readers take.
 */
export type MockLedgerMovement = MockWalletTransaction & {
  readonly balanceAfter: MockMoney;
};

/** What the account holds in one currency, as a bare figure. */
function heldIn(data: MockDataset, currency: string): number {
  return find(data.wallet.balances, { currency })?.amount ?? 0;
}

/**
 * One currency's movements, OLDEST first, each carrying the balance it left
 * behind. The anchor is what the account holds now, less everything that ever
 * moved — the balance it held before the oldest movement.
 */
export function chainedLedgerIn(
  data: MockDataset,
  currency: string
): MockLedgerMovement[] {
  const ordered = sortBy(
    filter(
      data.wallet.transactions,
      movement => movement.amount.currency === currency
    ),
    "date"
  );
  const held = heldIn(data, currency);
  const opening = held - sumBy(ordered, row => row.amount.amount);
  return map(ordered, (movement, index) =>
    assign({}, movement, {
      balanceAfter: mockMoney(
        roundMoney(
          opening + sumBy(take(ordered, index + 1), row => row.amount.amount)
        ),
        currency
      )
    })
  );
}

/** Money is held to the minor unit; a running sum of decimals is not. */
function roundMoney(amount: number): number {
  const factor = 10 ** MONEY_PRECISION;
  return Math.round(amount * factor) / factor;
}

/** Every currency the ledger has ever moved in, plus every balance it holds. */
function ledgerCurrencies(data: MockDataset): string[] {
  return uniq([
    ...map(data.wallet.balances, "currency"),
    ...map(data.wallet.transactions, movement => movement.amount.currency)
  ]);
}

/**
 * The whole ledger, NEWEST first — the order the statements pager reads it in.
 * Each currency is chained on its own, because a balance is per currency.
 */
export function chainedLedger(data: MockDataset): MockLedgerMovement[] {
  const chained = map(ledgerCurrencies(data), currency =>
    chainedLedgerIn(data, currency)
  );
  return orderBy(flatten(chained), ["date"], ["desc"]);
}
