// @vitest-environment happy-dom
/**
 * @fileoverview invoices — a failed read past page one stays on its page
 *
 * ## Job To Be Done
 * Prove the empty-page recovery (design 8.3) acts only on a settled read with
 * no error: when the read of page two fails, the order history stays on page
 * two and reports the failure, rather than taking the failure for an empty
 * page and moving the client back to page one.
 *
 * ## What Breaks If These Fail
 * A dropped connection on page two silently throws the client back to page
 * one, so a retry reads the wrong page.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import { InvoiceCategoryCode } from "@upmind-automation/types";
import { InvoicesContextTypes, useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { resetInvoiceScopes, seedClientSession } from "./invoices.int-helpers";
import { server } from "./setup.integration";

const PAGE_ONE = join(
  import.meta.dirname,
  "scenarios/page-through-my-orders-and-choose-the-page-size/02"
);

afterEach(resetInvoiceScopes);

/** Answers the order-history read of page two, and only that read, with a server error. */
function failPageTwo(): { served: () => number } {
  let served = 0;
  server?.use(
    http.get("*/api/invoices", ({ request }) => {
      const params = new URL(request.url).searchParams;
      if (
        params.get("filter[category.slug]") !==
          InvoiceCategoryCode.NEW_CONTRACT ||
        params.get("limit") !== "10" ||
        params.get("offset") !== "10"
      )
        return undefined;
      served += 1;
      return HttpResponse.json(
        {
          status: "error",
          data: null,
          error: { code: 500, message: "Server Error" }
        },
        { status: 500 }
      );
    })
  );
  return { served: () => served };
}

// FE-3237 AC4
describe("AC-22: the empty-page recovery", () => {
  it("keeps a failed read past page one on its page", async () => {
    const replay = startScenarioReplay(server);
    await seedClientSession();
    replayStep(server, PAGE_ONE);
    const pageTwo = failPageTwo();

    const cell = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoicesContextTypes.NEW_CONTRACT);
    const actions = cell.useActions();
    const context = cell.useContext();
    const meta = cell.useMeta();

    await actions.setPage(2);
    await vi.waitFor(
      () => {
        expect(pageTwo.served()).toBeGreaterThan(0);
        expect(meta.isLoading.value).toBe(false);
      },
      { timeout: 20000 }
    );

    expect(context.pagination.value).toMatchObject({ page: 2 });
    expect(context.query.value.pagination).toEqual({ limit: 10, offset: 10 });
    expect(meta.hasError.value).toBe(true);
    expect(replay.gaps()).toEqual([]);
  }, 30000);
});
