// --- external
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- utils
import { find, map, omit } from "lodash-es";
import { makeQuery, type QueryMock } from "./utils";

// --- mocks
import "./mocks";
import orgConfigFixture from "./mockResponses/orgConfig.json";
import orgModulesFixture from "./mockResponses/orgModules.json";
import brandConfigFixture from "./mockResponses/brandConfig.json";
import brandSettingsFixture from "./mockResponses/brandSettings.json";

// --- types
import {
  BrandConfigKeys,
  ICurrency,
  ILanguage,
  ISO_4217_CURRENCY_CODE
} from "@upmind-automation/types";

// ----------------------------------------------------------------------------

describe("useBrand", async () => {
  const modules = map(orgModulesFixture.data, ({ code }) => ({ code }));

  // Map API config keys to those used by the tests
  const config = {
    [BrandConfigKeys.DEFAULT_PAYMENT_PERIOD]:
      brandConfigFixture.data["invoices.common.default_payment_period"],
    [BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID]:
      brandConfigFixture.data["analytics.google.measurement_id"],
    [BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID]:
      brandConfigFixture.data["analytics.gtm.container_id"]
  };

  const orgConfig = {
    MULTI_BRAND_ENABLED: Boolean(
      orgConfigFixture["package.enabled_features.multi_brand"]
    )
  };

  beforeEach(async () => {
    // Reset module singletons between tests by deleting the module cache of useBrand
    vi.resetModules();

    // Clear localStorage keys used by useBrand at module init
    localStorage.clear();

    // set up default queries
    const services = vi.mocked(await import("../services"));
    const queries = (services as any).__queries as Record<string, QueryMock>;
    queries.modules = makeQuery(modules);
    queries.brandConfig = makeQuery(config);
    queries.brandConfigEnsure = makeQuery(config);
    queries.brandSettings = makeQuery(brandSettingsFixture);
    queries.orgConfig = makeQuery(orgConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initialises: triggers all fetches and becomes ready", async () => {
    const { useBrand } = await import("../useBrand");
    const { meta, isReady } = useBrand();

    const { default: service } = await import("../services");
    expect(service.fetchModules).toHaveBeenCalled();
    expect(service.fetchBrandConfig).toHaveBeenCalled();
    expect(service.fetchBrandSettings).toHaveBeenCalled();
    expect(service.fetchOrganisationConfig).toHaveBeenCalled();

    expect(meta.value.hasError).toBe(false);
    expect(meta.value.isLoading).toBe(false);
    expect(meta.value.isComplete).toBe(true);
    expect(meta.value.isAvailable).toBe(true);

    await expect(isReady()).resolves.toBe(true);
  });

  it("reaches a complete state and exposes core getters", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    expect(brand.name.value).toBe(brandSettingsFixture.name);
    expect(brand.brandId.value).toBe(brandSettingsFixture.id);
    expect(brand.countryId.value).toBe(brandSettingsFixture.country_id);
    expect(brand.defaultPaymentPeriod.value).toBe(
      brandConfigFixture.data["invoices.common.default_payment_period"] // 2
    );

    expect(brand.hasModuleEnabled("web_hosting")).toBe(true);
    expect(brand.hasModuleEnabled("foo")).toBe(false);
  });

  it("isReady returns false when an essential query completes with error", async () => {
    const servicesModule: any = await import("../services");
    const queries = servicesModule.__queries as Record<string, QueryMock>;

    // Simulate brandSettings query error state while fetched
    queries.brandSettings = makeQuery(undefined, {
      error: { value: new Error("brand settings failed") },
      isError: { value: true },
      isFetched: { value: true }
    });

    const { useBrand } = await import("../useBrand");
    const { isReady, meta } = useBrand();

    await expect(isReady()).resolves.toBe(false);
    expect(meta.value.hasError).toBe(true);
  });

  it("handles error state when services reject", async () => {
    const servicesModule: any = await import("../services");
    const queries = servicesModule.__queries as Record<string, QueryMock>;

    // flip queries to loading+error to reflect the runtime error state
    const errorQuery = (label: string) =>
      makeQuery(undefined, {
        error: { value: new Error(label) },
        isError: { value: true },
        isFetched: { value: true }
      });

    queries.modules = errorQuery("modules");
    queries.orgConfig = errorQuery("org");
    queries.brandConfig = errorQuery("config");
    queries.brandSettings = errorQuery("settings");

    const { useBrand } = await import("../useBrand");
    const { meta, isReady } = useBrand();
    expect(meta.value.hasError).toBe(true);
    await expect(isReady()).resolves.toBe(false);
  });

  it("computes storefront url and route for internal catalogue", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    expect(brand.storefrontUrl.value).toBe("/catalogue");
    expect(brand.hasStorefront.value).toBe(false);
    expect(brand.storefrontRoute.value).toEqual({
      to: { name: "catalogue" }
    });
  });

  it("uses external storefront url when provided", async () => {
    const servicesModule: any = await import("../services");
    const queries = servicesModule.__queries as Record<string, QueryMock>;

    const externalUrl = "https://upmind.com/store";
    queries.brandSettings = makeQuery({
      ...brandSettingsFixture,
      meta: {
        ...brandSettingsFixture.meta,
        cart: { storefront_url: externalUrl, catalogue: { disabled: false } }
      }
    });

    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    expect(brand.hasStorefront.value).toBe(true);
    expect(brand.storefrontUrl.value).toBe(externalUrl);
    expect(brand.storefrontRoute.value).toEqual({ href: externalUrl });
  });

  it("computes currency and validateCurrency correctly", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    // find the default currency object from the fixture
    const defaultCurrency = find(
      brandSettingsFixture.currencies,
      (currency: ICurrency) => currency.id === brandSettingsFixture.currency_id
    ) as ICurrency;
    // find another currency for testing
    const gbpCurrency = find(
      brandSettingsFixture.currencies,
      (currency: ICurrency) => currency.code === ISO_4217_CURRENCY_CODE.GBP
    ) as ICurrency;

    expect(brand.currency.value?.id).toBe(brandSettingsFixture.currency_id);
    // found by id
    await expect(
      brand.validateCurrency({ id: brandSettingsFixture.currency_id })
    ).resolves.toMatchObject(defaultCurrency);
    // found by code (USD)
    await expect(
      brand.validateCurrency({ code: ISO_4217_CURRENCY_CODE.USD })
    ).resolves.toMatchObject(defaultCurrency);
    // found by code (GBP)
    await expect(
      brand.validateCurrency({ code: ISO_4217_CURRENCY_CODE.GBP })
    ).resolves.toMatchObject(gbpCurrency);
    // when not found, falls back to default brand currency
    await expect(
      brand.validateCurrency({ code: "invalid-currency-code" } as any)
    ).resolves.toMatchObject(defaultCurrency);
  });

  it("computes language and validateLanguage correctly", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    // find the default language object from the fixture (pt)
    const defaultLanguage = find(
      brandSettingsFixture.languages,
      l => l.id === brandSettingsFixture.language_id
    ) as ILanguage;
    // find another language for testing
    const frLanguage = find(
      brandSettingsFixture.languages,
      l => l.code === "fr"
    ) as ILanguage;

    // computed
    expect(brand.language.value).toMatchObject(defaultLanguage);
    // found by id
    expect(
      brand.validateLanguage({ id: brandSettingsFixture.language_id })
    ).toMatchObject(defaultLanguage);
    // found by code (pt)
    expect(brand.validateLanguage({ code: "pt" })).toMatchObject(
      defaultLanguage
    );
    // found by code (fr)
    expect(brand.validateLanguage({ code: "fr" })).toMatchObject(frLanguage);
    // when not found, falls back to the default brand language
    expect(brand.validateLanguage({ code: "xx" })).toMatchObject(
      defaultLanguage
    );
  });

  it("includesTax computed and refresh triggers refetch on all queries", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    expect(brand.includesTax.value).toBe(true);

    const { __queries } = (await import("../services")) as any;
    const q = __queries as Record<string, QueryMock>;

    await brand.refresh();
    // ensure spies are fresh (brand.refresh called after spies are created)
    vi.mocked(q.modules.refetch);
    vi.mocked(q.brandConfig.refetch);
    vi.mocked(q.brandSettings.refetch);
    vi.mocked(q.orgConfig.refetch);

    // call refresh again to trigger refetches
    expect(q.modules.refetch).toHaveBeenCalledOnce();
    expect(q.brandConfig.refetch).toHaveBeenCalledOnce();
    expect(q.brandSettings.refetch).toHaveBeenCalledOnce();
    expect(q.orgConfig.refetch).toHaveBeenCalledOnce();
  });

  it("does not duplicate fetches when useBrand is called multiple times", async () => {
    const servicesModule: any = await import("../services");
    const service = servicesModule.default;

    const { useBrand } = await import("../useBrand");
    // Call 3x in the same module lifecycle
    useBrand();
    useBrand();
    useBrand();

    expect(service.fetchModules).toHaveBeenCalledTimes(1);
    expect(service.fetchBrandConfig).toHaveBeenCalledTimes(1);
    expect(service.fetchBrandSettings).toHaveBeenCalledTimes(1);
    expect(service.fetchOrganisationConfig).toHaveBeenCalledTimes(1);
  });

  it("getConfigValue returns mapped config entries (GA/GTM and payment period)", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    expect(
      brand.getConfigValue(BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID)
    ).toBe(brandConfigFixture.data["analytics.google.measurement_id"]);
    expect(
      brand.getConfigValue(BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID)
    ).toBe(brandConfigFixture.data["analytics.gtm.container_id"]);
    expect(brand.getConfigValue(BrandConfigKeys.DEFAULT_PAYMENT_PERIOD)).toBe(
      brandConfigFixture.data["invoices.common.default_payment_period"]
    );
  });

  it("isSupportedLanguage handles empty and unknown codes", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    expect(brand.isSupportedLanguage("")).toBe(false);
    expect(brand.isSupportedLanguage("__unknown__")).toBe(false);
    expect(brand.isSupportedLanguage("PT")).toBe(true);
    expect(brand.isSupportedLanguage("pt")).toBe(true);
  });

  it("validateLanguage is case-insensitive and falls back to default", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    const defaultLanguage = find(
      brandSettingsFixture.languages,
      l => l.id === brandSettingsFixture.language_id
    ) as ILanguage;

    // case-insensitive match
    expect(brand.validateLanguage({ code: "PT" })).toMatchObject(
      defaultLanguage
    );
    // fallback for unknown
    expect(brand.validateLanguage({ code: "zz" })).toMatchObject(
      defaultLanguage
    );
  });

  it("validateCurrency returns input model when currencies are empty", async () => {
    const servicesModule: any = await import("../services");
    const queries = servicesModule.__queries as Record<string, QueryMock>;

    // simulate empty currencies in brand settings
    queries.brandSettings = makeQuery({
      ...brandSettingsFixture,
      currencies: []
    });

    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    const input = { id: "foo" } as any;
    await expect(brand.validateCurrency(input)).resolves.toBe(input);
  });

  it("meta.isAvailable is false when brand name is missing", async () => {
    const servicesModule: any = await import("../services");
    const queries = servicesModule.__queries as Record<string, QueryMock>;

    const withoutName = omit(brandSettingsFixture, "name");
    queries.brandSettings = makeQuery(withoutName);

    const { useBrand } = await import("../useBrand");
    const { meta } = useBrand();
    expect(meta.value.isAvailable).toBe(false);
  });

  it("invalidate calls invalidateQueryByKey", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    // since mocks live in the "mocks.ts" file, we need to import the module to get the spy
    const module: any = await import("../..");
    // get the invalidateQueryByKey spy
    const invalidateSpy = module.invalidateQueryByKey as ReturnType<
      typeof vi.fn
    >;

    brand.invalidate();
    expect(invalidateSpy).toHaveBeenCalledWith(["brand"], { exact: false });
  });

  it("hasModuleEnabled returns false when modules are empty", async () => {
    const servicesModule: any = await import("../services");
    const queries = servicesModule.__queries as Record<string, QueryMock>;
    // simulate no modules
    queries.modules = makeQuery([]);

    const { useBrand } = await import("../useBrand");
    const brand = useBrand();
    expect(brand.hasModuleEnabled("web_hosting")).toBe(false);
  });

  it("does a background refetch when there are persisted settings in localStorage", async () => {
    // simulate persisted brand settings in localStorage BEFORE import
    localStorage.setItem('"brand","settings"', "1");

    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    const servicesModule: any = await import("../services");
    const q = servicesModule.__queries as Record<string, QueryMock>;

    // wait for readiness for background refresh
    await expect(brand.isReady()).resolves.toBe(true);

    // exactly one background refetch on all brand queries
    expect(q.modules.refetch).toHaveBeenCalledOnce();
    expect(q.orgConfig.refetch).toHaveBeenCalledOnce();
    expect(q.brandConfig.refetch).toHaveBeenCalledOnce();
    expect(q.brandSettings.refetch).toHaveBeenCalledOnce();
  });

  it("does not background refetch when no persisted settings are in localStorage", async () => {
    const { useBrand } = await import("../useBrand");
    const brand = useBrand();

    const servicesModule: any = await import("../services");
    const q = servicesModule.__queries as Record<string, QueryMock>;

    // ensure spies are fresh
    vi.mocked(q.modules.refetch);
    vi.mocked(q.brandConfig.refetch);
    vi.mocked(q.brandSettings.refetch);
    vi.mocked(q.orgConfig.refetch);

    await brand.isReady();
    // assert no automatic background refetch occurred
    expect(q.modules.refetch).not.toHaveBeenCalled();
    expect(q.brandConfig.refetch).not.toHaveBeenCalled();
    expect(q.brandSettings.refetch).not.toHaveBeenCalled();
    expect(q.orgConfig.refetch).not.toHaveBeenCalled();
  });
});
