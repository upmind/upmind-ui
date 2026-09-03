// -----------------------------------------------------------------------------
/**
 * @fileoverview The read-only detail overlay draws the LIVE row, not a frozen
 * copy captured when it opened — for both the record it shows AND the actions it
 * offers. A row mutation that lands while the overlay is open (a `reveal`
 * filling an encrypted row's blanked `note` and flipping `meta.isRevealed`) must
 * reach the overlay without re-opening it.
 *
 * ## Job To Be Done
 * A client opens a secret's detail, then presses Reveal. The composable writes
 * the plaintext into the row's `note` and sets `meta.isRevealed` (via
 * `useContext().data`), the surface reflects a fresh snapshot, and the overlay
 * must show the plaintext AND swap its `reveal` control for `hide` — exactly as
 * the row beneath it does.
 *
 * ## What Breaks If This Fails
 * The overlay keeps showing the blanked note and the `reveal` control forever
 * (until re-opened), because it is bound to the row captured at open time rather
 * than re-resolved from the live collection.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { map } from "lodash-es";
import clientNotes from "../../../../useClientNotes/client-notes.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import DetailDialog from "../../DetailDialog.vue";
import { ListSurface } from "../index";
import { getRow } from "./table-geometry";
import { keys } from "lodash-es";
import type { ActionSlotItem } from "../../ActionSlots.types";
import type { ListRow } from "../ListSurface.types";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const { presentation } = clientNotes;

/** An encrypted row as the mapper produces it: `note` blanked, not revealed. */
const secretHidden: ListRow = {
  id: "a1",
  label: "AWS secret key",
  note: "",
  encrypted: true,
  meta: {
    isSecret: true,
    isRevealed: false,
    isPinned: false,
    isHiddenFromClient: false,
    isLinkedToProduct: false
  }
};

/** The SAME row after `reveal`: plaintext in `note`, `isRevealed` true. */
const secretRevealed: ListRow = {
  ...secretHidden,
  note: "S3CR3T-plaintext",
  meta: { ...(secretHidden.meta as object), isRevealed: true }
};

const plainRow: ListRow = {
  id: "b2",
  label: "A plain note",
  note: "nothing hidden here",
  encrypted: false,
  meta: {
    isSecret: false,
    isRevealed: false,
    isPinned: false,
    isHiddenFromClient: false,
    isLinkedToProduct: false
  }
};

const LIVE_ACTIONS = {
  reveal: vi.fn(),
  hide: vi.fn(),
  convert: vi.fn(),
  setPinned: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn()
} as unknown as SurfaceActions;

function snapshotFor(data: ListRow[]) {
  return {
    actions: keys(LIVE_ACTIONS),
    context: { data },
    meta: { isEmpty: false, isFiltered: false }
  };
}

function mountList(data: ListRow[]) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: snapshotFor(data),
      actions: LIVE_ACTIONS,
      presentation,
      handoffs: RESOLVED_HANDOFFS
    }
  });
}

const detailRecord = (wrapper: ReturnType<typeof mountList>): ListRow =>
  wrapper.findComponent(DetailDialog).props("record") as ListRow;

const overlayActionNames = (wrapper: ReturnType<typeof mountList>): string[] =>
  map(
    wrapper.findComponent(DetailDialog).props("actions") as ActionSlotItem[],
    "name"
  );

const openDetailRow0 = async (wrapper: ReturnType<typeof mountList>) => {
  await getRow(wrapper, 0).find('[data-test-value="view"]').trigger("click");
  await flushPromises();
};

// -----------------------------------------------------------------------------

describe("the detail overlay draws the live row, not a frozen open-time copy", () => {
  it("shows the decrypted note when a reveal lands while the overlay is open", async () => {
    const wrapper = mountList([secretHidden, plainRow]);

    await openDetailRow0(wrapper);
    expect(detailRecord(wrapper).note).toBe("");

    await wrapper.setProps({
      snapshot: snapshotFor([secretRevealed, plainRow])
    });
    await flushPromises();

    expect(detailRecord(wrapper).note).toBe("S3CR3T-plaintext");
  });

  it("swaps its reveal control for hide when the row is revealed under it", async () => {
    const wrapper = mountList([secretHidden, plainRow]);

    await openDetailRow0(wrapper);
    expect(overlayActionNames(wrapper)).toContain("reveal");
    expect(overlayActionNames(wrapper)).not.toContain("hide");

    await wrapper.setProps({
      snapshot: snapshotFor([secretRevealed, plainRow])
    });
    await flushPromises();

    expect(overlayActionNames(wrapper)).toContain("hide");
    expect(overlayActionNames(wrapper)).not.toContain("reveal");
  });
});
