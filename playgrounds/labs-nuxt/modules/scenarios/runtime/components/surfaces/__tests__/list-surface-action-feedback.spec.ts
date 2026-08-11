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
 * The canary goes back to fire-and-forget: no way to tell a succeeded action
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
} from "../../../../../../tests/support/recorded-emails";
import {
  clearToasts,
  mountToaster
} from "../../../../../../tests/support/toaster";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import { LIST_SURFACE_ACTION, ListSurface } from "../index";
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
      actions
    }
  });

const fire = (
  wrapper: ReturnType<typeof mountList>,
  row: number,
  action: string
) =>
  wrapper
    .findAll("li")
    [row].find(`[data-test-value="${CONTROL_TEST_VALUE[action]}"]`)
    .trigger("click");

afterEach(clearToasts);

// -----------------------------------------------------------------------------

describe("@AC3 action feedback — the resolved send_verify the operator could not see", () => {
  it("tells him the verification email went out", async () => {
    const toaster = mountToaster();
    const wrapper = mountList({
      [LIST_SURFACE_ACTION.RESEND]: vi.fn().mockResolvedValue({ status: "ok" })
    });

    await fire(wrapper, 1, LIST_SURFACE_ACTION.RESEND);

    expect(await toaster.reported()).toContain(confirm.email_verification_sent);
  });

  it("says nothing until the call has actually settled", async () => {
    const toaster = mountToaster();
    const verify = vi.fn().mockReturnValue(new Promise(() => undefined));
    const wrapper = mountList({ [LIST_SURFACE_ACTION.RESEND]: verify });

    await fire(wrapper, 1, LIST_SURFACE_ACTION.RESEND);
    await flushPromises();

    expect(verify).toHaveBeenCalledTimes(1);
    expect(toaster.reportedSoFar()).toEqual([]);
  });
});

describe("@AC3 action feedback — every sentence is real copy", () => {
  it("draws a resolved outcome from the shipped catalogue, never a raw key", async () => {
    const toaster = mountToaster();
    const wrapper = mountList({
      [LIST_SURFACE_ACTION.RESEND]: vi.fn().mockResolvedValue({ status: "ok" })
    });

    await fire(wrapper, 1, LIST_SURFACE_ACTION.RESEND);

    const unaccounted = reject(
      await toaster.reported(),
      line => CARRIES_NO_COPY.test(line) || TRANSLATED.has(line)
    );
    expect(unaccounted).toEqual([]);
  });

  it("adds the API's verbatim sentence to a rejected outcome, and nothing else untranslated", async () => {
    const toaster = mountToaster();
    const wrapper = mountList({
      [LIST_SURFACE_ACTION.SET_DEFAULT]: vi
        .fn()
        .mockRejectedValue(recordedRejection())
    });

    await fire(wrapper, 1, LIST_SURFACE_ACTION.SET_DEFAULT);

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
      [LIST_SURFACE_ACTION.RESEND]: vi.fn().mockResolvedValue({ status: "ok" }),
      [LIST_SURFACE_ACTION.SET_DEFAULT]: vi
        .fn()
        .mockRejectedValue(recordedRejection())
    });

    await fire(wrapper, 1, LIST_SURFACE_ACTION.RESEND);
    await fire(wrapper, 1, LIST_SURFACE_ACTION.SET_DEFAULT);

    const reported = await toaster.reported();
    expect(includes(reported, confirm.email_verification_sent)).toBe(true);
    expect(includes(reported, API_MESSAGE)).toBe(true);
  });
});
