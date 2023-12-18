// --- external

// --- internal
import { useApi } from "../api";

// --- utils
import { parseDomain, parseAvailable } from "./utils";
import { isEmpty, omitBy, map } from "lodash-es";

// --- types
import type { DomainContext } from "./types";

// --------------------------------------------------------

function search({
  promotions,
  currency,
  limit,
  controller,
  available,
  search,
  offset
}: DomainContext) {
  const { get, useUrl } = useApi();

  if (!search?.length) return Promise.reject("No domain provided");

  const { sld, tld } = parseDomain(search);

  // --- Build the request, and Fetch the search results
  const params = omitBy(
    {
      sld,
      with: ["prices", "options", "options.prices", "attributes"].join(),
      limit: limit?.toString(),
      offset: offset?.toString(),
      currency_code: currency,
      // tld,
      promotions: promotions?.join()
    },
    isEmpty
  );

  return get({
    url: useUrl("modules/web_hosting/domains/search", params),
    init: { signal: controller?.signal },
    useCache: true
  }).then(({ data, total }) => {
    return {
      available: parseAvailable(sld, data, available),
      total: total || 0
    };
  });
}

function getClientDomains({ controller }: DomainContext) {
  const { get, useUrl } = useApi();

  return get({
    url: useUrl("modules/web_hosting/domains/client_domains"),
    init: { signal: controller?.signal },
    useCache: true,
    withAccessToken: true
  }).then(({ data, total }) => {
    return {
      available: map(data, ({ domain_name }) => parseDomain(domain_name)),
      total: total || 0
    };
  });
}
// --------------------------------------------------------
// EXPORTS

export default {
  search,
  getClientDomains
};
