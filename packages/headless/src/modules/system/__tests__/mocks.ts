import { vi } from "vitest";

vi.mock("../services", () => {
  const queries: Record<string, any> = {};
  return {
    default: {
      fetchBillingCycles: vi.fn(() => queries.billingCycles),
      fetchCountries: vi.fn(() => queries.countries),
      fetchRegions: vi.fn(() => queries.regions)
    },
    stores: {
      regions: { state: {} as Record<string, any[]> }
    },
    __queries: queries
  };
});

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: vi.fn(async () => true),
    countryId: { value: "2785d26e-9678-3d16-75ec-314502e70439" },
    currencyId: { value: "45952098-d3de-4091-76a3-1578626e347e" }
  })
}));

vi.mock("../../query", () => ({
  invalidateQueryByKey: vi.fn()
}));

vi.mock("../../feedback", () => ({
  useFeedback: () => ({ addError: vi.fn() })
}));
