// -----------------------------------------------------------------------------
/**
 * @module payment/__tests__/mocks
 * @description Unit-boundary mocks for the `payment` unit tests. Mirrors
 * `auth/__tests__/mocks.ts` (pattern reference, ADR-021 §Allowed reads) and
 * mocks exactly the seams the payment machine crosses: the sibling
 * `session-store` auth-subscription actor, the `system-analytics` data layer,
 * and the module's own `payment.services` HTTP boundary — never the machine
 * under test.
 *
 * {@link emitAuth} is the handle on the auth actor: a unit test decides when a
 * session arrives, and whether it arrives at all. That is what makes the
 * signed-out and session-ends scenarios (AC-11, AC-14) provable without a
 * network.
 */

import { vi } from "vitest";

// -----------------------------------------------------------------------------

/** Send an auth event into every live payment machine. */
export let emitAuth: (event: { type: string; data?: unknown }) => void = () => {
  throw new Error("No payment machine has subscribed to auth yet");
};

export const authSubscriptionMock = vi.fn(
  (sendBack: unknown, _receive?: unknown) => {
    emitAuth = sendBack as typeof emitAuth;
    return () => {};
  }
);

vi.mock("../../session-store", () => ({
  authSubscription: (...args: unknown[]) =>
    (authSubscriptionMock as unknown as (...a: unknown[]) => unknown)(...args)
}));

vi.mock("../../system-analytics", () => ({
  useDataLayer: () => ({ dataLayer: vi.fn(() => ({ push: vi.fn() })) })
}));

export const loadMock = vi.fn();
export const updateMock = vi.fn();
export const validateMock = vi.fn();
export const redirectMock = vi.fn();
export const renderMock = vi.fn();

vi.mock("../payment.services", () => ({
  default: {
    load: (...args: unknown[]) => loadMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    validate: (...args: unknown[]) => validateMock(...args),
    redirect: (...args: unknown[]) => redirectMock(...args),
    render: (...args: unknown[]) => renderMock(...args)
  }
}));

/** Forget every recorded call and drop the auth handle. */
export function resetPaymentMocks(): void {
  vi.clearAllMocks();
  emitAuth = () => {
    throw new Error("No payment machine has subscribed to auth yet");
  };
}
