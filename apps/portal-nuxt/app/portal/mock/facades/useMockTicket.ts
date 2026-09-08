// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockTicket
 * @description ONE support ticket, managed — the mock stand-in for the
 * `useClientTicket` manager `contracts/client-tickets.ts` hands to the
 * factory: the reply composer, legacy's manage-ticket actions (reopen, close,
 * rename, detach the related product, share it with a delegate) and the
 * guards that decide which of them a ticket can honestly take. Beside it,
 * `useMockTickets` — the COLLECTION's own stand-in, which opens a thread.
 *
 * Each guard is asked BEFORE the confirmation is offered (plan R4), so a
 * ticket past that point is refused outright rather than behind a dialog
 * whose own accept then refuses.
 */

import {
  DelegateObjectTypes,
  TicketStatusCodes
} from "@upmind-automation/types";
import { parseAttachmentNames } from "../contracts/client-tickets.schemas";
import { nextId } from "../store";
import {
  defineMockFacade,
  MOCK_RECEIPT_REASON,
  mockId,
  submittedText
} from "./facade";
import {
  assign,
  filter,
  find,
  first,
  includes,
  map,
  max,
  replace,
  toNumber,
  trim
} from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type {
  TicketMessageModel,
  TicketReplyModel
} from "../contracts/client-tickets";
import type {
  MockDataset,
  MockDelegate,
  MockTicket,
  MockTicketMessage
} from "../types";
import type { FormModel } from "@upmind/ui";

/** Whether the thread is finished — the composer and the close control both read it. */
export function isTicketClosed(ticket: MockTicket): boolean {
  return ticket.status === TicketStatusCodes.CLOSED;
}

/** Whether the desk has locked the thread against client-side changes. */
export function isTicketLocked(ticket: MockTicket): boolean {
  return ticket.locked === true;
}

/** Whether this ticket can be closed from here — legacy hid the control otherwise. */
export function canCloseTicket(ticket: MockTicket): boolean {
  return !isTicketClosed(ticket) && !isTicketLocked(ticket);
}

/**
 * Whether this thread may be renamed. ONE rule, and every reader defers to it
 * (the menu that offers the control, the form the dialog builds, and the
 * write itself): a finished thread and a thread the desk has locked both keep
 * the name they have.
 */
export function canRenameTicket(ticket: MockTicket): boolean {
  return !isTicketClosed(ticket) && !isTicketLocked(ticket);
}

/**
 * Whether this thread still takes replies — legacy's `ticketMessageForm`,
 * which withheld the box on a finished thread and refused the post while the
 * desk had the thread locked. ONE rule, and the write defers to it.
 */
export function canReplyToTicket(ticket: MockTicket): boolean {
  return !isTicketClosed(ticket) && !isTicketLocked(ticket);
}

/** Whether this ticket can be shared with somebody — an open, unshared one. */
export function canDelegateTicket(ticket: MockTicket): boolean {
  return !isTicketClosed(ticket) && ticket.isDelegated !== true;
}

/** Whether the related product can be detached — a locked ticket keeps what it names. */
export function canDetachTicketProduct(ticket: MockTicket): boolean {
  return ticket.productId !== undefined && !isTicketLocked(ticket);
}

/**
 * Whether the product this thread is about may be set or changed — legacy
 * showed `add_related_product` and `change_related_product` on an open thread
 * and disabled both while the desk had it locked. ONE rule for both labels:
 * which of the two a control reads as is `hasTicketProduct` below.
 */
export function canSetTicketProduct(ticket: MockTicket): boolean {
  return !isTicketClosed(ticket) && !isTicketLocked(ticket);
}

/** Whether this thread already names a product — legacy's `hasRelatedProduct`. */
export function hasTicketProduct(ticket: MockTicket): boolean {
  return ticket.productId !== undefined;
}

/**
 * Whether this message is the persona's own. Legacy read `data.can_manage`
 * per message for a client actor (`ticketMessages.vue:196-199`, the non-admin
 * arm of `isEditable`/`isDeletable`); the mock's stand-in for that wire flag
 * is authorship, because a client may only ever manage what they wrote.
 */
export function isOwnTicketMessage(message: MockTicketMessage): boolean {
  return message.authorType === "client";
}

/** Whether the client withdrew this message — legacy's `message.isDeleted`. */
export function isTicketMessageDeleted(message: MockTicketMessage): boolean {
  return message.isDeleted === true;
}

/**
 * Whether this message still takes the row menu at all — legacy's own gate on
 * it (`ticketMessage.vue:12-17`): the thread open, the message not withdrawn,
 * and the message the client's to manage. The desk's lock is the mock's
 * addition, and it is the same lock every other client-side write on the
 * thread already defers to.
 */
export function canManageTicketMessage(
  ticket: MockTicket,
  message: MockTicketMessage
): boolean {
  return (
    !isTicketClosed(ticket) &&
    !isTicketLocked(ticket) &&
    !isTicketMessageDeleted(message) &&
    isOwnTicketMessage(message)
  );
}

export const useMockTicket = defineMockFacade(
  (data, ticketId): MockTicket | undefined =>
    find(data.tickets, { id: ticketId }),
  (data, ticketId) => {
    function ticket(): MockTicket | undefined {
      return find(data.tickets, { id: ticketId });
    }

    /** One refusal over the addressed ticket, or undefined when the test passes. */
    function guard(
      allowed: (subject: MockTicket) => boolean,
      reason: MockActionReceipt<MockTicket>["reason"]
    ): MockActionReceipt<MockTicket> | undefined {
      const subject = ticket();
      if (subject === undefined) return undefined;
      if (allowed(subject)) return undefined;
      return { ok: false, reason, entity: subject };
    }

    function stamp(
      subject: MockTicket,
      changes: Partial<MockTicket> = {}
    ): void {
      const moved =
        changes.status !== undefined && changes.status !== subject.status;
      const at = new Date().toISOString();
      assign(subject, changes, { updatedAt: at });
      // Every write that MOVES the standing leaves an entry behind — the
      // thread interleaves them with the messages, so a client reads what
      // happened to it beside what was said (`ticketFeedProvider.vue:228-249`).
      // CREATION writes none: a thread is BORN in its status (a scheduled one
      // included), and it never changed into it.
      if (!moved || changes.status === undefined) return;
      const log = subject.statusLog ?? [];
      subject.statusLog = [
        ...log,
        { id: nextId("tsc"), status: changes.status, at }
      ];
    }

    /** Why this thread takes no reply — a finished one, or a locked one. */
    function whyNotReplyable(): MockActionReceipt<MockTicket> | undefined {
      const subject = ticket();
      if (subject === undefined) return undefined;
      if (isTicketClosed(subject)) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED,
          entity: subject
        };
      }
      return guard(canReplyToTicket, MOCK_RECEIPT_REASON.LOCKED);
    }

    /** Why this thread's product cannot be set — a finished one, or a locked one. */
    function whyNotProductSettable():
      | MockActionReceipt<MockTicket>
      | undefined {
      const subject = ticket();
      if (subject === undefined) return undefined;
      if (isTicketClosed(subject)) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED,
          entity: subject
        };
      }
      return guard(canSetTicketProduct, MOCK_RECEIPT_REASON.LOCKED);
    }

    /** Why this thread cannot be renamed — a finished one, or a locked one. */
    function whyNotRenamable(): MockActionReceipt<MockTicket> | undefined {
      const subject = ticket();
      if (subject === undefined) return undefined;
      if (isTicketClosed(subject)) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED,
          entity: subject
        };
      }
      return guard(canRenameTicket, MOCK_RECEIPT_REASON.LOCKED);
    }

    function message(messageId: string): MockTicketMessage | undefined {
      return find(ticket()?.messages, { id: messageId });
    }

    /**
     * A thread this account holds, addressed at a message it does not carry.
     * That is a KNOWN subject named wrongly, so it refuses out loud rather
     * than falling silent — a thread we do not hold at all is the quiet
     * `undefined` every other facade answers with.
     */
    function unknownMessage():
      | MockActionReceipt<MockTicketMessage>
      | undefined {
      if (ticket() === undefined) return undefined;
      return { ok: false, reason: MOCK_RECEIPT_REASON.NOT_FOUND };
    }

    /**
     * Why this message is not the client's to change — legacy's own four
     * conditions on the row menu (`ticketMessage.vue:12-17`), in the order it
     * read them, so the menu that offers a control and the write that takes it
     * refuse for the same stated reason. Edit and delete share every one of
     * them: legacy drew both entries behind the same gate.
     */
    function whyNotManageable(
      messageId: string
    ): MockActionReceipt<MockTicketMessage> | undefined {
      const subject = ticket();
      const written = message(messageId);
      if (subject === undefined || written === undefined) {
        return unknownMessage();
      }
      if (isTicketClosed(subject)) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED,
          entity: written
        };
      }
      if (isTicketLocked(subject)) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.LOCKED,
          entity: written
        };
      }
      if (isTicketMessageDeleted(written)) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.ALREADY_DELETED,
          entity: written
        };
      }
      if (!isOwnTicketMessage(written)) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.NOT_PERMITTED,
          entity: written
        };
      }
      return undefined;
    }

    return {
      /**
       * Appends the persona's message and moves the thread's timestamp. The
       * files ride as NAMES (plan F9), exactly as the opening message's do —
       * nothing is uploaded either way.
       */
      reply: (
        model: TicketReplyModel
      ): MockActionReceipt<MockTicketMessage> | undefined => {
        const subject = ticket();
        if (subject === undefined) return undefined;
        // Asked BEFORE anything is appended (plan R4): the composer's own
        // `visible` hides the box on a finished thread, but a dispatched verb
        // reaches this write whatever the page drew, and a locked thread
        // keeps the conversation it has.
        const refusal = whyNotReplyable();
        if (refusal !== undefined) {
          return {
            ok: false,
            reason: refusal.reason,
            entity: undefined
          };
        }

        const message: MockTicketMessage = {
          id: nextId("msg"),
          author: data.persona.name,
          authorType: "client",
          sentAt: new Date().toISOString(),
          body: model.body,
          attachments: model.attachments
        };
        subject.messages.push(message);
        assign(subject, { updatedAt: message.sentAt });
        return { ok: true, entity: message };
      },

      /** Why this thread takes no reply — the guard the write itself asks. */
      whyNotReplyable,

      /** Why this message cannot be rewritten — the guard the write itself asks. */
      whyNotEditable: whyNotManageable,

      /** Why this message cannot be withdrawn — legacy drew both entries behind one gate. */
      whyNotDeletable: whyNotManageable,

      /**
       * Rewrites one of the client's own messages — legacy's inline editor,
       * whose save posted `replyUpdate` with the new body. The stamp is what
       * legacy read as `hasBeenEdited` (`created_at !== updated_at`), kept as
       * its own member here because the mock's messages carry no updated
       * timestamp to compare against.
       */
      editMessage: (
        messageId: string,
        model: TicketMessageModel
      ): MockActionReceipt<MockTicketMessage> | undefined => {
        const thread = ticket();
        const written = message(messageId);
        if (thread === undefined || written === undefined) {
          return unknownMessage();
        }
        const refusal = whyNotManageable(messageId);
        if (refusal !== undefined) return refusal;
        const body = trim(model.body);
        if (body === "") {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.EMPTY_MESSAGE,
            entity: written
          };
        }
        assign(written, { body, editedAt: new Date().toISOString() });
        stamp(thread);
        return { ok: true, entity: written };
      },

      /**
       * Withdraws one of the client's own messages. What it said is KEPT:
       * legacy's notice offered "View deleted message" to every actor
       * (`ticketMessage.vue:96-105`, outside the `isAdmin` branch above it),
       * so the body has to survive the delete for the link to have anything
       * to open.
       */
      deleteMessage: (
        messageId: string
      ): MockActionReceipt<MockTicketMessage> | undefined => {
        const thread = ticket();
        const written = message(messageId);
        if (thread === undefined || written === undefined) {
          return unknownMessage();
        }
        const refusal = whyNotManageable(messageId);
        if (refusal !== undefined) return refusal;
        assign(written, { isDeleted: true });
        stamp(thread);
        return { ok: true, entity: written };
      },

      /**
       * Why one named file cannot be taken off a message — everything that
       * refuses the message itself, and then a name it does not carry.
       */
      whyNotAttachmentRemovable: (
        messageId: string,
        name: string
      ): MockActionReceipt<MockTicketMessage> | undefined => {
        const refusal = whyNotManageable(messageId);
        if (refusal !== undefined) return refusal;
        const written = message(messageId);
        if (written === undefined) return unknownMessage();
        if (!includes(written.attachments, name)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.NOT_FOUND,
            entity: written
          };
        }
        return undefined;
      },

      /**
       * Takes one named file off a message — legacy's per-file delete
       * (`ticketMessageFiles.vue:8`), which ran behind the same
       * manage-the-message gate the row menu did.
       */
      deleteAttachment: (
        messageId: string,
        name: string
      ): MockActionReceipt<MockTicketMessage> | undefined => {
        const thread = ticket();
        const written = message(messageId);
        if (thread === undefined || written === undefined) {
          return unknownMessage();
        }
        const refusal = whyNotManageable(messageId);
        if (refusal !== undefined) return refusal;
        if (!includes(written.attachments, name)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.NOT_FOUND,
            entity: written
          };
        }
        assign(written, {
          attachments: filter(written.attachments, held => held !== name)
        });
        stamp(thread);
        return { ok: true, entity: written };
      },

      /** Why this ticket cannot be reopened — one that never closed has nothing to reopen. */
      whyNotReopenable: (): MockActionReceipt<MockTicket> | undefined =>
        guard(isTicketClosed, MOCK_RECEIPT_REASON.NOT_CLOSED),

      /** Reopens a closed thread — legacy's own control on a finished ticket. */
      reopen: (): MockActionReceipt<MockTicket> | undefined => {
        const subject = ticket();
        if (subject === undefined) return undefined;
        if (!isTicketClosed(subject)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.NOT_CLOSED,
            entity: subject
          };
        }
        stamp(subject, {
          status: TicketStatusCodes.OPEN,
          closedAt: undefined
        });
        return { ok: true, entity: subject };
      },

      /** Why this ticket cannot be closed — one already closed, or locked by the desk. */
      whyNotClosable: (): MockActionReceipt<MockTicket> | undefined => {
        const subject = ticket();
        if (subject === undefined) return undefined;
        if (isTicketClosed(subject)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED,
            entity: subject
          };
        }
        return guard(canCloseTicket, MOCK_RECEIPT_REASON.LOCKED);
      },

      /** Closes the thread, dating it as the desk would. */
      close: (): MockActionReceipt<MockTicket> | undefined => {
        const subject = ticket();
        if (subject === undefined) return undefined;
        if (isTicketClosed(subject)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED,
            entity: subject
          };
        }
        if (isTicketLocked(subject)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.LOCKED,
            entity: subject
          };
        }
        stamp(subject, {
          status: TicketStatusCodes.CLOSED,
          closedAt: new Date().toISOString()
        });
        return { ok: true, entity: subject };
      },

      /** Why the related product cannot be detached — none named, or a locked thread. */
      whyNotDetachable: (): MockActionReceipt<MockTicket> | undefined => {
        const subject = ticket();
        if (subject === undefined) return undefined;
        if (subject.productId === undefined) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.NO_RELATED_PRODUCT,
            entity: subject
          };
        }
        return guard(canDetachTicketProduct, MOCK_RECEIPT_REASON.LOCKED);
      },

      /** Detaches the product this ticket is about — the thread itself stays. */
      removeRelatedProduct: (): MockActionReceipt<MockTicket> | undefined => {
        const subject = ticket();
        if (subject === undefined) return undefined;
        if (subject.productId === undefined) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.NO_RELATED_PRODUCT,
            entity: subject
          };
        }
        if (isTicketLocked(subject)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.LOCKED,
            entity: subject
          };
        }
        stamp(subject, { productId: undefined });
        return { ok: true, entity: subject };
      },

      /** Why this ticket cannot be shared — a closed one, or one already shared. */
      whyNotDelegatable: (): MockActionReceipt<MockTicket> | undefined => {
        const subject = ticket();
        if (subject === undefined) return undefined;
        if (isTicketClosed(subject)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED,
            entity: subject
          };
        }
        return guard(canDelegateTicket, MOCK_RECEIPT_REASON.ALREADY_DELEGATED);
      },

      /**
       * Grants one delegate access to this thread. The grant is recorded on
       * the DELEGATE, where every other per-object grant lives, so the
       * delegate's own page reads the same fact this page wrote.
       */
      delegate: (
        delegateId: string
      ): MockActionReceipt<MockDelegate> | undefined => {
        const subject = ticket();
        const grantee = find(data.delegates, { id: delegateId });
        if (subject === undefined || grantee === undefined) return undefined;
        if (isTicketClosed(subject)) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.ALREADY_CLOSED,
            entity: grantee
          };
        }
        if (subject.isDelegated === true) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.ALREADY_DELEGATED,
            entity: grantee
          };
        }
        assign(grantee, {
          objects: [
            ...grantee.objects,
            { type: DelegateObjectTypes.TICKET, id: ticketId }
          ]
        });
        stamp(subject, { isDelegated: true });
        return { ok: true, entity: grantee };
      },

      /** Why the subject cannot be changed — a locked thread keeps its name. */
      whyNotRenamable,

      /**
       * Renames the thread — legacy's `changeTicketSubjectModal`. The refusal
       * is `whyNotRenamable`'s, asked here rather than restated, so the
       * control, the dialog and the write can never disagree.
       */
      setSubject: (
        subject: string
      ): MockActionReceipt<MockTicket> | undefined => {
        const thread = ticket();
        if (thread === undefined) return undefined;
        const refusal = whyNotRenamable();
        if (refusal !== undefined) return refusal;
        stamp(thread, { subject });
        return { ok: true, entity: thread };
      },

      /** Why the related product cannot be set — a finished thread, or a locked one. */
      whyNotProductSettable,

      /**
       * Points the thread at one of the client's products — legacy's
       * `openSelectProductModal`, whose success wrote `contract_product_id`.
       * The refusal is `whyNotProductSettable`'s, asked here rather than
       * restated; a product this account does not hold names nothing to point
       * at, so it is the standing not-found answer.
       */
      setRelatedProduct: (
        productId: string
      ): MockActionReceipt<MockTicket> | undefined => {
        const thread = ticket();
        if (thread === undefined) return undefined;
        const refusal = whyNotProductSettable();
        if (refusal !== undefined) return refusal;
        const held = find(data.products, { id: productId });
        if (held === undefined) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.NOT_FOUND,
            entity: thread
          };
        }
        stamp(thread, { productId: held.id });
        return { ok: true, entity: thread };
      }
    };
  }
);

/**
 * The next thread number the desk hands out — one past the highest on file,
 * so a created ticket reads beside the seeds rather than restarting at one.
 * An account with no threads starts the count.
 */
function nextReference(data: MockDataset): string {
  const held = map(data.tickets, ticket =>
    toNumber(replace(ticket.reference ?? "", "#", ""))
  );
  const highest = max(filter(held, Number.isFinite)) ?? 0;
  return `#${highest + 1}`;
}

/**
 * The desk a thread goes to. A brand publishing one desk takes every thread
 * on it, which is why the form asks nobody to choose it
 * (`client-tickets.schemas.ts`).
 */
function department(
  data: MockDataset,
  departmentId: string
): string | undefined {
  // A brand publishing one desk takes every thread on it, so an EMPTY id is
  // the form leaving the choice unasked. An id the brand does not publish is
  // a different thing — it names no desk, and the write refuses.
  if (departmentId === "") return first(data.departments)?.name;
  return find(data.departments, { id: departmentId })?.name;
}

/**
 * The ticket COLLECTION, managed — the mock stand-in for `useClientTickets`
 * (`contracts/client-tickets.ts`). Opening a thread is a collection write, as
 * adding an email is (`useMockContacts`): there is no per-ticket scope to
 * carry a ticket that does not exist yet.
 */
export const useMockTickets = defineMockFacade(
  (data): readonly MockTicket[] => data.tickets,
  data => ({
    /**
     * Opens a thread: OPEN, referenced, and carrying the client's own first
     * message. Attachments are recorded by NAME (plan F9) — nothing is
     * uploaded, and the desk sees the list the client typed.
     */
    create: (model: FormModel): MockActionReceipt<MockTicket> | undefined => {
      const desk = department(data, submittedText(model, "departmentId"));
      if (desk === undefined) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.NO_DEPARTMENT };
      }

      const raised = new Date().toISOString();
      const booked = bookedOpening(data, model);
      const isBookedInPast = booked !== undefined && !isFutureMoment(booked);
      if (isBookedInPast) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.SCHEDULE_NOT_FUTURE };
      }
      let status = TicketStatusCodes.OPEN;
      if (booked !== undefined) status = TicketStatusCodes.SCHEDULED;

      const attachments = parseAttachmentNames(
        submittedText(model, "attachments")
      );
      const message: MockTicketMessage = {
        id: nextId("msg"),
        author: data.persona.name,
        authorType: "client",
        sentAt: raised,
        body: submittedText(model, "body"),
        attachments
      };
      const created: MockTicket = {
        id: mockId("tkt", map(data.tickets, "id")),
        reference: nextReference(data),
        productId: relatedProduct(data, model),
        subject: submittedText(model, "subject"),
        department: desk,
        status,
        scheduledAt: booked,
        createdAt: raised,
        updatedAt: raised,
        messages: [message]
      };
      data.tickets.unshift(created);
      return { ok: true, entity: created };
    }
  })
);

/** Whether a booked moment is still ahead — an unreadable one never is. */
function isFutureMoment(moment: string): boolean {
  const at = Date.parse(moment);
  if (Number.isNaN(at)) return false;
  return at > Date.now();
}

/**
 * When the client asked the thread to open, where the brand lets them ask at
 * all. Legacy carried the datetime into the payload only under
 * `canScheduleTicket`, so a brand with the gate off opens the thread now
 * whatever arrives in the model.
 */
function bookedOpening(
  data: MockDataset,
  model: FormModel
): string | undefined {
  if (!data.features.CLIENT_TICKET_SCHEDULING_ENABLED) return undefined;
  const booked = submittedText(model, "scheduledAt");
  if (booked === "") return undefined;
  return booked;
}

/** The product a thread is about, where it is about one this client holds. */
function relatedProduct(
  data: MockDataset,
  model: FormModel
): string | undefined {
  const productId = submittedText(model, "productId");
  return find(data.products, { id: productId })?.id;
}
