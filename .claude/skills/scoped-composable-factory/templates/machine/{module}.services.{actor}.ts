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
 * `.claude/skills/scoped-composable-factory/templates/ARMS.md` for the full when/how decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * MACHINE ↔ QUERY SYMMETRY — this file's two worked members (`registerAsGuest`
 * exclusive, `register` overriding) are the SAME conceptual pair as
 * `templates/query/module.services.{actor}.ts`'s own, each expressed through
 * its own variant's mechanism (a machine service here; a directly-callable
 * async function there) — not two unrelated examples.
 */

import type { ModuleContext } from "./module.types";
import { mapModuleRequestData } from "./module.mappers";
import type { ModuleServices } from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.services.client
 * @description Client-specific module services — populated ONLY when this
 * module has earned a services arm (clause 3). Shared services stay in
 * `module.services.ts`.
 *
 * WARNING: Do not import directly. Use via the module's machine only — same
 * warning as `auth/auth.services.client.ts`'s own top-of-file note.
 */

/**
 * EXCLUSIVE MEMBER worked example — a capability only this actor has, absent
 * from the shared factory entirely (no override, nothing to justify with a
 * decision-record comment — there is no shared key to duplicate).
 *
 * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
 * Sub-Composables") — "members exclusive to it".
 * @worked-example `auth/auth.services.client.ts:204-252`'s `registerAsGuest`
 * — implemented ONLY on the client services arm; absent from
 * `auth/auth.services.staff.ts` and `auth/auth.services.guest.ts` entirely.
 * The resulting arm-only capability is exposed as
 * `AuthServices.registerAsGuest?` (optional — `auth/auth.types.ts:236-243`)
 * and asserted with `!` at the shared dispatcher
 * (`auth/auth.services.ts:234-235`) — see this repo's own "Union-health
 * receipt" (`code-composables.companion.md` "Variance law"). Same exclusive
 * member the actions-layer arm illustrates (`useModule.actions.{actor}.ts`'s
 * own `registerAsGuest`) — that action is the domain mutation that drives
 * this wire call.
 */
async function registerAsGuest(
  _context: ModuleContext,
  _event: AnyEventObject
): Promise<unknown> {
  // Replace with the client-only request this module's parity table names.
  return Promise.resolve(undefined);
}

/**
 * OVERRIDING MEMBER worked example — same key (`register`) as the shared
 * factory's dispatch surface (`module.services.ts`'s own `moduleServices`,
 * whose dispatcher asserts `register!` because the contract types it optional
 * until an arm supplies it); this arm supplies the actor-specific
 * implementation the shared `scopedServices()` matrix routes to.
 *
 * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
 * Sub-Composables") — "overriding the shared implementation".
 * @worked-example `auth/auth.services.client.ts:152-187`'s `register` (POST
 * `clients/register`) — every armed auth actor diverges completely:
 * `auth/auth.services.staff.ts:130-144` posts `org/register` instead, and
 * `auth/auth.services.guest.ts:72-81` throws `Forbidden` outright (guests
 * cannot self-register). `auth/auth.services.ts:209-213` is the dispatch
 * wrapper that routes to whichever arm is active. This is the concrete,
 * real-codebase instance of `code-services.companion.md`'s own verbatim
 * "Staff example" (client-vs-staff registration illustration) — honestly
 * noted here since the real divergence is client/staff-allowed-differently
 * vs guest-forbidden, not client-vs-staff-forbidden as that illustrative
 * snippet shows.
 * @decision
 * what: `register` is named identically to the key
 *   `module.services.ts`'s own `scopedServices()` switch dispatches — a
 *   same-named override, not an exclusive member.
 * why: client registration needs its own endpoint / payload shape
 *   (`code-services.md`'s actor-split decision) — the shared file has no
 *   default implementation to fall back to once armed, only the dispatch
 *   wrapper.
 * rejected: a single shared `register` with an internal actor branch —
 *   rejected per `code-services.md`'s "different business logic → always
 *   split" rule (the client-vs-staff registration worked example there is
 *   this exact member) and per clause 4 (no runtime actor branch inside a
 *   shared factory).
 */
async function register(
  context: ModuleContext,
  _event: AnyEventObject
): Promise<unknown> {
  // THE DIVERGENCE, part 2: the payload mapper. This arm posts as the client,
  // so the shared `mapModuleRequestData` is correct here. A staff arm posts to
  // the CLIENT surface, which expects an extra acting-as envelope, and maps with
  // `mapClientModuleRequestData` instead (`module.mappers.ts`) — the payload
  // shape differs, so the mapper must too. Mappers are NOT arm-scoped: they are
  // pure functions in the shared util file, and the per-actor choice is this
  // call site (see `.claude/skills/scoped-composable-factory/templates/ARMS.md`'s "Which files can earn an arm" test).
  const data = mapModuleRequestData(context.model ?? {});
  // Replace with the client registration request this module's parity table names.
  return Promise.resolve(data);
}

// -----------------------------------------------------------------------------
// Factory Export

/**
 * Creates client-specific module services. Shared services stay in
 * `module.services.ts`.
 * @worked-example `auth/auth.services.client.ts`'s `createClientAuthServices`.
 */
export function createClientModuleServices(): Partial<ModuleServices> {
  return {
    register,
    registerAsGuest
  };
}

export type ClientModuleServices = ReturnType<
  typeof createClientModuleServices
>;
