// -----------------------------------------------------------------------------
/**
 * @fileoverview promotions machine — a code that can't be combined replaces the basket's promotions
 *
 * ## Job To Be Done
 * A customer enters a code that the back end rejects with 409 because it can't
 * be combined with the promotions in the basket. The cart swaps it in anyway.
 * `baseModel` always mirrors the basket's codes, `history` keeps every earlier
 * set, and SWAP puts the last set back, any number of times.
 *
 * ## What Breaks If These Fail
 * The customer can never use an explicit code while auto-applied promotions
 * are in the basket, or loses those promotions with no way back.
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

import machine from "../promotions/promotions.machine";

// -----------------------------------------------------------------------------

const CONFLICT = {
  status: 409,
  message: "Unable to combine promotion NEW50 with other promotions"
};
const INVALID = { status: 422, message: "NEW50 is not a valid promotion code" };

const raw = (id: string, code: string) => ({
  id,
  promotion: { code, name: code, amount: "1" }
});

const AUTO = [raw("p1", "gbppromo"), raw("p2", "5off")];
const AUTO_MODELS = [{ promocode: "gbppromo" }, { promocode: "5off" }];

const isSettled = (state: { matches: (s: string) => boolean }) =>
  state.matches("processed") ||
  state.matches("complete") ||
  state.matches("error");

function start(
  add: ReturnType<typeof vi.fn>,
  swap: ReturnType<typeof vi.fn> = vi.fn(),
  remove: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue({})
) {
  return interpret(
    machine.withConfig({
      actions: { prefreshBasket: () => {}, refreshBasket: () => {} },
      services: {
        load: async () => ({}),
        parse: async ({ model }: { model: unknown }) => ({ model }),
        validate: async () => ({}),
        add,
        swap,
        remove
      }
    })
  ).start();
}

const refresh = (
  service: ReturnType<typeof start>,
  promotions: ReturnType<typeof raw>[]
) => service.send({ type: "REFRESH", data: { id: "b1", promotions } });

async function enterCode(service: ReturnType<typeof start>) {
  service.send({ type: "SET", data: { promocode: "NEW50" } });
  await waitFor(service, state => state.matches("valid"));
  service.send({ type: "ADD" });
}

async function startWithBasket(
  add: ReturnType<typeof vi.fn>,
  swap?: ReturnType<typeof vi.fn>,
  promotions = AUTO
) {
  const service = start(add, swap);
  await waitFor(service, state => state.matches("complete"));
  if (promotions.length) refresh(service, promotions);
  return service;
}

describe("promotions machine: baseModel and history follow the basket", () => {
  it("sets baseModel to the basket's codes and keeps each earlier set in history", async () => {
    const service = await startWithBasket(vi.fn());
    expect(service.getSnapshot().context.baseModel).toEqual(AUTO_MODELS);
    expect(service.getSnapshot().context.history).toBeUndefined();

    refresh(service, [raw("p3", "NEW50")]);
    expect(service.getSnapshot().context.baseModel).toEqual([
      { promocode: "NEW50" }
    ]);
    expect(service.getSnapshot().context.history).toEqual([AUTO_MODELS]);

    service.stop();
  });
});

describe("promotions machine: swap on a combination conflict", () => {
  it("swaps the code in when the add returns 409 and the basket has promotions", async () => {
    const swap = vi.fn().mockResolvedValue(undefined);
    const service = await startWithBasket(
      vi.fn().mockRejectedValue(CONFLICT),
      swap
    );

    await enterCode(service);
    const swapped = await waitFor(service, isSettled);

    expect(swapped.matches("processed")).toBe(true);
    expect(swap).toHaveBeenCalledTimes(1);
    expect(swap.mock.calls[0][0].model).toEqual({ promocode: "NEW50" });
    expect(swap.mock.calls[0][0].baseModel).toEqual(AUTO_MODELS);
    expect(swapped.context.model).toBeUndefined();
    expect(swapped.context.error).toBeUndefined();

    service.stop();
  });

  it("swaps back to the last history set on SWAP, again and again", async () => {
    const swap = vi.fn().mockResolvedValue(undefined);
    const service = await startWithBasket(
      vi.fn().mockRejectedValue(CONFLICT),
      swap
    );
    await enterCode(service);
    await waitFor(service, state => state.matches("complete"));
    refresh(service, [raw("p3", "NEW50")]);

    service.send({ type: "SWAP" });
    await waitFor(service, state => state.matches("complete"));
    expect(swap.mock.calls[1][1].type).toBe("SWAP");
    expect(swap.mock.calls[1][0].history.at(-1)).toEqual(AUTO_MODELS);

    refresh(service, AUTO);
    service.send({ type: "SWAP" });
    await waitFor(service, state => state.matches("complete"));
    expect(swap.mock.calls[2][0].history.at(-1)).toEqual([
      { promocode: "NEW50" }
    ]);

    service.stop();
  });

  it("ignores REMOVE and SET while a swap runs", async () => {
    let finish: () => void = () => {};
    const swap = vi.fn(
      () => new Promise<void>(resolve => (finish = () => resolve()))
    );
    const remove = vi.fn();
    const service = start(vi.fn().mockRejectedValue(CONFLICT), swap, remove);
    await waitFor(service, state => state.matches("complete"));
    refresh(service, AUTO);
    await enterCode(service);
    await waitFor(service, state => state.matches({ processing: "swap" }));

    service.send({ type: "REMOVE", data: { id: "p1" } });
    service.send({ type: "SET", data: { promocode: "OTHER" } });
    expect(service.getSnapshot().matches({ processing: "swap" })).toBe(true);
    expect(service.getSnapshot().context.model).toEqual({ promocode: "NEW50" });
    expect(remove).not.toHaveBeenCalled();

    finish();
    await waitFor(service, state => state.matches("processed"));
    service.stop();
  });

  it("lands in error with the swap's error when the swap fails", async () => {
    const service = await startWithBasket(
      vi.fn().mockRejectedValue(CONFLICT),
      vi.fn().mockRejectedValue(INVALID)
    );

    await enterCode(service);
    const failed = await waitFor(service, isSettled);

    expect(failed.matches("error")).toBe(true);
    expect(failed.context.error).toMatchObject({ status: 422 });

    service.stop();
  });

  it("shows the error as today for a 422, without swapping", async () => {
    const swap = vi.fn();
    const service = await startWithBasket(
      vi.fn().mockRejectedValue(INVALID),
      swap
    );

    await enterCode(service);
    const failed = await waitFor(service, isSettled);

    expect(failed.matches("error")).toBe(true);
    expect(swap).not.toHaveBeenCalled();
    expect(failed.context.error).toMatchObject({ status: 422 });

    service.stop();
  });

  it("shows the error as today for a 409 when the basket has no promotions", async () => {
    const swap = vi.fn();
    const service = await startWithBasket(
      vi.fn().mockRejectedValue(CONFLICT),
      swap,
      []
    );

    await enterCode(service);
    const failed = await waitFor(service, isSettled);

    expect(failed.matches("error")).toBe(true);
    expect(swap).not.toHaveBeenCalled();
    expect(failed.context.error).toMatchObject({ status: 409 });

    service.stop();
  });

  it("ignores SWAP after a normal add, because the basket still holds the earlier codes", async () => {
    const swap = vi.fn();
    const service = await startWithBasket(vi.fn(), swap);
    refresh(service, [...AUTO, raw("p3", "NEW50")]);
    expect(service.getSnapshot().context.history).toEqual([AUTO_MODELS]);

    service.send({ type: "SWAP" });

    expect(service.getSnapshot().matches("complete")).toBe(true);
    expect(swap).not.toHaveBeenCalled();

    service.stop();
  });

  it("clears history when the customer removes a promotion", async () => {
    const service = await startWithBasket(vi.fn());
    refresh(service, [raw("p3", "NEW50")]);
    expect(service.getSnapshot().context.history).toEqual([AUTO_MODELS]);

    service.send({ type: "REMOVE", data: { id: "p3" } });

    expect(service.getSnapshot().context.history).toBeUndefined();

    service.stop();
  });

  it("ignores SWAP when there is no earlier set", async () => {
    const swap = vi.fn();
    const service = await startWithBasket(vi.fn(), swap);

    service.send({ type: "SWAP" });

    expect(service.getSnapshot().matches("complete")).toBe(true);
    expect(swap).not.toHaveBeenCalled();

    service.stop();
  });
});
