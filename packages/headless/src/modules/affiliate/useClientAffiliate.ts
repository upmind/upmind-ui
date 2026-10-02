import { computed, ref, watch } from "vue";
import { useBrand } from "../brand";
import { invalidateQueryByKey } from "../query";
import { createScopedComposable } from "../scope";
import { remove as removeFromRegistry } from "../scope/scope.registry";
import { ScopeActorTypes } from "../scope/scope.types";
import { useActiveSession } from "../session-store";
import {
  AFFILIATE_ACCOUNT_QUERY_KEY,
  AFFILIATE_BALANCE_QUERY_KEY,
  enrolAffiliate,
  loadAffiliateAccountQuery,
  loadAffiliateBalanceQuery,
  loadAreaSettings,
  loadGateSettings,
  loadSelfBrand,
  requestAffiliateWithdrawal
} from "./affiliate.services";
import { isClientScopeActor, referralOrigin } from "./affiliate.utils";
import { useAffiliateActiveAccount } from "./useAffiliateActiveAccount";
import { createClientAffiliateActions } from "./useClientAffiliate.actions";
import { createClientAffiliateContext } from "./useClientAffiliate.context";
import { createClientAffiliateInternals } from "./useClientAffiliate.internals";
import { createClientAffiliateMeta } from "./useClientAffiliate.meta";
import { mapToHeadlessError } from "../../utils";
import { isEmpty } from "lodash-es";
import type { AffiliateScopeMatrix } from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { IBrand, ISelf } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useClientAffiliate
 * @description The client's own affiliate account — the account read, the
 * balance, the programme gate and area settings, `enrol` and
 * `requestWithdrawal` (design.md §8.5). Follows `usePersonalDetails` (§4).
 *
 * The account and balance reads are `query()`-keyed on the active account id
 * (design.md §8.1 "two-reads" control, §8.11 "isEnrolled" control) — see
 * `affiliate.services.ts`'s `loadAffiliateAccountQuery`/`loadAffiliateBalanceQuery`
 * for the dedup/404 contract. The gate and area settings reads stay raw,
 * uncached fetches (D-11); they are not part of that dedup contract.
 */
// -----------------------------------------------------------------------------

function createClientAffiliateForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;
  const isClientActor = computed(() => isClientScopeActor(actorScope));

  const resolver = useAffiliateActiveAccount().as(ScopeActorTypes.CLIENT);
  const resolverContext = resolver.useContext();
  const resolverActions = resolver.useActions();

  const accountId = computed(() =>
    isClientActor.value ? resolverContext.activeAccountId.value : undefined
  );

  const { activeUser } = useActiveSession().useContext();
  const { brandId: brandSettingsBrandId } = useBrand();

  /** Area-settings `brand_id` (design.md §8.1/§237): session `brandId`, else `useBrand().brandId`. */
  const resolvedBrandId = computed(
    () => activeUser.value?.brandId ?? brandSettingsBrandId.value
  );

  const accountQuery = loadAffiliateAccountQuery(accountId);
  const balanceQuery = loadAffiliateBalanceQuery(accountId);

  const data = computed(() => accountQuery.data.value);
  const balances = computed(() => balanceQuery.data.value);

  const gateSettings = ref<Record<string, unknown>>({});
  const areaSettings = ref<Record<string, unknown>>({});
  const selfRecord = ref<ISelf | undefined>(undefined);

  const writeError = ref<ResponseError | undefined>(undefined);
  const isProcessing = ref(false);
  const settingsLoaded = ref(false);
  const settingsLoading = ref(false);

  async function loadSelfBrandIfNeeded(): Promise<void> {
    if (data.value?.account?.brand || selfRecord.value) return;
    // Silent on failure — the self read only ever backs a fallback (design.md §8.5).
    return loadSelfBrand().then(
      self => {
        selfRecord.value = self;
      },
      () => undefined
    );
  }

  let settingsGeneration = 0;

  async function loadSettings(): Promise<void> {
    const id = accountId.value;
    if (!id) return;

    const generation = ++settingsGeneration;
    settingsLoading.value = !settingsLoaded.value;

    const gate: Record<string, unknown> = await loadGateSettings().catch(
      () => ({})
    );
    const area: Record<string, unknown> = await loadAreaSettings(
      resolvedBrandId.value
    ).catch(() => ({}));

    if (generation !== settingsGeneration) return;

    gateSettings.value = gate;
    areaSettings.value = area;
    settingsLoaded.value = true;
    settingsLoading.value = false;

    void loadSelfBrandIfNeeded();
  }

  watch(
    accountId,
    id => {
      if (!id) return;
      settingsLoaded.value = false;
      void loadSettings();
    },
    { immediate: true }
  );

  const isLoading = computed(
    () =>
      accountQuery.isLoading.value ||
      balanceQuery.isLoading.value ||
      settingsLoading.value
  );

  const hasError = computed(
    () =>
      !!writeError.value ||
      accountQuery.isError.value ||
      balanceQuery.isError.value
  );

  const error = computed<ResponseError | undefined>(
    () =>
      writeError.value ??
      (accountQuery.isError.value
        ? mapToHeadlessError(accountQuery.error.value)
        : undefined) ??
      (balanceQuery.isError.value
        ? mapToHeadlessError(balanceQuery.error.value)
        : undefined)
  );

  /**
   * @decision the settled check runs BEFORE the watcher subscribes, never
   * inside an `{ immediate: true }` callback.
   * what: a synchronous `settled()` guard returns early; the watcher (no
   *      `immediate`) only fires on a FUTURE change.
   * why: `{ immediate: true }` runs its callback before `watch()` returns, so
   *      `stop()` inside it hits `stop` in its temporal dead zone — a repeat
   *      `isReady()` on a warm instance rejects (dev) or hangs (prod).
   * rejected: `let stop` declared ahead of the `watch()` call — the first
   *      synchronous invocation would still call `stop()` before it holds a
   *      real function.
   */
  async function isReady(): Promise<boolean> {
    if (!isClientActor.value) return false;
    const resolverReady = await resolverActions.isReady();
    if (!resolverReady) return false;
    if (!accountId.value) return false;

    const settled = (): boolean | undefined => {
      if (!accountId.value) return false;
      return !isLoading.value &&
        accountQuery.isFetched.value &&
        balanceQuery.isFetched.value &&
        settingsLoaded.value
        ? true
        : undefined;
    };

    const now = settled();
    if (now !== undefined) return now;

    return new Promise(resolve => {
      const stop = watch([isLoading, accountId], () => {
        const result = settled();
        if (result !== undefined) {
          stop();
          resolve(result);
        }
      });
    });
  }

  async function refresh(): Promise<void> {
    await Promise.all([
      accountQuery.refetch(),
      balanceQuery.refetch(),
      loadSettings()
    ]);
  }

  function reset(): void {
    gateSettings.value = {};
    areaSettings.value = {};
    selfRecord.value = undefined;
    writeError.value = undefined;
    settingsLoaded.value = false;
    void loadSettings();
  }

  async function invalidate(): Promise<void> {
    const id = accountId.value;
    if (!id) return;
    await Promise.all([
      invalidateQueryByKey([...AFFILIATE_ACCOUNT_QUERY_KEY, id], {
        exact: false
      })(undefined),
      invalidateQueryByKey([...AFFILIATE_BALANCE_QUERY_KEY, id], {
        exact: false
      })(undefined)
    ]);
  }

  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  async function enrol(): Promise<void> {
    const id = accountId.value;
    if (!id || !isClientActor.value || isEnrolled.value) return;
    isProcessing.value = true;
    return enrolAffiliate(id)
      .then(() => {
        writeError.value = undefined;
        return Promise.all([
          invalidateQueryByKey([...AFFILIATE_ACCOUNT_QUERY_KEY, id], {
            exact: false
          })(undefined),
          invalidateQueryByKey([...AFFILIATE_BALANCE_QUERY_KEY, id], {
            exact: false
          })(undefined),
          loadAreaSettings(resolvedBrandId.value).then(
            v => (areaSettings.value = v),
            () => (areaSettings.value = {})
          )
        ]);
      })
      .then(
        () => undefined,
        err => {
          writeError.value = mapToHeadlessError(err);
        }
      )
      .finally(() => {
        isProcessing.value = false;
      });
  }

  async function requestWithdrawal(payload: {
    message: string;
  }): Promise<string | undefined> {
    const id = accountId.value;
    if (!id) return undefined;

    isProcessing.value = true;
    return requestAffiliateWithdrawal(id, payload.message)
      .then(
        ticketId => {
          writeError.value = undefined;
          return ticketId;
        },
        err => {
          writeError.value = mapToHeadlessError(err);
          return undefined;
        }
      )
      .finally(() => {
        isProcessing.value = false;
      });
  }

  /**
   * @decision the self-read `actor.brand` relation is read through a local
   * cast, not a typed `IUser` field.
   * what: `(selfRecord.value?.actor as { brand?: IBrand } | undefined)?.brand`.
   * why: `packages/types`' `IUser` declares no `brand` relation (only
   *      `user_brand_group.brand` and `brand_id`), and the `with=actor.brand`
   *      read this fallback needs (design.md §8.1, §8.5, D-24) is a
   *      different relation. Adding it to `packages/types` is a second,
   *      unproven wire-field gap in the same shape as G6 (design.md §11) —
   *      out of the R-TYPES/G10 scope this build phase carries, and flagged
   *      in the hand-off for an operator decision once a capture exists.
   * rejected: widening `IUser` in `packages/types` — beyond the scope this
   *      run names (R-SCOPE-MODULE, review-notes.md).
   */
  const brand = computed(
    () =>
      data.value?.account?.brand ??
      (selfRecord.value?.actor as { brand?: IBrand } | undefined)?.brand
  );

  /** The active account id AND non-empty account data, as legacy (design.md §8.5, `o36`). */
  const isEnrolled = computed(() => !!accountId.value && !isEmpty(data.value));

  return {
    // --- sub-composables
    useActions: () =>
      createClientAffiliateActions(actorScope, {
        destroy,
        enrol,
        invalidate,
        isReady,
        refresh,
        requestWithdrawal,
        reset
      }),
    useContext: () =>
      createClientAffiliateContext(actorScope, {
        areaSettings,
        balances,
        brand,
        data,
        error,
        gateSettings,
        referralOriginValue: computed(() => referralOrigin(brand.value))
      }),
    useInternals: () =>
      createClientAffiliateInternals(actorScope, {
        accountId,
        data,
        isClientActor
      }),
    useMeta: () =>
      createClientAffiliateMeta(actorScope, {
        accountId,
        areaSettings,
        balances,
        data,
        gateSettings,
        hasError,
        isEnrolled,
        isLoading,
        isProcessing
      })
  };
}

/**
 * The client's own affiliate account.
 *
 * @example
 * ```ts
 * const affiliate = useClientAffiliate().as('client');
 * await affiliate.useActions().isReady();
 * const { data, error } = affiliate.useContext();
 * ```
 */
export const useClientAffiliate = createScopedComposable<
  ReturnType<typeof createClientAffiliateForScope>,
  AffiliateScopeMatrix
>("client-affiliate", createClientAffiliateForScope);

export type UseClientAffiliate = ReturnType<typeof useClientAffiliate>;
