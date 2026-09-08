// -----------------------------------------------------------------------------
/**
 * @fileoverview systemOperations generics — a handler keeps its payload and
 * result types from registration through to dispatch (AC-9)
 *
 * ## Job To Be Done
 * Prove the generic contract of register<TPayload, TResult> and
 * executeOperation<T> both ways: the type-level assertions document that the
 * handler argument narrows to TPayload and the dispatch resolves to TResult,
 * and the runtime assertions observe the SAME contract holding — the handler is
 * handed the exact payload and its return value flows back out of
 * executeOperation. Assertions come from FE-3030 requirements.md AC-9 and
 * design.md §Composable API — never from the implementation source.
 *
 * ## Harness note (surfaced, not worked around)
 * The compile-time half (expectTypeOf) is only mechanically enforced when the
 * test estate is type-checked. This package's tsconfig.build.json /
 * tsconfig.json both EXCLUDE **\/*.test.* and __tests__, and no vitest
 * `test.typecheck` project exists — so `pnpm --filter @upmind/headless
 * type-check` does NOT check this file, and the T3.2 negative control ("widen
 * register to (key, handler: Handler) ⇒ typecheck RED") is not enforceable in
 * the current harness. The runtime assertions below are therefore the load-
 * bearing proof here; the type-level enforcement gap is owed to a config owner.
 *
 * ## What Breaks If These Fail
 * A consumer registering a typed handler loses payload/return type-safety and
 * dispatches against `unknown`, so a real payload-shape mismatch ships silently.
 */

import { describe, it, expect, expectTypeOf } from "vitest";
import { useOperations } from "..";

// -----------------------------------------------------------------------------

type IdPayload = { id: string };
type OkResult = { ok: boolean };

describe("systemOperations — generic handler contract (AC-9)", () => {
  it("hands the registered handler the exact payload and returns its result", async () => {
    const { register, createOperation, executeOperation } = useOperations();
    register<IdPayload, OkResult>("ac9-typed", async payload => ({
      ok: payload.id !== ""
    }));

    const populated = createOperation<IdPayload>("ac9-typed", { id: "x" });
    const empty = createOperation<IdPayload>("ac9-typed", { id: "" });

    await expect(executeOperation<OkResult>(populated)).resolves.toEqual({
      ok: true
    });
    await expect(executeOperation<OkResult>(empty)).resolves.toEqual({
      ok: false
    });
  });

  it("narrows the handler argument to TPayload and resolves to TResult (type-level)", () => {
    const { register, executeOperation } = useOperations();

    expectTypeOf(register<IdPayload, OkResult>)
      .parameter(1)
      .toEqualTypeOf<(payload: IdPayload) => Promise<OkResult>>();

    expectTypeOf(
      executeOperation<OkResult>
    ).returns.resolves.toEqualTypeOf<OkResult>();
  });
});
