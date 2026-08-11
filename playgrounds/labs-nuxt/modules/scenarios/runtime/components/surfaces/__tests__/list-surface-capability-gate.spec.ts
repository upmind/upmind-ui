// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 per-row capabilities (C11, operator: *"is `can_delete`
 * even being checked?"*), now DECLARED rather than hand-coded.
 *
 * ## Job To Be Done
 * Every row already carries the answer — `canDelete`, `isVerified`,
 * `isDefault` — and the surface offered all three actions on every row anyway,
 * so the operator was invited to delete an address the API refuses to delete
 * and to re-verify one already verified. Since Phase 2 the gate is a JSONForms
 * `rule` on the scenario's own action declaration, so what is measured here is
 * that the DECLARED rule reaches the control: `DISABLE` greys it and leaves it
 * on screen, `HIDE` withdraws it. The two rows are the capture run's own
 * records, one of each kind.
 *
 * ## What Breaks If These Fail
 * The UI offers capabilities the record does not have, and every rejection is
 * discovered by clicking — the failure mode P1-R13 opened with. Or the rules
 * are declared and quietly ignored, which is the same defect with a paper
 * trail.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import {
  CONTROL_TEST_VALUE,
  OVERFLOW_TRIGGER_TEST_VALUE
} from "../../__tests__/control-test-values";
import { ListSurface } from "../index";
import { keys, map } from "lodash-es";
import type { ScenarioAction } from "../../../scenario.types";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const { presentation } = clientEmails;

/** Row 0: default, verified, `can_delete:false`. Row 1: neither, deletable. */
const rows = [defaultRow, unverifiedRow];

const WITHHELD = 0;
const OPEN = 1;

const ACTIONS: SurfaceActions = {
  remove: vi.fn(),
  setDefault: vi.fn(),
  verify: vi.fn()
};

const mountList = () =>
  mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(ACTIONS),
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions: ACTIONS,
      presentation
    }
  });

type Wrapper = ReturnType<typeof mountList>;

const control = (wrapper: Wrapper, row: number, name: string) =>
  wrapper
    .findAll("li")
    [row].find(`[data-test-value="${CONTROL_TEST_VALUE[name]}"]`);

const overflowTrigger = (wrapper: Wrapper, row: number) =>
  wrapper
    .findAll("li")
    [row].find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`);

/** Opens a row's overflow, then reports which declared actions it holds. */
async function overflowItems(wrapper: Wrapper, row: number) {
  const trigger = overflowTrigger(wrapper, row);
  if (!trigger.exists()) return [];
  await trigger.trigger("click");
  await new Promise(resolve => setTimeout(resolve, 0));
  return map(
    document.querySelectorAll("[role='menuitem'] [data-test-value]"),
    node => node.getAttribute("data-test-value")
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

// -----------------------------------------------------------------------------

describe("@AC3 capabilities — the row's own answer gates its controls (C11)", () => {
  it("greys out Remove on the address the API refuses to delete", () => {
    expect(defaultRow.meta.canDelete).toBe(false);

    expect(
      control(mountList(), WITHHELD, "remove").attributes("disabled")
    ).toBeDefined();
  });

  it("keeps that withheld Remove ON SCREEN rather than vanishing it", () => {
    expect(control(mountList(), WITHHELD, "remove").exists()).toBe(true);
  });

  it("fires nothing when the withheld control is activated anyway", async () => {
    const wrapper = mountList();

    await control(wrapper, WITHHELD, "remove").trigger("click");

    expect(ACTIONS.remove).not.toHaveBeenCalled();
  });

  it("withdraws Resend verification from an already-verified address", async () => {
    expect(defaultRow.meta.isVerified).toBe(true);

    expect(await overflowItems(mountList(), WITHHELD)).not.toContain(
      CONTROL_TEST_VALUE.verify
    );
  });

  it("withdraws Set as default from the address that already IS the default", async () => {
    expect(defaultRow.meta.isDefault).toBe(true);

    expect(await overflowItems(mountList(), WITHHELD)).not.toContain(
      CONTROL_TEST_VALUE.setDefault
    );
  });
});

describe("@AC3 capabilities — the gate is a gate, not a blanket withdrawal", () => {
  it("offers Remove on the address the API says is deletable", () => {
    expect(unverifiedRow.meta.canDelete).toBe(true);

    expect(
      control(mountList(), OPEN, "remove").attributes("disabled")
    ).toBeUndefined();
  });

  it("offers both withheld actions on the row whose flags allow them", async () => {
    expect(unverifiedRow.meta.isVerified).toBe(false);
    expect(unverifiedRow.meta.isDefault).toBe(false);

    const items = await overflowItems(mountList(), OPEN);

    expect(items).toContain(CONTROL_TEST_VALUE.verify);
    expect(items).toContain(CONTROL_TEST_VALUE.setDefault);
  });

  it("still fires the live action from an offered control", async () => {
    const wrapper = mountList();

    await control(wrapper, OPEN, "remove").trigger("click");

    expect(ACTIONS.remove).toHaveBeenCalledWith(unverifiedRow.id);
  });
});

describe("@AC3 the gate is DECLARED — it is not the renderer's opinion", () => {
  it("declares a rule for every action a row flag governs", () => {
    const gated = map(
      presentation.rowActions as ScenarioAction[],
      action => [action.name, action.rule?.effect] as const
    );

    expect(gated).toEqual([
      ["remove", "DISABLE"],
      ["setDefault", "HIDE"],
      ["verify", "HIDE"]
    ]);
  });

  it("names only live members of the composable's action map", () => {
    const declared = map(presentation.rowActions as ScenarioAction[], "name");

    expect(declared).toEqual(keys(ACTIONS));
  });
});
