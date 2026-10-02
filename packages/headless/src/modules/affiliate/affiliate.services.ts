/** @internal */
import { useQuery as vueUseQuery } from "@tanstack/vue-query";
import { effectScope, getCurrentScope } from "vue";
import { BrandConfigKeys, UUID } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { invalidateQueryByKey, useQuery } from "../query";
import { RequestSortDirection } from "../query/query.types";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import { mapAffiliatePayouts } from "./affiliate.mappers";
import {
  useCommissionsQuerySchema,
  useLinksQuerySchema,
  usePayoutsQuerySchema,
  useReferralsQuerySchema
} from "./affiliate.schemas";
import { isNotFoundError } from "./affiliate.utils";
import {
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes
} from "../../utils";
import { some } from "lodash-es";
import type {
  AccountBoundPlaceholderData,
  AffiliateAccountQuery,
  AffiliateBalanceQuery,
  AffiliateBrandValues,
  AffiliateCommissionsListQuery,
  AffiliateCommissionsQueryModel,
  AffiliateLinkFormModel,
  AffiliateLinksListQuery,
  AffiliateLinksQueryModel,
  AffiliateLinkVisitModel,
  AffiliateLinkVisitResponse,
  AffiliatePayoutDestinationFormModel,
  AffiliatePayoutRow,
  AffiliatePayoutsListQuery,
  AffiliatePayoutsQueryModel,
  AffiliateReferralsListQuery,
  AffiliateReferralsQueryModel
} from "./affiliate.types";
import type { DefaultError } from "@tanstack/vue-query";
import type {
  IAffiliate,
  IAffiliateBalance,
  IAffiliateBrandPayoutDestination,
  IAffiliateLink,
  IAffiliatePayout,
  IAffiliatePendingCommission,
  IAffiliateReferral,
  IEmail,
  ISelf
} from "@upmind-automation/types";
import type { ComputedRef, Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/affiliate.services
 * @description Every read and write of the module: the module-owned self
 * read (the active-account source, R-NO-SWITCH), the client
 * account/balance/settings reads, `enrol`, the withdrawal request, the four
 * listings, the two managers' reads and writes, and the guest link visit
 * (design.md §8.1, §8.2, §8.6).
 *
 * WARNING: resolve via `useAffiliateActiveAccount.ts` / `useClientAffiliate.ts`
 * / `useAffiliateLinks.ts` / `useAffiliateLinkManager.ts` /
 * `useAffiliateReferrals.ts` / `useAffiliateCommissions.ts` /
 * `useAffiliatePayouts.ts` / `useAffiliatePayoutDestinationManager.ts` /
 * `useAffiliateLinkVisit.ts` only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------
// Resolver — the account source (R-NO-SWITCH)

/**
 * `GET self`, no relations — the leanest read that still carries
 * `account_id` (a base field, not a relation). The resolver's account
 * source: the client's own account when `/self` names one, else the
 * client's only account (design.md §8.4, R-NO-SWITCH).
 */
export async function loadSelfAccount(): Promise<ISelf | undefined> {
  const { request, useUrl } = useQuery();
  const response = await request<ISelf>({
    url: useUrl("self"),
    withAccessToken: true
  });
  return response.data as ISelf | undefined;
}

// -----------------------------------------------------------------------------
// The client account read

const AFFILIATE_ACCOUNT_WITH = [
  "account",
  "account.brand",
  "account.clients",
  "import.credentials",
  "import.source",
  "account.affiliate_payout_destination"
].join(",");

/** `GET accounts/{a}/affiliate` (design.md §8.1). */
export async function loadAffiliateAccount(
  accountId: string
): Promise<IAffiliate | undefined> {
  const { request, useUrl } = useQuery();
  const response = await request<IAffiliate>({
    url: useUrl(`accounts/${accountId}/affiliate`, {
      with_staged_imports: 1,
      with: AFFILIATE_ACCOUNT_WITH
    }),
    withAccessToken: true
  });
  return response.data as IAffiliate | undefined;
}

/** `GET accounts/{a}/affiliate/balance` (design.md §8.1). */
export async function loadAffiliateBalance(
  accountId: string
): Promise<IAffiliateBalance | undefined> {
  const { request, useUrl } = useQuery();
  const response = await request<IAffiliateBalance>({
    url: useUrl(`accounts/${accountId}/affiliate/balance`, {
      with_staged_imports: 1
    }),
    withAccessToken: true
  });
  return response.data as IAffiliateBalance | undefined;
}

export const AFFILIATE_ACCOUNT_QUERY_KEY = ["affiliate", "account"];
export const AFFILIATE_BALANCE_QUERY_KEY = ["affiliate", "balance"];

/**
 * The account read, query()-keyed on the active account id — TWO instances
 * under the same account dedupe onto ONE request (design.md §8.1 "two-reads"
 * control). A 404 resolves as a SUCCESSFUL fetch with no data, never
 * `isError` (design.md §8.5, §8.11 "isEnrolled" control); any other failure
 * rejects.
 *
 * @decision hand-rolled directly against `@tanstack/vue-query`'s own
 * `useQuery`, never through this platform's `useQuery().query()` wrapper —
 * the same reason `client-personal-details.services.ts`'s `loadProfile`
 * gives.
 * what: builds `queryKey: [...AFFILIATE_ACCOUNT_QUERY_KEY, accountId]` and
 *      calls `vueUseQuery` directly inside a detached `effectScope`. The
 *      `queryFn` resolves `null` (never `undefined`) for "no account"/404;
 *      `select` maps `null` back to `undefined` for every consumer (F-2).
 * why: a 404 on this route is not a failure (design.md §8.5) — it has to
 *      resolve as EMPTY data, not `isError`. `query()`'s internal `queryFn`
 *      has no hook to intercept the request's rejection before it reaches
 *      TanStack, so a 404 there always sets `isError` true. `@tanstack/query`
 *      itself throws "Query data cannot be undefined" when a `queryFn`
 *      resolves `undefined` — caught internally and surfaced as `isError`
 *      true, exactly the outcome this read exists to avoid. `null` is a
 *      valid resolved value, so the fetch settles as a genuine success. No
 *      `placeholderData` is set either way, which is what design.md's
 *      "isEnrolled" control relies on: a key change (id clears) empties
 *      `data` at once.
 * rejected: `query()` with a `select` that swallows the 404 — `select` runs
 *      only on a SUCCESSFUL fetch; it never sees the rejection at all.
 */
export function loadAffiliateAccountQuery(
  accountId: ComputedRef<string | undefined>
): AffiliateAccountQuery {
  const { queryClient } = useQuery();
  const currentScope = getCurrentScope();
  const scope = currentScope?.active ? currentScope : effectScope(true);

  return scope.run(() =>
    vueUseQuery<IAffiliate | null, DefaultError, IAffiliate | undefined>(
      {
        queryKey: [...AFFILIATE_ACCOUNT_QUERY_KEY, accountId],
        queryFn: async () => {
          const id = accountId.value;
          if (!id) return null;
          return loadAffiliateAccount(id).then(
            data => data ?? null,
            err => {
              if (isNotFoundError(err)) return null;
              throw err;
            }
          );
        },
        select: data => data ?? undefined,
        enabled: () => !!accountId.value,
        retry: false
      },
      queryClient
    )
  ) as AffiliateAccountQuery;
}

/** The balance read — same dedup/404 contract as {@link loadAffiliateAccountQuery}. */
export function loadAffiliateBalanceQuery(
  accountId: ComputedRef<string | undefined>
): AffiliateBalanceQuery {
  const { queryClient } = useQuery();
  const currentScope = getCurrentScope();
  const scope = currentScope?.active ? currentScope : effectScope(true);

  return scope.run(() =>
    vueUseQuery<
      IAffiliateBalance | null,
      DefaultError,
      IAffiliateBalance | undefined
    >(
      {
        queryKey: [...AFFILIATE_BALANCE_QUERY_KEY, accountId],
        queryFn: async () => {
          const id = accountId.value;
          if (!id) return null;
          return loadAffiliateBalance(id).then(
            data => data ?? null,
            err => {
              if (isNotFoundError(err)) return null;
              throw err;
            }
          );
        },
        select: data => data ?? undefined,
        enabled: () => !!accountId.value,
        retry: false
      },
      queryClient
    )
  ) as AffiliateBalanceQuery;
}

// -----------------------------------------------------------------------------
// The two raw settings reads (module-owned, outside the query cache — D-11)

/** `GET config/brand/values`, the `gate` key set (design.md §8.1). */
export async function loadGateSettings(): Promise<AffiliateBrandValues> {
  const { request, useUrl } = useQuery();
  const keys = [
    BrandConfigKeys.UPMIND_AFFILIATES_ENABLED,
    BrandConfigKeys.UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED
  ];
  const response = await request<AffiliateBrandValues>({
    url: useUrl("config/brand/values", { keys: keys.join(",") }),
    withAccessToken: true
  });
  return (response.data as AffiliateBrandValues) ?? {};
}

/**
 * `GET config/brand/values`, the `area` key set. `brand_id` is sent only
 * when it is not `UUID.ORG` (design.md §8.1).
 */
export async function loadAreaSettings(
  brandId?: string
): Promise<AffiliateBrandValues> {
  const { request, useUrl } = useQuery();
  const keys = [
    BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK,
    BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST
  ];
  const params: Record<string, unknown> = { keys: keys.join(",") };
  if (brandId && brandId !== UUID.ORG) params.brand_id = brandId;

  const response = await request<AffiliateBrandValues>({
    url: useUrl("config/brand/values", params),
    withAccessToken: true
  });
  return (response.data as AffiliateBrandValues) ?? {};
}

// -----------------------------------------------------------------------------
// The module-owned self read (brand fallback, D-24/D-45)

export const AFFILIATE_SELF_QUERY_KEY_SEGMENT = "affiliate-brand" as const;

/** `GET self`, `with=actor.brand` (design.md §8.1). */
export async function loadSelfBrand(): Promise<ISelf | undefined> {
  const { request, useUrl } = useQuery();
  const response = await request<ISelf>({
    url: useUrl("self", { with: "actor.brand" }),
    withAccessToken: true
  });
  return response.data as ISelf | undefined;
}

/**
 * `self.branding.style.brand_name`, else `useBrand().name` (design.md §8.1,
 * the self read's `brandName` selection). Used by the link manager for
 * display only; a failed read falls back silently.
 */
export async function loadSelfBrandName(): Promise<string> {
  const { name } = useBrand();
  return loadSelfBrand().then(
    self => self?.branding?.style?.brand_name ?? name.value ?? "",
    () => name.value ?? ""
  );
}

// -----------------------------------------------------------------------------
// Writes

/** `POST accounts/{a}/affiliate`, no body (design.md §8.2). */
export async function enrolAffiliate(accountId: string): Promise<void> {
  const { post, useUrl } = useQuery();
  await post({
    mutationKey: ["affiliate", "enrol", accountId],
    url: useUrl(`accounts/${accountId}/affiliate`),
    withAccessToken: true
  });
}

/**
 * `POST accounts/{a}/affiliate/withdraw`. Resolves the created ticket id.
 *
 * @decision the response shape that carries the ticket id reads `data.id`.
 * what: reads the ticket id off `response.data.id`.
 * why: proven by the real staging capture
 *      (`post-accounts-id-affiliate-withdraw.json`, `affiliate.withdraw.int.test.ts`)
 *      — every other write in this file wraps its created resource under
 *      `data` (the platform convention `request<T>()` decodes to), and the
 *      recorded ticket body confirms the same shape here.
 * rejected: leaving the return type `unknown` — a caller needs a concrete
 *      id to hand to the tickets screens (FE-3226).
 */
export async function requestAffiliateWithdrawal(
  accountId: string,
  message: string
): Promise<string | undefined> {
  const { post, useUrl } = useQuery();
  const response = await post<{ id?: string }>({
    mutationKey: ["affiliate", "withdraw", accountId],
    url: useUrl(`accounts/${accountId}/affiliate/withdraw`),
    data: { message },
    withAccessToken: true
  });
  return response?.id;
}

// -----------------------------------------------------------------------------
// Membership check (design.md §8.2, D-39) — save services only

/**
 * Rejects a pinned account id that the client no longer holds, before any
 * request goes out. Lives in each manager's save service ONLY — not in reads,
 * and not in the machine (design.md §8.4, Editors; §8.2, D-39).
 */
function assertAccountMembership(accountId?: string): void {
  const { activeUser } = useActiveSession().useContext();
  const isMember = some(
    activeUser.value?.accounts ?? [],
    account => account.id === accountId
  );
  if (!accountId || !isMember) {
    throw new DetailedError(
      useI18n().t("error.affiliate_account_not_member"),
      responseCodes.Forbidden,
      ErrorOrigin.Headless
    );
  }
}

// -----------------------------------------------------------------------------
// Links (design.md §8.1, §8.2, §8.3)

export const AFFILIATE_LINKS_QUERY_KEY = ["affiliate", "links"];

/** `GET accounts/{a}/affiliate/links`, criteria-driven (design.md §8.1, §8.3). */
export function loadAffiliateLinksList(
  accountId: Ref<string | undefined>,
  placeholderData?: AccountBoundPlaceholderData<IAffiliateLink[]>
): AffiliateLinksListQuery {
  const { list, useUrl } = useQuery();
  const targetUrl = () =>
    useUrl(`accounts/${accountId.value}/affiliate/links`, {
      with_staged_imports: 1
    });
  const url = targetUrl();

  return list<IAffiliateLink[], IAffiliateLink[], AffiliateLinksQueryModel>({
    criteria: { schema: useLinksQuerySchema() },
    queryKey: [...AFFILIATE_LINKS_QUERY_KEY, { account: accountId }],
    url,
    guard: async () => {
      if (!accountId.value) return Promise.reject(new NotAuthenticatedError());
      url.pathname = targetUrl().pathname;
      return true;
    },
    withAccessToken: true,
    enabled: () => !!accountId.value,
    placeholderData
  });
}

/** `GET accounts/{a}/affiliate/links/{id}`, one-shot (design.md §8.1, §8.6 edit door). */
export async function loadAffiliateLinkOne(
  accountId: string,
  linkId: string
): Promise<IAffiliateLink | undefined> {
  const { request, useUrl } = useQuery();
  const response = await request<IAffiliateLink>({
    url: useUrl(`accounts/${accountId}/affiliate/links/${linkId}`),
    withAccessToken: true
  });
  return response.data as IAffiliateLink | undefined;
}

/**
 * `POST`/`PUT accounts/{a}/affiliate/links(/{id})` — create when `linkId` is
 * absent, else update (design.md §8.2, §8.6). Checks membership first (D-39).
 */
export async function saveAffiliateLink(
  accountId: string,
  linkId: string | undefined,
  model: AffiliateLinkFormModel
): Promise<IAffiliateLink | undefined> {
  assertAccountMembership(accountId);
  const { post, put, useUrl } = useQuery();
  const data = { name: model.name, redirect_url: model.redirectUrl };

  const saved = linkId
    ? await put<IAffiliateLink>({
        mutationKey: [...AFFILIATE_LINKS_QUERY_KEY, accountId, linkId],
        url: useUrl(`accounts/${accountId}/affiliate/links/${linkId}`),
        data,
        withAccessToken: true
      })
    : await post<IAffiliateLink>({
        mutationKey: [...AFFILIATE_LINKS_QUERY_KEY, accountId, "create"],
        url: useUrl(`accounts/${accountId}/affiliate/links`),
        data,
        withAccessToken: true
      });

  await invalidateQueryByKey(
    [...AFFILIATE_LINKS_QUERY_KEY, { account: accountId }],
    { exact: false }
  )(undefined);

  return saved as IAffiliateLink | undefined;
}

/** `DELETE accounts/{a}/affiliate/links/{id}`, then refetch with the current criteria (design.md §8.2). */
export async function removeAffiliateLink(
  accountId: string,
  linkId: string
): Promise<void> {
  const { del, useUrl } = useQuery();
  await del<null>({
    mutationKey: [...AFFILIATE_LINKS_QUERY_KEY, accountId, linkId, "remove"],
    url: useUrl(`accounts/${accountId}/affiliate/links/${linkId}`),
    withAccessToken: true
  });
  await invalidateQueryByKey(
    [...AFFILIATE_LINKS_QUERY_KEY, { account: accountId }],
    { exact: false }
  )(undefined);
}

// -----------------------------------------------------------------------------
// Referrals (design.md §8.1, §8.3) — no `with_staged_imports` [o24]

export const AFFILIATE_REFERRALS_QUERY_KEY = ["affiliate", "referrals"];

const AFFILIATE_REFERRALS_WITH = [
  "affiliate_account",
  "affiliate_link",
  "client",
  "client.image"
].join(",");

export function loadAffiliateReferralsList(
  accountId: Ref<string | undefined>,
  placeholderData?: AccountBoundPlaceholderData<IAffiliateReferral[]>
): AffiliateReferralsListQuery {
  const { list, useUrl } = useQuery();
  const targetUrl = () =>
    useUrl(`accounts/${accountId.value}/affiliate/referrals`, {
      with: AFFILIATE_REFERRALS_WITH
    });
  const url = targetUrl();

  return list<
    IAffiliateReferral[],
    IAffiliateReferral[],
    AffiliateReferralsQueryModel
  >({
    criteria: { schema: useReferralsQuerySchema() },
    queryKey: [...AFFILIATE_REFERRALS_QUERY_KEY, { account: accountId }],
    url,
    guard: async () => {
      if (!accountId.value) return Promise.reject(new NotAuthenticatedError());
      url.pathname = targetUrl().pathname;
      return true;
    },
    withAccessToken: true,
    enabled: () => !!accountId.value,
    placeholderData
  });
}

// -----------------------------------------------------------------------------
// Pending commissions (design.md §8.1, §8.3)

export const AFFILIATE_COMMISSIONS_QUERY_KEY = ["affiliate", "commissions"];

const AFFILIATE_COMMISSIONS_WITH = ["invoice", "invoice.client"].join(",");

export function loadAffiliateCommissionsList(
  accountId: Ref<string | undefined>,
  placeholderData?: AccountBoundPlaceholderData<IAffiliatePendingCommission[]>
): AffiliateCommissionsListQuery {
  const { list, useUrl } = useQuery();
  const targetUrl = () =>
    useUrl(`accounts/${accountId.value}/affiliate/pending_commissions`, {
      with_staged_imports: 1,
      with: AFFILIATE_COMMISSIONS_WITH
    });
  const url = targetUrl();

  return list<
    IAffiliatePendingCommission[],
    IAffiliatePendingCommission[],
    AffiliateCommissionsQueryModel
  >({
    criteria: { schema: useCommissionsQuerySchema() },
    queryKey: [...AFFILIATE_COMMISSIONS_QUERY_KEY, { account: accountId }],
    url,
    guard: async () => {
      if (!accountId.value) return Promise.reject(new NotAuthenticatedError());
      url.pathname = targetUrl().pathname;
      return true;
    },
    withAccessToken: true,
    enabled: () => !!accountId.value,
    placeholderData
  });
}

// -----------------------------------------------------------------------------
// Payouts (design.md §8.1, §8.3, D-34)

export const AFFILIATE_PAYOUTS_QUERY_KEY = ["affiliate", "payouts"];

const AFFILIATE_PAYOUTS_WITH = [
  "affiliate_payout_destination",
  "payment_log"
].join(",");

export function loadAffiliatePayoutsList(
  accountId: Ref<string | undefined>,
  placeholderData?: AccountBoundPlaceholderData<IAffiliatePayout[]>
): AffiliatePayoutsListQuery {
  const { list, useUrl } = useQuery();
  const targetUrl = () =>
    useUrl(`accounts/${accountId.value}/affiliate/payouts`, {
      with_staged_imports: 1,
      with: AFFILIATE_PAYOUTS_WITH
    });
  const url = targetUrl();

  return list<
    IAffiliatePayout[],
    AffiliatePayoutRow[],
    AffiliatePayoutsQueryModel
  >({
    criteria: { schema: usePayoutsQuerySchema() },
    queryKey: [...AFFILIATE_PAYOUTS_QUERY_KEY, { account: accountId }],
    url,
    select: mapAffiliatePayouts,
    guard: async () => {
      if (!accountId.value) return Promise.reject(new NotAuthenticatedError());
      url.pathname = targetUrl().pathname;
      return true;
    },
    withAccessToken: true,
    enabled: () => !!accountId.value,
    placeholderData
  });
}

// -----------------------------------------------------------------------------
// Payout destination manager (design.md §8.1, §8.2, §8.6, D-40)
//
// The account re-read is `loadAffiliateAccount` above, unchanged — already a
// raw, uncached one-shot read with the exact path/params design.md §6.3/D-40
// asks for. No second function is minted for it.

/**
 * `GET brands/{id}/affiliate_payout_destination` (design.md §8.1). `useUrl`
 * gets no parameter; `sort`/`pagination` carry the window (design.md §8.1
 * "How the two lookup reads send their window and order").
 */
export async function loadAffiliatePayoutDestinations(
  brandId: string
): Promise<IAffiliateBrandPayoutDestination[]> {
  const { request, useUrl } = useQuery();
  const response = await request<IAffiliateBrandPayoutDestination[]>({
    url: useUrl(`brands/${brandId}/affiliate_payout_destination`),
    sort: [RequestSortDirection.DESC, "created_at"],
    pagination: { limit: 10, offset: 0 },
    withAccessToken: true
  });
  return (response.data as IAffiliateBrandPayoutDestination[]) ?? [];
}

/** `GET clients/{id}/emails`, unpaged (design.md §8.1). */
export async function loadAffiliateClientEmails(
  clientId: string
): Promise<IEmail[]> {
  const { request, useUrl } = useQuery();
  const response = await request<IEmail[]>({
    url: useUrl(`clients/${clientId}/emails`, { with_staged_imports: 1 }),
    sort: [
      [RequestSortDirection.DESC, "default"],
      [RequestSortDirection.DESC, "id"]
    ],
    pagination: { limit: 0, offset: 0 },
    withAccessToken: true
  });
  return (response.data as IEmail[]) ?? [];
}

/** `PUT accounts/{a}` (design.md §8.2). Checks membership first (D-39). */
export async function saveAffiliatePayoutDestination(
  accountId: string,
  model: AffiliatePayoutDestinationFormModel
): Promise<IAffiliate | undefined> {
  assertAccountMembership(accountId);
  const { put, useUrl } = useQuery();
  const response = await put<IAffiliate>({
    mutationKey: [
      ...AFFILIATE_ACCOUNT_QUERY_KEY,
      accountId,
      "payout-destination"
    ],
    url: useUrl(`accounts/${accountId}`),
    data: {
      affiliate_payout_destination_id: model.payoutDestinationId,
      affiliate_payout_paypal_email_id: model.paypalEmailId
    },
    withAccessToken: true
  });
  return response as IAffiliate | undefined;
}

// -----------------------------------------------------------------------------
// Guest link visit — no session, no auth header (D-13)

/** `POST affiliate_link/visit`, `withAccessToken: false` (design.md §8.2). */
export async function visitAffiliateLink(
  model: AffiliateLinkVisitModel,
  referralCookie?: string
): Promise<AffiliateLinkVisitResponse> {
  const { post, useUrl } = useQuery();

  const response = await post<{
    redirect_url?: string;
    referral_cookie?: string;
    referral_cookie_max_age?: number;
  }>({
    mutationKey: ["affiliate", "visit"],
    url: useUrl("affiliate_link/visit"),
    data: {
      visit_url: model.visitUrl,
      referrer_url: model.referrerUrl,
      user_agent: model.userAgent,
      ...(referralCookie ? { referral_cookie: referralCookie } : {})
    },
    withAccessToken: false
  });

  return {
    redirectUrl: response?.redirect_url,
    referralCookie: response?.referral_cookie,
    referralCookieMaxAge: response?.referral_cookie_max_age
  };
}
