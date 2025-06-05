// --- external

import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal

import brandMachine from "./brand.machine";

// --- utils

import { DetailedError, UnavailableError, responseCodes } from "../../utils";
import {
  useContext,
  contextValue,
  contextMatches,
  stateMatches,
} from "../../utils";
import { get, pick, isArray, find, some, first, isEmpty } from "lodash-es";

// --- types

import {
  BrandTaxType,
  BrandConfigKeys,
  ILanguage,
  ICurrency,
  DefaultPaymentPeriod,
  ICountry,
  IBrand,
} from "@upmind-automation/types";
import { BrandContext } from "./types";
import { QueryResponseError } from "../query";
import { CurrencyModel } from "../basket/currency/types";

// -----------------------------------------------------------------------------

export const useBrand = () => {
  // --- state
  const service = interpret(brandMachine, { devTools: false }).start();
  const { state, send } = useActor(service);

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => ["complete", "error"].some(state.matches),
      {
        timeout: Infinity,
      }
    ).then(state => {
      if (["error"].some(state.matches)) {
        if (state.context.error?.status == responseCodes.Service_Unavailable) {
          return Promise.reject(new UnavailableError());
        }
        return false;
      }
      return true;
    });
  }

  function hasModuleEnabled(code: string): boolean {
    return some(state.value.context?.modules, ["code", code]);
  }

  const meta = computed(() => ({
    hasErrors: stateMatches(state, [
      "organisation.error",
      "config.error",
      "settings.error",
      "modules.error",
      "currencies.error",
    ]),
    isComplete: stateMatches(state, "complete"),
    isLoading: stateMatches(state, "processing"),
    isAvailable: stateMatches(state, [
      "processing.organisation.idle",
      "processing.config.idle",
      "processing.settings.idle",
      "processing.modules.idle",
      "processing.currencies.idle",
      "processing.organisation.complete",
      "processing.config.complete",
      "processing.settings.complete",
      "processing.modules.complete",
      "processing.currencies.complete",
    ]),
  }));

  // --- context

  const brandId = useContext<IBrand["id"]>(state, "id");

  const context = useContext<BrandContext>(state);

  const countryId = useContext<ICountry["id"]>(state, "country_id");

  const currencyId = useContext<ICurrency["id"]>(state, "currency_id");

  const currencies = useContext<ICurrency[]>(state, "currencies", []);

  const currency = computed(
    (): ICurrency | undefined =>
      find(currencies.value, ["id", currencyId.value]) ||
      (first(state.value.context?.currencies) as ICurrency | undefined)
  );

  const defaultPaymentPeriod = useContext<DefaultPaymentPeriod>(
    state,
    BrandConfigKeys.DEFAULT_PAYMENT_PERIOD,
    0
  );

  const errors = useContext<QueryResponseError>(state, "error");

  const includesTax = computed(
    (): boolean =>
      !contextMatches(state, ["includes_tax"], BrandTaxType.EXCLUDE_TAX)
  );

  const languages = useContext<ILanguage[]>(state, "languages", []);

  const language = computed((): ILanguage | undefined => {
    const language_id = contextValue<ILanguage["id"]>(
      state,
      "settings.language_id"
    );
    return (find(languages.value, ["id", language_id]) ||
      first(languages.value)) as ILanguage | undefined;
  });

  const taxType = useContext<BrandTaxType>(state, "tax_type");

  // --- methods

  const ensureConfig = async (
    keys: BrandConfigKeys | BrandConfigKeys[]
  ): Promise<Record<string, any>> => {
    keys = isArray(keys) ? keys : [keys];
    send({ type: "CONFIG.GET", data: keys });
    await waitFor(service, newstate =>
      [
        "processing.config.complete",
        "processing.config.error",
        "complete",
      ].some(newstate.matches)
    ).catch(() => {
      throw new DetailedError(
        `[headless] getConfig on brand timed out for ${keys.join(", ")}`,
        responseCodes.Timeout
      );
    });
    return pick(state.value.context, keys);
  };

  const getAnalytics = async (): Promise<Record<string, any>> =>
    isReady().then(() =>
      ensureConfig([
        BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID,
        BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID,
      ]).then((data: any) => data?.analytics || {})
    );

  const getConfig = (
    keys: BrandConfigKeys | BrandConfigKeys[]
  ): Record<string, any> => {
    keys = isArray(keys) ? keys : [keys];
    return contextValue<Record<string, any>>(state, keys, {}) ?? {};
  };

  const validateCurrency = async (
    model: CurrencyModel
  ): Promise<Partial<ICurrency> | ICurrency | undefined> => {
    await isReady();

    if (isEmpty(currencies.value)) return model as Partial<ICurrency>;

    if (
      isEmpty(model) ||
      !some(
        currencies.value,
        ({ id, code }) => id === model?.id || code === model?.code
      )
    )
      return currency.value as ICurrency | undefined;

    return model;
  };

  const validateLanguage = async (model: {
    id?: string;
    code?: string;
  }): Promise<ILanguage | undefined> => {
    const languages = get(state.value, "context.languages", []);

    // if we dont have any languages, then just return the given currency
    if (isEmpty(languages)) return undefined;

    // otherwise we need to validate the given currency
    // and possibly fallback to the default/first available currency
    const defaultLanguage =
      find(languages, ["id", state.value.context?.language_id]) ||
      first(languages);

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

  // --- utils

  // (none currently)

  return {
    // --- state

    /**
     * Resolves when the brand service is ready or errors.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Checks if a module is enabled for the current brand.
     * @param {string} code - The module code to check.
     * @returns {boolean} True if the module is enabled, false otherwise.
     */
    hasModuleEnabled,

    /**
     * Meta information about the brand state.
     * @typedef {Object} BrandMeta
     * @property {boolean} hasErrors - Indicates if there are any errors in the brand process.
     * @property {boolean} isComplete - Indicates if the brand process is complete.
     * @property {boolean} isLoading - Indicates if the brand is currently loading.
     * @property {boolean} isAvailable - Indicates if the brand is available for use.
     */
    meta,

    // --- context

    /**
     * The current brand ID.
     */
    brandId,

    /**
     * The full brand context from the XState machine.
     */
    context,

    /**
     * The default payment period for the brand.
     */
    defaultPaymentPeriod,

    /**
     * Any error object from the brand state.
     */
    errors,

    /**
     * Whether the brand includes tax by default.
     */
    includesTax,

    /**
     * The tax type for the brand.
     */
    taxType,

    /**
     * The country ID for the brand.
     */
    countryId,

    /**
     * The current currency object for the brand.
     */
    currency,

    /**
     * The currency ID for the brand.
     */
    currencyId,

    /**
     * The list of all supported currencies for the brand.
     */
    currencies,

    /**
     * The current language object for the brand.
     */
    language,

    /**
     * The  list of all supported languages for the brand.
     */
    languages,

    // --- methods

    /**
     * Ensures the given config keys are loaded and returns their values.
     * @param keys - One or more BrandConfigKeys to ensure are loaded.
     * @returns { Promise<Record<string, any>> } A promise resolving to a record of config key-value pairs.
     * @throws {DetailedError} If the config keys are not available in the context or if the request times out.
     */
    ensureConfig,

    /**
     * Loads analytics config for the brand (GA/GTM IDs).
     * @returns {Promise<Record<string, any>>} A promise resolving to the analytics config object or undefined.
     */
    getAnalytics,

    /**
     * This method will return the requested keys from the config,
     * It assumes that the keys are already in context in the state machine.
     * It will not request the keys from the API if they are not already in context.
     * It will also not wait for the state of the request to be processed/cached
     * before returning the requested keys.
     * @param keys - The keys to request from the config
     * @returns {Record<string, any>} An object containing the requested keys and their values.
     * @throws {DetailedError} If the keys are not available in the context.
     */
    getConfig,

    /**
     * Validates and returns a supported currency object, or the default.
     * @param model  The currency model to validate ({ id?: string, code?: string }).
     * @returns {Promise<Partial<ICurrency> | ICurrency | undefined>} A promise resolving to a valid currency object or undefined.
     * @throws {DetailedError} If the currencies are not available in the context.
     */
    validateCurrency,

    /**
     * Validates and returns a supported language object, or the default.
     * @param model - The language model to validate ({ id?: string, code?: string }).
     * @returns {  Promise<ILanguage | undefined>} A promise resolving to a valid language object or undefined.
     * @throws {DetailedError} If the languages are not available in the context.
     */
    validateLanguage,
  };
};

/**
 * The return type of useBrand composable.
 */
export type UseBrand = ReturnType<typeof useBrand>;
