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
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import {
  EMAIL_EDITOR,
  RESOLVED_HANDOFFS,
  handoffsFor
} from "../../__tests__/resolved-handoffs";
import ManageDialog from "../../ManageDialog.vue";
import { ListSurface } from "../index";
import { keys, values } from "lodash-es";
import type { ResolvedHandoff } from "../../../scenario.types";
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

const editors = (wrapper: Wrapper) => wrapper.findAllComponents(ManageDialog);

const openRow = async (wrapper: Wrapper, row: number) => {
  await wrapper
    .findAll("li")
    [row].find(`[data-test-value="${CONTROL_TEST_VALUE.edit}"]`)
    .trigger("click");
  await flushPromises();
};

const openAdd = async (wrapper: Wrapper) => {
  await wrapper
    .find(`[data-test-value="${CONTROL_TEST_VALUE.add}"]`)
    .trigger("click");
  await flushPromises();
};

// -----------------------------------------------------------------------------

describe("@AC3 add — the editor collects what a button never could (C2)", () => {
  it("opens the declared editor instead of firing a collection action", async () => {
    const actions = { ...LIVE_ACTIONS, ensure: vi.fn() };
    const wrapper = mountList(RESOLVED_HANDOFFS, actions);

    await openAdd(wrapper);

    expect(editors(wrapper)).toHaveLength(1);
    expect(actions.ensure).not.toHaveBeenCalled();
  });

  it("opens it on a record that does not exist yet — no id, so an empty model", async () => {
    const wrapper = mountList();

    await openAdd(wrapper);

    expect(editors(wrapper)[0].props("contextId")).toBeUndefined();
  });

  it("hands the editor the target the DECLARATION named, not a renderer default", async () => {
    const wrapper = mountList();

    await openAdd(wrapper);

    const handoff = editors(wrapper)[0].props("handoff") as ResolvedHandoff;
    expect(handoff.scenario.key).toBe(EMAIL_EDITOR.key);
    expect(handoff.actor).toBe(clientEmails.scope.actor);
    expect(handoff.contextFrom).toBeUndefined();
  });

  it("is not offered at all when its target is unregistered — an inert Add never ships", () => {
    const wrapper = mountList(handoffsFor("edit"));

    expect(
      wrapper.find(`[data-test-value="${CONTROL_TEST_VALUE.add}"]`).exists()
    ).toBe(false);
    expect(editors(wrapper)).toHaveLength(0);
  });

  it("mounts no editor until the control is activated", () => {
    expect(editors(mountList())).toHaveLength(0);
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

  it("opens the editor on the id the handoff's own contextFrom points at", async () => {
    const wrapper = mountList();

    await openRow(wrapper, 1);

    expect(editors(wrapper)[0].props("contextId")).toBe(unverifiedRow.id);
  });

  it("re-keys onto the next row rather than serving the previous record's editor", async () => {
    const wrapper = mountList();
    const opened: unknown[] = [];

    await openRow(wrapper, 0);
    opened.push(editors(wrapper)[0].props("contextId"));
    await openRow(wrapper, 1);
    opened.push(editors(wrapper)[0].props("contextId"));

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
