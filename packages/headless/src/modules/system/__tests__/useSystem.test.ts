// --- external
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- utils
import { find, filter } from "lodash-es";
import { makeQuery, type QueryMock } from "../../query/__tests__/utils";

// --- mocks
import "./mocks";
import billingCycles from "./mockResponses/billingCycles.json";
import countries from "./mockResponses/countries.json";
import regions from "./mockResponses/regions.json";

// --- types
import type { ICountry } from "@upmind-automation/types";

// ----------------------------------------------------------------------------

const regionsZA = filter(regions, region => region.code === "ZA");

describe("useSystem", async () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();

    const services = vi.mocked(await import("../services"));
    const queries = (services as any).__queries as Record<string, QueryMock>;

    queries.countries = makeQuery(countries);
    queries.billingCycles = makeQuery(billingCycles);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("triggers all fetches and becomes ready", async () => {
      const { useSystem } = await import("../useSystem");
      const { meta, isReady } = useSystem();

      const services = await import("../services");
      expect(services.default.fetchCountries).toHaveBeenCalled();
      expect(services.default.fetchBillingCycles).toHaveBeenCalled();

      expect(meta.value.isLoading.value).toBe(false);
      expect(meta.value.hasError.value).toBe(false);
      expect(meta.value.isComplete.value).toBe(true);
      expect(meta.value.isAvailable).toBe(true);

      await expect(isReady()).resolves.toBe(true);
    });

    it("reaches a complete state and exposes core getters", async () => {
      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      expect(system.countries.value.length).toBeGreaterThan(0);
      expect(system.billingCycles.value.length).toBeGreaterThan(0);

      const usCountry = system.getCountry("US");
      expect(usCountry).toBeDefined();
      expect(usCountry.name).toBe("United States");

      const gbCountry = system.getCountry("GB");
      expect(gbCountry).toBeDefined();
      expect(gbCountry.name).toBe("United Kingdom");

      // Test fallback when country code is not found
      const invalidCountry = system.getCountry("XX");
      expect(invalidCountry).toBeDefined();
      // Should fall back to the default country (US based on mock data)
      expect(invalidCountry.code).toBe("US");

      // Test fallback when country ID is not found
      const invalidCountryId = system.getCountry("invalid-id");
      expect(invalidCountryId).toBeDefined();
      // Should fall back to the default country (US based on mock data)
      expect(invalidCountryId.code).toBe("US");

      // Test billing cycle with actual data - find a 12-month cycle
      const billingCycle = system.getBillingCycle(12);
      expect(billingCycle).toBeDefined();
      expect(billingCycle?.months).toBe(12);
    });
  });

  describe("error handling", () => {
    it("isReady returns false when an essential query completes with error", async () => {
      const servicesModule: any = await import("../services");
      const queries = servicesModule.__queries as Record<string, QueryMock>;

      // Simulate an essential query that completed but errored
      const err = new Error("essential failed");
      queries.countries.isError = { value: true };
      queries.countries.error = { value: err } as any;
      queries.countries.isComplete = { value: true };

      const { useSystem } = await import("../useSystem");
      const { isReady, meta } = useSystem();

      await expect(isReady()).resolves.toBe(false);
      expect(meta.value.isReady).toBe(false);
      expect(meta.value.hasError.value).toBe(true);
      expect(meta.value.isComplete.value).toBe(true);
    });

    it.each(["countries", "billingCycles"])(
      "handles error state when %s query rejects",
      async queryName => {
        const servicesModule: any = await import("../services");
        const queries = servicesModule.__queries as Record<string, QueryMock>;

        const errorQuery = (label: string) =>
          makeQuery(undefined, {
            error: { value: new Error(label) },
            isError: { value: true },
            isFetched: { value: true }
          });

        queries[queryName] = errorQuery(queryName);

        const { useSystem } = await import("../useSystem");
        const { meta, isReady } = useSystem();
        expect(meta.value.hasError.value).toBe(true);
        await expect(isReady()).resolves.toBe(false);
      }
    );
  });

  describe("getters", () => {
    it.each([
      { method: "getCountry", data: countries, key: "code", value: "US" },
      {
        method: "getBillingCycle",
        data: billingCycles,
        key: "months",
        value: 12
      }
    ])(
      "$method returns correct data (required queries)",
      async ({ data, key, method, value }) => {
        const { useSystem } = await import("../useSystem");
        const system = useSystem();

        // Find the expected item from mock data
        const expectedItem: unknown = find(
          data,
          (item: any) => item[key] === value
        );

        // Call the getter method and verify it matches the expected result
        const result = (system as any)[method](value);
        expect(result).toMatchObject(expectedItem!);
      }
    );
  });

  describe("service calls", () => {
    it("does not duplicate fetches when useSystem is called multiple times", async () => {
      const servicesModule: any = await import("../services");
      const service = servicesModule.default;

      const { useSystem } = await import("../useSystem");
      // Call 3x in the same module lifecycle
      useSystem();
      useSystem();
      useSystem();

      expect(service.fetchCountries).toHaveBeenCalledTimes(1);
      expect(service.fetchBillingCycles).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetch methods", () => {
    it("fetchCountries refetches when not fetched", async () => {
      const servicesModule: any = await import("../services");
      const queries = servicesModule.__queries as Record<string, QueryMock>;
      queries.countries.isFetched = { value: false };

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      await system.fetchCountries();
      expect(queries.countries.refetch).toHaveBeenCalledOnce();
    });
  });

  describe("regions", () => {
    it("fetchRegions returns cached store if present, otherwise queries and stores by country code", async () => {
      const servicesModule: any = await import("../services");
      const queries = servicesModule.__queries as Record<string, QueryMock>;

      // Test 1: When regions are already cached in the store,
      // simulate that regions for South Africa (ZA) are already stored
      servicesModule.stores.regions.state = { ZA: regionsZA };

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      // Should return cached data without making a network request
      const cached = await system.fetchRegions("ZA");
      expect(cached).toEqual(regionsZA);

      // Verify that no API call was made when cache was hit
      expect(servicesModule.default.fetchRegions).not.toHaveBeenCalled();

      // Test 2: When regions are NOT cached, should fetch from API
      // Clear the cache to simulate no cached data
      servicesModule.stores.regions.state = {};
      // Mock the API response for the region's query
      queries.regions = makeQuery(regionsZA);

      // Test with a country object instead of just country code
      const byObj = await system.fetchRegions({
        id: "8d632507-9806-5d1e-302f-8174e234e98d",
        code: "ZA"
      } as ICountry);
      expect(byObj).toEqual(regionsZA);

      // Verify that the API call WAS made when the cache was empty
      expect(servicesModule.default.fetchRegions).toHaveBeenCalled();
      // Verify that the query was actually executed (not cached)
      await expect(queries.regions.promise!.value).resolves.toBe(regionsZA);
    });

    it("getRegion works with single string value", async () => {
      const servicesModule: any = await import("../services");

      // Mock regions in store
      const testRegions = [
        { id: "1", name: "Western Cape", code: "WC" },
        { id: "2", name: "Gauteng", code: "GP" }
      ];
      servicesModule.stores.regions.state = { ZA: testRegions };

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      const region = system.getRegion("Western Cape", "ZA");
      expect(region).toBeDefined();
      expect(region?.name).toBe("Western Cape");
      expect(region?.code).toBe("WC");
    });

    it("getRegion works with array of values", async () => {
      const servicesModule: any = await import("../services");

      // Mock regions in store
      const testRegions = [
        { id: "1", name: "Western Cape", code: "WC" },
        { id: "2", name: "Gauteng", code: "GP" }
      ];
      servicesModule.stores.regions.state = { ZA: testRegions };

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      // Test case-insensitive matching with an array
      const region = system.getRegion(["western cape", "GAUTENG"], "ZA");
      expect(region).toBeDefined();
      // NB: getRegion when given an array returns the FIRST match
      expect(region?.name).toBe("Western Cape");
    });

    it("getRegion returns undefined when regions are empty", async () => {
      const servicesModule: any = await import("../services");

      // Mock empty regions in store
      servicesModule.stores.regions.state = { ZA: [] };

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      const region = system.getRegion("Western Cape", "ZA");
      expect(region).toBeUndefined();
    });

    it("getRegions works with string country code", async () => {
      const servicesModule: any = await import("../services");

      // Mock regions in store
      const testRegions = [
        { id: "1", name: "Western Cape", code: "WC" },
        { id: "2", name: "Gauteng", code: "GP" }
      ];
      servicesModule.stores.regions.state = { ZA: testRegions };

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      const regions = system.getRegions("ZA");
      expect(regions).toEqual(testRegions);
    });

    it("getRegions works with ICountry object", async () => {
      const servicesModule: any = await import("../services");

      // Mock regions in store
      const testRegions = [
        { id: "1", name: "Western Cape", code: "WC" },
        { id: "2", name: "Gauteng", code: "GP" }
      ];
      servicesModule.stores.regions.state = { ZA: testRegions };

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      const countryObj = {
        id: "test-id",
        code: "ZA",
        name: "South Africa"
      } as ICountry;
      const regions = system.getRegions(countryObj);
      expect(regions).toEqual(testRegions);
    });
  });

  describe("utility methods", () => {
    it("refresh triggers refetch on all queries", async () => {
      const servicesModule: any = await import("../services");
      const queries = servicesModule.__queries as Record<string, QueryMock>;

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      await system.refresh();

      expect(queries.countries.refetch).toHaveBeenCalledOnce();
      expect(queries.billingCycles.refetch).toHaveBeenCalledOnce();
    });

    it("invalidate calls invalidateQueryByKey", async () => {
      const { useSystem } = await import("../useSystem");
      const { invalidateQueryByKey } = await import("../../query");
      const system = useSystem();

      system.invalidate();
      expect(vi.mocked(invalidateQueryByKey)).toHaveBeenCalledWith(["system"], {
        exact: false
      });
    });
  });

  describe("meta and state", () => {
    it("errors computed reflects underlying query errors", async () => {
      const servicesModule: any = await import("../services");
      const queries = servicesModule.__queries as Record<string, QueryMock>;

      const err = new Error("Something went wrong");
      queries.countries = makeQuery(undefined, {
        isError: { value: true },
        error: { value: err }
      });

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      expect(system.errors.value.countries).toBe(err);
    });

    it("meta flags reflect query aggregate state", async () => {
      const servicesModule: any = await import("../services");
      const queries = servicesModule.__queries as Record<string, QueryMock>;

      queries.countries.isLoading = { value: true };

      const { useSystem } = await import("../useSystem");
      const { meta } = useSystem();

      expect(meta.value.isLoading.value).toBe(true);

      queries.countries.isLoading = { value: false };
      queries.countries.isError = { value: true };

      const { useSystem: useSystem2 } = await import("../useSystem");
      const { meta: meta2 } = useSystem2();
      expect(meta2.value.hasError.value).toBe(true);
    });

    it.each(["countries", "billingCycles"])(
      "meta.isEmpty is true when %s is empty",
      async queryName => {
        const servicesModule: any = await import("../services");
        const queries = servicesModule.__queries as Record<string, QueryMock>;

        queries[queryName] = makeQuery([]);

        const { useSystem } = await import("../useSystem");
        const { meta } = useSystem();

        expect(meta.value.isEmpty).toBe(true);
      }
    );
  });

  describe("background refetch", () => {
    it.each([
      {
        description:
          "triggers refetch when there are persisted settings in localStorage",
        setup: () => localStorage.setItem('"system","countries"', "1"),
        expectedCalls: 1
      },
      {
        description:
          "does not trigger refetch when no persisted settings are in localStorage",
        setup: () => localStorage.clear(),
        expectedCalls: 0
      }
    ])("$description", async ({ setup, expectedCalls }) => {
      setup();

      const { useSystem } = await import("../useSystem");
      const system = useSystem();

      const servicesModule: any = await import("../services");
      const q = servicesModule.__queries as Record<string, QueryMock>;

      // wait for readiness
      await expect(system.isReady()).resolves.toBe(true);

      // check refetch behaviour for all queries
      if (expectedCalls > 0) {
        expect(q.countries.refetch).toHaveBeenCalledOnce();
        expect(q.billingCycles.refetch).toHaveBeenCalledOnce();
      } else {
        expect(q.countries.refetch).not.toHaveBeenCalled();
        expect(q.billingCycles.refetch).not.toHaveBeenCalled();
      }
    });
  });
});
