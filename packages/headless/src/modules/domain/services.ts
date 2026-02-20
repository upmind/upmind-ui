// --- external

// --- internal
import {
  type DomainModel,
  type DomainProduct,
  PAGINATION,
  useI18n,
  useQuery,
  useSession
} from "../..";

// --- utils
import { isEmpty, map, omitBy } from "lodash-es";
import { parseDomain, parseDomainParts, parseSuggestions } from "./utils";

// --- types
import type {
  DomainContext,
  DacContext,
  IDomainSuggestionsResponse,
  IDomainAvailabilityResponse
} from "./types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";

// -----------------------------------------------------------------------------
// Mock data for development — remove once real endpoints are available

const MOCK_SUGGESTIONS_RESPONSE: IDomainSuggestionsResponse = {
  results: [
    {
      sld: "upminddev",
      tld: ".com",
      product_id: "98574264-8970-1282-7e5f-e1e325d0ed36",
      domain_available: true
    },
    {
      sld: "upminddev",
      tld: ".io",
      product_id: "aaa-222-bbb",
      domain_available: true
    },
    {
      sld: "upminddev",
      tld: ".net",
      product_id: "aaa-333-bbb",
      domain_available: false
    },
    {
      sld: "upminddev",
      tld: ".co.uk",
      product_id: "aaa-444-bbb",
      domain_available: true
    }
  ],
  products: [
    {
      id: "98574264-8970-1282-7e5f-e1e325d0ed36",
      name: ".com",
      prices: [
        {
          billing_cycle_months: 12,
          price_formatted: "$12.99",
          price_discounted_formatted: "$9.99"
        }
      ]
    },
    {
      id: "aaa-222-bbb",
      name: ".io",
      prices: [
        {
          billing_cycle_months: 12,
          price_formatted: "$39.99",
          price_discounted_formatted: null
        }
      ]
    },
    {
      id: "aaa-333-bbb",
      name: ".net",
      prices: [
        {
          billing_cycle_months: 12,
          price_formatted: "$14.99",
          price_discounted_formatted: null
        }
      ]
    },
    {
      id: "aaa-444-bbb",
      name: ".co.uk",
      prices: [
        {
          billing_cycle_months: 12,
          price_formatted: "$8.99",
          price_discounted_formatted: null
        }
      ]
    }
  ]
};

const MOCK_AVAILABILITY_RESPONSE: IDomainAvailabilityResponse = {
  can_register: true,
  can_transfer: false,
  is_premium: false
};

// -----------------------------------------------------------------------------

async function search({
  search,
  basketId,
  brandId,
  coupons,
  preferredCycle
}: DacContext) {
  const { t } = useI18n();
  const { cancel } = useQuery();

  if (!search?.query?.length)
    return Promise.reject(
      new DetailedError(
        t("error.query_not_found"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const { sld } = parseDomainParts(search.query);

  cancel(["domains", "suggestions"]);

  // TODO: remove mock once /suggestions endpoint is live
  // const promocodes = parsePromotionsOrCoupons(coupons).join();
  // const { tld } = parseDomainParts(search.query);
  // const params = omitBy(
  //   { sld, tld, basket_id: basketId, brand_id: brandId, promotions: promocodes },
  //   isEmpty
  // );
  // return getList<IDomainSuggestionsResponse, DomainProduct[]>({
  //   url: useUrl("modules/web_hosting/domains/suggestions", params),
  //   queryKey: ["domains", "suggestions", { ...params }],
  //   pagination: { limit: search?.limit ?? PAGINATION.limit, offset: search?.offset ?? PAGINATION.offset },
  //   withAccessToken: true,
  //   withCurrency: true,
  //   select: data => parseSuggestions(sld, data ?? { results: [], products: [] }, preferredCycle)
  // });

  // --- MOCK: simulate network delay and return test data
  return new Promise<{ data: DomainProduct[]; total: number }>(resolve => {
    setTimeout(() => {
      const mockWithSld: IDomainSuggestionsResponse = {
        ...MOCK_SUGGESTIONS_RESPONSE,
        results: MOCK_SUGGESTIONS_RESPONSE.results.map(r => ({ ...r, sld }))
      };
      const data = parseSuggestions(sld, mockWithSld, preferredCycle);
      console.log("[MOCK] /suggestions response:", {
        data,
        total: data.length
      });
      resolve({ data, total: data.length });
    }, 800);
  });
}

async function checkAvailability({ checkingDomain }: DacContext) {
  const { get, useUrl } = useQuery();

  if (!checkingDomain)
    return Promise.reject(
      new DetailedError(
        "No domain specified for availability check",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // TODO: remove mock once /availability endpoint is live
  // return get<any, IDomainAvailabilityResponse>({
  //   url: useUrl(`modules/web_hosting/domains/availability/${checkingDomain}`),
  //   queryKey: ["domains", "availability", checkingDomain],
  //   withAccessToken: true,
  //   withCurrency: true,
  //   select: data => data
  // });

  // --- MOCK: simulate network delay and return available
  return new Promise<IDomainAvailabilityResponse>(resolve => {
    setTimeout(() => {
      console.log(
        `[MOCK] /availability/${checkingDomain} response:`,
        MOCK_AVAILABILITY_RESPONSE
      );
      resolve({ ...MOCK_AVAILABILITY_RESPONSE });
    }, 600);
  });
}

async function getClientDomains(_context: DomainContext | DacContext) {
  const { get, useUrl } = useQuery();
  const { meta } = useSession();

  // bail early if not authenticated: no point fetching
  if (!meta.value?.isAuthenticated) return [];

  return get<any, (DomainModel | undefined)[]>({
    url: useUrl("modules/web_hosting/domains/client_domains"),
    queryKey: ["domains", "owned"],
    select: data => map(data, ({ domain_name }) => parseDomain(domain_name)),
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  });
}

// -----------------------------------------------------------------------------

export default {
  search,
  checkAvailability,
  getClientDomains
};
