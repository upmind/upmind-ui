// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-support-pin
 * @description Four-layer contract for the `client-support-pin` module
 * headless does not have yet (plan §3): the PIN a client reads out to support,
 * revealed on demand and regenerated on request. The brand gate
 * (`SUPPORT_PIN_ENABLED`) is config, not a module member. The PIN itself is
 * the wire `IClient.support_pin`.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the account
 * sidebar's support PIN panel (reveal / hide / generate new) and the profile
 * dropdown's reveal; gap-doc rows "4. Account → Sidebar" and "6. Auth and
 * shell".
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  ResponseError
} from "@upmind-automation/headless";
import type { IClient } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the PIN read — whose PIN is addressed. */
export const ClientSupportPinContextTypes = {
  /** Reading a client's own support PIN. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientSupportPinContextTypes =
  (typeof ClientSupportPinContextTypes)[keyof typeof ClientSupportPinContextTypes];

/**
 * Scope matrix for `useClientSupportPin`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_SUPPORT_PIN_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientSupportPinContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientSupportPin`. */
export type ClientSupportPinScopeMatrix =
  typeof CLIENT_SUPPORT_PIN_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// LAYERS — useClientSupportPin
// -----------------------------------------------------------------------------

/** PIN context — the revealed PIN and when it lapses. */
export type UseClientSupportPinContext = {
  /** The PIN, once revealed; the panel masks it until then. */
  pin: ComputedRef<IClient["support_pin"]>;
  /** When the current PIN stops being valid. */
  expiresAt: ComputedRef<IClient["support_pin_expiry_datetime"]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** PIN meta — one computed per state flag. */
export type UseClientSupportPinMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the PIN has been fetched. */
  isRevealed: ComputedRef<boolean>;
  /** True if this client holds no PIN. */
  isEmpty: ComputedRef<boolean>;
  /** True while a read or regeneration is in flight. */
  isLoading: ComputedRef<boolean>;
  /** True once the current PIN has lapsed. */
  isExpired: ComputedRef<boolean>;
};

/** PIN actions — reveal and regenerate, plus lifecycle. */
export type UseClientSupportPinActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the PIN can be read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the PIN from the server. */
  refresh: () => Promise<void>;
  /** Fetches and reveals the current PIN. */
  reveal: () => Promise<IClient["support_pin"]>;
  /** Issues a fresh PIN, resolving the new one. */
  regenerate: () => Promise<IClient["support_pin"]>;
};

/** PIN internals (debugging) — exempt from conformance. */
export type UseClientSupportPinInternals = ContractInternals;
