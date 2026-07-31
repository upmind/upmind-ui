import { describe, expect, it } from "vitest";
import type { CompositionPort } from "../port.types";
import type {
  ControlledTableChannel,
  TableIntent,
  TableModel
} from "../table-channel.types";

/**
 * @AC-4 — the seam port + controlled-table channel shape. Structural smoke
 * tests only: the exhaustive behavioural coverage lives with the consumers
 * (`reflect.test.ts`, `world.test.ts`, the journeys-lane adapter).
 */
describe("@AC-4 CompositionPort / ControlledTableChannel — structural shape", () => {
  it("a minimal port with no table channel satisfies CompositionPort", () => {
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

  it("meta crosses as already-evaluated booleans — never a ComputedRef/wrapper", () => {
    const port: CompositionPort = {
      snapshot: () => ({ actions: [], context: {}, meta: { isReady: true } }),
      getMeta: () => ({ isReady: true }),
      actions: {}
    };

    for (const value of Object.values(port.getMeta())) {
      expect(typeof value).toBe("boolean");
    }
  });

  it("a table channel is the read()/emit() consume-down/emit-up pair, dependency-free", () => {
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

  it("TableModel/TableIntent are JSON-round-trippable — no framework types on the channel's data", () => {
    const model: TableModel = {
      filter: { status: "active" },
      sort: [{ field: "name", dir: "asc" }],
      pagination: { page: 1, perPage: 10 }
    };

    expect(JSON.parse(JSON.stringify(model))).toStrictEqual(model);
  });
});
