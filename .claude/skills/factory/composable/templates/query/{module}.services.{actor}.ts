/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-services.md` (service-authoring, actor-split
 * decision) + `code-composables.companion.md` "Variance law" clauses 2/3/4/5.
 * A disagreement between this skeleton, its worked example, and the doctrine
 * is a surfaced finding, never silently resolved toward either.
 *
 * USE THIS FILE ONLY WHEN CLAUSE 3 TRIGGERS: at least one service member is
 * exclusive to the `client` actor, or overrides the shared implementation in
 * `module.services.ts` — never as an empty scaffold (clause 2,
 * `code-composables.companion.md` "Variance law"). Otherwise DELETE this
 * file; the armless shared factory in `module.services.ts` suffices. See
 * `.claude/skills/factory/composable/templates/ARMS.md` for the full when/how decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * NO LIVE QUERY-VARIANT PRECEDENT EXISTS for this layer (no TanStack-backed
 * module in this codebase has earned a services arm — `client-email/` is
 * armless throughout). THREE worked members below: `registerAsGuest`
 * (exclusive to this arm), `register` (arm-supplied — the shared query factory
 * declares none, so it reaches callers via the `...scopedServices(scopeActor)`
 * spread), and `loadList` (overriding a member the shared query factory DOES
 * declare). `registerAsGuest` / `register` are the same conceptual pair as
 * `templates/machine/module.services.{actor}.ts`; `loadList` is a query-only
 * override with no machine counterpart — so the two variants are NOT
 * member-for-member symmetric here. Each is expressed as a directly-callable
 * query-service function (no machine); the citations below are cross-variant,
 * borrowed honestly from the machine variant's `auth/`, per
 * `code-composables.md` Part B "Actor-Specific Sub-Composables" applying
 * per-layer, XState or Query.
 */

import { computed } from "vue";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { mapClientModuleItems } from "./module.mappers";
import { ModuleContextTypes } from "./module.types";
import { useTime, DEBOUNCE_DELAY } from "../../utils";
import { queryKey } from "./module.services";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  ClientModuleItem,
  ClientModuleWireItem,
  ModuleServices
} from "./module.types";

// -----------------------------------------------------------------------------
/**
 * @module module/module.services.client
 * @description Client-specific module services — populated ONLY when this
 * module has earned a services arm (clause 3). Shared services stay in
 * `module.services.ts`.
 */

/**
 * EXCLUSIVE MEMBER worked example — a capability only this actor has, absent
 * from the shared factory entirely (no override, nothing to justify with a
 * decision-record comment — there is no shared key to duplicate).
 *
 * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
 * Sub-Composables") — "members exclusive to it".
 * @worked-example (cross-variant) `auth/auth.services.client.ts:204-252`'s
 * `registerAsGuest` — implemented ONLY on the client services arm; absent
 * from `auth/auth.services.staff.ts` and `auth/auth.services.guest.ts`
 * entirely. Same exclusive member the actions-layer arm illustrates
 * (`useModule.actions.{actor}.ts`'s own `registerAsGuest`) — this service is
 * the wire call that action drives.
 */
function registerAsGuest(): Promise<unknown> {
  const { post, useUrl } = useQuery();
  // Replace with the client-only request this module's parity table names.
  return post({
    url: useUrl("module-items/register-guest"),
    withAccessToken: true
  });
}

/**
 * OVERRIDING MEMBER worked example — same key (`loadList`) as the shared
 * factory, and the clearest per-actor divergence this layer has: the SAME
 * collection from the SAME endpoint under the SAME auth scope, but this actor
 * asks for extra related fields, so the response shape — and the mapper that
 * reads it and the cache key that stores it — differ.
 *
 * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
 * Sub-Composables") — "overriding the shared implementation".
 * @doctrine `code-services.md` — a differing response shape per actor is a
 * canonical split case.
 * @decision
 * what: this arm asks the list endpoint for the extra `with` includes below,
 *   maps the richer response with `mapClientModuleItems`, and caches it under
 *   the base key extended by those includes. The shared read asks for none of
 *   them and maps with `mapModuleItems`.
 * why: what this actor needs from the response differs, so the includes and the
 *   mapper differ with it. One shared implementation cannot express both without
 *   branching on actor inside the shared file (clause 4 violation), and every
 *   include it added for one actor would cost the server a join for all of them.
 * rejected: keeping a single shared `loadList` and passing the actor as a
 *   parameter — rejected per clause 4; the actor is resolved by the scope
 *   builder before this factory is ever constructed, so the arm IS the branch.
 */
function loadList(
  params: Partial<QueryParams<ClientModuleWireItem[], ClientModuleItem[]>> = {
    pagination: { limit: 0 }
  },
  scopeContext?: ScopeContext
) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { list, useUrl } = useQuery();

  // Same context resolution as the shared read (`module.services.ts`) — an arm
  // that drops it un-targets `.for('client', id)` for its own actor only.
  const clientId = computed(() =>
    scopeContext?.type === ModuleContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );

  // THE DIVERGENCE — the `with` includes. Same endpoint as the shared factory,
  // but this arm asks the API for related fields a plain client read has no use
  // for. Every include costs the server a join and the client bytes, so the
  // shared default stays lean and the arm that needs more asks for more. Named
  // once because the URL and the cache key below must not drift apart.
  const includes = ["internal_notes", "flagged_by"];

  return list<ClientModuleWireItem[], ClientModuleItem[]>({
    ...params,
    // EXTENDS the shared base key — never a parallel one (`module.services.ts`'s
    // own note). What it appends is the includes, not the reader: `list()` caches
    // the MAPPED result, so this arm's richer rows and the shared lean rows must
    // not land on one entry. Keying by READER would fragment the cache per actor
    // and defeat it.
    queryKey: [...queryKey, { client: clientId.value }, { with: includes }],
    // @worked-example `client-address/client-address.services.ts:50` — same
    // `useUrl(endpoint, { with: [...].join() })` shape.
    url: useUrl(`clients/${clientId.value}/module-items`, {
      with: includes.join()
    }),
    withAccessToken: true,
    // THE DIVERGENCE, part 2 — the mapper, because DIVERGENCE 1 changed the response
    // shape. The extra includes come back as extra wire fields, so this arm
    // maps with `mapClientModuleItems` (`module.mappers.ts`) against
    // `ClientModuleWireItem`. Schema and mapper move together — asking for
    // fields you do not map is wasted bytes; mapping fields you did not ask
    // for is undefined.
    //
    // Mappers are NOT arm-scoped: they are pure functions in the shared util
    // file, and the per-actor choice is this call site.
    select: mapClientModuleItems,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAuthenticated.value && !!clientId.value
  });
}

/**
 * ARM-SUPPLIED MEMBER worked example — the shared factory declares no
 * `register`, which is why the contract types it `ModuleServices.register?`:
 * it reaches a caller only through `createModuleServices`'s
 * `...scopedServices(scopeActor)` spread, once an arm supplies it.
 *
 * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
 * Sub-Composables") — "overriding the shared implementation".
 * @worked-example (cross-variant) `auth/auth.services.client.ts:152-187`'s
 * `register` (POST `clients/register`) — every armed auth actor diverges
 * completely: `auth/auth.services.staff.ts:130-144` posts `org/register`
 * instead, and `auth/auth.services.guest.ts:72-81` throws `Forbidden`
 * outright. `auth/auth.services.ts:209-213` is the dispatch wrapper that
 * routes to whichever arm is active. This is the concrete, real-codebase
 * instance of `code-services.companion.md`'s own verbatim "Staff example"
 * (client-vs-staff registration illustration).
 * @decision
 * what: `register` is an ARM-SUPPLIED member — the shared query
 *   `module.services.ts` declares no `register` of its own, so this arm's
 *   implementation reaches callers through `createModuleServices`'s
 *   `...scopedServices(scopeActor)` spread. (It is NOT dispatched by a shared
 *   `scopedServices()` switch — that is the machine variant's mechanism, not
 *   this one.)
 * why: client registration needs its own endpoint / payload shape
 *   (`code-services.md`'s actor-split decision) — the shared file declares no
 *   `register` of its own, so this arm's reaches a caller through
 *   `createModuleServices`'s `...scopedServices(scopeActor)` spread. The
 *   machine variant routes the same member through a `register!` dispatcher
 *   instead, having no construction-time spread.
 * rejected: a single shared `register` with an internal actor branch —
 *   rejected per `code-services.md`'s "different business logic → always
 *   split" rule (the client-vs-staff registration worked example there is
 *   this exact member) and per clause 4 (no runtime actor branch inside a
 *   shared factory).
 */
function register(model: Record<string, unknown>): Promise<unknown> {
  const { post, useUrl } = useQuery();
  // Replace with the client registration request this module's parity table names.
  return post({
    url: useUrl("module-items/register"),
    data: model,
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------
// Factory Export

/**
 * Creates client-specific module services. Shared services stay in
 * `module.services.ts`.
 */
export function createClientModuleServices(
  scopeContext?: ScopeContext
): Partial<ModuleServices> {
  return {
    loadList: params => loadList(params, scopeContext),
    register,
    registerAsGuest
  };
}

export type ClientModuleServices = ReturnType<
  typeof createClientModuleServices
>;
