import { ref } from "vue";
import { createScopedComposable } from "../scope";
import { visitAffiliateLink } from "./affiliate.services";
import { createAffiliateLinkVisitActions } from "./useAffiliateLinkVisit.actions";
import { createAffiliateLinkVisitContext } from "./useAffiliateLinkVisit.context";
import { createAffiliateLinkVisitInternals } from "./useAffiliateLinkVisit.internals";
import { createAffiliateLinkVisitMeta } from "./useAffiliateLinkVisit.meta";
import { useCookies } from "../../utils";
import type {
  AffiliateLinkVisitModel,
  AffiliateLinkVisitScopeMatrix
} from "./affiliate.types";
import type { ScopeConfig } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinkVisit
 * @description The guest referral-link visit — one request, a cookie write
 * or delete, and a redirect target (design.md §6.4, D-13, flow.md §4). Reads
 * no session and no account; every actor sends the same visit.
 */
// -----------------------------------------------------------------------------

const REFERRAL_COOKIE = "upm_aff";

/** The raw, unencoded cookie codec `upm_aff` uses — no JSON, no base64. */
const identityDecoder = (value: string): string => value;
const identityEncoder = (value: unknown): string => value as string;

function buildModel(overrides?: Partial<AffiliateLinkVisitModel>) {
  return {
    visitUrl: overrides?.visitUrl ?? window.location.href,
    referrerUrl: overrides?.referrerUrl ?? document.referrer ?? "",
    userAgent: overrides?.userAgent ?? navigator.userAgent
  };
}

/**
 * @decision the referrer is `encodeURI`d before `searchParams.set`, so it is
 * encoded twice.
 * what: `upm_referrer` carries `encodeURI(referrerUrl)`, then the URL API
 *      encodes that again.
 * why: legacy `aff.ts` does the same; the redirect target must match it for
 *      attribution parity (audit.md row 8, bdd.md AC24).
 * rejected: the raw referrer — it reaches the target with a different value
 *      than legacy for `%`, spaces and non-ASCII.
 */
function buildTarget(redirectUrl: string, referrerUrl: string): string {
  try {
    const url = new URL(redirectUrl);
    url.searchParams.set("upm_aff", "1");
    if (referrerUrl)
      url.searchParams.set("upm_referrer", encodeURI(referrerUrl));
    return url.toString();
  } catch {
    return redirectUrl;
  }
}

function createAffiliateLinkVisitForScope(config: ScopeConfig) {
  const actorScope = config.actor as ScopeActorTypes;
  const lastResponse = ref<{ target: string } | undefined>(undefined);

  async function visit(
    overrides?: Partial<AffiliateLinkVisitModel>
  ): Promise<string> {
    const model = buildModel(overrides);
    const referralCookie = useCookies().get(
      REFERRAL_COOKIE,
      identityDecoder
    ) as string | undefined;

    let response;
    try {
      response = await visitAffiliateLink(model, referralCookie ?? undefined);
    } catch {
      const origin = window.location.origin;
      lastResponse.value = { target: origin };
      return origin;
    }

    if (response.referralCookie) {
      useCookies().setTopLevel(
        REFERRAL_COOKIE,
        response.referralCookie,
        {
          path: "/",
          ...(response.referralCookieMaxAge
            ? { "max-age": response.referralCookieMaxAge }
            : {})
        },
        identityEncoder
      );
    } else {
      useCookies().removeTopLevel(REFERRAL_COOKIE, { path: "/" });
    }

    const target = response.redirectUrl
      ? buildTarget(response.redirectUrl, model.referrerUrl)
      : window.location.origin;

    lastResponse.value = { target };
    return target;
  }

  return {
    // --- sub-composables
    useActions: () => createAffiliateLinkVisitActions(actorScope, { visit }),
    useContext: () =>
      createAffiliateLinkVisitContext(actorScope, { lastResponse }),
    useInternals: () =>
      createAffiliateLinkVisitInternals(actorScope, { lastResponse }),
    useMeta: () => createAffiliateLinkVisitMeta(actorScope, { lastResponse })
  };
}

/**
 * A visitor's referral-link visit — one action, no context matrix
 * (design.md D-13).
 *
 * @example
 * ```ts
 * const target = await useAffiliateLinkVisit().as('guest').useActions().visit();
 * window.location.assign(target);
 * ```
 */
export const useAffiliateLinkVisit = createScopedComposable<
  ReturnType<typeof createAffiliateLinkVisitForScope>,
  AffiliateLinkVisitScopeMatrix
>("affiliate-link-visit", createAffiliateLinkVisitForScope);

export type UseAffiliateLinkVisit = ReturnType<typeof useAffiliateLinkVisit>;
