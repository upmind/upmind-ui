// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the handoff controls (C1 — no edit path; C2 — Add does
 * nothing).
 *
 * ## Job To Be Done
 * The collection exposes `ensure · remove · setDefault · verify` and no update
 * path at all, so Add fired `ensure()` with no address to create and a row
 * could not be changed. Since Phase 3 both are HANDOFF controls: the scenario
 * declares the editor its rows open, and the control mounts that editor rather
 * than calling a collection action. What is measured here is the seam — offered
 * only where the target is registered, opens the editor carrying THAT row's id,
 * and fires no action on the way.
 *
 * ## What Breaks If These Fail
 * Add is inert again (the operator's *"Add does nothing"*) or, worse, it calls
 * `ensure()` with an empty model and the API answers a validation error the user
 * never asked for. And a declared editor that opens on the wrong record edits
 * somebody else's address.
 *
 * ## Where Add is fired from
 * `G4` moved the collection's own control out of this surface to the page
 * header, and the list kept the editor it opens. So the add cases mount the
 * PAIR — the header fed by the surface's own `update:collectionActions`, the way
 * `ScenarioPlayground` wires them — and press the header's control. Pressing a
 * control the surface no longer draws would prove nothing about either.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { defaultRow, unverifiedRow } from "../../../../testing/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import {
  RESOLVED_HANDOFFS,
  handoffsFor
} from "../../__tests__/resolved-handoffs";
import ManageDialog from "../../ManageDialog.vue";
import PageHeader from "../../PageHeader.vue";
import { ListSurface } from "../index";
import { get, keys, values } from "lodash-es";
import type { ResolvedHandoff } from "../../../scenario.types";
import type { ActionSlotItem } from "../../ActionSlots.types";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const { presentation } = clientEmails;

/** Row 0: the account's own default address. Row 1: the one the run created. */
const rows = [defaultRow, unverifiedRow];

const LIVE_ACTIONS: SurfaceActions = {
  ensure: vi.fn(),
  remove: vi.fn(),
  setDefault: vi.fn(),
  verify: vi.fn()
};

function mountList(
  handoffs: Record<string, ResolvedHandoff> = RESOLVED_HANDOFFS,
  actions: SurfaceActions = LIVE_ACTIONS
) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(actions),
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions,
      presentation,
      handoffs
    }
  });
}

type Wrapper = ReturnType<typeof mountList>;

/** The page's identity — the declaring directory, which is what the header draws. */
const NAME = "useClientEmails";

/**
 * The header and the list as the page composes them: the surface publishes the
 * collection's own actions, already bound to the handoffs it owns, and the
 * header renders them beside the title (`G4`).
 */
function mountPage(
  handoffs: Record<string, ResolvedHandoff> = RESOLVED_HANDOFFS,
  actions: SurfaceActions = LIVE_ACTIONS
) {
  const collectionActions = ref<ActionSlotItem[]>([]);

  return mount(
    defineComponent({
      setup: () => () =>
        h("div", [
          h(PageHeader, { name: NAME, actions: collectionActions.value }),
          h(ListSurface, {
            snapshot: {
              actions: keys(actions),
              context: { data: rows },
              meta: { isEmpty: false, isFiltered: false }
            },
            actions,
            presentation,
            handoffs,
            "onUpdate:collectionActions": (items: ActionSlotItem[]) => {
              collectionActions.value = items;
            }
          })
        ])
    }),
    { attachTo: document.body }
  );
}

type Page = ReturnType<typeof mountPage>;

const editors = (wrapper: Wrapper | Page) =>
  wrapper.findAllComponents(ManageDialog);

const openRow = async (wrapper: Wrapper, row: number) => {
  await wrapper
    .findAll("li")
    [row].find(`[data-test-value="${CONTROL_TEST_VALUE.edit}"]`)
    .trigger("click");
  await flushPromises();
};

const headerAdd = (page: Page) =>
  page
    .findComponent(PageHeader)
    .find(`[data-test-value="${CONTROL_TEST_VALUE.ensure}"]`);

/** The surface publishes its collection actions as it mounts; let them land. */
const settle = async (page: Page) => {
  await flushPromises();
  await page.vm.$nextTick();
};

const openAdd = async (page: Page) => {
  await settle(page);
  await headerAdd(page).trigger("click");
  await flushPromises();
};

// -----------------------------------------------------------------------------

describe("@AC3 add — the editor collects what a button never could (C2 · G4)", () => {
  it("opens the LIST's declared editor from the HEADER's control, firing no action", async () => {
    const actions = { ...LIVE_ACTIONS, ensure: vi.fn() };
    const page = mountPage(RESOLVED_HANDOFFS, actions);

    await openAdd(page);

    expect(editors(page)).toHaveLength(1);
    expect(actions.ensure).not.toHaveBeenCalled();
  });

  it("opens it on a record that does not exist yet — no id, so an empty model", async () => {
    const page = mountPage();

    await openAdd(page);

    expect(editors(page)[0].props("context")).toBeUndefined();
  });

  it("hands the editor the target the DECLARATION named, not a renderer default", async () => {
    const page = mountPage();

    await openAdd(page);

    const handoff = editors(page)[0].props("handoff") as ResolvedHandoff;
    expect(handoff.useMutate).toBe(clientEmails.useMutate);
    expect(handoff.actor).toBe(RESOLVED_HANDOFFS.add.actor);
    expect(handoff.context).toBeUndefined();
  });

  it("is not offered at all when its target is unregistered — an inert Add never ships", async () => {
    const page = mountPage(handoffsFor("edit"));
    await settle(page);

    expect(headerAdd(page).exists()).toBe(false);
    expect(editors(page)).toHaveLength(0);
  });

  it("keeps the control out of the list itself — the header renders it (G4)", async () => {
    const page = mountPage();
    await settle(page);

    expect(headerAdd(page).exists()).toBe(true);
    expect(
      page
        .findComponent(ListSurface)
        .find(`[data-test-value="${CONTROL_TEST_VALUE.ensure}"]`)
        .exists()
    ).toBe(false);
  });

  it("mounts no editor until the control is activated", async () => {
    const page = mountPage();
    await settle(page);

    expect(editors(page)).toHaveLength(0);
  });
});

describe("@AC3 edit — the row carries its own id to the editor (C1)", () => {
  it("is offered on every row even though the collection has no edit action", () => {
    const wrapper = mountList();

    expect(keys(LIVE_ACTIONS)).not.toContain("edit");
    for (const row of [0, 1]) {
      expect(
        wrapper
          .findAll("li")
          [row].find(`[data-test-value="${CONTROL_TEST_VALUE.edit}"]`)
          .exists()
      ).toBe(true);
    }
  });

  it("opens the editor on the id the handoff's own context pointer names", async () => {
    const wrapper = mountList();

    await openRow(wrapper, 1);

    expect(editors(wrapper)[0].props("context")).toEqual({
      type: clientEmails.handoff.edit.context.type,
      id: unverifiedRow.id
    });
  });

  it("re-keys onto the next row rather than serving the previous record's editor", async () => {
    const wrapper = mountList();
    const opened: unknown[] = [];

    await openRow(wrapper, 0);
    opened.push(get(editors(wrapper)[0].props("context"), "id"));
    await openRow(wrapper, 1);
    opened.push(get(editors(wrapper)[0].props("context"), "id"));

    expect(defaultRow.id).not.toBe(unverifiedRow.id);
    expect(opened).toEqual([defaultRow.id, unverifiedRow.id]);
    expect(editors(wrapper)).toHaveLength(1);
  });

  it("re-opening the SAME row keeps one editor, never a second on one record", async () => {
    const wrapper = mountList();

    await openRow(wrapper, 1);
    await openRow(wrapper, 1);

    expect(editors(wrapper)).toHaveLength(1);
  });

  it("fires no collection action on the way — the editor's save is the only write", async () => {
    const actions = {
      ensure: vi.fn(),
      remove: vi.fn(),
      setDefault: vi.fn(),
      verify: vi.fn()
    };
    const wrapper = mountList(RESOLVED_HANDOFFS, actions);

    await openRow(wrapper, 1);

    for (const call of values(actions)) {
      expect(call).not.toHaveBeenCalled();
    }
  });

  it("is withheld when its target is unregistered, exactly as add is", () => {
    const wrapper = mountList(handoffsFor("add"));

    expect(
      wrapper
        .findAll("li")[1]
        .find(`[data-test-value="${CONTROL_TEST_VALUE.edit}"]`)
        .exists()
    ).toBe(false);
  });
});
