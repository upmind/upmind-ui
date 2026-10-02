// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview Which order the organism fetches
 *
 * ## Job To Be Done
 * Prove the organism fetches and shows the order `route.params.oid` names.
 *
 * ## What Breaks If These Fail
 * An order page shows another client's order, or no order at all.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BOOT_BUDGET,
  bootRecordedClient,
  mountOrder,
  readableText,
  signOutRecordedClient
} from "./order-harness";
import {
  invoiceRequests,
  outboundRequests,
  paidOrder,
  unpaidOrder
} from "./recorded-orders";

// -----------------------------------------------------------------------------

function idsAskedFor(): string[] {
  const asked = new Set<string>();

  for (const entry of invoiceRequests()) {
    const id = /\/invoices\/([0-9a-f-]{36})/.exec(entry)?.[1];
    if (id) asked.add(id);
  }
  return [...asked];
}

// -----------------------------------------------------------------------------

describe("the order the organism goes and gets", () => {
  beforeEach(bootRecordedClient);

  afterEach(signOutRecordedClient);

  it(
    "goes to the order the route names",
    async () => {
      const wrapper = await mountOrder({ route: `/orders/${unpaidOrder.id}` });

      expect(
        idsAskedFor(),
        `never asked for an order at all: ${outboundRequests().join("\n  ")}`
      ).not.toEqual([]);
      expect(
        idsAskedFor(),
        `asked for an order the route never named: ${invoiceRequests().join("\n  ")}`
      ).toEqual([unpaidOrder.id]);
      expect(
        readableText(wrapper),
        "the route named an order and the screen shows another one"
      ).toContain(unpaidOrder.number);
      expect(readableText(wrapper)).not.toContain(paidOrder.number);
    },
    BOOT_BUDGET
  );
});
