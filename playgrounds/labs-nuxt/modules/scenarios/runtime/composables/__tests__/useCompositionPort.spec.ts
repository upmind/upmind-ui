/**
 * @module scenarios/runtime/composables/__tests__/useCompositionPort.spec
 * @description What the adapter itself owns after W-D29 narrowed it to one
 * level: top-level derefs, function omission, literal-boolean meta,
 * next-pull-fresh reads and a caller's channel handed straight through.
 * JSON-plainness at depth is `reflect()`'s, proven at the seam in
 * `reflect.int.spec.ts` — never re-proven here.
 *
 * Negative control: `port-table-fabricated.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { computed, isRef, ref } from "vue";
import { useCompositionPort } from "../useCompositionPort";
import { filter, flatMap, has, isFunction, isObject, values } from "lodash-es";
import type { LiveCompositionCell } from "../useCompositionPort.types";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";

const deepValues = (value: unknown): unknown[] =>
  isObject(value)
    ? flatMap(values(value), inner => [inner, ...deepValues(inner)])
    : [];

/** A cell in the shape `LiveContext` declares — refs at the TOP level only. */
function createFakeLiveCell() {
  const on = ref(false);
  const label = ref("");

  const cell: LiveCompositionCell = {
    useActions: () => ({
      turnOn: () => {
        on.value = true;
      },
      rename: (input?: unknown) => {
        label.value = (input as { label: string }).label;
      }
    }),
    useContext: () => ({
      label,
      tags: computed(() => [label.value, "kept"]),
      destroy: () => undefined
    }),
    useMeta: () => ({
      isOn: on.value,
      isReady: computed(() => label.value.length > 0),
      isLocked: true
    })
  };

  return { cell, on, label };
}

/** A channel as a CALLER builds one — the object `port.table` must hand back. */
function createCallerChannel(): ControlledTableChannel {
  return {
    read: () => ({
      filter: { verified: true },
      sort: [{ field: "email", dir: "asc" }],
      pagination: { page: 2, perPage: 25 }
    }),
    emit: () => undefined
  };
}

describe("@AC5 useCompositionPort", () => {
  it("derefs every value the cell publishes — no ref or computed crosses the port", () => {
    const { cell, label } = createFakeLiveCell();
    const port = useCompositionPort(cell);
    label.value = "named";

    const snapshot = port.snapshot();

    expect(filter(deepValues(snapshot), isRef)).toEqual([]);
    expect(snapshot.context.label).toBe("named");
    expect(snapshot.context.tags).toEqual(["named", "kept"]);
  });

  it("drops a callable context entry rather than handing a function across the seam", () => {
    const { cell } = createFakeLiveCell();
    const port = useCompositionPort(cell);

    const snapshot = port.snapshot();

    expect(has(snapshot.context, "destroy")).toBe(false);
    expect(filter(deepValues(snapshot.context), isFunction)).toEqual([]);
  });

  it("evaluates every meta flag to a literal boolean", () => {
    const { cell, label } = createFakeLiveCell();
    const port = useCompositionPort(cell);
    label.value = "named";

    const meta = port.snapshot().meta;

    for (const value of values(meta)) {
      expect(typeof value).toBe("boolean");
    }
    expect(meta).toEqual({ isOn: false, isReady: true, isLocked: true });
  });

  it("reflects a reactive source change on the next pull", () => {
    const { cell, on } = createFakeLiveCell();
    const port = useCompositionPort(cell);

    expect(port.snapshot().meta.isOn).toBe(false);
    on.value = true;

    expect(port.snapshot().meta.isOn).toBe(true);
  });

  it("getMeta() and snapshot().meta each independently track a live mutation — neither reads a stale value the other cached", () => {
    const { cell, on } = createFakeLiveCell();
    const port = useCompositionPort(cell);

    expect(port.getMeta().isOn).toBe(false);

    on.value = true;

    // snapshot() is read first here, on purpose — proving it isn't reading
    // back whatever getMeta() cached above, before getMeta() is asked again.
    expect(port.snapshot().meta.isOn).toBe(true);
    expect(port.getMeta().isOn).toBe(true);
  });

  it("hands the caller's own channel through on port.table — the same object, never a reshaped copy", () => {
    const { cell } = createFakeLiveCell();
    const channel = createCallerChannel();

    const port = useCompositionPort(cell, { table: channel });

    expect(port.table).toBe(channel);
    expect(port.table?.read).toBe(channel.read);
    expect(port.table?.emit).toBe(channel.emit);
    expect(port.table?.read()).toEqual(channel.read());
  });

  it("leaves port.table undefined for a module whose caller supplies no channel", () => {
    const { cell } = createFakeLiveCell();

    const port = useCompositionPort(cell);

    expect(port.table).toBeUndefined();
  });

  it("keeps the wired channel out of the snapshot, and the snapshot deref'd and next-pull-fresh", () => {
    const { cell, on } = createFakeLiveCell();
    const port = useCompositionPort(cell, { table: createCallerChannel() });

    const snapshot = port.snapshot();

    expect(snapshot.context.table).toBeUndefined();
    expect(filter(deepValues(snapshot), isRef)).toEqual([]);
    for (const value of values(snapshot.meta)) {
      expect(typeof value).toBe("boolean");
    }

    on.value = true;

    expect(port.snapshot().meta.isOn).toBe(true);
  });
});
