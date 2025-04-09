// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import brandMachine from "./brand.machine";

// --- utils
import { get, pick, isArray, find, some, first, isEmpty } from "lodash-es";

// --- types

import {
  BrandTaxType,
  IBrand,
  BrandConfigKeys,
  ILanguage,
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// create a global instance of the brand machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(brandMachine, { devTools: false });

// -----------------------------------------------------------------------------

export const useBrand = () => {
  // ---  // methods
  const hasModuleEnabled = (code: string) =>
    some(service.getSnapshot()?.context?.modules, ["code", code]);
  // ---
  const isModuleReady = async (module: string) =>
    waitFor(service, state => state.matches(`processing.${module}.complete`));

  const isReady = async () =>
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

      return state;
    });

  const getConfig = async (keys: BrandConfigKeys | BrandConfigKeys[]) => {
    const state = service.getSnapshot();
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
    return pick(service.getSnapshot().context, keys);
  };

  const getAnayltics = async () =>
    isReady().then(() =>
      getConfig([
        BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID,
        BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID,
      ]).then((data: any) => data?.analytics)
    );

  const validateCurrency = async (model: { id?: string; code?: string }) => {
    const state = service.getSnapshot();
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
  };

  const getBrandId = (): IBrand["id"] => service.getSnapshot()?.context?.id;

  const getLanguage = (): ILanguage => {
    const state = service.getSnapshot();
    const languages = get(state, "context.settings.languages");
    const language_id = get(state, "context.settings.language_id");
    return (find(languages, ["id", language_id]) ||
      first(languages)) as ILanguage;
  };

  const getLanguages = (): ILanguage[] => {
    const state = service.getSnapshot();
    return get(state, "context.languages", []);
  };

  const validateLanguage = async (model: {
    id?: string;
    code?: string;
  }): Promise<ILanguage | undefined> => {
    const state = service.getSnapshot();
    const languages = get(state, "context.languages", []);

    // if we dont have any languages, then just return the given currency
    if (isEmpty(languages)) return undefined;

    // otherwise we need to validate the given currency
    // and possibly fallback to the default/first available currency
    const defaultLanguage =
      find(languages, ["id", state?.context?.language_id]) || first(languages);

    // if we dont have a given currency,
    // OR the given currency is not one of the available languages,
    // then we return the default currency
    const found = find(
      languages,
      ({ id, code }) =>
        id === model?.id ||
        code.toLocaleLowerCase() === model?.code?.toLocaleLowerCase()
    );

    if (isEmpty(found)) return defaultLanguage;

    // othrwise we clearly have a valid currency and we return it
    return found;
  };

  // ---

  const getCurrencyId = () => service.getSnapshot()?.context?.currency_id;

  const getCurrency = () =>
    find(service.getSnapshot().context.currencies, [
      "id",
      service.getSnapshot()?.context?.currency_id,
    ]);

  const getCurrencies = () => service.getSnapshot()?.context?.currencies;

  const getCountry = () => service.getSnapshot()?.context?.country_id;

  // ---

  const getDefaultPaymentPeriod = () =>
    get(
      service.getSnapshot()?.context,
      BrandConfigKeys.DEFAULT_PAYMENT_PERIOD,
      0
    );

  // ---

  const getTaxType = () => service.getSnapshot()?.context?.tax_type;

  const checkIncludesTax = () =>
    service.getSnapshot()?.context?.tax_type != BrandTaxType.EXCLUDE_TAX;

  // ---------------------------------------------------------------------------
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: service.getSnapshot,
    hasModuleEnabled,
    isModuleReady,
    isReady,
    getConfig,
    getAnayltics,
    validateCurrency,
    getBrandId,
    getLanguage,
    getLanguages,
    validateLanguage,
    getCurrencyId,
    getCurrency,
    getCurrencies,
    getCountry,
    getTaxType,
    checkIncludesTax,
    getDefaultPaymentPeriod,
  };
};
