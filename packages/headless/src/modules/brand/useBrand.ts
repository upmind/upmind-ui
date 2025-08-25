// --- external
import { toRaw, computed, unref } from "vue";

// --- internal
import services from "./services";
import { useRoutingEngine } from "../routing";
import useUpmind, { ROUTE, invalidateQueryByKey } from "../../";

// --- utils
import {
  get,
  has,
  pick,
  find,
  some,
  first,
  every,
  reduce,
  isArray,
  isEmpty,
  forEach
} from "lodash-es";

// --- types
import {
  type ILanguage,
  type ICurrency,
  BrandTaxTypes,
  BrandConfigKeys,
  DefaultPaymentPeriod,
  IBrandSettings
} from "@upmind-automation/types";
import type { IBrandMeta } from "./types";
import type { CurrencyModel } from "../basket/currency/types";

// -----------------------------------------------------------------------------
/**
 * Context to let us understand if we need to refetch on the inital use of Brand settings
 * We do this because settings are persisted for fast load times but we still need
 * to ensure that we get the latest settings in the background
 *
 */
let initialised = false;

export const useBrand = () => {
  // --- state

  const modulesQuery = services.fetchModules();
  const brandConfigQuery = services.fetchBrandConfig();
  const brandSettingsQuery = services.fetchBrandSettings();
  const organisationConfigQuery = services.fetchOrganisationConfig();

  const queries = [
    modulesQuery,
    brandConfigQuery,
    brandSettingsQuery,
    organisationConfigQuery
  ];

  const meta = computed(() => ({
    isEmpty: some(queries, q => isEmpty(toRaw(q?.data?.value))),
    hasError: some(queries, "isError.value"),
    isLoading: some(queries, "isLoading.value"),
    isComplete: every(queries, "isFetched.value"),
    isAvailable: has(brandSettingsQuery?.data?.value, "name")
  }));

  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (meta.value.isComplete) {
          clearInterval(interval);

          // after first load, ensure we refetch our data in the background
          if (!initialised) {
            refresh();
            initialised = true;
          }

          resolve(!meta.value.hasError);
        }
      }, 100);
    });
  }

  const modules = computed(() => modulesQuery?.data.value);
  const brandConfig = computed(() => brandConfigQuery?.data.value);
  const brandSettings = computed(() => brandSettingsQuery?.data.value);
  const organisationConfig = computed(
    () => organisationConfigQuery?.data.value
  );

  function hasModuleEnabled(code: string): boolean {
    return some(modules.value, ["code", code]);
  }

  // --- context

  const brandId = computed(() => brandSettings.value?.id);

  const name = computed(() => brandSettings.value?.name);

  const countryId = computed(() => brandSettings.value?.country_id);

  const currencyId = computed(() => brandSettings.value?.currency_id);

  const currencies = computed(() => brandSettings.value?.currencies || []);

  const image = computed(() => brandSettings.value?.image);

  const styles = computed(() => brandSettings.value?.style);

  const favicon = computed(() => brandSettings.value?.favicon);

  const uiTheme = computed(
    (): {
      variants: IBrandMeta["variants"];
      variant: IBrandMeta["variant"];
    } => {
      const variants = get(brandSettings.value, "meta.variants", {});
      const variant = get(brandSettings.value, "meta.variant");

      return {
        variant,
        variants
      };
    }
  );

  const uiCart = computed<IBrandMeta["cart"]>(
    () => get(brandSettings.value, "meta.cart") as any
  );

  const currency = computed<ICurrency | undefined>(
    () =>
      find(currencies.value, ["id", currencyId.value]) ||
      (first(brandSettings.value?.currencies) as ICurrency | undefined)
  );

  const defaultPaymentPeriod = computed(
    () =>
      get(
        brandConfig.value,
        BrandConfigKeys.DEFAULT_PAYMENT_PERIOD,
        0
      ) as DefaultPaymentPeriod
  );

  const errors = computed(() =>
    reduce(
      queries,
      (acc, q) => {
        if (q && q.isError && !isEmpty(q.error)) {
          acc.push(q.error.value);
        }
        return acc;
      },
      [] as (Error | null)[]
    )
  );

  const includesTax = computed(
    (): boolean =>
      get(brandSettings.value, "tax_type") !== BrandTaxTypes.EXCLUDE_TAX
  );

  const languages = computed(() => brandSettings.value?.languages || []);

  const language = computed((): ILanguage | undefined => {
    const languageId = get(brandSettings.value, "language_id");
    return (find(languages.value, ["id", languageId]) ||
      first(languages.value)) as ILanguage | undefined;
  });

  const taxType = computed(() => brandSettings.value?.tax_type);

  const storefrontUrl = computed((): string => {
    const { router } = useRoutingEngine();

    const url = useUpmind.storefrontUrl ?? uiCart.value?.storefront_url;
    if (url) return url;

    if (!uiCart.value?.catalogue?.disabled && router?.hasRoute(ROUTE.CATALOGUE))
      return router.resolve({ name: ROUTE.CATALOGUE })?.fullPath;

    return router?.hasRoute(ROUTE.BASKET)
      ? router.resolve({ name: ROUTE.BASKET })?.fullPath
      : "/";
  });

  const hasStorefront = computed(() => {
    const { router } = useRoutingEngine();

    const externalUrl = !(
      useUpmind.storefrontUrl ?? uiCart.value?.storefront_url
    );

    const enabled = !uiCart.value?.catalogue?.disabled;
    const hasRoute = router?.hasRoute(ROUTE.CATALOGUE);

    return !(externalUrl && enabled && hasRoute);
  });

  // --- methods

  const ensureConfig = async (
    keys: BrandConfigKeys | BrandConfigKeys[]
  ): Promise<Record<string, any>> => {
    keys = isArray(keys) ? keys : [keys];

    return (
      services
        .fetchBrandConfig(keys)
        ?.promise.value.then(data => pick(data, keys)) ?? {}
    );
  };

  const getAnalytics = async (): Promise<Record<string, any>> =>
    isReady().then(() =>
      ensureConfig([
        BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID,
        BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID
      ]).then((data: any) => data || {})
    );

  const getConfig = (
    keys: BrandConfigKeys | BrandConfigKeys[]
  ): Record<string, any> => {
    keys = isArray(keys) ? keys : [keys];
    // This method assumes keys are already in the context, so pick them
    return pick(brandConfig.value, keys) ?? {};
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
    const currentLanguages = languages.value;

    if (isEmpty(currentLanguages)) return model as ILanguage | undefined;

    const defaultLanguage =
      find(currentLanguages, ["id", brandSettings.value?.language_id]) ||
      first(currentLanguages);

    const found = find(
      currentLanguages,
      ({ id, code }) =>
        id === model?.id ||
        code?.toLocaleLowerCase() === model?.code?.toLocaleLowerCase()
    );

    if (isEmpty(found)) return defaultLanguage;

    return found;
  };

  // --- Utility methods for cache management and re-fetching
  const refresh = async () => {
    // Invalidate all related queries that feed into state via services.ts
    forEach(queries, q => q?.refetch());
  };

  const invalidate = () => {
    // A broader invalidating for anything under the "brand" query key namespace
    invalidateQueryByKey(["brand"], { exact: false });
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
     * Meta-information about the brand state.
     * @type {Object} BrandMeta
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
     * The current brand name.
     */
    name,

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
     * The current image object for the brand.
     */
    image,

    /**
     * The current styles object for the brand.
     */
    styles,

    /**
     * The current favicon object for the brand.
     */
    favicon,

    /**
     * The current theming object for the brand.
     */
    uiTheme,

    /**
     * The current cart meta object for the brand.
     */
    uiCart,

    /**
     * The URL of the storefront for the brand.
     * This is derived from the cart meta or environment variable.
     */
    storefrontUrl,

    /**
     * Returns boolean indicating if the brand has a storefront URL.
     * This is derived from the meta, environment and router configuration.
     */
    hasStorefront,

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

    /**
     * Refreshes the brand state by re-fetching all related queries.
     * This will invalidate the current brand state and re-fetch it from the API.
     * It will also reset the initialized flag to force a re-run of the initial load
     * logic, ensuring all brand data is up to date.
     * @returns {Promise<void>} A promise that resolves when the brand state is refreshed.
     * @throws {DetailedError} If the refresh fails.
     */
    refresh,

    /**
     * Invalidates the brand state and all related queries.
     * This will clear the current brand state and re-fetch it from the API.
     * It is useful for clearing the brand state and forcing a re-fetch of all brand data
     * without resetting the initialized flag.
     * @returns {void}
     * @throws {DetailedError} If the invalidating fails.
     */
    invalidate
  };
};

/**
 * The return type of useBrand composable.
 */
export type UseBrand = ReturnType<typeof useBrand>;
