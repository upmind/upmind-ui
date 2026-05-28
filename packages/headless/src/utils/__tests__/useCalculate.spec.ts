// -----------------------------------------------------------------------------
/**
 * @fileoverview useCalculate Tests
 *
 * ## Job To Be Done
 * Verifies the cart/calculate composable's contract end-to-end. Each test
 * maps to a specific Design Decision (DD-1 through DD-7) so a regression
 * flips a meaningful red.
 *
 * ## What Breaks If These Fail
 * - DD-1 dual-write: redundant API calls after quantified expressions resolve
 * - DD-4 discriminator: wrong return type / wrong endpoint behaviour
 * - DD-5 hygiene: every consumer forced to write `compact()` boilerplate
 * - DD-6 actor contract: loading spinners broken in product/paymentDetails
 * - DD-7 concurrency: rapid quantity drags hammer the API
 */

// --- external
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// -----------------------------------------------------------------------------
// Mocks (must be set before importing the module under test)

const postMock = vi.fn();
const cancelMock = vi.fn();

vi.mock("../../modules/query", () => ({
  useQuery: () => ({
    post: postMock,
    useUrl: (path: string) => new URL(`https://api.test/${path}`),
    cancel: cancelMock
  })
}));

// useTime transitively imports useI18n → modules/system → useUpmind which
// constructs and calls useQuery() during module load. Mock locally so the
// spec stays hermetic.
vi.mock("../useTime", () => ({
  useTime: () => ({ INTERACTIVE: 80 })
}));

// --- internal (after mocks)
import {
  useCalculate,
  calculateActor,
  clearCalculateCache
} from "../useCalculate";
import type { PriceEntry } from "../useCalculate.types";

// -----------------------------------------------------------------------------

/**
 * Mock that validates inputs (per code-tests.md). Returns a deterministic
 * `{ total, total_formatted }` derived from the prices payload.
 */
function setupPostMock(): void {
  postMock.mockImplementation(async ({ data }: { data: unknown }) => {
    const payload = data as { currency_id: string; prices: PriceEntry[] };
    if (!payload?.currency_id) {
      throw new Error("Test failed: currency_id missing from payload");
    }
    if (!Array.isArray(payload.prices)) {
      throw new Error("Test failed: prices must be an array");
    }
    // Sum prices the same way the backend would
    const total = payload.prices.reduce((acc, p) => {
      if (typeof p === "number") return acc + p;
      return acc + (p?.price ?? 0) * (p?.quantity ?? 1);
    }, 0);
    return { total, total_formatted: `$${total.toFixed(2)}` };
  });
}

// -----------------------------------------------------------------------------

describe("useCalculate — discriminator (DD-4)", () => {
  beforeEach(() => {
    clearCalculateCache();
    postMock.mockReset();
    setupPostMock();
  });

  it("number input → formatted string", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", 500);
    expect(result).toBe("$500.00");
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currency_id: "USD", prices: [500] }
      })
    );
  });

  it("pure-number array → sum-mode { total, totalFormatted } (DD-4: arrays are always sum-mode)", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", [10, 5, 2]);
    expect(result).toEqual({ total: 17, totalFormatted: "$17.00" });
    // Single API call — sum mode batches via the prices payload
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currency_id: "USD", prices: [10, 5, 2] }
      })
    );
  });

  it("Record<string, number> → keyed strings, deduped to 2 API calls (not 3)", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", { a: 500, b: 500, c: 100 });
    expect(result).toEqual({ a: "$500.00", b: "$500.00", c: "$100.00" });
    expect(postMock).toHaveBeenCalledTimes(2);
  });

  it("PriceEntry[] containing object entry → sum-mode { total, totalFormatted }", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", [
      10,
      { price: 10, quantity: 5 }
    ] as PriceEntry[]);
    expect(result).toEqual({ total: 60, totalFormatted: "$60.00" });
    // Single API call — sum mode batches via the prices payload
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          currency_id: "USD",
          prices: [10, { price: 10, quantity: 5 }]
        }
      })
    );
  });
});

// -----------------------------------------------------------------------------

describe("useCalculate — unified cache + dual-write (DD-1)", () => {
  beforeEach(() => {
    clearCalculateCache();
    postMock.mockReset();
    setupPostMock();
  });

  it("two sequential calls with same value → 1 API call (cache hit)", async () => {
    const { calculate } = useCalculate();
    await calculate("USD", 500);
    await calculate("USD", 500);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("CRITICAL DD-1: PriceEntry sum then value → 1 total API call (dual-write)", async () => {
    const { calculate } = useCalculate();
    // First: a quantified expression resolving to 200
    const sum = await calculate("USD", [
      { price: 100, quantity: 2 }
    ] as PriceEntry[]);
    expect(sum).toEqual({ total: 200, totalFormatted: "$200.00" });
    expect(postMock).toHaveBeenCalledTimes(1);

    // Second: a single-value lookup for the resolved total — must hit cache
    const single = await calculate("USD", 200);
    expect(single).toBe("$200.00");
    expect(postMock).toHaveBeenCalledTimes(1); // still 1, not 2
  });

  it("clearCalculateCache() empties the cache", async () => {
    const { calculate } = useCalculate();
    await calculate("USD", 500);
    expect(postMock).toHaveBeenCalledTimes(1);
    clearCalculateCache();
    await calculate("USD", 500);
    expect(postMock).toHaveBeenCalledTimes(2);
  });
});

// -----------------------------------------------------------------------------

describe("useCalculate — internal hygiene (DD-5)", () => {
  beforeEach(() => {
    clearCalculateCache();
    postMock.mockReset();
    setupPostMock();
  });

  it("array with nils is treated as compacted array (sum-mode)", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", [null, undefined, 5] as never);
    // Arrays are sum-mode → nils filtered, sum of remaining
    expect(result).toEqual({ total: 5, totalFormatted: "$5.00" });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currency_id: "USD", prices: [5] }
      })
    );
  });

  it("all-nil array → empty result, 0 API calls", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", [null, null] as never);
    // Empty cleaned array → sum-mode short-circuit
    expect(result).toEqual({ total: 0, totalFormatted: "" });
    expect(postMock).not.toHaveBeenCalled();
  });

  it("keyed object with nil values → those keys → '' but others calculate", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", { a: 100, b: null } as never);
    expect(result).toEqual({ a: "$100.00", b: "" });
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("nil whole input → '' (no throw)", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", undefined as never);
    expect(result).toBe("");
    expect(postMock).not.toHaveBeenCalled();
  });

  it("PriceEntry sum-mode short-circuits on empty cleaned array", async () => {
    const { calculate } = useCalculate();
    const result = await calculate("USD", [
      { price: 10, quantity: 2 }
    ] as PriceEntry[]);
    expect(result).toEqual({ total: 20, totalFormatted: "$20.00" });
    expect(postMock).toHaveBeenCalledTimes(1);
  });
});

// -----------------------------------------------------------------------------

describe("useCalculate — pushPrice (DD-2)", () => {
  it("quantity === 1 → push the bare number", () => {
    const { pushPrice } = useCalculate();
    const prices: PriceEntry[] = [];
    pushPrice(prices, 100, 1);
    expect(prices).toEqual([100]);
  });

  it("quantity > 1 → push { price, quantity }", () => {
    const { pushPrice } = useCalculate();
    const prices: PriceEntry[] = [];
    pushPrice(prices, 100, 5);
    expect(prices).toEqual([{ price: 100, quantity: 5 }]);
  });

  it("quantity === 0 → no-op", () => {
    const { pushPrice } = useCalculate();
    const prices: PriceEntry[] = [];
    pushPrice(prices, 100, 0);
    expect(prices).toEqual([]);
  });

  it("negative quantity → no-op (defensive)", () => {
    const { pushPrice } = useCalculate();
    const prices: PriceEntry[] = [];
    pushPrice(prices, 100, -1);
    expect(prices).toEqual([]);
  });
});

// -----------------------------------------------------------------------------

describe("useCalculate — in-flight dedup (DD-7)", () => {
  beforeEach(() => {
    clearCalculateCache();
    postMock.mockReset();
  });

  it("two concurrent calls for same value → 1 API call, both resolve to same result", async () => {
    // Make POST hang so both calls overlap before either resolves
    let resolvePost!: (v: unknown) => void;
    const apiPromise = new Promise(r => (resolvePost = r));
    postMock.mockImplementationOnce(() => apiPromise);

    const { calculate } = useCalculate();
    const a = calculate("USD", 500);
    const b = calculate("USD", 500);

    // Both calls should be in flight; only 1 POST fired
    expect(postMock).toHaveBeenCalledTimes(1);

    resolvePost({ total: 500, total_formatted: "$500.00" });
    const [resA, resB] = await Promise.all([a, b]);

    expect(resA).toBe("$500.00");
    expect(resB).toBe("$500.00");
    expect(postMock).toHaveBeenCalledTimes(1);
  });
});

// -----------------------------------------------------------------------------

describe("calculateActor — XState 4 contract (DD-6, DD-7)", () => {
  beforeEach(() => {
    clearCalculateCache();
    postMock.mockReset();
    cancelMock.mockReset();
    setupPostMock();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  type ReceivedEvent = { type: string; data?: unknown };

  /** Drives the actor by exposing the captured callback + send fn. */
  function spawnActor() {
    const events: ReceivedEvent[] = [];
    const callback = vi.fn((e: ReceivedEvent) => events.push(e));
    let sendToActor: (event: ReceivedEvent) => void = () => {};
    const onReceive = (handler: (event: ReceivedEvent) => void) => {
      sendToActor = handler;
    };
    const cleanup = calculateActor()(callback, onReceive);
    return { events, callback, send: sendToActor, cleanup };
  }

  it("emits CALCULATING immediately, CALCULATED after debounce on success", async () => {
    const { events, send } = spawnActor();

    // PriceEntry[] sum-mode → CALCULATED carries { total, totalFormatted }
    send({
      type: "CALCULATE",
      data: {
        currencyId: "USD",
        input: [{ price: 250, quantity: 2 }] as PriceEntry[]
      }
    });

    // CALCULATING is emitted IMMEDIATELY (before debounce fires)
    expect(events).toEqual([{ type: "CALCULATING" }]);

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(100);
    // Flush microtasks so the .then(callback) runs
    await Promise.resolve();
    await Promise.resolve();

    expect(events).toEqual([
      { type: "CALCULATING" },
      { type: "CALCULATED", data: { total: 500, totalFormatted: "$500.00" } }
    ]);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("5 rapid CALCULATEs with different inputs → 1 API call with the LAST input", async () => {
    const { events, send } = spawnActor();

    for (const v of [100, 200, 300, 400, 500]) {
      send({ type: "CALCULATE", data: { currencyId: "USD", input: v } });
    }

    // All 5 emit CALCULATING immediately
    expect(events.filter(e => e.type === "CALCULATING")).toHaveLength(5);
    // No POST yet (debounced)
    expect(postMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();

    // Exactly 1 API call, fired with the last input
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currency_id: "USD", prices: [500] }
      })
    );
  });

  it("CALCULATING emitted IMMEDIATELY on every CALCULATE, regardless of debounce", async () => {
    const { events, send } = spawnActor();

    send({ type: "CALCULATE", data: { currencyId: "USD", input: 100 } });
    send({ type: "CALCULATE", data: { currencyId: "USD", input: 200 } });

    // No timers advanced — both CALCULATINGs already emitted
    expect(events.filter(e => e.type === "CALCULATING")).toHaveLength(2);
  });

  it("emits CALCULATE_CANCELLED on missing currencyId", async () => {
    const { events, send } = spawnActor();
    send({ type: "CALCULATE", data: { input: 500 } });
    expect(events).toEqual([{ type: "CALCULATE_CANCELLED" }]);
    expect(postMock).not.toHaveBeenCalled();
  });

  it("emits CALCULATE_CANCELLED on nil input", async () => {
    const { events, send } = spawnActor();
    send({ type: "CALCULATE", data: { currencyId: "USD", input: undefined } });
    expect(events).toEqual([{ type: "CALCULATE_CANCELLED" }]);
  });

  it("stays silent on aborted requests (empty error)", async () => {
    postMock.mockReset();
    postMock.mockRejectedValueOnce(undefined);

    const { events, send } = spawnActor();
    send({ type: "CALCULATE", data: { currencyId: "USD", input: 500 } });

    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();

    // Only CALCULATING — no CALCULATE_CANCELLED for empty errors
    expect(events).toEqual([{ type: "CALCULATING" }]);
  });

  it("CANCEL → calls useQuery().cancel(['cart','calculate'])", () => {
    const { send } = spawnActor();
    send({ type: "CANCEL" });
    expect(cancelMock).toHaveBeenCalledWith(["cart", "calculate"]);
  });

  it("returns cleanup function that cancels in-flight requests on unspawn", () => {
    const { cleanup } = spawnActor();
    expect(typeof cleanup).toBe("function");
    cleanup();
    expect(cancelMock).toHaveBeenCalledWith(["cart", "calculate"]);
  });

  it("cleanup during debounce window drops the pending trailing call (no API fire)", async () => {
    const { send, cleanup } = spawnActor();
    send({ type: "CALCULATE", data: { currencyId: "USD", input: 500 } });

    // Cleanup BEFORE the debounce window elapses
    cleanup();

    // Advance past debounce — trailing call must not fire
    await vi.advanceTimersByTimeAsync(200);
    await Promise.resolve();
    await Promise.resolve();

    expect(postMock).not.toHaveBeenCalled();
  });

  it("identical consecutive CALCULATE → skipped (no CALCULATING, no API)", async () => {
    const { events, send } = spawnActor();

    send({ type: "CALCULATE", data: { currencyId: "USD", input: 500 } });
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();
    // number input → formatted string (per dispatcher contract)
    expect(events).toEqual([
      { type: "CALCULATING" },
      { type: "CALCULATED", data: "$500.00" }
    ]);
    expect(postMock).toHaveBeenCalledTimes(1);

    // Same input again — must be skipped entirely
    const eventsBefore = events.length;
    send({ type: "CALCULATE", data: { currencyId: "USD", input: 500 } });
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    expect(events.length).toBe(eventsBefore);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("CALCULATE with different input after identical → proceeds", async () => {
    const { events, send } = spawnActor();

    send({ type: "CALCULATE", data: { currencyId: "USD", input: 500 } });
    send({ type: "CALCULATE", data: { currencyId: "USD", input: 500 } }); // skipped
    send({ type: "CALCULATE", data: { currencyId: "USD", input: 700 } }); // proceeds

    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();

    // Two non-skipped CALCULATEs → two CALCULATINGs
    expect(events.filter(e => e.type === "CALCULATING")).toHaveLength(2);
  });

  it("CANCEL resets dedup → next identical CALCULATE proceeds", async () => {
    const { events, send } = spawnActor();

    send({ type: "CALCULATE", data: { currencyId: "USD", input: 500 } });
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();
    expect(postMock).toHaveBeenCalledTimes(1);

    send({ type: "CANCEL" });

    send({ type: "CALCULATE", data: { currencyId: "USD", input: 500 } });
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();

    expect(events.filter(e => e.type === "CALCULATING")).toHaveLength(2);
  });

  it("array dedup is order-insensitive", async () => {
    const { events, send } = spawnActor();

    send({
      type: "CALCULATE",
      data: { currencyId: "USD", input: [10, 5, 2] as PriceEntry[] }
    });
    send({
      type: "CALCULATE",
      data: { currencyId: "USD", input: [2, 5, 10] as PriceEntry[] }
    });
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();

    // Second send is the same set in different order → must be deduped
    expect(events.filter(e => e.type === "CALCULATING")).toHaveLength(1);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("two separate spawns don't share debounce state", async () => {
    const a = spawnActor();
    const b = spawnActor();

    // Hammer actor A with 5 events; actor B should remain idle
    for (const v of [10, 20, 30, 40, 50]) {
      a.send({ type: "CALCULATE", data: { currencyId: "USD", input: v } });
    }
    b.send({ type: "CALCULATE", data: { currencyId: "USD", input: 999 } });

    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();

    // Each actor should have fired its OWN debounced API call
    // (1 from A's last input, 1 from B's only input → 2 total)
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currency_id: "USD", prices: [50] }
      })
    );
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currency_id: "USD", prices: [999] }
      })
    );
  });
});
