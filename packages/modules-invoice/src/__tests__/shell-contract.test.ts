// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The raw template the order page hands the page that mounts it
 *
 * ## Job To Be Done
 * Prove the order page hands its default slot the brand's raw template, so the page picks the layout from its own record, with the order inside it.
 *
 * ## What Breaks If These Fail
 * Every host gets one arrangement whatever the brand picks, or draws the order outside the host's chrome.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useConfig } from "@upmind-automation/headless";
import {
  BOOT_BUDGET,
  bootRecordedClient,
  handed,
  mountOrder,
  signOutRecordedClient
} from "./order-harness";
import { paidOrder } from "./recorded-orders";
import { last, map, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

describe("the raw template the order page hands its page", () => {
  beforeEach(bootRecordedClient);

  afterEach(signOutRecordedClient);

  it(
    "hands its default slot the brand's raw template",
    async () => {
      await mountOrder({ route: `/orders/${paidOrder.id}` });

      expect(handed.length).toBeGreaterThan(0);
      expect(uniq(handed)).toEqual([useConfig().ui.template.value]);
    },
    BOOT_BUDGET
  );

  it(
    "draws the order inside the layout the page picks",
    async () => {
      const wrapper = await mountOrder({ route: `/orders/${paidOrder.id}` });
      const drawn = wrapper.findAll("[data-template]");

      expect(map(drawn, found => found.attributes("data-template"))).toEqual([
        String(last(handed))
      ]);
      expect(
        drawn[0]?.text(),
        "the order never reached the page's layout"
      ).toContain(paidOrder.number);
    },
    BOOT_BUDGET
  );
});
