// @vitest-environment jsdom
/**
 * @fileoverview `useClientEmailsPort` — the canary's real call site (Task 38,
 * AC5). Proves the CAPABILITY the type alone cannot: booting the live
 * `useClientEmails` cell through the adapter yields a `port.table` that is a
 * working channel over that cell's own query model, and holds the AC5 snapshot
 * invariants against a real context rather than a fake one.
 */
import { describe, expect, it, vi } from "vitest";
// Load order, not decoration: pulling the port first evaluates
// `useClientEmails.ts` before `createScopedComposable` is initialised through
// the headless barrel's import cycle (`(0, createScopedComposable) is not a
// function` — the pre-existing break `inspector.spec.ts` still dies on).
// Importing the builder module ahead of it settles the cycle.
import "../../../../../../packages/headless/src/modules/scope/scope.builder";
import { useClientEmailsPort } from "../useClientEmailsPort";

// The live cell boots the platform's brand/org bootstrap. Nothing recorded
// answers it in this lane, so the socket is closed rather than answered with an
// invented payload; no assertion below reads a response body.
vi.stubGlobal("fetch", () =>
  Promise.reject(new Error("network is closed in this spec"))
);

/** Every path under `value` held by a function — what may not cross the port. */
function functionPaths(value: unknown, path = "context"): string[] {
  if (typeof value === "function") return [path];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      functionPaths(entry, `${path}[${index}]`)
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      functionPaths(entry, `${path}.${key}`)
    );
  }
  return [];
}

describe("@AC5 useClientEmailsPort — the adapter hands the live channel through", () => {
  it("populates port.table with a channel over the collection's own query model", () => {
    const port = useClientEmailsPort();

    expect(port.table).toBeDefined();
    // `perPage: 10` is the schema's ratified `pagination.limit` default, not a
    // page size this spec chose: `limit: 0` left the pager with nothing to step
    // to. Do not "restore" the 0 — the source is the authority here.
    expect(port.table?.read()).toMatchObject({
      filter: {},
      sort: [{ field: "created_at", dir: "desc" }],
      pagination: { page: 1, perPage: 10 }
    });
    expect(port.actions.sortBy).toBeTypeOf("function");
  });

  it("evaluates the live meta to literal booleans", () => {
    const port = useClientEmailsPort();

    const meta = port.snapshot().meta;

    expect(Object.keys(meta).length).toBeGreaterThan(0);
    for (const value of Object.values(meta)) {
      expect(typeof value).toBe("boolean");
    }
    expect(port.getMeta()).toEqual(meta);
  });

  it("crosses the port as plain data — no live context member and no channel reaches the core", () => {
    const port = useClientEmailsPort();

    const snapshot = port.snapshot();

    expect(functionPaths(snapshot.context)).toEqual([]);
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(snapshot.context.table).toBeUndefined();
  });

  // Runs last: the scope registry caches this cell for the process, so the sort
  // emitted here outlives the test.
  it("routes an emitted intent into the composable, which reports it back on the next pull", async () => {
    const port = useClientEmailsPort();

    port.table?.emit({ type: "sort", sort: [{ field: "email", dir: "asc" }] });

    await vi.waitFor(() =>
      expect(port.table?.read().sort).toEqual([{ field: "email", dir: "asc" }])
    );
    // The published query carries the schema's ratified `pagination` defaults —
    // the cursor included, since the model is where the page is now stated —
    // alongside the emitted sort; `toEqual` stays exact so a silently widening
    // model is a failure, not a pass.
    expect(port.snapshot().context.query).toEqual({
      pagination: { limit: 10, offset: 0 },
      sort: [{ field: "email", dir: "asc" }]
    });
  });
});
