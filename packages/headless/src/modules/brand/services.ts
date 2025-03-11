// --- internal
import { useQuery } from "../..";

// --- utils
import { filter, has, reduce, defaultsDeep } from "lodash-es";
import { useTime } from "../../utils";

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// this will process the request and return a promise

async function fetchOrganisationConfig({ keys }: any, _event: any) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("config/organisation/values", {
      keys: keys.organisation.join(),
    }),
    queryKey: ["brand", "organisation", "config"],
    staleTime: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

async function fetchBrandSettings(_context: any, _event: any) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("brand/settings", {}),
    queryKey: ["brand", "settings"],
    staleTime: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

// brand config is slightly different because we can ask for more config fro mthe api
// than what we initially requested, this allows us to only request config as we need it
async function fetchBrandConfig(context: any, _event: any) {
  const { get, useUrl } = useQuery();

  // only request keys that are missing from the state, if any
  const missingKeys = filter(context.keys.config, key => !has(context, key));

  if (!missingKeys.length) return Promise.resolve();

  return get({
    url: useUrl("config/brand/values", {
      keys: missingKeys.join(),
    }),
    queryKey: ["brand", "config"],
    staleTime: useTime()?.DAY,
  }).then(({ data }: any) => {
    // create an object template with ALL the keys and set them to null
    // this is to ensure that the config object has all the keys that were requested
    const template = reduce(
      missingKeys,
      (acc: { [key: string]: any }, key: string) => {
        acc[key] = null;
        return acc;
      },
      {}
    );
    // now use the  template as a fallback for the data
    return defaultsDeep(data, template);
  });
}

async function fetchModules(_context: any, _event: any) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("org/modules", {}),
    queryKey: ["brand", "modules"],
    staleTime: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default {
  fetchOrganisationConfig,
  fetchBrandSettings,
  fetchBrandConfig,
  fetchModules,
};
