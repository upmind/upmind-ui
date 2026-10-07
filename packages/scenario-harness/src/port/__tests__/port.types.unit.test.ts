/**
 * @fileoverview CompositionPort and ControlledTableChannel shape tests
 *
 * ## Job To Be Done
 * Pin the seam contract shape: a port literal and a table channel written
 * against these types compile, and table data survives a JSON round-trip.
 * These are shape pins. Real adapter behaviour is proven in the journeys lane.
 *
 * ## What Breaks If These Fail
 * The port or channel types change under every adapter written against them,
 * or table data stops being plain JSON that can cross the seam.
 */

import { describe, expect, it } from "vitest";
import type { CompositionPort } from "../port.types";
import type {
  ControlledTableChannel,
  TableIntent,
  TableModel
} from "../table-channel.types";

/**
 * @AC-4 — the seam port + controlled-table channel shape. Shape pins, not
 * behaviour: every port/channel value in this file is a literal the test
 * itself wrote one line above the assertion that reads it back — there is
 * no package-local `CompositionPort` PRODUCER to run these assertions
 * against (real adapters are executor-sited outside this package's
 * boundary by design, ADR-027 d.4/§9), so a broken real producer (e.g. one
 * that leaks a `ComputedRef` through `getMeta()`, or a `read()` that
 * returns a live-aliased model) cannot turn any case here red. The
 * behavioural proof — that a REAL adapter's meta/context cross as plain,
 * already-evaluated booleans — lives in
 * `tests/journeys/scenario-harness/reflection.int.test.ts` (currently
 * blocked on FE-3051, see that file's header). These cases are retained as
 * compile-time/structural documentation of the contract shape.
 */
describe("@AC-4 CompositionPort / ControlledTableChannel — structural shape (shape pin, not behaviour — see file header)", () => {
  it("[shape pin] a minimal port literal typechecks against CompositionPort and echoes back what it was given", () => {
    const port: CompositionPort = {
      snapshot: () => ({ actions: [], context: {}, meta: {} }),
      getMeta: () => ({}),
      actions: {}
    };

    expect(port.table).toBeUndefined();
    expect(port.snapshot()).toStrictEqual({
      actions: [],
      context: {},
      meta: {}
    });
  });

  it("[shape pin] a hand-built table channel's read()/emit() pair typechecks and echoes what it was given", () => {
    let applied: TableIntent | undefined;
    const model: TableModel = {
      filter: {},
      sort: [{ field: "createdAt", dir: "desc" }],
      pagination: { page: 1, perPage: 20, total: 3 }
    };
    const channel: ControlledTableChannel = {
      read: () => model,
      emit: intent => {
        applied = intent;
      }
    };
    const port: CompositionPort = {
      snapshot: () => ({ actions: [], context: { data: [] }, meta: {} }),
      getMeta: () => ({}),
      actions: {},
      table: channel
    };

    port.table?.emit({ type: "paginate", page: 2 });

    expect(port.table?.read()).toStrictEqual(model);
    expect(applied).toStrictEqual({ type: "paginate", page: 2 });
  });

  it("[shape pin] a TableModel literal round-trips through JSON — documents the no-framework-types-on-channel-data contract", () => {
    const model: TableModel = {
      filter: { status: "active" },
      sort: [{ field: "name", dir: "asc" }],
      pagination: { page: 1, perPage: 10 }
    };

    expect(JSON.parse(JSON.stringify(model))).toStrictEqual(model);
  });
});
