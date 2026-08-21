// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the EDITOR boots into form-shaped skeletons, never the
 * spinner notice (D12 — the same law as the list's C8/G4).
 *
 * ## Job To Be Done
 * The list learned this already: what you wait on must be the shape of what
 * arrives. The modal did not — it opened on the blue loading panel and then
 * replaced the whole thing with a form, so every Add and every Edit began with a
 * jump. The editor is where the user's own typing goes, which makes the jump
 * worse there than in the list. So the modal's boot draws the FORM: a label and
 * a control per field it is standing in for, under a placeholder for each action
 * the real bar will carry.
 *
 * The notice is not deleted, only demoted — a module that fails before it ever
 * presents still has to say so, or the dialog becomes a permanent skeleton.
 *
 * ## What Breaks If These Fail
 * The blue panel comes back on every Add/Edit, or the demotion overshoots and a
 * boot failure shows as a skeleton that never resolves.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { Alert, Skeleton } from "@upmind-automation/upmind-ui";
import {
  syntheticScenario,
  unverifiedRow,
  useSyntheticMutateLoading
} from "../../../testing/synthetic.scenario";
import ManageDialog from "../ManageDialog.vue";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { FormFlowSurface } from "../surfaces";
import { filter, times } from "lodash-es";
import type {
  FourLayerComposable,
  ResolvedHandoff
} from "../../scenario.types";
import type { ScopeContext } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const EDIT = syntheticScenario.handoff.edit;

const handoff: ResolvedHandoff = {
  ...EDIT,
  useMutate: useSyntheticMutateLoading as FourLayerComposable,
  actor: ScopeActorTypes.CLIENT
};

const feedback = EDIT.feedback;

/** A field placeholder is a LABEL and a CONTROL — the house form skeleton's shape. */
const PLACEHOLDERS_PER_FIELD = 2;

/**
 * The editor over a record that has not landed yet — the state D12 rules on.
 * Awaited because the dialog PORTALS its body: nothing is on screen until the
 * container has mounted, which is also when the user first sees the boot.
 */
async function openEditor(context?: ScopeContext) {
  const wrapper = mount(ManageDialog, {
    attachTo: document.body,
    props: { handoff, context }
  });
  await flushPromises();
  return wrapper;
}

function mountSurface(meta: Record<string, boolean>) {
  return mount(FormFlowSurface, {
    attachTo: document.body,
    props: {
      snapshot: { actions: ["input", "update"], context: {}, meta },
      actions: { input: vi.fn(), update: vi.fn() },
      feedback
    }
  });
}

/** The editor booting over a published uischema of exactly this many controls. */
function bootingOn(controls: number) {
  return mount(FormFlowSurface, {
    props: {
      snapshot: {
        actions: ["input", "update"],
        context: {
          uischema: {
            type: "VerticalLayout",
            elements: times(controls, index => ({
              type: "Control",
              scope: `#/properties/field-${index}`
            }))
          }
        },
        meta: { isLoading: true }
      },
      actions: { input: vi.fn(), update: vi.fn() },
      feedback
    }
  });
}

/** The bar the real form lands with stands in as a group of its own. */
const ACTION_BAR_GROUPS = 1;

/** How many label-and-control pairs the boot drew. */
function fieldGroups(wrapper: ReturnType<typeof bootingOn>) {
  const perGroup = new Map<Element, number>();
  for (const skeleton of wrapper.findAllComponents(Skeleton)) {
    const group = skeleton.element.parentElement as Element;
    perGroup.set(group, (perGroup.get(group) ?? 0) + 1);
  }
  return filter(
    Array.from(perGroup.values()),
    count => count === PLACEHOLDERS_PER_FIELD
  ).length;
}

afterEach(() => {
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("@AC3 the editor's BOOT is the form's own shape (D12)", () => {
  it("stands placeholders where the form will be", async () => {
    const wrapper = await openEditor({
      type: EDIT.context.type,
      id: unverifiedRow.id
    });

    expect(wrapper.findComponent(FormFlowSurface).exists()).toBe(true);
    expect(wrapper.findAllComponents(Skeleton).length).toBeGreaterThan(0);
  });

  it("shows no notice panel while it boots — not in the dialog, not anywhere", async () => {
    const wrapper = await openEditor({
      type: EDIT.context.type,
      id: unverifiedRow.id
    });

    expect(wrapper.findComponent(ModuleStateNotice).exists()).toBe(false);
    expect(document.querySelectorAll('[role="alert"]')).toHaveLength(0);
  });

  it("says it is busy, so the wait is announced and not merely drawn", async () => {
    await openEditor({ type: EDIT.context.type, id: unverifiedRow.id });

    expect(document.querySelector('[role="status"]')).toBeTruthy();
  });

  it("boots the same way for a record that does not exist yet", async () => {
    const wrapper = await openEditor();

    expect(wrapper.findAllComponents(Skeleton).length).toBeGreaterThan(0);
    expect(wrapper.findComponent(ModuleStateNotice).exists()).toBe(false);
  });
});

describe("@AC3 loading is a skeleton; a boot FAILURE is still a sentence (D12)", () => {
  it("draws the skeleton, and no notice, while the module is loading", () => {
    const wrapper = mountSurface({ isLoading: true });

    expect(wrapper.findAllComponents(Skeleton).length).toBeGreaterThan(0);
    expect(wrapper.findComponent(Alert).exists()).toBe(false);
  });

  it("draws a label AND a control per field it stands in for", () => {
    const wrapper = mountSurface({ isLoading: true });

    // Grouped by the element each placeholder sits in: a FIELD is the group of
    // exactly two — its label and its control. One generic block, or a row of
    // bare lines, leaves no such group at all.
    const perGroup = new Map<Element, number>();
    for (const skeleton of wrapper.findAllComponents(Skeleton)) {
      const group = skeleton.element.parentElement as Element;
      perGroup.set(group, (perGroup.get(group) ?? 0) + 1);
    }

    const fields = filter(
      Array.from(perGroup.values()),
      count => count === PLACEHOLDERS_PER_FIELD
    );

    expect(fields.length).toBeGreaterThan(1);
  });

  it("stands one field placeholder per control the port PUBLISHED, not a fixed pair (E11)", () => {
    for (const controls of [1, 2, 3]) {
      expect(fieldGroups(bootingOn(controls))).toBe(
        controls + ACTION_BAR_GROUPS
      );
    }
  });

  it("re-shapes with the declaration, so the container never resizes under the form (E11)", () => {
    expect(fieldGroups(bootingOn(3)) - fieldGroups(bootingOn(1))).toBe(2);
  });

  it("still reports a module that failed before it ever presented", () => {
    const wrapper = mountSurface({ hasErrors: true });

    const notice = wrapper.findComponent(ModuleStateNotice);
    expect(notice.exists()).toBe(true);
    expect(notice.props("state")).toBe(ModuleState.ERROR);
  });
});
