// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import brandMachine from "./brand.machine";
import type { BrandConfigKeys } from "./services";
export { BrandConfigKeys } from "./services";
import type { IBrand } from "@upmind-automation/types";

// --- utils
import { pick, isArray, find, some, first, isEmpty } from "lodash-es";

// --- types
import { BrandTaxType } from "@upmind-automation/types";

// --------------------------------------------------------
// create a global instance of the brand machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state: any = null;

// @ts-ignore
const service = interpret(brandMachine, { devTools: false }).onTransition(
  newState => (state = newState)
);
// --------------------------------------------------------

export const useBrand = () => {
  // --------------------------------------------------------
  // methods
  const hasModuleEnabled = (code: any) =>
    some(state?.context?.modules, ["code", code]);
  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---

    isModuleReady: async (module: any) =>
      // @ts-ignore
      waitFor(service, state => state.matches(`processing.${module}.complete`)),
    isReady: async () =>
      waitFor(
        service,
        state => {
          return ["complete", "error"].some(state.matches);
        },
        {
          timeout: Infinity,
        }
      ).then(state => {
        if (["error"].some(state.matches))
          return Promise.reject("Brand is not available");
      }),
    // ---
    getSnapshot: () => state,
    getConfig: async (keys: BrandConfigKeys | BrandConfigKeys[]) => {
      // ensure we have an array of keys
      keys = isArray(keys) ? keys : [keys];

      // request the keys from the machine,
      // It will handle any keys that have already been requested
      service.send({ type: "CONFIG.GET", data: keys });

      // then we await the state of the request to be processed/cached
      await waitFor(service, newstate => {
        return [
          "processing.config.complete",
          "processing.config.error",
          "complete",
        ].some(newstate.matches);
      });

      // finally return the requested keys from the config
      return pick(state.context, keys);
    },
    // ---
    hasModuleEnabled,
    validateCurrency: async (model: { id?: string; code?: string }) => {
      // lets wait for the brand to be ready
      await waitFor(service, state => state.matches("complete"));

      // if we dont have any currencies, then just return the given currency
      if (!state?.context?.currencies?.length) return model;

      // otherwise we need to validate the given currency
      // and possibly fallback to the default/first available currency
      const defaultCurrency =
        find(state?.context?.currencies, ["id", state?.context?.currency_id]) ||
        first(state?.context?.currencies);

      // if we dont have a given currency,
      // OR the given currency is not one of the available currencies,
      // then we return the default currency
      if (
        isEmpty(model) ||
        !some(
          state?.context?.currencies,
          ({ id, code }) => id === model?.id || code === model?.code
        )
      )
        return defaultCurrency;

      // othrwise we clearly have a valid currency and we return it
      return model;
    },

    getBrandId: (): IBrand["id"] => state?.context?.id,
    getCurrencyId: () => state?.context?.currency_id,
    getCurrency: () =>
      find(state.context.currencies, ["id", state?.context?.currency_id]),
    getCurrencies: () => state?.context?.currencies,
    getCountry: () => state?.context?.country_id,
    // ---
    getTaxType: () => state?.context?.tax_type,
    checkIncludesTax: () =>
      state?.context?.tax_type != BrandTaxType.EXCLUDE_TAX,
  };
};
