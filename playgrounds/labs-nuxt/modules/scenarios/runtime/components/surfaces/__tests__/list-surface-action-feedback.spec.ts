// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the list's actions report themselves (P1-R13, operator
 * 2026-08-10: *"none of the actions actually work"* — they all did).
 *
 * ## Job To Be Done
 * `send_verify` went out, staging answered `{"status":"ok"}`, and the screen
 * said nothing whatsoever, so a working feature read as a broken one. An
 * outcome the user cannot see did not happen. This measures the report where he
 * would read it — the real toast outlet the layout mounts — and holds every
 * sentence to the shipped catalogue, since a report is user-visible copy like
 * any other.
 *
 * ## What Breaks If These Fail
 * The client-emails page goes back to fire-and-forget: no way to tell a succeeded action
 * from a swallowed one, and no way to tell two different outcomes apart.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import errorCatalogue from "@upmind-automation/i18n/core/error-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import {
  API_MESSAGE,
  defaultRow,
  recordedRejection,
  unverifiedRow
} from "../../../../testing/recorded-emails";
import { clearToasts, mountToaster } from "../../../../testing/toaster";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import {
  CONTROL_TEST_VALUE,
  OVERFLOW_TRIGGER_TEST_VALUE
} from "../../__tests__/control-test-values";
import { ListSurface } from "../index";
import {
  flatMap,
  includes,
  isObject,
  keys,
  map,
  reject,
  split,
  trim,
  values
} from "lodash-es";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const rows = [defaultRow, unverifiedRow];

function catalogueStrings(node: unknown): string[] {
  if (typeof node === "string") return map(split(node, "|"), trim);
  if (!isObject(node)) return [];
  return flatMap(values(node), catalogueStrings);
}

/** Every sentence the shipped catalogue can put on screen. */
const TRANSLATED = new Set(
  catalogueStrings({ confirm, error: errorCatalogue, text })
);

/** Digits, punctuation and separators carry no copy. */
const CARRIES_NO_COPY = /^[\s\d.,:/|()%+-]*$/;

const mountList = (actions: SurfaceActions) =>
  mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(actions),
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions,
      presentation: clientEmails.presentation
    }
  });

/**
 * Activates a declared control wherever the scenario placed it — beside the row
 * or behind its overflow, which closes after each selection and so is reopened
 * per action.
 */
async function fire(
  wrapper: ReturnType<typeof mountList>,
  row: number,
  action: string
) {
  const host = wrapper.findAll("li")[row];
  const beside = host.find(`[data-test-value="${CONTROL_TEST_VALUE[action]}"]`);
  if (beside.exists()) return beside.trigger("click");

  await host
    .find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`)
    .trigger("click");
  await new Promise(resolve => setTimeout(resolve, 0));
  document
    .querySelector(
      `[role="menuitem"] [data-test-value="${CONTROL_TEST_VALUE[action]}"]`
    )
    ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await wrapper.vm.$nextTick();
}

/** One record's own control, re-read after every render it may have changed in. */
const controlIn = (
  wrapper: ReturnType<typeof mountList>,
  row: number,
  action: string
) =>
  wrapper
    .findAll("li")
    [row].find(`[data-test-value="${CONTROL_TEST_VALUE[action]}"]`);

const settle = async (wrapper: ReturnType<typeof mountList>) => {
  await flushPromises();
  await wrapper.vm.$nextTick();
};

afterEach(() => {
  clearToasts();
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("@AC3 action feedback — the resolved send_verify the operator could not see", () => {
  it("tells him the verification email went out", async () => {
    const toaster = mountToaster();
    const wrapper = mountList({
      verify: vi.fn().mockResolvedValue({ status: "ok" })
    });

    await fire(wrapper, 1, "verify");

    expect(await toaster.reported()).toContain(confirm.email_verification_sent);
  });

  it("says nothing until the call has actually settled", async () => {
    const toaster = mountToaster();
    const verify = vi.fn().mockReturnValue(new Promise(() => undefined));
    const wrapper = mountList({ verify });

    await fire(wrapper, 1, "verify");
    await flushPromises();

    expect(verify).toHaveBeenCalledTimes(1);
    expect(toaster.reportedSoFar()).toEqual([]);
  });
});

describe("@AC3 action feedback — every sentence is real copy", () => {
  it("draws a resolved outcome from the shipped catalogue, never a raw key", async () => {
    const toaster = mountToaster();
    const wrapper = mountList({
      verify: vi.fn().mockResolvedValue({ status: "ok" })
    });

    await fire(wrapper, 1, "verify");

    const unaccounted = reject(
      await toaster.reported(),
      line => CARRIES_NO_COPY.test(line) || TRANSLATED.has(line)
    );
    expect(unaccounted).toEqual([]);
  });

  it("adds the API's verbatim sentence to a rejected outcome, and nothing else untranslated", async () => {
    const toaster = mountToaster();
    const wrapper = mountList({
      setDefault: vi.fn().mockRejectedValue(recordedRejection())
    });

    await fire(wrapper, 1, "setDefault");

    const reported = await toaster.reported();
    expect(reported).toContain(API_MESSAGE);
    const unaccounted = reject(
      reported,
      line =>
        CARRIES_NO_COPY.test(line) ||
        TRANSLATED.has(line) ||
        line === API_MESSAGE
    );
    expect(unaccounted).toEqual([]);
  });

  it("reports two different outcomes with two different sentences", async () => {
    const toaster = mountToaster();
    const wrapper = mountList({
      verify: vi.fn().mockResolvedValue({ status: "ok" }),
      setDefault: vi.fn().mockRejectedValue(recordedRejection())
    });

    await fire(wrapper, 1, "verify");
    await fire(wrapper, 1, "setDefault");

    const reported = await toaster.reported();
    expect(includes(reported, confirm.email_verification_sent)).toBe(true);
    expect(includes(reported, API_MESSAGE)).toBe(true);
  });
});

describe("@AC3 the control itself says it is working (E12)", () => {
  it("holds the control it was fired from busy until the call settles", async () => {
    const wrapper = mountList({
      remove: vi.fn().mockReturnValue(new Promise(() => undefined))
    });

    await fire(wrapper, 1, "remove");
    await flushPromises();

    const control = controlIn(wrapper, 1, "remove");
    expect(control.attributes("disabled")).toBeDefined();
    expect(control.find('[role="status"]').exists()).toBe(true);
  });

  it("leaves every OTHER record's control alone — one action, one pending control", async () => {
    const wrapper = mountList({
      remove: vi.fn().mockReturnValue(new Promise(() => undefined))
    });

    await fire(wrapper, 1, "remove");
    await flushPromises();

    expect(
      controlIn(wrapper, 0, "remove").find('[role="status"]').exists()
    ).toBe(false);
  });

  it("returns it to rest once the call has settled", async () => {
    const wrapper = mountList({
      remove: vi.fn().mockResolvedValue({ status: "ok" })
    });

    await fire(wrapper, 1, "remove");
    await flushPromises();
    await wrapper.vm.$nextTick();

    const control = controlIn(wrapper, 1, "remove");
    expect(control.attributes("disabled")).toBeUndefined();
    expect(control.find('[role="status"]').exists()).toBe(false);
  });
});

describe("@AC3 a refusal marks the RECORD it happened to (E12)", () => {
  it("draws the API's own sentence on that record, and on no other", async () => {
    const wrapper = mountList({
      remove: vi.fn().mockRejectedValue(recordedRejection())
    });

    await fire(wrapper, 1, "remove");
    await settle(wrapper);

    const failed = wrapper.findAll("li")[1].find('[role="alert"]');
    expect(failed.exists()).toBe(true);
    expect(failed.text()).toContain(API_MESSAGE);
    expect(wrapper.findAll("li")[0].find('[role="alert"]').exists()).toBe(
      false
    );
  });

  it("clears on the user's own dismiss, and takes nothing else with it", async () => {
    const wrapper = mountList({
      remove: vi.fn().mockRejectedValue(recordedRejection())
    });

    await fire(wrapper, 1, "remove");
    await settle(wrapper);
    await wrapper
      .findAll("li")[1]
      .find('[data-test-value="dismiss"]')
      .trigger("click");

    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0);
    expect(wrapper.findAll("li")).toHaveLength(rows.length);
  });
});
