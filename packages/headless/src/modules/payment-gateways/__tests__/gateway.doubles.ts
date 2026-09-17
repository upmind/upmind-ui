/**
 * @module payment-gateways/__tests__/gateway.doubles
 * @description Test doubles for the payment-gateways unit layer. Stands up a
 * synthetic actor carrying the gateway lifecycle vocabulary the composable
 * reads, so a unit test drives a state without a provider, a network, or the
 * production machine. Mirrors `payment/__tests__/mocks.ts` (pattern reference,
 * ADR-021 §Allowed reads).
 */

import { vi } from "vitest";
import { computed, ref, type ComputedRef } from "vue";
import { createMachine, interpret, type AnyState } from "xstate";
import type { UseActor } from "../../../utils";

// -----------------------------------------------------------------------------

export const CLICKWRAP = "You agree to the brand terms before paying.";

/** The lifecycle vocabulary the gateway composable reads off an actor. */
export const gatewayDouble = createMachine({
  predictableActionArguments: true,
  id: "gateway-double",
  initial: "loading",
  context: {} as Record<string, unknown>,
  states: {
    loading: { on: { SETTLE: "available", FAIL: "unavailable" } },
    rendering: { on: { DRAWN: "available" } },
    available: {
      initial: "idle",
      on: { PROCESS: "processing", RENDER: "rendering" },
      states: { idle: {}, valid: {}, error: {} }
    },
    processing: { on: { DONE: "processed", REFUSE: "available.error" } },
    processed: { on: { FINISH: "complete" } },
    unavailable: { type: "final" },
    complete: { type: "final" }
  }
});

export type GatewayDoubleContext = Record<string, unknown>;

/** A live actor parked in `state`, carrying `context`, with `send` spied. */
export function spawnGateway(
  state: string | { available: string } = "loading",
  context: GatewayDoubleContext = {}
): {
  actor: ComputedRef<UseActor>;
  send: ReturnType<typeof vi.fn>;
  service: ReturnType<typeof interpret>;
} {
  const service = interpret(gatewayDouble.withContext(context)).start(
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
          id: "gateway-double",
          state: snapshot,
          send,
          service
        }) as unknown as UseActor
    ),
    send,
    service
  };
}

/** An empty consumer surface — the composable holding no gateway at all. */
export const noGateway = computed<UseActor | undefined>(() => undefined);
