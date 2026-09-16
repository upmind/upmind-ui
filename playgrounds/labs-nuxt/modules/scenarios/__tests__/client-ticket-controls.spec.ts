// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The manager page's per-message, per-attachment, product and
 * upload controls, each DRIVEN to its real outcome (FE-3226)
 *
 * ## Job To Be Done
 * `client-ticket-page.spec.ts` proves the read/reply/lifecycle/subject remit.
 * This file proves the controls the page's docblock used to name as undrawn,
 * and it proves them the only way a control can be proven: by firing it and
 * reading the request that left, never by finding the button. Per attachment,
 * download, copy-filename and delete; per message, re-read, edit and
 * withdraw-with-a-reason,
 * offered only where that message's own `can_manage` allows it; over the feed,
 * the All/Attachments views as two DIFFERENT reads; on the composer, an upload
 * whose ref rides out on the reply; and the related-product link and its
 * explicit-null unlink, both refused while the ticket is locked.
 *
 * ## What Breaks If These Fail
 * A hand clicks Download and nothing leaves; Delete removes the wrong file; an
 * edit saves against the wrong message; a withdrawal drops the reason the wire
 * keeps; the Attachments tab filters rows already held instead of asking the
 * server; an attached file is uploaded and then silently dropped from the reply
 * (the FE-2824 class exactly); unlink omits the key instead of sending an
 * explicit null, leaving the product linked; or a locked ticket is rewritten
 * anyway.
 *
 * ## Provenance
 * Every body is a COMMITTED `tickets` capture replayed over MSW. Two disclosed
 * compositions, both recorded-only:
 *   - `messagesWithAttachment()` lifts the recorded attachment-bearing message
 *     row (`post-tickets-id-replies-case-with-file`) into the recorded
 *     messages-list envelope — staging's list capture holds no file. Disclosed
 *     on the harness function itself.
 *   - `messagesNotMine()` toggles ONE documented wire field (`can_manage`) on a
 *     recorded row, the same technique the module's own oracle uses for
 *     `settings.lock` (`tickets.manager.int.test.ts`, AC-24).
 * The recorded download capture stores the file's LENGTH, not its bytes, so the
 * byte-count is asserted and the content is not.
 *
 * ## NOT proven here, and named rather than implied
 * `uploadAttachment`'s ALLOWED-FILE-TYPE refusal. This brand exposes no
 * `allowed_upload_file_types`, so an absent list means unrestricted and the
 * branch never fires. The SIZE refusal below is proven; the type refusal is
 * coded and UNVERIFIED, and nothing in this file may be read as evidence for it.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RECORDED_TICKET_ID,
  installTicketsHandlers,
  messagesWithAttachment,
  mountTicketPage,
  observeRequests,
  recorded,
  recordedAttachment,
  recordedAttachmentMessageId,
  seedClientSession,
  teardownSession,
  ticketBodyLocked,
  unmountTicketPage
} from "./client-ticket-page.harness";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const SETTLE = 10000;
const CASE = 30000;

/** The module's own ceiling (`tickets.types.ts` `TICKET_ATTACHMENT_MAX_BYTES`). */
const TICKET_ATTACHMENT_MAX_BYTES = 26214399;

type Envelope<T> = { status: string; data: T };

/** Waits for the loaded manager to reach the screen (reference rendered). */
async function shown(wrapper: VueWrapper): Promise<void> {
  await vi.waitFor(
    () =>
      expect(wrapper.find('[data-test-key="ticket-reference"]').exists()).toBe(
        true
      ),
    { timeout: SETTLE }
  );
}

const key = (wrapper: VueWrapper, name: string, value?: string) =>
  wrapper.find(
    value == null
      ? `[data-test-key="${name}"]`
      : `[data-test-key="${name}"][data-test-value="${value}"]`
  );

/** A portalled menu item, read where reka puts it — never inside the wrapper. */
const menuItem = (name: string, value: string): HTMLElement | null =>
  document.querySelector(
    `[data-test-key="${name}"][data-test-value="${value}"]`
  );

const tick = (ms = 30): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Picks a tab the way reka's own TabsTrigger listens for it — `mousedown.left`,
 * never `click` (`reka-ui/dist/Tabs/TabsTrigger`). A `click` here would assert
 * nothing about the rail a hand actually uses.
 */
const selectTab = (wrapper: VueWrapper, name: string) =>
  key(wrapper, name).trigger("mousedown", { button: 0 });

/** Opens the per-attachment menu for the recorded file and returns its id. */
async function openAttachmentMenu(wrapper: VueWrapper): Promise<string> {
  const file = recordedAttachment();
  const trigger = key(wrapper, "ticket-attachment-menu", file.id);
  expect(trigger.exists()).toBe(true);
  await trigger.trigger("click");
  await tick();
  return file.id;
}

/**
 * The recorded feed with ONE documented wire field flipped on the recorded row:
 * `can_manage: false`. Nothing else about the row changes.
 */
function messagesNotMine(): Record<string, unknown> {
  const envelope = recorded.messages();
  const rows = (envelope as unknown as Envelope<Record<string, unknown>[]>)
    .data;
  return {
    ...envelope,
    data: rows.map((row, index) =>
      index === 0 ? { ...row, can_manage: false } : row
    )
  };
}

/**
 * The recorded LINKED ticket with `settings.lock` toggled on — the same single
 * documented wire field `ticketBodyLocked` toggles, over the recorded body that
 * carries a product, so both AC-13 writes are on screen at once.
 */
function lockedAndLinked(): Record<string, unknown> {
  const body = recorded.oneLinked();
  const data = (body as unknown as Envelope<Record<string, unknown>>).data;
  return { ...body, data: { ...data, settings: { lock: true } } };
}

const firstMessageId = (): string =>
  (recorded.messages() as unknown as Envelope<Array<{ id: string }>>).data[0]!
    .id;

// -----------------------------------------------------------------------------

describe("the manager page's attachment controls drive the module's file members", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  it(
    "AC-20 Download asks the server for THAT file's bytes and shows what came back",
    async () => {
      const sent = installTicketsHandlers({
        messagesBody: messagesWithAttachment()
      });
      const observed = observeRequests();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const fileId = await openAttachmentMenu(wrapper);
      menuItem("ticket-attachment-download", fileId)?.click();

      await vi.waitFor(() => expect(sent.downloads.length).toBeGreaterThan(0), {
        timeout: SETTLE
      });
      observed.stop();

      expect(sent.downloads[0]).toContain(
        `/ticket_messages/files/${fileId}/download`
      );
      expect(observed.count("/api/admin/")).toBe(0);

      const recordedLength = (
        recorded.downloadedFile() as unknown as { byteLength: number }
      ).byteLength;
      await vi.waitFor(
        () =>
          expect(
            key(wrapper, "ticket-attachment-downloaded").attributes(
              "data-test-value"
            )
          ).toBe(String(recordedLength)),
        { timeout: SETTLE }
      );
    },
    CASE
  );

  it(
    "Copy filename puts THAT file's name on the clipboard and sends nothing",
    async () => {
      const sent = installTicketsHandlers({
        messagesBody: messagesWithAttachment()
      });
      const copied: string[] = [];
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: (text: string) => void copied.push(text) },
        configurable: true
      });

      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const fileId = await openAttachmentMenu(wrapper);
      menuItem("ticket-attachment-copy", fileId)?.click();
      await tick();

      // Pure UI, no module member: it must copy the real recorded filename and
      // must not fire a download or a delete on the way.
      expect(copied).toEqual([recordedAttachment().name]);
      expect(sent.downloads).toEqual([]);
      expect(sent.attachmentDeletes).toEqual([]);
    },
    CASE
  );

  it(
    "AC-21 Delete removes THAT file from THAT message, on the client path",
    async () => {
      const sent = installTicketsHandlers({
        messagesBody: messagesWithAttachment()
      });
      const observed = observeRequests();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const fileId = await openAttachmentMenu(wrapper);
      menuItem("ticket-attachment-delete", fileId)?.click();

      await vi.waitFor(
        () => expect(sent.attachmentDeletes.length).toBeGreaterThan(0),
        { timeout: SETTLE }
      );
      observed.stop();

      // Both ids, in the one url: a menu wired to the wrong message or the
      // wrong file still fires a DELETE, and only this catches it.
      expect(sent.attachmentDeletes[0]).toContain(
        `/tickets/${RECORDED_TICKET_ID}/messages/${recordedAttachmentMessageId()}/files/${fileId}`
      );
      expect(observed.count("/api/admin/")).toBe(0);
    },
    CASE
  );
});

describe("the manager page's per-message controls are gated by that message's own can_manage", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  it(
    "AC-16 Reload re-reads THAT message from the server",
    async () => {
      const sent = installTicketsHandlers();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const messageId = firstMessageId();
      await key(wrapper, "ticket-message-reload", messageId).trigger("click");

      await vi.waitFor(
        () => expect(sent.messageGets.length).toBeGreaterThan(0),
        { timeout: SETTLE }
      );
      expect(sent.messageGets[0]).toContain(
        `/tickets/${RECORDED_TICKET_ID}/messages/${messageId}`
      );
    },
    CASE
  );

  it(
    "AC-18 Edit saves the corrected body against THAT message",
    async () => {
      const sent = installTicketsHandlers();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const messageId = firstMessageId();
      await key(wrapper, "ticket-message-edit", messageId).trigger("click");
      await key(wrapper, "ticket-message-edit-input").setValue(
        "A recorded-bench correction"
      );
      await key(wrapper, "ticket-message-edit-save").trigger("click");

      await vi.waitFor(() => expect(sent.replyPuts.length).toBeGreaterThan(0), {
        timeout: SETTLE
      });

      expect(sent.replyPuts[0]?.url).toContain(
        `/tickets/${RECORDED_TICKET_ID}/replies/${messageId}`
      );
      expect((sent.replyPuts[0]?.body as { body?: string })?.body).toBe(
        "A recorded-bench correction"
      );
    },
    CASE
  );

  it(
    "AC-19 Withdraw carries the typed REASON on the wire, never an empty delete",
    async () => {
      const sent = installTicketsHandlers();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const messageId = firstMessageId();
      await key(wrapper, "ticket-message-delete", messageId).trigger("click");
      await key(wrapper, "ticket-message-delete-reason").setValue(
        "Recorded withdrawal for FE-3226."
      );
      await key(wrapper, "ticket-message-delete-confirm").trigger("click");

      await vi.waitFor(
        () => expect(sent.messageDeletes.length).toBeGreaterThan(0),
        { timeout: SETTLE }
      );

      expect(sent.messageDeletes[0]?.url).toContain(
        `/tickets/${RECORDED_TICKET_ID}/messages/${messageId}`
      );
      // The reason is the whole point of AC-19's signature: a page that drops it
      // still issues a DELETE the server accepts, and the audit trail is lost.
      expect(
        (sent.messageDeletes[0]?.body as { reason?: string })?.reason
      ).toBe("Recorded withdrawal for FE-3226.");
    },
    CASE
  );

  it(
    "offers NO edit or withdraw on a message this client cannot manage",
    async () => {
      installTicketsHandlers({ messagesBody: messagesNotMine() });
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const messageId = firstMessageId();
      await vi.waitFor(
        () =>
          expect(
            wrapper.find('[data-test-key="ticket-message-reload"]').exists()
          ).toBe(true),
        { timeout: SETTLE }
      );

      // The re-read is offered on every message; the WRITES are not.
      expect(key(wrapper, "ticket-message-reload", messageId).exists()).toBe(
        true
      );
      expect(key(wrapper, "ticket-message-edit", messageId).exists()).toBe(
        false
      );
      expect(key(wrapper, "ticket-message-delete", messageId).exists()).toBe(
        false
      );

      // The discrimination: the SIBLING message, recorded `can_manage: true`,
      // keeps both writes. A page that simply stopped drawing them, or one that
      // gated on the ticket rather than the message, would fail here.
      const mine = (
        recorded.messages() as unknown as Envelope<Array<{ id: string }>>
      ).data[1]!.id;
      expect(key(wrapper, "ticket-message-edit", mine).exists()).toBe(true);
      expect(key(wrapper, "ticket-message-delete", mine).exists()).toBe(true);
    },
    CASE
  );
});

describe("the manager page's feed views are two different reads, not one filtered twice", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  it(
    "AC-15 the Attachments view asks the server for attachment-bearing messages",
    async () => {
      const sent = installTicketsHandlers({
        messagesBody: messagesWithAttachment()
      });
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const before = sent.messageReads.length;
      expect(before).toBeGreaterThan(0);
      // The boot read is the plain thread — no attachments filter on the wire.
      expect(
        sent.messageReads.some(url =>
          decodeURIComponent(url).includes("filter[files.id|gt]")
        )
      ).toBe(false);

      await selectTab(wrapper, "ticket-view-attachments");

      await vi.waitFor(
        () => expect(sent.messageReads.length).toBeGreaterThan(before),
        { timeout: SETTLE }
      );
      // A tab that filtered rows already held would issue NO new request, and a
      // tab wired to the wrong member would issue one without this filter.
      expect(decodeURIComponent(sent.messageReads.at(-1)!)).toContain(
        "filter[files.id|gt]=0"
      );
    },
    CASE
  );

  it(
    "AC-15 the All view goes back to a read WITHOUT the attachments filter",
    async () => {
      const sent = installTicketsHandlers({
        messagesBody: messagesWithAttachment()
      });
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await selectTab(wrapper, "ticket-view-attachments");
      await vi.waitFor(
        () =>
          expect(decodeURIComponent(sent.messageReads.at(-1)!)).toContain(
            "filter[files.id|gt]=0"
          ),
        { timeout: SETTLE }
      );

      const afterAttachments = sent.messageReads.length;
      await selectTab(wrapper, "ticket-view-all");

      await vi.waitFor(
        () =>
          expect(sent.messageReads.length).toBeGreaterThan(afterAttachments),
        { timeout: SETTLE }
      );
      expect(decodeURIComponent(sent.messageReads.at(-1)!)).not.toContain(
        "filter[files.id|gt]"
      );
    },
    CASE
  );
});

describe("the manager page's composer uploads a file and sends it WITH the reply", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  /** Puts real `File`s on the page's picker and fires the change it listens for. */
  async function pick(wrapper: VueWrapper, files: File[]): Promise<void> {
    const picker = key(wrapper, "ticket-reply-attach");
    expect(picker.exists()).toBe(true);
    Object.defineProperty(picker.element, "files", {
      value: files,
      configurable: true
    });
    await picker.trigger("change");
  }

  it(
    "AC-23 uploads the picked file, then sends its ref out ON the reply",
    async () => {
      const sent = installTicketsHandlers();
      const observed = observeRequests();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await pick(wrapper, [
        new File(
          ["FE-3226 fixture capture attachment.\n"],
          "fe-3226-fixture-attachment.txt",
          { type: "text/plain" }
        )
      ]);

      await vi.waitFor(() => expect(sent.uploads.length).toBe(1), {
        timeout: SETTLE
      });
      expect(sent.uploads[0]?.get("file")).toBeInstanceOf(File);

      const uploadedId = (
        recorded.uploadedFile() as unknown as Envelope<Array<{ id: string }>>
      ).data[0]!.id;

      // The upload landed on the composer as a held ref, not merely "somewhere".
      await vi.waitFor(
        () =>
          expect(
            key(wrapper, "ticket-reply-attachment", uploadedId).exists()
          ).toBe(true),
        { timeout: SETTLE }
      );

      await key(wrapper, "ticket-reply-input").setValue(
        "A recorded-bench reply with a file"
      );
      await wrapper.vm.$nextTick();
      await key(wrapper, "ticket-reply-send").trigger("click");

      await vi.waitFor(() => expect(sent.replies.length).toBeGreaterThan(0), {
        timeout: SETTLE
      });
      observed.stop();

      // The FE-2824 shape exactly: the upload happened, the button worked, and
      // the file was dropped between the two. Only the reply BODY catches it.
      const body = sent.replies[0] as { files?: Array<{ id: string }> };
      expect(body.files?.[0]?.id).toBe(uploadedId);
      expect(observed.count("/api/admin/")).toBe(0);
    },
    CASE
  );

  it(
    "AC-23 refuses a file over the 25 MiB ceiling BEFORE any upload leaves",
    async () => {
      const sent = installTicketsHandlers();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await pick(wrapper, [
        new File(
          [new Uint8Array(TICKET_ATTACHMENT_MAX_BYTES + 1)],
          "too-big.bin",
          { type: "application/octet-stream" }
        )
      ]);

      await vi.waitFor(
        () =>
          expect(
            wrapper.find('[data-test-key="ticket-action-error"]').exists()
          ).toBe(true),
        { timeout: SETTLE }
      );

      expect(sent.uploads).toEqual([]);
      expect(
        wrapper.find('[data-test-key="ticket-reply-attachment"]').exists()
      ).toBe(false);
    },
    CASE
  );

  it(
    "a LOCKED ticket still permits a reply — the lock gates the writes, not the composer",
    async () => {
      installTicketsHandlers({ oneBody: ticketBodyLocked() });
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await key(wrapper, "ticket-reply-input").setValue("Still allowed");
      await wrapper.vm.$nextTick();

      expect(
        key(wrapper, "ticket-reply-send").attributes("disabled")
      ).toBeUndefined();
    },
    CASE
  );
});

describe("the manager page links and unlinks the ticket's related product", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  it(
    "AC-13 Link sends the typed contract-product id on a real PUT",
    async () => {
      const sent = installTicketsHandlers({
        ticketPutBody: recorded.linkedProduct()
      });
      const observed = observeRequests();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      const targetId = (
        recorded.contractProductsLookup() as unknown as Envelope<
          Array<{ id: string }>
        >
      ).data[0]!.id;

      await key(wrapper, "ticket-product-input").setValue(targetId);
      await key(wrapper, "ticket-product-link").trigger("click");

      await vi.waitFor(
        () => expect(sent.subjectPuts.length).toBeGreaterThan(0),
        { timeout: SETTLE }
      );
      observed.stop();

      expect(
        (sent.subjectPuts[0] as { contract_product_id?: string })
          ?.contract_product_id
      ).toBe(targetId);
      expect(observed.count("/api/admin/")).toBe(0);
    },
    CASE
  );

  it(
    "AC-13 Unlink sends an EXPLICIT null, never an omitted key",
    async () => {
      const sent = installTicketsHandlers({
        oneBody: recorded.oneLinked(),
        ticketPutBody: recorded.unlinkedProduct()
      });
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await vi.waitFor(
        () =>
          expect(
            wrapper.find('[data-test-key="ticket-product-unlink"]').exists()
          ).toBe(true),
        { timeout: SETTLE }
      );
      await key(wrapper, "ticket-product-unlink").trigger("click");

      await vi.waitFor(
        () => expect(sent.subjectPuts.length).toBeGreaterThan(0),
        { timeout: SETTLE }
      );

      // An omitted key leaves the product linked; only the explicit null clears
      // it. `toHaveProperty` + `toBeNull` distinguishes the two; `?? null` does
      // not.
      const body = sent.subjectPuts[0] as Record<string, unknown>;
      expect(body).toHaveProperty("contract_product_id");
      expect(body.contract_product_id).toBeNull();
    },
    CASE
  );

  it(
    "refuses both product writes while the ticket is locked, sending nothing",
    async () => {
      const sent = installTicketsHandlers({ oneBody: lockedAndLinked() });
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await vi.waitFor(
        () =>
          expect(
            wrapper.find('[data-test-key="ticket-product-unlink"]').exists()
          ).toBe(true),
        { timeout: SETTLE }
      );

      // A product id IS typed, so the LOCK is the only thing left that can
      // refuse the link — without this the button is disabled for the empty
      // draft instead and the assertion passes on a page with no lock gate.
      const targetId = (
        recorded.contractProductsLookup() as unknown as Envelope<
          Array<{ id: string }>
        >
      ).data[0]!.id;
      await key(wrapper, "ticket-product-input").setValue(targetId);
      await wrapper.vm.$nextTick();

      const link = key(wrapper, "ticket-product-link");
      const unlink = key(wrapper, "ticket-product-unlink");
      expect(link.attributes("disabled")).toBeDefined();
      expect(unlink.attributes("disabled")).toBeDefined();

      await link.trigger("click");
      await unlink.trigger("click");
      await wrapper.vm.$nextTick();
      expect(sent.subjectPuts.length).toBe(0);
    },
    CASE
  );
});
