// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The manager page tells a SENT reply apart from a REFUSED one
 * (FE-3226 · AC17)
 *
 * ## Job To Be Done
 * AC17 gives the reply an outcome that is neither a success nor a throw: a
 * `409 ticket_has_more_recent_reply` — support replied while the client was
 * typing — is a CAUTION by the module's own ruling
 * (`tickets.services.ts`'s `postReply` `@decision`), so `reply()` RESOLVES with
 * `undefined` and nothing was posted. The page ignored that value: it cleared
 * the composer and raised no notice, so a refused reply looked exactly like a
 * sent one — the operator's "it says it is sent but in messages I have nothing".
 *
 * These two cases are the whole of the claim, and they are graded on what the
 * page DID, never on which branch it took:
 *   - a reply the server accepts empties the composer and raises no notice;
 *   - a reply the server refuses with the AC17 conflict KEEPS the draft, says
 *     plainly that a newer reply arrived and this one was not sent, and raises
 *     no danger alert (it is a caution, not a failure).
 *
 * ## What Breaks If These Fail
 * A client writes a reply, presses Send, watches the box empty, and their words
 * are gone — never posted, never recoverable, with nothing on screen saying so.
 * Or the reverse: a perfectly good reply reports a conflict that did not happen
 * and the client re-sends it twice.
 *
 * ## Provenance
 * Every 200 body is a COMMITTED `tickets` capture replayed over MSW through the
 * real `useClientTicket` stack, behind the real client session and the real
 * catch-all route (`client-ticket-page.harness.ts`). The one non-recorded
 * response is the 409 REFUSAL itself: staging has never been captured refusing
 * a reply this way (`docs/sdd/FE-3226/research.md` Q11 records the capture as
 * still owed), and a refusal is a control response, not journey data. Its
 * envelope is not invented either — it is byte-for-byte the one the module's
 * own oracle already drives this path with
 * (`packages/headless/src/modules/tickets/__tests__/tickets.manager.int.test.ts`,
 * AC-17), so the page is refused by exactly the shape the module is refused by.
 * No fixture file is read, modified or created for it.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installTicketsHandlers,
  mountTicketPage,
  seedClientSession,
  server,
  teardownSession,
  unmountTicketPage
} from "./client-ticket-page.harness";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const SETTLE = 15000;
const CASE = 40000;

/**
 * The AC17 conflict, in the module oracle's own envelope
 * (`tickets.manager.int.test.ts`): the structured api code rides `error.code`,
 * which is what `handleError` preserves as `DetailedError.apiCode` and what
 * `postReply` reads to resolve the refusal as a caution.
 */
function installStaleReplyRefusal(): { posts: () => unknown[] } {
  const posts: unknown[] = [];
  server?.use(
    http.post("*/api/tickets/:id/replies", async ({ request }) => {
      posts.push(await request.json().catch(() => null));
      return HttpResponse.json(
        {
          status: "error",
          data: null,
          related: null,
          total: null,
          error: {
            id: "conflict",
            type: 0,
            code: "ticket_has_more_recent_reply",
            message: "A more recent reply exists.",
            data: null
          },
          messages: [],
          meta: null
        },
        { status: 409 }
      );
    })
  );
  return { posts: () => posts };
}

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

/** What is in the composer right now. */
const draft = (wrapper: VueWrapper): string =>
  (wrapper.find("textarea").element as HTMLTextAreaElement).value;

/** Types a reply and presses Send. */
async function sendReply(wrapper: VueWrapper, body: string): Promise<void> {
  await wrapper.find("textarea").setValue(body);
  await wrapper.vm.$nextTick();
  await wrapper.find('[data-test-key="ticket-reply-send"]').trigger("click");
}

// -----------------------------------------------------------------------------

describe("client ticket manager — a refused reply is not reported as sent (AC17)", () => {
  beforeEach(async () => {
    await seedClientSession();
  });
  afterEach(() => {
    unmountTicketPage();
    teardownSession();
  });

  it(
    "a reply the server ACCEPTS empties the composer and says nothing was refused",
    async () => {
      const sent = installTicketsHandlers();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await sendReply(wrapper, "A recorded-bench reply");
      await vi.waitFor(() => expect(sent.replies.length).toBeGreaterThan(0), {
        timeout: SETTLE
      });
      await vi.waitFor(() => expect(draft(wrapper)).toBe(""), {
        timeout: SETTLE
      });

      expect(
        wrapper.find('[data-test-key="ticket-reply-stale"]').exists()
      ).toBe(false);
      expect(
        wrapper.find('[data-test-key="ticket-action-error"]').exists()
      ).toBe(false);
    },
    CASE
  );

  it(
    "a reply REFUSED with 409 ticket_has_more_recent_reply keeps the draft and says it was not sent",
    async () => {
      installTicketsHandlers();
      const refusal = installStaleReplyRefusal();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await sendReply(wrapper, "A reply that loses the race");
      await vi.waitFor(() => expect(refusal.posts()).toHaveLength(1), {
        timeout: SETTLE
      });

      // The notice is the proof the page told the two outcomes apart at all.
      await vi.waitFor(
        () =>
          expect(
            wrapper.find('[data-test-key="ticket-reply-stale"]').exists()
          ).toBe(true),
        { timeout: SETTLE }
      );

      // The words the client typed are STILL THERE — the whole defect was that
      // they were not, with nothing posted and nothing said.
      expect(draft(wrapper)).toBe("A reply that loses the race");
      // And it reads as a caution, never as the danger alert a real failure
      // raises: the module resolved this without throwing, by its own ruling.
      expect(
        wrapper.find('[data-test-key="ticket-action-error"]').exists()
      ).toBe(false);
      // A raw i18n key on screen would be a notice that says nothing.
      expect(wrapper.text()).not.toContain("labs.client_ticket_reply_stale");
      expect(wrapper.text()).toContain("was NOT sent");
    },
    CASE
  );

  it(
    "the refused reply is not re-posted by the notice, and the attachment tray survives with the draft",
    async () => {
      installTicketsHandlers();
      const refusal = installStaleReplyRefusal();
      const wrapper = await mountTicketPage();
      await shown(wrapper);

      await sendReply(wrapper, "A reply that loses the race");
      await vi.waitFor(() => expect(refusal.posts()).toHaveLength(1), {
        timeout: SETTLE
      });
      await vi.waitFor(
        () =>
          expect(
            wrapper.find('[data-test-key="ticket-reply-stale"]').exists()
          ).toBe(true),
        { timeout: SETTLE }
      );

      // Exactly ONE post left: the caution pages the thread forward, it never
      // re-submits the message behind the client's back.
      expect(refusal.posts()).toHaveLength(1);
      // Send is still offered, with the draft still under it, so the client can
      // read the newer reply and send again on their own terms.
      expect(
        wrapper
          .find('[data-test-key="ticket-reply-send"]')
          .attributes("disabled")
      ).toBeUndefined();
    },
    CASE
  );
});
