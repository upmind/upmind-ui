// -----------------------------------------------------------------------------
/**
 * @fileoverview promotions services — swap replaces the basket's promotions one request at a time
 *
 * ## Job To Be Done
 * A swap deletes each promotion on the basket, then posts the rejected code,
 * or puts the last history set back in one request on SWAP. That request skips
 * a code it can't apply and still answers 200, so a missing code is a failure.
 * If the add fails, the basket's codes are put back before the error surfaces.
 *
 * ## What Breaks If These Fail
 * A swap sends the wrong requests, or leaves the basket with fewer promotions
 * than the customer started with.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { map } from "lodash-es";

// -----------------------------------------------------------------------------

const post = vi.fn();
const put = vi.fn();
const del = vi.fn();

vi.mock("../../..", () => ({
  useI18n: () => ({ t: (key: string) => key }),
  useQuery: () => ({ post, put, del, useUrl: (url: string) => url }),
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
  model: { promocode: "NEW50" },
  baseModel: [{ promocode: "gbppromo" }, { promocode: "5off" }],
  history: [[{ promocode: "OLD10" }, { promocode: "OLD20" }]]
};

const deleted = () => del.mock.calls.map(([request]) => request.url);
const posted = () => post.mock.calls.map(([request]) => request.data.promocode);
const putCodes = () =>
  put.mock.calls.map(([request]) => map(request.data.promotions, "promocode"));
const basketWith = (codes: string[]) => ({
  promotions: codes.map(code => ({ promotion: { code } }))
});

beforeEach(() => {
  post.mockReset().mockResolvedValue([]);
  put
    .mockReset()
    .mockImplementation(({ data }) =>
      Promise.resolve(basketWith(map(data.promotions, "promocode")))
    );
  del.mockReset().mockResolvedValue({});
});

describe("promotions services: swap", () => {
  it("deletes every basket promotion, then posts the rejected code", async () => {
    await services.swap(context, { type: "error.platform" });

    expect(deleted()).toEqual([
      "/orders/b1/promotions/p1",
      "/orders/b1/promotions/p2"
    ]);
    expect(posted()).toEqual(["NEW50"]);
    expect(put).not.toHaveBeenCalled();
  });

  it("puts the last history set back in one request on SWAP", async () => {
    await services.swap(context, { type: "SWAP" });

    expect(deleted()).toHaveLength(2);
    expect(post).not.toHaveBeenCalled();
    expect(putCodes()).toEqual([["OLD10", "OLD20"]]);
  });

  it("puts the basket's codes back and rethrows the 422 when the swapped-in code does not qualify", async () => {
    post.mockRejectedValueOnce(INVALID);

    await expect(
      services.swap(context, { type: "error.platform" })
    ).rejects.toEqual(INVALID);

    expect(putCodes()).toEqual([["gbppromo", "5off"]]);
  });

  it("fails and restores when the SWAP request skips a code", async () => {
    put
      .mockResolvedValueOnce(basketWith(["OLD10"]))
      .mockImplementation(({ data }) =>
        Promise.resolve(basketWith(map(data.promotions, "promocode")))
      );

    await expect(services.swap(context, { type: "SWAP" })).rejects.toThrow();

    expect(putCodes()).toEqual([
      ["OLD10", "OLD20"],
      ["gbppromo", "5off"]
    ]);
  });

  it("puts the basket's codes back when a delete fails partway", async () => {
    del.mockResolvedValueOnce({}).mockRejectedValueOnce(INVALID);

    await expect(
      services.swap(context, { type: "error.platform" })
    ).rejects.toEqual(INVALID);

    expect(post).not.toHaveBeenCalled();
    expect(putCodes()).toEqual([["gbppromo", "5off"]]);
  });
});
