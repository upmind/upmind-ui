// --- external

// --- internal
import { DomainModel, DomainProduct, PAGINATION, useQuery } from "../..";

// --- utils
import { isEmpty, map, omitBy } from "lodash-es";
import { parseAvailable, parseDomain, parseDomainParts } from "./utils";

// --- types
import type { IProduct } from "@upmind-automation/types";
import type { DomainContext } from "./types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// -----------------------------------------------------------------------------

async function search({
  search,
  currency,
  basketId,
  brandId,
  controller,
  promotions,
  preferredCycle
}: DomainContext) {
  const { getList, useUrl } = useQuery();

  if (!search?.query?.length)
    return Promise.reject(
      new DetailedError(
        "No query provided",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const { sld, tld } = parseDomainParts(search.query);

  // lets ensure we parse our promotions correctly
  const promocodes = map(promotions, "promotion.code").join();

  // --- Build the request and Fetch the search results
  const params = omitBy(
    {
      sld,
      tld,
      with: ["prices", "options", "options.prices", "attributes"].join(),
      currency_code: currency,
      basket_id: basketId,
      brand_id: brandId,
      promotions: promocodes
    },
    isEmpty
  );

  return getList<IProduct[], DomainProduct[]>({
    url: useUrl("modules/web_hosting/domains/search", params),
    init: { signal: controller?.signal },
    queryKey: ["domain", "search", { ...params }],
    pagination: {
      limit: search?.limit ?? PAGINATION.limit,
      offset: search?.offset ?? PAGINATION.offset
    },
    staleTime: 0,
    gcTime: 0,
    withAccessToken: true,
    select(data) {
      return parseAvailable(sld, data ?? [], preferredCycle);
    }
  });
}

async function getClientDomains({ controller }: DomainContext) {
  const { get, useUrl } = useQuery();

  return get<any, (DomainModel | undefined)[]>({
    url: useUrl("modules/web_hosting/domains/client_domains"),
    init: { signal: controller?.signal },
    queryKey: ["domain", "client-domains"],
    select: data => map(data, ({ domain_name }) => parseDomain(domain_name)),
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  });
}
// ---
// async function parse(_context, _event) {
//   // TODO: Implement the parse function
//   // ---
//   return Promise.resolve({});
// }

// async function validate(_context, _event) {
//   // TODO: Implement the validate function
//   // ---
//   return new Promise((resolve, reject) => {
//     const errors = null;
//     if (errors?.length) {
//       reject({ error: errors });
//     } else {
//       resolve(model);
//     }
//   });
// }

// -----------------------------------------------------------------------------

export default {
  search,
  getClientDomains
};
