import { nextTick, watch } from "vue";
import { TicketStatusCodes } from "@upmind-automation/types";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { mergeFeed } from "./tickets.mappers";
import {
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes
} from "../../utils";
import { findLast, isEmpty } from "lodash-es";
import type {
  Ticket,
  TicketAttachmentRef,
  TicketFeedState,
  TicketItemQuery,
  TicketMessage,
  TicketsServices
} from "./tickets.types";
import type { UseTicketInternals } from "./useTicket.internals";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useTicket.actions
 * @description The manager's writes (guard → request → targeted
 * invalidation → settled result, `design.md` § "The mutation idiom"), the
 * merged feed's paging, and the poll controls. Twelve shared members —
 * AC26 reschedule and AC28 change-department ship NEITHER, ever (R5).
 * @doctrine clause 2 (fresh modules start armless) — shared members only.
 */
export function createTicketActions(
  _actorScope: ScopeActorTypes,
  service: TicketsServices,
  query: TicketItemQuery,
  feed: TicketFeedState,
  internals: UseTicketInternals,
  ticketId: string | undefined,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  function requireTicketId(): string {
    if (!ticketId) {
      throw new DetailedError(
        "No ticket id resolved for this scope",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      );
    }
    return ticketId;
  }

  function ticket(): Ticket | undefined {
    return query.data.value;
  }

  function invalidateTicket(): Promise<unknown> {
    return invalidateQueryByKey([...service.queryKey, "ticket", ticketId], {
      exact: false
    })(undefined);
  }

  // ---------------------------------------------------------------------------
  // Readiness / refresh — mirrors the collection's addressability pattern.

  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);
    return new Promise<boolean>(resolve => {
      const stop = watch(
        [service.isAvailable, isSessionInitialised, isSessionSettling],
        () => {
          const outcome = addressableOutcome();
          if (outcome === undefined) return;
          stop();
          resolve(outcome);
        }
      );
    });
  }

  async function whenFetched(): Promise<boolean> {
    await nextTick();
    if (query.isFetched.value) return true;
    return new Promise<boolean>(resolve => {
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(true);
      });
    });
  }

  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;
    const fetched = await whenFetched();
    // A ticket IS its conversation: a read that settles without the thread
    // hands a single-read overlay an empty feed, so the first page loads here.
    if (fetched && isEmpty(feed.entries.value)) await loadFeed();
    return fetched;
  }

  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();
    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  // ---------------------------------------------------------------------------
  // Feed paging (AC14/AC15) — a merged view over messages + status logs,
  // paged in lock-step on the SAME message-id cursor.

  async function loadFeed(
    options: {
      before?: string;
      after?: string;
      attachmentsOnly?: boolean;
    } = {}
  ): Promise<void> {
    const id = requireTicketId();
    feed.isLoading.value = true;
    return Promise.all([
      service.loadMessages(id, options),
      options.attachmentsOnly ? Promise.resolve([]) : service.loadStatusLogs(id)
    ])
      .then(([{ rows, hasMore }, logs]) => {
        feed.entries.value = mergeFeed(rows, logs);
        if (options.before) feed.hasOlder.value = hasMore;
        else if (options.after) feed.hasNewer.value = hasMore;
        else {
          feed.hasOlder.value = hasMore;
          feed.hasNewer.value = false;
        }
      })
      .finally(() => {
        feed.isLoading.value = false;
      });
  }

  /**
   * AC15 — loads older messages (`filter[id|lt]` the OLDEST held id).
   *
   * The feed is `desc` by `created_at`, so the oldest message is the LAST
   * entry, not the first. The two cursors were swapped: `loadOlder` asked for
   * messages older than the NEWEST held id and `loadNewer` for messages newer
   * than the OLDEST — each re-reading the thread it already held instead of
   * paging past it.
   */
  async function loadOlder(): Promise<void> {
    const oldest = findLast(
      feed.entries.value,
      entry => entry.kind === "message"
    )?.message.id;
    await loadFeed({ before: oldest });
  }

  /** AC15 — loads newer messages (`filter[id|gt]` the NEWEST held id, the FIRST entry). */
  async function loadNewer(): Promise<void> {
    const newest = feed.entries.value.find(entry => entry.kind === "message")
      ?.message.id;
    await loadFeed({ after: newest });
  }

  /** AC15 — the attachments-only view. A DIFFERENT request, never a client-side filter. */
  async function loadAttachments(): Promise<void> {
    await loadFeed({ attachmentsOnly: true });
  }

  /** AC16 — re-reads one message and replaces its row in the feed in place. */
  async function getMessage(messageId: string): Promise<TicketMessage> {
    const id = requireTicketId();
    const message = await service.loadMessage(id, messageId);
    feed.entries.value = feed.entries.value.map(entry =>
      entry.kind === "message" && entry.message.id === messageId
        ? { kind: "message" as const, message }
        : entry
    );
    return message;
  }

  // ---------------------------------------------------------------------------
  // Writes — guard (per-record) → request → targeted invalidation → result.
  // AC26 reschedule and AC28 change-department ship NEITHER, ever (R5).

  /**
   * AC17 — a `409 ticket_has_more_recent_reply` resolves as a caution: the
   * service already returns `undefined` rather than throwing
   * (`tickets.services.ts`); this refetches the thread forward instead of
   * surfacing an error. A successful reply also refreshes the ticket, since
   * status may have moved server-side.
   */
  async function reply(
    body: string,
    options: { isPrivate?: boolean; files?: TicketAttachmentRef[] } = {}
  ): Promise<TicketMessage | undefined> {
    const id = requireTicketId();
    // AC-17's stale-reply guard wants the NEWEST message, and `mergeFeed`
    // emits the feed `desc` by `created_at` — so the newest is the FIRST
    // entry. Reversing first handed the server the OLDEST message, which IS
    // the "a newer reply exists" condition: every reply on a thread with more
    // than one message came back 409 `ticket_has_more_recent_reply`.
    const lastMessage = feed.entries.value.find(
      entry => entry.kind === "message"
    )?.message;

    const result = await service.postReply(id, {
      body,
      is_private: !!options.isPrivate,
      last_message_id: lastMessage?.id,
      files: options.files
    });

    if (result === undefined) {
      await loadNewer();
      return undefined;
    }

    await Promise.all([refresh(), loadFeed()]);
    return result;
  }

  /** AC18 — refused (no request) when the message's `can_manage` is false. */
  async function editMessage(
    messageId: string,
    body: string
  ): Promise<TicketMessage> {
    const id = requireTicketId();
    const message = feed.entries.value.find(
      entry => entry.kind === "message" && entry.message.id === messageId
    );
    if (message?.kind === "message" && !message.message.can_manage) {
      throw new DetailedError(
        "This message cannot be edited",
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      );
    }

    const updated = await service.editReply(id, messageId, {
      body,
      is_private:
        message?.kind === "message" ? message.message.is_private : false
    });
    await loadFeed();
    return updated;
  }

  /** AC19 — refused (no request) when the message's `can_manage` is false. */
  async function deleteMessage(
    messageId: string,
    reason: string
  ): Promise<void> {
    const id = requireTicketId();
    const message = feed.entries.value.find(
      entry => entry.kind === "message" && entry.message.id === messageId
    );
    if (message?.kind === "message" && !message.message.can_manage) {
      throw new DetailedError(
        "This message cannot be withdrawn",
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      );
    }

    await service.deleteMessage(id, messageId, reason);
    await loadFeed();
  }

  /** AC21 — removes one attachment from a message. */
  async function deleteAttachment(
    messageId: string,
    fileId: string
  ): Promise<void> {
    const id = requireTicketId();
    await service.deleteFile(id, messageId, fileId);
    await loadFeed();
  }

  /** AC20 — returns the raw attachment bytes, un-mapped. */
  async function downloadAttachment(fileId: string): Promise<ArrayBuffer> {
    return service.downloadFile(fileId);
  }

  /** AC23 — uploads a file, returning the ref `reply`'s `files` option consumes. */
  async function uploadAttachment(file: File): Promise<TicketAttachmentRef> {
    return service.uploadFile(file);
  }

  /** AC24 — refused (no request) when `settings.lock` is true. */
  async function close(): Promise<Ticket> {
    if (ticket()?.settings?.lock) {
      throw new DetailedError(
        "This ticket is locked",
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      );
    }
    const id = requireTicketId();
    const result = await service.setStatus(id, TicketStatusCodes.CLOSED);
    await invalidateTicket();
    return result;
  }

  /** AC25 — offered only when the ticket is closed. */
  async function reopen(): Promise<Ticket> {
    if (ticket()?.status?.code !== TicketStatusCodes.CLOSED) {
      throw new DetailedError(
        "This ticket is not closed",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      );
    }
    const id = requireTicketId();
    const result = await service.setStatus(id, TicketStatusCodes.OPEN);
    await invalidateTicket();
    return result;
  }

  /** AC27 — refused (no request) when `settings.lock` is true. */
  async function setSubject(subject: string): Promise<Ticket> {
    if (ticket()?.settings?.lock) {
      throw new DetailedError(
        "This ticket is locked",
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      );
    }
    const id = requireTicketId();
    const result = await service.updateTicket(id, { subject });
    await invalidateTicket();
    return result;
  }

  /** AC13 — link or change the related product; the same write either way. */
  async function setRelatedProduct(contractProductId: string): Promise<Ticket> {
    const id = requireTicketId();
    const result = await service.updateTicket(id, {
      contract_product_id: contractProductId
    });
    await invalidateTicket();
    return result;
  }

  /** AC13 — unlinks with an EXPLICIT null, never an omitted key. */
  async function removeRelatedProduct(): Promise<Ticket> {
    const id = requireTicketId();
    const result = await service.updateTicket(id, {
      contract_product_id: null
    });
    await invalidateTicket();
    return result;
  }

  function destroy(): void {
    internals.teardown();
    removeFromRegistry(scopeKey);
  }

  return {
    /** AC24 — close, refused when locked. */
    close,

    /** AC21 — removes an attachment. */
    deleteAttachment,

    /** AC19 — withdraws a message with a reason, refused when not owned. */
    deleteMessage,

    /** Destroys this scoped instance — disarms the poll, removes the registry entry. */
    destroy,

    /** AC20 — downloads a file's raw bytes. */
    downloadAttachment,

    /** AC18 — corrects a message, refused when not owned. */
    editMessage,

    /** AC16 — re-reads one message and replaces it in the feed. */
    getMessage,

    /** Marks the shared ticket cache key stale so the next read refetches. */
    invalidate: invalidateTicket,

    /**
     * Drops this ticket's cached rows so the next read starts from loading.
     *
     * `reset`, never `invalidate`: the latter KEEPS the rows, so a forced
     * `loading` redraws the data it already had and a forced failure draws its
     * error above rows the read never returned. The labs force handle calls
     * this by name — without it, arming a forced state swapped the transport
     * while the page kept its answers, and the console said so every boot.
     */
    reset: resetQueryByKey([...service.queryKey, "ticket", ticketId]),

    /** Resolves true when the manager is ready to read. Always settles. */
    isReady,

    /** AC15 — loads the attachments-only view (a different request). */
    loadAttachments,

    /** AC15 — loads older messages. */
    loadOlder,

    /** AC15 — loads newer messages. */
    loadNewer,

    /** AC17 — replies; a 409 resolves as a caution, never an error. */
    reply,

    /** AC25 — reopen, offered only on a closed ticket. */
    reopen,

    /** Refetches the ticket from the server; rejects if it cannot address one. */
    refresh,

    /** AC13 — unlinks the related product with an explicit null. */
    removeRelatedProduct,

    /** AC13 — links or changes the related product. */
    setRelatedProduct,

    /** AC27 — renames the subject, refused when locked. */
    setSubject,

    /** AC23 — uploads a file, returning the ref `reply`'s `files` option consumes. */
    uploadAttachment
  };
}

// Type export for consumers
export type UseTicketActions = ReturnType<typeof createTicketActions>;
