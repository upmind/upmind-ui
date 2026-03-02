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
import { DomainTypes } from "./types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";

// -----------------------------------------------------------------------------
// Mock data for development — remove once real endpoints are available

function mockSuggestions(sld: string): IDomainSuggestionsResponse {
  const tlds = [".com", ".io", ".net", ".co.uk"];
  const productIds = [
    "98574264-8970-1282-7e5f-e1e325d0ed36",
    "aaa-222-bbb",
    "aaa-333-bbb",
    "aaa-444-bbb"
  ];
  const prices = ["$12.99", "$39.99", "$14.99", "$8.99"];
  const discounted = ["$9.99", null, null, null];

  return {
    results: tlds.map((tld, i) => ({
      sld,
      tld,
      product_id: productIds[i],
      domain_available: i !== 2 // .net is unavailable
    })),
    products: tlds.map((tld, i) => ({
      id: productIds[i],
      name: tld,
      prices: [
        {
          billing_cycle_months: 12,
          price_formatted: prices[i],
          price_discounted_formatted: discounted[i]
        }
      ]
    }))
  };
}

function mockAvailability(tld?: string): IDomainAvailabilityResponse {
  // Find a matching product from the suggestions mock, or build one
  const productId = "98574264-8970-1282-7e5f-e1e325d0ed36";
  const productName = tld ?? ".com";

  return {
    // Toggle these values to test different branches:
    can_register: false,
    can_transfer: true,
    is_premium: false,
    product: {
      id: productId,
      name: productName,
      prices: [
        {
          billing_cycle_months: 12,
          price_formatted: "$12.99",
          price_discounted_formatted: "$9.99"
        }
      ]
    }
  };
}

// -----------------------------------------------------------------------------

/**
 * Builds a DomainProduct from an availability response.
 * Used in transfer mode where there are no suggestions — only a single
 * availability check that returns product data.
 */
function buildDomainProductFromAvailability(
  domain: string,
  availability: IDomainAvailabilityResponse,
  preferredCycle?: number
): DomainProduct {
  const { sld, tld } = parseDomainParts(domain);
  const parsed = parseDomain(domain);
  const product = availability.product;
  const prices = product?.prices ?? [];
  const priceEntry =
    prices.find(p => p.billing_cycle_months === preferredCycle) ?? prices[0];

  const priceFormatted = priceEntry?.price_formatted ?? "";
  const priceDiscountedFormatted =
    priceEntry?.price_discounted_formatted ?? null;
  const billingCycleMonths = priceEntry?.billing_cycle_months ?? 12;

  return {
    domain: parsed?.domain ?? domain,
    sld: parsed?.sld ?? sld,
    tld: parsed?.tld ?? tld ?? "",
    configuration: {
      productId: product?.id ?? "",
      term: billingCycleMonths,
      quantity: 1,
      provisionFields: { sld }
    },
    price: {
      currentPrice: priceDiscountedFormatted ?? priceFormatted,
      currentAmount: 0,
      regularPrice: priceFormatted,
      regularAmount: 0,
      savingAmount: 0,
      savingPrice: "",
      savingPercent: ""
    },
    meta: {
      available: availability.can_register,
      canTransfer: !availability.can_register && availability.can_transfer,
      unavailable: !availability.can_register && !availability.can_transfer,
      checkedAvailability: true,
      disabled: !availability.can_register && !availability.can_transfer,
      exactMatch: true
    },
    productDetails: {
      id: product?.id ?? "",
      title: domain,
      name: product?.name ?? tld ?? ""
    },
    pricing: [],
    details: []
  } as unknown as DomainProduct;
}

// -----------------------------------------------------------------------------

async function search(context: DacContext) {
  const { search, preferredCycle, mode } = context;
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

  const { sld, tld } = parseDomainParts(search.query);

  console.log(
    "[DEBUG search()] mode:",
    mode,
    "query:",
    search.query,
    "sld:",
    sld,
    "tld:",
    tld
  );

  cancel(["domains", "suggestions"]);

  // --- TRANSFER mode: only checkAvailability, no suggestions
  if (mode === DomainTypes.transfer) {
    const domain = search.query;
    const availability = await checkAvailability({
      ...context,
      checkingDomain: domain
    } as DacContext);

    const product = buildDomainProductFromAvailability(
      domain,
      availability,
      preferredCycle
    );

    console.log("[MOCK] Transfer mode — single availability check:", {
      domain,
      availability,
      product
    });

    return {
      data: [product],
      total: 1,
      availability,
      exactDomain: domain
    };
  }

  // --- Suggestions call (always runs)
  const suggestionsPromise = new Promise<{
    data: DomainProduct[];
    total: number;
  }>(resolve => {
    setTimeout(() => {
      const mockData = mockSuggestions(sld);
      const data = parseSuggestions(sld, mockData, preferredCycle);
      console.log("[MOCK] /suggestions response:", {
        data,
        total: data.length
      });
      resolve({ data, total: data.length });
    }, 800);
  });

  // --- Availability call (only when query has a TLD)
  const availabilityPromise: Promise<IDomainAvailabilityResponse | null> = tld
    ? checkAvailability({
        ...context,
        checkingDomain: `${sld}${tld}`
      } as DacContext)
    : Promise.resolve(null);

  const [suggestions, availability] = await Promise.all([
    suggestionsPromise,
    availabilityPromise
  ]);

  return {
    data: suggestions.data,
    total: suggestions.total,
    availability,
    exactDomain: tld ? `${sld}${tld}` : undefined
  };
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
  const { tld } = parseDomainParts(checkingDomain);
  const response = mockAvailability(tld);
  return new Promise<IDomainAvailabilityResponse>(resolve => {
    setTimeout(() => {
      console.log(`[MOCK] /availability/${checkingDomain} response:`, response);
      resolve({ ...response });
    }, 600);
  });
}

/**
 * Simulates a basket-add call that fails with availability data.
 * In production this would be the real basket add endpoint — if the domain
 * is unavailable the API returns availability info in the error response.
 */
async function addDomainToBasket({ checkingDomain }: DacContext) {
  if (!checkingDomain)
    return Promise.reject(
      new DetailedError(
        "No domain specified",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // --- MOCK: simulate basket add failing with availability data
  const { tld } = parseDomainParts(checkingDomain ?? "");
  const response = mockAvailability(tld);
  return new Promise<IDomainAvailabilityResponse>(resolve => {
    setTimeout(() => {
      console.log(
        `[MOCK] Basket add for ${checkingDomain} failed — returning availability:`,
        response
      );
      resolve({ ...response });
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
  addDomainToBasket,
  getClientDomains
};
