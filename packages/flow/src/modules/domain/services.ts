// --- external

// --- internal
import { useApi } from "../api";
import { useSession } from "../session";

// --- utils
import { parseDomain, parseAvailable, parseSld } from "./utils";
import { isEmpty, omitBy, map } from "lodash-es";

// --- types
import type { DomainContext } from "./types.d";

// --------------------------------------------------------

function search({
  promotions,
  currency,
  limit,
  controller,
  search,
  offset,
}: DomainContext) {
  const { get, useUrl } = useApi();

  if (!search?.length) return Promise.reject("No domain provided");

  const sld = parseSld(search);

  // --- Build the request, and Fetch the search results
  const params = omitBy(
    {
      sld,
      with: ["prices", "options", "options.prices", "attributes"].join(),
      limit: limit?.toString(),
      offset: offset?.toString(),
      currency_code: currency,
      // tld,
      promotions: promotions?.join(),
    },
    isEmpty
  );

  return get({
    url: useUrl("modules/web_hosting/domains/search", params),
    init: { signal: controller?.signal },
    useCache: true,
  }).then(({ data, total }) => {
    return {
      available: parseAvailable(sld, data),
      total: total || 0,
    };
  });
}

function getClientDomains({ controller }: DomainContext) {
  const { get, useUrl } = useApi();

  return get({
    url: useUrl("modules/web_hosting/domains/client_domains"),
    init: { signal: controller?.signal },
    useCache: true,
    withAccessToken: true,
  }).then(({ data, total }) => {
    return {
      available: map(data, ({ domain_name }) => parseDomain(domain_name)),
      total: total || 0,
    };
  });
}
// --------------------------------------------------------

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

// --------------------------------------------------------
// EXPORTS

export default {
  search,
  getClientDomains,
  authSubscription: (context, event) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
