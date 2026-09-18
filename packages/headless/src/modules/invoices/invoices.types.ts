/**
 * @graphify-citation `graphify query "InvoicesContextTypes InvoicesScopeMatrix
 * invoice scope matrix"` against `graphify-out/graph.json` (2026-09-01)
 * returns only the module's OWN pre-conversion nodes (`Invoice`,
 * `invoices.types.ts`, `useInvoice.ts`, `invoices.service.ts`) — no
 * `InvoicesContextTypes` / `INVOICES_SCOPE_MATRIX` / `InvoiceScopeMatrix` node
 * anywhere in the tree, so minting them here is new ground, not a duplicate.
 * A second query, `"InvoiceUnpaidAmount InvoicePaymentDetailsModel
 * InvoiceQueryModel InvoiceBundleGroup InvoicesServices"`, returns NO
 * matching nodes at all — confirming none of these five types exist yet
 * either. A third query, `"PAYMENT_STATE PaymentState invoice payment state
 * enum"`, confirms `PAYMENT_STATE`/`PaymentState` already exist at
 * `invoices.types.ts:8-16` and are REUSED here, not re-minted. A fourth,
 * `"InvoiceStatusGroups CreditNoteStatus InvoiceCategoryCode"`, confirms all
 * three already exist in `packages/types` and are imported, not re-declared.
 * A fifth, `"InvoicesServices downloadPdf invoice PDF download blob"`
 * (2026-09-09), returns only this module's own pre-existing nodes — no
 * `downloadPdf` member anywhere in the tree, so `InvoicesServices.downloadPdf`
 * below is new ground, not a duplicate.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.types
 * @description Types for the invoices module's conversion (M1 -> M3): the
 * query-backed collection (`useInvoices`) and the query-backed single read
 * (`useInvoice`). The COLLECTION owns a context ENUM and a matrix whose
 * `client` cell holds four RETARGET members — `client` plus the `contract` /
 * `contracts_product` / `invoice` relationships (FE-3031 F3, OR-1) — because
 * WHICH entity a read is scoped to is a genuine actor context. The SINGLE READ
 * owns NO context enum — which invoice is read
 * is a record id (`.withId(id)`), not a context — but it still owns a
 * matrix, an ALL-`never` one, because that is the only construct that makes
 * `.for()` unspellable (`templates/SINGLE-READ.md`). Both matrices resolve
 * `STAFF` to `never`: the staff actor is deprecated for this resource by
 * operator ruling 2026-09-01 (see `INVOICES_SCOPE_MATRIX` below). The
 * services contract and mapper are shared between the two composables, which
 * is what keeps ONE identity seam for both halves. The module has no state
 * machine (variant `query`) and no edit-form schema pair — its one mutation
 * is a single nullable id (see `InvoicePaymentDetailsModel`).
 */

import { AccessRoleTypes, UpmindObjectTypes } from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { FormattedDate, ResponseError } from "../../utils";
import type { BasketProduct } from "../basket-product";
import type { Client } from "../client";
import type { Address } from "../client-address/client-address.types";
import type { Currency } from "../currency/currency.types";
import type { LookupItem } from "../lookup";
import type { ListQuery, SimpleQuery } from "../query";
import type { ScopeContext } from "../scope";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
// IInvoice added for InvoicesListQuery/InvoiceItemQuery's wire-type argument
// (S1) — already imported and used elsewhere in this module's own services
// file; not a new type (see this file's head `graphify-out/` citation).
import type {
  InvoiceCategoryCode,
  InvoiceStatus,
  CreditNoteStatus,
  IContract,
  IContractProduct,
  IInvoice
} from "@upmind-automation/types";
// MaybeRef added for loadUnpaidAmount's reactive currency param — widening an
// existing member, not a new type (see this file's head `graphify-out/` citation).
import type { ComputedRef, MaybeRef, Ref } from "vue";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one context enum
//
// The collection's matrix resolves a cell. The single read's matrix refuses
// EVERY cell: it has no context enum, because it marks its record with
// `.withId(id)`, and an all-`never` matrix is what keeps `.for()` unspellable
// while the enum is gone. Model: `client-email-history.types.ts:53-125`.
// -----------------------------------------------------------------------------

/**
 * Context types for the invoice COLLECTION — the entity a read is scoped to.
 * Every relationship value is sourced from the canonical object-type enum
 * (`UpmindObjectTypes`), never a minted literal — `IdContextsForActor` extracts
 * the string VALUE, so `.for('contract', id)` only spells if that value is
 * `"contract"` (`scope.types.ts`).
 */
export enum InvoicesContextTypes {
  /** Reading an entitled client's invoices (sub-account or delegator). */
  CLIENT = AccessRoleTypes.CLIENT,
  /** Reading one contract's invoices (`filter[contracts.id]`). */
  CONTRACT = UpmindObjectTypes.CONTRACT,
  /** Reading one contract product's invoices (`filter[products.contracts_product_id]`). */
  CONTRACT_PRODUCT = UpmindObjectTypes.CONTRACTS_PRODUCT,
  /** Reading one parent invoice's credit notes (`filter[credit_invoice_id]`). */
  INVOICE = UpmindObjectTypes.INVOICE
}

/**
 * Each relationship context's wire filter column. The scope seam
 * (`invoices.services.ts`) reads this to seed the resolved slot and keep it
 * durable across criteria writes, exactly as it does the client's own
 * `client_id`. Values are `InvoiceQueryModel` filter keys — no raw
 * `filter[...]` string is minted here.
 */
export const INVOICES_CONTEXT_WIRE_KEYS = {
  [InvoicesContextTypes.CLIENT]: "client_id",
  [InvoicesContextTypes.CONTRACT]: "contracts.id",
  [InvoicesContextTypes.CONTRACT_PRODUCT]: "products.contracts_product_id",
  [InvoicesContextTypes.INVOICE]: "credit_invoice_id"
} as const satisfies Record<InvoicesContextTypes, keyof InvoiceFilterModel>;

/** One durable filter column and the reactive-or-static id that seeds it. */
export type DurableFilterSlot = {
  key: (typeof INVOICES_CONTEXT_WIRE_KEYS)[InvoicesContextTypes];
  value: MaybeRef<string | undefined>;
};

/**
 * Scope matrix for `useInvoices`.
 *
 * `STAFF: null as never` states, in code, the operator ruling of 2026-09-01
 * (verbatim): "this is client only, staff is being deprecated." This
 * withdraws the oracle's admin path (`oracle:25-34` -> `api/admin/invoices`,
 * `oracle:279-542` every admin-only write) for this resource. No Linear issue
 * is owed for a retiring platform capability
 * (`docs/sdd/FE-3031/parity.yaml`, cells `staff x self` / `staff x client`,
 * `signoff: op:dom@upmind.com:2026-09-01`). A matrix cell states what the
 * shipped code does, never what the wire can do (design D6).
 *
 * `SELF: never` withdraws `.for()` only — `.as('self')` still resolves and
 * falls through `resolveClientId` to the reading client's own id, which IS
 * the `client x self` cell (`invoices.services.ts`). A cell governs `.for()`
 * ONLY (`client-email-history.types.ts:74-77`).
 *
 * The `CLIENT` actor's cell is an ARRAY of RETARGET members (`scope.types.ts`
 * array-cell form): `client` is the `client x client` cell (a declared
 * `client_id` filter column on `useQuerySchema()`, never a path segment — the
 * client lane has no `api/clients/{id}/invoices` route, `oracle:25-34`), and
 * `contract` / `contracts_product` / `invoice` are the three entity
 * relationships (FE-3031 F3, OR-1), each a declared filter column the scope
 * seam seeds (`INVOICES_CONTEXT_WIRE_KEYS`).
 *
 * @decision
 * what: model the three entity relationships as RETARGET context members of
 * the CLIENT cell, not as consumer-settable filter-bar columns.
 * why: a relationship is an actor-scope slot (`.for('contract', id)`), not a
 * free filter — one context slot per read, seeded and kept durable through the
 * same seam the client already flows through, so a preset write
 * (`filterCreditNotes()`) cannot silently drop it (OR-1 (b)). The wire stays
 * flat `filter[...]`; only the public API shape changes.
 * rejected: leaving the three as raw filter columns — a caller could set them
 * alongside the client, and a preset write would drop them; neither matches
 * the "scope slot" contract this story asks for.
 */
export const INVOICES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: [
    InvoicesContextTypes.CONTRACT,
    InvoicesContextTypes.CONTRACT_PRODUCT,
    InvoicesContextTypes.INVOICE,
    InvoicesContextTypes.CLIENT
  ],
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useInvoices` (derived from the runtime const). */
export type InvoicesScopeMatrix = typeof INVOICES_SCOPE_MATRIX;

/**
 * Scope matrix for `useInvoice` — the SINGLE read. Every actor is
 * `null as never`, so `.for(type, id)` is a compile-time error for all four.
 * One invoice is marked with `.withId(id)`, never with a scope context — an
 * ADR-001 context names an entity the actor acts UPON, and a single invoice
 * being read is not one (`templates/SINGLE-READ.md`).
 *
 * Its TYPE is passed as `createScopedComposable`'s `TMatrix`, exactly like
 * `InvoicesScopeMatrix` above — NEITHER composable's matrix VALUE is passed
 * as a third (runtime) argument (`useInvoice.ts` / `useInvoices.ts`), so no
 * runtime matrix reaches the registry for either read (W3: this file
 * previously implied an asymmetry here that does not exist; not a new type,
 * see this file's head `graphify-out/` citation). Dropping the TYPE
 * argument here specifically would still re-open `.for("anything", id)`
 * because the default `ActorContextMatrix` widens every cell to `string` —
 * not optional paperwork. Not re-exported from the module barrel: it names
 * no context a consumer can spell.
 */
export const INVOICE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useInvoice` (derived from the runtime const). */
export type InvoiceScopeMatrix = typeof INVOICE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/**
 * The WHOLE vocabulary of sortable columns — the sort control offers exactly
 * these and nothing else. Receipts: `sorters/invoices.ts:5-33` (all but
 * `number`) + `sorters/creditNotes.ts:4-21` (`number`).
 */
export type InvoiceSortableField =
  | "create_datetime"
  | "number"
  | "total_amount"
  | "net_amount"
  | "status"
  | "paid_datetime"
  | "due_date"
  | "cancellation_datetime";

/** One sort entry — the MODEL's ordered form; precedence is position. */
export type InvoiceSortEntry = {
  field: InvoiceSortableField;
  dir: SortDirection;
};

/**
 * The BOOT order — most recently created first. Declared as the query
 * schema's `sort` default, so an emptied sort refills itself on the next
 * parse.
 */
export const INVOICE_DEFAULT_SORT: InvoiceSortEntry[] = [
  { field: "create_datetime", dir: SortDirection.DESC }
];

// -----------------------------------------------------------------------------
// QUERY MODEL — the whole request state, owned by ONE schema
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (nested column -> operator
 * -> value), `sort` (ordered, precedence = position) and `pagination`. The
 * instance validated against `useQuerySchema()`; `list()`'s translator maps
 * it to the wire triple. Every column here is named in `design.md`'s "Filter
 * columns" table with the oracle receipt for its operator set — no column or
 * operator here is invented.
 */
export type InvoiceQueryModel = {
  filters?: {
    /** URL-only: no bar control. */
    id?: string;
    /** Drawn as a search-shaped control. */
    number?: string;
    /**
     * Widened to admit {@link CreditNoteStatus} for AC7 (`design.md` "Filter
     * columns"). Reuses `InvoiceStatusGroups` triples — never re-declared
     * here.
     */
    "status.code"?:
      | InvoiceStatus
      | CreditNoteStatus
      | (InvoiceStatus | CreditNoteStatus)[];
    /** Set by the scope context (AC12), not drawn in the bar. */
    client_id?: string;
    /** Tri-state — `null` is a member, not an absence. */
    is_consolidation?: boolean | null;
    /** The credit-notes preset filters on this (AC7). */
    "category.slug"?: InvoiceCategoryCode | InvoiceCategoryCode[];
    /** Seeded from the `.for('invoice', id)` scope slot (AC7); not consumer-settable. */
    credit_invoice_id?: string;
    /** Used by the consolidatable preset (AC2); not drawn. */
    paid_amount?: number;
    total_amount?: number;
    net_amount?: number;
    /** URL-only: no bar control. */
    total_discount_amount?: number;
    create_datetime?: { eq?: string; gte?: string; lte?: string };
    due_date?: { eq?: string; gte?: string; lte?: string };
    /** Tri-state; URL-only. */
    proforma?: boolean | null;
    /**
     * Declared for parity, deliberately undrawn for a client bar — filterable
     * by URL and absent from the bar (`design.md` "Filter columns").
     */
    fraud_status?: number | number[];
    /** Seeded from the `.for('contract', id)` scope slot; not consumer-settable. */
    "contracts.id"?: string;
    /** Seeded from the `.for('contracts_product', id)` scope slot; not consumer-settable. */
    "products.contracts_product_id"?: string;
  };
  sort?: InvoiceSortEntry[];
  /**
   * `limit` carries the declared `"count"` sentinel alongside a plain integer
   * — the oracle's raw `limit: "count"` literal (`oracle:557`, `:580`),
   * declared rather than hand-appended beside the criteria channel.
   */
  pagination?: { limit?: number | "count"; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link InvoiceQueryModel}. */
export type InvoiceFilterModel = NonNullable<InvoiceQueryModel["filters"]>;

/** The ordered sort model — the `sort` branch of {@link InvoiceQueryModel}. */
export type InvoiceSortModel = NonNullable<InvoiceQueryModel["sort"]>;

/**
 * The collection's query schema. A `JsonSchema7`: a query schema IS a real
 * Draft-07 schema, walked at runtime by the translator/validators, so the
 * type stays general rather than a module-specific literal.
 */
export type InvoiceQuerySchema = JsonSchema7;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * The five states a payment can settle into. Kept from the pre-conversion
 * module (`invoices.types.ts:8-16`) — wired, not deleted (design D3): the
 * dead enum now backs `useInvoice.meta.ts`'s `paymentState`, replacing four
 * booleans that could previously disagree with each other.
 */
export enum PAYMENT_STATE {
  COMPLETE = "complete",
  FREE = "free",
  PARTIAL = "partial",
  FAILED = "failed",
  PENDING = "pending"
}

export type PaymentState = `${PAYMENT_STATE}`;

/**
 * A billable invoice raised against an order — the client, currency, line
 * items, payment history, and amount/status summary, extended with the
 * consolidation/credit, bundle, attribution and next-charge surfaces this
 * story adds.
 */
export type Invoice = {
  id: string;
  locked: boolean;
  status: InvoiceStatus;
  number: string;
  client: Client;
  address?: Address;
  currency: Currency;
  products: BasketProduct[];
  /**
   * A list-shaped read of {@link Invoice.products} for a text cell —
   * "`<title> x<quantity>`" per line item. Not a source of truth: re-derive
   * from `products` for anything beyond display.
   *
   * @graphify-citation `graphify query "Invoice paymentMethod
   * productsSummary paymentsSummary groupsSummary bundle groupsSummary
   * summary field"` against `graphify-out/graph.json` (2026-09-09) returns
   * only this module's own `Invoice` node — no `productsSummary` /
   * `paymentsSummary` / `groupsSummary` / `paymentMethod` node anywhere in
   * the tree, so these four members are new ground, not duplicates.
   */
  productsSummary: string;
  payments: Payment[];
  /**
   * AC6/AC16's list-shaped read of {@link Invoice.payments} — each entry's
   * amount and settlement state, discriminating pending from failed (AC16)
   * and flagging a gateway awaiting the client (AC8). Not a source of truth:
   * re-derive from `payments` for anything beyond display.
   */
  paymentsSummary: string;
  /**
   * AC4's READ half — the invoice's OWN assigned payment method
   * (`raw.payment_details`), distinct from a PAYMENT's own card
   * ({@link Payment.cardType}/{@link Payment.cardLast4}, mapped from
   * `payment.payment_details` — a different record entirely). Always an
   * object, `consolidation`-style — `id`/`cardType`/`cardLast4` are `null`
   * and `label` is `""` when no method is assigned. The WRITE half is
   * {@link InvoicePaymentDetailsModel}. Not a new type — see this file's
   * head `graphify-out/` citation, re-queried for `paymentMethod.label`.
   */
  paymentMethod: {
    id: string | null;
    cardType: string | null;
    cardLast4: string | null;
    /** A single-leaf text read — `"<cardType> ****<cardLast4>"`, or `""`. */
    label: string;
  };
  /** AC7 — trusts `packages/types`' enum, never `docs/foundation.md:28`. */
  category: {
    slug: InvoiceCategoryCode;
    /**
     * The DISPLAY discriminator, `is_consolidation`-first (`oracle:172-179`):
     * a consolidation credit note resolves here to
     * {@link InvoiceCategoryCode.CONSOLIDATION}, never to its own
     * `credit_note`/`credit_note_for_refund` slug.
     */
    label: InvoiceCategoryCode;
  };
  /** AC5 — R08's bare `partial_amount_to_credit` is deferred; see `_converted`/`_formatted`. */
  consolidation: {
    isConsolidation: boolean;
    consolidationInvoiceId: string | null;
    /** Numeric status code — NOT a boolean (`baskets.ts:38`). */
    consolidationStatus: number;
    creditInvoiceId: string | null;
    amountToCreditConverted: number;
    amountToCreditFormatted: string;
    amountCredited: number;
    toBeCredited: boolean;
  };
  /** AC13 — co-mingled row attribution. Child-first, mutually exclusive. */
  attribution: {
    isOwn: boolean;
    isChildOfClient: boolean;
    isDelegated: boolean;
    /** `false` whenever `isDelegated` (`invoiceStatusMsg.vue:118-124`). */
    isSettleable: boolean;
  };
  /** AC5 + AC6. */
  bundle: {
    /**
     * Prefers `products_count` (requires `with_count=products`); falls back
     * to the raw array length only when the count is absent — a deliberate
     * fallback (its negative control pins the precedence, not the fallback
     * itself), not a new type (see this file's head `graphify-out/`
     * citation).
     */
    productCount: number;
    isLarge: boolean;
    groups: InvoiceBundleGroup[];
    /**
     * AC5's list-shaped read of {@link Invoice.bundle}'s `groups` — each
     * group's label (or "Unlinked") and its item count. Not a source of
     * truth: re-derive from `groups` for anything beyond display. Not a new
     * type — see this file's head `graphify-out/` citation, re-queried for
     * `groupsSummary` (this file's `productsSummary` docblock above).
     */
    groupsSummary: string;
  };
  /** AC9. Tolerates absent/null; never an epoch date. */
  nextChargeDate: FormattedDate;
  summary: {
    discount: string;
    discountAmount: number;
    paidAmount: number;
    paidAmountFormatted: string;
    subtotal: string;
    taxes: { title: string; amount: string }[];
    total: string;
    unpaidAmount: number;
    unpaidAmountConverted: number;
    unpaidAmountFormatted: string;
    /** AC11 — exposed DISTINCTLY from `unpaidAmount`; may diverge post-consolidation. */
    balance: number;
    balanceFormatted: string;
  };
  dateCreated: FormattedDate;
  dateDue: FormattedDate;
  datePaid: FormattedDate;
};

/**
 * One group of an invoice's bundled line items, grouped by originating
 * subscription (AC5). Grouped on `contracts_product_id`
 * (`packages/types/src/models/baskets.ts:157`), falling back to
 * `contract_id` (`:155`); un-linked lines land in one trailing group where
 * both ids are `null`.
 */
export type InvoiceBundleGroup = {
  contractId: string | null;
  contractsProductId: string | null;
  label: string | null;
  products: BasketProduct[];
};

export type Payment = {
  id: string;
  meta: {
    isPending: boolean;
    isSuccessful: boolean;
  };
  cardType: string | null;
  cardLast4: string | null;
  amountFormatted: string;
  createdAt: string;
  /**
   * AC8 — derived from `createdAt`, frozen at MAP time — NOT a live "age
   * now" value; re-derive from `createdAt` for that. Renamed from
   * `attemptAgeMs` (W9); not a new type (see this file's head `graphify-out/`
   * citation).
   */
  attemptAgeAtFetchMs: number;
  /** AC8 — `true` only when the gateway type says so (`oracle:93-101`). */
  isAwaitingClient: boolean;
};

/**
 * AC1's response shape for the standalone unpaid-amount re-read.
 *
 * @decision
 * what: no `amountConverted` / `currencyId` members, though the oracle's
 * counterpart is named `getUnpaidConvertedAmount` (`oracle:621-633`).
 * why: the real endpoint's response carries exactly
 * `["unpaid_amount","unpaid_amount_formatted"]` — confirmed against the
 * shipped fixture
 * (`__tests__/fixtures/get-invoices-unpaid-amount-id-currency-id.json`) and a
 * fresh staging capture. A "converted" figure is unavailable from this
 * endpoint; `currencyId` is already the caller's own input
 * (`useInvoice.actions.ts`'s `refreshUnpaidAmount`), so echoing it back would
 * teach a consumer nothing the request didn't already carry.
 * rejected: keeping both fields with a `@decision` explaining neither can
 * ever populate — a VM field the wire never sends, left in place, implies a
 * capability ("converted") that does not exist here; removing it is the
 * honest shape. `graphify query "InvoiceUnpaidAmount amountConverted
 * currencyId consumers"` against `graphify-out/graph.json` (2026-09-08)
 * confirms no consumer outside this module's own services/mappers reads
 * either member — reshaping, not a widely-depended-on removal.
 */
export type InvoiceUnpaidAmount = {
  amount: number;
  amountFormatted: string;
};

/**
 * AC4's write model. `payment_details_id` is nullable ON PURPOSE: clearing
 * the assignment sends `null` as a PRESENT key, never an omitted one (design
 * D1) — "none selected" is a sent value, not the absence of one.
 */
export type InvoicePaymentDetailsModel = {
  payment_details_id: string | null;
};

// -----------------------------------------------------------------------------
// SERVICE-LAYER SHAPES
// -----------------------------------------------------------------------------

/**
 * The reactive list query, minted ONCE per scope in `useInvoices.ts`.
 * Aliased from the query platform's own `ListQuery`, parameterised by this
 * module's {@link InvoiceQueryModel} — never derived with
 * `ReturnType<typeof localServiceFn>`. `TQueryFnData` is the WIRE type
 * (`IInvoice[]`, what `list()`'s `queryFn` resolves), `TData` is the type
 * after `select` (`Invoice[]`) — matching the `list<IInvoice[], Invoice[],
 * InvoiceQueryModel>` call site in `invoices.services.ts` (S1; not a new
 * type, see this file's head `graphify-out/` citation).
 */
export type InvoicesListQuery = ListQuery<
  IInvoice[],
  Invoice[],
  InvoiceQueryModel
>;

/**
 * The reactive single-item query, minted ONCE per scope in `useInvoice.ts`.
 * Aliases the platform's own `SimpleQuery`, the same way
 * {@link InvoicesListQuery} aliases `ListQuery` — `TQueryFnData` is the WIRE
 * type (`IInvoice`), `TData` the mapped type (`Invoice`), matching the
 * `query<IInvoice, Invoice>` call site (S1).
 */
export type InvoiceItemQuery = SimpleQuery<IInvoice, Invoice>;

/**
 * The reactive unpaid-amount query (AC1). A plain `SimpleQuery` with no
 * criteria model — currency rides as a plain `currency_id` query param the
 * services layer writes onto the url directly in a `watch`
 * (`invoices.services.ts`), NOT through `query()`'s `withCurrency` flag:
 * that flag derives `currency_code` from the basket (`useQuery.ts:174-178`)
 * and cannot carry an arbitrary target currency. Not through the criteria
 * channel either — a single read does not have one. Not a new type (see
 * this file's head `graphify-out/` citation).
 */
export type InvoiceUnpaidAmountQuery = SimpleQuery<
  InvoiceUnpaidAmount,
  InvoiceUnpaidAmount
>;

/**
 * The contract `createInvoicesServices` resolves to — consumed by BOTH
 * composables, so the collection and the single read address the same client
 * through the same seam. Hand-declared: the `scopedServices()` switch needs
 * one type to unify on.
 */
export type InvoicesServices = {
  /** The module's base cache key. */
  queryKey: QueryKey;
  /** The target client this scope resolved. Neither request-issuing function re-derives it independently. */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate
   * in `invoices.services.ts` calls. The composable layers read THIS rather
   * than re-deriving the expression, so the flag a consumer renders and the
   * gate the wire enforces cannot drift apart.
   */
  isAvailable: ComputedRef<boolean>;
  /**
   * Always `undefined` today — `updatePaymentDetails` is a fire-and-forget
   * PATCH (design D1) whose failure the caller's own promise rejection
   * surfaces, not a persisted services-level error. Present for four-layer
   * shape uniformity.
   */
  error: ComputedRef<ResponseError | undefined>;
  /**
   * The async PARENT-invoice lookup a `.for('invoice', id)` picker drives.
   * `isActive` defers the first fetch to the control's own read.
   */
  loadInvoiceLookup: (isActive: Ref<boolean>) => InvoiceLookupQuery;
  /**
   * The async CONTRACT lookup a `.for(.contract., id)` picker drives.
   * `isActive` defers the first fetch to the control.s own read.
   */
  loadContractLookup: (isActive: Ref<boolean>) => ContractLookupQuery;
  /** The async CONTRACT-PRODUCT lookup a `.for('contracts_product', id)` picker drives. */
  loadContractProductLookup: (
    isActive: Ref<boolean>
  ) => ContractProductLookupQuery;
  /** Takes NOTHING: the request state is the declared query schema. */
  loadList: () => InvoicesListQuery;
  loadOne: (invoiceId?: Invoice["id"]) => InvoiceItemQuery;
  /**
   * `currencyId` rides as a plain service argument, in the query key — a
   * single read has no criteria channel (AC1). `MaybeRef` so the composable
   * layer can own one reactive ref across the query's lifetime, rather than
   * re-minting the query on every currency change. Widening an existing
   * member's signature, not a new type — see this file's head
   * `graphify-out/` citation.
   */
  loadUnpaidAmount: (
    invoiceId?: Invoice["id"],
    currencyId?: MaybeRef<Currency["id"] | undefined>
  ) => InvoiceUnpaidAmountQuery;
  /** The unpaid-existence count read (AC10) — the same `list()`, a fixed preset. */
  loadUnpaidExistence: () => InvoicesListQuery;
  /**
   * Flips the unpaid-existence query's request gate — the read stays
   * disabled until `useMeta().hasUnpaid` is actually consumed, so a scope
   * nobody asks about never issues AC10's count request. No existing member
   * covers this (`graphify query "InvoicesServices requestUnpaidExistence"`
   * — no match; see `graphify-out/`).
   */
  requestUnpaidExistence: () => void;
  /**
   * AC2's dedicated consolidatable-count read — the same `list()` shape as
   * {@link loadUnpaidExistence}, seeded with its OWN criteria
   * (`invoices.schemas.ts`'s `consolidatableCountCriteria`) so reading the
   * count can never mutate the list `filterConsolidatable()` narrows.
   * `graphify query "InvoicesServices loadConsolidatableCount"` against
   * `graphify-out/graph.json` (2026-09-08) — no match; net-new member, not a
   * duplicate.
   */
  loadConsolidatableCount: () => InvoicesListQuery;
  /**
   * Flips the consolidatable-count query's request gate — mirrors
   * `requestUnpaidExistence`: the read stays disabled until
   * `useMeta().consolidatableCount` is actually consumed.
   */
  requestConsolidatableCount: () => void;
  updatePaymentDetails: (
    invoiceId: Invoice["id"],
    model: InvoicePaymentDetailsModel
  ) => Promise<unknown>;
  /**
   * AC A — downloads this invoice's raw PDF blob via
   * `GET invoices/{id}/download`. A credit note is an invoice with a
   * different `category` and rides the SAME reader (no branch). The CALLER
   * derives the save filename from the already-loaded invoice's `number`
   * (`useInvoice.actions.ts`), never this layer. Not a new type — see this
   * file's head `graphify-out/` citation, re-queried for `downloadPdf`.
   */
  downloadPdf: (invoiceId: Invoice["id"]) => Promise<Blob>;
};

/**
 * The module's schema family (`invoices.schemas.ts`). No form pair — the
 * module has no edit form; AC4's write is a single nullable id (design D1).
 */
export type InvoicesSchemas = {
  useQuerySchema: () => InvoiceQuerySchema;
  useQueryUischema: () => UISchemaElement;
  useSortUischema: () => ControlElement;
};

// Re-export so a consumer building a scope-aware call site can spell the
// context type this module's collection resolves against.
export type { ScopeContext };

/** The invoice lookup's criteria model — quick-search term + pagination. */
export type InvoiceLookupQueryModel = {
  query?: string | null;
  pagination?: { limit?: number; offset?: number };
};

/**
 * The invoice lookup handle — a `listInfinite` query whose `select` maps rows
 * to {@link LookupItem}. This IS the service `useLookup` drives; it rides a
 * control's `options.lookup.service` as a thunk (below). It offers the PARENT
 * invoices the `.for('invoice', id)` scope slot takes.
 */
export type InvoiceLookupQuery = ListQuery<
  IInvoice[],
  LookupItem[],
  InvoiceLookupQueryModel
>;

/**
 * What a lookup control's `options.lookup.service` carries — a THUNK returning
 * the once-minted {@link InvoiceLookupQuery}, so the first fetch defers to the
 * control's own read rather than firing at construction.
 */
export type InvoiceLookupService = () => InvoiceLookupQuery;

/** The contract lookup's criteria model — quick-search term + pagination. */
export type ContractLookupQueryModel = {
  query?: string | null;
  pagination?: { limit?: number; offset?: number };
};

/**
 * The contract lookup handle — a `listInfinite` query whose `select` maps rows
 * to {@link LookupItem}. It offers the contracts a `.for('contract', id)`
 * scope slot takes.
 */
export type ContractLookupQuery = ListQuery<
  IContract[],
  LookupItem[],
  ContractLookupQueryModel
>;

/** A THUNK returning the once-minted {@link ContractLookupQuery}. */
export type ContractLookupService = () => ContractLookupQuery;

/** The contract-product lookup's criteria model. */
export type ContractProductLookupQueryModel = {
  query?: string | null;
  pagination?: { limit?: number; offset?: number };
};

/**
 * The contract-product lookup handle — offers what a
 * `.for('contracts_product', id)` scope slot takes.
 */
export type ContractProductLookupQuery = ListQuery<
  IContractProduct[],
  LookupItem[],
  ContractProductLookupQueryModel
>;

/** A THUNK returning the once-minted {@link ContractProductLookupQuery}. */
export type ContractProductLookupService = () => ContractProductLookupQuery;

/**
 * The three relationship lookups a scope publishes — one thunk per RETARGET
 * context type, keyed by that type's own enum VALUE so a picker can resolve
 * the right one from the context it is rendering.
 */
export type InvoicesScopeLookups = {
  contract: ContractLookupService;
  contracts_product: ContractProductLookupService;
  invoice: InvoiceLookupService;
};
