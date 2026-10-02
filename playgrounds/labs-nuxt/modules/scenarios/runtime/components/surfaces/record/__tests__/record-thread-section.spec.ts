// -----------------------------------------------------------------------------
/**
 * @module surfaces/record/__tests__/record-thread-section.spec
 * @description The `thread` record section drawn WHOLE from a `RecordThreadSection`
 * declaration against a live port double — the conversation twin of the field and
 * collection sections. What is proven is that the declaration IS the thread: the
 * discriminator routes each entry to its message or log form, a `#/` gate on a
 * message shows or hides its control, a message action and a file action fire the
 * manager member they name with the identity their `args` resolve, the section's
 * own paging actions gate on the record's scopes, and the composer uploads a
 * picked file before it replies and keeps a refused draft on screen.
 *
 * The port is a declared `ModulePort` double, as `record-surface.spec` uses — no
 * implementation of the thread is read; the declaration and the public port shape
 * are the contract.
 *
 * ## What Breaks If These Fail
 * The thread stops being declaration-driven: a log draws as a message, a gated
 * message control leaks, an action fires the wrong member or drops the message it
 * was bound against, paging ignores its gate, or a reply is sent before its
 * attachment went up — or a refused reply vanishes with the user's words.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { RecordSurface } from "../../index";
import type { ModulePort } from "../../../../composables/useModulePort.types";
import type {
  RecordThreadSection,
  RecordUischema
} from "../../../../scenario.types";
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

const baseThread = (
  over: Partial<RecordThreadSection> = {}
): RecordThreadSection => ({
  kind: "thread",
  key: "conversation",
  i18n: "text.conversation",
  entries: "#/properties/entries",
  discriminator: { scope: "#/properties/kind", message: "message", log: "log" },
  message: {
    scope: "#/properties/data",
    author: "#/properties/author",
    date: "#/properties/createdAt",
    files: "#/properties/files",
    body: [{ type: "TableCellText", scope: "#/properties/text" } as never]
  },
  log: {
    scope: "#/properties/data",
    value: "#/properties/event",
    i18n: "text.log"
  },
  empty: { title: "text.empty_title", text: "text.empty_text" },
  ...over
});

const withThread = (section: RecordThreadSection): RecordUischema => ({
  type: "RecordLayout",
  record: "ticket",
  header: { title: "#/properties/name" },
  sections: [section],
  actions: []
});

const message = (
  id: string,
  text: string,
  extra: Record<string, unknown> = {}
) => ({
  kind: "message",
  data: {
    id,
    author: "Ada Lovelace",
    createdAt: { date: "2026-01-01", relative: "today" },
    text,
    ...extra
  }
});

const log = (event: string) => ({ kind: "log", data: { event } });

const findAll = (wrapper: ReturnType<typeof mount>, key: string) =>
  wrapper.findAll(`[data-test-key="${key}"]`);

// -----------------------------------------------------------------------------

describe("RecordThreadSection — the discriminator routes each entry to its form", () => {
  it("draws a message entry as a message and a log entry as a log line", async () => {
    const { port } = makePort({
      context: {
        ticket: {
          name: "Ticket one",
          entries: [message("m1", "First reply body"), log("the ticket opened")]
        }
      }
    });
    const wrapper = await mountRecord(withThread(baseThread()), port);

    const entries = findAll(wrapper, "record-thread-entry");
    expect(entries).toHaveLength(2);
    expect(entries[0].text()).toContain("First reply body");
    expect(entries[0].text()).toContain("Ada Lovelace");
    expect(
      entries[0].find('[data-test-key="record-thread-log"]').exists()
    ).toBe(false);
    expect(
      entries[1].find('[data-test-key="record-thread-log"]').exists()
    ).toBe(true);
    expect(entries[1].text()).not.toContain("Ada Lovelace");
  });

  it("draws no timeline when the thread has no entries", async () => {
    const { port } = makePort({
      context: { ticket: { name: "Ticket one", entries: [] } }
    });
    const wrapper = await mountRecord(withThread(baseThread()), port);

    expect(
      wrapper.find('[data-test-key="record-thread-entries"]').exists()
    ).toBe(false);
    expect(findAll(wrapper, "record-thread-entry")).toHaveLength(0);
  });
});

describe("RecordThreadSection — a `#/` gate on a message shows or hides its control", () => {
  const gatedThread = baseThread({
    message: {
      scope: "#/properties/data",
      author: "#/properties/author",
      body: [{ type: "TableCellText", scope: "#/properties/text" } as never],
      actions: [
        {
          name: "flag",
          i18n: "action.flag",
          run: "flagMessage",
          gate: "#/properties/canFlag"
        }
      ]
    }
  });

  it("draws the control only for the messages whose row-scope gate is open", async () => {
    const { port } = makePort({
      context: {
        ticket: {
          name: "Ticket one",
          entries: [
            message("m1", "open", { canFlag: true }),
            message("m2", "shut", { canFlag: false })
          ]
        }
      },
      actions: { flagMessage: () => undefined }
    });
    const wrapper = await mountRecord(withThread(gatedThread), port);

    expect(findAll(wrapper, "record-thread-flag")).toHaveLength(1);
  });
});

describe("RecordThreadSection — a message action fires the member it names with the message", () => {
  const actionThread = baseThread({
    message: {
      scope: "#/properties/data",
      author: "#/properties/author",
      body: [{ type: "TableCellText", scope: "#/properties/text" } as never],
      actions: [
        {
          name: "flag",
          i18n: "action.flag",
          run: "flagMessage",
          args: ["#/properties/id"]
        }
      ]
    }
  });

  it("calls the named run with the identity its args resolve off that message", async () => {
    const { port, actions } = makePort({
      context: {
        ticket: {
          name: "Ticket one",
          entries: [message("m1", "first"), message("m2", "second")]
        }
      },
      actions: { flagMessage: () => undefined }
    });
    const wrapper = await mountRecord(withThread(actionThread), port);

    await findAll(wrapper, "record-thread-flag")[1].trigger("click");

    expect(actions.flagMessage).toHaveBeenCalledWith("m2");
  });
});

describe("RecordThreadSection — a file action fires the member it names against the file", () => {
  const fileThread = baseThread({
    message: {
      scope: "#/properties/data",
      author: "#/properties/author",
      files: "#/properties/files",
      body: [{ type: "TableCellText", scope: "#/properties/text" } as never],
      fileActions: [
        {
          name: "removeFile",
          i18n: "action.remove",
          run: "deleteFile",
          args: ["#/properties/messageId", "#/properties/id"]
        }
      ]
    }
  });

  it("calls the run with the message id and the file id its args resolve", async () => {
    const { port, actions } = makePort({
      context: {
        ticket: {
          name: "Ticket one",
          entries: [
            message("m1", "with a file", {
              files: [{ id: "f1", name: "invoice.pdf" }]
            })
          ]
        }
      },
      actions: { deleteFile: () => undefined }
    });
    const wrapper = await mountRecord(withThread(fileThread), port);

    await wrapper.find('[data-test-key="record-thread-file"]').trigger("click");
    await settle();
    const item = document.querySelector('[role="menuitem"]') as HTMLElement;
    item.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();

    expect(actions.deleteFile).toHaveBeenCalledWith("m1", "f1");
  });
});

describe("RecordThreadSection — the section's paging actions gate on the record's scopes", () => {
  const pagedThread = baseThread({
    actions: [
      {
        name: "older",
        i18n: "action.load_older",
        run: "loadOlder",
        gate: "#/properties/hasOlder"
      },
      {
        name: "newer",
        i18n: "action.load_newer",
        run: "loadNewer",
        gate: "#/properties/hasNewer"
      }
    ]
  });

  const paged = (hasOlder: boolean, hasNewer: boolean) =>
    makePort({
      context: {
        ticket: {
          name: "Ticket one",
          hasOlder,
          hasNewer,
          entries: [message("m1", "only")]
        }
      },
      actions: { loadOlder: () => undefined, loadNewer: () => undefined }
    });

  const link = (wrapper: ReturnType<typeof mount>, value: string) =>
    wrapper.find(`[data-test-key="link"][data-test-value="${value}"]`);

  it("offers older and withholds newer while only the older scope is true", async () => {
    const wrapper = await mountRecord(
      withThread(pagedThread),
      paged(true, false).port
    );

    expect(link(wrapper, "action-load-older").exists()).toBe(true);
    expect(link(wrapper, "action-load-newer").exists()).toBe(false);
  });

  it("offers newer and withholds older once the scopes flip", async () => {
    const wrapper = await mountRecord(
      withThread(pagedThread),
      paged(false, true).port
    );

    expect(link(wrapper, "action-load-older").exists()).toBe(false);
    expect(link(wrapper, "action-load-newer").exists()).toBe(true);
  });

  it("fires the paging member the offered link names", async () => {
    const { port, actions } = paged(true, false);
    const wrapper = await mountRecord(withThread(pagedThread), port);

    await link(wrapper, "action-load-older").trigger("click");

    expect(actions.loadOlder).toHaveBeenCalledTimes(1);
  });
});

describe("RecordThreadSection — the composer uploads, replies, and keeps a refusal", () => {
  const composed = (
    over: Partial<NonNullable<RecordThreadSection["composer"]>> = {}
  ): RecordThreadSection =>
    baseThread({
      composer: {
        submit: "reply",
        upload: "attach",
        i18n: {
          placeholder: "text.placeholder",
          submit: "action.send",
          attach: "action.attach",
          uploaded: "text.uploaded",
          failed: "text.failed",
          refused: "text.refused"
        },
        ...over
      }
    });

  const peopled = (
    actions: Record<string, (...a: unknown[]) => unknown>,
    meta: Record<string, boolean> = {}
  ) =>
    makePort({
      context: {
        ticket: { name: "Ticket one", entries: [message("m1", "first")] }
      },
      meta,
      actions
    });

  it("does not draw the composer while its gate flag is false", async () => {
    const { port } = peopled({ reply: () => undefined }, { canReply: false });
    const wrapper = await mountRecord(
      withThread(composed({ gate: "canReply" })),
      port
    );

    expect(
      wrapper.find('[data-test-key="record-thread-composer"]').exists()
    ).toBe(false);
  });

  it("holds submit until the draft has content, then sends the body", async () => {
    const { port, actions } = peopled({ reply: () => undefined });
    const wrapper = await mountRecord(withThread(composed()), port);

    expect(
      wrapper
        .find('[data-test-key="record-thread-send"]')
        .attributes("disabled")
    ).toBeDefined();

    await wrapper
      .find('[data-test-key="record-thread-reply"]')
      .setValue("a typed reply");
    expect(
      wrapper
        .find('[data-test-key="record-thread-send"]')
        .attributes("disabled")
    ).toBeUndefined();

    await wrapper.find('[data-test-key="record-thread-send"]').trigger("click");

    expect(actions.reply).toHaveBeenCalledTimes(1);
    expect(actions.reply.mock.calls[0][0]).toBe("a typed reply");
  });

  it("uploads a picked file before the reply is sent", async () => {
    const { port, actions } = peopled({
      attach: () => Promise.resolve({ id: "up1", name: "pic.png" }),
      reply: () => undefined
    });
    const wrapper = await mountRecord(withThread(composed()), port);

    const picked = new File(["x"], "pic.png", { type: "image/png" });
    wrapper
      .findComponent('[data-slot="file-upload"]')
      .vm.$emit("update:modelValue", [picked]);
    await settle();

    await wrapper
      .find('[data-test-key="record-thread-reply"]')
      .setValue("see attached");
    await wrapper.find('[data-test-key="record-thread-send"]').trigger("click");

    expect(actions.attach).toHaveBeenCalledWith(picked);
    expect(actions.attach.mock.invocationCallOrder[0]).toBeLessThan(
      actions.reply.mock.invocationCallOrder[0]
    );
  });

  it("keeps the draft and cautions the user when the reply is refused", async () => {
    const { port } = peopled({ reply: () => undefined });
    const wrapper = await mountRecord(withThread(composed()), port);

    await wrapper
      .find('[data-test-key="record-thread-reply"]')
      .setValue("a refused reply");
    await wrapper.find('[data-test-key="record-thread-send"]').trigger("click");
    await settle();

    const reply = wrapper.find('[data-test-key="record-thread-reply"]');
    expect((reply.element as HTMLTextAreaElement).value).toBe(
      "a refused reply"
    );
    expect(
      wrapper.find('[data-test-key="record-thread-composer"]').text()
    ).toContain("text.refused");
  });
});
