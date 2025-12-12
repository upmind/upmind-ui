// --- external

// --- internal
import {
  DomainModel,
  DomainProduct,
  PAGINATION,
  useI18n,
  useQuery,
  useSession
} from "../..";

// --- utils
import { isEmpty, map, omitBy } from "lodash-es";
import { parseAvailable, parseDomain, parseDomainParts } from "./utils";

// --- types
import type { IProduct } from "@upmind-automation/types";
import type { DomainContext, DacContext } from "./types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";

// -----------------------------------------------------------------------------

async function search({
  search,
  basketId,
  brandId,
  coupons,
  preferredCycle
}: DacContext) {
  const { t } = useI18n();
  const { cancel, getList, useUrl } = useQuery();

  if (!search?.query?.length)
    return Promise.reject(
      new DetailedError(
        t("error.query_not_found"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const { sld, tld } = parseDomainParts(search.query);

  // lets ensure we parse our coupons correctly
  const promocodes = parsePromotionsOrCoupons(coupons).join();

  // --- Build the request and Fetch the search results
  const params = omitBy(
    {
      sld,
      tld,
      with: ["prices", "options", "options.prices", "attributes"].join(),
      basket_id: basketId,
      brand_id: brandId,
      promotions: promocodes
    },
    isEmpty
  );

  cancel(["domains", "search"]);

  return getList<IProduct[], DomainProduct[]>({
    url: useUrl("modules/web_hosting/domains/search", params),
    queryKey: ["domains", "search", { ...params }],
    pagination: {
      limit: search?.limit ?? PAGINATION.limit,
      offset: search?.offset ?? PAGINATION.offset
    },
    withAccessToken: true,
    withCurrency: true,
    select: data => parseAvailable(sld, data ?? [], preferredCycle)
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
  getClientDomains
};
