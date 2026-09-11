// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview `authOverlayTarget` — what the sign-in overlay is told to carry
 *
 * ## Job To Be Done
 * The auth overlay target builds a FRESH query rather than spreading the route,
 * so anything the arriving url meant for the page has to be carried by name.
 * Prove the deep-link instruction is carried that way, and that nothing invents
 * one when the arriving url had none.
 *
 * ## What Breaks If These Fail
 * Either the instruction is dropped on the sign-in redirect (the client signs in
 * and lands with nothing open), or a blanket spread drags the ADD-SESSION words
 * onto a target that means to set them itself, re-opening the add-session
 * journey over a client who was only asked to sign in.
 *
 * @anchor init-deep-link.feature
 * @anchor AC6
 */

import { describe, expect, it } from "vitest";
import { QUERY_PARAMS } from "@upmind-automation/types";
import { authOverlayTarget } from "../labs";
import { ADD_SESSION_PARAM, InitIntent } from "../labs.constants";
import { ROUTE } from "../types";
import { arriveAt, recordedInvoiceId } from "./init-deep-link.recordings";
import { get, keys } from "lodash-es";

// -----------------------------------------------------------------------------

describe("the sign-in target an arriving deep link is diverted to", () => {
  it("carries the instruction by name, without dragging the add-session words with it (@AC6)", () => {
    const arriving = arriveAt(ROUTE.ORDER, {
      params: { [QUERY_PARAMS.ORDER_ID]: recordedInvoiceId("unpaid") },
      query: { [QUERY_PARAMS.INIT]: InitIntent.PAY }
    });

    const target = authOverlayTarget(arriving);

    expect(get(target, ["query", QUERY_PARAMS.INIT])).toBe(InitIntent.PAY);
    expect(keys(get(target, ["query"]) ?? {})).not.toContain(ADD_SESSION_PARAM);
  });

  it("does not read the instruction back off a sign-in target that never carried one (@AC6)", () => {
    const arriving = arriveAt(ROUTE.ORDER, {
      params: { [QUERY_PARAMS.ORDER_ID]: recordedInvoiceId("unpaid") }
    });

    const target = authOverlayTarget(arriving);

    expect(keys(get(target, ["query"]) ?? {})).not.toContain(QUERY_PARAMS.INIT);
  });
});
