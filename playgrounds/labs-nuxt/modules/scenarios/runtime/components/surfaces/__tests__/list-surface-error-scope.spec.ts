// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 error scope — a rejected ROW action never takes the list
 * away (P1-R13 (1)/(3), operator 2026-08-10).
 *
 * ## Job To Be Done
 * `set_default` on an unverified address is refused by the API with a 409 and a
 * sentence saying why. The operator got the whole table replaced by "We
 * couldn't load this. Please try again." — a LOAD message on an ACTION
 * failure — with no retry, no dismiss, and no way back short of a page reload:
 * *"this error is specific to a row… there is zero way to recover"*.
 *
 * The rows and the rejection here are the capture run's own bytes, so what is
 * proven is the state the real API actually puts the surface in.
 *
 * ## What Breaks If These Fail
 * One refused row action ends the session's use of the list. The regression is
 * silent, too: everything the operator can still see says "we failed to load",
 * which is not what happened.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import errorCatalogue from "@upmind-automation/i18n/core/error-en.json";
import {
  API_MESSAGE,
  defaultRow,
  recordedRejection,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import { renderedStrings } from "../../../../../../tests/support/rendered";
import {
  clearToasts,
  mountToaster
} from "../../../../../../tests/support/toaster";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import { LIST_SURFACE_ACTION, ListSurface } from "../index";
import { keys } from "lodash-es";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const rows = [defaultRow, unverifiedRow];

/** What the module publishes: the rejection is captured, and it is never cleared. */
const snapshot = (actions: SurfaceActions, hasError: boolean) => ({
  actions: keys(actions),
  context: {
    data: rows,
    error: hasError ? recordedRejection() : undefined
  },
  meta: { isEmpty: false, isFiltered: false, hasError }
});

const mountList = (actions: SurfaceActions) =>
  mount(ListSurface, {
    attachTo: document.body,
    props: { snapshot: snapshot(actions, false), actions }
  });

/** Fire the target row's control, then let the module capture the rejection. */
async function rejectSetDefault(actions: SurfaceActions) {
  const wrapper = mountList(actions);
  await wrapper
    .findAll("li")[1]
    .find(
      `[data-test-value="${CONTROL_TEST_VALUE[LIST_SURFACE_ACTION.SET_DEFAULT]}"]`
    )
    .trigger("click");
  await flushPromises();
  await wrapper.setProps({ snapshot: snapshot(actions, true) });
  await flushPromises();
  return wrapper;
}

afterEach(clearToasts);

// -----------------------------------------------------------------------------

describe("@AC3 error scope — the list survives a refused row action (P1-R13)", () => {
  it("leaves every row on screen after the 409", async () => {
    mountToaster();
    const wrapper = await rejectSetDefault({
      [LIST_SURFACE_ACTION.SET_DEFAULT]: vi
        .fn()
        .mockRejectedValue(recordedRejection())
    });

    expect(wrapper.findAll("li")).toHaveLength(rows.length);
    expect(wrapper.text()).toContain(defaultRow.title);
    expect(wrapper.text()).toContain(unverifiedRow.title);
  });

  it("does not tell the operator his LIST failed to load", async () => {
    mountToaster();
    const wrapper = await rejectSetDefault({
      [LIST_SURFACE_ACTION.SET_DEFAULT]: vi
        .fn()
        .mockRejectedValue(recordedRejection())
    });

    const onScreen = renderedStrings(wrapper);
    expect(onScreen).not.toContain(errorCatalogue.something_went_wrong);
    expect(onScreen).not.toContain(errorCatalogue.something_went_wrong_text);
  });

  it("gives him the API's own explanation instead", async () => {
    const toaster = mountToaster();
    await rejectSetDefault({
      [LIST_SURFACE_ACTION.SET_DEFAULT]: vi
        .fn()
        .mockRejectedValue(recordedRejection())
    });

    const reported = await toaster.reported();
    expect(reported).toContain(API_MESSAGE);
    expect(reported).toContain(errorCatalogue.client_email_set_default_failed);
  });

  it("takes a SECOND action straight after the failure — the recovery the panel denied him", async () => {
    mountToaster();
    const remove = vi.fn().mockResolvedValue(undefined);
    const wrapper = await rejectSetDefault({
      [LIST_SURFACE_ACTION.SET_DEFAULT]: vi
        .fn()
        .mockRejectedValue(recordedRejection()),
      [LIST_SURFACE_ACTION.DELETE]: remove
    });

    await wrapper
      .findAll("li")[1]
      .find(
        `[data-test-value="${CONTROL_TEST_VALUE[LIST_SURFACE_ACTION.DELETE]}"]`
      )
      .trigger("click");
    await flushPromises();

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(unverifiedRow.id);
  });

  it("retries the very action that failed, on the same row", async () => {
    mountToaster();
    const setDefault = vi.fn().mockRejectedValue(recordedRejection());
    const wrapper = await rejectSetDefault({
      [LIST_SURFACE_ACTION.SET_DEFAULT]: setDefault
    });

    await wrapper
      .findAll("li")[1]
      .find(
        `[data-test-value="${CONTROL_TEST_VALUE[LIST_SURFACE_ACTION.SET_DEFAULT]}"]`
      )
      .trigger("click");
    await flushPromises();

    expect(setDefault).toHaveBeenCalledTimes(2);
  });
});

describe("@AC3 error scope — the notice is the BOOT experience, not a blanket suppression", () => {
  it("still says the collection failed when it never loaded at all", () => {
    const wrapper = mount(ListSurface, {
      attachTo: document.body,
      props: {
        snapshot: {
          actions: [],
          context: { data: [], error: recordedRejection() },
          meta: { isFiltered: false, hasError: true }
        },
        actions: {}
      }
    });

    expect(renderedStrings(wrapper)).toContain(
      errorCatalogue.something_went_wrong
    );
    expect(wrapper.findAll("li")).toHaveLength(0);
  });
});
