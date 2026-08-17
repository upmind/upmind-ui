// -----------------------------------------------------------------------------
/**
 * @fileoverview The refinement AC for the overlay's action bar: it carries the
 * row's OTHER actions but never the verb that opened it — you do not "view" a
 * record you are already viewing — while Edit rides along and opens the existing
 * editor rather than an inline edit inside the detail.
 *
 * ## Job To Be Done
 * The overlay inherits the row's actions so a reader can act without going back
 * to the list, but the opener (`view`) among them would be a control that
 * re-opens the surface it sits in. Edit is the one that matters: it opens the
 * same `useMutate` editor the row's own Edit opens — a handoff, never a form
 * grown inside the read overlay.
 *
 * ## What Breaks If These Fail
 * The overlay offers "View" on the thing being viewed (a dead control), or Edit
 * turns the read overlay into an editor in place — the two-surface split (read
 * vs write) collapses.
 *
 * Negative control: `list-surface-detail-excludes-opener.must-fail.patch`.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import DetailDialog from "../../DetailDialog.vue";
import ManageDialog from "../../ManageDialog.vue";
import { ListSurface } from "../index";
import { find, keys, map } from "lodash-es";
import type { ActionSlotItem } from "../../ActionSlots.types";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const { presentation } = clientEmails;
const rows = [defaultRow, unverifiedRow];

const LIVE_ACTIONS: SurfaceActions = {
  ensure: vi.fn(),
  remove: vi.fn(),
  setDefault: vi.fn(),
  verify: vi.fn()
};

function mountList() {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(LIVE_ACTIONS),
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions: LIVE_ACTIONS,
      presentation,
      handoffs: RESOLVED_HANDOFFS
    }
  });
}

type Wrapper = ReturnType<typeof mountList>;

const openView = async (wrapper: Wrapper, row: number) => {
  await wrapper
    .findAll("li")
    [row].find('[data-test-value="view"]')
    .trigger("click");
  await flushPromises();
};

const overlayActions = (wrapper: Wrapper): ActionSlotItem[] =>
  wrapper.findComponent(DetailDialog).props("actions") as ActionSlotItem[];

// -----------------------------------------------------------------------------

describe("the overlay's action bar excludes the verb that opened it", () => {
  it("does not offer the detail/view verb inside the detail", async () => {
    const wrapper = mountList();

    await openView(wrapper, 1);

    expect(map(overlayActions(wrapper), "name")).not.toContain("view");
  });

  it("still offers the row's other actions — Edit among them", async () => {
    const wrapper = mountList();

    await openView(wrapper, 1);

    expect(map(overlayActions(wrapper), "name")).toContain("edit");
  });
});

describe("Edit from the detail opens the existing editor, not an inline edit", () => {
  it("hands off to the useMutate editor when Edit is triggered", async () => {
    const wrapper = mountList();

    await openView(wrapper, 1);
    expect(wrapper.findAllComponents(ManageDialog)).toHaveLength(0);

    const edit = find(overlayActions(wrapper), {
      name: "edit"
    }) as ActionSlotItem;
    edit.onSelect();
    await flushPromises();

    const editors = wrapper.findAllComponents(ManageDialog);
    expect(editors).toHaveLength(1);
    expect(editors[0].props("context")).toEqual({
      type: clientEmails.handoff.edit.context.type,
      id: unverifiedRow.id
    });
  });
});
