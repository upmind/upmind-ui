// --- external

// --- internal
import { useApi } from "../api";

// --- utils
import { parseDomain, parseAvailable, parseSld } from "./utils";
import { isEmpty, omitBy, map } from "lodash-es";

// --- types
import type { DomainContext } from "./types";

// --------------------------------------------------------

function search({ promotions, currency, controller, search }: DomainContext) {
  const { get, useUrl } = useApi();

  if (!search?.query?.length) return Promise.reject("No query provided");

  const sld = parseSld(search.query);

  // --- Build the request, and Fetch the search results
  const params = omitBy(
    {
      sld,
      with: ["prices", "options", "options.prices", "attributes"].join(),
      limit: search?.limit?.toString(),
      offset: search.offset?.toString(),
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
  }).then(({ data, total }: any) => {
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
  }).then(({ data }: any) =>
    map(data, ({ domain_name }) => parseDomain(domain_name))
  );
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
};
