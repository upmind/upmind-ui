/**
 * @graphify-citation `graphify query "client company scope matrix context
 * types"` (2026-08-08, `graphify-out/graph.json`, 12,667 nodes; BFS depth=2
 * from `Company`, `client-company.types.ts`, `ClientEmailScopeMatrix`,
 * `ScopeActorTypes`, 643 nodes reached). A direct node scan for
 * `CompaniesContextTypes`, `CompanyContextTypes`, `COMPANIES_SCOPE_MATRIX`,
 * `COMPANY_SCOPE_MATRIX`, `ClientCompanyServices`, `ClientCompanyListQuery`
 * and `ClientCompanyManagerMachineConfig` returned 0 hits — none of the
 * constructs below exists anywhere in the graph today. The only pre-existing
 * scope-matrix family is `client-email`'s (`ClientEmailScopeMatrix`,
 * `client-email.types.ts` L83), which this design deliberately mirrors rather
 * than duplicates: the two matrices differ in their context members (`COMPANY`
 * vs `EMAIL`) and cannot be shared. `Company` / `CompanyModel` / `CompanyContext`
 * already exist and are kept, not re-minted. See `graphify-out/GRAPH_REPORT.md`.
 *
 * @graphify-citation `graphify query "client company query model filter sort
 * schema"` (2026-08-22, `graphify-out/graph.json`, 643 nodes; BFS depth=2 from
 * `Company`, `query()`, `model`, `schema`) — no `QueryModel` / `FilterModel` /
 * `SortModel` / `SortEntry` / `QuerySchema` / `DEFAULT_SORT` node for
 * `client-company` anywhere in the graph; the only pre-existing family is
 * `client-email`'s own (`client-email.types.ts` L141-186), which scopes on a
 * different filter/sort vocabulary (`email`/`verified`/`bounced` vs `name`)
 * and cannot be shared. No live duplicate to consume, so minting here is
 * warranted. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-company/client-company.types
 * @description Types for a client's own companies — the query-backed
 * collection (`useClientCompanies`) and the `dataManagerMachine`-backed
 * per-company form editor (`useClientCompanyManager`). Each composable owns
 * its own context enum and scope matrix; the company model, the services
 * contract and the mappers are shared, which is what keeps ONE identity seam
 * for both halves.
 */

// `SortDirection` is read at MODULE scope below (`DEFAULT_SORT`), so it comes
// from its declaring file: `../query` reaches this module mid-barrel, where
// the value would still be `undefined` (see graphify-out/ citation above).
import { AccessRoleTypes } from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { Address, AddressModel } from "../client-address";
import type { Email } from "../client-email";
import type { Phone, PhoneModel } from "../client-phone";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ListQuery } from "../query";
import type { JsonSchema7 } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type { ICountry, ICompany, IRegion } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/**
 * Context types for the company COLLECTION — whose list is being addressed.
 */
export enum ClientCompaniesContextTypes {
  /** Acting on a client's company collection. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Scope matrix for `useClientCompanies`. `client` is the only actor that
 * resolves; `staff` and `guest` are `null as never`, which makes `.as('staff')`
 * a compile-time error rather than an advertised-but-absent capability
 * (operator ruling R1 — `parity.yaml` C38/C39).
 */
export const CLIENT_COMPANIES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientCompaniesContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientCompanies` (derived from the runtime const). */
export type ClientCompaniesScopeMatrix = typeof CLIENT_COMPANIES_SCOPE_MATRIX;

/**
 * Context types for the per-company MANAGER — which company is being edited.
 * The context names the ENTITY, not its owner: the owning client falls through
 * the same `resolveClientId` seam as every other call.
 */
export enum ClientCompanyContextTypes {
  /** Editing one existing company by id. */
  COMPANY = "company"
}

/**
 * Scope matrix for `useClientCompanyManager`. Separate from the collection's —
 * the two composables scope on different things and cannot share one.
 */
export const CLIENT_COMPANY_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientCompanyContextTypes.COMPANY,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientCompanyManager` (derived from the runtime const). */
export type ClientCompanyScopeMatrix = typeof CLIENT_COMPANY_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * The form/request model for a company. Present fields are mutually exclusive
 * pairs — an id-or-inline choice for the address, the email and the phone.
 */
export interface CompanyModel {
  /** Present when editing an existing company. */
  id?: ICompany["id"];
  // --- one of
  /** The id of an existing address. Mutually exclusive with `address`. */
  addressId?: ICompany["address_id"];
  /** A full address model, for an inline create. Mutually exclusive with `addressId`. */
  address?: AddressModel["address"];
  // ---
  /** The id of an existing email. Mutually exclusive with `email`. */
  emailId?: ICompany["email_id"];
  /** An email address string, for an inline create. Mutually exclusive with `emailId`. */
  email?: Email["email"];
  // ---
  /** A phone model, for an inline create. Mutually exclusive with `phoneId`. */
  phone?: PhoneModel["phone"];
  /** The id of an existing phone. Mutually exclusive with `phone`. */
  phoneId?: ICompany["phone_id"];
  // ---
  /** The name of the company. */
  name?: ICompany["name"];
  /** The registration number of the company. */
  regNumber?: ICompany["reg_number"];
  /** Tax details for the company. */
  tax?: {
    /** The VAT number of the company. */
    number?: ICompany["vat_number"];
  };
  /**
   * `true` if this is the client's default company. Deliberately dropped by
   * `mapICompany` — a form save can never set or unset this; `setDefault` is
   * the only route (`parity.yaml` C14, not a defect).
   */
  default?: ICompany["default"];
}

/**
 * A company as read from the API, with its display and status fields.
 */
export interface Company {
  /** The unique identifier for the company. */
  id: ICompany["id"];
  /** The id of the associated email address. */
  emailId: ICompany["email_id"];
  /** The id of the associated phone number. */
  phoneId: ICompany["phone_id"];
  /** The id of the associated address. */
  addressId: ICompany["address_id"];
  /** Display title — the company's name, or "New Company". */
  title: string;
  /** Display description — the compacted address join. */
  description: string;
  /** The name of the company. */
  name: ICompany["name"];
  /** `true` if this is the client's default company. */
  default: ICompany["default"];
  /** The registration number of the company. */
  regNumber: ICompany["reg_number"];
  /** Tax details for the company. */
  tax: {
    /** `true` if the VAT number has been successfully validated. */
    valid: ICompany["vat_validated"];
    /** The VAT percentage applied. */
    percent: ICompany["vat_percent"];
    /** The VAT number of the company. */
    number: ICompany["vat_number"];
    /** The reason VAT validation failed, if applicable. */
    reason: ICompany["vat_validation_failed_reason"];
    /** When the VAT number was last checked. */
    checked: {
      /** The date/time last checked. */
      date: ICompany["vat_validation_checked_at"];
      /** A human-readable relative time string. */
      relative: string;
    };
    /** The service or method used for VAT validation. */
    with: ICompany["vat_validated_with"];
  };
  /** Status flags for UI rendering. */
  meta: {
    /** `true` if this is the client's default company. */
    isDefault: boolean;
    /** `true` if the API permits deleting this company. */
    canDelete: boolean;
    /** `true` if the company's details have been verified. */
    isVerified: boolean;
    /** `true` if the company has a tax number on file. */
    hasTax: boolean;
    /** `true` if tax-number validation is switched on for the brand. */
    hasTaxValidation: boolean;
    /** `true` if the company's tax number has been validated. */
    hasValidTax: boolean;
  };
}

// -----------------------------------------------------------------------------
// QUERY MODEL (see graphify-out/ citation at the head of this file)
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (nested column → operator →
 * value), `sort` (ordered, precedence = position) and `pagination`. This is the
 * instance validated against `useQuerySchema()`; the translator maps it to the
 * `QueryProps` the query layer already accepts.
 */
export type QueryModel = {
  filters?: {
    name?: { like?: string };
  };
  sort?: SortEntry[];
  // `offset` alone is unspellable: an offset with no known page size cannot
  // be resolved against a `limit: 0` (unpaged) collection without producing
  // a NaN page index (`useQuery.ts`'s pager math). `limit` alone stays legal
  // — it is the module's documented page-size door
  // (`useClientCompanies.actions.ts`'s `setCriteria({ pagination: { limit } })`),
  // mirroring `client-address.types.ts` (see graphify-out/ citation at the
  // head of this file).
  pagination?:
    | { limit?: number; offset?: never }
    | { limit: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

// Narrowed to the schema's own enum (see graphify-out/ citation at the head
// of this file) — `useQuerySchema()`'s `sort.items.properties.field.enum` is
// `["name", "created_at"]`; a bare `string` let an unschematised `field`
// compile and reach ajv only to be silently discarded on write.
/** One sort entry. Precedence is position — the first entry sorts first. */
export type SortEntry = { field: "name" | "created_at"; dir: SortDirection };

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/**
 * The order the list starts in — `created_at` ascending, the exact wire the
 * pre-conversion raw `sort` literal produced (`billableEntitiesProvider.vue`
 * L71-79 client-side order; `requirements.md`'s oracle table). Declared as the
 * query schema's `sort` default, so an emptied sort refills itself on the next
 * parse.
 */
export const DEFAULT_SORT: SortModel = [
  { field: "created_at", dir: SortDirection.ASC }
];

/**
 * The collection's query schema. A `JsonSchema7`: a query schema IS a real
 * Draft-07 schema, and the translator/validators walk it at runtime, so the
 * type stays general rather than a module-specific literal.
 */
export type QuerySchema = JsonSchema7;

/**
 * The manager's machine context — the shared machine's, over this form
 * model (see the header `@graphify-citation` — graphify-out/GRAPH_REPORT.md,
 * 0 pre-existing nodes for this construct). Every member beyond the base
 * `DataManagerContext` is OPTIONAL — not because they are ever genuinely
 * absent once `loading` completes, but because the shared `dataManagerMachine`
 * is fixed to `DataManagerContext` (`createMachine<DataManagerContext>`,
 * `data-manager.machine.ts`), and a `withConfig(...)` action/guard/service
 * typed against a context with REQUIRED extra fields is not assignable to
 * one typed against the base — the exact reason the pre-conversion
 * `withConfig` call carried three `as any` casts. Optional keeps the pin to
 * `Parameters<typeof dataManagerMachine.withConfig>[0]` (NFR-4) real instead
 * of re-introducing the casts it exists to remove.
 */
export interface CompanyContext extends DataManagerContext<CompanyModel> {
  /** The client's own addresses. */
  addresses?: Address[];
  /** The client's own emails. */
  emails?: Email[];
  /** The client's own phones. */
  phones?: Phone[];
  /** The currently selected country. */
  country?: ICountry;
  /** The regions available for the selected country. */
  regions?: IRegion[];
  /** All available countries. */
  countries?: ICountry[];
  /** `true` when the schema/uischema should render a reduced field set. */
  minimal?: boolean;
}

/**
 * The reactive list query, minted ONCE per scope in `useClientCompanies.ts`.
 * Aliased from the query platform's own `ListQuery` — never derived with
 * `ReturnType<typeof localServiceFn>` (NFR-5).
 *
 * The handle publishes `criteria` / `schema` / `isFiltered` / `criteriaError` /
 * `setCriteria` and no write-only setters, so every layer below reads THAT one
 * source and never a shadow copy (see graphify-out/ citation at the head of
 * this file).
 */
// (see graphify-out/ citation at the head of this file)
export type ClientCompanyListQuery = ListQuery<
  ICompany[],
  Company[],
  QueryModel
>;

/** Lands a failed collection mutation in the services instance's error state. */
export type ClientCompanyErrorCapture = (error: unknown) => void;

/**
 * The contract `createClientCompanyServices` resolves to — consumed by BOTH
 * halves, so the collection and the manager address the same client through
 * the same seam.
 */
export type ClientCompanyServices = {
  /** The module's base cache key; a save invalidates it and the list refetches. */
  queryKey: QueryKey;
  /**
   * The target client this scope resolved. The manager seeds its machine
   * context from here rather than re-reading the session.
   */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate in
   * `client-company.services` calls. The composable layers read THIS rather
   * than re-deriving the expression, so the flag a consumer renders and the
   * gate the wire enforces cannot drift apart.
   */
  isAvailable: ComputedRef<boolean>;
  /** The last failed collection mutation, captured as state — never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /**
   * The collection's list query. Takes NOTHING: the request state is the
   * declared query schema, handed to `list({ criteria })`, so there is no
   * params back door a caller could contradict it through (see graphify-out/
   * citation at the head of this file).
   */
  loadList: () => ClientCompanyListQuery;
  /** Per-company read; seeds the manager when no collection is loaded. */
  loadOne: (id?: ICompany["id"]) => Promise<Company | undefined>;
  add: (model: CompanyModel) => Promise<ICompany | undefined>;
  update: (
    id: ICompany["id"],
    model: CompanyModel
  ) => Promise<ICompany | undefined>;
  /** Find-or-create; backs both the collection action and the machine's `add`. */
  ensure: (model: CompanyModel) => Promise<Company>;
  remove: (id: ICompany["id"]) => Promise<void>;
  setDefault: (id: ICompany["id"]) => Promise<ICompany | undefined>;
  /** Schema validation; rejects with the AJV errors as the error's `data`. */
  validate: (model?: CompanyModel) => Promise<CompanyModel | undefined>;
  /** Invalidates {@link ClientCompanyServices.queryKey} so the collection refetches. */
  refresh: () => Promise<void>;
  /** Form-editor support, consumed only through the machine config. */
  loadLookups: (context: CompanyContext) => Promise<Partial<CompanyContext>>;
  parse: (
    context: CompanyContext,
    event: AnyEventObject
  ) => Promise<Partial<CompanyContext>>;
};

/**
 * The XState services map handed to `dataManagerMachine.withConfig({ services })`.
 * One key per `invoke.src` the shared machine names — an omitted key crashes on
 * entering its state rather than failing to compile, so read
 * `data-manager/data-manager.machine.ts` before trimming this list.
 */
export type ClientCompanyManagerMachineServices = {
  /** `loading` — the context patch the form starts from. */
  loadLookups: (context: CompanyContext) => Promise<Partial<CompanyContext>>;
  /** `available.checking.parsing` — schema-parses the incoming model. */
  parse: (
    context: CompanyContext,
    event: AnyEventObject
  ) => Promise<Partial<CompanyContext>>;
  /** `available.checking.validating` and `processing.validating`. */
  validate: (context: CompanyContext) => Promise<CompanyModel | undefined>;
  /** `processing.adding` — reached when the machine's `isNew` guard passes. */
  add: (context: CompanyContext) => Promise<Company>;
  /** `processing.updating` — reached when context already carries an id. */
  update: (context: CompanyContext) => Promise<ICompany | undefined>;
};
