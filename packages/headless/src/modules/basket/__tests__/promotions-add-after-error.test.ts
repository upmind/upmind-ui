// -----------------------------------------------------------------------------
/**
 * @fileoverview promotions machine — ADD is accepted from a settled state
 *
 * ## Job To Be Done
 * A failed add leaves the machine in `error` with the typed code still in the
 * model; a REMOVE moves it on to `complete` with the model intact. Clicking
 * Apply again sends a bare ADD. The machine must run the add from these states,
 * not only from `valid`.
 *
 * ## What Breaks If These Fail
 * The second Apply is dropped. The composable's waitFor sees an already-settled
 * state, resolves at once, and the UI closes the voucher form with no request.
 */

import { describe, it, expect, vi } from "vitest";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { isEqual } from "lodash-es";

// -----------------------------------------------------------------------------
// Mocks — the real utils index pulls the whole module graph in; the machine
// only needs this surface

vi.mock("../../system", () => ({
  useI18n: () => ({ t: (key: string) => key, tm: vi.fn() })
}));
vi.mock("../../feedback", () => ({
  useFeedback: () => ({ addError: vi.fn() })
}));
vi.mock("../../product", () => ({ PromotionDisplayTypes: { NAME: "name" } }));
vi.mock("../promotions/services", () => ({ default: {} }));
vi.mock("../../../utils", () => ({
  useTime: () => ({ WAIT: 10, ERROR: 1000 }),
  parseError: (message: string, key: string) => [
    { message, instancePath: `/${key}` }
  ],
  useModelParser: (_schema: unknown, model: unknown) => model,
  mapToHeadlessError: (error: unknown) => error,
  useValidationParser: (error: { data: unknown }) => error.data,
  isDirty: (a: unknown, b: unknown) => !isEqual(a, b),
  responseCodes: { Unprocessable_Entity: 422, Conflict: 409, Timeout: 408 },
  useTranslateField: (item: Record<string, unknown>, field: string) =>
    item?.[field],
  useTranslateName: (item: { name?: string }) => item?.name,
  DEBOUNCE_DELAY: 350
}));

import machine from "../../basket-promotions/promotions.machine";

// -----------------------------------------------------------------------------

const INVALID = { status: 422, message: "promocode invalid" };

const isSettled = (state: { matches: (s: string) => boolean }) =>
  state.matches("processed") ||
  state.matches("complete") ||
  state.matches("error");

function start(add: ReturnType<typeof vi.fn>) {
  return interpret(
    machine.withConfig({
      actions: { prefreshBasket: () => {}, refreshBasket: () => {} },
      services: {
        load: async () => ({
          basketId: "b1",
          promotions: [{ id: "p1", code: "OLD" }]
        }),
        parse: async ({ model }: { model: unknown }) => ({ model }),
        validate: async () => ({}),
        add,
        remove: vi.fn().mockResolvedValue({})
      }
    })
  ).start();
}

describe("promotions machine: ADD from a settled state", () => {
  it("re-applies the retained code after a failed add and a REMOVE", async () => {
    const add = vi.fn().mockRejectedValueOnce(INVALID).mockResolvedValue([]);
    const service = start(add);
    await waitFor(service, state => state.matches("complete"));

    service.send({ type: "SET", data: { promocode: "BAD" } });
    await waitFor(service, state => state.matches("valid"));
    service.send({ type: "ADD" });
    const failed = await waitFor(service, isSettled);
    expect(failed.matches("error")).toBe(true);
    expect(add).toHaveBeenCalledTimes(1);

    service.send({ type: "REMOVE", data: { id: "p1" } });
    const removed = await waitFor(service, state => state.matches("complete"));
    expect(removed.context.model).toEqual({ promocode: "BAD" });
    expect(removed.context.error).toBeUndefined();

    service.send({ type: "ADD" });
    expect(service.getSnapshot().matches("processing")).toBe(true);
    const applied = await waitFor(service, isSettled);
    expect(applied.matches("processed")).toBe(true);
    expect(add).toHaveBeenCalledTimes(2);
    expect(add.mock.calls[1][0].model).toEqual({ promocode: "BAD" });

    service.stop();
  });

  it("retries from `error` without an edit", async () => {
    const add = vi.fn().mockRejectedValue(INVALID);
    const service = start(add);
    await waitFor(service, state => state.matches("complete"));

    service.send({ type: "SET", data: { promocode: "BAD" } });
    await waitFor(service, state => state.matches("valid"));
    service.send({ type: "ADD" });
    await waitFor(service, isSettled);

    service.send({ type: "ADD" });
    expect(service.getSnapshot().matches("processing")).toBe(true);
    const retried = await waitFor(service, isSettled);
    expect(retried.matches("error")).toBe(true);
    expect(add).toHaveBeenCalledTimes(2);

    service.stop();
  });
});
