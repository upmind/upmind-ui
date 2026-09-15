// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview `?init` deep-link — surviving the scope path push
 *
 * ## Job To Be Done
 * The playground moves a client onto a scoped path of its own accord. Prove the
 * email's instruction rides that push, while the words the sign-in journey owns
 * are left behind.
 *
 * ## What Breaks If These Fail
 * The instruction is dropped on a redirect the client never asked for, so the
 * deep link lands them on the right screen with nothing happening.
 *
 * ## Why this file holds exactly ONE beat
 * The url bag is process-wide and adopts the url it BOOTS at, so a spec that
 * has already run a guard through it (which spends the instruction, by design)
 * can no longer observe the arriving one. The app only ever sees the boot case.
 * The `afterAll` below enforces the one-beat rule mechanically: a second beat
 * added later would pass vacuously, so it fails the file instead.
 *
 * @anchor init-deep-link.feature
 * @anchor AC6
 */

import { afterAll, describe, expect, it, vi } from "vitest";
import { QUERY_PARAMS } from "@upmind-automation/types";
import {
  ACTOR_PARAM,
  ADD_SESSION_PARAM,
  InitIntent,
  MODE_PARAM
} from "../labs.constants";
import { ROUTE } from "../types";
import { arriveAt, recordedInvoiceId } from "./init-deep-link.recordings";
import { includes } from "lodash-es";

// -----------------------------------------------------------------------------

let beats = 0;

afterAll(() => {
  expect(beats).toBe(1);
});

describe("a scope path push the playground performs on arrival", () => {
  it("carries the instruction through, and leaves the sign-in journey's own words behind (@AC6)", async () => {
    beats += 1;
    const invoiceId = recordedInvoiceId("unpaid");
    arriveAt(ROUTE.ORDER, {
      params: { [QUERY_PARAMS.ORDER_ID]: invoiceId },
      query: {
        [QUERY_PARAMS.INIT]: InitIntent.PAY,
        [MODE_PARAM]: "collect",
        [ADD_SESSION_PARAM]: "1"
      }
    });

    const { usePlaygroundUrlState } =
      await import("~/composables/usePlaygroundUrlState");
    const scopedPath = `/${ROUTE.ORDER}/${invoiceId}/${ACTOR_PARAM}/client`;

    await vi.waitFor(() =>
      expect(
        includes(
          usePlaygroundUrlState().preserveQuery(scopedPath),
          `${QUERY_PARAMS.INIT}=${InitIntent.PAY}`
        )
      ).toBe(true)
    );

    const pushed = usePlaygroundUrlState().preserveQuery(scopedPath);
    expect(includes(pushed, `${ADD_SESSION_PARAM}=`)).toBe(false);
    expect(includes(pushed, `${MODE_PARAM}=`)).toBe(false);
  });
});
