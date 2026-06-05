// --- external
import { toRaw, computed } from "vue";

// --- internal
import services from "./services";
import { useConfig } from "../config";
import useUpmind, { invalidateQueryByKey } from "../../";

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
  capitalize,
  isArray,
  isEmpty,
  forEach,
  includes,
  keys,
  sortBy
} from "lodash-es";

// --- types
import {
  type ILanguage,
  type ICurrency,
  BasketFunnelling,
  BrandTaxTypes,
  BrandConfigKeys,
  DefaultPaymentPeriod,
  OrgFeatureKeys,
  UpmindModuleCodes
} from "@upmind-automation/types";
import type { BrandMeta } from "./types";
import type { CurrencyModel } from "../basket/currency/types";

/**
 * Context to let us understand if we need to refetch on the initial use of Brand settings
 * We do this because settings are persisted for fast load times, but we still need
 * to ensure that we get the latest settings in the background
 * NB:check if we actually have any persisted settings first
 *
 */
let needsRefresh =
  typeof localStorage !== "undefined"
    ? some(keys(localStorage), key => includes(key, `"brand","settings"`))
    : false;

// ---  singleton queries to prevent multiple fetches
let modulesQuery: ReturnType<typeof services.fetchModules>;
let brandConfigQuery: ReturnType<typeof services.fetchBrandConfig>;
let brandSettingsQuery: ReturnType<typeof services.fetchBrandSettings>;
let organisationConfigQuery: ReturnType<
  typeof services.fetchOrganisationConfig
>;
let config: ReturnType<typeof useConfig>;

// -----------------------------------------------------------------------------

/**
 * Composable function to access and manage brand-related data and configurations.
 * It fetches modules, brand configurations, brand settings, and organisation configurations
 * to provide a unified interface for brand-related information.
 *
 * @returns An object containing brand data, meta-information, and utility methods.
 */
export const useBrand = () => {
  modulesQuery ??= services.fetchModules();
  brandConfigQuery ??= services.fetchBrandConfig();
  brandSettingsQuery ??= services.fetchBrandSettings();
  organisationConfigQuery ??= services.fetchOrganisationConfig();

  // --- state

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

  function hasModuleEnabled(code: UpmindModuleCodes): boolean {
    return some(modules.value, ["code", code]);
  }

  // --- context

  const brandId = computed(() => brandSettings.value?.id);

  const name = computed(() => brandSettings.value?.name);

  const countryId = computed(() => brandSettings.value?.country_id);

  const currencyId = computed(() => brandSettings.value?.currency_id);

  const currencies = computed(() =>
    sortBy(brandSettings.value?.currencies || [], ["code"])
  );

  const image = computed(() => brandSettings.value?.image);

  const styles = computed(() => brandSettings.value?.style);

  const favicon = computed(() => brandSettings.value?.favicon);

  const uiTheme = computed(
    (): {
      tokens: string;
      variant: BrandMeta["variant"];
    } => {
      const tokens = get(brandSettings.value, "style.tokens") as string;
      const variant = get(brandSettings.value, "meta.variant");
      const theme = get(brandSettings.value, "meta.theme");

      return {
        tokens,
        variant: variant ?? theme
      };
    }
  );

  const uiCart = computed<BrandMeta["cart"]>(
    () => get(brandSettings.value, "meta.cart") as BrandMeta["cart"]
  );

  const i18nMessages = computed<BrandMeta["i18n"]>(() =>
    get(brandSettings.value, "meta.i18n")
  );

  const uischema = computed<BrandMeta["uischema"]>(
    () => get(brandSettings.value, "meta.uischema") as BrandMeta["uischema"]
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

  const enforceEmailVerification = computed(
    (): boolean =>
      !!get(
        brandConfig.value,
        BrandConfigKeys.SECURITY_ORDERS_REQUIRE_VERIFIED_EMAIL,
        false
      )
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

  const hasUpmindBranding = computed(
    (): boolean =>
      !get(
        organisationConfig.value,
        OrgFeatureKeys.REMOVE_UPMIND_BRANDING_ENABLED,
        false
      )
  );

  // Singleton to avoid creating multiple useConfig instances across useBrand calls.
  // basket: undefined breaks the useBasket → useBrand → useConfig → useBasket cycle —
  // useBrand only consumes data settings (storeUrl, catalogueDisabled), it doesn't
  // evaluate conditional rules, so it has no need for basket plumbing.
  config ??= useConfig({ brand: () => uiCart.value, basket: undefined });

  const storefrontUrl = computed((): string | undefined => {
    return useUpmind.storefrontUrl ?? config.data.storeUrl;
  });

  const hasStorefront = computed(() => {
    // No storefront URL means they need a storefront
    // With a storefront URL, they can enable/disable via catalogueDisabled
    // NB you can only disable the catalogue if you have given us a storefront URL to redirect to, otherwise you would brick your store
    return !storefrontUrl.value || !config.data.catalogueDisabled;
  });

  const keepsUserInSitu = computed(
    () =>
      getConfigValue<BasketFunnelling>(BrandConfigKeys.BASKET_FUNNELLING) ===
      BasketFunnelling.NONE
  );

  const storefrontRoute = computed(() => {
    if (!storefrontUrl.value) {
      return null;
    }

    try {
      const parsed = new URL(storefrontUrl.value);
      if (parsed.protocol && parsed.host) {
        return { href: storefrontUrl.value };
      }
    } catch {
      // Not a valid URL, treat as route name
    }

    return { name: storefrontUrl.value };
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
      ])
    );

  const getConfig = (
    keys: BrandConfigKeys | BrandConfigKeys[]
  ): Record<string, any> => {
    keys = isArray(keys) ? keys : [keys];
    // This method assumes keys are already in the context, so pick them
    return pick(brandConfig.value, keys) ?? {};
  };

  function getConfigValue<T = unknown>(key: BrandConfigKeys): T | undefined {
    return get(brandConfig.value, key) as T | undefined;
  }

  const validateCurrency = async (
    model: CurrencyModel
  ): Promise<Partial<ICurrency> | ICurrency | undefined> => {
    await isReady();

    if (isEmpty(currencies.value)) return model as Partial<ICurrency>;

    const found = find(
      currencies.value,
      ({ id, code }) => id === model?.id || code === model?.code?.toUpperCase()
    );
    return found ?? currency.value;
  };

  const validateLanguage = (model: {
    id?: string;
    code?: string;
  }): ILanguage | undefined => {
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

  const isSupportedLanguage = (locale: string): boolean => {
    if (isEmpty(languages.value) || isEmpty(locale)) return false;

    const found = some(languages.value, ({ code }) => {
      return code?.toLocaleLowerCase() === locale?.toLocaleLowerCase();
    });

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

  // --- side effects

  // After the initial load, if `needsRefresh` is true (indicating previously fetched/persisted settings),
  // trigger a background refresh to ensure data is up to date.
  isReady().then(() => {
    if (needsRefresh) {
      refresh();
      needsRefresh = false;
    }
  });

  return {
    // --- state

    /**
     * Resolves when the brand service is ready or encounters an error.
     * @returns {Promise<boolean>} A promise is resolving to `true` if ready, `false` if an error occurred.
     */
    isReady,

    /**
     * Checks if a specific module is enabled for the current brand.
     * @param {string} code - The module code to check.
     * @returns {boolean} `true` if the module is enabled, `false` otherwise.
     */
    hasModuleEnabled,

    /**
     * Meta-information about the current brand state.
     * @property {boolean} hasErrors - Indicates if any errors occurred during brand data loading.
     * @property {boolean} isComplete - Indicates if all brand data queries have finished.
     * @property {boolean} isLoading - Indicates if brand data is currently being loaded.
     * @property {boolean} isAvailable - Indicates if the brand is available for use (has a name).
     */
    meta,

    // --- context
    /** The unique identifier of the current brand. */
    brandId,

    /** The name of the current brand. */
    name,

    /** The default payment period configured for the brand. */
    defaultPaymentPeriod,

    /** `true` if the brand enforces email verification before placing orders. */
    enforceEmailVerification,

    /** An array of errors encountered during brand data fetching. */
    errors,

    /** `true` if tax is included by default in prices, `false` otherwise. */
    includesTax,

    /** The tax type configured for the brand */
    taxType,

    /** The country identifier associated with the brand. */
    countryId,

    /** The current currency object representing the brand's default or selected currency. */
    currency,

    /** The identifier of the brand's default currency. */
    currencyId,

    /** An array of all supported currencies for the brand. */
    currencies,

    /** The primary image or logo URL for the brand. */
    image,

    /** The style configuration object for the brand's UI. */
    styles,

    /** The favicon URL for the brand. */
    favicon,

    /**
     * The UI theme configuration for the brand, including theme variants and the currently selected variant.
     */
    uiTheme,

    /**
     * Cart-specific meta-information from the brand settings.
     */
    uiCart,

    /** The internationalisation (i18n) messages overrides for the brand. */
    i18nMessages,

    /**
     * The  uischema for the brand cart base don brand meta data
     *  with syntactic sugar for easier access contexts.
     */
    uischema,
    uischema_Display: computed(() => uischema.value?.["@display"]),
    uischema_Route: computed(() => uischema.value?.["@route"]),

    /**
     * The current language object for the brand, determined by settings or defaults.
     */
    language,

    /**
     * An array of all supported languages for the brand.
     */
    languages,

    /**
     * A flag indicating whether the brand has a storefront available.
     */
    hasStorefront,

    /**
     * `true` when the brand's "Add to Basket Funneling" setting is configured
     * to keep the user in situ on the catalogue after auto-adding a product.
     */
    keepsUserInSitu,

    /** The storefront URL for the brand, if configured. */
    storefrontUrl,

    /** The storefront route object for the brand, containing either 'to' for internal routes or 'href' for external URLs. */
    storefrontRoute,

    /**
     * Whether Upmind branding should be displayed (false when white-label add-on is enabled).
     */
    hasUpmindBranding,

    // --- methods

    /**
     * Ensures that the specified brand configuration keys are fetched and available in the context.
     *
     * @param keys - One or more {@link BrandConfigKeys} to ensure are loaded.
     * @returns A promise resolving to a record of the requested configuration key-value pairs.
     * @throws {DetailedError} If the config keys are not available in the context or if the request times out.
     */
    ensureConfig,

    /**
     * Fetches analytics configuration related to Google Analytics (GA) and Google Tag Manager (GTM) IDs.
     *
     * @returns A promise resolving to an object containing analytics configuration.
     */
    getAnalytics,

    /**
     * Retrieves specific brand configuration keys from the context.
     * Assumes the keys are already loaded and available. Does not initiate a fetch if data is missing.
     *
     * @param keys - One or more {@link BrandConfigKeys} to retrieve.
     * @returns An object containing the requested keys and their corresponding values. Returns an empty object if keys are not found.
     */
    getConfig,

    /**
     * Retrieves a specific brand configuration value by its key.
     * Assumes the key is already loaded and available in the context. Does not initiate a fetch if the key is missing.
     *
     * @template T - The expected type of the configuration value.
     * @param key - The {@link BrandConfigKeys} to retrieve the value for.
     * @returns The value of the requested key, or `undefined` if not found.
     */
    getConfigValue,

    /**
     * Validates a given currency model against the brand's supported currencies.
     * Returns the matching currency or the brand's default currency if the provided model is invalid or not found.
     *
     * @param model - The currency model to validate (containing `id` or `code`).
     * @returns A promise resolving to a valid {@link ICurrency} object, a partial {@link ICurrency}, or `undefined`.
     * @throws {DetailedError} If the currency data is not available in the context.
     */
    validateCurrency,

    /**
     * Validates a given language model against the brand's supported languages.
     * Returns the matching language or the brand's default language if the provided model is invalid or not found.
     *
     * @param model - The language model to validate (containing `id` or `code`).
     * @returns A promise resolving to a valid {@link ILanguage} object or `undefined`.
     * @throws {DetailedError} If the language data is not available in the context.
     */
    validateLanguage,

    /**
     * Checks if the brand supports a given language locale.
     *
     * @param locale - The language locale string to check (e.g. "en").
     * @returns `true` if the locale is supported, `false` otherwise.
     * @throws {DetailedError} If the language data is not available in the context.
     */
    isSupportedLanguage,

    /**
     * Refreshes the brand state by re-fetching all related queries.
     * This invalidates the current brand state and fetches it again from the API,
     * ensuring all brand data is up to date.
     *
     * @returns A promise that resolves when the brand state has been refreshed.
     * @throws {DetailedError} If the refresh operation fails.
     */
    refresh,

    /**
     * Invalidates the brand state and all related queries.
     * This clears the current brand state and forces a re-fetch of all brand data,
     * useful for synchronising state without necessarily re-initialising everything.
     *
     * @returns `void`
     * @throws {DetailedError} If the invalidation process fails.
     */
    invalidate
  };
};

/**
 * Type definition for the return value of the `useBrand` composable,
 * ensuring type safety for consumers by providing an explicit signature.
 */
export type UseBrand = ReturnType<typeof useBrand>;
