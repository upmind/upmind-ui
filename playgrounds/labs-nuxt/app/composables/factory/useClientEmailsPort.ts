// -----------------------------------------------------------------------------
/**
 * @module factory/useClientEmailsPort
 * @description The canary's port call site (Task 38): boots the real
 * `useClientEmails` collection at its declared scope, builds the
 * `ControlledTableChannel` over THAT SAME live cell, and hands the channel to
 * `useCompositionPort` — which is how `port.table` becomes the channel the
 * caller supplied rather than something the adapter fabricated
 * (`useCompositionPort.types.ts`: "never fabricated by the adapter"). A module
 * that owns no table state simply calls `useCompositionPort(cell)` and its
 * `port.table` stays `undefined`.
 *
 * This is also the compile-time bridge `client-email.types.ts` names: the live
 * cell is consumed as a `TableChannelCell`, whose `sortBy` takes the
 * harness-frozen `TableModel["sort"]` member, so a drift between the module's
 * own structurally-declared `SortEntry` and the harness shape fails to compile
 * HERE — the one place both types meet.
 *
 * `.as('self')` is a compile error on `CLIENT_EMAILS_SCOPE_MATRIX`: the
 * collection resolves for `client` only, acting either as itself or, given a
 * client id, on behalf of another client.
 */

import {
  ClientEmailsContextTypes,
  ScopeActorTypes,
  useClientEmails
} from "@upmind-automation/headless";
import { useCompositionPort } from "./useCompositionPort";
import { useTableChannel } from "./useTableChannel";
import type { CompositionPort } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** How the canary collection is booted. */
export type ClientEmailsPortOptions = {
  /**
   * The client whose collection is addressed. Absent, the actor's own
   * collection is booted (`client × self`).
   */
  clientId?: string;
};

/**
 * The live client-email collection cell, already scoped.
 *
 * @param options Scope wiring — `clientId` to act on behalf of another client.
 */
export function useClientEmailsCell(options: ClientEmailsPortOptions = {}) {
  const collection = useClientEmails().as(ScopeActorTypes.CLIENT);

  return options.clientId
    ? collection.for(ClientEmailsContextTypes.CLIENT, options.clientId)
    : collection;
}

// Type export for consumers
export type ClientEmailsCell = ReturnType<typeof useClientEmailsCell>;

/**
 * Builds the `CompositionPort` for the live client-email collection, table
 * channel wired.
 *
 * @param options Scope wiring — `clientId` to act on behalf of another client.
 */
export function useClientEmailsPort(
  options: ClientEmailsPortOptions = {}
): CompositionPort {
  const cell = useClientEmailsCell(options);

  return useCompositionPort(cell, { table: useTableChannel(cell) });
}
