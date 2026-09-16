// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The client-ticket MANAGER page drives one ticket end to end
 * (FE-3226 7f54c97c7)
 *
 * ## Job To Be Done
 * Prove the self-drawing manager page does not merely render its controls but
 * DRIVES the real `useClientTicket` manager and asserts the outcome: the merged
 * thread shows the recorded messages; typing in the composer and sending posts
 * that reply on the wire; close fires the lifecycle transition on an open,
 * unlocked ticket and reopen fires it on a closed one; and the per-record meta
 * gates the controls — a LOCKED ticket cannot be closed or renamed. Every read
 * and write stays on the client path (`/api/…`, never `/api/admin/…`).
 *
 * ## What Breaks If These Fail
 * A client opens their ticket and the conversation is blank, their reply never
 * leaves the page, close/reopen do nothing, or a locked ticket is closed or
 * renamed anyway — the manager's whole remit, silently dead behind a page that
 * still renders every control.
 *
 * ## Provenance
 * Bodies are COMMITTED `tickets` / `session-store` captures replayed over MSW
 * (`pnpm fixtures:generate`); the reference, message body, and mutation paths
 * asserted are read off those recordings. The closed and locked states toggle
 * one documented wire field on the recorded ticket body, mirroring the module's
 * own recorded-reality oracle (`tickets.manager.int.test.ts`, AC-24/AC-25) —
 * staging captured no standalone locked/closed single-ticket read.
 *
 * ## NOT driven here — named page gaps, not defects
 * The page's own docblock names nine manager members it deliberately does not
 * draw (`editMessage`, `deleteMessage`, `deleteAttachment`, `downloadAttachment`,
 * `getMessage`, `uploadAttachment`, `loadAttachments`, `setRelatedProduct`,
 * `removeRelatedProduct`) — each needs a message- or file-level control the page
 * does not yet offer. They are out of scope here by design, not asserted absent.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RECORDED_TICKET_ID,
  installTicketsHandlers,
  mountTicketPage,
  observeRequests,
  recorded,
  seedClientSession,
  teardownSession,
  ticketBodyClosed,
  ticketBodyLocked,
  unmountTicketPage
} from "./client-ticket-page.harness";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const SETTLE = 10000;

const recordedReference = (
  recorded.one() as unknown as { data: { reference: string } }
).data.reference;

const recordedMessageBody = (
  recorded.messages() as unknown as { data: Array<{ body: string }> }
).data.find(message => !!message.body)!.body;

/** Waits for the loaded manager to reach the screen (reference rendered). */
async function shownReference(wrapper: VueWrapper): Promise<void> {
  await vi.waitFor(
    () =>
      expect(
        wrapper.find('[data-test-key="ticket-reference"]').exists()
      ).toBe(true),
    { timeout: SETTLE }
  );
}

// -----------------------------------------------------------------------------

describe("the client-ticket manager page, driven by the client who owns the ticket", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  it(
    "shows the ticket's own reference and renders its recorded thread",
    async () => {
      installTicketsHandlers();
      const wrapper = await mountTicketPage();
      await shownReference(wrapper);

      expect(wrapper.find('[data-test-key="ticket-reference"]').text()).toBe(
        recordedReference
      );

      await vi.waitFor(
        () =>
          expect(
            wrapper.find('[data-test-key="ticket-thread-entry"]').exists()
          ).toBe(true),
        { timeout: SETTLE }
      );
      expect(wrapper.text()).toContain(recordedMessageBody);
    },
    20000
  );

  it(
    "sends the reply this client typed, on the client path",
    async () => {
      const sent = installTicketsHandlers();
      const observed = observeRequests();
      const wrapper = await mountTicketPage();
      await shownReference(wrapper);

      const send = wrapper.find('[data-test-key="ticket-reply-send"]');
      await wrapper.find("textarea").setValue("A recorded-bench reply");
      await wrapper.vm.$nextTick();
      expect(send.attributes("disabled")).toBeUndefined();

      await send.trigger("click");
      await vi.waitFor(() => expect(sent.replies.length).toBeGreaterThan(0), {
        timeout: SETTLE
      });
      observed.stop();

      expect(JSON.stringify(sent.replies[0])).toContain("A recorded-bench reply");
      expect(observed.count("/api/admin/")).toBe(0);
      expect(
        observed.count(`/api/tickets/${RECORDED_TICKET_ID}/replies`)
      ).toBeGreaterThan(0);
    },
    20000
  );

  it(
    "fires the status transition when the client closes an open, unlocked ticket",
    async () => {
      const sent = installTicketsHandlers();
      const observed = observeRequests();
      const wrapper = await mountTicketPage();
      await shownReference(wrapper);

      const close = wrapper.find('[data-test-key="ticket-close"]');
      expect(close.exists()).toBe(true);
      expect(close.attributes("disabled")).toBeUndefined();

      await close.trigger("click");
      await vi.waitFor(() => expect(sent.statusPuts.length).toBeGreaterThan(0), {
        timeout: SETTLE
      });
      observed.stop();

      expect(sent.statusPuts[0]?.url).toContain(
        `/api/tickets/${RECORDED_TICKET_ID}/status`
      );
      expect(observed.count("/api/admin/")).toBe(0);
    },
    20000
  );

  it(
    "offers reopen on a closed ticket and fires the status transition",
    async () => {
      const sent = installTicketsHandlers({
        oneBody: ticketBodyClosed(),
        statusBody: recorded.reopenedStatus()
      });
      const wrapper = await mountTicketPage();
      await shownReference(wrapper);

      await vi.waitFor(
        () =>
          expect(
            wrapper.find('[data-test-key="ticket-reopen"]').exists()
          ).toBe(true),
        { timeout: SETTLE }
      );
      expect(wrapper.find('[data-test-key="ticket-close"]').exists()).toBe(
        false
      );

      await wrapper.find('[data-test-key="ticket-reopen"]').trigger("click");
      await vi.waitFor(() => expect(sent.statusPuts.length).toBeGreaterThan(0), {
        timeout: SETTLE
      });

      expect(sent.statusPuts[0]?.url).toContain(
        `/api/tickets/${RECORDED_TICKET_ID}/status`
      );
    },
    20000
  );

  it(
    "disables close and subject-save when the ticket is locked",
    async () => {
      const sent = installTicketsHandlers({ oneBody: ticketBodyLocked() });
      const wrapper = await mountTicketPage();
      await shownReference(wrapper);

      const close = wrapper.find('[data-test-key="ticket-close"]');
      const subjectSave = wrapper.find('[data-test-key="ticket-subject-save"]');

      expect(close.exists()).toBe(true);
      expect(close.attributes("disabled")).toBeDefined();
      expect(subjectSave.attributes("disabled")).toBeDefined();

      await close.trigger("click");
      await wrapper.vm.$nextTick();
      expect(sent.statusPuts.length).toBe(0);
    },
    20000
  );
});
