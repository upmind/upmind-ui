import { effectScope, ref, watch } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import { createScopedComposable } from "../scope";
import { useSessionStore, useActiveSession } from "../session-store";
import { loadSelfAccount } from "./affiliate.services";
import { createAffiliateActiveAccountActions } from "./useAffiliateActiveAccount.actions";
import { createAffiliateActiveAccountContext } from "./useAffiliateActiveAccount.context";
import { createAffiliateActiveAccountInternals } from "./useAffiliateActiveAccount.internals";
import { createAffiliateActiveAccountMeta } from "./useAffiliateActiveAccount.meta";
import { mapToHeadlessError } from "../../utils";
import { some, map } from "lodash-es";
import type {
  AffiliateActiveAccountState,
  AffiliateScopeMatrix
} from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { Account } from "../client";
import type { ScopeConfig } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateActiveAccount
 * @description The affiliate active-account source (design.md §8.4,
 * operator ruling R-NO-SWITCH). A plain composable with module-scope shared
 * state, not a machine — operator ruling R-RESOLVER declares this departure
 * from the ADR-005 rule of thumb. Resolves the client's OWN account: the
 * `/self` `account_id` when present, else the client's only account. No
 * switch, no stored choice, no chooser — keyed on the CLIENT session actor
 * (not the scope actor a consumer opens the source with).
 */
// -----------------------------------------------------------------------------
// Module-scope shared state — created ONCE at module load. `destroy()` (in
// `.internals`, test-only) resets these in place; it never replaces a ref.

const state = ref<AffiliateActiveAccountState>(
  typeof window === "undefined" ? "inert" : "loading"
);
const activeAccountId = ref<string | undefined>(undefined);
const error = ref<ResponseError | undefined>(undefined);

let scope: ReturnType<typeof effectScope> | undefined;
let unsubscribeLogout: (() => void) | undefined;
let started = false;
let resolutionGeneration = 0;

function resetSharedState(): void {
  state.value = typeof window === "undefined" ? "inert" : "loading";
  activeAccountId.value = undefined;
  error.value = undefined;
}

/**
 * The account source: the `/self` `account_id` when it names one of the
 * client's own accounts, else the client's only account. A client with two
 * or more accounts and no matching `/self.account_id` resolves no account —
 * there is no chooser (R-NO-SWITCH).
 */
async function resolveAccountId(
  accounts: Account[]
): Promise<string | undefined> {
  try {
    const self = await loadSelfAccount();
    if (self?.account_id && some(accounts, a => a.id === self.account_id)) {
      return self.account_id;
    }
  } catch (err) {
    error.value = mapToHeadlessError(err);
  }
  return accounts.length === 1 ? accounts[0].id : undefined;
}

function bootstrap(): void {
  if (typeof window === "undefined") {
    state.value = "inert";
    return;
  }
  if (started) return;
  started = true;

  scope = effectScope(true);
  scope.run(() => {
    const session = useActiveSession().useContext();
    const store = useSessionStore();

    /**
     * @decision a generation counter discards a stale run's result.
     * what: each call claims the NEXT generation before awaiting anything;
     *      every write after an `await` checks it still holds the latest
     *      generation, and returns without writing otherwise.
     * why: `runResolution` fires from 4 independent triggers (logout, the
     *      actor/session watch, the accounts watch, the first `isReady()`)
     *      and awaits a network read (`resolveAccountId`). A logout
     *      mid-flight followed by a new login can let the OLDER run's read
     *      resolve after the NEWER run's, publishing a stale account id
     *      under the new session.
     * rejected: an `AbortController` per run — `loadSelfAccount` is a shared
     *      service call with no signal parameter; adding one here would
     *      widen `affiliate.services.ts` beyond this module's own race fix.
     */
    async function runResolution(): Promise<void> {
      const generation = ++resolutionGeneration;
      await store.useActions().isReady();
      if (generation !== resolutionGeneration) return;

      if (session.actor.value !== AccessRoleTypes.CLIENT) {
        activeAccountId.value = undefined;
        state.value = "ready";
        return;
      }

      // Clear before re-resolving — no id of a previous session or a
      // previous accounts list stays published while resolution is in
      // flight (design.md §8.4): a collection keyed on `activeAccountId`
      // must never keep serving rows for an id this read is about to
      // replace.
      activeAccountId.value = undefined;
      error.value = undefined;
      state.value = "loading";

      const accounts = session.activeUser.value?.accounts ?? [];
      const resolvedId = await resolveAccountId(accounts);
      if (generation !== resolutionGeneration) return;

      activeAccountId.value = resolvedId;
      state.value = "ready";
    }

    unsubscribeLogout = store.useActions().onLogout(actor => {
      if (actor !== AccessRoleTypes.CLIENT) return;
      resetSharedState();
      void runResolution();
    });

    watch(
      () => [session.actor.value, session.sessionId.value] as const,
      () => void runResolution()
    );

    watch(
      () => map(session.activeUser.value?.accounts ?? [], a => a.id).join(","),
      () => void runResolution()
    );

    void store
      .useActions()
      .isReady()
      .then(() => void runResolution());
  });
}

function isTerminalResolverState(value: AffiliateActiveAccountState): boolean {
  return value === "inert" || value === "ready";
}

/**
 * @decision the terminal check runs BEFORE the watcher subscribes, never
 * inside an `{ immediate: true }` callback (F-2).
 * what: a synchronous `isTerminalResolverState(state.value)` guard returns
 *      early; the watcher (no `immediate`) then only ever fires on a FUTURE
 *      change.
 * why: `state` is module-scope shared singleton state, so a later
 *      `isReady()` call — a second consumer, or a second call in the same
 *      test — can land after an earlier call already carried `state` to a
 *      terminal value. `{ immediate: true }` invokes its callback
 *      SYNCHRONOUSLY, before `watch()` returns, so `const stop = watch(...)`
 *      has not finished assigning; calling `stop()` from inside that first
 *      synchronous invocation throws a reference error.
 * rejected: `let stop: () => void` declared ahead of the `watch()` call — the
 *      synchronous first invocation would still call `stop()` before it
 *      holds a real function.
 */
async function isReady(): Promise<boolean> {
  bootstrap();
  if (isTerminalResolverState(state.value)) return true;

  return new Promise(resolve => {
    const stop = watch(state, value => {
      if (isTerminalResolverState(value)) {
        stop();
        resolve(true);
      }
    });
  });
}

function destroy(): void {
  unsubscribeLogout?.();
  unsubscribeLogout = undefined;
  scope?.stop();
  scope = undefined;
  started = false;
  resetSharedState();
}

// -----------------------------------------------------------------------------

function createAffiliateActiveAccountForScope(config: ScopeConfig) {
  const actorScope = config.actor as ScopeActorTypes;
  bootstrap();

  return {
    // --- sub-composables
    useActions: () =>
      createAffiliateActiveAccountActions(actorScope, { isReady }),
    useContext: () =>
      createAffiliateActiveAccountContext(actorScope, {
        activeAccountId,
        error
      }),
    useInternals: () =>
      createAffiliateActiveAccountInternals(actorScope, { destroy }),
    useMeta: () =>
      createAffiliateActiveAccountMeta(actorScope, {
        error,
        state
      })
  };
}

/**
 * The affiliate active-account source. Publishes the client's own account id
 * every other affiliate call addresses (design.md §5.2, §8.4, R-NO-SWITCH).
 *
 * @example
 * ```ts
 * const source = useAffiliateActiveAccount().as('client');
 * await source.useActions().isReady();
 * const { activeAccountId } = source.useContext();
 * ```
 */
export const useAffiliateActiveAccount = createScopedComposable<
  ReturnType<typeof createAffiliateActiveAccountForScope>,
  AffiliateScopeMatrix
>("affiliate-active-account", createAffiliateActiveAccountForScope);

export type UseAffiliateActiveAccount = ReturnType<
  typeof useAffiliateActiveAccount
>;
