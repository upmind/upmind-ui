// -----------------------------------------------------------------------------
/**
 * @module surfaces/__tests__/record-surface.spec
 * @description The single-record surface drawn WHOLE from a `RecordUischema`
 * against a live port — the systematic twin of the list surface. Every field,
 * write, form and navigation is built from the declaration, so what is proven
 * here is that the declaration IS the surface: an action fires the manager
 * member it names, a gate hides the control it guards, a form opens the one
 * shared drawer over the context slot it names, a navigation carries the page's
 * scope suffix, and an absent or empty value draws nothing.
 *
 * The port is a declared double of `ModulePort` — `snapshot()` reports the
 * record under the declared context key, `getMeta()` the flags the gates read,
 * and `actions` the manager members the controls fire. No implementation of the
 * surface is read; the declaration and the public port shape are the contract.
 *
 * ## What Breaks If These Fail
 * The record archetype stops being declaration-driven: a control fires the wrong
 * member or none, a gated write leaks, a form writes past the shared drawer, a
 * navigation drops the actor off the next page, or a record draws fields the API
 * never gave it.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { Form } from "@upmind-automation/foundation";
import {
  RecordActionPlacementTypes,
  type RecordActionDeclaration,
  type RecordUischema
} from "../../../scenario.types";
import { RecordSurface } from "../index";
import type { ModulePort } from "../../../composables/useModulePort.types";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

type PortDouble = {
  context?: Record<string, unknown>;
  meta?: Record<string, boolean>;
  actions?: Record<string, (input?: unknown) => unknown>;
};

const makePort = ({ context = {}, meta = {}, actions = {} }: PortDouble = {}): {
  port: ModulePort;
  actions: Record<string, ReturnType<typeof vi.fn>>;
} => {
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
    routes: [
      {
        path: "/record/:id/:scopeSuffix(.*)*",
        component: { template: "<div/>" }
      },
      { path: "/:catchAll(.*)", component: { template: "<div/>" } }
    ]
  });

async function mountRecord(
  uischema: RecordUischema,
  port: ModulePort,
  router: Router,
  locked = false
) {
  await router.push("/record/rec-1/as/client");
  await router.isReady();
  const wrapper = mount(RecordSurface, {
    props: { uischema, port, locked },
    global: { plugins: [router] }
  });
  await settle();
  return wrapper;
}

const settle = () => new Promise(resolve => setTimeout(resolve, 10));

const baseHeader = { title: "#/properties/name" } as const;

const action = (
  extra: Partial<RecordActionDeclaration> & { name: string; i18n: string }
): RecordActionDeclaration => ({ ...extra });

const control = (wrapper: ReturnType<typeof mount>, value: string) =>
  wrapper.find(`[data-test-key="record-actions"] [data-test-value="${value}"]`);

// The drawer teleports to `document.body`, so it is reached off the document
// rather than the surface wrapper.
const inBody = (testKey: string) =>
  document.querySelector(`[data-test-key="${testKey}"]`);

const clickInBody = async (testKey: string): Promise<void> => {
  inBody(testKey)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await settle();
};

// -----------------------------------------------------------------------------

describe("RecordSurface — an action fires the manager member it names", () => {
  it("calls the named run action when its control is pressed", async () => {
    const { port, actions } = makePort({
      context: { contract: { name: "Acme" } },
      actions: { reset: () => undefined }
    });
    const wrapper = await mountRecord(
      {
        type: "RecordLayout",
        record: "contract",
        header: baseHeader,
        sections: [],
        actions: [action({ name: "reset", i18n: "action.reset", run: "reset" })]
      },
      port,
      makeRouter()
    );

    await control(wrapper, "reset").trigger("click");

    expect(actions.reset).toHaveBeenCalledTimes(1);
  });

  it("places a run action in the footer by default", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme" } },
      actions: { reset: () => undefined }
    });
    const wrapper = await mountRecord(
      {
        type: "RecordLayout",
        record: "contract",
        header: baseHeader,
        sections: [],
        actions: [action({ name: "reset", i18n: "action.reset", run: "reset" })]
      },
      port,
      makeRouter()
    );

    expect(wrapper.find('[data-test-key="record-footer"]').exists()).toBe(true);
    expect(control(wrapper, "reset").exists()).toBe(true);
    expect(RecordActionPlacementTypes.FOOTER).toBe("footer");
  });
});

describe("RecordSurface — a gate hides the control it guards", () => {
  const gated = (meta: Record<string, boolean>) =>
    makePort({
      context: { contract: { name: "Acme" } },
      meta,
      actions: { remove: () => undefined }
    }).port;

  const withGate = (gate: string): RecordUischema => ({
    type: "RecordLayout",
    record: "contract",
    header: baseHeader,
    sections: [],
    actions: [
      action({ name: "remove", i18n: "action.remove", run: "remove", gate })
    ]
  });

  it("hides the control while its gate flag is false", async () => {
    const wrapper = await mountRecord(
      withGate("canRemove"),
      gated({ canRemove: false }),
      makeRouter()
    );

    expect(control(wrapper, "remove").exists()).toBe(false);
  });

  it("shows the control once its gate flag is true", async () => {
    const wrapper = await mountRecord(
      withGate("canRemove"),
      gated({ canRemove: true }),
      makeRouter()
    );

    expect(control(wrapper, "remove").exists()).toBe(true);
  });

  it("negates a `!flag` gate — shown while the flag is false", async () => {
    const wrapper = await mountRecord(
      withGate("!canRemove"),
      gated({ canRemove: false }),
      makeRouter()
    );

    expect(control(wrapper, "remove").exists()).toBe(true);
  });
});

describe("RecordSurface — a busy write spins, and freezes the others", () => {
  it("draws the control its `busy` flag names as loading", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme" } },
      meta: { isResetting: true },
      actions: { reset: () => undefined }
    });
    const wrapper = await mountRecord(
      {
        type: "RecordLayout",
        record: "contract",
        header: baseHeader,
        sections: [],
        actions: [
          action({
            name: "reset",
            i18n: "action.reset",
            run: "reset",
            busy: "isResetting"
          })
        ]
      },
      port,
      makeRouter()
    );

    expect(control(wrapper, "reset").attributes("data-loading")).toBeDefined();
  });

  it("disables every other write while one action is in flight", async () => {
    let release!: () => void;
    const pending = new Promise<void>(resolve => (release = resolve));
    const { port, actions } = makePort({
      context: { contract: { name: "Acme" } },
      actions: { reset: () => pending, refresh: () => undefined }
    });
    const wrapper = await mountRecord(
      {
        type: "RecordLayout",
        record: "contract",
        header: baseHeader,
        sections: [],
        actions: [
          action({ name: "reset", i18n: "action.reset", run: "reset" }),
          action({ name: "edit", i18n: "action.edit", run: "refresh" })
        ]
      },
      port,
      makeRouter()
    );

    await control(wrapper, "reset").trigger("click");
    await settle();

    expect(actions.reset).toHaveBeenCalledTimes(1);
    expect(control(wrapper, "reset").attributes("data-loading")).toBeDefined();
    expect(control(wrapper, "edit").attributes("disabled")).toBeDefined();

    release();
    await settle();

    expect(control(wrapper, "edit").attributes("disabled")).toBeUndefined();
  });
});

describe("RecordSurface — a form opens the one shared drawer over its context slot", () => {
  let open: ReturnType<typeof mount> | undefined;

  afterEach(() => {
    open?.unmount();
    open = undefined;
  });

  const formUischema: RecordUischema = {
    type: "RecordLayout",
    record: "contract",
    header: baseHeader,
    sections: [],
    actions: [
      action({
        name: "edit",
        i18n: "action.edit",
        form: {
          context: "editForm",
          set: "setEdit",
          submit: "saveEdit",
          cancel: "cancelEdit",
          valid: "canSave"
        }
      })
    ]
  };

  const formPort = (submit: () => unknown = () => undefined) =>
    makePort({
      context: {
        contract: { name: "Acme" },
        editForm: { schema: { type: "object" }, uischema: {}, model: { a: 1 } }
      },
      meta: { canSave: true },
      actions: {
        setEdit: () => undefined,
        saveEdit: submit,
        cancelEdit: () => undefined
      }
    });

  const openForm = async (wrapper: ReturnType<typeof mount>): Promise<void> => {
    open = wrapper;
    await control(wrapper, "edit").trigger("click");
    await settle();
  };

  it("draws no drawer until the form action is pressed", async () => {
    const { port } = formPort();
    open = await mountRecord(formUischema, port, makeRouter());

    expect(inBody("record-form-dialog")).toBe(null);
  });

  it("projects the declared context slot onto the one shared Form", async () => {
    const { port } = formPort();
    const wrapper = await mountRecord(formUischema, port, makeRouter());
    await openForm(wrapper);

    const form = wrapper.findComponent(Form);
    expect(form.exists()).toBe(true);
    expect(form.props("schema")).toEqual({ type: "object" });
    expect(form.props("modelValue")).toEqual({ a: 1 });
  });

  it("routes a model change to the set action", async () => {
    const { port, actions } = formPort();
    const wrapper = await mountRecord(formUischema, port, makeRouter());
    await openForm(wrapper);

    await wrapper.findComponent(Form).vm.$emit("update:modelValue", { a: 2 });

    expect(actions.setEdit).toHaveBeenCalled();
  });

  it("routes the drawer's cancel to the cancel action and closes it", async () => {
    const { port, actions } = formPort();
    const wrapper = await mountRecord(formUischema, port, makeRouter());
    await openForm(wrapper);
    expect(inBody("record-form-dialog")).not.toBe(null);

    await clickInBody("record-form-cancel");

    expect(actions.cancelEdit).toHaveBeenCalledTimes(1);
    expect(inBody("record-form-dialog")).toBe(null);
  });

  it("routes the drawer's submit to the submit action and closes once it settles", async () => {
    const { port, actions } = formPort();
    const wrapper = await mountRecord(formUischema, port, makeRouter());
    await openForm(wrapper);

    await clickInBody("record-form-submit");

    expect(actions.saveEdit).toHaveBeenCalledTimes(1);
    expect(inBody("record-form-dialog")).toBe(null);
  });
});

describe("RecordSurface — a navigation carries the page's scope suffix", () => {
  it("fills the route id and appends the current actor suffix", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme", id: "rec-1" } }
    });
    const router = makeRouter();
    const uischema: RecordUischema = {
      type: "RecordLayout",
      record: "contract",
      header: baseHeader,
      sections: [],
      actions: [
        action({
          name: "open",
          i18n: "action.view",
          navigate: { route: "/other/:id", idScope: "#/properties/id" }
        })
      ]
    };
    const wrapper = await mountRecord(uischema, port, router);
    const push = vi.spyOn(router, "push");

    await control(wrapper, "view").trigger("click");
    await settle();

    expect(push).toHaveBeenCalledWith({
      path: "/other/rec-1/as/client",
      query: undefined
    });
  });

  it("drops the scope suffix for an unscoped app route", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme", id: "rec-1" } }
    });
    const router = makeRouter();
    const uischema: RecordUischema = {
      type: "RecordLayout",
      record: "contract",
      header: baseHeader,
      sections: [],
      actions: [
        action({
          name: "register",
          i18n: "action.register",
          navigate: { route: "/auth/register", unscoped: true }
        })
      ]
    };
    const wrapper = await mountRecord(uischema, port, router);
    const push = vi.spyOn(router, "push");

    await control(wrapper, "register").trigger("click");
    await settle();

    const [target] = push.mock.calls[0] as [{ path: string }];
    expect(target.path).toBe("/auth/register");
    expect(target.path).not.toContain("/as/");
  });
});

describe("RecordSurface — the header's lead draws the first notice whose gate opens", () => {
  const COMPLETE = "lead.order_complete";
  const PLACED = "lead.order_placed";

  const withLead: RecordUischema = {
    type: "RecordLayout",
    record: "contract",
    header: {
      title: "#/properties/name",
      lead: [
        { name: "complete", gate: "isComplete", i18n: { title: COMPLETE } },
        { name: "placed", i18n: { title: PLACED } }
      ]
    },
    sections: [],
    actions: []
  };

  const leadPort = (meta: Record<string, boolean>) =>
    makePort({ context: { contract: { name: "Acme" } }, meta }).port;

  it("draws the gated lead when its flag is open, over the ungated fallback", async () => {
    const wrapper = await mountRecord(
      withLead,
      leadPort({ isComplete: true }),
      makeRouter()
    );

    expect(wrapper.text()).toContain(COMPLETE);
    expect(wrapper.text()).not.toContain(PLACED);
  });

  it("falls through to the ungated lead when the gated flag is closed", async () => {
    const wrapper = await mountRecord(
      withLead,
      leadPort({ isComplete: false }),
      makeRouter()
    );

    expect(wrapper.text()).toContain(PLACED);
    expect(wrapper.text()).not.toContain(COMPLETE);
  });
});

describe("RecordSurface — an absent or empty value draws nothing", () => {
  const sectioned: RecordUischema = {
    type: "RecordLayout",
    record: "contract",
    header: baseHeader,
    sections: [
      {
        kind: "fields",
        key: "details",
        elements: [
          { type: "TableCellText", scope: "#/properties/name" } as never,
          { type: "TableCellText", scope: "#/properties/reference" } as never,
          { type: "TableCellDate", scope: "#/properties/endsAt" } as never
        ]
      },
      {
        kind: "fields",
        key: "empty",
        i18n: "action.remove",
        elements: [
          { type: "TableCellText", scope: "#/properties/absent" } as never
        ]
      }
    ],
    actions: []
  };

  it("draws a field the record carries a value for", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme plan", reference: "", endsAt: null } }
    });
    const wrapper = await mountRecord(sectioned, port, makeRouter());

    expect(wrapper.text()).toContain("Acme plan");
  });

  it("draws nothing for an absent (zero-sentinel) date", async () => {
    const { port } = makePort({
      context: {
        contract: {
          name: "Acme plan",
          endsAt: { date: "1899-12-30", relative: "127 years ago" }
        }
      }
    });
    const wrapper = await mountRecord(sectioned, port, makeRouter());

    expect(wrapper.text()).not.toContain("127 years ago");
  });

  it("draws nothing for a section whose every field is empty", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme plan" } }
    });
    const wrapper = await mountRecord(sectioned, port, makeRouter());

    expect(wrapper.find('[data-test-value="empty"]').exists()).toBe(false);
  });

  it("draws nothing for a section kind no renderer is registered for", async () => {
    const { port } = makePort({
      context: { contract: { name: "Acme plan" } }
    });
    const wrapper = await mountRecord(
      {
        type: "RecordLayout",
        record: "contract",
        header: baseHeader,
        sections: [
          {
            kind: "thread-not-yet-built",
            key: "t",
            i18n: "action.remove"
          } as never
        ],
        actions: []
      },
      port,
      makeRouter()
    );

    expect(wrapper.find('[data-test-value="t"]').exists()).toBe(false);
  });
});
