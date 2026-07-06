// -----------------------------------------------------------------------------
/**
 * @module auth/__tests__/mocks
 * @description Unit-boundary mocks for `useAuth` unit tests. Mirrors
 * `query/__tests__/mocks.ts` (pattern reference, ADR-021 §Allowed reads) and
 * mocks exactly the seams `useAuth`'s unit files cross: the shared `utils`
 * state/context helpers (`send`, `stateMatches`, `useStateMatches`,
 * `contextMatches`), the sibling `brand` and `session-store` modules, and the
 * package bootstrap barrel — never the machine/services under test.
 */

import { vi } from "vitest";
import { BrandConfigKeys } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

vi.mock("../../system", () => ({
  useI18n: () => ({ t: (key: string) => key }),
  useLocale: () => ({ locale: { value: "en" }, setLocale: vi.fn() }),
  useDataLayer: () => ({ dataLayer: vi.fn(() => ({ push: vi.fn() })) })
}));

export const sendMock = vi.fn();
export const stateMatchesMock = vi.fn(() => false);
export const useStateMatchesMock = vi.fn(() => ({ value: false }));
export const contextMatchesMock = vi.fn(() => false);
export const waitForProcessingMock = vi.fn(async () => true);

vi.mock("../../../utils", () => ({
  send: sendMock,
  stateMatches: stateMatchesMock,
  useStateMatches: useStateMatchesMock,
  contextMatches: contextMatchesMock,
  waitForProcessing: waitForProcessingMock,
  useContext: vi.fn((state: { context?: unknown }) => state?.context ?? {}),
  useState: vi.fn((state: { value?: unknown }) => ({
    value: state?.value
  })),
  contextValue: vi.fn(
    (actor: Record<string, unknown>, key: string) => actor?.[key]
  ),
  useUrl: vi.fn((path: string) => new URL(`https://api.test/${path}`)),
  useTime: vi.fn(() => ({ MINUTE: 60 * 1000 })),
  isPromise: (value: unknown) =>
    !!value && typeof (value as Promise<unknown>).then === "function",
  ErrorOrigin: { Headless: "Headless" },
  DetailedError: class DetailedError extends Error {},
  responseCodes: { No_Content: 204 },
  DEBOUNCE_DELAY: 300,
  asyncDebounce: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
  createActor: vi.fn((service: unknown) => ({
    state: { value: "idle", context: {} },
    send: sendMock,
    service
  })),
  stopService: vi.fn(),
  mapToHeadlessError: vi.fn((error: unknown) => error),
  useLocalStorage: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }))
}));

export const brandConfig: Record<string, unknown> = {
  [BrandConfigKeys.GUEST_CHECKOUT_ENABLED]: true
};

vi.mock("../../brand", () => ({
  GUEST_CHECKOUT_ENABLED: BrandConfigKeys.GUEST_CHECKOUT_ENABLED,
  useBrand: () => ({
    getConfigValue: (key: string) => brandConfig[key],
    GUEST_CHECKOUT_ENABLED: brandConfig[BrandConfigKeys.GUEST_CHECKOUT_ENABLED]
  })
}));

vi.mock("../../session-store", () => ({
  useActiveSession: () => ({
    useContext: () => ({ activeUser: { value: undefined } }),
    useActions: () => ({ onLogout: vi.fn(() => vi.fn()) })
  }),
  useSessionStore: () => ({
    useActions: () => ({
      onLogout: vi.fn(() => vi.fn()),
      persistTokenToStorage: vi.fn(),
      updateUser: vi.fn()
    })
  })
}));

vi.mock("../../../index", () => ({
  default: {},
  invalidateQueryByKey: vi.fn(),
  localStoragePersister: { persisterFn: vi.fn() }
}));

vi.mock("../../../useUpmind", () => ({}));
