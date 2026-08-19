// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/__tests__/mocks
 * @description Unit-boundary mock for this module's PURE unit specs
 * (mappers, surface). Mocks only `../../session-store` — the hub whose
 * eager, module-top-level scope registration (`client-email/useClientEmails.ts:80`,
 * reached transitively through `../scope` → `session-store` → `query` →
 * `basket` → `client-company` → `client-email`) crashes
 * `createScopedComposable` mid-evaluation when a single scoped module is
 * imported in isolation. Import this file's side effect BEFORE the module
 * under test, exactly as `client-custom-fields/__tests__/mocks.ts` and
 * `auth/__tests__/mocks.ts` do — pure mapping/surface specs have no business
 * booting a real session.
 *
 * Integration specs do the OPPOSITE — they import the REAL `session-store`
 * near the top instead (`client-email.int-helpers.ts`), because the A7
 * identity-transport read-back needs the real session token and headers.
 */

import { vi } from "vitest";

vi.mock("../../session-store", () => ({
  useActiveSession: () => ({
    useContext: () => ({ activeUser: { value: undefined } }),
    useMeta: () => ({
      isAuthenticated: { value: false },
      isAvailable: { value: false }
    }),
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
