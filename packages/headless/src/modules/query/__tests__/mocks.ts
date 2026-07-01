import { vi } from "vitest";
import { has } from "lodash-es";

// Locale mocks with subscription so other mocks can react to changes
const localeListeners = new Set<() => void>();
vi.mock("../../system-localisation/useLocale", () => {
  const locale = { value: "en" } as any;
  return {
    useLocale: () => ({
      locale,
      setLocale: vi.fn(async (code: string) => {
        locale.value = code;
        localeListeners.forEach(fn => fn());
        return code;
      })
    }),
    // For other mocks to subscribe to changes
    onLocaleChange: (fn: () => void) => localeListeners.add(fn)
  };
});

// Mock the system barrel to provide useI18n, useLocale re-export, and useDataLayer
vi.mock("../../system", async () => {
  const localeModule: any = await import("../../system-localisation/useLocale");
  return {
    useI18n: () => ({ t: (key: string) => key }),
    useLocale: localeModule.useLocale,
    useDataLayer: () => ({ dataLayer: vi.fn(() => ({ push: vi.fn() })) })
  };
});

// Minimal utils mock to provide a base URL
vi.mock("../../utils", () => ({
  useUrl: vi.fn((path: string) => new URL(`https://api.test/${path}`)),
  useTime: vi.fn(() => ({ MINUTE: 60 * 1000 })),
  isPromise: (p: any) => p && typeof p.then === "function",
  ErrorOrigin: { Headless: "Headless" },
  DetailedError: class DetailedError extends Error {},
  responseCodes: { No_Content: 204 }
}));

// Mock tanstack's useQuery to refetch on changes to any of these reactive keys
// when present on the final queryKey segment: 'locale', 'currencyCode', 'limit', 'pageIndex'.
vi.mock("@tanstack/vue-query", async () => {
  const localeModule: any = await import("../../system-localisation/useLocale");

  const useQuery = vi.fn((options?: any) => {
    const refetch = vi.fn();
    // If the caller provided reactiveKeys that include any supported keys, subscribe to changes
    const maybeReactiveKeys =
      options?.queryKey?.[options?.queryKey?.length - 1];
    const hasKey = (key: string) =>
      maybeReactiveKeys && has(maybeReactiveKeys, key);

    if (
      hasKey("limit") ||
      hasKey("locale") ||
      hasKey("pageIndex") ||
      hasKey("currencyCode")
    ) {
      localeModule.onLocaleChange(() => refetch());
    }
    return {
      data: { value: undefined },
      isPlaceholderData: { value: false },
      refetch
    };
  });

  const useMutation = vi.fn();
  const QueryClient = vi.fn(() => ({ resetQueries: vi.fn() }));
  const useInfiniteQuery = vi.fn();

  return { useQuery, useInfiniteQuery, useMutation, QueryClient };
});

// Avoid initializing Upmind singleton during tests and provide minimal index exports used by brand/services
vi.mock("../../../index", () => ({
  default: {},
  invalidateQueryByKey: vi.fn(),
  localStoragePersister: { persisterFn: vi.fn() },
  useQuery: () => ({
    queryClient: {},
    query: vi.fn(() => ({
      data: { value: undefined },
      isFetched: { value: true },
      isError: { value: false },
      isLoading: { value: false },
      refetch: vi.fn()
    })),
    list: vi.fn(() => ({
      data: { value: { data: [] } },
      isFetched: { value: true },
      isError: { value: false },
      isLoading: { value: false },
      refetch: vi.fn()
    })),
    mutate: vi.fn(() => vi.fn()),
    post: vi.fn(() => Promise.resolve({})),
    put: vi.fn(() => Promise.resolve({})),
    useUrl: vi.fn((path: string) => new URL(`https://api.test/${path}`))
  })
}));
vi.mock("../../../useUpmind", () => ({}));
