// --- internal
import { useApi } from "../api";

// --- utils
import { filter, has, reduce, defaultsDeep } from "lodash-es";

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// this will process the request and return a promise

async function fetchOrganisationConfig({ keys }: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("config/organisation/values", {
      keys: keys.organisation.join(),
    }),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

async function fetchBrandSettings(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("brand/settings", {}),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

// brand config is slightly different because we can ask for more config fro mthe api
// than what we initially requested, this allows us to only request config as we need it
async function fetchBrandConfig(context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  // only request keys that are missing from the state, if any
  const missingKeys = filter(context.keys.config, key => !has(context, key));

  if (!missingKeys.length) return Promise.resolve();

  return get({
    url: useUrl("config/brand/values", {
      keys: missingKeys.join(),
    }),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => {
    // create an object template with ALL the keys and set them to null
    // this is to ensure that the config object has all the keys that were requested
    const template = reduce(
      missingKeys,
      (acc, key) => {
        // @ts-ignore
        acc[key] = null;
        return acc;
      },
      {}
    );
    // now use the  tempalte as a fallback for the data
    return defaultsDeep(data, template);
  });
}

async function fetchModules(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("org/modules", {}),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  fetchOrganisationConfig,
  fetchBrandSettings,
  fetchBrandConfig,
  fetchModules,
};
