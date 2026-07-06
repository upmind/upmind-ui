// -----------------------------------------------------------------------------
/**
 * @module account/__tests__/mocks
 * @description Unit-boundary mocks for `useAccount` unit tests. Mirrors
 * `auth/__tests__/mocks.ts` (pattern reference, ADR-021 §Allowed reads) and
 * mocks exactly the seams the unit files cross: the shared `utils`
 * state/context helpers (`send` via `createActor`, `stateMatches`,
 * `useStateMatches`, `contextMatches`, `contextValue`, `useContext`), the
 * sibling `brand` and `session-store` modules, and the package bootstrap
 * barrel — never the machine/services under test.
 */

import { vi } from "vitest";

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
export const contextValueMock = vi.fn(() => undefined);
export const useContextMock = vi.fn(() => ({ value: undefined }));

vi.mock("../../../utils", () => ({
  send: sendMock,
  stateMatches: stateMatchesMock,
  useStateMatches: useStateMatchesMock,
  contextMatches: contextMatchesMock,
  waitForProcessing: waitForProcessingMock,
  useContext: useContextMock,
  useState: vi.fn((state: { value?: unknown }) => ({
    value: state?.value
  })),
  contextValue: contextValueMock,
  useUrl: vi.fn((path: string) => new URL(`https://api.test/${path}`)),
  useTime: vi.fn(() => ({ SECOND: 1000, MINUTE: 60 * 1000 })),
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
  })),
  useCookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    removeTopLevel: vi.fn()
  }))
}));

// Sibling session-store barrel — account reads the active session's identity
// (acct-foundation §Dependencies: "Session identity read — the active session
// supplies the client record the arc routes off"). Faked so unit tests never
// boot the real store or hit the network.
vi.mock("../../session-store", () => {
  const sharedContext = () => ({
    activeActor: { value: "client" },
    activeUser: { value: null },
    activeSession: { value: undefined },
    activeSessionId: { value: undefined }
  });
  return {
    useSessionStore: () => ({ useContext: sharedContext }),
    useActiveSession: () => ({ useContext: sharedContext }),
    authSubscription: () => undefined
  };
});

// Brand context — the enforce-email-verification flag (acct-gotchas §6).
vi.mock("../../brand", () => ({
  useBrand: () => ({ enforceEmailVerification: { value: true } })
}));

// Avoid initializing the Upmind singleton / package barrel during tests.
vi.mock("../../../index", () => ({
  default: {},
  invalidateQueryByKey: vi.fn(),
  localStoragePersister: { persisterFn: vi.fn() }
}));
vi.mock("../../../useUpmind", () => ({}));
