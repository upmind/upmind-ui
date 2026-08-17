// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the editor closes on a SETTLED save, never on a refused one.
 *
 * ## Job To Be Done
 * The editor a collection hands off to is where a new address is typed, so its
 * dismissal is the user's only copy of that input. A save the API refuses — the
 * capture run's own 409, verbatim — must leave the form on screen with the typed
 * value intact and the reason reported; only a save that actually settled
 * resolves the flow and lets the dialog close. There is no declared form channel
 * (`R6-29`): the surface takes whichever drive pair the live PORT publishes, so
 * a manager-backed editor saves through `update` because that is the member the
 * module exposes — never because a declaration said so.
 *
 * ## What Breaks If These Fail
 * A rejected save dismisses the form and takes the user's input with it, leaving
 * a toast as the only trace of a record that was never persisted — a worse
 * version of P1-R13's *"zero way to recover"*.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpmForm } from "@upmind-automation/client-vue";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import {
  API_MESSAGE,
  recordedRejection,
  unverifiedRow
} from "../../../../testing/recorded-emails";
import { clearToasts, mountToaster } from "../../../../testing/toaster";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { FormFlowSurface } from "../index";

// -----------------------------------------------------------------------------

/** What the editor says either way — the handoff that opens it carries it (`R6-27`). */
const feedback = clientEmails.handoff?.edit?.feedback;

const schema = {
  type: "object",
  properties: { email: { type: "string", format: "email" } },
  required: ["email"]
};
const uischema = {
  type: "VerticalLayout",
  elements: [{ type: "Control", scope: "#/properties/email" }]
};

/** A port publishing ONE drive pair — the manager's by default, the flow machine's on ask. */
function mountEditor(
  submit: () => unknown,
  pair: [string, string] = ["input", "update"]
) {
  const actions: Record<string, ReturnType<typeof vi.fn>> = {
    [pair[0]]: vi.fn(),
    [pair[1]]: vi.fn(submit)
  };
  const wrapper = mount(FormFlowSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: pair,
        context: { schema, uischema, model: { email: unverifiedRow.email } },
        meta: {}
      },
      actions,
      feedback
    }
  });
  return { wrapper, actions };
}

const save = async (wrapper: ReturnType<typeof mountEditor>["wrapper"]) => {
  await wrapper.findComponent(UpmForm).vm.$emit("resolve");
  await flushPromises();
};

afterEach(clearToasts);

// -----------------------------------------------------------------------------

describe("R6-29 the editor's save is driven by the member the PORT publishes", () => {
  it("saves a manager-backed editor through the manager's own member", async () => {
    mountToaster();
    const { wrapper, actions } = mountEditor(() => Promise.resolve({ id: 1 }));

    await save(wrapper);

    expect(actions.update).toHaveBeenCalledTimes(1);
  });

  it("saves a flow-machine-backed editor through the flow machine's member", async () => {
    mountToaster();
    const { wrapper, actions } = mountEditor(
      () => Promise.resolve({ id: 1 }),
      ["set", "resolve"]
    );

    await save(wrapper);

    expect(actions.resolve).toHaveBeenCalledTimes(1);
  });

  it("fires the declared submit action with the model it holds", async () => {
    mountToaster();
    const { wrapper, actions } = mountEditor(() => Promise.resolve({ id: 1 }));

    await save(wrapper);

    expect(actions.update).toHaveBeenCalledTimes(1);
    expect(actions.update).toHaveBeenCalledWith({ email: unverifiedRow.email });
  });
});

describe("@AC3 a settled save resolves the flow", () => {
  it("emits resolved once the save actually settles", async () => {
    mountToaster();
    const { wrapper } = mountEditor(() => Promise.resolve({ id: 1 }));

    await save(wrapper);

    expect(wrapper.emitted("resolved")).toHaveLength(1);
  });

  it("reports the declared success sentence", async () => {
    const toaster = mountToaster();
    const { wrapper } = mountEditor(() => Promise.resolve({ id: 1 }));

    await save(wrapper);

    expect(await toaster.reported()).toContain(
      confirm[feedback?.success.replace("confirm.", "") as keyof typeof confirm]
    );
  });
});

describe("@AC3 a REFUSED save keeps the form on screen", () => {
  it("does not resolve the flow when the API refuses the save", async () => {
    mountToaster();
    const { wrapper } = mountEditor(() => Promise.reject(recordedRejection()));

    await save(wrapper);

    expect(wrapper.emitted("resolved")).toBeUndefined();
  });

  it("leaves the form — and the typed value — exactly where they were", async () => {
    mountToaster();
    const { wrapper } = mountEditor(() => Promise.reject(recordedRejection()));

    await save(wrapper);

    const upmForm = wrapper.findComponent(UpmForm);
    expect(upmForm.exists()).toBe(true);
    expect(upmForm.props("modelValue")).toEqual({ email: unverifiedRow.email });
  });

  it("reports the failure with the API's OWN sentence, so the reason is on screen", async () => {
    const toaster = mountToaster();
    const { wrapper } = mountEditor(() => Promise.reject(recordedRejection()));

    await save(wrapper);

    const reported = await toaster.reported();
    expect(reported).toContain(
      error[feedback?.failure.replace("error.", "") as keyof typeof error]
    );
    expect(reported).toContain(API_MESSAGE);
  });

  it("accepts a second attempt — the refusal is recoverable, not terminal", async () => {
    mountToaster();
    const { wrapper, actions } = mountEditor(() =>
      Promise.reject(recordedRejection())
    );

    await save(wrapper);
    await save(wrapper);

    expect(actions.update).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted("resolved")).toBeUndefined();
  });
});
