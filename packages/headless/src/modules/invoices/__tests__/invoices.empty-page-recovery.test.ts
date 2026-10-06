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

import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, unref } from "vue";
import { startScenarioReplay } from "@upmind-automation/test-fixtures/replay-server";
import { InvoiceCategoryCode } from "@upmind-automation/types";
import { useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { resetInvoiceScopes, seedClientSession } from "./invoices.int-helpers";
import { server } from "./setup.integration";

afterEach(resetInvoiceScopes);

// FE-3237 AC4
describe("AC-22: the empty-page recovery", () => {
  it("keeps a failed read past page one on its page", async () => {
    await seedClientSession();
    const gaps = startScenarioReplay(server);

    const cell = useInvoices()
      .as(ScopeActorTypes.CLIENT)
      .for(InvoiceCategoryCode.NEW_CONTRACT as never);
    const actions = cell.useActions() as unknown as {
      setPage: (page: number) => Promise<void>;
    };
    const context = cell.useContext() as unknown as Record<string, unknown>;
    const meta = cell.useMeta() as unknown as Record<string, unknown>;

    await actions.setPage(2);
    await vi.waitFor(() => {
      expect(gaps.gaps().length).toBeGreaterThan(0);
      expect(unref(meta.isLoading)).toBe(false);
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    await nextTick();

    expect(unref(meta.hasError)).toBe(true);
    expect(unref(context.pagination)).toMatchObject({ page: 2 });
    expect(
      (unref(context.query) as { pagination: unknown }).pagination
    ).toEqual({ limit: 10, offset: 10 });
  });
});
