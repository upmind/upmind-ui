// -----------------------------------------------------------------------------
/**
 * @fileoverview domain machine — the default choice of the smart domain field
 *
 * ## Job To Be Done
 * A customer who meets the domain field with no domain starts on "Register a
 * new domain", whether or not the field is required. "I'll decide later" stays
 * on offer when the field is optional.
 *
 * ## What Breaks If These Fail
 * An optional domain field opens on "I'll decide later", so customers pass
 * over the domain they came to register.
 */

import { describe, it, expect, vi } from "vitest";
import { createMachine, interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// -----------------------------------------------------------------------------
// Mocks — the machine only needs this surface; the DAC child is not under test

vi.mock("../dac.machine", () => ({
  default: createMachine({ id: "dac", initial: "idle", states: { idle: {} } })
}));
vi.mock("../services", () => ({ default: {} }));
vi.mock("../../query", () => ({ useQuery: vi.fn(), isAbortError: vi.fn() }));
vi.mock("../../basketProduct/helper", () => ({ basketSubscription: vi.fn() }));
vi.mock("../../session/helper", () => ({ authSubscription: vi.fn() }));
vi.mock("../../system", () => ({
  useI18n: () => ({ t: (key: string) => key }),
  useLocale: vi.fn()
}));
vi.mock("../../brand", () => ({ useBrand: vi.fn() }));
vi.mock("../../product", () => ({}));
vi.mock("../../basketProduct/utils", () => ({ parseBasketProduct: vi.fn() }));
vi.mock("../../product/utils", () => ({
  calculateBillingTerm: vi.fn(),
  parseProductDetails: vi.fn(),
  parseProductProps: vi.fn(),
  parseTermDetails: vi.fn()
}));
vi.mock("../../feedback", () => ({
  useFeedback: () => ({ addError: vi.fn() })
}));
vi.mock("../../../utils", () => ({
  DOMAIN_LIKE_VALIDATION: /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i,
  ErrorOrigin: { Headless: "headless" },
  mapToHeadlessError: (error: unknown) => error,
  responseCodes: { Unprocessable_Entity: 422 },
  useTime: () => ({ WAIT: 10, ERROR: 1000 })
}));

import machine from "../domain.machine";
import { DomainTypes } from "../types";

// -----------------------------------------------------------------------------

const CHOICES = [DomainTypes.register, DomainTypes.existing];

function start(context: Record<string, unknown>) {
  const service = interpret(
    machine
      .withConfig({
        actions: {
          setBasketHelper: () => {},
          setAuthHelper: () => {},
          loadBasket: () => {},
          setBasketProducts: () => {}
        },
        services: { getClientDomains: async () => [] }
      })
      .withContext(context as never)
  ).start();
  service.send({ type: "REFRESH", data: {} });
  return service;
}

const isSettled = (state: { matches: (s: string) => boolean }) =>
  !state.matches("subscribing") && !state.matches("loading");

describe("domain machine: default type", () => {
  it.each([
    ["optional", false],
    ["required", true]
  ])(
    "opens on register when the field is %s and has no domain",
    async (_label, required) => {
      const service = start({ choices: [...CHOICES], required });
      const state = await waitFor(service, isSettled);

      expect(state.context.type).toBe(DomainTypes.register);
      expect(state.matches("dac")).toBe(true);
      expect(state.context.choices).toContain(
        required ? DomainTypes.register : DomainTypes.skip
      );

      service.stop();
    }
  );
});
