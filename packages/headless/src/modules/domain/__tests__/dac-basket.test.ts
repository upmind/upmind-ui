// -----------------------------------------------------------------------------
/**
 * @fileoverview DAC machine — basket rows built from the order's domain products
 *
 * ## Job To Be Done
 * Each domain product in the basket becomes a row with its SLD, TLD and
 * lower-case domain, marked as added, for the .com and .co.uk products of a
 * recorded order.
 *
 * ## What Breaks If These Fail
 * The domains page shows a basket row with the wrong SLD or TLD, or none, for
 * a domain the customer already added.
 */

import { describe, it, expect, vi } from "vitest";
import { createMachine, interpret } from "xstate";

// Circular import through the barrel: this leaf module must be stubbed for ../utils to load.
vi.mock("../../client/emailHistory/services", () => ({ default: {} }));
vi.mock("../../basketProduct/helper", () => ({
  basketSubscription: createMachine({
    id: "basket",
    initial: "idle",
    states: { idle: {} }
  })
}));

import "../utils";
import machine from "../dac.machine";
import { getFixtureBodyByKey } from "../../../../../../tests/__fixtures__";

// -----------------------------------------------------------------------------

type OrderBody = {
  data: { products: Array<{ service_identifier: string }> };
};

const noop = () => {};

function loadBasket() {
  return getFixtureBodyByKey<OrderBody>("GET orders/current").data;
}

function start() {
  return interpret(
    machine.withConfig({
      actions: {
        setAuthHelper: noop,
        setAvailabilityHelper: noop,
        loadBasket: noop,
        setBasket: noop
      }
    })
  ).start();
}

describe("dac basket", () => {
  it.each(["REFRESH", "UPDATED"] as const)(
    "builds a lower-case added row per domain product on %s",
    event => {
      const data = loadBasket();
      const service = start();

      service.send({ type: event, data });

      const rows = service.getSnapshot().context.lookups.basket;
      expect(rows).toHaveLength(2);
      expect(rows.map(row => row.domain)).toEqual([
        "up-mind-testing.com",
        "up-mind-testing.co.uk"
      ]);
      expect(rows.map(row => [row.sld, row.tld])).toEqual([
        ["up-mind-testing", ".com"],
        ["up-mind-testing", ".co.uk"]
      ]);
      expect(rows.map(row => row.productDetails.title)).toEqual([
        "up-mind-testing.com",
        "up-mind-testing.co.uk"
      ]);
      expect(rows.every(row => row.meta.added)).toBe(true);

      service.stop();
    }
  );
});
