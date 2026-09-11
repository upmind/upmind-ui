// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/facade
 * @description The mock twin of a headless MANAGER (plan R3): the ADR-001
 * four-layer return (`useContext` / `useMeta` / `useActions` / `useInternals`)
 * over one record or one list of the live dataset, minted once per
 * (dataset, key) exactly as `useClientEmailManager` mints one interpreter per
 * scope. The collection generic (`collections.ts`) is its paged sibling; this
 * one carries the WRITES the store used to expose as bare functions.
 *
 * Every write answers with a receipt rather than feedback: which copy a
 * refusal earns is the dispatcher's call, not the facade's (plan R4 — the
 * facade stays presentation-free, as headless is).
 */

import { computed } from "vue";
import { nextId } from "../store";
import {
  assign,
  includes,
  isEmpty,
  isFinite,
  isNumber,
  isString,
  toNumber,
  trim
} from "lodash-es";
import type { MockDataset } from "../types";
import type { FormModel } from "@upmind/ui";
import type { ResponseError } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

/** Why a write refused — a code the dispatcher renders, never a message. */
export const MOCK_RECEIPT_REASON = {
  ALREADY_PAID: "already-paid",
  NOT_AWAITING_SETUP: "not-awaiting-setup",
  /** A required blueprint field was left blank. */
  SETUP_INCOMPLETE: "setup-incomplete",
  DEFAULT_METHOD: "default-method",
  LAST_METHOD: "last-method",
  NOTHING_UNREAD: "nothing-unread",
  IMPERSONATION_REFUSED: "impersonation-refused",
  /** An order that has moved past the point a client may call it off. */
  NOT_CANCELLABLE: "not-cancellable",
  /** A product with an invoice past its due date — settle first, then cancel. */
  OVERDUE_INVOICES: "overdue-invoices",
  /** A product the brand does not let clients cancel. */
  CANCELLATION_FORBIDDEN: "cancellation-forbidden",
  /** The current password typed before a sensitive change did not match. */
  WRONG_PASSWORD: "wrong-password",
  /** The card the account already charges first. */
  ALREADY_DEFAULT: "already-default",
  /** A provider function that goes somewhere, with nowhere named. */
  NO_PROVISION_TARGET: "no-provision-target",
  /** A product whose free trial has already run out, or never ran. */
  NOT_IN_TRIAL: "not-in-trial",
  /** A product the brand does not let this client move onto another. */
  NOT_MIGRATABLE: "not-migratable",
  /** A product still settling a pro-rata change from the LAST move. */
  PRO_RATA_PENDING: "pro-rata-pending",
  /** A product whose renewal the brand keeps on. */
  AUTO_RENEW_LOCKED: "auto-renew-locked",
  /** A product that raises its own renewal when the term is up. */
  RENEWS_ITSELF: "renews-itself",
  /** A one-time purchase — there is no next term to invoice. */
  NOT_RENEWABLE: "not-renewable",
  /** A cancellation the brand has already accepted — past calling off. */
  CANCELLATION_ACCEPTED: "cancellation-accepted",
  /** A capability the contract declares and this phase has not built. */
  NOT_IMPLEMENTED: "not-implemented",
  /** A KNOWN verb whose payload names a row the dataset does not hold. */
  NOT_FOUND: "not-found",
  /** The entry the account falls back on — deleting it would leave no default. */
  DEFAULT_CONTACT: "default-contact",
  /** An entry the platform keeps — the wire's own `meta.canDelete`. */
  NOT_DELETABLE: "not-deletable",
  /** An affiliate account that has already joined the programme. */
  ALREADY_ENROLLED: "already-enrolled",
  /** An affiliate account the brand has suspended. */
  AFFILIATE_DISABLED: "affiliate-disabled",
  /** A ticket that is still open — there is nothing to reopen. */
  NOT_CLOSED: "not-closed",
  /** A ticket the client has already closed. */
  ALREADY_CLOSED: "already-closed",
  /** A ticket the desk has locked against further changes. */
  LOCKED: "locked",
  /** A ticket somebody has already been given access to. */
  ALREADY_DELEGATED: "already-delegated",
  /** A message the client has already withdrawn — there is nothing left to change. */
  ALREADY_DELETED: "already-deleted",
  /** A message rewritten to nothing — an empty body is not a message. */
  EMPTY_MESSAGE: "empty-message",
  /** A ticket that is about no product, so there is none to detach. */
  NO_RELATED_PRODUCT: "no-related-product",
  /** A name the client cleared — a card with no name is not a rename. */
  EMPTY_NAME: "empty-name",
  /** An entry the account already holds — a second copy would be the same row twice. */
  DUPLICATE_CONTACT: "duplicate-contact",
  /** A new password and its confirmation that were not typed the same. */
  PASSWORD_MISMATCH: "password-mismatch",
  /** A two-factor code that is not six digits — the shape is wrong before the value is. */
  INVALID_TWO_FACTOR_CODE: "invalid-two-factor-code",
  /** Credentials the logged-out screen cannot accept — one refusal, whichever field is wrong. */
  INVALID_CREDENTIALS: "invalid-credentials",
  /** An email-verification code that is not six digits — the shape is wrong before the value is. */
  INVALID_VERIFICATION_CODE: "invalid-verification-code",
  /** A cancellation scheduled for a day the request never named. */
  EMPTY_CANCEL_DATE: "empty-cancel-date",
  /** A card number no issuer could have minted — it fails the Luhn check. */
  INVALID_CARD: "invalid-card",
  /** A top-up of nothing — the ledger has no movement to record. */
  EMPTY_AMOUNT: "empty-amount",
  /** A product that already has a cancellation lodged against it. */
  CANCELLATION_REQUESTED: "cancellation-requested",
  /** Somebody this client has already invited — a second invitation is the same grant twice. */
  DUPLICATE_DELEGATE: "duplicate-delegate",
  /** A withdrawal asked for against a balance with nothing cleared in it. */
  NOTHING_TO_WITHDRAW: "nothing-to-withdraw",
  /** A brand that publishes no desk to raise a thread with. */
  NO_DEPARTMENT: "no-department",
  /** The account the client is already acting for — switching to it moves nothing. */
  ALREADY_ACTIVE: "already-active",
  /** An avatar address the client cleared — a picture with no address is not a picture. */
  EMPTY_IMAGE: "empty-image",
  /** A token page reached with no address, or one this account does not hold. */
  UNKNOWN_EMAIL: "unknown-email",
  /** Fewer than two invoices the brand would gather — one document is already one. */
  NOTHING_TO_CONSOLIDATE: "nothing-to-consolidate",
  /** A payment whose gateway published no instructions to follow. */
  NO_PAYMENT_INSTRUCTIONS: "no-payment-instructions",
  /** A stored method the gateway has already confirmed — there is nothing to retry. */
  ALREADY_VERIFIED: "already-verified",
  /** A stored method the gateway will not take a second confirmation attempt on. */
  NOT_VERIFIABLE: "not-verifiable",
  /** A brand that settles every stored card itself — the client has no say to withdraw. */
  AUTO_PAYMENT_FORCED: "auto-payment-forced",
  /** A ticket booked to open at a moment that has already passed. */
  SCHEDULE_NOT_FUTURE: "schedule-not-future",
  /** A brand that takes no withdrawal requests at all. */
  WITHDRAWAL_DISABLED: "withdrawal-disabled",
  /** A currency the brand publishes no rate for — there is no honest figure to charge. */
  CURRENCY_NOT_PAYABLE: "currency-not-payable",
  /** A capability the client's own area never carried — legacy kept it for staff. */
  NOT_PERMITTED: "not-permitted",
  /** A payment for more than the document still owes. */
  AMOUNT_ABOVE_OWED: "amount-above-owed",
  /** A payment for less than the whole, on a brand that takes only the whole. */
  PARTIAL_PAYMENT_REFUSED: "partial-payment-refused",
  /** Credit asked for against a balance the account does not hold in that currency. */
  NO_ACCOUNT_CREDIT: "no-account-credit",
  /** A topic the brand sends whatever the client says — its channels never move. */
  TOPIC_MANDATORY: "topic-mandatory",
  /** An account still being imported — nothing on it may be changed yet. */
  STAGED_IMPORT: "staged-import",
  /** A document whose offline payment has been recorded but has not arrived. */
  CLEARING: "clearing"
} as const;

export type MockReceiptReason =
  (typeof MOCK_RECEIPT_REASON)[keyof typeof MOCK_RECEIPT_REASON];

/**
 * One write's outcome. A write with no subject at all (an id the dataset does
 * not hold) answers `undefined` instead — a fact about THIS layer, not a
 * silence: the dispatcher turns it into the `NOT_FOUND` refusal (actions.ts
 * `fromReceipt`), because a control the client pressed always answers.
 */
export type MockActionReceipt<TEntity> = {
  readonly ok: boolean;
  readonly reason?: MockReceiptReason;
  readonly entity?: TEntity;
};

/**
 * A created row's id, in the store's own `<prefix>-new-<n>` namespace — which
 * no seed uses, so a minted id can never land on a seeded one. A bare
 * `<prefix>-<n>` counter DID: it shares the seeds' numeric namespace, and
 * after a reset the first minted phone was `tel-1`, which hostgrid already
 * holds.
 *
 * `taken` is the ids the list already carries. The namespace alone makes a
 * collision unreachable; drawing again until the candidate is free is the
 * guard that keeps it so if a seed ever adopts the `-new-` spelling.
 */
export function mockId(
  prefix: string,
  taken: readonly (string | null | undefined)[] = []
): string {
  let candidate = nextId(prefix);
  while (includes(taken, candidate)) candidate = nextId(prefix);
  return candidate;
}

/**
 * One string field off a submitted form model, trimmed — an absent or
 * non-string value reads as empty. Every facade that answers a submit reads
 * its model through this: the engine hands over whatever the control held,
 * and a field of spaces is a field the client left blank.
 */
export function submittedText(model: FormModel, key: string): string {
  const value = model[key];
  if (!isString(value)) return "";
  return trim(value);
}

/**
 * One number off a submitted form model, or nothing where the field was left
 * empty — `submittedText`'s numeric twin, and read by the dispatcher as well
 * as by the facades. The value is inspected BEFORE `toNumber` sees it: lodash
 * answers 0 for `null` and for the empty string, so a field the client
 * CLEARED would otherwise arrive as a deliberate zero (a top-up of 0, or the
 * DISABLED consolidation state).
 */
export function submittedNumber(
  model: FormModel,
  key: string
): number | undefined {
  const value = model[key];
  if (isNumber(value)) return finiteOrNothing(value);
  if (!isString(value) || value === "") return undefined;
  return finiteOrNothing(toNumber(value));
}

function finiteOrNothing(value: number): number | undefined {
  if (!isFinite(value)) return undefined;
  return value;
}

/** The lifecycle members every headless manager carries, whatever it manages. */
export type MockFacadeLifecycle = {
  /** Drops this instance from its registry so the next resolve re-mints. */
  destroy: () => void;
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  isReady: () => Promise<boolean>;
  refresh: () => Promise<void>;
};

export type MockFacadeContext<TData> = {
  /** The reactive record (or list) this instance resolved. */
  data: ComputedRef<TData>;
  /** The scope's captured error — a mock never has one. */
  error: ComputedRef<ResponseError | undefined>;
};

export type MockFacadeMeta = {
  hasError: ComputedRef<boolean>;
  isAvailable: ComputedRef<boolean>;
  isEmpty: ComputedRef<boolean>;
  isLoading: ComputedRef<boolean>;
};

/** R9: the real layer exposes the raw TanStack query, which a mock cannot honestly construct. */
export type MockFacadeInternals = {
  query: undefined;
};

export type MockFacade<TData, TActions> = {
  useActions: () => TActions & MockFacadeLifecycle;
  useContext: () => MockFacadeContext<TData>;
  useInternals: () => MockFacadeInternals;
  useMeta: () => MockFacadeMeta;
};

/**
 * The registry every facade definition owns — a `WeakMap` keyed on the
 * reactive dataset object, so `resetMockData` (a new object) resets every
 * instance for free, and the key discriminates the record within it
 * (`useMockInvoice(data, 'inv-88')`), mirroring the scope registry. `build`
 * receives `forget`, the door its own `destroy` closes.
 *
 * Exported because a facade whose four layers are the REAL module's types
 * (`useMockReceivedEmail`) cannot be minted by `defineMockFacade` — its meta
 * carries members the generic does not — and would otherwise carry a second
 * copy of this bookkeeping.
 */
export function defineScopedInstance<TInstance>(
  build: (data: MockDataset, key: string, forget: () => void) => TInstance
): (data: MockDataset, key?: string) => TInstance {
  const registries = new WeakMap<MockDataset, Map<string, TInstance>>();

  return function resolve(data: MockDataset, key = ""): TInstance {
    let registry = registries.get(data);
    if (registry === undefined) {
      registry = new Map();
      registries.set(data, registry);
    }
    const instances = registry;
    const existing = instances.get(key);
    if (existing !== undefined) return existing;

    const minted = build(data, key, () => {
      instances.delete(key);
    });
    instances.set(key, minted);
    return minted;
  };
}

/** Declares one facade over the generic four layers, on the registry above. */
export function defineMockFacade<TData, TActions>(
  select: (data: MockDataset, key: string) => TData,
  createActions: (data: MockDataset, key: string) => TActions
): (data: MockDataset, key?: string) => MockFacade<TData, TActions> {
  return defineScopedInstance<MockFacade<TData, TActions>>(
    (data, key, forget) => {
      const record = computed<TData>(() => select(data, key));
      const context: MockFacadeContext<TData> = {
        data: record,
        error: computed<ResponseError | undefined>(() => undefined)
      };
      const meta: MockFacadeMeta = {
        hasError: computed<boolean>(() => false),
        isAvailable: computed<boolean>(() => true),
        isEmpty: computed<boolean>(() => isEmpty(record.value)),
        isLoading: computed<boolean>(() => false)
      };
      const actions = assign(
        createActions(data, key),
        mockFacadeLifecycle(forget)
      );

      return {
        useActions: () => actions,
        useContext: () => context,
        useInternals: () => ({ query: undefined }),
        useMeta: () => meta
      };
    }
  );
}

/** The four lifecycle members, over one instance's own registry door. */
export function mockFacadeLifecycle(forget: () => void): MockFacadeLifecycle {
  return {
    destroy: forget,
    invalidate: <T>(payload?: T): Promise<T | undefined> =>
      Promise.resolve(payload),
    isReady: (): Promise<boolean> => Promise.resolve(true),
    refresh: (): Promise<void> => Promise.resolve()
  };
}
