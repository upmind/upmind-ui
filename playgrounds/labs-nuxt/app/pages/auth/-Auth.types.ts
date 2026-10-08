/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-26) — queried
 * `auth gate choice` · `impersonate` · `scope chooser`: the only `AuthGateChoice`
 * node in the tree was this vocabulary's own former inline declaration in
 * `pages/auth/overlay.vue`, so there is nothing to consume and it is minted
 * once here. It cannot live beside the page: Nuxt scans `.ts` under `pages/`
 * as routes, so a types file there would mint `/auth/overlay.types`.
 */
// -----------------------------------------------------------------------------
/**
 * @module pages/auth/-Auth.types
 * @description Type definitions for the shared auth journey.
 */

import type {
  AuthContextTypes,
  AuthFlowTypes,
  ScopeActorTypes,
  ScopeContext
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/**
 * Guest Customer is a GATE choice, never an actor: it runs the client machine's
 * `registerAsGuest()` to mint a `guest_customer` grant, which stores a normal
 * client session — so it resolves to a CLIENT session, not to an actor the
 * chooser can bind a journey to.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-09-09) — queried
 * `auth gate choice guest customer register as guest`: the only `choice` /
 * `AuthGateChoice` node is this vocabulary's own declaration in
 * `pages/auth/overlay.vue`; no guest-customer gate-choice type exists to
 * consume, so it is minted here beside the choice it belongs to.
 */
export const AUTH_GATE_GUEST_CUSTOMER = "guest_customer";

/**
 * What the gate's chooser holds — the four ways in the gate offers. Client and
 * Staff run their journeys; Guest is a scope route-out that collects no session;
 * Guest Customer runs `registerAsGuest()` and continues as the new client
 * session (see `pages/auth/overlay.vue`).
 */
export type AuthGateChoice =
  | ScopeActorTypes.CLIENT
  | ScopeActorTypes.STAFF
  | ScopeActorTypes.GUEST
  | typeof AUTH_GATE_GUEST_CUSTOMER;

export type AuthProps = {
  /** The actor a session is collected for — the `/as/<actor>` segment's value. */
  actor: ScopeActorTypes;

  /** The context that actor acts for, when the url names one. */
  context?: ScopeContext<AuthContextTypes>;

  /**
   * Collect a session BESIDE the ones already held. Without it the composable
   * reads the live session of that scope and short-circuits to authenticated,
   * which is a journey that renders nothing.
   */
  fresh?: boolean;

  /**
   * Brand ID from URL for brand-scoped staff sessions (FE-2973).
   * Staff: applies .inBrand(brandId) on the auth composable.
   * Client/Guest: ignored (type-gated — client/guest builders don't expose it).
   * @see graphify-out/ for brand plumbing provenance
   */
  brandId?: string;

  /**
   * Show a cancel control in the action row that emits `cancel` — the host's
   * back-to-list (the gate). Default off, so the standalone page shows none.
   *
   * @graphify-citation `graphify-out/graph.json` (2026-09-09) — queried
   * `cancellable cancel prop form actions button emit`: no shared journey/form
   * `cancellable` prop type exists (only a portal test local and the form's own
   * `reset` action config), so this boolean is minted on this component's props.
   */
  cancellable?: boolean;

  /** The flow the journey opens on. Absent, it opens on login. */
  flow?: AuthFlowTypes;
};
