import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import { selector } from "../scope/scope.utils";
import type { FormattedDate, ResponseError } from "../../utils";
import type { CustomField, CustomFieldModel } from "../client-custom-fields";
import type { Invoice } from "../invoices";
import type { LookupItem } from "../lookup";
import type { Product, ProductModel, UseProductConfig } from "../product";
import type { UseProductCatalogue } from "../product-catalogue";
import type { ListQuery } from "../query";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  IBrand,
  ICProdGroup,
  IClient,
  IContract,
  IContractCancellationRequest,
  IContractProduct,
  IContractProductScheduledCancellation,
  IInvoice,
  InvoiceConsolidationTypes,
  IProduct,
  IProductCategory,
  IProductMigration,
  IScheduledAction,
  IStatus,
  ITag,
  ProductTypes,
  TrialEndActionTypes
} from "@upmind-automation/types";
import type { ComputedRef, ShallowRef } from "vue";
import type { ActorRef, AnyEventObject, InvokeCallback } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.types
 * @description Types for a client's own contract products — the query-backed
 * COLLECTION (`useContractProducts`) and the bespoke-machine MANAGER
 * (`useContractProduct`, `contract-product.machine.ts`). The COLLECTION owns a
 * context enum and a scope matrix that names it. The MANAGER is a
 * single-record read: it owns an all-`never` matrix and no context enum at all
 * (see the @decision beside `CONTRACT_PRODUCT_SCOPE_MATRIX`). The view model,
 * the query model and the services contract are shared.
 */

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/**
 * Context types for the contract-product COLLECTION. `DELEGATED` is a
 * SELECTOR context with no id: it narrows the same collection to the client's
 * delegated products, it does not name a different entity.
 */
export enum ContractProductsContextTypes {
  /** Narrows the collection to the client's delegated products. */
  DELEGATED = "delegated"
}

/** Scope matrix for `useContractProducts`. `client` is the only actor that resolves. */
export const CONTRACT_PRODUCTS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: selector(ContractProductsContextTypes.DELEGATED),
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useContractProducts` (derived from the runtime const). */
export type ContractProductsScopeMatrix = typeof CONTRACT_PRODUCTS_SCOPE_MATRIX;

/**
 * Scope matrix for `useContractProduct` — every actor refused.
 *
 * @decision
 * what: the manager declares NO context enum, and every cell of its matrix is
 *   `never`. The template contract expects a context enum and a matrix that
 *   names it, as the collection beside it has.
 * why: `useContractProduct` is a SINGLE-RECORD READ BY ID
 *   (templates/SINGLE-READ.md). The legacy oracle names no entity a client
 *   acts on behalf of for this capability, and an absent legacy context is
 *   never licence to invent one. The product id rides on `.withId(id)`, which
 *   `generateScopeKey` folds in as `id:<value>`. `ContextsForActor` resolves
 *   `never` for all four actors, so `MatrixHasAnyContexts` is `false` and
 *   `.for()` is a compile error for everyone.
 * rejected: minting a `ContractProductContextTypes.CONTRACT_PRODUCT` and
 *   naming it in the CLIENT cell — the shape this module shipped until
 *   73e2517dd. It modelled a leaf record as an ADR-001 context with no oracle
 *   entity behind it, made the matrix say something it cannot mean, and made
 *   `.as('staff').for('client', c).withId(r)` unsayable. Research finding F19
 *   named it. Also rejected: dropping the matrix entirely — `TMatrix` then
 *   defaults to the WIDE `ActorContextMatrix` and `.for("anything", id)`
 *   compiles again (the FE-3095 receipt). The matrix is declared, and its
 *   TYPE is passed, precisely so the hole stays shut.
 */
export const CONTRACT_PRODUCT_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useContractProduct` (derived from the runtime const). */
export type ContractProductScopeMatrix = typeof CONTRACT_PRODUCT_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// VIEW MODEL — the mapping law (design 8.10, R19, R24, R25)
// -----------------------------------------------------------------------------

/** `IStatus.code`, narrowed to the contract vocabulary, and the status's translated name. */
export type ContractProductStatus = Pick<IStatus, "code"> & {
  code: ContractStatusCodes;
  /** `status.name_translated`, else `status.name` (R38 item 9). */
  name?: IStatus["name"];
};

/**
 * One boolean per contract status code — a translated status badge reads
 * these off `meta` (R38 item 9, G4), the idiom `tickets.mappers.ts` and
 * `Contract.meta` publish.
 */
export type ContractProductMeta = {
  isActive: boolean;
  isAwaitingActivation: boolean;
  isCancelled: boolean;
  isClosed: boolean;
  isFraud: boolean;
  isPending: boolean;
  isSuspended: boolean;
};

/** `IStatus.code`, narrowed to the cancellation-request vocabulary. */
export type ContractProductRequestStatus = Pick<IStatus, "code"> & {
  code: CancellationRequestStatusCodes;
};

/** The `status` and `id` members of `IContractCancellationRequest` this module reads. */
export type ContractProductRequest = {
  /** The request id — the `contract_request_id` a withdraw sends (R33). */
  id?: IContractCancellationRequest["id"];
  status?: ContractProductRequestStatus;
};

/** The `scheduled_actions` member this module reads. */
export type ScheduledAction = Pick<
  IScheduledAction,
  "id" | "action_code" | "status" | "executed_at" | "created_at"
>;

/** The `unpaid_recurring_invoices` member this module reads — the row's `invoice_status`, as `status`. */
export type UnpaidInvoice = Partial<Pick<IInvoice, "status">>;

/** The `product` relation this module reads (12-member products-list `with`, design 8.1). */
export type ContractProductCatalogueProduct = Pick<
  IProduct,
  | "id"
  | "name"
  | "image"
  | "provision_blueprint"
  | "invoice_consolidation_enabled"
  | "product_type"
>;

/** One option line of the contract product: the option product and what it sells for now. */
export type ContractProductOption = {
  productId: IProduct["id"];
  sellingPrice: IContractProduct["selling_price"];
};

/** The `brand` relation this module reads — `brand.currency` (design 8.1). */
export type ContractProductBrand = Pick<IBrand, "id" | "name" | "currency">;

/** The `tags` relation this module reads. Undeclared on the shared platform
 * `IContractProduct` interface though the wire returns it (verify.md B1);
 * carried here until the shared package catches up. */
export type ContractProductTag = Pick<
  ITag,
  "id" | "name" | "colour" | "show_to_customer"
>;

/** A delegating client, off the `clients` / `moved_to_contract_product.clients` relations. */
export type ContractProductClient = Pick<
  IClient,
  "id" | "fullname" | "email" | "image" | "brand"
>;

/** The `moved_to_contract_product` relation this module reads. */
export type MovedToContractProduct = Pick<
  IContractProduct,
  "id" | "name" | "status"
> & {
  clients?: ContractProductClient[];
};

/** The `future_cancellation_request` relation this module reads. */
export type ContractProductFutureCancellation = Pick<
  IContractProductScheduledCancellation,
  "id" | "future_cancellation_date" | "scheduled_for" | "executed_at"
>;

/**
 * The view model `mapContractProduct` maps `IContractProduct` into — only the
 * fields this module reads, plus the two derived readings every layer shares.
 * The wire record sits beside it on machine context (`rawContractProduct`).
 */
export type ContractProduct = {
  id: IContractProduct["id"];
  contractId: IContractProduct["contract_id"];
  status?: ContractProductStatus;
  /** The translated-badge flags for `status.code` (R38 item 9, G4). */
  meta: ContractProductMeta;
  /** The owning contract's status code (`contract.status.code`) — the cancellation gate reads it (R33). */
  contractStatus?: ContractStatusCodes;
  stagedImport: IContractProduct["staged_import"];
  contractRequest?: ContractProductRequest;
  renew: IContractProduct["renew"];
  billingCycleMonths: IContractProduct["billing_cycle_months"];
  /** The translated billing-cycle label a list column shows — "Monthly", "Annually", "One time" (R38 item 10, G5). */
  billingCycle: string;
  /** The purchase date, as the wire ISO the machine reads — never `raw.created_at`. `dateCreated` is its display descriptor. */
  createdAt: IContractProduct["created_at"];
  /**
   * The row's formatted price (R38 item 10) — legacy `getPriceTermSummary`'s
   * figure: the recurring price for a subscription, the discounted price for a
   * one-time product, each tax-inclusive or net per the brand's tax type.
   */
  priceFormatted: string;
  /** Legacy `getPriceTermSummary`'s one string — `priceFormatted` trimmed of zeros, then the lower-cased cycle for a subscription: "£4 monthly", "£60". */
  priceTermSummary: string;
  calculatedCancelDate: IContractProduct["calculated_cancel_date"];
  provisionSetupFieldsConfirmed: IContractProduct["provision_setup_fields_confirmed"];
  inTrial: IContractProduct["in_trial"];
  trialEndAction: TrialEndActionTypes;
  nextDueDate: IContractProduct["next_due_date"];
  /** The purchase date a list column DRAWS (R38 items 8, 10) — a `useDate` descriptor `TableCellDate` reads, beside the ISO `createdAt` the machine keeps (tickets/invoices `date*` shape). */
  dateCreated: FormattedDate;
  /** The next-due date a column DRAWS — the display descriptor beside the ISO `nextDueDate`. */
  dateNextDue: FormattedDate;
  /** The calculated cancel date the overlay DRAWS — the display descriptor beside the ISO `calculatedCancelDate`. */
  dateCalculatedCancel: FormattedDate;
  importId: IContractProduct["import_id"];
  moved: IContractProduct["moved"];
  name: IContractProduct["name"];
  /** The display name — the shared product title over this contract product: "Starter Hosting (testdomain.com)". */
  title: string;
  canCancel: IContractProduct["can_cancel"];
  /** A pro-rata invoice from a product change is still unpaid; cancelling and changing product are held back. */
  proRataPending: IContractProduct["pro_rata_pending"];
  /** The platform lets the client modify the product (`can_modify`); a change of product needs it. */
  canModify: boolean;
  /** `product.product_type` — a change of product is offered for a single product only. */
  productType?: ProductTypes;
  /** The products the current product allows a change to (`allowed_migrations`). */
  allowedMigrations: IProductMigration[];
  /** The contract's own option lines, for the option price rule of a change of product. */
  currentOptions: ContractProductOption[];
  /** The contract currency id — a change of product loads and prices in it. */
  contractCurrencyId?: IContract["currency_id"];
  /** The contract currency code. */
  contractCurrencyCode?: string;
  /** The contract account id — the product reads are scoped to it. */
  contractAccountId?: IContract["account_id"];
  /** The contract tax type, for the option editors of a change of product. */
  contractTaxType?: IContract["tax_type"];
  /** The owning contract's translated billing-cycle label (`contract.billing_cycle_months`) — the product record's "Contract billing cycle" (FE-3206). `undefined` when the contract relation is absent. */
  contractBillingCycleLabel?: string;
  isDelegatedObject: IContractProduct["is_delegated_object"];
  autoCreateRenewInvoice: IContractProduct["auto_create_renew_invoice"];
  unpaidRecurringInvoices: UnpaidInvoice[];
  scheduledActions?: ScheduledAction[];
  /** `billing_cycle_months > 0` — the product fact, never the criteria leaf (ADR-18). */
  isSubscription: boolean;
  /** `contract_request.status.code === request_scheduled_future_cancellation`. */
  hasScheduledFutureCancellation: boolean;
  /** The owning client's `invoice_consolidation_enabled` (`contract.client`) — the consolidation gate reads it (W1). */
  clientInvoiceConsolidationEnabled?: IClient["invoice_consolidation_enabled"];
  /** The catalogue product (`product.image`, `product.provision_blueprint`). */
  product?: ContractProductCatalogueProduct;
  /** That product's brand (`brand.currency`). */
  brand?: ContractProductBrand;
  /** The product's tags. */
  tags?: ContractProductTag[];
  /** Any cancellation scheduled against it for a future date, and its date. */
  futureCancellationRequest?: ContractProductFutureCancellation;
  /** The product it was moved to, when `moved` is true. */
  movedToContractProduct?: MovedToContractProduct;
  /** The client(s) this product is delegated from, on the `DELEGATED` scope. */
  delegatingClients?: ContractProductClient[];
  /** The wire record this view model was mapped from (AC24, R19). */
  raw: IContractProduct;
};

/** A `ContractProduct` as a read that embeds it carries it — without the members that need `allowed_migrations` or the parent `contract` relation, which such a read never supplies. The `contract` read and the `tickets` single read both embed a product this way. */
export type ContractProductEmbedded = Omit<
  ContractProduct,
  | "allowedMigrations"
  | "clientInvoiceConsolidationEnabled"
  | "contractBillingCycleLabel"
  | "contractCurrencyId"
  | "contractStatus"
  | "contractTaxType"
>;

// -----------------------------------------------------------------------------
// MACHINE — `contract-product.machine.ts` (flow.md §3, §4; R20, R24)
// -----------------------------------------------------------------------------

/**
 * The fifteen nodes of the locked product chart. Thirteen are reportable
 * states; `SETUP_COMPLETE` and `TRIAL_NONE` are the neutral defaults of their
 * region and carry no meta value.
 */
export enum ContractProductState {
  PENDING = "available.status.pending",
  INACTIVE = "available.status.inactive",
  ACTIVE = "available.status.active",
  SUSPENDED = "available.status.suspended",
  EXPIRING = "available.status.expiring",
  CANCELLING = "available.status.cancelling",
  SETUP_INCOMPLETE = "available.setup.incomplete",
  SETUP_COMPLETE = "available.setup.complete",
  TRIAL_NONE = "available.trial.none",
  TRIAL_RUNNING = "available.trial.running",
  TRIAL_ENDING = "available.trial.ending",
  STAGED = "unavailable.staged",
  CANCELLED = "unavailable.cancelled",
  LAPSED = "unavailable.lapsed",
  FRAUD = "unavailable.fraud"
}

/** Context for the contract-product manager machine. */
export type ContractProductContext = {
  /**
   * The resolved actor, never SELF — the scope builder resolves it before the
   * machine starts. This is the machine variant's ARM SEAM (templates/ARMS.md):
   * a machine has no construction-time closure, so a member that later earns a
   * per-actor arm resolves it off `context.scopeActor` per call. The module is
   * armless today — its parity table carries the one cell `client×self` — so
   * nothing reads it yet. The seam is seeded, not the arm, which is what the
   * `account/` exemplar does (account.types.ts, useAccount.ts).
   */
  scopeActor?: ScopeActorTypes;

  /** The contract the product belongs to; seeded from the first read. */
  contractId?: IContract["id"];

  /** The product this manager acts on; seeded from the scope at spawn. */
  contractProductId?: IContractProduct["id"];

  /** Spawned auth subscription actor. */
  authHelper?: ActorRef<AnyEventObject>;

  /** Error from the last operation. */
  error?: ResponseError;

  /** The raw IContractProduct API response. */
  rawContractProduct?: IContractProduct;

  /** The mapped contract product. */
  contractProduct?: ContractProduct;

  /** The reused CANCEL_REQUEST lookups the cancellation form draws from (`loadLookups`). */
  lookups?: ContractProductLookups;

  /** The open cancellation form. */
  cancellation?: ContractProductForm;

  /** The open consolidation form. */
  consolidation?: ContractProductForm;

  /** The open change of product. */
  migration?: ContractProductMigration;

  /** The invoice the last committed change of product raised; outside the form slot, so the re-read keeps it. */
  migrationResult?: MigrationResult | null;
};

/** The two write forms, each a parallel region of `available`. */
export enum ContractProductFormTypes {
  CANCELLATION = "CANCELLATION",
  CONSOLIDATION = "CONSOLIDATION"
}

/** One open write form. */
export type ContractProductForm = {
  schema?: JsonSchema7;
  uischema?: UISchemaElement;
  model?: Partial<ContractProductWriteModel>;
};

// -----------------------------------------------------------------------------
// MIGRATION — the `migrating` region (FE-3206)
// -----------------------------------------------------------------------------

/** The chosen product: its id and its row of the product list. */
export type MigrationTarget = {
  id: IProduct["id"];
  product: Product;
};

/** The model the configurator child sends with each change and with the commit. */
export type MigrationChange = {
  model: ProductModel;
  rawProduct?: IProduct;
};

/** One open change of product: the chosen product, its configurator and what was last priced. */
export type ContractProductMigration = {
  target?: MigrationTarget;
  /** The spawned configurator child. */
  ref?: ActorRef<AnyEventObject>;
  /** The last child model that went to a request. */
  model?: ProductModel;
  /** The raw product of that model, for the option price rule. */
  rawProduct?: IProduct;
  /** The dry run of `model`. */
  preview?: MigrationPreview;
};

/** The pro-rata cost a dry run gave. */
export type MigrationPreview = {
  /** A dry-run invoice is unsaved, so its `status` is absent. */
  invoice: Omit<Invoice, "status"> & { status?: Invoice["status"] };
  /** `total_amount_formatted` of the dry-run invoice. */
  total: string;
  /** True when the converted total is zero. */
  isFree: boolean;
};

/** What a committed change of product gave. */
export type MigrationResult = {
  invoiceId?: IInvoice["id"];
  unpaidAmount: number;
  /** True when `unpaid_amount` is not zero. */
  requiresPayment: boolean;
  invoice?: Invoice;
};

/** `PUT contracts/{c}/products/{p}/change` body. */
export type ChangeProductBody = {
  contract_id: IContract["id"];
  contracts_product_id: IContractProduct["id"];
  product: {
    product_id: IProduct["id"];
    billing_cycle_months?: number;
  };
  options: {
    product_id: IProduct["id"];
    billing_cycle_months: number;
    unit_quantity: number;
    price?: number;
  }[];
  attributes: { product_id: IProduct["id"] }[];
  dry_run?: boolean;
};

/** The inputs of `buildChangeProductBody`. */
export type ChangeProductInput = {
  contractId: IContract["id"];
  contractProductId: IContractProduct["id"];
  targetId: IProduct["id"];
  model: ProductModel;
  rawProduct?: IProduct;
  currentOptions?: ContractProductOption[];
  currencyId?: IContract["currency_id"];
  /** A numeric custom price wins. The client path sets none [o24]. */
  customPrice?: number;
};

/**
 * The configurator of the chosen product: a subset of `useProductConfig` over the
 * child. It has no `service`, no term setter, no quantity member, no provision
 * member and no trial setter, so a commit cannot skip `migrate()`. Its
 * `setConfig` drops `startTrial` and `provisionFields`. Its `schema` and
 * `uischema` hold no provision field and no `startTrial`. It has no `id` and no
 * `state`, so the child's own state stays out of reach.
 */
export type MigrationConfig = Omit<
  UseProductConfig,
  | "id"
  | "state"
  | "service"
  | "onDone"
  | "updateTerm"
  | "isSelectedTerm"
  | "updateQuantity"
  | "incrementQuantity"
  | "decrementQuantity"
  | "provisionFields"
  | "provisionFieldsSchema"
  | "setProvisioningFields"
  | "getProvisioningField"
  | "setTrial"
>;

/** The built `migrationConfig` and the reactive read of whether its child can take a commit. */
export type MigrationConfigHolder = {
  config: MigrationConfig;
  /** The child matches `available`; false while it reloads or processes. */
  isReady: ComputedRef<boolean>;
};

/**
 * The three scoped holders of one manager. Each is `null` until its inputs are
 * resolved. Each builds inside its own effect scope, which stops on a rebuild,
 * when the inputs go incomplete, and on `dispose`.
 */
export type MigrationHolders = {
  /** The count of the products the current product allows. */
  count: ShallowRef<UseProductCatalogue | null>;
  /** The paged list of those products on the current term. */
  list: ShallowRef<UseProductCatalogue | null>;
  /** The configurator of the chosen product. */
  config: ShallowRef<MigrationConfigHolder | null>;
  /** The child matches `available`; false when no child is spawned. */
  isMigrationTargetReady: ComputedRef<boolean>;
  /** Stops each holder scope. */
  dispose: () => void;
};

/** The facts `canMigrateProduct` reads. */
export type MigrationGateFacts = Pick<
  ContractProduct,
  | "allowedMigrations"
  | "calculatedCancelDate"
  | "canModify"
  | "contractRequest"
  | "isSubscription"
  | "productType"
  | "proRataPending"
  | "renew"
  | "stagedImport"
  | "status"
>;

// -----------------------------------------------------------------------------
// LOOKUPS & WRITE FORMS — machine-owned form inputs (R33; auth form shape)
// -----------------------------------------------------------------------------

/** The reused lookups the machine loads on read, for the cancellation form. */
export type ContractProductLookups = {
  /** The brand's CANCEL_REQUEST custom-field definitions (`useClientCustomFields`). */
  customFields?: CustomField[];
};

/** `load` returns the record and its reused lookups in one settle (R33). */
export type ContractProductLoaded = {
  record: IContractProduct;
  lookups: ContractProductLookups;
};

/**
 * The model a write form carries — parsed and validated before its service
 * runs. The cancellation form (ONE combined form, legacy `clientCancelOptions`)
 * carries {@link CancellationModel}; the consolidation form carries
 * {@link SetConsolidationModel}.
 */
export type ContractProductWriteModel =
  | CancellationModel
  | SetConsolidationModel;

// -----------------------------------------------------------------------------
// CANCELLATION — the ONE combined form (R33; legacy `clientCancelOptions`)
// -----------------------------------------------------------------------------

/**
 * The client cancellation options a product may offer (legacy `CancelOptions`,
 * `contractCancellation.ts:303-333`). The chosen option routes the submit to
 * one of four writes.
 */
export enum ContractProductCancelOption {
  /** Cancel at the end of the current term (stop auto-renew). */
  SOFT = "soft",
  /** Request immediate cancellation. */
  HARD = "hard",
  /** Schedule a cancellation for a future anniversary date. */
  SCHEDULE_FUTURE = "schedule_future"
}

/**
 * The ONE cancellation form model. `futureCancellationDate` is required only
 * for `SCHEDULE_FUTURE` (the schema's `if`/`then`); `customFields` is the
 * CANCEL_REQUEST catalogue.
 */
export type CancellationModel = {
  option: ContractProductCancelOption;
  reason?: string;
  customFields?: CustomFieldModel;
  futureCancellationDate?: string;
};

// -----------------------------------------------------------------------------
// WRITE MODELS & BODIES — design 8.3, ADR-28
// -----------------------------------------------------------------------------

/** The mapper input the two `modify_renew` writes share; `renew` is set by the service. */
export type SoftCancelModel = {
  renew: boolean;
  reason?: string;
  customFields?: CustomFieldModel;
};

/** The model `setConsolidation` takes. */
export type SetConsolidationModel = {
  invoiceConsolidationEnabled: InvoiceConsolidationTypes;
};

/** The mapper input `scheduleCancellation` builds from the cancellation model (R18). */
export type ScheduleCancellationModel = {
  futureCancellationDate: string;
  reason?: string;
  customFields?: CustomFieldModel;
};

/** The mapper input the hard-cancellation request builds (R33). */
export type RequestCancellationModel = {
  productIds: IContractProduct["id"][];
  reason?: string;
  customFields?: CustomFieldModel;
};

/** `PUT contracts/{c}/products/{p}/modify_renew` body. */
export type SoftCancelBody = {
  renew: boolean;
  cancellation_reason?: string;
  custom_fields?: CustomFieldModel;
};

/** `PUT contracts/{c}/products/{p}/properties` body. */
export type ConsolidationBody = {
  invoice_consolidation_enabled: InvoiceConsolidationTypes;
};

/** `PUT contracts/{c}/products/{p}/schedule-cancel` body. */
export type ScheduleCancellationBody = {
  future_cancellation_date: string;
  cancellation_reason?: string;
  custom_fields?: CustomFieldModel;
};

/** `POST contracts/{contractId}/cancel/request` body (R33). */
export type RequestCancellationBody = {
  product_ids: RequestCancellationModel["productIds"];
  cancellation_reason?: RequestCancellationModel["reason"];
  custom_fields?: RequestCancellationModel["customFields"];
};

/** `DELETE contracts/{contractId}/cancel/request` body (R33). */
export type WithdrawCancellationBody = {
  contract_request_id: NonNullable<ContractProductRequest["id"]>;
};

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's ONE request-state type (design 8.2)
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (wire column → operator →
 * value; a bare column carries its value directly), `sort` and `pagination`.
 * This is the instance validated against `useQuerySchema()`.
 */
export type QueryModel = {
  filters?: {
    "product.name"?: { like?: string | null };
    "product.category.name"?: { like?: string | null };
    "product.category.id"?: string | null;
    "status.code"?: ContractStatusCodes | null;
    /** `neq` is `subscriptionsOnly` and the forced hide-one-time leaf; `eq` is `oneTimeOnly` (ADR-15, ADR-18). */
    billing_cycle_days?: { neq?: number | null; eq?: number | null };
    created_at?: { gt?: string | null };
    next_due_date?: { gt?: string | null };
    total_amount?: number | null;
  };
  /** The legacy quick search — a bare `query=<term>` param (design 8.2). */
  query?: string | null;
  sort?: SortEntry[];
  // `offset` alone is unspellable — with no page size the page index is NaN; `limit` alone stays the page-size door.
  pagination?:
    | { limit?: number; offset?: never }
    | { limit: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

/** One sort entry; `field` is the schema's own declared enum (design 8.2). */
export type SortEntry = {
  field: "status" | "created_at" | "next_due_date" | "cancelled_date";
  dir: SortDirection;
};

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/** The order the list starts in — declared as the query schema's `sort` default. */
export const DEFAULT_SORT: SortModel = [
  { field: "created_at", dir: SortDirection.ASC }
];

/** The collection's query schema — a real Draft-07 schema the translator walks at runtime. */
export type ContractProductsQuerySchema = JsonSchema7;

/** The `contractProductPicker`'s own criteria (R38 item 2) — a service-identifier search. */
export type ContractProductPickerQueryModel = {
  filters?: { service_identifier?: { like?: string | null } };
  pagination?: { limit?: number; offset?: number };
};

/** The picker's once-minted lookup query, as `useTicketPickerSchema`'s sibling reads. */
export type ContractProductPickerLookupQuery = ListQuery<
  IContractProduct[],
  LookupItem[],
  ContractProductPickerQueryModel
>;

/** A THUNK returning the once-minted {@link ContractProductPickerLookupQuery}. */
export type ContractProductPickerLookupService =
  () => ContractProductPickerLookupQuery;

// -----------------------------------------------------------------------------
// SERVICES CONTRACT
// -----------------------------------------------------------------------------

/** The reactive list query, minted ONCE per scope in `useContractProducts.ts`. */
export type ContractProductListQuery = ListQuery<
  IContractProduct[],
  ContractProduct[],
  QueryModel
>;

/**
 * The show-delegated preference of one collection scope (design 8.5), minted
 * once in `useContractProducts.ts` and handed to the services factory.
 */
export type ShowDelegatedPreference = {
  /** The `exclude_delegated` force-set the reads send, read at fire time. */
  excludeDelegated: ComputedRef<0 | 1>;
  /** True once the stored preference is read, or at once for the `DELEGATED` context. */
  isSettled: ComputedRef<boolean>;
  /** Resolves once `isSettled` is true. */
  whenSettled: () => Promise<void>;
  /** Stops the scoped preference reader. */
  destroy: () => void;
};

/** The contract `createContractProductServices` resolves to. */
export type ContractProductServices = {
  /** The module's base cache key; every write invalidates it whole (design 8.4). */
  queryKey: QueryKey;
  /** The collection's list query; its request state is the declared query schema. */
  loadList: () => ContractProductListQuery;
  /** The dashboard's grouped counts (design 8.1, ADR-4). */
  loadGroupedCounts: () => Promise<ICProdGroup[]>;
  /** The purchased categories (R10, ADR-20). */
  loadPurchasedCategories: () => Promise<IProductCategory[]>;
  /** The `contractProductPicker`'s own lookups (R38 item 2), one per pickable record. */
  lookups: {
    contractProduct: ContractProductPickerLookupService;
  };
};

/** The XState services map `contract-product.machine.ts` invokes; each returns the raw record. */
export type ContractProductMachineServices = {
  /** `loading` — the client detail read plus its reused CANCEL_REQUEST field lookups. */
  load: (context: ContractProductContext) => Promise<ContractProductLoaded>;
  /** `cancelling.processing.validating` — rejects with a 422 on an invalid model. */
  validateCancellation: (context: ContractProductContext) => Promise<void>;
  /** `consolidating.processing.validating` — rejects with a 422 on an invalid model. */
  validateConsolidation: (context: ContractProductContext) => Promise<void>;
  /** `processing.stoppingRenewal.updating` (SOFT). */
  requestSoftCancel: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  /** `processing.resumingRenewal.updating` (ABORT). */
  abortSoftCancel: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  /** `processing.requestingCancellation.updating` (HARD, R33). */
  requestCancellation: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  /** `processing.withdrawingCancellation` (R33). */
  withdrawCancellation: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  setConsolidation: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  scheduleCancellation: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  revokeScheduledCancellation: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  /** `available.migrating.configuring.previewing` — the dry run of `migration.model`. */
  previewMigration: (context: ContractProductContext) => Promise<IInvoice>;
  /** `available.migrating.configuring.processing.sending` — the commit of `migration.model`. */
  migrate: (context: ContractProductContext) => Promise<IInvoice | undefined>;
  /** `available.migrating.configuring` — reports the configurator child failing. */
  watchMigrationTarget: (context: ContractProductContext) => InvokeCallback;
};
