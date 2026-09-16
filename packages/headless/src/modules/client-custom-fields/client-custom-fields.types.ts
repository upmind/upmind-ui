/**
 * @graphify-citation grep -F over `graphify-out/graph.json` (2026-08-10, 10,057
 * nodes) for every name minted below — `ClientCustomFieldsContextTypes`,
 * `ClientCustomFieldContextTypes`, `CustomFieldImageContext`,
 * `ClientCustomFieldsServices`, `ClientCustomFieldImageServices`,
 * `ClientCustomFieldsListQuery`, `CustomFieldDisplay`,
 * `ClientCustomFieldsErrorCapture` — each **0 matches**; no duplicate to
 * consume. `graphify-out/GRAPH_REPORT.md` carries no coverage of this module.
 * The naming pattern consumed instead is `client-email`'s
 * (`ClientEmailsContextTypes` / `ClientEmailContextTypes`,
 * `ClientEmailServices`, `ClientEmailListQuery`,
 * `ClientEmailErrorCapture` — `client-email.types.ts`), per `design.md` §0/§2.2.
 * `CustomField` and `CustomFieldModel` **do** exist (this file's own prior
 * revision) and are widened in place, never re-minted in parallel.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/client-custom-fields.types
 * @description Types for a client's own custom field definitions and values —
 * the query-backed definitions collection (`useClientCustomFields`) and the
 * per-field IMAGE value editor (`useClientCustomFieldImage`, wrapping
 * `system-upload`). Each composable owns its own context enum and scope
 * matrix; the definition model, the services contract and the mappers are
 * shared, which is what keeps ONE identity seam for both halves.
 */
/**
 * @graphify-citation `graphify query "ClientCustomFieldsContextTypes
 * CustomFieldsMajorTypes catalogue selector context"` against
 * `graphify-out/graph.json` (2026-09-16) returns `ClientCustomFieldsContextTypes`
 * (this file, L55) and `CustomFieldsMajorTypes`
 * (`packages/types/src/data/enums/customFields.ts` L3) as EXISTING nodes, and no
 * catalogue-axis construct anywhere else in the tree. The catalogue members
 * added below WIDEN that existing enum with values consumed from
 * `CustomFieldsMajorTypes` — no type is minted. `ScopeContextPatterns` and
 * `SelectorContext` (`graphify-out/graph.json`, same query) are the scope
 * platform's own SELECTOR declaration types, consumed rather than re-derived.
 */
import {
  AccessRoleTypes,
  CustomFieldsMajorTypes
} from "@upmind-automation/types";
import { SortDirection } from "../query/query.types";
import { ScopeActorTypes, ScopeContextPatterns } from "../scope/scope.types";
// graphify-out/graph.json (2026-08-10): `useUpload`'s return type is consumed
// below (`ClientCustomFieldImageServices.uploader`), never re-minted.
import type { ResponseError } from "../../utils";
import type { ListQuery } from "../query";
import type { ScopeContext } from "../scope";
import type { useQuerySchema } from "./client-custom-fields.schemas";
import type { useUpload } from "../system-upload";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  CustomFieldsTypes,
  ICustomField,
  ImageObjectTypes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/**
 * Context types for the definitions COLLECTION — the two questions a scope may
 * answer about this module, in the two mutually exclusive patterns ADR-001's
 * 2026-09-15 amendment declares.
 *
 * WHICH CLIENT (RETARGET). `.for(CLIENT, id)` names the client being addressed;
 * with none, the seam falls back to the active session's own client. The member
 * and wire value match every sibling client module
 * (`ClientPhonesContextTypes.CLIENT` = `AccessRoleTypes.CLIENT`).
 *
 * WHICH CATALOGUE (SELECTOR). `.for(INVOICE)` / `.for(CANCEL_REQUEST)` name the
 * catalogue the loader reads; the type IS the whole answer, so an id is
 * forbidden. The CLIENT catalogue has no member of its own — it is the ABSENCE
 * of a selector, and `CustomFieldsMajorTypes.CLIENT` carries the same `"client"`
 * value the retarget member does.
 *
 * (`graphify-out/graph.json` — see this file's head citation; the enum is
 * widened, never re-minted.)
 */
export enum ClientCustomFieldsContextTypes {
  /** Acting on a client's own custom field value set. */
  CLIENT = AccessRoleTypes.CLIENT,
  /** Reading the INVOICE catalogue. */
  INVOICE = CustomFieldsMajorTypes.INVOICE,
  /** Reading the cancellation-request catalogue. */
  CANCEL_REQUEST = CustomFieldsMajorTypes.CANCEL_REQUEST
}

/**
 * Scope matrix for `useClientCustomFields`. `client` is the only actor that
 * resolves; `staff` and `guest` are `null as never`.
 *
 * WHAT THE TYPE SYSTEM ACTUALLY ENFORCES. `ScopeBuilderResult` accepts EVERY
 * `ScopeActorTypes` and reads the matrix row only to decide whether `.for()`
 * exists, so a `null as never` row removes `.for(...)` and nothing else:
 * `.as('staff')` and `.as('guest')` COMPILE, resolving to an instance with no
 * `.for()`, and are refused at RUNTIME — with no context to name a target,
 * `resolveClientId` falls back to the active session's own id and
 * `isAddressable` gates the request. The compile-time errors are
 * `.as('staff' | 'guest' | 'self').for(...)`, while `.as('client').for(...)`
 * type-checks. A designed boundary rather than an advertised-but-absent
 * capability. Same correction as `client-address.types.ts`, whose note carries
 * the `ts.createProgram` probe this rests on. (`graphify-out/graph.json` — the
 * `CLIENT` row is the retarget grant, not a new node.)
 *
 * THE CELL IS A LIST (`graphify-out/graph.json`, same citation). `client`
 * declares one RETARGET member and two SELECTOR members, so `.for(CLIENT, id)`
 * demands an id while `.for(INVOICE)` forbids one — `IdContextsForActor` and
 * `BareContextsForActor` split the overload off this one cell. The labs scope
 * bar reads the same cell through `resolveContextDeclarations`, so the
 * catalogue picker offers exactly what is declared here.
 *
 * @decision declare each SELECTOR member as a `SelectorContext` literal rather
 * than by calling the platform's `selector()` helper.
 * what:     `{ pattern: ScopeContextPatterns.SELECTOR, type }` written out, with
 *           `ScopeContextPatterns` imported from `scope/scope.types` — the same
 *           leaf module `ScopeActorTypes` (used for the keys below) comes from.
 *           The VALUE is byte-identical to `selector(type)`'s return, and
 *           `resolveContextDeclarations` reads it through the one platform path.
 * why:      `selector()` lives in `scope/scope.utils`, which imports
 *           `session-store`, and a matrix is evaluated at MODULE LOAD. Calling
 *           it here put a cross-module call on this file's evaluation path and
 *           re-entered `scope.utils` mid-initialisation through that chain —
 *           `ReferenceError: Cannot access '__vite_ssr_import_2__' before
 *           initialization` at `scope.utils.ts:29`, which took out 134 suites,
 *           including every consumer that merely imports this module's schemas.
 *           A type-only dependency cannot have that failure mode.
 * rejected: importing `selector` from the `../scope` barrel — the barrel pulls
 *           MORE of the cycle, not less. Moving `selector()` into
 *           `scope.types.ts` would fix it at the platform and is the better
 *           long-term shape, but that is a shared-core edit across 18+
 *           composables and is not this module's call to make — raised for the
 *           operator instead.
 */
export const CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: [
    ClientCustomFieldsContextTypes.CLIENT,
    {
      pattern: ScopeContextPatterns.SELECTOR,
      type: ClientCustomFieldsContextTypes.INVOICE
    },
    {
      pattern: ScopeContextPatterns.SELECTOR,
      type: ClientCustomFieldsContextTypes.CANCEL_REQUEST
    }
  ],
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientCustomFields` (derived from the runtime const). */
export type ClientCustomFieldsScopeMatrix =
  typeof CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX;

/**
 * Context types for the per-field IMAGE editor — WHICH field's image is
 * being edited. The context names the ENTITY (the field), not its owner: the
 * owning client falls through the same `resolveClientId` seam as every other
 * call.
 */
export enum ClientCustomFieldContextTypes {
  /** Editing one field's image value by field id. */
  FIELD = "field"
}

/**
 * Scope matrix for `useClientCustomFieldImage`. Separate from the
 * collection's — the two composables scope on different things and cannot
 * share one.
 */
export const CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientCustomFieldContextTypes.FIELD,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useClientCustomFieldImage` (derived from the runtime const). */
export type ClientCustomFieldImageScopeMatrix =
  typeof CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * A brand's custom field definition, at full `ICustomField` fidelity.
 *
 * graphify-out/graph.json (2026-08-10): `typeId` — 0 nodes, minted (an
 * additive member on this existing `CustomField` node, not a re-mint).
 *
 * @decision the per-type COERCION discriminator is the numeric
 * `typeId: CustomFieldsTypes` (oracle-specified for all 8 members —
 * `packages/types/src/data/enums/customFields.ts`, and what legacy's own
 * switches key on), never the wire's `type_code` string.
 * what:    `typeId` is a NEW, additive field carrying `raw.type` (numeric).
 *          `type` (the wire's `type_code` string) is UNCHANGED — kept as a
 *          passthrough for display/debug only, never a branch discriminator.
 *          `mapCustomFieldValue`/`mapCustomFieldDisplay` switch on `typeId`.
 * why:     the previous draft keyed the coercion table on `type_code`
 *          STRINGS, only 2 of 8 of which were oracle-confirmed (`"number"`,
 *          `"image"` — `auth/__tests__/fixtures/get-clients-fields.json`);
 *          the other 6 were guessed by naming-convention inference. A wrong
 *          guess is a self-sealing fabrication risk (`verify-cosplay.companion.md`,
 *          the 2026-08-05 receipt): the prover writes fixtures/assertions
 *          from THIS contract, so a wrong guess ships a green suite
 *          certifying a contract no real system exhibits. `typeId` removes
 *          the guess entirely — the numeric enum is 8/8 oracle-specified.
 * rejected: renaming `type` itself to the numeric enum (with `type_code`
 *          renamed to a `typeCode` passthrough) — checked and REJECTED: it
 *          ripples into `basket-fields`/`auth`, both out of scope (R4).
 *          `mapCustomField` is called directly by
 *          `basket-fields.services.ts:3,34`, and the result flows into the
 *          SHARED `useFieldsSchemaParser`/`useFieldsUischemaParser`
 *          (`utils/useFields.ts`) from BOTH `auth/auth.schemas.register.ts:87,180`
 *          and `basket-fields/basket-fields.utils.ts:22,43`. Those parsers'
 *          switches key on `field.type` matching `type_code` STRING literals
 *          — `useFields.ts:38` (`"number"`), `:49` (`"date"`), `:61`
 *          (`"password"`), and critically `:168` (`"image"`, which emits the
 *          `options.field` payload `system-upload` needs). Making `type`
 *          numeric would silently break all four for every NUMBER/DATE/
 *          PASSWORD/IMAGE-typed basket or registration field — exactly the
 *          regression R4 exists to prevent — and fixing `useFields.ts` to
 *          read the new numeric value is itself out of scope. The additive
 *          `typeId` gets the oracle-verified discriminator with zero ripple.
 */
export type CustomField = {
  /** The definition's id. */
  id: ICustomField["id"];
  /** The definition's code — the key `CustomFieldModel` and the request body use. */
  code: ICustomField["code"];
  /** Display name (translated when available). */
  name: string;
  /**
   * The wire's `type_code` (e.g. `"text"`, `"number"`, `"image"`) —
   * display/debug passthrough ONLY; never a branch discriminator (see
   * `typeId`).
   */
  type: ICustomField["type_code"];
  /** The oracle-specified numeric type — the per-type coercion discriminator. */
  typeId: CustomFieldsTypes;
  /** Select/radio options, when the field offers a fixed choice set. */
  options?: ICustomField["values"];
  /** Display order — the collection sorts and is sorted by this. */
  order: ICustomField["order"];
  meta: {
    /** Whether a value is required for this field. */
    isRequired: ICustomField["required"];
    /** Whether the CLIENT actor may not change this field's value. */
    isReadOnly: ICustomField["client_readonly"];
    // graphify-out/graph.json (2026-08-10): doc-comment-only correction, no
    // new type/enum minted — `CustomField.meta` (this object) already exists.
    /**
     * Whether the field is disabled for input — derived from
     * `client_readonly`, matching legacy's `isReadOnly(field)`
     * (`customFields.vue:273-275`) for this run's `client x self` scope. See
     * `mapCustomField`'s own `@decision`; never derived from `editable`.
     */
    isDisabled: boolean;
    /** Whether the field is hidden from the client-facing form. */
    isHidden: ICustomField["hidden"];
    /** Whether the field is for internal/user-only visibility. */
    isUserOnly: ICustomField["user_only"];
    /**
     * The raw `editable` wire flag — a factual passthrough only. No gate in
     * this module derives from it (see `mapCustomField`'s own `@decision`).
     */
    isEditable: ICustomField["editable"];
    /** Whether the field appears on the order form. */
    showOnOrderForm: ICustomField["show_on_order_form"];
    /** Whether the field appears on invoices. */
    showOnInvoice: ICustomField["show_on_invoice"];
    /** Where else this field is surfaced (invoice / order form). */
    displayContexts: ICustomField["display_contexts"];
  };
};

/**
 * The code-keyed value record — the S-1 request shape and the model's
 * `customFields` branch (seam A-2). Fills the pre-existing empty stub.
 */
export type CustomFieldModel = Record<CustomField["code"], unknown>;

/**
 * Read-only display projection for a single value (AC-17): a plain display
 * string, or an IMAGE's link + preview pair.
 */
export type CustomFieldDisplay =
  | string
  | undefined
  | { downloadUrl: string; preview: string };

/**
 * The field identity `useUpload` (system-upload) expects — exactly what
 * `useFieldsUischemaParser` already emits as an IMAGE control's
 * `options.field` (`utils/useFields.ts:167-175`), so the two already fit.
 */
export type CustomFieldImageContext = {
  field_id: CustomField["id"];
  field_type: ImageObjectTypes.CLIENT_CUSTOM_FIELD;
  field_is_default: boolean;
};

// -----------------------------------------------------------------------------
// QUERY MODEL
// -----------------------------------------------------------------------------
//
// @graphify-citation `graphify query "QueryModel FilterModel SortModel
// SortEntry CUSTOM_FIELD_DEFAULT_SORT"` (2026-08-22) — `graphify-out/graph.json`
// shows the only matches as `client-email.types.ts`'s own per-module
// `QueryModel`/`FilterModel`/`SortModel`/`SortEntry`; none exist in THIS
// module's `client-custom-fields.types.ts`. Each module mints its own
// query-model family (the established, repeated pattern), so this is not a
// duplicate to consume.

/** One declared ordering instruction. */
export type SortEntry = { field: "order" | "name"; dir: SortDirection };

/** What `sortBy` accepts — the schema's `sort` branch. */
export type SortModel = SortEntry[];

// @graphify-citation `graphify query "FilterModel CustomFieldsTypes required
// eq"` — `graphify-out/graph.json` shows the only other `FilterModel` as
// `client-company.types.ts`'s own per-module type; no existing `type`/`required`
// branch to consume. `CustomFieldsTypes` is already imported into this file for
// `CustomField.typeId`.

/**
 * What `filterBy` accepts — the schema's `filters` branch. Every branch here
 * already exists in `useQuerySchema()`; this is the model side catching up, so
 * a consumer can spell the type and required filters the control bar renders.
 */
export type FilterModel = {
  name?: { like?: string | null };
  type?: { eq?: CustomFieldsTypes | null };
  required?: { eq?: boolean | null };
};

/** The collection's whole request state, as one model. */
export type QueryModel = {
  filters?: FilterModel;
  sort?: SortModel;
  pagination?: { limit?: number; offset?: number };
};

/** The declared type of `useQuerySchema()`'s return. */
export type QuerySchema = ReturnType<typeof useQuerySchema>;

/**
 * The catalogue's natural sequence — the API's own display-order column,
 * ascending. This const IS the schema's `sort.default`; the two must not
 * drift, so the schema references this rather than repeating the literal.
 */
export const CUSTOM_FIELD_DEFAULT_SORT: SortModel = [
  { field: "order", dir: SortDirection.ASC }
];

/**
 * The reactive list query, minted ONCE per scope in `useClientCustomFields.ts`.
 * Aliased from the query platform's own `ListQuery` — never derived with
 * `ReturnType<typeof localServiceFn>`.
 */
export type ClientCustomFieldsListQuery = ListQuery<
  ICustomField[],
  CustomField[],
  QueryModel
>;

/** Lands a failed collection mutation in the services instance's error state. */
export type ClientCustomFieldsErrorCapture = (error: unknown) => void;

/**
 * The contract `createClientCustomFieldsServices` resolves to — consumed by
 * BOTH composables, so the collection and the image editor address the same
 * client through the same seam.
 */
export type ClientCustomFieldsServices = {
  /**
   * This scope's CATALOGUE-QUALIFIED cache key — the prefix `invalidate`,
   * `reset` and `refresh` scope onto, so pressing one never drops a sibling
   * catalogue's warm rows. (`graphify-out/graph.json` — the member's TYPE is
   * unchanged; only what it carries is narrower.)
   */
  queryKey: QueryKey;
  /** The target client this scope resolved. */
  clientId: ComputedRef<string | undefined>;
  /**
   * The reactive form of the ONE addressability predicate every request gate
   * in `client-custom-fields.services` calls.
   */
  isAvailable: ComputedRef<boolean>;
  /** The last failed mutation, captured as state — never raised. */
  error: ComputedRef<ResponseError | undefined>;
  // graphify-out/graph.json (2026-08-22): narrowed per the query-model citation
  // above — the dead raw `params` arm is now unspellable, not merely unused.
  loadList: (scopeContext?: ScopeContext) => ClientCustomFieldsListQuery;
  /** Resolves a single definition by id from the (awaited) collection. */
  resolveFieldById: (
    id?: CustomField["id"]
  ) => Promise<CustomField | undefined>;
  /**
   * Uploads a field's IMAGE value through `system-upload`, rewriting a bare
   * `image` error key to `custom_fields.<code>` (consumed by A-11).
   */
  uploadFieldImage: (
    file: File,
    field: CustomField
  ) => Promise<string | undefined>;
  /**
   * Resolves with every dirty (pending-upload) IMAGE value in `model`
   * replaced by its uploaded hash (seam A-11).
   */
  flushImages: (model?: CustomFieldModel) => Promise<CustomFieldModel>;
  /** Schema validation against this scope's own definitions. */
  validate: (
    model?: CustomFieldModel,
    fields?: CustomField[]
  ) => Promise<CustomFieldModel | undefined>;
  /**
   * Invalidates {@link ClientCustomFieldsServices.queryKey} so THIS
   * catalogue's collection refetches. (`graphify-out/graph.json` — unchanged
   * member, narrower scope.)
   */
  refresh: () => Promise<void>;
};

/**
 * The contract the per-field IMAGE editor's services resolve to.
 */
export type ClientCustomFieldImageServices = {
  /** The same addressability predicate the collection's services expose. */
  isAvailable: ComputedRef<boolean>;
  /** This scope's resolved field definition, once known. */
  field: ComputedRef<CustomField | undefined>;
  /** The last captured upload/load error, rewritten onto the field's code. */
  error: ComputedRef<ResponseError | undefined>;
  /** Uploads a new file for this field, returning the resulting hash. */
  upload: (file: File) => Promise<string | undefined>;
  /**
   * Settles `value` for this field: uploads it if it is a pending file,
   * loads it for preview/download if it is already a stored hash, and
   * returns the settled hash either way.
   */
  flush: (value?: unknown) => Promise<unknown>;
  /** Clears the field's stored value. */
  remove: () => void;
  /**
   * The persistent `system-upload` instance backing this field — the
   * per-instance state (`meta`, `src`, `file`, `errors`) the composable's
   * context/meta layers project directly. graphify-out/: consumed, not
   * re-minted (see the import above).
   */
  uploader: ReturnType<typeof useUpload>;
};
