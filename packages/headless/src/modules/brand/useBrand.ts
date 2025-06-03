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
  get,
  pick,
  isArray,
  find,
  some,
  first,
  isEmpty,
  isObject,
  reduce,
  set,
} from "lodash-es";

// --- types

import {
  BrandTaxType,
  BrandConfigKeys,
  ILanguage,
} from "@upmind-automation/types";

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

  const hasModuleEnabled = (code: string) =>
    some(state.value.context?.modules, ["code", code]);

  const meta = computed(() => ({
    hasErrors: [
      "organisation.error",
      "config.error",
      "settings.error",
      "modules.error",
      "currencies.error",
    ].some(state.value.matches),
    isComplete: state.value.matches("complete"),
    isLoading: state.value.matches("processing"),
    isAvailable: [
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
    ].some(state.value.matches),
  }));

  // --- context

  const brandId = computed(() => state.value.context?.id);

  const context = computed(() => state.value.context);

  const defaultCurrency = computed(() => {
    return (
      find(state.value.context?.currencies, [
        "id",
        state.value.context?.currency_id,
      ]) || first(state.value.context?.currencies)
    );
  });

  const defaultPaymentPeriod = computed(() =>
    get(state.value.context, BrandConfigKeys.DEFAULT_PAYMENT_PERIOD, 0)
  );

  const errors = computed(() => state.value.context?.error);

  const includesTax = computed(() => taxType.value != BrandTaxType.EXCLUDE_TAX);

  const responses = computed(() =>
    reduce(
      state.value.context,
      (result: Record<string, any>, value, key) => {
        if (key === "error") return result;
        if (isArray(value) || isObject(value)) {
          set(result as object, key, value);
        } else {
          set(result as object, `values.${key}`, value);
        }
        return result;
      },
      { values: {} } as Record<string, any>
    )
  );

  const taxType = computed(() => state.value.context?.tax_type);

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

  const getAnalytics = async () =>
    isReady().then(() =>
      ensureConfig([
        BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID,
        BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID,
      ]).then((data: any) => data?.analytics)
    );

  const getConfig = (
    keys: BrandConfigKeys | BrandConfigKeys[]
  ): Record<string, any> => {
    keys = isArray(keys) ? keys : [keys];
    return pick(state.value.context, keys);
  };

  const getCountry = () => state.value.context?.country_id;

  const getCurrencies = () => state.value.context?.currencies;

  const getCurrency = () =>
    find(state.value.context.currencies, [
      "id",
      state.value.context?.currency_id,
    ]);

  const getCurrencyId = () => state.value.context?.currency_id;

  const getLanguage = (): ILanguage => {
    const languages = get(state, "context.settings.languages");
    const language_id = get(state, "context.settings.language_id");
    return (find(languages, ["id", language_id]) ||
      first(languages)) as ILanguage;
  };

  const getLanguages = (): ILanguage[] => {
    return get(state, "context.languages", []);
  };

  const validateCurrency = async (model: { id?: string; code?: string }) => {
    await waitFor(service, state => state.matches("complete")).catch(() => {
      throw new DetailedError(
        "[headless] validateCurrency on useBrand timed out",
        responseCodes.Timeout
      );
    });
    if (!state.value.context?.currencies?.length) return model;
    const defaultCurrency =
      find(state.value.context?.currencies, [
        "id",
        state.value.context?.currency_id,
      ]) || first(state.value.context?.currencies);
    if (
      isEmpty(model) ||
      !some(
        state.value.context?.currencies,
        ({ id, code }) => id === model?.id || code === model?.code
      )
    )
      return defaultCurrency;
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
     * Computed meta information about the brand state (errors, loading, etc).
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
     * The default currency object for the brand.
     */
    defaultCurrency,

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
     * All context values and objects, grouped for easy access.
     */
    responses,

    /**
     * The tax type for the brand.
     */
    taxType,

    // --- methods
    /**
     * Ensures the given config keys are loaded and returns their values.
     * @param keys - One or more BrandConfigKeys to ensure are loaded.
     * @returns A promise resolving to a record of config key-value pairs.
     */
    ensureConfig,

    /**
     * Loads analytics config for the brand (GA/GTM IDs).
     * @returns A promise resolving to the analytics config object or undefined.
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
     * Gets the country ID for the brand.
     * @returns The country ID string or undefined.
     */
    getCountry,

    /**
     * Gets the list of available currencies for the brand.
     * @returns An array of currency objects or undefined.
     */
    getCurrencies,

    /**
     * Gets the current currency object for the brand.
     * @returns The currency object or undefined.
     */
    getCurrency,

    /**
     * Gets the current currency ID for the brand.
     * @returns The currency ID string or undefined.
     */
    getCurrencyId,

    /**
     * Gets the current language object for the brand.
     * @returns The language object.
     */
    getLanguage,

    /**
     * Gets the list of available languages for the brand.
     * @returns An array of language objects.
     */
    getLanguages,

    getLocale,

    /**
     * Validates and returns a supported currency object, or the default.
     * @param model - The currency model to validate ({ id?: string, code?: string }).
     * @returns A promise resolving to a valid currency object.
     */
    validateCurrency,

    /**
     * Validates and returns a supported language object, or the default.
     * @param model - The language model to validate ({ id?: string, code?: string }).
     * @returns A promise resolving to a valid language object or undefined.
     */
    validateLanguage,

    // --- utils
    // (none currently)
  };
};

/**
 * The return type of useBrand composable.
 */
export type UseBrand = ReturnType<typeof useBrand>;
