// -----------------------------------------------------------------------------
/**
 * @module surfaces/record/__tests__/record-argument-forms.spec
 * @description The ARGUMENT form a record action opens — the variant of the one
 * shared drawer for a manager whose write takes arguments rather than a context
 * model. The form declares its own `schema`, the drawer holds the model, and what
 * is proven here is the three things that distinguishes it from a context-slot
 * form: the held model is PREFILLED from the record's same-named members, `submit`
 * is called with the `args` resolved off that held model, and the submit control
 * is withheld until the declared `valid` flag is true.
 *
 * The port is a declared `ModulePort` double, as `record-surface.spec` uses — no
 * implementation of the surface is read; the declaration and the public port
 * shape are the contract.
 *
 * ## What Breaks If These Fail
 * An argument write opens empty when it should carry the record's values, commits
 * the wrong arguments, or lets a submit fire while the manager says the input is
 * not yet valid.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { Form } from "@upmind-automation/foundation";
import { RecordSurface } from "../../index";
import type { ModulePort } from "../../../../composables/useModulePort.types";
import type { RecordUischema } from "../../../../scenario.types";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

const settle = () => new Promise(resolve => setTimeout(resolve, 10));

type PortDouble = {
  context?: Record<string, unknown>;
  meta?: Record<string, boolean>;
  actions?: Record<string, (...input: unknown[]) => unknown>;
};

const makePort = ({
  context = {},
  meta = {},
  actions = {}
}: PortDouble = {}) => {
  const spies = Object.fromEntries(
    Object.entries(actions).map(([name, fn]) => [name, vi.fn(fn)])
  ) as Record<string, ReturnType<typeof vi.fn>>;
  const port = {
    snapshot: () => ({ actions: Object.keys(spies), context, meta }),
    getMeta: () => meta,
    actions: spies
  } as unknown as ModulePort;
  return { port, actions: spies };
};

const makeRouter = (): Router =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:catchAll(.*)", component: { template: "<div/>" } }]
  });

async function mountRecord(uischema: RecordUischema, port: ModulePort) {
  const router = makeRouter();
  await router.push("/record/rec-1/as/client");
  await router.isReady();
  const wrapper = mount(RecordSurface, {
    props: { uischema, port, locked: false },
    global: { plugins: [router] }
  });
  await settle();
  return wrapper;
}

const control = (wrapper: ReturnType<typeof mount>, value: string) =>
  wrapper.find(`[data-test-key="record-actions"] [data-test-value="${value}"]`);

const inBody = (key: string) =>
  document.querySelector(`[data-test-key="${key}"]`);

const clickInBody = async (key: string): Promise<void> => {
  inBody(key)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await settle();
};

const argForm = (
  over: Partial<{
    prefill: boolean;
    args: string[];
    valid: string;
  }> = {}
): RecordUischema => ({
  type: "RecordLayout",
  record: "contract",
  header: { title: "#/properties/name" },
  sections: [],
  actions: [
    {
      name: "rename",
      i18n: "action.edit",
      form: {
        schema: {
          type: "object",
          properties: { name: { type: "string" } }
        } as never,
        submit: "rename",
        ...over
      }
    }
  ]
});

const openForm = async (wrapper: ReturnType<typeof mount>): Promise<void> => {
  await control(wrapper, "edit").trigger("click");
  await settle();
};

// -----------------------------------------------------------------------------

describe("the argument form prefills the drawer from the record", () => {
  let open: ReturnType<typeof mount> | undefined;
  afterEach(() => {
    open?.unmount();
    open = undefined;
  });

  it("seeds the held model from the record's same-named members", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme plan", reference: "REF-9" } },
      meta: { canSave: true },
      actions: { rename: () => undefined }
    });
    open = await mountRecord(argForm({ prefill: true }), port);
    await openForm(open);

    expect(open.findComponent(Form).props("modelValue")).toEqual({
      name: "Acme plan"
    });
  });

  it("opens empty when prefill is not declared", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme plan" } },
      meta: { canSave: true },
      actions: { rename: () => undefined }
    });
    open = await mountRecord(argForm(), port);
    await openForm(open);

    expect(open.findComponent(Form).props("modelValue")).toEqual({});
  });
});

describe("the argument form submits the resolved arguments", () => {
  let open: ReturnType<typeof mount> | undefined;
  afterEach(() => {
    open?.unmount();
    open = undefined;
  });

  it("calls submit with the args resolved off the held model", async () => {
    const { port, actions } = makePort({
      context: { contract: { name: "Acme plan" } },
      meta: { canSave: true },
      actions: { rename: () => undefined }
    });
    open = await mountRecord(
      argForm({ prefill: true, args: ["#/properties/name"] }),
      port
    );
    await openForm(open);

    await open.findComponent(Form).vm.$emit("update:modelValue", {
      name: "New name"
    });
    await settle();
    await clickInBody("record-form-submit");

    expect(actions.rename).toHaveBeenCalledWith("New name");
  });
});

describe("the argument form withholds submit until the input is valid", () => {
  let open: ReturnType<typeof mount> | undefined;
  afterEach(() => {
    open?.unmount();
    open = undefined;
  });

  const submitDisabled = () =>
    (inBody("record-form-submit") as HTMLButtonElement | null)?.hasAttribute(
      "disabled"
    );

  it("disables submit while the valid flag is false", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme plan" } },
      meta: { canSave: false },
      actions: { rename: () => undefined }
    });
    open = await mountRecord(argForm({ valid: "canSave" }), port);
    await openForm(open);

    expect(submitDisabled()).toBe(true);
  });

  it("enables submit once the valid flag is true", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme plan" } },
      meta: { canSave: true },
      actions: { rename: () => undefined }
    });
    open = await mountRecord(argForm({ valid: "canSave" }), port);
    await openForm(open);

    expect(submitDisabled()).toBe(false);
  });
});
