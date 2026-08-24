/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 10,057 nodes),
 * recorded verbatim in `design.md` §0 — `ProfileModel` / `ProfileContext`
 * (renamed from the colliding `FieldsModel`/`FieldsContext` — both also exist
 * at `basket-fields.types.ts:6,11`), `ClientPersonalDetailsServices`,
 * `ClientPersonalDetailsContextTypes`, `PERSONAL_DETAILS_SCOPE_MATRIX` — 0
 * nodes each, minted following the `client-email.types.ts` pattern.
 * `graphify-out/GRAPH_REPORT.md` has no coverage of this module.
 * `ProfileField` and `CustomField` are consumed unchanged.
 */
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/client-personal-details.types
 * @description Types for a client's own profile — the query-backed read half
 * (`usePersonalDetails`) and the `dataManagerMachine`-backed editor half
 * (`usePersonalDetailsManager`). Both composables share the SAME scope
 * matrix and context enum (design.md §3.2): the entity being addressed is
 * the profile, and a client has exactly one.
 */
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { CustomField, CustomFieldModel } from "../client-custom-fields";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type {
  DefaultError,
  QueryKey,
  useQuery as vueUseQuery
} from "@tanstack/vue-query";
import type { IClient, ICustomFieldValue } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
// SCOPE — ONE matrix, shared by both composables
// -----------------------------------------------------------------------------

/**
 * Context type for BOTH halves — WHICH profile is being read/edited. The
 * context names the ENTITY (the profile), not its owner: there is no
 * `client` context type here, so `.for('client', id)` does not exist —
 * see `docs/dropped-capabilities.md` for the staff-acting-for-a-client
 * retarget this drops, and its tracked disposition. (`graphify-out/graph.json`
 * — comment-only citation retarget, no new node; FE-3103 T4.)
 */
export enum ClientPersonalDetailsContextTypes {
  /** A client's own profile. Single-member — a client has exactly one. */
  PROFILE = "profile"
}

/**
 * Scope matrix shared by `usePersonalDetails` and `usePersonalDetailsManager`
 * (design.md §3.2 — a deliberate divergence from `client-email`'s two
 * matrices, since both composables here scope on the same entity). `client`
 * is the only actor that resolves; `staff` and `guest` are `null as never`,
 * which makes `.as('staff')` a compile-time error rather than an
 * advertised-but-absent capability.
 */
export const PERSONAL_DETAILS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ClientPersonalDetailsContextTypes.PROFILE,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type, shared by both composables (derived from the runtime const). */
export type PersonalDetailsScopeMatrix = typeof PERSONAL_DETAILS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * The client's profile as read off the wire — native fields plus the raw
 * embedded custom field values (each carrying its own definition, AC-16).
 * `mapProfile` produces this; `mapProfileFields` projects it for display.
 */
export type ProfileRecord = {
  id: IClient["id"];
  firstName?: string;
  lastName?: string;
  publicName?: string;
  /** The interface language id — an id, never the display name (AC-33). */
  language?: string;
  customFieldValues: ICustomFieldValue[];
};

/**
 * The form/request model for the profile editor. Was `FieldsModel` — renamed
 * to resolve its collision with `basket-fields.types.ts:6` (design.md §0).
 */
export type ProfileModel = {
  /**
   * `| null` on every native field (not just `string | undefined`): a
   * cleared field must survive as an explicit `null` through
   * `parse()`'s round-trip (AC-47) — `useModelParser`'s own final
   * compaction step drops an empty-string leaf as "not meaningful"
   * (`utils/isDeepEmpty.ts`), so `null` is the only representation of
   * "cleared" this model can carry past that step. (graphify-out/graph.json
   * — no separate node for this widening; it is the existing `ProfileModel`
   * node, not a new mint.)
   */
  firstName?: string | null;
  lastName?: string | null;
  publicName?: string | null;
  language?: string | null;
  customFields?: CustomFieldModel;
};

/**
 * The `PUT clients/{id}` body `mapIProfileFields` produces. NOT
 * `Partial<IClient>` — two asymmetries, both deliberate:
 * `IClient["custom_fields"]` describes the ENTITY's READ shape
 * (`ICustomFieldValue[]`), while the WRITE payload for that same key is the
 * S-1 code-keyed object (`CustomFieldModel`, R3) legacy actually sends; and
 * the four client-surface native keys accept `null` (AC-47) — a cleared
 * field survives `parse()`'s round-trip as `null`, never `""` (Blocker 1),
 * so the body that carries it must be typed to accept that.
 * `graphify-out/graph.json`: 0 nodes — minted because no existing
 * write-body type covers this asymmetry (see this file's own citation).
 */
export type ProfileUpdateBody = Omit<
  Partial<IClient>,
  | "custom_fields"
  | "firstname"
  | "lastname"
  | "public_name"
  | "interface_language_id"
  | "document_language_id"
> & {
  custom_fields?: CustomFieldModel;
  firstname?: string | null;
  lastname?: string | null;
  public_name?: string | null;
  interface_language_id?: string | null;
  document_language_id?: string | null;
};

/**
 * The manager's machine context — the shared machine's, over this form
 * model. Was `FieldsContext` — renamed to resolve its collision with
 * `basket-fields.types.ts:11` (design.md §0). `lookups.fields` /
 * `.filterFields` / `.languages` are read via the generic `lookups?: Record<string, any[]>`
 * DataManagerContext already declares — never widened here, matching
 * `EmailContext = DataManagerContext<EmailModel>`'s own precedent.
 */
export type ProfileContext = DataManagerContext<ProfileModel>;

/** One profile field projected for display — native or custom. */
export type ProfileField = {
  id: string;
  code: string;
  /**
   * The exact token `useActions().filterFields()` accepts for this row —
   * the module's own narrowing grammar (`firstName`, `customFields.<code>`),
   * published so a consumer never re-derives it. See graphify-out/ for the
   * consumer map.
   */
  fieldPath: string;
  title: string;
  value: unknown;
  meta: CustomField["meta"] & {
    isCustomField: boolean;
  };
};

/**
 * The reactive single-record read query, minted ONCE per scope in
 * `usePersonalDetails.ts`. No platform-level alias exists for a REACTIVE
 * single-object query — only {@link ListQuery} does, for paginated
 * collections (`query/query.types.ts`) — so this structurally mirrors
 * `useQuery().query()`'s own return cast rather than deriving with
 * `ReturnType<typeof loadProfile>`, for the same reason `ListQuery` itself
 * is a hand-typed alias and not that.
 */
export type ClientPersonalDetailsRecordQuery = ReturnType<
  typeof vueUseQuery<IClient, DefaultError, ProfileRecord>
> & {
  data: ComputedRef<ProfileRecord>;
};

/**
 * The contract `createClientPersonalDetailsServices` resolves to — consumed
 * by BOTH composables, so the read half and the editor half address the same
 * client through the same seam.
 */
export type ClientPersonalDetailsServices = {
  /** The module's base cache key prefix (the resolved id + record segment are appended at request/invalidation time). */
  queryKey: QueryKey;
  /** The target client this scope resolved. */
  clientId: ComputedRef<string | undefined>;
  /** The reactive form of the ONE addressability predicate every request gate calls. */
  isAvailable: ComputedRef<boolean>;
  /** The last failed mutation, captured as state — never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** The reactive profile read, minted once per scope. */
  loadProfile: () => ClientPersonalDetailsRecordQuery;
  /** One-shot profile read + A's definitions, floored to the schema-parsed base model. */
  loadLookups: (context: ProfileContext) => Promise<Partial<ProfileContext>>;
  /** Schema-parses a SET event's incoming data, dropping out-of-schema keys. */
  parse: (
    context: ProfileContext,
    data?: unknown
  ) => Promise<Partial<ProfileContext>>;
  /** Schema validation against this scope's own lookups. */
  validate: (context: ProfileContext) => Promise<ProfileModel | undefined>;
  /** Diff-only PUT of the model against its base. */
  update: (model: ProfileModel, baseModel?: ProfileModel) => Promise<IClient>;
  /** Invalidates this scope's own cache key so the read refetches. */
  refresh: () => Promise<void>;
};

/**
 * The XState services map handed to `dataManagerMachine.withConfig({ services })`.
 * One key per `invoke.src` the shared machine names — an omitted key crashes
 * on entering its state rather than failing to compile, so read
 * `data-manager/data-manager.machine.ts` before trimming this list.
 */
export type ClientPersonalDetailsManagerMachineServices = {
  /** `loading` — the context patch the form starts from. */
  loadLookups: (context: ProfileContext) => Promise<Partial<ProfileContext>>;
  /** `available.checking.parsing` — schema-parses whatever the SET event carried. */
  parse: (
    context: ProfileContext,
    event: AnyEventObject
  ) => Promise<Partial<ProfileContext>>;
  /** `available.checking.validating` and `processing.validating`. */
  validate: (context: ProfileContext) => Promise<ProfileModel | undefined>;
  /**
   * `processing.adding` — never reached: a client's profile always exists
   * once its id resolves, so the shared machine's `isNew` guard (`!id`)
   * never passes here. Present because the machine names this key on
   * `invoke.src`; an omitted key crashes rather than failing to compile.
   * (graphify-out/graph.json — see this file's own top-of-file citation.)
   */
  add: (context: ProfileContext) => Promise<ProfileModel>;
  /**
   * `processing.updating` — reached once the context carries the resolved
   * client id. Resolves with a `ProfileModel` (never the raw `IClient`) —
   * the machine's `setModel` re-parses this against `schema`/`baseModel` by
   * SCHEMA PROPERTY KEY (camelCase), so a raw wire response would parse to
   * all-null and blank the form immediately after a successful save.
   */
  update: (context: ProfileContext) => Promise<ProfileModel>;
};
