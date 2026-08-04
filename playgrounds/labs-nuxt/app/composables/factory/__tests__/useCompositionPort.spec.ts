import { describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import { useCompositionPort } from "../useCompositionPort";
import type { LiveCompositionCell } from "../useCompositionPort.types";

function createFakeLiveCell() {
  const on = ref(false);
  const label = ref("");
  const nested = ref<{ value: string | undefined }>({ value: undefined });

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
      label: label.value,
      tags: [label.value || undefined, "kept"],
      nested: nested.value
    }),
    useMeta: () => ({
      isOn: on.value,
      isReady: computed(() => label.value.length > 0),
      isLocked: true
    })
  };

  return { cell, on, label, nested };
}

describe("@AC5 useCompositionPort", () => {
  it("survives a JSON round-trip — no reactive wrapper crosses the port", () => {
    const { cell } = createFakeLiveCell();
    const port = useCompositionPort(cell);

    const snapshot = port.snapshot();

    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it("evaluates every meta flag to a literal boolean", () => {
    const { cell, label } = createFakeLiveCell();
    const port = useCompositionPort(cell);
    label.value = "named";

    const meta = port.snapshot().meta;

    for (const value of Object.values(meta)) {
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

  it("omits undefined-valued entries from context at every depth, including array elements", () => {
    const { cell } = createFakeLiveCell();
    const port = useCompositionPort(cell);

    const context = port.snapshot().context;

    expect(context.tags).toEqual(["kept"]);
    expect(context.nested).toEqual({});
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
});
