// -----------------------------------------------------------------------------
/**
 * @fileoverview promotions services — swap replaces the basket's promotions in one request
 *
 * ## Job To Be Done
 * A swap sends one `replace_promos` request: the rejected code after a
 * combination conflict, or the last history set on SWAP. The backend applies
 * the set as a whole or fails and keeps the basket's codes, so the error
 * reaches the machine with nothing to undo.
 *
 * ## What Breaks If These Fail
 * A swap sends the wrong codes, adds to the basket's codes instead of
 * replacing them, or hides a failed swap from the customer.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// -----------------------------------------------------------------------------

const put = vi.fn();
const del = vi.fn();

vi.mock("../../..", () => ({
  useI18n: () => ({ t: (key: string) => key }),
  useQuery: () => ({ put, del, useUrl: (url: string) => url }),
  invalidateQueryByKey: () => (value: unknown) => value
}));
vi.mock("../../../utils", () => ({
  DEBOUNCE_DELAY: 0,
  DetailedError: class extends Error {},
  ErrorOrigin: { Headless: "headless" },
  responseCodes: { Unprocessable_Entity: 422 },
  useModelParser: (_schema: unknown, model: unknown) => model,
  useValidation: () => ({ validate: () => [] })
}));

import services from "../promotions/services";
import type { PromotionsContext } from "../promotions/types";

// -----------------------------------------------------------------------------

const INVALID = { status: 422 };

const context: PromotionsContext = {
  basketId: "b1",
  promotions: [
    { id: "p1", code: "gbppromo" },
    { id: "p2", code: "5off" }
  ] as PromotionsContext["promotions"],
  model: { promocode: " NEW50 " },
  baseModel: [{ promocode: "gbppromo" }, { promocode: "5off" }],
  history: [[{ promocode: "OLD10" }, { promocode: "OLD20" }]]
};

beforeEach(() => {
  put.mockReset().mockResolvedValue({});
  del.mockReset();
});

describe("promotions services: swap", () => {
  it("replaces the basket's codes with the rejected code in one request", async () => {
    await services.swap(context, { type: "error.platform" });

    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][0]).toMatchObject({
      url: "/orders/b1",
      data: { replace_promos: true, promotions: [{ promocode: "NEW50" }] }
    });
    expect(del).not.toHaveBeenCalled();
  });

  it("replaces the basket's codes with the last history set on SWAP", async () => {
    await services.swap(context, { type: "SWAP" });

    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][0].data).toEqual({
      replace_promos: true,
      promotions: [{ promocode: "OLD10" }, { promocode: "OLD20" }]
    });
  });

  it("rejects with the backend error and sends nothing more when the replace fails", async () => {
    put.mockRejectedValueOnce(INVALID);

    await expect(
      services.swap(context, { type: "error.platform" })
    ).rejects.toEqual(INVALID);

    expect(put).toHaveBeenCalledTimes(1);
    expect(del).not.toHaveBeenCalled();
  });
});
