// --- external

// --- internal
import { useQuery, useQueryPaginated } from "../..";

// --- utils
import { isEmpty, map, omitBy } from "lodash-es";
import { parseAvailable, parseDomain, parseSld } from "./utils";

// --- types
import type { IProduct } from "@upmind-automation/types";
import type { DomainContext, DomainProduct } from "./types";

// -----------------------------------------------------------------------------

async function search({
  search,
  currency,
  controller,
  promotions,
  preferredCycle,
}: DomainContext) {
  const { get, useUrl } = useQueryPaginated();
  if (!search?.query?.length) return Promise.reject("No query provided");
  const sld = parseSld(search.query);

  // lets ensure we parse our promotions correctly
  const promocodes = map(promotions, "promotion.code").join();

  // --- Build the request, and Fetch the search results
  const params = omitBy(
    {
      sld,
      with: ["prices", "options", "options.prices", "attributes"].join(),
      currency_code: currency,
      // tld,
      promotions: promocodes,
    },
    isEmpty
  );

  return get<IProduct[]>({
    url: useUrl("modules/web_hosting/domains/search", params),
    init: { signal: controller?.signal },
    queryKey: [
      "domain",
      "search",
      { sld, params, limit: search?.limit, offset: search.offset },
    ],
    pagination: {
      limit: search?.limit,
      offset: search.offset,
    },
    staleTime: 0,
    gcTime: 0,
  }).then(async response => {
    return {
      total: response.itemTotal,
      available: await parseAvailable(sld, response.data ?? [], preferredCycle),
    };
  });
}

function getClientDomains({ controller }: DomainContext) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("modules/web_hosting/domains/client_domains"),
    init: { signal: controller?.signal },
    queryKey: ["domain", "client-domains"],
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0,
  }).then(({ data }: any) =>
    map(data, ({ domain_name }) => parseDomain(domain_name))
  );
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
  getClientDomains,
};
