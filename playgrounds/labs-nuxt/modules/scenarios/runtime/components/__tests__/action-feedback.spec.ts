// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the action-outcome seam — the caller that FIRES an action
 * is the one that reports it (P1-R13, design.md §Block C).
 *
 * ## Job To Be Done
 * The canary fired `send_verify`, the API answered `{"status":"ok"}`, and the
 * operator saw nothing at all; it fired `set_default`, the API answered 409
 * with a sentence explaining exactly why, and he saw a load-failure panel
 * instead of that sentence. Both halves are this seam's job: an outcome reaches
 * the user, the API's own words included, and the control that fired it comes
 * back to rest whichever way it settles.
 *
 * `isReported` is the other half — the module keeps its captured error forever,
 * so the surface needs to know which failures it has already told the user
 * about and must not brand the whole list with.
 *
 * ## What Breaks If These Fail
 * Every row action becomes fire-and-forget again: a rejected mutation is
 * silent or, worse, indistinguishable from a broken fetch, and a control that
 * never leaves its pending state cannot be retried.
 */

import { describe, expect, it, afterEach } from "vitest";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import errorCatalogue from "@upmind-automation/i18n/core/error-en.json";
import {
  API_MESSAGE,
  recordedRejection
} from "../../../../../tests/support/recorded-emails";
import {
  clearToasts,
  mountToaster
} from "../../../../../tests/support/toaster";
import { useActionFeedback } from "../useActionFeedback";
import { includes, reject, some } from "lodash-es";

// -----------------------------------------------------------------------------

const COPY = {
  success: confirm.email_verification_sent,
  failure: errorCatalogue.client_email_set_default_failed
};

const KEY = "verify:d7382485-0793-15e5-770b-81e642d59e06";

/** A promise this spec settles by hand, so "in flight" is an observable state. */
function deferred() {
  let settle!: (value?: unknown) => void;
  let fail!: (reason: unknown) => void;
  const promise = new Promise((resolve, rejectIt) => {
    settle = resolve;
    fail = rejectIt;
  });
  return { promise, settle, fail };
}

afterEach(clearToasts);

// -----------------------------------------------------------------------------

describe("@AC3 action feedback — an outcome reaches the user", () => {
  it("reports a resolved action with its success sentence", async () => {
    const toaster = mountToaster();
    const feedback = useActionFeedback();

    await feedback.fire(KEY, () => Promise.resolve({ status: "ok" }), COPY);

    expect(await toaster.reported()).toContain(COPY.success);
  });

  it("reports a rejected action with the API's OWN sentence beside the failure copy", async () => {
    const toaster = mountToaster();
    const feedback = useActionFeedback();

    await feedback.fire(KEY, () => Promise.reject(recordedRejection()), COPY);

    const reported = await toaster.reported();
    expect(reported).toContain(COPY.failure);
    expect(reported).toContain(API_MESSAGE);
    expect(reported).not.toContain(COPY.success);
  });

  it("reports nothing but the sentences it was given and the API's own", async () => {
    const toaster = mountToaster();
    const feedback = useActionFeedback();

    await feedback.fire(KEY, () => Promise.reject(recordedRejection()), COPY);

    const authored = [COPY.failure, API_MESSAGE];
    const unaccounted = reject(
      await toaster.reported(),
      line => !/[a-z]{3}/i.test(line) || includes(authored, line)
    );
    expect(unaccounted).toEqual([]);
  });

  it("settles rather than rethrowing, so the caller owes no catch", async () => {
    mountToaster();
    const feedback = useActionFeedback();

    await expect(
      feedback.fire(KEY, () => Promise.reject(recordedRejection()), COPY)
    ).resolves.toBe(false);
  });

  it("answers the caller whether the action actually settled", async () => {
    mountToaster();
    const feedback = useActionFeedback();

    await expect(
      feedback.fire(KEY, () => Promise.resolve({ status: "ok" }), COPY)
    ).resolves.toBe(true);
  });
});

describe("@AC3 action feedback — the control returns to rest", () => {
  it("holds the key pending until a resolving action settles, then releases it", async () => {
    mountToaster();
    const feedback = useActionFeedback();
    const inFlight = deferred();

    const fired = feedback.fire(KEY, () => inFlight.promise, COPY);
    expect(feedback.isPending(KEY)).toBe(true);

    inFlight.settle({ status: "ok" });
    await fired;
    expect(feedback.isPending(KEY)).toBe(false);
  });

  it("releases the key just the same when the action REJECTS", async () => {
    mountToaster();
    const feedback = useActionFeedback();
    const inFlight = deferred();

    const fired = feedback.fire(KEY, () => inFlight.promise, COPY);
    expect(feedback.isPending(KEY)).toBe(true);

    inFlight.fail(recordedRejection());
    await fired;
    expect(feedback.isPending(KEY)).toBe(false);
  });

  it("marks only the key in flight — a second row is untouched by the first row's action", async () => {
    mountToaster();
    const feedback = useActionFeedback();
    const inFlight = deferred();
    const other = "verify:20e43579-5e78-d184-430c-31643202d986";

    const fired = feedback.fire(KEY, () => inFlight.promise, COPY);

    expect(feedback.isPending(KEY)).toBe(true);
    expect(feedback.isPending(other)).toBe(false);

    inFlight.settle();
    await fired;
  });

  it("accepts the SAME key again once it has settled", async () => {
    mountToaster();
    const feedback = useActionFeedback();

    await feedback.fire(KEY, () => Promise.reject(recordedRejection()), COPY);
    const second = deferred();
    const fired = feedback.fire(KEY, () => second.promise, COPY);

    expect(feedback.isPending(KEY)).toBe(true);
    second.settle();
    await fired;
  });
});

describe("@AC3 action feedback — a failure already told to the user", () => {
  it("recognises the rejection it just reported", async () => {
    mountToaster();
    const feedback = useActionFeedback();
    const rejection = recordedRejection();

    expect(feedback.isReported(rejection)).toBe(false);
    await feedback.fire(KEY, () => Promise.reject(rejection), COPY);

    expect(feedback.isReported(rejection)).toBe(true);
  });

  it("does not claim a failure it never fired", async () => {
    mountToaster();
    const feedback = useActionFeedback();

    await feedback.fire(KEY, () => Promise.reject(recordedRejection()), COPY);

    expect(
      feedback.isReported(new Error("a fetch that failed on its own"))
    ).toBe(false);
  });

  it("claims nothing at all when no action has failed", () => {
    const feedback = useActionFeedback();

    expect(
      some([recordedRejection(), new Error("boot")], error =>
        feedback.isReported(error)
      )
    ).toBe(false);
  });
});
