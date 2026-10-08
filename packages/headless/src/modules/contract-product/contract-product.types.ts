/** @internal */
import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import { selector } from "../scope/scope.utils";
import type {
  FormattedDate,
  ResponseError,
  UseActor,
  useCollection
} from "../../utils";
import type { Address } from "../client-address";
import type { Company } from "../client-company";
import type { CustomField, CustomFieldModel } from "../client-custom-fields";
import type { Invoice } from "../invoices";
import type { LookupItem } from "../lookup";
import type { Product, ProductModel, UseProductConfig } from "../product";
import type { UseProductCatalogue } from "../product-catalogue";
import type {
  InfiniteListQuery,
  invalidateQueryByKey,
  ListQuery,
  resetQueryByKey,
  SimpleQuery
} from "../query";
import type {
  Internationalizable,
  JsonSchema7,
  Layout,
  UISchemaElement
} from "@jsonforms/core";
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
  IContractProductUnpaidInvoice,
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
import type { ErrorObject } from "ajv";
import type dayjs from "dayjs";
import type { ComputedRef, Ref, ShallowRef } from "vue";
import type { ActorRef, AnyEventObject, InvokeCallback } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.types
 * @description Types for a client's own contract products: the query-backed
 * collection (`useContractProducts`) and the machine-backed manager
 * (`useContractProduct`, `contract-product.machine.ts`). The view model, the
 * query model and the cache key are shared by both.
 */

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/**
 * Context types for the collection. `DELEGATED` is a selector context with no
 * id: it narrows the same collection to the client's delegated products.
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
 * Scope matrix for `useContractProduct`: every actor is refused a context. The
 * manager is a single-record read by id (`.withId(id)`), so `.for()` must not
 * compile for any actor; without a matrix the wide default would let it.
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
// FIELD LISTS — each list a mapper reads or omits
// -----------------------------------------------------------------------------

/** The `product` relation members the view model keeps. */
export enum CatalogueProductFields {
  ID = "id",
  NAME = "name",
  IMAGE = "image",
  PROVISION_BLUEPRINT = "provision_blueprint",
  INVOICE_CONSOLIDATION_ENABLED = "invoice_consolidation_enabled",
  PRODUCT_TYPE = "product_type",
  CAN_DISABLE_AUTO_CREATE_RENEW_INVOICE = "can_disable_auto_create_renew_invoice"
}

/** The `scheduled_actions` row members the view model keeps. */
export enum ScheduledActionFields {
  ID = "id",
  ACTION = "action",
  STATUS = "status",
  EXECUTED_AT = "executed_at",
  CREATED_AT = "created_at"
}

/** The `brand` relation members the view model keeps. */
export enum ContractProductBrandFields {
  ID = "id",
  NAME = "name",
  CURRENCY = "currency"
}

/** The members of a delegating client the view model keeps. */
export enum ContractProductClientFields {
  ID = "id",
  FULLNAME = "fullname",
  EMAIL = "email",
  IMAGE = "image",
  BRAND = "brand"
}

/** The `future_cancellation_request` relation members the view model keeps. */
export enum FutureCancellationFields {
  ID = "id",
  FUTURE_CANCELLATION_DATE = "future_cancellation_date",
  SCHEDULED_FOR = "scheduled_for",
  EXECUTED_AT = "executed_at"
}

/** The `tags` relation members the view model keeps. */
export enum ContractProductTagFields {
  ID = "id",
  NAME = "name",
  COLOUR = "colour",
  SHOW_TO_CUSTOMER = "show_to_customer"
}

/** The `moved_to_contract_product` relation members the view model keeps. */
export enum MovedToContractProductFields {
  ID = "id",
  NAME = "name",
  STATUS = "status"
}

/**
 * The view-model members an embedded product drops: they read
 * `allowed_migrations` or the parent `contract` relation, which a read that
 * embeds a product never carries.
 */
export enum ContractProductEmbeddedOmittedFields {
  ALLOWED_MIGRATIONS = "allowedMigrations",
  BILLING_ADDRESS_ID = "billingAddressId",
  BILLING_COMPANY_ID = "billingCompanyId",
  CLIENT_INVOICE_CONSOLIDATION_ENABLED = "clientInvoiceConsolidationEnabled",
  CONTRACT_BILLING_CYCLE_LABEL = "contractBillingCycleLabel",
  CONTRACT_CURRENCY_ID = "contractCurrencyId",
  CONTRACT_STATUS = "contractStatus",
  CONTRACT_TAX_TYPE = "contractTaxType"
}

/** The `useProductConfig` members a migration does not give. */
export enum MigrationConfigOmittedMembers {
  ID = "id",
  STATE = "state",
  SERVICE = "service",
  ON_DONE = "onDone",
  UPDATE_TERM = "updateTerm",
  IS_SELECTED_TERM = "isSelectedTerm",
  UPDATE_QUANTITY = "updateQuantity",
  INCREMENT_QUANTITY = "incrementQuantity",
  DECREMENT_QUANTITY = "decrementQuantity",
  PROVISION_FIELDS = "provisionFields",
  PROVISION_FIELDS_SCHEMA = "provisionFieldsSchema",
  SET_PROVISIONING_FIELDS = "setProvisioningFields",
  GET_PROVISIONING_FIELD = "getProvisioningField",
  SET_TRIAL = "setTrial"
}

/** The product model fields a migration never sets: its form holds no trial and no provision field. */
export enum MigrationModelOmittedFields {
  PROVISION_FIELDS = "provisionFields",
  START_TRIAL = "startTrial"
}

// -----------------------------------------------------------------------------
// VIEW MODEL
// -----------------------------------------------------------------------------

/** `IStatus.code`, narrowed to the contract vocabulary, and the status's translated name. */
export type ContractProductStatus = Pick<IStatus, "code"> & {
  code: ContractStatusCodes;
  /** `status.name_translated`, else `status.name`. */
  name?: IStatus["name"];
};

/** One boolean per contract status code, for a translated status badge. */
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
  /** The request id — the `contract_request_id` a withdraw sends. */
  id?: IContractCancellationRequest["id"];
  status?: ContractProductRequestStatus;
};

/** One `scheduled_actions` row. */
export type ScheduledAction = Pick<
  IScheduledAction,
  `${ScheduledActionFields}`
>;

/** The `product` relation this module reads. */
export type ContractProductCatalogueProduct = Pick<
  IProduct,
  `${CatalogueProductFields}`
>;

/** One option line of the contract product: the option product and what it sells for now. */
export type ContractProductOption = {
  productId: IProduct["id"];
  sellingPrice: IContractProduct["selling_price"];
};

/** The `brand` relation this module reads. */
export type ContractProductBrand = Pick<
  IBrand,
  `${ContractProductBrandFields}`
>;

/** The `tags` relation this module reads. */
export type ContractProductTag = Pick<ITag, `${ContractProductTagFields}`>;

/** A delegating client, off the `clients` / `moved_to_contract_product.clients` relations. */
export type ContractProductClient = Pick<
  IClient,
  `${ContractProductClientFields}`
>;

/** The `moved_to_contract_product` relation this module reads. */
export type MovedToContractProduct = Pick<
  IContractProduct,
  `${MovedToContractProductFields}`
> & {
  clients?: ContractProductClient[];
};

/** The `future_cancellation_request` relation this module reads. */
export type ContractProductFutureCancellation = Pick<
  IContractProductScheduledCancellation,
  `${FutureCancellationFields}`
>;

/** The view model `mapContractProduct` maps `IContractProduct` into. */
export type ContractProduct = {
  id: IContractProduct["id"];
  contractId: IContractProduct["contract_id"];
  status?: ContractProductStatus;
  /** The translated-badge flags for `status.code`. */
  meta: ContractProductMeta;
  /** The owning contract's status code (`contract.status.code`). */
  contractStatus?: ContractStatusCodes;
  stagedImport: IContractProduct["staged_import"];
  contractRequest?: ContractProductRequest;
  renew: IContractProduct["renew"];
  billingCycleMonths: IContractProduct["billing_cycle_months"];
  /** The translated billing-cycle label: "Monthly", "Annually", "One time". */
  billingCycle: string;
  /** The purchase date, as the wire ISO; `dateCreated` is its display descriptor. */
  createdAt: IContractProduct["created_at"];
  /** The formatted price: the recurring price for a subscription, the discounted price for a one-time product, tax-inclusive or net per the brand's tax type. */
  priceFormatted: string;
  /** `priceFormatted` trimmed of zeros, then the lower-cased cycle for a subscription: "£4 monthly", "£60". */
  priceTermSummary: string;
  calculatedCancelDate: IContractProduct["calculated_cancel_date"];
  provisionSetupFieldsConfirmed: IContractProduct["provision_setup_fields_confirmed"];
  inTrial: IContractProduct["in_trial"];
  trialEndAction: TrialEndActionTypes;
  nextDueDate: IContractProduct["next_due_date"];
  /** The display descriptor of `createdAt`. */
  dateCreated: FormattedDate;
  /** The display descriptor of `nextDueDate`. */
  dateNextDue: FormattedDate;
  /** The display descriptor of `calculatedCancelDate`. */
  dateCalculatedCancel: FormattedDate;
  importId: IContractProduct["import_id"];
  moved: IContractProduct["moved"];
  name: IContractProduct["name"];
  /** The display name: the shared product title over this contract product, "Starter Hosting (testdomain.com)". */
  title: string;
  description: IContractProduct["description"];
  canCancel: IContractProduct["can_cancel"];
  /** The product's own invoice consolidation setting; the consolidation form's current value. */
  invoiceConsolidationEnabled: IContractProduct["invoice_consolidation_enabled"];
  /** A pro-rata invoice from a migration is still unpaid; cancelling and migrating are held back. */
  proRataPending: IContractProduct["pro_rata_pending"];
  /** The platform lets the client modify the product (`can_modify`); a migration needs it. */
  canModify: boolean;
  /** `product.product_type`; a migration is offered for a single product only. */
  productType?: ProductTypes;
  /** The products the current product allows a migration to (`allowed_migrations`). */
  allowedMigrations: IProductMigration[];
  /** The contract's own option lines, for the option price rule of a migration. */
  currentOptions: ContractProductOption[];
  /** The contract currency id; a migration loads and prices in it. */
  contractCurrencyId?: IContract["currency_id"];
  /** The contract currency code. */
  contractCurrencyCode?: string;
  /** The contract account id; the product reads are scoped to it. */
  contractAccountId?: IContract["account_id"];
  /** The contract tax type, for the option editors of a migration. */
  contractTaxType?: IContract["tax_type"];
  /** The owning contract's translated billing-cycle label; `undefined` when the contract relation is absent. */
  contractBillingCycleLabel?: string;
  isDelegatedObject: IContractProduct["is_delegated_object"];
  autoCreateRenewInvoice: IContractProduct["auto_create_renew_invoice"];
  /** The client's own label for the product; absent or empty when none is set. */
  clientLabel: IContractProduct["client_label"];
  /** The platform allows the next invoice to be raised now (`can_create_next_invoice`). */
  canCreateNextInvoice: boolean;
  /** The date the next invoice is due; the date a next-invoice write sends. */
  nextInvoiceDate: IContractProduct["next_invoice_date"];
  /** The address the contract bills to. `undefined` on a list row, which does not mean no address. */
  billingAddressId?: IContract["address_id"];
  /** The company the contract bills to. `undefined` on a list row, which does not mean no company. */
  billingCompanyId?: IContract["company_id"];
  unpaidRecurringInvoices: IContractProductUnpaidInvoice[];
  scheduledActions?: ScheduledAction[];
  /** `billing_cycle_months > 0`. */
  isSubscription: boolean;
  /** `contract_request.status.code === request_scheduled_future_cancellation`. */
  hasScheduledFutureCancellation: boolean;
  /** The owning client's `invoice_consolidation_enabled` (`contract.client`). */
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
  /** The wire record this view model was mapped from. */
  raw: IContractProduct;
};

/** A `ContractProduct` as a read that embeds it carries it: the `contract` read and the `tickets` single read. */
export type ContractProductEmbedded = Omit<
  ContractProduct,
  `${ContractProductEmbeddedOmittedFields}`
>;

// -----------------------------------------------------------------------------
// MACHINE — `contract-product.machine.ts`
// -----------------------------------------------------------------------------

/**
 * The fifteen nodes of the product chart. `SETUP_COMPLETE` and `TRIAL_NONE`
 * are the neutral defaults of their region and carry no meta value.
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
  STAGED = "unavailable.status.staged",
  CANCELLED = "unavailable.status.cancelled",
  LAPSED = "unavailable.status.lapsed",
  FRAUD = "unavailable.status.fraud"
}

/** The nodes of an open migration: the product list, or a chosen product. */
export enum ContractProductMigrationStates {
  CHOOSING = "available.migrating.choosing",
  CONFIGURING = "available.migrating.configuring"
}

/**
 * The write nodes of the form regions. While one is active, no formless write
 * is offered or accepted.
 */
export enum ContractProductRegionWriteStates {
  CANCELLING = "available.cancelling.processing",
  CONSOLIDATING = "available.consolidating.processing",
  BILLING_ENTITY = "available.billingEntity.processing",
  BILLING_ENTITY_UNAVAILABLE = "unavailable.billingEntity.processing",
  MIGRATING = "available.migrating.configuring.processing"
}

/**
 * The preparation nodes of the form regions: a form that reads its lists
 * before it opens. A direct write waits here before it submits.
 */
export enum ContractProductRegionLoadingStates {
  CANCELLING = "available.cancelling.loading",
  BILLING_ENTITY = "available.billingEntity.loading",
  BILLING_ENTITY_UNAVAILABLE = "unavailable.billingEntity.loading"
}

/** Context for the contract-product manager machine. */
export type ContractProductContext = {
  /** The resolved actor, never SELF; the scope builder resolves it before the machine starts. */
  scopeActor: ScopeActorTypes;

  /** The contract the product belongs to; seeded from the first read. */
  contractId?: IContract["id"];

  /** The product this manager acts on; seeded from the scope at spawn. */
  contractProductId?: IContractProduct["id"];

  /** Spawned auth subscription actor. */
  authHelper?: ActorRef<AnyEventObject>;

  /** Error from the last operation. */
  error?: ResponseError;

  /** The mapped contract product. */
  contractProduct?: ContractProduct;

  /** The open cancellation form. */
  cancellation?: ContractProductForm<CancellationModel>;

  /** The open consolidation form. */
  consolidation?: ContractProductForm<SetConsolidationModel>;

  /** The open billing-entity form. */
  billingEntity?: ContractProductForm<BillingEntityModel>;

  /** The open migration. */
  migration?: ContractProductMigration;

  /** The invoice the last committed migration raised; outside the form slot, so the re-read keeps it. */
  migrationResult?: MigrationResult | null;

  /**
   * The result of the last next-invoice or end-of-trial write. `undefined`
   * means no settled result, `null` means the write raised no invoice.
   * Outside the form slots, so the re-read keeps it.
   */
  issuedInvoice?: Invoice | null;
};

/** The two ids every manager request needs. */
export type ContractProductIds = Pick<
  ContractProductContext,
  "contractId" | "contractProductId"
>;

/** The one picked address or company a billing-entity write takes. */
export type BillingEntityChoice = { address: Address } | { company: Company };

/** One address or company the billing-entity picker offers: its id and its label. */
export type BillingEntityOption = { const: string; title: string };

/** The client's addresses and companies, read off their owner modules. */
export type BillingEntityLists = {
  addresses: Address[];
  companies: Company[];
};

/** A write form's uischema: a layout that names its translation key. */
export type ContractProductLayout = Layout & Internationalizable;

/** The write forms, each a parallel region of `available`. */
export enum ContractProductFormTypes {
  CANCELLATION = "CANCELLATION",
  CONSOLIDATION = "CONSOLIDATION",
  BILLING_ENTITY = "BILLING_ENTITY"
}

/** One open write form, over the model it edits. */
export type ContractProductForm<
  TModel extends ContractProductWriteModel = ContractProductWriteModel
> = {
  schema?: JsonSchema7;
  uischema?: UISchemaElement;
  model?: Partial<TModel>;
};

// -----------------------------------------------------------------------------
// MIGRATION — the `migrating` region
// -----------------------------------------------------------------------------

/** The chosen product: its id and its row of the product list. */
export type MigrationTarget = {
  id: IProduct["id"];
  product: Product;
};

/** One open migration: the chosen product, its configurator and what was last priced. */
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

/** What a committed migration gave. */
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

/** The inputs of `toChangeProductBody`. */
export type ChangeProductInput = {
  contractId: IContract["id"];
  contractProductId: IContractProduct["id"];
  targetId: IProduct["id"];
  model: ProductModel;
  rawProduct?: IProduct;
  currentOptions?: ContractProductOption[];
  currencyId?: IContract["currency_id"];
  /** A numeric custom price wins. The client path sets none. */
  customPrice?: number;
};

/**
 * The configurator of the chosen product: `useProductConfig` over the child,
 * without the members a commit could skip `migrate()` with, its own state, or
 * a provision field or trial. Its `setConfig` drops `startTrial` and
 * `provisionFields`, and its `schema` and `uischema` hold neither.
 */
export type MigrationConfig = Omit<
  UseProductConfig,
  `${MigrationConfigOmittedMembers}`
>;

/** The built `migrationConfig`, and the child state it is read over. */
export type MigrationConfigHolder = {
  config: MigrationConfig;
  /** The configurator child's state. */
  state: UseProductConfig["state"];
};

/**
 * The three scoped holders of one manager. Each is `null` until its inputs are
 * resolved, and builds inside its own effect scope, which stops on a rebuild,
 * when the inputs go incomplete, and on `dispose`.
 */
export type MigrationHolders = {
  /** The count of the products the current product allows. */
  count: ShallowRef<UseProductCatalogue | null>;
  /** The paged list of those products on the current term. */
  list: ShallowRef<UseProductCatalogue | null>;
  /** The configurator of the chosen product. */
  config: ShallowRef<MigrationConfigHolder | null>;
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

/** The inputs both product reads need before their `const` filter leaves can be built. */
export type MigrationReadInputs = {
  ids: string[];
  currencyId: string;
  accountId: string;
};

/** The inputs of the product list: the read inputs, and the current term. */
export type MigrationListInputs = MigrationReadInputs & { term: number };

/** The input of the configurator: the spawned child, and its id. */
export type MigrationConfigInputs = {
  id: string;
  ref: ActorRef<AnyEventObject>;
};

/** A holder built in its own effect scope: `null` until its inputs are resolved. */
export type ScopedHolder<THolder> = {
  dispose: () => void;
  holder: ShallowRef<THolder | null>;
};

// -----------------------------------------------------------------------------
// FUTURE CANCELLATION
// -----------------------------------------------------------------------------

/** The anchor of every future-cancellation calculation. */
export type AnniversaryAnchor = {
  reference: dayjs.Dayjs;
  billingCycleMonths: number;
};

// -----------------------------------------------------------------------------
// WRITE FORMS AND MODELS
// -----------------------------------------------------------------------------

/** The model a write form carries, parsed and validated before its service runs. */
export type ContractProductWriteModel =
  | BillingEntityModel
  | CancellationModel
  | ClientLabelModel
  | SetConsolidationModel;

/**
 * The client cancellation options a product may offer. The chosen option
 * routes the submit to one of three writes.
 */
export enum ContractProductCancelOption {
  /** Cancel at the end of the current term (stop auto-renew). */
  SOFT = "soft",
  /** Request immediate cancellation. */
  HARD = "hard",
  /** Schedule a cancellation for a future anniversary date. */
  SCHEDULE_FUTURE = "schedule_future"
}

/** The submit event each cancellation option routes to. */
export const CANCEL_OPTION_EVENT: Record<ContractProductCancelOption, string> =
  {
    [ContractProductCancelOption.SOFT]: "STOP_RENEWING",
    [ContractProductCancelOption.SCHEDULE_FUTURE]: "SCHEDULE_CANCEL",
    [ContractProductCancelOption.HARD]: "REQUEST_CANCEL"
  };

/** The page size of the migration product list. */
export const MIGRATION_PAGE_SIZE = 4;

/**
 * The cancellation form model. `futureCancellationDate` is required only for
 * `SCHEDULE_FUTURE`; `customFields` is the CANCEL_REQUEST catalogue.
 */
export type CancellationModel = {
  option: ContractProductCancelOption;
  reason?: string;
  customFields?: CustomFieldModel;
  futureCancellationDate?: string;
};

/** The mapper input the two `modify_renew` writes share; `renew` is set by the service. */
export type SoftCancelModel = {
  renew: boolean;
  reason?: string;
  customFields?: CustomFieldModel;
};

/** The model of the billing-entity form: the picked address or company id. */
export type BillingEntityModel = {
  billing_entity: BillingEntityOption["const"];
};

/** The model of the client-label write. */
export type ClientLabelModel = {
  client_label: string;
};

/** The model of the consolidation form. */
export type SetConsolidationModel = {
  invoiceConsolidationEnabled: InvoiceConsolidationTypes;
};

/** The mapper input `scheduleCancellation` builds from the cancellation model. */
export type ScheduleCancellationModel = {
  futureCancellationDate: string;
  reason?: string;
  customFields?: CustomFieldModel;
};

/** The mapper input the hard-cancellation request builds. */
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

/** `PUT contracts/{c}/products/{p}/schedule-cancel` body. */
export type ScheduleCancellationBody = {
  future_cancellation_date: string;
  cancellation_reason?: string;
  custom_fields?: CustomFieldModel;
};

/** `POST contracts/{contractId}/cancel/request` body. */
export type RequestCancellationBody = {
  product_ids: RequestCancellationModel["productIds"];
  cancellation_reason?: RequestCancellationModel["reason"];
  custom_fields?: RequestCancellationModel["customFields"];
};

/** `PUT contracts/{c}/address_company_vat` body. */
export type BillingEntityBody = {
  address_id: IContract["address_id"];
  company_id: IContract["company_id"] | null;
};

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's request state
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model: `filters` (wire column → operator →
 * value; a bare column carries its value directly), `sort` and `pagination`.
 */
export type QueryModel = {
  filters?: {
    "product.name"?: { like?: string | null };
    "product.category.name"?: { like?: string | null };
    "product.category.id"?: string | null;
    "status.code"?: ContractStatusCodes | null;
    /** `neq` is `subscriptionsOnly` and the forced hide-one-time leaf; `eq` is `oneTimeOnly`. */
    billing_cycle_days?: { neq?: number | null; eq?: number | null };
    created_at?: { gt?: string | null };
    next_due_date?: { gt?: string | null };
    total_amount?: number | null;
  };
  /** The quick search, a bare `query=<term>` param. */
  query?: string | null;
  sort?: SortEntry[];
  // `offset` alone is unspellable: with no page size the page index is NaN.
  pagination?:
    | { limit?: number; offset?: never }
    | { limit: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

/** Properties the collection can be sorted by. */
export enum ContractProductsSortableProperties {
  STATUS = "status",
  CREATED_AT = "created_at",
  NEXT_DUE_DATE = "next_due_date",
  CANCELLED_DATE = "cancelled_date"
}

/** One sort entry; `field` is the schema's own declared enum. */
export type SortEntry = {
  field: ContractProductsSortableProperties;
  dir: SortDirection;
};

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/** The order the list starts in. */
export const DEFAULT_SORT: SortModel = [
  {
    field: ContractProductsSortableProperties.CREATED_AT,
    dir: SortDirection.ASC
  }
];

/** The collection's query schema. */
export type ContractProductsQuerySchema = JsonSchema7;

/** The `contractProductPicker`'s own criteria: a service-identifier search. */
export type ContractProductPickerQueryModel = {
  filters?: { service_identifier?: { like?: string | null } };
  pagination?: { limit?: number; offset?: number };
};

/** The picker's once-minted lookup query. */
export type ContractProductPickerLookupQuery = InfiniteListQuery<
  IContractProduct[],
  LookupItem[],
  ContractProductPickerQueryModel
>;

/** A thunk returning the once-minted {@link ContractProductPickerLookupQuery}. */
export type ContractProductPickerLookupService =
  () => ContractProductPickerLookupQuery;

// -----------------------------------------------------------------------------
// SERVICES CONTRACTS
// -----------------------------------------------------------------------------

/** The reactive list query, minted once per scope in `useContractProducts.ts`. */
export type ContractProductListQuery = ListQuery<
  IContractProduct[],
  ContractProduct[],
  QueryModel
>;

/** The dashboard's grouped-count query, minted once per scope in `useContractProducts.ts`. */
export type ContractProductGroupedCountsQuery = SimpleQuery<
  IContractProduct[],
  ICProdGroup[]
>;

/** What `createContractProductsServices` resolves to. */
/** The `exclude_delegated` flag a collection read sends, and whether the preference behind it is still being read. */
export type ExcludeDelegatedRead = {
  excludeDelegated: Readonly<Ref<0 | 1>>;
  isPreferenceLoading?: ComputedRef<boolean>;
};

export type ContractProductsServices = {
  /** The module's base cache key; every write invalidates it whole. */
  queryKey: QueryKey;
  /** The collection's list query. */
  loadList: () => ContractProductListQuery;
  /** The dashboard's grouped-count query. */
  loadGroupedCounts: () => ContractProductGroupedCountsQuery;
  /** The purchased categories. */
  loadPurchasedCategories: () => Promise<IProductCategory[]>;
  /** The `contractProductPicker`'s own lookup. */
  loadContractProductLookup: ContractProductPickerLookupService;
};

/** What `createContractProductServices` resolves to: the manager's reads and writes. */
export type ContractProductServices = {
  /** The module's base cache key; every write invalidates it whole. */
  queryKey: QueryKey;
  /** The product read; warms the CANCEL_REQUEST fields the cancellation form reads. */
  load: (ids: ContractProductIds) => Promise<ContractProduct>;
  /** The client's addresses and companies, once both owner lists are read. */
  loadBillingEntities: () => Promise<BillingEntityLists>;
  /** The CANCEL_REQUEST fields the cancellation form draws, once read. */
  loadCancellationFields: () => Promise<CustomField[]>;
  requestSoftCancel: (
    ids: ContractProductIds,
    model?: Partial<CancellationModel>
  ) => Promise<IContractProduct | undefined>;
  abortSoftCancel: (
    ids: ContractProductIds
  ) => Promise<IContractProduct | undefined>;
  requestCancellation: (
    ids: ContractProductIds,
    model?: Partial<CancellationModel>
  ) => Promise<IContractProduct | undefined>;
  withdrawCancellation: (
    ids: ContractProductIds,
    requestId?: ContractProductRequest["id"]
  ) => Promise<IContractProduct | undefined>;
  scheduleCancellation: (
    ids: ContractProductIds,
    model?: Partial<CancellationModel>
  ) => Promise<IContractProduct | undefined>;
  revokeScheduledCancellation: (
    ids: ContractProductIds
  ) => Promise<IContractProduct | undefined>;
  setConsolidation: (
    ids: ContractProductIds,
    model?: Partial<SetConsolidationModel>
  ) => Promise<IContractProduct | undefined>;
  previewMigration: (input: ChangeProductInput) => Promise<IInvoice>;
  migrate: (input: ChangeProductInput) => Promise<IInvoice | undefined>;
  setAutoRenew: (
    ids: ContractProductIds,
    on: boolean
  ) => Promise<IContractProduct | undefined>;
  issueNextInvoice: (
    ids: ContractProductIds,
    nextInvoiceDate?: ContractProduct["nextInvoiceDate"]
  ) => Promise<IInvoice | null>;
  endTrial: (ids: ContractProductIds) => Promise<IInvoice | null>;
  setClientLabel: (
    ids: ContractProductIds,
    model: ClientLabelModel
  ) => Promise<IContractProduct | undefined>;
  setBillingEntity: (
    ids: ContractProductIds,
    model?: Partial<BillingEntityModel>
  ) => Promise<IContractProduct | undefined>;
};

/** The XState services map `contract-product.machine.ts` invokes, keyed by `invoke.src`. */
export type ContractProductMachineServices = {
  load: (context: ContractProductContext) => Promise<ContractProduct>;
  loadBillingEntities: () => Promise<BillingEntityLists>;
  loadCancellationFields: () => Promise<CustomField[]>;
  /** Each form validation rejects with a 422 on an invalid model. */
  validateCancellation: (context: ContractProductContext) => Promise<void>;
  validateConsolidation: (context: ContractProductContext) => Promise<void>;
  validateBillingEntity: (context: ContractProductContext) => Promise<void>;
  /** Resolves the validated label model the update sends. */
  validateClientLabel: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<ClientLabelModel>;
  requestSoftCancel: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  abortSoftCancel: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  requestCancellation: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  withdrawCancellation: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  scheduleCancellation: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  revokeScheduledCancellation: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  setConsolidation: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  previewMigration: (context: ContractProductContext) => Promise<IInvoice>;
  migrate: (context: ContractProductContext) => Promise<IInvoice | undefined>;
  /** Reports the configurator child failing. */
  watchMigrationTarget: (context: ContractProductContext) => InvokeCallback;
  setAutoRenew: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  issueNextInvoice: (
    context: ContractProductContext
  ) => Promise<IInvoice | null>;
  endTrial: (context: ContractProductContext) => Promise<IInvoice | null>;
  setClientLabel: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  setBillingEntity: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
};

// -----------------------------------------------------------------------------
// COLLECTION LAYERS — the explicit member types of `useContractProducts`
// -----------------------------------------------------------------------------

/** The flags of `useContractProducts().useMeta()`. */
export type ContractProductsMetaMembers = Record<
  | "hasError"
  | "hasPages"
  | "isAvailable"
  | "isEmpty"
  | "isFiltered"
  | "isLoading",
  ComputedRef<boolean>
>;

/** What `useContractProducts().useInternals()` exposes. */
export type ContractProductsInternalMembers = {
  scopeActor: ScopeActorTypes;
  query: ContractProductListQuery;
};

/** The schema family of `useContractProducts().useContext()`. */
export type ContractProductsSchemas = {
  query: {
    schema: ContractProductsQuerySchema;
    uischema: UISchemaElement;
    sortUischema: UISchemaElement;
  };
  contractProductPicker: {
    schema: ContractProductsQuerySchema;
    uischema: UISchemaElement;
  };
};

/** The members of `useContractProducts().useContext()`. */
export type ContractProductsContextMembers = Pick<
  ReturnType<typeof useCollection<ContractProduct>>,
  "findOne" | "getOne"
> & {
  data: ComputedRef<ContractProduct[]>;
  error: ComputedRef<ResponseError | undefined>;
  groupedCounts: ComputedRef<ICProdGroup[]>;
  pagination: ContractProductListQuery["pagination"];
  query: ContractProductListQuery["criteria"];
  schemas: ContractProductsSchemas;
};

/** The list controls of `useContractProducts().useActions()`. */
export type ContractProductsListMembers = {
  filterBy: (intent: FilterModel) => void;
  nextPage: ContractProductListQuery["fetchNextPage"];
  prevPage: ContractProductListQuery["fetchPreviousPage"];
  refresh: () => Promise<void>;
  setCriteria: ContractProductListQuery["setCriteria"];
  sortBy: (intent: SortModel) => void;
};

/** The cache and lifecycle members of `useContractProducts().useActions()`. */
export type ContractProductsCacheMembers = {
  destroy: () => void;
  invalidate: ReturnType<typeof invalidateQueryByKey>;
  reset: ReturnType<typeof resetQueryByKey>;
};

/** The two extra reads of `useContractProducts().useActions()`. */
export type ContractProductsReadMembers = {
  loadGroupedCounts: () => Promise<ICProdGroup[]>;
  loadPurchasedCategories: () => Promise<IProductCategory[]>;
};

/** The members of `useContractProducts().useActions()`. */
export type ContractProductsActionMembers = ContractProductsListMembers &
  ContractProductsCacheMembers &
  ContractProductsReadMembers & { isReady: () => Promise<boolean> };

/** What the scope factory of `useContractProducts` returns: the four lazy layers. */
export type ContractProductsScope = {
  useActions: () => ContractProductsActionMembers;
  useContext: () => ContractProductsContextMembers;
  useInternals: () => ContractProductsInternalMembers;
  useMeta: () => ContractProductsMetaMembers;
};

// -----------------------------------------------------------------------------
// MANAGER LAYERS — the explicit member types of `useContractProduct`
// -----------------------------------------------------------------------------

/** The lifecycle members of `useContractProduct().useActions()`. */
export type ContractProductControlMembers = {
  destroy: () => void;
  onDone: () => Promise<boolean>;
  stop: () => void;
};

/** The re-read members of `useContractProduct().useActions()`. */
export type ContractProductRefreshMembers = {
  refresh: () => void;
  reset: () => Promise<void>;
};

/** The write-form members of `useContractProduct().useActions()`. */
export type ContractProductFormMembers = {
  cancelForm: (form: ContractProductFormTypes) => void;
  openCancellation: () => void;
  openConsolidation: () => void;
  set: (
    form: ContractProductFormTypes,
    model: Partial<ContractProductWriteModel>
  ) => void;
  setConsolidation: (
    model: SetConsolidationModel
  ) => Promise<ContractProduct | false>;
  submitBillingEntity: () => Promise<ContractProduct | false>;
  submitCancellation: () => Promise<ContractProduct | false>;
  submitConsolidation: () => Promise<ContractProduct | false>;
};

/** The direct cancellation members of `useContractProduct().useActions()`. */
export type ContractProductCancelMembers = {
  requestCancellation: (
    model?: Omit<RequestCancellationModel, "productIds">
  ) => Promise<ContractProduct | false>;
  scheduleCancellation: (
    model: ScheduleCancellationModel
  ) => Promise<ContractProduct | false>;
  stopRenewing: (
    model?: Omit<SoftCancelModel, "renew">
  ) => Promise<ContractProduct | false>;
};

/** The renewal members of `useContractProduct().useActions()`. */
export type ContractProductRenewalMembers = {
  resumeRenewing: () => Promise<ContractProduct | false>;
  revokeScheduledCancellation: () => Promise<ContractProduct | false>;
  withdrawCancellation: () => Promise<ContractProduct | false>;
};

/** The migration members of `useContractProduct().useActions()`. */
export type ContractProductMigrationMembers = {
  cancelMigration: () => void;
  loadMoreMigrationTargets: () => Promise<void>;
  migrate: () => Promise<MigrationResult | false>;
  openMigration: () => boolean;
  reloadMigrationTarget: () => void;
  selectMigrationTarget: (id: string) => Promise<boolean>;
};

/** The invoice-raising lifecycle writes of `useContractProduct().useActions()`. */
export type ContractProductInvoiceMembers = {
  endTrial: () => Promise<Invoice | null | false>;
  issueNextInvoice: () => Promise<Invoice | false>;
};

/** The settings writes of `useContractProduct().useActions()`. */
export type ContractProductSettingsMembers = {
  setAutoRenew: (on: boolean) => Promise<ContractProduct | false>;
  openBillingEntity: () => void;
  setBillingEntity: (
    choice: BillingEntityChoice | string
  ) => Promise<ContractProduct | false>;
  setClientLabel: (label: string) => Promise<ContractProduct | false>;
};

/** The members of `useContractProduct().useActions()`. */
export type ContractProductActionMembers = ContractProductCancelMembers &
  ContractProductControlMembers &
  ContractProductFormMembers &
  ContractProductInvoiceMembers &
  ContractProductMigrationMembers &
  ContractProductRefreshMembers &
  ContractProductRenewalMembers &
  ContractProductSettingsMembers & { isReady: () => Promise<boolean> };

/** What `useContractProduct().useInternals()` exposes. */
export type ContractProductInternalMembers = Pick<
  UseActor,
  "send" | "service" | "state"
> & { scopeActor: ScopeActorTypes };

/** The view-model members of `useContractProduct().useContext()`. */
export type ContractProductRecordContextMembers = {
  allowedMigrations: ComputedRef<IProductMigration[]>;
  contractProduct: ComputedRef<ContractProduct | undefined>;
  description: ComputedRef<ContractProduct["description"] | undefined>;
  minFutureCancellationDate: ComputedRef<string | null>;
  scheduledActions: ComputedRef<ScheduledAction[]>;
  title: ComputedRef<ContractProduct["title"] | undefined>;
};

/** The machine-state members of `useContractProduct().useContext()`. */
export type ContractProductStateContextMembers = {
  billingEntity: ComputedRef<ContractProductForm | undefined>;
  cancellation: ComputedRef<ContractProductForm | undefined>;
  consolidation: ComputedRef<ContractProductForm | undefined>;
  context: ComputedRef<ContractProductContext | undefined>;
  contractId: ComputedRef<string | undefined>;
  error: ComputedRef<ResponseError | undefined>;
  errors: ComputedRef<ResponseError["message"] | undefined>;
  id: ComputedRef<string | undefined>;
  issuedInvoice: ComputedRef<Invoice | null | undefined>;
  validationErrors: ComputedRef<ErrorObject[] | undefined>;
};

/** The migration members of `useContractProduct().useContext()`. */
export type ContractProductMigrationContextMembers = {
  migrationConfig: ComputedRef<MigrationConfig | null>;
  migrationPreview: ComputedRef<MigrationPreview | undefined>;
  migrationResult: ComputedRef<MigrationResult | null>;
  migrationsCount: ComputedRef<number>;
  migrationTarget: ComputedRef<MigrationTarget | undefined>;
  migrationTargets: ComputedRef<Product[]>;
};

/** The members of `useContractProduct().useContext()`. */
export type ContractProductContextMembers =
  ContractProductMigrationContextMembers &
    ContractProductRecordContextMembers &
    ContractProductStateContextMembers;

/** A set of flags of `useContractProduct().useMeta()`. */
type ContractProductFlags<TKeys extends string> = Record<
  TKeys,
  ComputedRef<boolean>
>;

/** The status nodes of the product. */
export type ContractProductStatusFlags = ContractProductFlags<
  | "isActive"
  | "isCancelled"
  | "isCancelling"
  | "isExpiring"
  | "isFraud"
  | "isInactive"
  | "isLapsed"
  | "isPending"
  | "isStaged"
  | "isSuspended"
>;

/** The placement, loading, trial and write-in-flight nodes of the machine. */
export type ContractProductNodeFlags = ContractProductFlags<
  | "isAvailable"
  | "isLoading"
  | "isOnTerminatingTrial"
  | "isOnTrial"
  | "isProcessing"
  | "isSetupIncomplete"
  | "isUnavailable"
>;

/** The open and valid flags of the write forms. */
export type ContractProductFormFlags = ContractProductFlags<
  | "isBillingEntityOpen"
  | "isBillingEntityValid"
  | "isCancellationOpen"
  | "isCancellationValid"
  | "isConsolidationOpen"
  | "isConsolidationValid"
>;

/** The migration nodes. */
export type ContractProductMigrationFlags = ContractProductFlags<
  | "isChoosingMigrationTarget"
  | "isMigrationOpen"
  | "isMigrationPreviewed"
  | "isMigrationPreviewing"
  | "isMigrationProcessing"
  | "isMigrationTargetLoading"
  | "isMigrationTargetUnavailable"
>;

/** The cost and result of the migration. */
export type ContractProductMigrationResultFlags = ContractProductFlags<
  "isMigrationFree" | "isPaymentRequired"
>;

/** The state of the migration product list. */
export type ContractProductMigrationListFlags = ContractProductFlags<
  | "hasMigrationTargetsError"
  | "hasMoreMigrationTargets"
  | "hasNoMigrationTargets"
  | "isMigrationTargetsLoading"
  | "isMigrationTargetsLoadingMore"
>;

/** The facts of the record. */
export type ContractProductRecordFlags = ContractProductFlags<
  | "canCancel"
  | "hasError"
  | "hasMoved"
  | "hasPendingProRata"
  | "hasScheduledFutureCancellation"
  | "hasUnpaidRecurringInvoices"
  | "isDelegatedAccess"
  | "isImported"
  | "isSubscription"
>;

/** The facts the record gives once read. */
export type ContractProductDerivedRecordFlags = ContractProductFlags<
  "hasAutoRenewDisabled" | "hasFetchedScheduledActions" | "isEmpty"
>;

/** The state of the outstanding invoices of the product. */
export type ContractProductInvoiceFlags = ContractProductFlags<
  "isCancellable" | "isDue"
>;

/** The gates of the cancellation requests. */
export type ContractProductRequestGates = ContractProductFlags<
  | "canRequestCancellation"
  | "canRequestEndOfTerm"
  | "canScheduleFutureCancellation"
>;

/** The gates of the write forms. */
export type ContractProductFormGates = ContractProductFlags<"canConsolidate">;

/** The gates of the migration. */
export type ContractProductMigrationGates = ContractProductFlags<
  "canCommitMigration" | "canMigrate"
>;

/** The gates of the renewal invoicing. */
export type ContractProductAutoRenewGates = ContractProductFlags<
  "canDisableAutoRenew" | "canEnableAutoRenew"
>;

/** The gates of the invoice-raising writes. */
export type ContractProductInvoiceGates = ContractProductFlags<
  "canEndTrial" | "canIssueNextInvoice"
>;

/** The gates of the billing entity and the label, and the next-invoice-date report. */
export type ContractProductSettingsGates = ContractProductFlags<
  | "canSetBillingEntity"
  | "canUpdateContractProduct"
  | "isNextInvoiceDateInFuture"
>;

/** The record and form flags of `useContractProduct().useMeta()`. */
export type ContractProductFlagMembers = ContractProductDerivedRecordFlags &
  ContractProductFormFlags &
  ContractProductInvoiceFlags &
  ContractProductMigrationFlags &
  ContractProductMigrationListFlags &
  ContractProductMigrationResultFlags &
  ContractProductRecordFlags;

/** The gates of `useContractProduct().useMeta()`. */
export type ContractProductGateMembers = ContractProductAutoRenewGates &
  ContractProductFormGates &
  ContractProductInvoiceGates &
  ContractProductMigrationGates &
  ContractProductRequestGates &
  ContractProductSettingsGates;

/** The flags of `useContractProduct().useMeta()`. */
export type ContractProductMetaMembers = ContractProductFlagMembers &
  ContractProductGateMembers &
  ContractProductNodeFlags &
  ContractProductStatusFlags;

/** What the scope factory of `useContractProduct` returns: the four lazy layers. */
export type ContractProductScope = {
  useActions: () => ContractProductActionMembers;
  useContext: () => ContractProductContextMembers;
  useInternals: () => ContractProductInternalMembers;
  useMeta: () => ContractProductMetaMembers;
};
