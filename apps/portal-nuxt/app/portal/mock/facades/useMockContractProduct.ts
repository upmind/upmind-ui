// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockContractProduct
 * @description ONE contract product, managed — the mock stand-in for the
 * `useClientContractProduct` manager §3 hands to the factory
 * (`contracts/client-contract-product.ts`), carrying its nine methods: the
 * setup outcome, the subscription lifecycle (trial, renewal, cancellation,
 * migration) and the two billing settings a product may point elsewhere.
 *
 * The invoices raised here are the mock's SERVER doing the arithmetic (plan
 * R6): a renewal charges the product's own price, a change charges what the
 * change costs. Nothing downstream ever computes one.
 */

import {
  BlueprintFieldsTypes,
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceStatusGroups,
  InvoiceConsolidationTypes,
  InvoiceStatus,
  PriceDisplayTypes
} from "@upmind-automation/types";
import { CANCEL_OPTION } from "../contracts";
import { setupFields } from "../contracts/contract-product-provisioning.schemas";
import { ISO_DATE_LENGTH, today } from "../dates";
import { grossBreakdown, shareTokenFor, zeroOf } from "../documents";
import { mockMoney } from "../money";
import { idFor, nextSequence } from "../store";
import {
  MOCK_TRIAL_END_ACTION,
  MOCK_BILLING_TERM,
  MOCK_BILLING_TYPE,
  MOCK_INVOICE_CATEGORY,
  MOCK_PRODUCT_TAG
} from "../types";
import { defineMockFacade, MOCK_RECEIPT_REASON, submittedText } from "./facade";
import {
  assign,
  compact,
  find,
  forEach,
  get,
  includes,
  isEmpty,
  isFinite,
  isString,
  map,
  omit,
  reject,
  sortBy,
  toNumber,
  trim,
  values
} from "lodash-es";
import type { MockActionReceipt, MockReceiptReason } from "./facade";
import type { ContractCancelOption } from "../contracts";
import type {
  MockBillingTerm,
  MockTrialEndAction,
  MockCancellationRequest,
  MockClientCustomField,
  MockCustomField,
  MockCustomFieldValue,
  MockDataset,
  MockMigrationOption,
  MockInvoice,
  MockInvoiceLine,
  MockMoney,
  MockProduct,
  MockProvisionField
} from "../types";
import type { FormModel } from "@upmind/ui";

/** The states a product may be moved onto another from — a product not running is not changing. */
const MIGRATABLE_STATUSES: readonly ContractStatusCodes[] = [
  ContractStatusCodes.ACTIVE,
  ContractStatusCodes.SUSPENDED
];

/** The tag a product wears only while it awaits its setup blueprint. */
function isSetupPendingTag(tag: string): boolean {
  return tag === MOCK_PRODUCT_TAG.SETUP_PENDING;
}

/** An answer the provider would reject: nothing, or only whitespace. */
function isBlankAnswer(raw: unknown): boolean {
  if (raw === undefined || raw === null) return true;
  if (isString(raw)) return trim(raw).length === 0;
  return false;
}

/**
 * One answer in the type the field's schema declares
 * (`contracts/contract-product-provisioning.schemas.ts`), so a tick box
 * stores a boolean and a number field a number rather than the text of one.
 */
function provisionFieldValue(
  field: MockProvisionField,
  raw: unknown
): MockCustomFieldValue {
  if (field.type === BlueprintFieldsTypes.CHECKBOX) return raw === true;
  if (field.type === BlueprintFieldsTypes.INPUT_NUMBER) {
    const parsed = toNumber(raw);
    if (isFinite(parsed)) return parsed;
    return 0;
  }
  if (raw === undefined || raw === null) return "";
  return String(raw);
}

/** One lifecycle event the product's own dates imply — legacy's `cProdTimeline`. */
export type MockProductEvent = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Absent where the fact carries no day — an undated stop is not positioned. */
  readonly datetime?: string;
  /** True where the day has PASSED — the rail reads it as overdue rather than coming. */
  readonly isPast: boolean;
  /** The invoice the event points at, where it names one. */
  readonly invoiceId?: string;
  /** Where the event LEADS, where it names something reachable. */
  readonly to?: string;
};

/**
 * The product's own lifecycle rail — the dates its STATUS implies, each read
 * from today (`cProdTimeline.vue:201,282-283,327-328,370,410,479,578`): when
 * it renews or raises its next invoice, what is owed on it and whether that
 * has fallen due, and the day it was suspended, cancelled or terminated.
 *
 * Derived here rather than in the selector: every reading is arithmetic over
 * the product's dates and the figures on its invoices (plan R6).
 */
/** The lifecycle events a selector may hang an action on — named once, so the two files cannot drift apart. */
export const PRODUCT_EVENT_ID = {
  AUTO_RENEW_OFF: "auto-renew-off",
  NEXT_INVOICE: "next-invoice",
  TERMINATED: "terminated"
} as const;

export function productLifecycleEvents(
  data: MockDataset,
  product: MockProduct
): MockProductEvent[] {
  const owed = find(
    data.invoices,
    invoice =>
      invoice.productId === product.id &&
      includes(InvoiceStatusGroups.UNPAID, invoice.status)
  );
  return compact([
    renewalEvent(product),
    nextInvoiceEvent(product),
    owed !== undefined && paymentEvent(owed),
    lifecycleStopEvent(product)
  ]);
}

/** When it renews, or the note that it will not — legacy's auto-renew-disabled row. */
function renewalEvent(product: MockProduct): MockProductEvent | undefined {
  if (product.nextDueDate === undefined) return undefined;
  if (!product.autoRenew) {
    return {
      id: PRODUCT_EVENT_ID.AUTO_RENEW_OFF,
      title: "Automatic renewal is off",
      description: `This product will not renew itself on ${product.nextDueDate}.`,
      datetime: product.nextDueDate,
      isPast: hasPassed(product.nextDueDate)
    };
  }
  return {
    id: "renewal",
    title: "Renews",
    description: `This product renews ${relativeReading(product.nextDueDate)}.`,
    datetime: product.nextDueDate,
    isPast: hasPassed(product.nextDueDate)
  };
}

/** The invoice that has yet to be raised, and the control that raises it early. */
function nextInvoiceEvent(product: MockProduct): MockProductEvent | undefined {
  if (product.nextDueDate === undefined) return undefined;
  if (product.autoRenew) return undefined;
  return {
    id: PRODUCT_EVENT_ID.NEXT_INVOICE,
    title: "Next invoice",
    description: `The next invoice is due to be raised ${relativeReading(product.nextDueDate)}. You can raise it yourself.`,
    datetime: product.nextDueDate,
    isPast: hasPassed(product.nextDueDate),
    // The control that raises it early is the product's own, on its billing
    // area — the same door the manage list opens.
    to: `/${product.groupSlug}/${product.id}/billing`
  };
}

/** What is owed on it — named and linked, and worded by whether it has fallen due. */
function paymentEvent(invoice: MockInvoice): MockProductEvent {
  const owed = invoice.unpaidAmount.formatted;
  const when = relativeReading(invoice.dueDate);
  if (hasPassed(invoice.dueDate)) {
    return {
      id: "payment",
      title: "Payment overdue",
      description: `${owed} was due on ${invoice.number} ${when}.`,
      datetime: invoice.dueDate,
      isPast: true,
      invoiceId: invoice.id,
      to: invoicePath(invoice)
    };
  }
  return {
    id: "payment",
    title: "Payment due",
    description: `${owed} is due on ${invoice.number} ${when}.`,
    datetime: invoice.dueDate,
    isPast: false,
    invoiceId: invoice.id,
    to: invoicePath(invoice)
  };
}

/** Where the document itself is read — the billing pillar's own detail route. */
function invoicePath(invoice: MockInvoice): string {
  return `/billing/invoices/${invoice.id}`;
}

/**
 * The day the brand suspended it, where it recorded one. A product suspended
 * without a date still says SO — the fact is the suspension, not the day, and
 * the day it was bought is a different fact entirely.
 */
function suspensionEvent(product: MockProduct): MockProductEvent {
  if (product.suspendedAt === undefined) {
    // No day recorded, so the rail has nowhere to put it: the fact stands
    // without a date rather than sitting on the day it was bought.
    return {
      id: "suspended",
      title: "Suspended",
      description: "This product is suspended.",
      isPast: true
    };
  }
  return {
    id: "suspended",
    title: "Suspended",
    description: `This product was suspended ${relativeReading(product.suspendedAt)}.`,
    datetime: product.suspendedAt,
    isPast: true
  };
}

/** The day it stopped, in the words its own standing gives that day. */
function lifecycleStopEvent(
  product: MockProduct
): MockProductEvent | undefined {
  if (product.status === ContractStatusCodes.SUSPENDED) {
    return suspensionEvent(product);
  }
  if (product.cancelledAt !== undefined) {
    return {
      id: "cancelled",
      title: "Cancelled",
      description: `This product was cancelled ${relativeReading(product.cancelledAt)}.`,
      datetime: product.cancelledAt,
      isPast: hasPassed(product.cancelledAt)
    };
  }
  if (product.autoExpireAt !== undefined) {
    return {
      id: PRODUCT_EVENT_ID.TERMINATED,
      title: "Terminates",
      description: `This product ends ${relativeReading(product.autoExpireAt)}, and will not be renewed.`,
      datetime: product.autoExpireAt,
      isPast: hasPassed(product.autoExpireAt)
    };
  }
  return undefined;
}

function hasPassed(day: string): boolean {
  return day < today();
}

/**
 * A day read FROM TODAY — legacy printed every timeline date as a relative
 * one, so a client reads how far off it is rather than doing the arithmetic.
 */
function relativeDay(day: string): string | undefined {
  // Calendar days ONLY. A datetime carries a clock this reading has no way to
  // honour — "in 3 days" off a timestamp is a rounding, not a fact — so an
  // unparseable spelling reads as nothing rather than as a wrong day.
  if (!ISO_DAY_PATTERN.test(day)) return undefined;
  const days = Math.round((Date.parse(day) - Date.parse(today())) / MS_IN_DAY);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/** `YYYY-MM-DD`, the one date spelling every seeded row uses (`mock/dates.ts`). */
const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The same reading, as a sentence fragment always safe to interpolate: a day
 * this cannot read says "on {day}" rather than leaving a hole in the line.
 */
function relativeReading(day: string): string {
  // A datetime carries a clock the reading cannot honour, so the fallback
  // states the DAY it falls on rather than printing the stamp raw.
  return relativeDay(day) ?? `on ${day.slice(0, ISO_DATE_LENGTH)}`;
}

/**
 * What the trial banner SAYS/**
 * What the trial banner SAYS — legacy's four sentences, chosen by what the
 * end of the trial does (`cProdTrialMsg.vue:45-56`). A trial that has not
 * begun says so and offers nothing; the other three each name the duration,
 * the thing on trial and the day it ends, and carry the early-end wording the
 * control beside them acts on.
 */
export function trialNotice(product: MockProduct): string | undefined {
  if (!isTrialAhead(product)) return undefined;
  const days = countedDays(trialDaysRemaining(product));
  const ends = product.trialEndsAt ?? today();
  const opening = `This product is on a ${days} free trial`;
  if (trialEndAction(product) === MOCK_TRIAL_END_ACTION.PENDING) {
    return `${opening} which will begin when your product has been activated.`;
  }
  const runs = `${opening} which ends ${ends}.`;
  if (trialEndAction(product) === MOCK_TRIAL_END_ACTION.MIGRATE) {
    return `${runs} You can migrate to the paid product early by ending the trial.`;
  }
  if (trialEndAction(product) === MOCK_TRIAL_END_ACTION.CANCEL) {
    return `${runs} You can terminate the trial early by ending it.`;
  }
  return `${runs} You can commit to the paid version early by ending the trial.`;
}

/** What the early-end confirmation asks — legacy's own three (`cProdProvider.vue:689-701`). */
export function trialEndConfirmation(product: MockProduct): string {
  if (trialEndAction(product) === MOCK_TRIAL_END_ACTION.MIGRATE) {
    return "You are about to migrate to the paid version of this product. This ends your free trial and raises a migration invoice to pay.";
  }
  if (trialEndAction(product) === MOCK_TRIAL_END_ACTION.CANCEL) {
    return "Are you sure you want to end your free trial early? Your product will be cancelled with immediate effect.";
  }
  return "You are about to commit to the paid version of this product. This ends your free trial and raises a new invoice to pay.";
}

/**
 * Which reading applies. A product still AWAITING ACTIVATION is on a trial
 * that has not started, whatever it is set to do at the end — legacy checked
 * that first (`cProdTrialMsg.vue:47-48`).
 */
function trialEndAction(product: MockProduct): MockTrialEndAction {
  if (product.status === ContractStatusCodes.AWAITING_ACTIVATION) {
    return MOCK_TRIAL_END_ACTION.PENDING;
  }
  return product.trialEndAction ?? MOCK_TRIAL_END_ACTION.CONTINUE;
}

/** "1 day" / "9 days" — the duration the trial sentences open on. */
function countedDays(days: number): string {
  if (days === 1) return "1 day";
  return `${days} days`;
}

/**
 * How many days of the free trial are left — legacy's `trial_duration`, which
 * its own tag reported beside the date the trial ends. Derived here rather
 * than in the selector: it is arithmetic over a seeded date, and the row
 * renders what it is given.
 */
export function trialDaysRemaining(product: MockProduct): number {
  if (product.trialEndsAt === undefined) return 0;
  const days = Math.ceil(
    (Date.parse(product.trialEndsAt) - Date.parse(today())) / MS_IN_DAY
  );
  return Math.max(days, 0);
}

const MS_IN_DAY = 24 * 60 * 60 * 1000;

/**
 * Whether this product's free trial is still running — the one question both
 * the End-trial control and the guard behind it ask.
 */
export function isTrialAhead(product: MockProduct): boolean {
  if (product.trialEndsAt === undefined) return false;
  return product.trialEndsAt > today();
}

/** How many months each billing term buys — what a monthly figure is divided out of. */
const MONTHS_IN_TERM: Readonly<Record<MockBillingTerm, number>> = {
  [MOCK_BILLING_TERM.MONTHLY]: 1,
  [MOCK_BILLING_TERM.ANNUALLY]: 12
};

function isBillingTerm(term: string | undefined): term is MockBillingTerm {
  return (
    term === MOCK_BILLING_TERM.MONTHLY || term === MOCK_BILLING_TERM.ANNUALLY
  );
}

/**
 * The two settings that ask for a monthly figure. `abs_min` is the platform's
 * older spelling of the same request, and legacy took BOTH down one path
 * (`migrationsListModal.vue:105-110` reads `MONTHLY_FROM`), so a brand set
 * either way quotes and orders the same.
 */
const MONTHLY_PRICE_DISPLAY: readonly PriceDisplayTypes[] = [
  PriceDisplayTypes.LOWEST_MONTHLY_PRICE,
  PriceDisplayTypes.MONTHLY_FROM
];

function quotesMonthly(data: MockDataset): boolean {
  return includes(MONTHLY_PRICE_DISPLAY, data.features.PRICE_DISPLAY_TYPE);
}

/** What one term works out to per month; nothing where the term names no months. */
function monthlyAmount(option: MockMigrationOption): number | undefined {
  if (!isBillingTerm(option.billingTerm)) return undefined;
  return option.price.amount / MONTHS_IN_TERM[option.billingTerm];
}

/**
 * What one change option COSTS, in the words the brand quotes prices in
 * (`BrandConfigKeys.PRICE_DISPLAY_TYPE`). A brand quoting monthly states what
 * a term works out to per month — legacy's own `asLMFP` branch
 * (`migrationsListModal.vue:105-134`) — so an annual option reads beside a
 * monthly one rather than against it.
 *
 * The division happens HERE because the mock's server owns every figure
 * (plan R6): nothing downstream computes money.
 */
export function migrationPriceLabel(
  data: MockDataset,
  option: MockMigrationOption
): string {
  const monthly = monthlyAmount(option);
  if (!quotesMonthly(data) || monthly === undefined) {
    return compact([option.price.formatted, option.billingTerm]).join(" · ");
  }
  return `${mockMoney(monthly, option.price.currency).formatted} / month`;
}

/**
 * The change options in the order the brand quotes them: cheapest MONTHLY
 * figure first where it quotes monthly, which is what legacy ordered the
 * picker by (`migrationsListModal.vue:110-135`) — an annual plan that works
 * out cheaper per month belongs above a dearer monthly one. A brand quoting
 * each cycle keeps the seed's own order.
 */
export function orderedMigrationOptions(
  data: MockDataset,
  product: MockProduct
): MockMigrationOption[] {
  if (!quotesMonthly(data)) return [...product.migrationOptions];
  return sortBy(
    product.migrationOptions,
    option => monthlyAmount(option) ?? option.price.amount
  );
}

/**
 * Whether the brand offers this product's change picker at all — legacy
 * showed the control only where there was somewhere to go and nothing already
 * ending the product. Presence is one question; whether the control is LIVE
 * is `migrationRefusal` below.
 */
export function canOfferMigration(product: MockProduct): boolean {
  const hasSomewhereToGo = !isEmpty(product.migrationOptions);
  const isEnding =
    product.cancellationRequest !== undefined ||
    product.autoExpireAt !== undefined;
  return product.canModify && hasSomewhereToGo && !isEnding;
}

/**
 * Why this product cannot be moved right now, or undefined when it can. Read
 * by the selector for the control's own disabled reason and by the guard the
 * dispatcher asks before it confirms — one derivation, two readers.
 */
export function migrationRefusal(
  product: MockProduct
): MockReceiptReason | undefined {
  if (!canOfferMigration(product)) return MOCK_RECEIPT_REASON.NOT_MIGRATABLE;
  if (!includes(MIGRATABLE_STATUSES, product.status)) {
    return MOCK_RECEIPT_REASON.NOT_MIGRATABLE;
  }
  if (product.pendingProRata) return MOCK_RECEIPT_REASON.PRO_RATA_PENDING;
  return undefined;
}

/**
 * Why the next renewal cannot be raised by hand, or undefined when it can.
 * Legacy offered the control only where the product would NOT raise it
 * itself: a one-time purchase has no next term at all, and a product that
 * renews automatically already has one coming.
 */
export function renewalInvoiceRefusal(
  product: MockProduct
): MockReceiptReason | undefined {
  const isOneTime = product.billingType === MOCK_BILLING_TYPE.ONE_TIME;
  const hasNoRate = product.price === undefined;
  if (isOneTime || hasNoRate) return MOCK_RECEIPT_REASON.NOT_RENEWABLE;
  if (product.autoRenew) return MOCK_RECEIPT_REASON.RENEWS_ITSELF;
  return undefined;
}

/** An immediate cancellation is accepted as it is asked for; the rest wait. */
function acceptedWhen(isImmediate: boolean, at: string): string | undefined {
  if (!isImmediate) return undefined;
  return at;
}

/** Raises one unpaid invoice against a product — the mock's server, summing its own line. */
function raiseInvoice(
  data: MockDataset,
  product: MockProduct,
  description: string,
  amount: MockMoney
): void {
  const sequence = nextSequence();
  const invoiceId = idFor("inv", sequence);
  const issued = today();
  const lines: MockInvoiceLine[] = [{ id: "l1", description, amount }];
  const { subtotal, taxes } = grossBreakdown(amount);
  data.invoices.unshift({
    id: invoiceId,
    number: invoiceId.toUpperCase(),
    issuedDate: issued,
    dueDate: issued,
    subtotal,
    taxes,
    total: amount,
    paidAmount: zeroOf(amount.currency),
    unpaidAmount: amount,
    payments: [],
    address: {
      name: data.persona.name,
      company: data.persona.company,
      lines: []
    },
    status: InvoiceStatus.UNPAID,
    category: MOCK_INVOICE_CATEGORY.INVOICE,
    shareToken: shareTokenFor(invoiceId),
    productId: product.id,
    lines
  });
}

/** Which status each choice lodges — the platform's own cancellation vocabulary. */
const CANCELLATION_STATUS: Readonly<
  Record<ContractCancelOption, CancellationRequestStatusCodes>
> = {
  [CANCEL_OPTION.END_OF_BILLING_CYCLE]:
    CancellationRequestStatusCodes.REQUEST_END_OF_BILLING_CYCLE,
  [CANCEL_OPTION.SCHEDULED]:
    CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION,
  // A cancellation that takes effect now is accepted the moment it is asked
  // for — there is no window in which it could be called off.
  [CANCEL_OPTION.IMMEDIATELY]: CancellationRequestStatusCodes.REQUEST_ACCEPTED
};

/** The verb's tail names one of the three choices, or nothing this seam knows. */
function isCancelOption(value: string): value is ContractCancelOption {
  return includes(values<string>(CANCEL_OPTION), value);
}

/** The choice a client made, or nothing where the payload names none. */
function submittedOption(model: FormModel): ContractCancelOption | undefined {
  const value = model["option"];
  if (!isString(value) || !isCancelOption(value)) return undefined;
  return value;
}

/**
 * The day a cancellation takes effect: the date the client picked, the end of
 * the current term, or today where it stops at once.
 */
function effectiveDate(
  option: ContractCancelOption,
  model: FormModel,
  product: MockProduct
): string {
  if (option === CANCEL_OPTION.SCHEDULED)
    return submittedText(model, "cancelAt");
  if (option === CANCEL_OPTION.END_OF_BILLING_CYCLE) {
    return product.nextDueDate ?? today();
  }
  return today();
}

/** The brand's own cancellation questions, as the answers the request keeps. */
function answeredFields(
  definitions: readonly MockClientCustomField[],
  model: FormModel
): MockCustomField[] {
  const answers = model["customFields"];
  if (answers === null || typeof answers !== "object") return [];
  return compact(
    map(definitions, definition => {
      const given = Reflect.get(answers, definition.code);
      if (given === null || given === undefined || given === "")
        return undefined;
      return { label: definition.name, value: String(given) };
    })
  );
}

export const useMockContractProduct = defineMockFacade(
  (data, productId): MockProduct | undefined =>
    find(data.products, { id: productId }),
  (data, productId) => {
    function product(): MockProduct | undefined {
      return find(data.products, { id: productId });
    }

    /** Legacy's complete-setup outcome: a product awaiting activation goes live. */
    function completeSetup(): MockActionReceipt<MockProduct> | undefined {
      const subject = product();
      if (subject === undefined) return undefined;
      if (subject.status !== ContractStatusCodes.AWAITING_ACTIVATION) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.NOT_AWAITING_SETUP,
          entity: subject
        };
      }
      // The awaiting-setup tag reports a state the product has just left,
      // so it goes with it — the billboard prints the tags verbatim.
      assign(subject, {
        status: ContractStatusCodes.ACTIVE,
        tags: reject(subject.tags ?? [], isSetupPendingTag)
      });
      return { ok: true, entity: subject };
    }

    return {
      completeSetup,
      /**
       * Legacy's setup confirm (`cProdProvConfigManageForm`): the blueprint's
       * answers land on the provider's fields, then the product goes live.
       */
      confirmSetup: (
        model: FormModel
      ): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (subject.status !== ContractStatusCodes.AWAITING_ACTIVATION) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.NOT_AWAITING_SETUP,
            entity: subject
          };
        }
        const asked = setupFields(subject.provisioning.fields);
        const unanswered = find(
          asked,
          field =>
            field.required === true && isBlankAnswer(get(model, field.code))
        );
        if (unanswered !== undefined) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.SETUP_INCOMPLETE,
            entity: subject
          };
        }
        forEach(asked, field => {
          assign(field, {
            value: provisionFieldValue(field, get(model, field.code))
          });
        });
        return completeSetup();
      },

      /** Why the trial cannot be ended, or undefined when it can — asked before the confirmation. */
      whyNotEndTrial: (): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (isTrialAhead(subject)) return undefined;
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.NOT_IN_TRIAL,
          entity: subject
        };
      },

      /** Ends the free trial now: the trial goes, and the next charge falls due today. */
      endTrial: (): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (subject.trialEndsAt === undefined) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.NOT_IN_TRIAL,
            entity: subject
          };
        }
        assign(subject, { trialEndsAt: undefined, nextDueDate: today() });
        return { ok: true, entity: subject };
      },

      /** Why renewal cannot be turned off, or undefined when it can — asked before the confirmation. */
      whyNotAutoRenewOff: (): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (subject.canDisableAutoRenew) return undefined;
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.AUTO_RENEW_LOCKED,
          entity: subject
        };
      },

      /** Turns automatic renewal on or off; a product the brand holds on refuses. */
      setAutoRenew: (
        value: boolean
      ): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        const isLocked = !value && !subject.canDisableAutoRenew;
        if (isLocked) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.AUTO_RENEW_LOCKED,
            entity: subject
          };
        }
        assign(subject, { autoRenew: value });
        return { ok: true, entity: subject };
      },

      /** Withdraws a lodged cancellation; one the brand has already accepted refuses. */
      abortCancellation: (): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        const request = subject.cancellationRequest;
        if (request === undefined) return undefined;
        if (request.acceptedAt !== undefined) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.CANCELLATION_ACCEPTED,
            entity: subject
          };
        }
        assign(subject, { cancellationRequest: undefined });
        return { ok: true, entity: subject };
      },

      /** Clears a scheduled expiry: the product renews itself again rather than running out. */
      disableAutoExpire: (): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (subject.autoExpireAt === undefined) return undefined;
        assign(subject, { autoExpireAt: undefined, autoRenew: true });
        return { ok: true, entity: subject };
      },

      /** Why the renewal invoice cannot be raised, or undefined when it can. */
      whyNotCreateRenewalInvoice: ():
        | MockActionReceipt<MockProduct>
        | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        const reason = renewalInvoiceRefusal(subject);
        if (reason === undefined) return undefined;
        return { ok: false, reason, entity: subject };
      },

      /** Raises the next renewal invoice now — legacy's own control for a product that will not renew itself. */
      createRenewalInvoice: (): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        const reason = renewalInvoiceRefusal(subject);
        if (reason !== undefined) return { ok: false, reason, entity: subject };
        // `renewalInvoiceRefusal` has already refused a product with no rate.
        if (subject.price === undefined) return undefined;
        raiseInvoice(data, subject, `${subject.name} renewal`, subject.price);
        return { ok: true, entity: subject };
      },

      /** Why this product cannot be moved onto another, or undefined when it can. */
      whyNotMigratable: (): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        const reason = migrationRefusal(subject);
        if (reason === undefined) return undefined;
        return { ok: false, reason, entity: subject };
      },

      /**
       * Moves the product onto one of its offered targets: it takes on that
       * product's facts, and the change itself is invoiced pro rata.
       */
      migrate: (
        targetProductId: string
      ): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        const target = find(subject.migrationOptions, { id: targetProductId });
        if (target === undefined) return undefined;
        const reason = migrationRefusal(subject);
        if (reason !== undefined) {
          return { ok: false, reason, entity: subject };
        }
        // The DIRECTION of the change is the swap itself; the adjustment is
        // what making it costs, which is a figure either way.
        const difference = mockMoney(
          Math.abs(target.price.amount - (subject.price?.amount ?? 0)),
          target.price.currency
        );
        assign(subject, omit(target, ["id"]), { pendingProRata: true });
        raiseInvoice(data, subject, "Pro-rata adjustment", difference);
        return { ok: true, entity: subject };
      },

      /** Points this product's billing at one of the client's stored cards. */
      setPaymentDetail: (
        paymentDetailId: string
      ): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (find(data.paymentMethods, { id: paymentDetailId }) === undefined) {
          return undefined;
        }
        assign(subject, { paymentDetailId });
        return { ok: true, entity: subject };
      },

      /** Sets whether this product's invoices join the account's consolidated one. */
      setConsolidation: (
        value: InvoiceConsolidationTypes
      ): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (!includes(values(InvoiceConsolidationTypes), value)) {
          return undefined;
        }
        assign(subject, { invoiceConsolidation: value });
        return { ok: true, entity: subject };
      },

      /**
       * The client's own name for this product. A cleared label is cleared
       * rather than stored blank: the lists fall back to the product's own
       * name, which is what a client who empties the field is asking for.
       */
      setLabel: (label: string): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        const named = trim(label);
        if (named === "") {
          assign(subject, { customLabel: undefined });
          return { ok: true, entity: subject };
        }
        assign(subject, { customLabel: named });
        return { ok: true, entity: subject };
      },

      /**
       * Lodges a cancellation. Which STATUS it lodges is the choice's to say,
       * and a cancellation that takes effect at once stops the product here
       * and now rather than standing as a request nobody will act on.
       */
      requestCancellation: (
        model: FormModel
      ): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (subject.cancellationRequest !== undefined) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.CANCELLATION_REQUESTED,
            entity: subject
          };
        }
        const option = submittedOption(model);
        const reason = submittedText(model, "reason");
        if (option === undefined || reason === "") return undefined;
        // A choice that stops the product on a DATE and names none is not a
        // request this layer can lodge — the schema says the same thing at
        // the field, and the store is never left trusting one. It REFUSES by
        // its own reason rather than answering `undefined`: the product was
        // found, so "not found" would name the wrong thing.
        const cancelAt = effectiveDate(option, model, subject);
        if (cancelAt === "") {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.EMPTY_CANCEL_DATE,
            entity: subject
          };
        }
        if (subject.pendingProRata) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.PRO_RATA_PENDING,
            entity: subject
          };
        }

        const requested = today();
        const isImmediate = option === CANCEL_OPTION.IMMEDIATELY;
        const request: MockCancellationRequest = {
          status: CANCELLATION_STATUS[option],
          requestedAt: requested,
          acceptedAt: acceptedWhen(isImmediate, requested),
          reason,
          cancelAt,
          fields: answeredFields(data.cancellationFields, model)
        };
        assign(subject, { cancellationRequest: request });
        if (isImmediate) {
          assign(subject, {
            status: ContractStatusCodes.CANCELLED,
            cancelledAt: cancelAt,
            autoRenew: false
          });
        }
        return { ok: true, entity: subject };
      },

      /** Points this product's invoices at one of the client's companies. */
      setBillingCompany: (
        billingCompanyId: string
      ): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (find(data.companies, { id: billingCompanyId }) === undefined) {
          return undefined;
        }
        assign(subject, { billingCompanyId });
        return { ok: true, entity: subject };
      },

      /** Points this product's invoices at one of the client's addresses. */
      setBillingAddress: (
        billingAddressId: string
      ): MockActionReceipt<MockProduct> | undefined => {
        const subject = product();
        if (subject === undefined) return undefined;
        if (find(data.addresses, { id: billingAddressId }) === undefined) {
          return undefined;
        }
        assign(subject, { billingAddressId });
        return { ok: true, entity: subject };
      }
    };
  }
);
