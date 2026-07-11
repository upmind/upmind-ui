// -----------------------------------------------------------------------------
/**
 * @module scope/__tests__/mocks
 * @description Unit-boundary mocks for the scope-primitive unit tests. Mirrors
 * `auth/__tests__/mocks.ts` and `account/__tests__/mocks.ts` (pattern reference,
 * ADR-021 §Allowed reads). The scope primitive crosses exactly one sibling
 * seam at runtime: `scope.utils.resolveSelfActor` reads the active actor from
 * the `session-store` barrel to resolve `SELF`. That barrel is faked here so
 * the unit tests never boot the real multi-session store or touch the network.
 *
 * `sessionState.activeActor` is mutable so a test can drive the "who is the
 * current session actor" input that `SELF` resolution depends on (ADR-001 §5).
 */

import { vi } from "vitest";
import type { ScopeActorTypes } from "../scope.types";

// -----------------------------------------------------------------------------

/**
 * The active session actor that `SELF` resolves to. `undefined` models "no
 * active session" (the anonymous case ADR-001 §5 falls back to GUEST for).
 */
export const sessionState: { activeActor: ScopeActorTypes | undefined } = {
  activeActor: undefined
};

vi.mock("../../session-store", () => ({
  useSessionStore: () => ({
    useContext: () => ({
      activeActor: { value: sessionState.activeActor }
    })
  })
}));
