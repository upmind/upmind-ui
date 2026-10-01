// -----------------------------------------------------------------------------
/**
 * @fileoverview systemOperations route-guard dispatch — the return path end to
 * end (T3.3)
 *
 * ## Job To Be Done
 * Prove the actual return path a consuming funnel guard runs, inside the
 * package, against a fixture router: a real navigation to a guarded route
 * carrying ?oid dispatches the stored operation to its handler with the stored
 * payload, then strips the param (AC-2 at integration altitude); and a foreign
 * oid surfaces DetailedError while the guard still strips the param
 * (AC-3 at integration altitude). The guard here is the fixture from
 * design.md §Detection Pattern — the module under test is driven for real, no
 * mock. Assertions come from FE-3030 design.md §Detection Pattern and tasks.md
 * T3.3 — never from the implementation source.
 *
 * ## What Breaks If These Fail
 * A funnel guard wired per the documented pattern never actually dispatches on
 * return, or leaves ?oid on the URL so a refresh re-triggers the dispatch.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRouter, createMemoryHistory, type Router } from "vue-router";
import { useOperations } from "..";
import { DetailedError } from "../../../utils";
import { omit } from "lodash-es";

// -----------------------------------------------------------------------------

const blank = { render: () => null };

type GuardHarness = {
  router: Router;
  caughtError: () => unknown;
};

function makeGuardedRouter(): GuardHarness {
  const { executeOperation } = useOperations();
  let caught: unknown = null;

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: blank },
      { path: "/return", component: blank }
    ]
  });

  router.beforeEach(async to => {
    const oid = to.query.oid as string | undefined;
    if (!oid) return true;

    await executeOperation(oid).catch(error => {
      caught = error;
    });
    return { path: to.path, query: omit(to.query, "oid") };
  });

  return { router, caughtError: () => caught };
}

beforeEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
});

describe("systemOperations — route-guard dispatch (T3.3)", () => {
  it("AC-2 · a returning guard dispatches the stored operation and strips ?oid", async () => {
    const { register, createOperation, getOperation } = useOperations();
    const handler = vi.fn().mockResolvedValue({ redirect: "/invoices" });
    register("guard-dispatch", handler);
    const oid = createOperation("guard-dispatch", { invoiceId: "inv_1" });

    const { router } = makeGuardedRouter();
    await router.push(`/return?oid=${oid}`);

    expect(handler).toHaveBeenCalledWith({ invoiceId: "inv_1" });
    expect(router.currentRoute.value.query.oid).toBeUndefined();
    expect(getOperation(oid)).toBeNull();
  });

  it("AC-3 · a returning guard with a foreign oid surfaces DetailedError and still strips ?oid", async () => {
    const { router, caughtError } = makeGuardedRouter();
    await router.push("/return?oid=foreign-tab");

    expect(caughtError()).toBeInstanceOf(DetailedError);
    expect(router.currentRoute.value.query.oid).toBeUndefined();
  });
});
