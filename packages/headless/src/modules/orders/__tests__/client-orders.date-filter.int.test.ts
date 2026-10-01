// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — a date filter takes both value forms (AC-8)
 *
 * ## Job To Be Done
 * Prove the named date setters `dateCreated` and `datePaid` send a relative
 * period and an absolute moment on the wire, that a relative period keeps
 * its sign in the past and in the future, and that no date write is refused.
 * The raw query string holds `%2B7_days`, so the `+` survives the serialiser
 * and never becomes a space (design 8.3, wire literal form).
 *
 * ## Provenance
 * Each value is parsed off its recorded operator-form probe. The strict
 * replay pool answers each request with that probe, so the published total
 * is the total staging returned for that date filter.
 *
 * ## What Breaks If These Fail
 * A "last 7 days" or "next 7 days" filter is refused by validation or loses
 * its sign on the wire, so the client narrows to the wrong orders.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  observeOrderRequests,
  probeName,
  recordedParam,
  seedClientSession
} from "./client-orders.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

async function bootSelfCollection() {
  await seedClientSession();
  const orders = useClientOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;
let observer: ReturnType<typeof observeOrderRequests>;

describe("client-orders — a date filter takes both value forms (AC-8)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it.each([
    ["dateCreated", "created_at", "before"],
    ["datePaid", "paid_datetime", "gte"],
    ["datePaid", "paid_datetime", "after"]
  ] as const)(
    "%s(value, '%s|%s') sends the recorded value, and the pool answers with its probe",
    async (setter, column, op) => {
      const name = probeName(column, op);
      const key = `filter[${column}|${op}]`;
      const value = recordedParam(name, key);

      orders.useActions().filters[setter](value, op);

      await vi.waitFor(() =>
        expect(observer.latestParams().get(key)).toBe(value)
      );
      await vi.waitFor(() =>
        expect(orders.useContext().pagination.value?.total).toBe(
          captured(name).total
        )
      );
      expect(orders.useContext().error.value).toBeUndefined();
    }
  );

  it("filter[created_at|after]=-7_days reaches the wire from the relative period", async () => {
    orders.useActions().filters.dateCreated("-7_days", "after");

    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[created_at|after]")).toBe(
        "-7_days"
      )
    );
    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.total).toBe(
        captured(probeName("created_at", "after")).total
      )
    );
    expect(orders.useContext().error.value).toBeUndefined();
  });

  it("a future period keeps its plus sign in the raw query string as %2B7_days", async () => {
    orders.useActions().filters.dateCreated("+7_days", "before");

    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[created_at|before]")).toBe(
        "+7_days"
      )
    );
    const raw = new URL(observer.all().at(-1)!.url).search;
    expect(raw).toContain("filter%5Bcreated_at%7Cbefore%5D=%2B7_days");
  });

  it("an absolute moment keeps its space: filter[paid_datetime|gte]=2026-09-01 00:00:00", async () => {
    orders.useActions().filters.datePaid("2026-09-01 00:00:00", "gte");

    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[paid_datetime|gte]")).toBe(
        "2026-09-01 00:00:00"
      )
    );
    expect(orders.useContext().error.value).toBeUndefined();
  });
});
