// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The order page's payment banner, and where it lands
 *
 * ## Job To Be Done
 * Prove the order page shows and dismisses through `foundation`'s one announcement — the one the shell's bar draws.
 *
 * ## What Breaks If These Fail
 * A paid order never tells the client so, or a stale banner outlives the order page.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAnnouncement } from "@upmind-automation/foundation";
import {
  BOOT_BUDGET,
  bootRecordedClient,
  mountOrder,
  signOutRecordedClient
} from "./order-harness";
import { paidOrder, unpaidOrder } from "./recorded-orders";

// -----------------------------------------------------------------------------

const LEFT_OVER = {
  text: "left over from the page before",
  type: "danger"
} as const;

// -----------------------------------------------------------------------------

describe("the order page's banner", () => {
  beforeEach(bootRecordedClient);

  afterEach(() => {
    useAnnouncement().dismiss();
    signOutRecordedClient();
  });

  it(
    "puts a paid order's success banner on the announcement the bar draws",
    async () => {
      const bar = useAnnouncement();

      await mountOrder({ route: `/orders/${paidOrder.id}` });

      expect(bar.isVisible.value, "the paid order announced nothing").toBe(
        true
      );
      expect(bar.announcement.value?.type).toBe("success");
      expect(bar.announcement.value?.text).toBeTruthy();
    },
    BOOT_BUDGET
  );

  it(
    "takes a left-over banner down for an order with nothing to announce",
    async () => {
      const bar = useAnnouncement();
      bar.show(LEFT_OVER);

      await mountOrder({ route: `/orders/${unpaidOrder.id}` });

      expect(bar.isVisible.value, "the stale banner is still up").toBe(false);
      expect(bar.announcement.value).toBeNull();
    },
    BOOT_BUDGET
  );

  it(
    "takes its banner down when the order page goes away",
    async () => {
      const bar = useAnnouncement();
      const wrapper = await mountOrder({
        route: `/orders/${paidOrder.id}`
      });
      expect(bar.isVisible.value).toBe(true);

      wrapper.unmount();

      expect(bar.isVisible.value, "the banner outlived the order page").toBe(
        false
      );
    },
    BOOT_BUDGET
  );
});
