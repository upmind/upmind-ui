import { vi } from "vitest";

// Shared objects so different mocks can access the same instance
const queries: Record<string, any> = {};
const locale = { value: "en" } as any;

vi.mock("../services", () => ({
  default: {
    fetchModules: vi.fn(() => queries.modules),
    fetchBrandConfig: vi.fn(keys =>
      keys ? queries.brandConfigEnsure : queries.brandConfig
    ),
    fetchBrandSettings: vi.fn(() => queries.brandSettings),
    fetchOrganisationConfig: vi.fn(() => queries.orgConfig)
  },
  __queries: queries
}));

vi.mock("../../routing", () => {
  const hasRoute = vi.fn(
    (name: string) => name === "catalogue" || name === "basket"
  );
  const resolve = vi.fn(({ name }: any) => ({
    fullPath: name === "catalogue" ? "/catalogue" : "/basket"
  }));
  return {
    useRoutingEngine: () => ({ router: { hasRoute, resolve } })
  };
});

vi.mock("../../system/localisation/useLocale", () => {
  return {
    useLocale: () => ({
      locale,
      setLocale: vi.fn(async (code: string) => {
        locale.value = code;
        return code;
      })
    })
  };
});

vi.mock("../..", async () => {
  const noop = vi.fn();

  return {
    ROUTE: { CATALOGUE: "catalogue", BASKET: "basket" },
    invalidateQueryByKey: vi.fn(),
    default: { storefrontUrl: undefined },
    useQuery: () => ({}),
    useFeedback: vi.fn(() => ({
      useDataLayer: vi.fn(() => ({
        id: "dataLayer",
        init: vi.fn(() => Promise.resolve()),
        dataLayer: vi.fn(() => ({
          args: {},
          complete: false,
          push: vi.fn(() => ({})),
          withEcommerce: vi.fn().mockReturnThis(),
          withItems: vi.fn().mockReturnThis(),
          withPage: vi.fn().mockReturnThis(),
          withUser: vi.fn().mockReturnThis()
        }))
      })),
      add: noop,
      addError: noop,
      addNotification: noop,
      addSystem: noop,
      addToast: noop,
      clear: noop,
      remove: noop,
      messages: { value: [] },
      meta: { value: { isProcessing: false, isEmpty: true } },
      notifications: { value: [] },
      system: { value: [] },
      toasts: { value: [] }
    }))
  };
});
