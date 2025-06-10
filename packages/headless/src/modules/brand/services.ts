// --- internal
import { useQuery } from "../..";

// --- utils
import { filter, has, reduce, defaultsDeep } from "lodash-es";
import { useTime } from "../../utils";
import { AnyEventObject } from "xstate";
import { BrandContext } from "./types";

// -----------------------------------------------------------------------------

async function fetchOrganisationConfig(
  context: BrandContext,
  _event: AnyEventObject
) {
  const { get, useUrl } = useQuery();
  return get({
    url: useUrl("config/organisation/values", {
      keys: context.keys.organisation.join(),
    }),
    queryKey: ["brand", "organisation", "config"],
    staleTime: useTime()?.DAY,
  });
}

async function fetchBrandSettings(
  _context: BrandContext,
  _event: AnyEventObject
) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("brand/settings", {}),
    queryKey: ["brand", "settings"],
    staleTime: useTime()?.DAY,
  });
}

// brand config is slightly different because we can ask for more config fro mthe api
// than what we initially requested, this allows us to only request config as we need it
async function fetchBrandConfig(context: BrandContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery();

  // only request keys that are missing from the state, if any
  const missingKeys = filter(context.keys.config, key => !has(context, key));

  // if we dont have any missing keys, we can return the current state
  if (!missingKeys.length) return Promise.resolve();

  return get({
    url: useUrl("config/brand/values", {
      keys: missingKeys.join(),
    }),
    queryKey: ["brand", "config", ...missingKeys],
    staleTime: 0,
    gcTime: 0,
  }).then(data => {
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

async function fetchModules(_context: BrandContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("org/modules", {}),
    queryKey: ["brand", "modules"],
    staleTime: useTime()?.DAY,
  });
}

async function load(context: BrandContext, _event: AnyEventObject) {
  return Promise.all([
    fetchOrganisationConfig(context, _event),
    fetchBrandSettings(context, _event),
    fetchBrandConfig(context, _event),
    fetchModules(context, _event),
  ]).then(([organisationConfig, brandSettings, brandConfig, modules]) => {
    return {
      ...(organisationConfig || {}),
      ...(brandSettings || {}),
      ...(brandConfig || {}),
      modules,
    };
  });
}
// -----------------------------------------------------------------------------

export default {
  load,
  fetchBrandConfig,
};
