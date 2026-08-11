// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 per-row capabilities (C11, operator: *"is `can_delete`
 * even being checked?"*).
 *
 * ## Job To Be Done
 * Every row already carries the answer — `canDelete`, `isVerified`,
 * `isDefault` — and the surface offered all three actions on every row anyway,
 * so the operator was invited to delete an address the API refuses to delete
 * and to re-verify one already verified. The two rows here are the capture
 * run's own records, one of each kind, so the gate is measured against the
 * capabilities a real account actually has.
 *
 * ## What Breaks If These Fail
 * The UI offers capabilities the record does not have, and every rejection is
 * discovered by clicking — the failure mode P1-R13 opened with.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import { LIST_SURFACE_ACTION, ListSurface } from "../index";
import { keys } from "lodash-es";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

/** Row 0: default, verified, `can_delete:false`. Row 1: neither, deletable. */
const rows = [defaultRow, unverifiedRow];

const ACTIONS: SurfaceActions = {
  [LIST_SURFACE_ACTION.DELETE]: vi.fn(),
  [LIST_SURFACE_ACTION.SET_DEFAULT]: vi.fn(),
  [LIST_SURFACE_ACTION.RESEND]: vi.fn()
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
      actions: ACTIONS
    }
  });

const control = (
  wrapper: ReturnType<typeof mountList>,
  row: number,
  action: string
) =>
  wrapper
    .findAll("li")
    [row].find(`[data-test-value="${CONTROL_TEST_VALUE[action]}"]`);

const isOffered = (
  wrapper: ReturnType<typeof mountList>,
  row: number,
  action: string
) => {
  const found = control(wrapper, row, action);
  return found.exists() && found.attributes("disabled") === undefined;
};

beforeEach(() => vi.clearAllMocks());

// -----------------------------------------------------------------------------

describe("@AC3 capabilities — the row's own answer gates its controls (C11)", () => {
  it("does not offer Remove on the address the API refuses to delete", () => {
    expect(defaultRow.meta.canDelete).toBe(false);

    expect(isOffered(mountList(), 0, LIST_SURFACE_ACTION.DELETE)).toBe(false);
  });

  it("does not offer Resend verification on an already-verified address", () => {
    expect(defaultRow.meta.isVerified).toBe(true);

    expect(isOffered(mountList(), 0, LIST_SURFACE_ACTION.RESEND)).toBe(false);
  });

  it("does not offer Set as default on the address that already IS the default", () => {
    expect(defaultRow.meta.isDefault).toBe(true);

    expect(isOffered(mountList(), 0, LIST_SURFACE_ACTION.SET_DEFAULT)).toBe(
      false
    );
  });

  it("keeps a withheld Remove ON SCREEN rather than vanishing it", () => {
    expect(control(mountList(), 0, LIST_SURFACE_ACTION.DELETE).exists()).toBe(
      true
    );
  });

  it("fires nothing when a withheld control is activated anyway", async () => {
    const wrapper = mountList();

    await control(wrapper, 0, LIST_SURFACE_ACTION.DELETE).trigger("click");

    expect(ACTIONS[LIST_SURFACE_ACTION.DELETE]).not.toHaveBeenCalled();
  });
});

describe("@AC3 capabilities — the gate is a gate, not a blanket withdrawal", () => {
  it("offers Remove on the address the API says is deletable", () => {
    expect(unverifiedRow.meta.canDelete).toBe(true);

    expect(isOffered(mountList(), 1, LIST_SURFACE_ACTION.DELETE)).toBe(true);
  });

  it("offers Resend verification on the address still unverified", () => {
    expect(unverifiedRow.meta.isVerified).toBe(false);

    expect(isOffered(mountList(), 1, LIST_SURFACE_ACTION.RESEND)).toBe(true);
  });

  it("still fires the live action from an offered control", async () => {
    const wrapper = mountList();

    await control(wrapper, 1, LIST_SURFACE_ACTION.DELETE).trigger("click");

    expect(ACTIONS[LIST_SURFACE_ACTION.DELETE]).toHaveBeenCalledWith(
      unverifiedRow.id
    );
  });
});
