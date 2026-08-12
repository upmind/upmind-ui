// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/mocks
 * @description Unit-boundary mocks for `client-custom-fields`'s pure-function
 * unit specs (mappers, schemas, surface). Mirrors `auth/__tests__/mocks.ts`
 * (pattern reference): mocks exactly the hub these unit files have no
 * business booting — `session-store` — never the mappers/schemas/barrel
 * under test.
 *
 * Importing this module's barrel (even for a pure mapper) evaluates the
 * barrel's scoped-composable exports, which require `../scope` to be fully
 * evaluated. `../scope` imports `session-store`, whose own import graph
 * reaches other scoped modules (query → basket → … → client-company →
 * client-email) whose EAGER top-level registration then needs `../scope`
 * back — a real module-load cycle, unrelated to anything this module's own
 * unit specs assert. Mocking `session-store` here severs that tail before it
 * starts; the mappers/schemas under test never call session-store anyway.
 */

import { vi } from "vitest";

// -----------------------------------------------------------------------------

vi.mock("../../session-store", () => ({
  useActiveSession: () => ({
    useContext: () => ({ activeUser: { value: undefined } }),
    useMeta: () => ({
      isAuthenticated: { value: false },
      isAvailable: { value: false }
    })
  }),
  useSessionStore: () => ({
    useActions: () => ({ add: vi.fn(), logout: vi.fn() }),
    initStore: vi.fn()
  }),
  mapSessionUser: vi.fn((raw: unknown) => raw)
}));
