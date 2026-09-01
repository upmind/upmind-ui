/**
 * @module basket-billing/__tests__/billing.doubles
 * @description Test double for the basket-billing composable unit layer. Parks a
 * synthetic actor in a billing lifecycle state so a unit test drives the
 * `useBasketBilling` API without a basket, a network, or the production machine.
 * Mirrors `payment-gateways/__tests__/gateway.doubles` (pattern reference, ADR-021).
 */

import { computed, ref, type ComputedRef } from "vue";
import { createMachine, interpret, type AnyState } from "xstate";
import { vi } from "vitest";
import type { UseActor } from "../../../utils";

// -----------------------------------------------------------------------------

/** The lifecycle vocabulary the billing composable reads off an actor. */
export const billingDouble = createMachine({
  predictableActionArguments: true,
  id: "billing-double",
  initial: "subscribing",
  context: {} as Record<string, unknown>,
  states: {
    subscribing: {},
    loading: {},
    available: {
      initial: "checking",
      on: { WAIT: ".waiting", RESUME: ".checking" },
      states: { checking: {}, valid: {}, invalid: {}, waiting: {} }
    },
    processing: {},
    processed: {},
    error: {},
    complete: {}
  }
});

/** A live actor parked in `state`, carrying `context`, with `send` spied. */
export function spawnBilling(
  state: string | Record<string, string> = "subscribing",
  context: Record<string, unknown> = {}
): {
  actor: ComputedRef<UseActor>;
  send: ReturnType<typeof vi.fn>;
  service: ReturnType<typeof interpret>;
} {
  const service = interpret(billingDouble.withContext(context)).start(
    state as never
  );

  const snapshot = ref<AnyState>(service.getSnapshot());
  service.subscribe(next => {
    snapshot.value = next;
  });

  const send = vi.fn((event: never) => service.send(event));

  return {
    actor: computed(
      () =>
        ({
          id: "billing-double",
          state: snapshot,
          send,
          service
        }) as unknown as UseActor
    ),
    send,
    service
  };
}
