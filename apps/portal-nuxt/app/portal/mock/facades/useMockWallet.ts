// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockWallet
 * @description The client's account credit — the mock stand-in for
 * `useClientWallet` (`contracts/client-wallet.ts`): the per-currency
 * balances, the statements behind them, the credit limit, and the top-up that
 * moves all three.
 *
 * Every figure here is the mock's SERVER doing the arithmetic (plan R6): the
 * remaining headroom, the balance a top-up leaves behind, and the invoice it
 * raises. Nothing downstream ever computes one — a selector reading
 * `allowance` and `used` and subtracting one from the other would be the
 * client doing the sum.
 */

import {
  InvoiceStatus,
  WalletTransactionTypes
} from "@upmind-automation/types";
import { METER_MODULE_TONE } from "../../modules/meter/types";
import { today } from "../dates";
import { shareTokenFor, zeroOf } from "../documents";
import { chainedLedger, chainedLedgerIn } from "../ledger";
import { mockMoney } from "../money";
import { paymentMethodLabel } from "../payment-label";
import { idFor, nextSequence } from "../store";
import { MOCK_INVOICE_CATEGORY, MOCK_PAYMENT_STATUS } from "../types";
import { defineMockFacade, MOCK_RECEIPT_REASON } from "./facade";
import {
  filter,
  find,
  findIndex,
  findLast,
  isFinite,
  last,
  map,
  replace,
  round,
  sumBy
} from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { MeterModuleTone } from "../../modules/meter/types";
import type { MockLedgerMovement } from "../ledger";
import type {
  MockCreditLimit,
  MockCreditStatement,
  MockDataset,
  MockMoney,
  MockPaymentMethod,
  MockWallet
} from "../types";
import type { AlertProps } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** The credit limit as the panel reads it — what is granted, what is spent, what is left. */
export type MockWalletCreditLimit = MockCreditLimit & {
  readonly remaining: MockMoney;
};

/**
 * One filed statement as the panel prints it — the period, and the four
 * figures legacy's statement carried. Every one of them is worked out HERE
 * from the movements that fall inside the period (plan R6): a selector adding
 * up credits would be the client doing the sum.
 */
export type MockCreditStatementView = {
  readonly id: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly createdAt: string;
  /** What the balance stood at the moment the period opened. */
  readonly opening: MockMoney;
  /** Everything paid in over the period. */
  readonly credits: MockMoney;
  /** Everything drawn down over the period, as a positive figure. */
  readonly debits: MockMoney;
  /** What the balance stood at the moment the period closed. */
  readonly closing: MockMoney;
  /** The movements the period covers, newest first — the CSV's own rows. */
  readonly movements: readonly MockLedgerMovement[];
};

/** The wallet, with the one figure the panel cannot work out for itself. */
export type MockWalletView = {
  readonly balances: MockWallet["balances"];
  readonly transactions: readonly MockLedgerMovement[];
  readonly creditLimit?: MockWalletCreditLimit;
  /** The periods the brand has filed, newest first; empty where it files none. */
  readonly statements: readonly MockCreditStatementView[];
};

/** What a top-up with no card behind it is recorded as — the movement's own name. */
const TOP_UP_TENDER = "Top-up";

/** The smallest movement the ledger records — the schema says the same at the field. */
const TOP_UP_MINIMUM = 0.01;

/** Two decimal places, the minor unit every seeded currency trades in. */
const MONEY_PRECISION = 2;

/**
 * What this account holds in one currency, or nothing where it holds none —
 * the fact the pay dialog's credit option hangs off. Exported because the
 * form's own context is built outside the facade and may not sum a balance
 * for itself (plan R6).
 */
export function walletBalanceIn(
  data: MockDataset,
  currency: string
): MockMoney | undefined {
  return find(data.wallet.balances, { currency });
}

function meteredLimit(
  limit: MockCreditLimit | undefined
): MockWalletCreditLimit | undefined {
  if (limit === undefined) return undefined;
  const left = limit.allowance.amount - limit.used.amount;
  return {
    allowance: limit.allowance,
    used: limit.used,
    remaining: mockMoney(left, limit.allowance.currency)
  };
}

/**
 * The currency a statement is denominated in — the one the credit limit is
 * granted in, which is what legacy's credit statements reported against. A
 * client with no limit has no statement to denominate.
 */
function statementCurrency(data: MockDataset): string | undefined {
  return data.wallet.creditLimit?.allowance.currency;
}

/** The movements one period covers, oldest first — a statement's own order. */
function movementsIn(
  ledger: readonly MockLedgerMovement[],
  period: MockCreditStatement
): MockLedgerMovement[] {
  return filter(
    ledger,
    movement =>
      movement.date >= period.fromDate && movement.date <= period.toDate
  );
}

/**
 * What the balance stood at when the period CLOSED — the chained total the
 * period's LAST movement left behind. A period with no movement in it closes
 * wherever the last movement before it left the balance, and an account with
 * no movement at all closes at nothing.
 */
function closingBalance(
  ledger: readonly MockLedgerMovement[],
  period: MockCreditStatement,
  currency: string,
  covered: readonly MockLedgerMovement[]
): MockMoney {
  const latest = last(covered);
  if (latest !== undefined) return latest.balanceAfter;
  const earlier = findLast(ledger, movement => movement.date < period.fromDate);
  return earlier?.balanceAfter ?? zeroOf(currency);
}

/** One filed period, with its four figures worked out from the ledger. */
function statementView(
  ledger: readonly MockLedgerMovement[],
  period: MockCreditStatement,
  currency: string
): MockCreditStatementView {
  const movements = movementsIn(ledger, period);
  const paidIn = sumBy(
    filter(movements, movement => movement.amount.amount > 0),
    movement => movement.amount.amount
  );
  const drawnDown = sumBy(
    filter(movements, movement => movement.amount.amount < 0),
    movement => -movement.amount.amount
  );
  const closing = closingBalance(ledger, period, currency, movements);
  const opening = round(closing.amount - paidIn + drawnDown, MONEY_PRECISION);
  return {
    id: period.id,
    fromDate: period.fromDate,
    toDate: period.toDate,
    createdAt: period.createdAt,
    opening: mockMoney(opening, currency),
    credits: mockMoney(round(paidIn, MONEY_PRECISION), currency),
    debits: mockMoney(round(drawnDown, MONEY_PRECISION), currency),
    closing,
    movements
  };
}

/** Every filed period, in the order the brand filed them. None with no limit. */
function statementViews(data: MockDataset): MockCreditStatementView[] {
  const currency = statementCurrency(data);
  if (currency === undefined) return [];
  const ledger = chainedLedgerIn(data, currency);
  return map(data.wallet.statements ?? [], period =>
    statementView(ledger, period, currency)
  );
}

/** How the top-up records what it was taken on; absent a stored card, itself. */
function tenderLabel(card: MockPaymentMethod | undefined): string {
  if (card === undefined) return TOP_UP_TENDER;
  return paymentMethodLabel(card);
}

/**
 * The invoice a top-up raises, already settled — a client who adds credit has
 * paid for it, so the document is a receipt rather than a demand. Credit is
 * not a taxable supply, so the whole amount is the subtotal.
 */
function raisePaidInvoice(
  data: MockDataset,
  amount: MockMoney,
  paymentDetailId?: string
): void {
  const invoiceId = idFor("inv", nextSequence());
  const issued = today();
  // The tender is the card the top-up was taken on. An account with no stored
  // card paid some other way, which a mock cannot name — "Top-up" is what the
  // movement IS, where `paymentMethodLabel`'s own fallback would credit the
  // balance this very invoice created.
  const card = topUpCard(data, paymentDetailId);
  const method = tenderLabel(card);
  data.invoices.unshift({
    id: invoiceId,
    number: invoiceId.toUpperCase(),
    issuedDate: issued,
    dueDate: issued,
    subtotal: amount,
    taxes: [],
    total: amount,
    paidAmount: amount,
    unpaidAmount: zeroOf(amount.currency),
    payments: [
      {
        id: `${invoiceId}-p1`,
        date: issued,
        method,
        amount,
        status: MOCK_PAYMENT_STATUS.SUCCESSFUL
      }
    ],
    address: {
      name: data.persona.name,
      company: data.persona.company,
      lines: []
    },
    status: InvoiceStatus.PAID,
    datePaid: issued,
    category: MOCK_INVOICE_CATEGORY.INVOICE,
    shareToken: shareTokenFor(invoiceId),
    paymentDetailId: card?.id,
    lines: [{ id: "l1", description: "Account credit top-up", amount }]
  });
}

/** Which card funded it: the one the client chose, or the account's default. */
function topUpCard(
  data: MockDataset,
  paymentDetailId?: string
): MockPaymentMethod | undefined {
  const chosen = find(data.paymentMethods, { id: paymentDetailId });
  if (chosen !== undefined) return chosen;
  return find(data.paymentMethods, { isDefault: true });
}

/** What a statement download hands the browser — a name and something to fetch. */
export type MockCreditStatementFile = {
  readonly id: string;
  /** What the saved file is called. */
  readonly name: string;
  /** The document itself, inline — a mock has no file server to point at. */
  readonly href: string;
};

/** The CSV's own header row — legacy's four statement columns, in its order. */
const STATEMENT_CSV_COLUMNS = ["Date", "Description", "Amount", "Balance"];

/** One CSV field, quoted so a description carrying a comma stays one field. */
function csvField(value: string): string {
  return `"${replace(value, /"/g, '""')}"`;
}

function csvRow(cells: readonly string[]): string {
  return map(cells, csvField).join(",");
}

/**
 * The statement as a comma-separated file, inline. Built HERE because every
 * figure on it is the server's (plan R6), and because a data URI is the only
 * honest download a mock can hand over — there is no file to fetch.
 */
function statementCsvHref(statement: MockCreditStatementView): string {
  const rows = map(statement.movements, movement => [
    movement.date,
    movement.description,
    String(movement.amount.amount),
    String(movement.balanceAfter.amount)
  ]);
  const document = map([STATEMENT_CSV_COLUMNS, ...rows], csvRow).join("\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(document)}`;
}

/**
 * What is LEFT of the brand's allowance, as a percentage — legacy's
 * `creditLimitRemaining` (`useAccountWallet.ts:98-106`). A brand granting no
 * allowance has nothing to divide by, and reads as nothing left.
 */
export function creditLimitRemainingPercent(data: MockDataset): number {
  const limit = data.wallet.creditLimit;
  if (limit === undefined || limit.allowance.amount <= 0) return 0;
  const left = Math.max(limit.allowance.amount - limit.used.amount, 0);
  return Math.round((left / limit.allowance.amount) * 100);
}

/**
 * How the meter reads at that figure — legacy's own four bands
 * (`creditLimitSummaryMsg.vue:47-52`).
 */
export function creditLimitTone(data: MockDataset): MeterModuleTone {
  const remaining = creditLimitRemainingPercent(data);
  if (remaining < CREDIT_DANGER_BELOW) return METER_MODULE_TONE.DANGER;
  if (remaining < CREDIT_WARNING_BELOW) return METER_MODULE_TONE.WARNING;
  if (remaining < CREDIT_CAUTION_BELOW) return METER_MODULE_TONE.CAUTION;
  return METER_MODULE_TONE.SUCCESS;
}

const CREDIT_DANGER_BELOW = 25;
const CREDIT_WARNING_BELOW = 50;
const CREDIT_CAUTION_BELOW = 75;

/**
 * The same four bands as an ALERT tone. The meter takes the library's
 * `Progress` variants and the notice takes `Alert`'s, which name their
 * neutral accent differently — one derivation, two vocabularies.
 */
export function creditLimitBannerTone(
  data: MockDataset
): AlertProps["variant"] {
  const remaining = creditLimitRemainingPercent(data);
  if (remaining < CREDIT_DANGER_BELOW) return "danger";
  if (remaining < CREDIT_WARNING_BELOW) return "warning";
  if (remaining < CREDIT_CAUTION_BELOW) return "info";
  return "success";
}

/**
 * What the credit line says to the CLIENT — legacy's
 * `_sentence.credit_limit.client_summary`, which names what is left of the
 * allowance and the allowance itself. Absent where the brand grants none.
 */
export function creditLimitSummary(data: MockDataset): string | undefined {
  const limit = data.wallet.creditLimit;
  if (limit === undefined) return undefined;
  const left = Math.max(limit.allowance.amount - limit.used.amount, 0);
  const available = mockMoney(left, limit.allowance.currency);
  return `You have ${available.formatted} remaining from your ${limit.allowance.formatted} credit limit.`;
}

/**
 * The panel's own words — legacy's `client_context`, which names the
 * allowance and the ONE currency the credit may be spent in.
 */
export function creditLimitPanelCopy(data: MockDataset): string {
  const limit = data.wallet.creditLimit;
  if (limit === undefined) return "How far into credit this account may run.";
  return `Your account may run up to ${limit.allowance.formatted} into credit, and top up later to restore it. This credit is only spendable towards payments made in ${limit.allowance.currency}.`;
}

export const useMockWallet = defineMockFacade(
  (data): MockWalletView => ({
    balances: data.wallet.balances,
    // The ledger every reader takes — one running balance, chained once
    // (`mock/ledger.ts`), so the pager and the statements panel print the
    // same figure against the same movement.
    transactions: chainedLedger(data),
    creditLimit: meteredLimit(data.wallet.creditLimit),
    statements: statementViews(data)
  }),
  data => ({
    /**
     * One filed statement as a CSV the browser can save — legacy's
     * `download_csv` entry (`creditStatementsListing.vue:88`), which asked the
     * desk for the same period in a second file type.
     */
    statementFile: (
      statementId: string
    ): MockActionReceipt<MockCreditStatementFile> | undefined => {
      const statement = find(statementViews(data), { id: statementId });
      if (statement === undefined) return undefined;
      return {
        ok: true,
        entity: {
          id: statement.id,
          name: `credit-statement-${statement.fromDate}-${statement.toDate}.csv`,
          href: statementCsvHref(statement)
        }
      };
    },

    /**
     * Adds credit to one currency's balance. The balance a movement leaves
     * behind is the server's running total, so it is worked out here and
     * carried on the row — the statements table only ever prints it.
     */
    topUp: (
      currency: string,
      amount: number,
      paymentDetailId?: string
    ): MockActionReceipt<MockLedgerMovement> | undefined => {
      const held = findIndex(data.wallet.balances, { currency });
      const balance = data.wallet.balances[held];
      if (balance === undefined) return undefined;
      const isTooSmall = !isFinite(amount) || amount < TOP_UP_MINIMUM;
      if (isTooSmall) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.EMPTY_AMOUNT };
      }

      const added = mockMoney(amount, currency);
      const settled = mockMoney(balance.amount + amount, currency);
      data.wallet.balances.splice(held, 1, settled);

      const movement: MockLedgerMovement = {
        id: idFor("wt", nextSequence()),
        date: today(),
        type: WalletTransactionTypes.ADD,
        description: "Top-up",
        amount: added,
        balanceAfter: settled
      };
      data.wallet.transactions.unshift(movement);
      raisePaidInvoice(data, added, paymentDetailId);
      return { ok: true, entity: movement };
    },

    /**
     * Takes credit off one currency's balance — legacy's `use_account_credit`
     * at pay time, which drew on the wallet before the gateway was asked for
     * anything. The balance a movement leaves behind is the server's running
     * total, worked out here as the top-up's is.
     */
    spend: (
      currency: string,
      amount: number,
      description: string
    ): MockActionReceipt<MockLedgerMovement> | undefined => {
      const held = findIndex(data.wallet.balances, { currency });
      const balance = data.wallet.balances[held];
      if (balance === undefined) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.NO_ACCOUNT_CREDIT };
      }
      const isTooSmall = !isFinite(amount) || amount < TOP_UP_MINIMUM;
      if (isTooSmall) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.EMPTY_AMOUNT };
      }
      if (amount > balance.amount) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.NO_ACCOUNT_CREDIT };
      }

      const settled = mockMoney(
        round(balance.amount - amount, MONEY_PRECISION),
        currency
      );
      data.wallet.balances.splice(held, 1, settled);

      const movement: MockLedgerMovement = {
        id: idFor("wt", nextSequence()),
        date: today(),
        type: WalletTransactionTypes.SPEND,
        description,
        amount: mockMoney(-amount, currency),
        balanceAfter: settled
      };
      data.wallet.transactions.unshift(movement);
      return { ok: true, entity: movement };
    }
  })
);
