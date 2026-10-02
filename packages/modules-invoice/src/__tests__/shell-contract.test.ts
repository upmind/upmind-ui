// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The arrangement the order page hands the page that mounts it
 *
 * ## Job To Be Done
 * Prove the order page hands its default slot the arrangement it is given, so the page draws that template from its own record, with the order inside it.
 *
 * ## What Breaks If These Fail
 * An order page draws the wrong arrangement, or draws the order outside the host's chrome.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ORDER_TEMPLATE } from "../index";
import {
  BOOT_BUDGET,
  bootRecordedClient,
  mountOrder,
  signOutRecordedClient
} from "./order-harness";
import { paidOrder } from "./recorded-orders";
import { map, values } from "lodash-es";

// -----------------------------------------------------------------------------

describe("the page templates the order page takes from its host", () => {
  beforeEach(bootRecordedClient);

  afterEach(signOutRecordedClient);

  it.each(values(ORDER_TEMPLATE))(
    "draws the host's %s template when the page is given it",
    async arrangement => {
      const wrapper = await mountOrder({
        route: `/orders/${paidOrder.id}`,
        template: arrangement
      });
      const drawn = wrapper.findAll("[data-template]");

      expect(
        map(drawn, found => found.attributes("data-template")),
        `the page was given ${arrangement} and drew another template`
      ).toEqual([arrangement]);
      expect(
        drawn[0]?.text(),
        "the order never reached the host's template"
      ).toContain(paidOrder.number);
    },
    BOOT_BUDGET
  );
});
