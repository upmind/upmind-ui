// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the action-outcome seam — the caller that FIRES an action
 * is the one that reports it (P1-R13, design.md §Block C).
 *
 * ## Job To Be Done
 * The client-emails page fired `send_verify`, the API answered `{"status":"ok"}`, and the
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

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, afterEach, vi } from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import errorCatalogue from "@upmind-automation/i18n/core/error-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { Toaster } from "@upmind/ui";
import layoutSource from "../../../../../app/layouts/default.vue?raw";
import {
  API_MESSAGE,
  defaultRow,
  recordedRejection,
  unverifiedRow
} from "../../../testing/recorded-emails";
import { clearToasts, mountToaster } from "../../../testing/toaster";
import clientEmails from "../../../useClientEmails/client-email.scenario";
import { ListSurface } from "../surfaces";
import { useActionFeedback } from "../useActionFeedback";
import {
  CONTROL_TEST_VALUE,
  OVERFLOW_TRIGGER_TEST_VALUE
} from "./control-test-values";
import { includes, keys, reject, some } from "lodash-es";
import type { SurfaceActions } from "../surfaces";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const COPY = {
  success: confirm.email_verification_sent,
  failure: errorCatalogue.client_email_set_default_failed
};

const KEY = "verify:d7382485-0793-15e5-770b-81e642d59e06";

/** The outlet's own vocabulary for where it sits — the ui component's, not ours. */
type ToasterPosition = InstanceType<typeof Toaster>["$props"]["position"];

const ROWS = [defaultRow, unverifiedRow];

/** The record the client-emails page's own declaration offers every action on. */
const ACTED_ON = 1;

const messages = {
  en: { action, confirm, error: errorCatalogue, labs: labsEn, text }
};

const channel: ControlledTableChannel = {
  read: () => ({
    filter: {},
    sort: [],
    pagination: { page: 1, perPage: 10, total: ROWS.length }
  }),
  emit: vi.fn()
};

/**
 * The surface T3.9 recomposed — the table, its three toolbar rows and the row
 * actions under them — so the pending chain is read through the composition the
 * rewrite produced rather than through the read-only degradation.
 */
const mountSurface = (actions: SurfaceActions) =>
  mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(actions),
        context: { data: ROWS },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions,
      presentation: clientEmails.presentation,
      table: channel
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });

type Surface = ReturnType<typeof mountSurface>;

/** One record's own control, re-read after every render it may have changed in. */
const controlIn = (surface: Surface, row: number, name: string) =>
  surface
    .findAll("tbody tr")
    [row]!.find(`[data-test-value="${CONTROL_TEST_VALUE[name]}"]`);

/** Activates a declared control wherever the scenario placed it. */
async function fire(surface: Surface, row: number, name: string) {
  const host = surface.findAll("tbody tr")[row]!;
  const beside = host.find(`[data-test-value="${CONTROL_TEST_VALUE[name]}"]`);
  if (beside.exists()) {
    await beside.trigger("click");
    return;
  }

  await host
    .find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`)
    .trigger("click");
  await new Promise(resolve => setTimeout(resolve, 0));
  document
    .querySelector(
      `[role="menuitem"] [data-test-value="${CONTROL_TEST_VALUE[name]}"]`
    )
    ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await surface.vm.$nextTick();
}

/**
 * Where the app's ONE outlet is mounted — read off `layouts/default.vue` itself
 * (`K11`), never restated here, so the outlet under test is the outlet the user
 * meets rather than a placement this spec chose for it.
 */
function layoutToasterPosition(): ToasterPosition {
  const mounted = /<[A-Za-z]*Toaster\b[^>]*>/.exec(layoutSource);
  const position = /\bposition="([^"]+)"/.exec(mounted?.[0] ?? "")?.[1] ?? "";

  return position as ToasterPosition;
}

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

/**
 * @AC6.6 @US6 T3.14 — the chain above, still reaching the user through the
 * surface T3.9 recomposed (`E12` · `E13 final` · `S14`, the law raised three
 * times). Nothing new is built here: the composable's own contract is claimed
 * above, and what these read back is that the rewrite did not quietly drop it —
 * pending on the control that was clicked, and the outcome in the path of the
 * eye that clicked it.
 */
describe("@AC6.6 T3.14 the control that was clicked says it is working (E12)", () => {
  it("holds that record's own control busy until the request settles", async () => {
    const surface = mountSurface({
      remove: vi.fn().mockReturnValue(new Promise(() => undefined))
    });

    await fire(surface, ACTED_ON, "remove");
    await flushPromises();

    const control = controlIn(surface, ACTED_ON, "remove");
    expect(control.attributes("disabled")).toBeDefined();
    expect(control.find('[role="status"]').exists()).toBe(true);
  });

  it("leaves every other record's control as it found it — one action, one pending control", async () => {
    const surface = mountSurface({
      remove: vi.fn().mockReturnValue(new Promise(() => undefined))
    });
    // Read before firing: the account's own default address refuses deletion on
    // its own terms (`canDelete: false` in the recording), so what is claimed is
    // that the OTHER row's control is untouched, not that it is enabled.
    const before = controlIn(surface, 0, "remove").attributes("disabled");

    await fire(surface, ACTED_ON, "remove");
    await flushPromises();

    const other = controlIn(surface, 0, "remove");
    expect(other.attributes("disabled")).toBe(before);
    expect(other.find('[role="status"]').exists()).toBe(false);
  });

  it("returns it to rest whichever way the request settles", async () => {
    for (const settling of [
      vi.fn().mockResolvedValue({ status: "ok" }),
      vi.fn().mockRejectedValue(recordedRejection())
    ]) {
      mountToaster();
      const surface = mountSurface({ remove: settling });

      await fire(surface, ACTED_ON, "remove");
      await flushPromises();
      await surface.vm.$nextTick();

      const control = controlIn(surface, ACTED_ON, "remove");
      expect(control.attributes("disabled")).toBeUndefined();
      expect(control.find('[role="status"]').exists()).toBe(false);
      clearToasts();
    }
  });
});

describe("@AC6.6 T3.14 the outcome lands where the eye already is (E13 final)", () => {
  it("mounts the outlet TOP-CENTRE, never in a corner", () => {
    const position = layoutToasterPosition();
    const outlet = mount(Toaster, {
      attachTo: document.body,
      props: { position }
    });
    const rendered = outlet.find("[data-sonner-toaster]");

    expect(position).toBe("top-center");
    expect(rendered.attributes("data-y-position")).toBe("top");
    expect(rendered.attributes("data-x-position")).toBe("center");
  });

  it("reports a resolved action into that outlet, from the recomposed surface", async () => {
    const outlet = mount(Toaster, {
      attachTo: document.body,
      props: { position: layoutToasterPosition() }
    });
    const surface = mountSurface({
      verify: vi.fn().mockResolvedValue({ status: "ok" })
    });

    await fire(surface, ACTED_ON, "verify");
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(outlet.find("[data-sonner-toaster]").text()).toContain(
      confirm.email_verification_sent
    );
  });

  it("carries the API's OWN sentence, verbatim, when the record refuses", async () => {
    const outlet = mount(Toaster, {
      attachTo: document.body,
      props: { position: layoutToasterPosition() }
    });
    const surface = mountSurface({
      setDefault: vi.fn().mockRejectedValue(recordedRejection())
    });

    await fire(surface, ACTED_ON, "setDefault");
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 50));

    const reported = outlet.find("[data-sonner-toaster]").text();
    expect(reported).toContain(errorCatalogue.client_email_set_default_failed);
    expect(reported).toContain(API_MESSAGE);
  });
});
