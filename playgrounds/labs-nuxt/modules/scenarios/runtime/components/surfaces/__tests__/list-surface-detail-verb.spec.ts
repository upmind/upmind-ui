// -----------------------------------------------------------------------------
/**
 * @fileoverview The read verb — a row's `detail` action (`view`) OPENS the
 * read-only overlay, the read peer of the `edit` handoff.
 *
 * ## Job To Be Done
 * A declared action carrying `detail: true` opens the record to READ, not to
 * call a collection action and not to edit it: the overlay mounts on the clicked
 * row, draws it read-only, and offers no form and no save. It is the same seam
 * `edit` uses to open the editor, split by intent — one opens to read, one opens
 * to write.
 *
 * ## What Breaks If These Fail
 * The view control fires an action that does not exist (a no-op row button), or
 * it opens the editor instead — so "view" and "edit" become the same control and
 * the read overlay never appears.
 *
 * Negative control: `list-surface-detail-verb.must-fail.patch`.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { UpmForm } from "@upmind-automation/client-vue";
import { defaultRow, unverifiedRow } from "../../../../testing/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import DetailDialog from "../../DetailDialog.vue";
import ManageDialog from "../../ManageDialog.vue";
import { ListSurface } from "../index";
import { keys } from "lodash-es";
import type { ResolvedHandoff } from "../../../scenario.types";
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

function mountList(
  handoffs: Record<string, ResolvedHandoff> = RESOLVED_HANDOFFS
) {
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
      handoffs
    }
  });
}

type Wrapper = ReturnType<typeof mountList>;

const overlays = (wrapper: Wrapper) => wrapper.findAllComponents(DetailDialog);
const editors = (wrapper: Wrapper) => wrapper.findAllComponents(ManageDialog);

const openView = async (wrapper: Wrapper, row: number) => {
  await wrapper
    .findAll("li")
    [row].find('[data-test-value="view"]')
    .trigger("click");
  await flushPromises();
};

// -----------------------------------------------------------------------------

describe("the detail verb opens the read overlay", () => {
  it("offers the view control on every row", () => {
    const wrapper = mountList();

    for (const row of [0, 1]) {
      expect(
        wrapper.findAll("li")[row].find('[data-test-value="view"]').exists()
      ).toBe(true);
    }
  });

  it("mounts no overlay until the control is activated", () => {
    expect(overlays(mountList())).toHaveLength(0);
  });

  it("opens exactly one read overlay on the clicked row", async () => {
    const wrapper = mountList();

    await openView(wrapper, 1);

    expect(overlays(wrapper)).toHaveLength(1);
    expect(overlays(wrapper)[0].props("record")).toEqual(unverifiedRow);
  });

  it("opens to READ — no editor, no form, no save", async () => {
    const wrapper = mountList();

    await openView(wrapper, 0);

    expect(editors(wrapper)).toHaveLength(0);
    expect(overlays(wrapper)[0].findComponent(UpmForm).exists()).toBe(false);
    expect(document.body.querySelector('[data-test-value="save"]')).toBeNull();
  });

  it("fires no collection action on the way — reading writes nothing", async () => {
    const wrapper = mountList();

    await openView(wrapper, 1);

    for (const call of Object.values(LIVE_ACTIONS)) {
      expect(call).not.toHaveBeenCalled();
    }
  });
});
