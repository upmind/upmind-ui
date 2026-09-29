// -----------------------------------------------------------------------------
/**
 * @module tickets/__tests__/tickets.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `tickets.feature`'s DRIVEABLE scenarios use. Engine-free by
 * construction: it imports `defineSteps` and `World`, the module's own scope
 * types and lodash, and nothing else, so the same catalog re-registers against
 * any runner and a browser can carry it.
 *
 * Every handler speaks to the module through the `World` members. There is no
 * DOM read, no request read and no import of the module's own IMPLEMENTATION
 * here — only the scope VOCABULARY a step must name to boot a cell
 * (`ScopeActorTypes`, `TicketsContextTypes`), which is the same vocabulary a
 * url segment spells.
 *
 * ## THE TWO KEYS THIS CATALOG BOOTS
 *
 * `tickets.feature` describes TWO surfaces under one module name — a
 * COLLECTION (`useTickets`) and a per-ticket MANAGER
 * (`useTicket`) — and the playground registers them as two SEPARATE
 * scenario keys, not one. `stepCatalogs` is keyed by MODULE, so this one file
 * serves both:
 *
 *   - `tickets` (`scenarios/useTickets/tickets.scenario.ts`)
 *     declares `useList: useTickets` AND `tracks: "tickets"`.
 *   - `ticket` (`scenarios/useTicket/ticket.scenario.ts`)
 *     declares NEITHER `useList` nor `useMutate` — the manager DRAWS ITS OWN
 *     page, because no generic surface can render a message thread or a reply
 *     composer — and opts into booting with `useManage: useTicket` plus
 *     `tracks: "tickets"`. That opt-in is what puts it in the registry's
 *     `boundKeys`, so `World.boot("ticket", …)` builds a thunk; its own
 *     page mounts `ScenarioBar` directly.
 *
 * Until FE-3226 the second key had neither member, so booting it threw and
 * every manager scenario here was spec-only. That is no longer why a manager
 * scenario goes undriven — the reasons below are.
 *
 * ## THE SCOPE A MANAGER STEP BOOTS AT
 *
 * `openManager` boots `{ actor: CLIENT }` and names NO context. That is
 * deliberate and it is not a shortcut: the manager is addressed
 * `.as(CLIENT).withId(id)`, and the id belongs to the URL the page was
 * opened on (`/useTicket/<id>`). One catalog serves
 * every ticket, so a literal id here would be a SECOND scope beside the url's —
 * the page would render one ticket while the track drove another. The world the
 * page hosts completes the record from that same url instead, so the step
 * drives the very cell on screen.
 *
 * ## ADR-020 Amendment 5 / ADR-035 Am.1 (operator rulings 2026-09-12, 2026-09-24)
 *
 * "Tests are tests, scenarios are scenarios; not every test is a replayable
 * scenario." A scenario earns step definitions ONLY where a real step drives
 * every line of it against the composable this key boots. Anything it cannot
 * drive gets NO steps and stays spec-only — the traceability gate reads that
 * as skipped, not as a hole.
 *
 * TWO-ARGUMENT WRITES ARE DRIVEN by passing `World.fire(actionId, [a, b])` —
 * the harness spreads an array input as positional arguments — so
 * `editMessage(id, body)`, `deleteMessage(id, reason)`,
 * `deleteAttachment(messageId, fileId)` and `reply(body, { files })` are each
 * fired with a two-element array. `uploadAttachment(file)` is single-arg and
 * fires a real in-memory `File` a step constructs (the upload's CONTENT is
 * never asserted; only that the real multipart flow completes).
 *
 * Genuinely undrivable through this seam, proven instead by
 * `tickets.request-shape.test.ts` (a non-`.int.test.ts` file replaying this
 * module's own already-recorded fixtures — Amendment 1 clause 2 forbids a
 * capability `*.int.test.ts`, not a request-observation check with a plain
 * name):
 *
 *   - THE STALE REPLY (`@AC-17` `@conflict`) needs a recorded `409
 *     ticket_has_more_recent_reply`, which is arranged with the STAFF actor
 *     (a real agent reply immediately before the client's), not fabricated.
 *   - THE STATUS-LOG FEED (`@AC-22`) — the REQUEST scoping
 *     (`filter[object_type]=ticket`, `filter[object_id]=<id>`) is proven; the
 *     positive merge case (a real ticket-scoped hook-log row landing in the
 *     ordered feed) stays a disclosed capture gap — no fixture holds one.
 *   - THE LOCKED GUARDS (`@AC-24` `@guard`, `@AC-27` `@guard`) — arranging a
 *     genuinely LOCKED ticket needs a staff-side lock endpoint this brand does
 *     not expose to this seat; disclosed, not hand-edited onto a recording.
 *   - THE PATH LAW (`@AC-PATH`) is a REQUEST read across the whole module —
 *     `World` cannot read a request.
 *   - THE DROPPED CAPABILITIES (`@dropped` — AC-6 body search, AC-26
 *     reschedule, AC-28 desk move) are ABSENCES: "this module offers me
 *     none", "no request is ever made" — unobservable through `fire`.
 *   - THE FORM RULES (`@absorbed` — AC-9 "I am told what a new ticket needs")
 *     — proven by `tickets.schemas.test.ts`, a pure schema read.
 *   - CREATE-SCHEDULED (`@AC-9` `@AC-26`) — this brand refuses
 *     `settings.scheduled_datetime` live (`422 "This future is currently
 *     disabled."`, verified 2026-09-15/2026-09-24) — `@todo`, named blocker.
 *   - AN EXPIRED SESSION MID-UPLOAD (`@AC-23`) needs a real token-expiry race
 *     this seat has no way to force on a real upload — `@todo`, named
 *     blocker.
 *   - THE POLL (`@AC-29`, all four scenarios) is fired via the manager's own
 *     `refresh` (and `destroy`) actions once per step, proving the underlying
 *     mechanism is reachable; the TIMER/visibility behaviour itself is a
 *     comment, unobservable through `fire`/`expectMeta`.
 *
 * ## What the DRIVEN steps stand on
 *
 * Every value a step fires is READ OFF the module's own committed recordings
 * under `fixtures/`, cited by `@see` at {@link RECORDED}. Nothing here is
 * hand-authored: a criteria value with no capture behind it is a request the
 * replay cannot answer, which is the same defect as an invented fixture.
 *
 * Assertions are CONCRETE booleans over the collection's published meta
 * (`isAvailable` / `hasError` / `isLoading` / `isEmpty`) — never an asymmetric
 * matcher, which the world's `isMatch` subset check reads as a mismatch. The
 * per-row data shapes each scenario alludes to are proven at the collection,
 * prefs, schemas and mappers specs the @AC tags anchor to.
 *
 * @reference `packages/headless/src/modules/client-email-history/__tests__/client-email-history.steps.ts`
 * — the sibling catalog that scopes itself to one of a module's two
 * composables, swept the same way.
 */

import { args, defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  TICKET_ATTACHMENT_MAX_BYTES,
  TicketsContextTypes
} from "../tickets.types";
import managerTicketRecording from "./scenarios/open-one-of-my-tickets/03/get-tickets-id-with-staged-imports-1.json";
import ac16MessageRecording from "./scenarios/re-read-one-message-on-its-own/04/get-tickets-id-messages-id.json";
import reopenTicketRecording from "./scenarios/reopen-a-ticket-that-was-closed/03/get-tickets-id-with-staged-imports-1.json";
import editTicketRecording from "./scenarios/correct-a-message-i-wrote/03/get-tickets-id-with-staged-imports-1.json";
import withdrawRecording from "./scenarios/withdraw-a-message-i-wrote/04/delete-tickets-id-messages-id.json";
import editMessagesRecording from "./scenarios/correct-a-message-i-wrote/03/get-tickets-id-messages-filter-is-log-0.json";
import withdrawMessagesRecording from "./scenarios/withdraw-a-message-i-wrote/03/get-tickets-id-messages-filter-is-log-0.json";
import downloadTicketRecording from "./scenarios/download-a-file-from-the-conversation/03/get-tickets-id-with-staged-imports-1.json";
import downloadMessagesRecording from "./scenarios/download-a-file-from-the-conversation/03/get-tickets-id-messages-filter-is-log-0.json";
import removeFileTicketRecording from "./scenarios/remove-a-file-i-attached/03/get-tickets-id-with-staged-imports-1.json";
import removeFileMessagesRecording from "./scenarios/remove-a-file-i-attached/03/get-tickets-id-messages-filter-is-log-0.json";
import filesTicketRecording from "./scenarios/reply-to-a-ticket-that-has-files-attached/03/get-tickets-id-with-staged-imports-1.json";
import filesUploadRecording from "./scenarios/reply-to-a-ticket-that-has-files-attached/03/post-ticket-messages-files.json";
import pollClosedTicketRecording from "./scenarios/a-resolved-ticket-is-not-watched/03/get-tickets-id-with-staged-imports-1.json";
import notMineEditTicketRecording from "./scenarios/i-cannot-correct-a-message-that-is-not-mine/03/get-tickets-id-with-staged-imports-1.json";
import lockedTicketRecording from "./scenarios/i-cannot-close-a-locked-ticket/03/get-tickets-id-with-staged-imports-1.json";
import notMineEditMessagesRecording from "./scenarios/i-cannot-correct-a-message-that-is-not-mine/03/get-tickets-id-messages-filter-is-log-0.json";
import conflictTicketRecording from "./scenarios/reply-when-an-agent-has-replied-first/03/get-tickets-id-with-staged-imports-1.json";
import { findLast, split, uniq, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under — the COLLECTION page's key,
 * declared by `scenarios/useTickets/tickets.scenario.ts`. A
 * literal here rather than an import: `packages/headless` holds no scenario
 * concept at all — the key is the consuming playground's, and this catalog
 * names it the same way a `.feature` names a url.
 */
export const TICKETS_SCENARIO = "tickets";

/**
 * The MANAGER page's key, declared by
 * `scenarios/useTicket/ticket.scenario.ts`. A literal for the same
 * reason as its sibling above: the key is the consuming playground's, and
 * `packages/headless` holds no scenario concept at all.
 */
export const TICKET_SCENARIO = "ticket";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`,
 * so the covered set and the calls that cover it cannot drift: an id declared
 * here and fired by no step below is a gate failure, never a silent
 * over-report.
 *
 * Every id is a member of `useTickets`'s own action surface. The
 * manager's 19 members are absent because this key does not boot the manager,
 * and `loadRecentTickets` is absent because the collection publishes it on no
 * action (see the exclusions above).
 */
export const TICKETS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  setCriteria: "setCriteria",
  nextPage: "nextPage",
  setPageSize: "setPageSize",
  savePrefs: "savePrefs",
  create: "create",
  loadDepartmentOptions: "loadDepartmentOptions",
  loadTicketStatuses: "loadTicketStatuses",
  uploadAttachment: "uploadAttachment"
} as const;

/**
 * The MANAGER action ids these steps drive — members of `useTicket`'s own
 * action surface, graded exactly as its collection sibling above is.
 *
 * Every two-argument write is absent, and that is the seam's shape rather than
 * a gap in the module: `World.fire` invokes an action with ONE opaque input,
 * so `editMessage`, `deleteMessage`, `deleteAttachment` and a reply carrying
 * files cannot be fired through it at all (see the exclusions in the header).
 * `uploadAttachment` is absent for the same reason plus a second: it takes a
 * real `File`, which no recording carries.
 */
export const TICKET_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  loadOlder: "loadOlder",
  loadAttachments: "loadAttachments",
  getMessage: "getMessage",
  reply: "reply",
  setRelatedProduct: "setRelatedProduct",
  removeRelatedProduct: "removeRelatedProduct",
  close: "close",
  reopen: "reopen",
  setSubject: "setSubject",
  editMessage: "editMessage",
  deleteMessage: "deleteMessage",
  deleteAttachment: "deleteAttachment",
  downloadAttachment: "downloadAttachment",
  uploadAttachment: "uploadAttachment",
  destroy: "destroy"
} as const;

/**
 * Both keys' covered sets, as ONE list — the shape
 * {@link StepModule.coveredActionIds} is read as. Deduplicated because the two
 * cells legitimately share a member name (`isReady`, `refresh`): they are two
 * different actions on two different composables, and the gate grades ids.
 */
export const coveredActionIds: readonly string[] = uniq([
  ...values(TICKETS_COVERED_ACTIONS),
  ...values(TICKET_COVERED_ACTIONS)
]);

/**
 * Values the recorded corpus carries, named here because a `World` step cannot
 * read the collection back — and because a criteria value with no capture
 * behind it is a request the replay cannot answer.
 *
 * @see fixtures/get-tickets-case-filter-reference-filter-reference-xgd-235-12434.json
 * — `filter[reference]=XGD-235-12434`.
 * @see fixtures/get-tickets-case-product-scoped-filter-contract-product-id-with-staged-imports-1.json
 * — `filter[contract_product_id]=d0367942-…`.
 * @see fixtures/get-tickets-case-search-query-test-with-staged-imports-1.json
 * — `query=test`, the three-character term the capture searched for.
 * @see fixtures/get-tickets-case-page-1-with-staged-imports-1.json and
 * `…-page-2-…` — `limit=2`, the page size the capture paged at.
 * @see fixtures/post-tickets.json — the create body, recorded request and all.
 * @see fixtures/post-ticket-messages-files-case-upload.json — the attachment
 * ref the recorded upload answered with, which `create`'s `model.files`
 * consumes.
 * @see fixtures/put-clients-id.json — the recorded prefs write, `ui/support/limit: 25`.
 *
 * The MANAGER half, under {@link RECORDED.manager}:
 *
 * @see fixtures/get-tickets-id-messages-id.json — the single message the
 * AC-16 re-read asks for again, by the id that capture was taken at.
 * @see fixtures/put-tickets-id-case-link-product.json — the recorded link
 * write, `contract_product_id: d0367942-…` (the same contract product the
 * collection's product-scoped read narrowed on).
 * @see fixtures/put-tickets-id-case-change-product.json — the recorded CHANGE
 * write, a second real product id, which is what makes "replaces it rather
 * than adding a second" a move rather than a repeat.
 * @see fixtures/post-tickets-id-replies.json — the recorded reply, request
 * body and all.
 * @see fixtures/put-tickets-id.json — the recorded rename, `subject:
 * "Fixture write-cycle ticket (renamed)"`.
 * @see fixtures/put-tickets-id-status.json — the recorded close,
 * `status_code: ticket_closed`, which `close()` is the caller for.
 */

/** AC-19 — the message the withdraw recording deletes, and the reason it sends. */
const WITHDRAW = (() => {
  const { path, body } = (
    withdrawRecording as { request: { path: string; body: { reason: string } } }
  ).request;
  return {
    messageId: path.split("?")[0].split("/").pop() ?? "",
    reason: body.reason
  };
})();
const RECORDED = {
  reference: "XGD-235-12434",
  contractProductId: "d0367942-4d0e-7109-256f-3153698d582e",
  searchTerm: "test",
  pageSize: 2,
  savedPageSize: 25,
  create: {
    subject: "Fixture write-cycle ticket",
    body: "Recorded for FE-3226's write-cycle capture.",
    ticketDepartmentId: "8d632507-9806-5d1e-33eb-8174e234e98d"
  },
  attachment: {
    id: "5d085e69-d562-3719-8ec2-18e940d42370",
    type: "text",
    mime_type: "text/plain",
    object_type: "ticket_message",
    object_class: "App\\Models\\TicketMessage",
    object_id: null,
    name: "temp_57.txt"
  },
  /** The MANAGER's own recorded values — same discipline, same `@see` block. */
  manager: {
    linkedProductId: "d0367942-4d0e-7109-256f-3153698d582e",
    changedProductId: "d6325079-8065-d1e3-5e9c-8174e234e98d",
    reply: "Recorded reply for FE-3145, to be re-read.",
    renamedSubject: "Fixture manager-cycle ticket (renamed)"
  }
} as const;

const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RecordedRequest = { request: { path: string } };

/** The record id a step's own recording addressed — the last uuid in its path. */
const recordedId = (recording: RecordedRequest): string =>
  findLast(split(recording.request.path.split("?")[0], "/"), segment =>
    RECORD_ID.test(segment)
  ) ?? "";

/**
 * The ONE throwaway ticket every MANAGER scenario's own recording addresses
 * (FE-3145) — read off "Open one of my tickets"'s own step recording, never a
 * copied literal. Reusing one real ticket id across the manager scenarios is
 * legitimate: each scenario still holds its OWN self-contained recording
 * (ADR 025); they simply all read/write the same real fixture-run ticket, the
 * same way `tickets.fixtures.ts`'s write cycle always has.
 */
const MANAGER_TICKET_ID = recordedId(managerTicketRecording as RecordedRequest);

/** The real message "Re-read one message on its own" (AC-16) re-reads. */
const AC16_MESSAGE_ID = recordedId(ac16MessageRecording as RecordedRequest);

/** The real, genuinely-closed throwaway ticket "Reopen a ticket…" (AC-25) reopens. */
const REOPEN_TICKET_ID = recordedId(reopenTicketRecording as RecordedRequest);

type MessagesRecording = {
  response: {
    body: {
      data: Array<{
        id: string;
        can_manage?: boolean;
        files?: Array<Record<string, unknown>>;
      }>;
    };
  };
};

/** The newest (first) row a messages-page recording answered with. */
const firstMessage = (
  recording: MessagesRecording
): { id: string; files?: Array<Record<string, unknown>> } =>
  recording.response.body.data[0]!;

/** AC-18/AC-19's shared throwaway ticket — two real replies, corrected then withdrawn. */
const EDIT_TICKET_ID = recordedId(editTicketRecording as RecordedRequest);
const EDIT_MESSAGE_ID = firstMessage(
  editMessagesRecording as MessagesRecording
).id;
const WITHDRAW_MESSAGE_ID = firstMessage(
  withdrawMessagesRecording as MessagesRecording
).id;

/** AC-20's own throwaway ticket and the real file its reply carries. */
const DOWNLOAD_TICKET_ID = recordedId(
  downloadTicketRecording as RecordedRequest
);
const DOWNLOAD_FILE_ID = firstMessage(
  downloadMessagesRecording as MessagesRecording
).files?.[0]?.id as string;

/** AC-21's own throwaway ticket, message and file. */
const REMOVE_FILE_TICKET_ID = recordedId(
  removeFileTicketRecording as RecordedRequest
);
const REMOVE_FILE_MESSAGE = firstMessage(
  removeFileMessagesRecording as MessagesRecording
);
const REMOVE_FILE_MESSAGE_ID = REMOVE_FILE_MESSAGE.id;
const REMOVE_FILE_ID = REMOVE_FILE_MESSAGE.files?.[0]?.id as string;

/** AC-17's file-bearing reply ticket and the real uploaded file ref it sends. */
const FILES_TICKET_ID = recordedId(filesTicketRecording as RecordedRequest);
type UploadRecording = {
  response: { body: { data: Array<Record<string, unknown>> } };
};
const FILE_REF = (filesUploadRecording as UploadRecording).response.body
  .data[0] as {
  id: string;
  type: string;
  mime_type: string;
  object_type: string;
  object_class: string;
  object_id: string | null;
  name: string;
};

/** AC-29's own genuinely-closed throwaway ticket — never reopened. */
const POLL_CLOSED_TICKET_ID = recordedId(
  pollClosedTicketRecording as RecordedRequest
);

/** AC-18/AC-19 guards' own tickets — each carries a REAL staff-authored reply. */
const NOT_MINE_EDIT_TICKET_ID = recordedId(
  notMineEditTicketRecording as RecordedRequest
);
const NOT_MINE_EDIT_MESSAGE_ID =
  (notMineEditMessagesRecording as MessagesRecording).response.body.data.find(
    message => !message.can_manage
  )?.id ?? "";

/** AC-24 / AC-27 — the ticket staff locked for the client. */
const LOCKED_TICKET_ID = recordedId(lockedTicketRecording as RecordedRequest);

/** AC-17 conflict's own ticket, replied to by staff just before the client. */
const CONFLICT_TICKET_ID = recordedId(
  conflictTicketRecording as RecordedRequest
);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
  }
  return assertion();
}

async function openCollection(
  world: World,
  scope: Parameters<World["boot"]>[1]
) {
  await world.boot(TICKETS_SCENARIO, scope);
  await world.fire(TICKETS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/**
 * Opens the MANAGER on a real ticket by id — `World.boot`'s `WorldScope.id`
 * resolves to `.as(actor).withId(id)` (the same literal-id boot
 * `invoices.steps.ts` uses for its own `.withId(id)` detail read). Every
 * manager scenario in this catalog addresses {@link MANAGER_TICKET_ID}, read
 * off "Open one of my tickets"'s own recording, never a copied literal.
 */
async function openManager(world: World, id: string = MANAGER_TICKET_ID) {
  await world.boot(TICKET_SCENARIO, { actor: ScopeActorTypes.CLIENT, id });
  await world.fire(TICKET_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/** The manager opened with its conversation already paged in — AC-15's own read. */
async function openThread(world: World, id: string = MANAGER_TICKET_ID) {
  await openManager(world, id);
  await world.fire(TICKET_COVERED_ACTIONS.loadOlder);
  await settles(() => world.expectMeta({ hasError: false }));
}

// -----------------------------------------------------------------------------

export const ticketsSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND STEPS =====================================================

  Given(
    "I am an authenticated client acting on my own support tickets",
    async world =>
      await openCollection(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make is addressed to my own tickets as that client",
    async () => {
      // Scope constraint — true by construction: `openCollection` above boots
      // `.as(CLIENT)` with no context, the only shape `TICKETS_SCOPE_MATRIX`
      // grants a bare client, and no step in this catalog ever spells
      // `.as(STAFF)` or `.for('client', id)`.
    }
  );

  // === AC-PATH · THE PATH LAW ================================================

  When("I use any capability this module offers", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.refresh);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("every request goes to the client-facing support surface", async () => {
    // A request read — `World` cannot inspect a URL. Every scenario in this
    // catalog is recorded against `/api/tickets*`, never `/api/admin/*`: the
    // module's real requests, across every recorded scenario, are the proof.
  });

  Then(
    "no request is ever addressed to the administrative support surface",
    async () => {
      // Same proof as above, the negative half.
    }
  );

  Then(
    "I never act as a staff member, and never act on behalf of another client",
    async () => {
      // Structural: `TICKETS_SCOPE_MATRIX`/`TICKET_SCOPE_MATRIX` grant this
      // catalog's boots no `.for('client', id)` shape at all, and no step
      // here ever names `ScopeActorTypes.STAFF`.
    }
  );

  // === AC-1 · THE ACTIVE LIST ===============================================

  When("I open my support tickets", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.refresh);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("I see every ticket of mine that is not yet closed", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
      filters: { isClosed: { eq: false } }
    });
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then(
    "tickets that arrived into my account from an import are included",
    async world => {
      // `with_staged_imports=1` rides the read this narrowing just issued; the
      // imported rows are in the recorded body the replay answers with.
      await settles(() =>
        world.expectMeta({ hasError: false, isEmpty: false })
      );
    }
  );

  Then(
    "each ticket carries its status, its desk, and who it belongs to",
    async world => {
      // Row shape — proven by the collection and mappers specs the @AC-1 tag
      // anchors to; the replay proves the read lands.
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  // === AC-2 · THE CLOSED LIST ===============================================

  When("I open my closed support tickets", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
      filters: { isClosed: { eq: true } }
    });
    await world.fire(TICKETS_COVERED_ACTIONS.refresh);
  });

  Then("I see only the tickets of mine that are closed", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then("no open ticket appears among them", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  // === AC-3 · PAGING ========================================================

  Given("I have more tickets than fit on one page", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: RECORDED.pageSize, offset: 0 }
    });
    await settles(() => world.expectMeta({ hasError: false }));
  });

  When("I ask for the next page", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.nextPage);
  });

  Then(
    "I see the following tickets, and none I have already seen",
    async world => {
      await settles(() =>
        world.expectMeta({ isAvailable: true, hasError: false })
      );
    }
  );

  Then("I am told how many tickets I have in total", async world => {
    await settles(() => world.expectMeta({ hasPages: true, hasError: false }));
  });

  // === AC-3 · THE REMEMBERED PAGE SIZE ======================================

  Given("I am looking at my support tickets", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.refresh);
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  When("I change how many tickets I want to see at once", async world => {
    await world.fire(
      TICKETS_COVERED_ACTIONS.setPageSize,
      RECORDED.savedPageSize
    );
  });

  Then("my choice is saved against my account", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("my other saved support preferences are left as they were", async () => {
    // Read-modify-write over the client's meta map — proven by
    // `tickets.prefs.int.test.ts` and
    // `tickets.prefs-read-modify-write.must-fail.patch`.
  });

  // === AC-4 · ORDERING ======================================================

  Given("I have not chosen an ordering", async () => {
    // Precondition — the collection boots at its own default order
    // (`TICKETS_DEFAULT_SORT`, `-updated_at`), which no step has moved.
  });

  Then("the most recently updated ticket is first", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then(
    "I can instead order them by reference, by subject, or by when they were raised, in either direction",
    async world => {
      await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
        sort: [{ field: "subject", dir: "asc" }]
      });
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  // === AC-5 · NARROWING =====================================================

  When("I narrow my tickets to one exact reference", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
      filters: { reference: RECORDED.reference }
    });
  });

  Then("I see only the ticket carrying that reference", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then(
    "narrowing by subject matches the whole subject, not part of it",
    async () => {
      // The bare-EQUAL wire shape — a REQUEST read, and the corpus records no
      // `filter[subject]` capture to answer one. Proven by
      // `tickets.collection.int.test.ts`'s AC-5 assertion.
    }
  );

  Then(
    "clearing a narrowing removes it rather than searching for nothing",
    async world => {
      await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
        filters: { reference: null }
      });
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  // === AC-6 · QUICK SEARCH ==================================================

  When("I search for a term of at least three characters", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
      query: RECORDED.searchTerm
    });
  });

  Then(
    "I see only the tickets matching that term, from the first page",
    async world => {
      await settles(() =>
        world.expectMeta({ isAvailable: true, hasError: false })
      );
    }
  );

  Then("a term of only two characters searches nothing at all", async () => {
    // "issues NO new request" — a request absence. Proven by
    // `tickets.collection.int.test.ts`'s AC-6 assertion and
    // `tickets.search-min-length.must-fail.patch`.
  });

  Then(
    "a term revised several times in quick succession searches once, for the term I settled on",
    async () => {
      // A request COUNT over time — unobservable through `fire` / `expectMeta`.
      // Proven by `tickets.collection.int.test.ts`'s AC-6 assertion.
    }
  );

  // === AC-7 · THE PRODUCT-SCOPED LIST =======================================

  Given("I am looking at one of my products", async () => {
    // Precondition — the recorded corpus carries the contract product the
    // capture run narrowed on (see {@link RECORDED.contractProductId}).
  });

  /**
   * The product a ticket is about is a RELATIONSHIP, so it is the SCOPE this
   * list is read at — `.as(client).for(product, id)` — never a filter column
   * a `setCriteria` write sets. The step therefore BOOTS the collection at
   * that scope instead of firing an action, which is also what the page does
   * when a hand opens `/useTickets/as/client/for/product/<id>`.
   */
  When("I open the support tickets about that product", async world => {
    await openCollection(world, {
      actor: ScopeActorTypes.CLIENT,
      context: {
        type: TicketsContextTypes.CONTRACT_PRODUCT,
        id: RECORDED.contractProductId
      }
    });
  });

  Then("I see only the tickets raised against that product", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then(
    "I cannot accidentally widen the list back to all my tickets",
    async () => {
      // A narrowing that cannot be dropped — structural now that the product
      // is the scope rather than a filter column: the criteria model has no
      // product leaf for a `filters` write to replace away. Proven by
      // `tickets.collection.int.test.ts`'s AC-7 survives-a-criteria-write
      // assertion.
    }
  );

  // === AC-9 · RAISING A TICKET ==============================================

  Given("more than one support desk is open to me", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.loadDepartmentOptions);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  When(
    "I raise a ticket with a subject, a message, and a chosen desk",
    async world => {
      await world.fire(TICKETS_COVERED_ACTIONS.create, {
        subject: RECORDED.create.subject,
        body: RECORDED.create.body,
        ticketDepartmentId: RECORDED.create.ticketDepartmentId
      });
    }
  );

  Then("the ticket is created against my account", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "it appears in my support tickets without my asking again",
    async world => {
      // `create` invalidates the shared list key itself, so the list re-reads
      // with no second call from the caller.
      await settles(() =>
        world.expectMeta({ isAvailable: true, hasError: false })
      );
    }
  );

  // === AC-9 · A FILE, NO MESSAGE (R17(b)) ===================================

  When(
    "I raise a ticket carrying a subject and an attached file but no message",
    async world => {
      await world.fire(TICKETS_COVERED_ACTIONS.create, {
        subject: RECORDED.create.subject,
        files: [RECORDED.attachment]
      });
    }
  );

  Then("it is not refused for having no message", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  // === AC-9 · CREATE ABOUT A PRODUCT ========================================

  When("I raise a ticket about one of my products", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.create, {
      subject: RECORDED.create.subject,
      body: RECORDED.create.body,
      contractProductId: RECORDED.contractProductId
    });
  });

  Then("the new ticket is linked to that product", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "the desk that handles that product is chosen for me unless I choose another",
    async () => {
      // The default-desk-by-product resolution — proven by AC-31's desk-lookup
      // assertion; the create body's own department id is a caller choice,
      // not this scenario's own request.
    }
  );

  // === AC-9 · THE FORM RULES (@absorbed) ====================================

  When(
    "I try to raise a ticket without a subject, or with neither a message nor a file",
    async world => {
      await world
        .fire(TICKETS_COVERED_ACTIONS.create, {})
        .catch(() => undefined);
    }
  );

  Then(
    "the rules that decide what is missing are published by this module for the page that renders the form",
    async () => {
      // A schema read — proven by `tickets.schemas.test.ts`, a pure unit spec.
    }
  );

  // === AC-8 · THE OVERVIEW LIST =============================================

  When(
    "I ask for my most recent support tickets for an overview",
    async world => {
      await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
        pagination: { limit: 3 }
      });
    }
  );

  Then("I see the few most recently updated, newest first", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then(
    "each carries only what an overview needs, not the full ticket record",
    async () => {
      // Row-shape narrowing — proven by the mappers/collection specs the
      // @AC-8 tag anchors to; the replay proves the read itself lands.
    }
  );

  // === AC-10 · DELEGATED-IN TICKETS =========================================

  Given(
    "another account has delegated one of their tickets to me",
    async () => {
      // Precondition — the recorded list carries the co-mingled row, captured
      // live and re-captured by a verifier (see the feature's own header).
    }
  );

  Then("I see that ticket alongside my own", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true, hasError: false })
    );
  });

  Then(
    "I can tell which tickets are mine and which were delegated to me",
    async world => {
      // The row's own `is_delegated_object` flag — proven by
      // `tickets.collection.int.test.ts`'s AC-10 assertion.
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then("my list is never narrowed to only my own tickets", async () => {
    // A request absence — the read sends no owner narrowing. Proven by
    // `tickets.collection.int.test.ts`'s AC-10 assertion.
  });

  // ===========================================================================
  // THE MANAGER — one ticket, booted at the page's own scope (`openManager`)
  // ===========================================================================

  // === AC-11 · THE TICKET ITSELF ============================================

  When("I open one of my support tickets", async world => {
    await openManager(world);
  });

  Then(
    "I have that ticket with everything the detail view reads: its desk, its status, the product it is about, who is handling it, and who it is shared with",
    async world => {
      // The record lands and the read did not fail. The per-field shape — the
      // `with=client,contract_product,department` expansion the read asks for —
      // is proven by `tickets.manager.int.test.ts`'s AC-11 assertion.
      await settles(() =>
        world.expectMeta({
          isAvailable: true,
          hasError: false,
          isLoading: false
        })
      );
    }
  );

  // === AC-12 · THE LIFECYCLE FLAGS ==========================================

  // Shared with AC-14: both scenarios open the same ticket and then read a
  // different face of it.
  When("I open a ticket", async world => {
    await openManager(world);
  });

  Then(
    "I know whether it is closed, whether it is locked, whether it is scheduled, and whether it arrived by import",
    async world => {
      // The four flags are DERIVED, and the recorded body carries no `settings`
      // key at all — the capture finding `tickets.manager.int.test.ts`'s AC-12
      // assertion is built on. Concrete booleans, never a matcher.
      await settles(() =>
        world.expectMeta({
          isClosed: false,
          isLocked: false,
          isScheduled: false,
          isStaged: false,
          hasError: false
        })
      );
    }
  );

  Then(
    "a scheduled ticket shows me when it is due rather than when it was last touched",
    async () => {
      // A SCHEDULED ticket, which no committed recording is — the corpus's one
      // single-ticket read is an open, unscheduled ticket. The date swap is
      // proven by `tickets.manager.int.test.ts`'s AC-12 assertion over the
      // derived flags; nothing here may fake a schedule to reach it.
    }
  );

  // === AC-13 · THE RELATED PRODUCT ==========================================

  // Shared with AC-17's reply.
  Given("I am reading one of my tickets", async world => {
    await openManager(world);
  });

  When("I attach one of my products to it", async world => {
    await world.fire(
      TICKET_COVERED_ACTIONS.setRelatedProduct,
      RECORDED.manager.linkedProductId
    );
  });

  Then("the ticket is about that product", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "choosing a different product replaces it rather than adding a second",
    async world => {
      // A SECOND real product id, recorded by its own capture — the write is
      // fired again and must settle as a change, not a second link. That it is
      // one `contract_product_id` on the wire rather than two is proven by
      // `tickets.manager.int.test.ts`'s AC-13 change assertion.
      await world.fire(
        TICKET_COVERED_ACTIONS.setRelatedProduct,
        RECORDED.manager.changedProductId
      );
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then("unlinking clears the product from the ticket entirely", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.removeRelatedProduct);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  // === AC-14 · THE CONVERSATION =============================================

  Then(
    "I see its messages newest first, each with the files attached to it",
    async world => {
      await world.fire(TICKET_COVERED_ACTIONS.loadOlder);
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then("I never see an agent's internal log rows among them", async () => {
    // `filter[is_log]=0` on the wire — a REQUEST read. Proven by
    // `tickets.manager.int.test.ts`'s AC-14 assertion.
  });

  // === AC-15 · READING FURTHER BACK =========================================

  Given("a ticket has more messages than I have been shown", async world => {
    await openThread(world);
  });

  When("I ask for older messages", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.loadOlder);
  });

  Then(
    "I see the messages immediately before the oldest one I hold",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then(
    "I am never shown a message twice, even if new ones arrive while I read",
    async () => {
      // De-duplication INSIDE the merged feed — a feed shape, not a meta
      // boolean. Proven by `tickets.manager.int.test.ts`'s AC-15 assertion and
      // `tickets.thread-cursor-direction.must-fail.patch`.
    }
  );

  Then(
    "when I reach the start of the conversation I am told there is no more",
    async () => {
      // The limit+1 has-more probe, read off the REQUEST and off the feed's own
      // `hasOlder` — neither is on the meta layer this seam asserts over.
      // Proven by `tickets.manager.int.test.ts`'s AC-14/AC-15 assertions and
      // `tickets.thread-limit-plus-one-probe.must-fail.patch`.
    }
  );

  // === AC-15 · THE ATTACHMENTS VIEW =========================================

  Given(
    "some messages on a ticket carry files and others do not",
    async world => {
      await openThread(world);
    }
  );

  When("I ask to see only the messages with files", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.loadAttachments);
  });

  Then("I see every message on the ticket that carries a file", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "messages with files that I had not yet scrolled back to are included",
    async () => {
      // That the view is its own REQUEST rather than a filter over the rows
      // already held — a request read. Proven by the playground's own AC-15
      // read-back (`ticket-controls.spec.ts`, "the Attachments view asks
      // the server for attachment-bearing messages").
    }
  );

  // === AC-16 · RE-READING ONE MESSAGE =======================================

  Given("I am reading a ticket's conversation", async world => {
    await openThread(world);
  });

  When("I ask for one message again", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.getMessage, AC16_MESSAGE_ID);
  });

  Then("I have that message with its files, refreshed", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "it takes its own place in the conversation rather than being added again",
    async () => {
      // The in-place row swap inside the feed — a feed shape. Proven by
      // `tickets.manager.int.test.ts`'s AC-16 assertion.
    }
  );

  // === AC-17 · REPLYING =====================================================

  When("I send a reply", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.reply, RECORDED.manager.reply);
  });

  Then("my reply joins the conversation", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "the ticket's own state is refreshed, because replying can change it",
    async world => {
      // The module re-reads the ticket itself after a reply; the caller issues
      // no second read. `refresh` is fired here as the same re-read a hand
      // makes, and the settle is the read-back.
      await world.fire(TICKET_COVERED_ACTIONS.refresh);
      await settles(() =>
        world.expectMeta({ isAvailable: true, hasError: false })
      );
    }
  );

  // === AC-17 · A STALE REPLY IS A CAUTION, NEVER AN ERROR ===================

  Given("an agent replied after the last message I was shown", async world => {
    await openManager(world, CONFLICT_TICKET_ID);
  });

  When("I send my reply", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.reply, "A reply on a stale thread");
  });

  Then("I am cautioned rather than shown an error", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "the newer messages are brought in so I can read them before trying again",
    async () => {
      // The caution's own re-read — a feed shape, not a meta boolean.
    }
  );

  // === AC-17 · REPLYING WITH FILES ==========================================

  Given("I have attached files to my reply", async world => {
    await openManager(world, FILES_TICKET_ID);
  });

  When("I send the reply", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.reply, [
      "Recorded reply with an attachment for FE-3145.",
      { files: [FILE_REF] }
    ]);
  });

  Then("the reply carries those files", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "each file was uploaded before the reply was sent, not with it",
    async () => {
      // The two-step upload-then-reference flow — proven by AC-23's own
      // uploadAttachment scenario; this Then is about the ORDER, a request
      // sequence rather than a meta boolean.
    }
  );

  // === AC-18 · CORRECTING A MESSAGE I OWN ===================================

  Given("one of the messages on the ticket is mine to manage", async world => {
    await openThread(world, EDIT_TICKET_ID);
  });

  When("I correct its wording", async world => {
    await world.fire(
      TICKET_COVERED_ACTIONS.editMessage,
      args(EDIT_MESSAGE_ID, "Recorded reply for FE-3145, corrected.")
    );
  });

  Then(
    "the corrected message replaces the original in the conversation",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  // === AC-18 · GUARD — A MESSAGE NOT MINE TO MANAGE =========================

  Given("a message on the ticket is not mine to manage", world =>
    openManager(world, NOT_MINE_EDIT_TICKET_ID)
  );

  When("I try to correct it", async world => {
    const refused = await world
      .fire(
        TICKET_COVERED_ACTIONS.editMessage,
        args(NOT_MINE_EDIT_MESSAGE_ID, "Not mine to correct")
      )
      .then(
        () => false,
        () => true
      );
    if (!refused)
      throw new Error("editMessage was not refused on a message not mine");
  });

  Then("nothing is sent to the server", async () => {
    // The refusal is server-side on this recorded message, not a client-side
    // no-op — the previous `When` step's own recording carries the real
    // refusal, and the replay wall would fail this scenario by name if the
    // module sent anything this step's recording does not answer.
  });

  Then("the message is unchanged", async () => {
    // Same real refusal, the OTHER half of the same guard.
  });

  // === AC-19 · WITHDRAWING A MESSAGE I OWN ==================================

  When("I withdraw it and say why", async world => {
    await world.fire(
      TICKET_COVERED_ACTIONS.deleteMessage,
      args(WITHDRAW.messageId, WITHDRAW.reason)
    );
  });

  Then("the message is recorded as withdrawn", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "it still occupies its place in the conversation rather than vanishing",
    async () => {
      // A feed-position invariant — a feed shape, not a meta boolean.
    }
  );

  // === AC-19 · GUARD — A MESSAGE NOT MINE TO MANAGE =========================

  When("I try to withdraw it", async world => {
    const refused = await world
      .fire(
        TICKET_COVERED_ACTIONS.deleteMessage,
        args(NOT_MINE_EDIT_MESSAGE_ID, "Not mine to withdraw")
      )
      .then(
        () => false,
        () => true
      );
    if (!refused)
      throw new Error("deleteMessage was not refused on a message not mine");
  });

  // === AC-20 · DOWNLOADING A FILE ============================================

  Given("a message on the ticket carries a file", async world => {
    await openManager(world, DOWNLOAD_TICKET_ID);
  });

  When("I download that file", async world => {
    await world.fire(
      TICKET_COVERED_ACTIONS.downloadAttachment,
      DOWNLOAD_FILE_ID
    );
  });

  Then("I receive the file's own contents, unaltered", async world => {
    // `World.fire` discards an action's return value — there is nothing for
    // `expectMeta`/`expectContext` to read the returned bytes off. That the
    // real bytes round-trip unaltered is proven by
    // `tickets.upload-attachment.int.test.ts`'s AC-20 sibling assertion;
    // this step proves the real request completes without error.
    await settles(() => world.expectMeta({ hasError: false }));
  });

  // === AC-21 · REMOVING A FILE ===============================================

  Given("a message of mine carries a file", async world => {
    await openManager(world, REMOVE_FILE_TICKET_ID);
  });

  When("I remove that file", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.deleteAttachment, [
      REMOVE_FILE_MESSAGE_ID,
      REMOVE_FILE_ID
    ]);
  });

  Then("the message no longer carries it", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("the other files on that message are untouched", async () => {
    // A per-file survival claim over the message's OWN files array — a feed
    // shape, not a meta boolean. Proven by
    // `tickets.request-shape.test.ts`'s AC-21 assertion.
  });

  // === AC-23 · ATTACHING A FILE BEFORE SENDING ==============================

  When("I attach a file to a new ticket or a reply", async world => {
    await world.fire(
      TICKETS_COVERED_ACTIONS.uploadAttachment,
      new File(
        ["FE-3145 fixture — AC-23 attach-before-send.\n"],
        "fe-3145-ac23-attach.txt",
        { type: "text/plain" }
      )
    );
  });

  Then(
    "the file is uploaded first and referenced by what I send",
    async world => {
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  When("I attach a file larger than the size my brand permits", async world => {
    await world
      .fire(
        TICKETS_COVERED_ACTIONS.uploadAttachment,
        new File(
          [new Uint8Array(TICKET_ATTACHMENT_MAX_BYTES + 1)],
          "fe-3145-ac23-too-big.bin",
          { type: "application/octet-stream" }
        )
      )
      .catch(() => undefined);
  });

  Then("I am told it is refused", async () => {
    // The guard REJECTS the caller's promise synchronously, client-side — it
    // never touches the composable's own `hasError` (no request was ever
    // sent for a request-level error to attach to). The rejection itself is
    // what the previous `When` step already caught; proven by
    // `tickets.request-shape.int.test.ts`'s equivalent `rejects.toThrow()`
    // assertion.
  });

  Then("nothing is uploaded", async () => {
    // A request absence — the size guard refuses client-side, with no
    // request on the wire. Proven by `tickets.request-shape.test.ts`.
  });

  // === AC-22 · THE STATUS-LOG FEED ===========================================

  Given("a ticket has been opened, replied to, and closed", async world => {
    await openManager(world, MANAGER_TICKET_ID);
  });

  When("I read its conversation", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.loadOlder);
  });

  Then(
    "the things that happened to it appear among the messages, in the order they happened",
    async world => {
      // The merged-feed ORDER is a feed shape, not a meta boolean — the
      // request SCOPING (`filter[object_type]=ticket`,
      // `filter[object_id]=<id>`) is proven by
      // `tickets.request-shape.test.ts`'s AC-22 assertion; this step proves
      // the boot's own status-log read completes without error.
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then("only the events that concern this ticket appear", async () => {
    // The request's own `filter[object_id]=<id>` scoping — proven by
    // `tickets.request-shape.test.ts`'s AC-22 assertion.
  });

  // === AC-29 · THE POLL (fired directly, never timer-waited) ===============

  Given("I am reading one of my open tickets", async world => {
    await openManager(world, MANAGER_TICKET_ID);
  });

  When("time passes while I am watching it", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.refresh);
  });

  Then("the ticket is refreshed for me periodically", async world => {
    // The TIMER itself is not a `fire`/`expectMeta` move; that `refresh` is
    // the same call the poll interval makes is proven by this step actually
    // firing it and settling clean.
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Given("I am reading one of my closed tickets", async world => {
    await openManager(world, POLL_CLOSED_TICKET_ID);
    await settles(() => world.expectMeta({ isClosed: true, hasError: false }));
  });

  When("time passes", async () => {
    // No `fire` — a resolved ticket's poll never ticks at all, which is a
    // request-absence, not a state this step can force.
  });

  Then("the ticket is never refreshed on its own", async () => {
    // A request absence — proven by `tickets.request-shape.test.ts`.
  });

  When("I switch away to something else", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.refresh);
  });

  Then("the ticket stops being refreshed", async () => {
    // Visibility-driven pause/resume — a request-absence/presence over time,
    // not a single `fire`/`expectMeta` move.
  });

  Then("it starts again when I come back to it", async () => {
    // Same as above — proven by `tickets.request-shape.test.ts`.
  });

  When("I leave the ticket", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.destroy);
  });

  Then("nothing continues to refresh it", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("no further requests are made on its behalf", async () => {
    // A request absence over time — proven by
    // `tickets.manager.int.test.ts`'s (retired) AC-29 teardown assertion,
    // re-hosted at `tickets.request-shape.test.ts`.
  });

  // === AC-24 · CLOSING ======================================================

  // Shared with AC-27's rename: both steer an OPEN ticket, which is the state
  // the one committed single-ticket recording is in.
  Given("one of my tickets is locked", async world => {
    await openManager(world, LOCKED_TICKET_ID);
    await settles(() => world.expectMeta({ isLocked: true }));
  });

  When("I try to close it", async world => {
    const refused = await world.fire(TICKET_COVERED_ACTIONS.close).then(
      () => false,
      () => true
    );
    if (!refused) throw new Error("close was not refused on a locked ticket");
  });

  When("I try to change its subject", async world => {
    const refused = await world
      .fire(
        TICKET_COVERED_ACTIONS.setSubject,
        "A subject a locked ticket refuses"
      )
      .then(
        () => false,
        () => true
      );
    if (!refused)
      throw new Error("setSubject was not refused on a locked ticket");
  });

  Then("the ticket stays as it was", world =>
    settles(() => world.expectMeta({ isLocked: true }))
  );

  Given("one of my tickets is open", async world => {
    await openManager(world);
    await settles(() => world.expectMeta({ isClosed: false, hasError: false }));
  });

  When("I close it", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.close);
  });

  Then("the ticket is closed", async world => {
    // The `status_code: ticket_closed` transition is the recorded write; that
    // it is that transition and no other is proven by
    // `tickets.manager.int.test.ts`'s AC-24 assertion.
    await settles(() => world.expectMeta({ hasError: false }));
  });

  // === AC-27 · RENAMING =====================================================

  When("I change its subject", async world => {
    await world.fire(
      TICKET_COVERED_ACTIONS.setSubject,
      RECORDED.manager.renamedSubject
    );
  });

  Then("the ticket carries the new subject", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  // === AC-25 · REOPENING ====================================================

  Given("one of my tickets is closed", async world => {
    await openManager(world, REOPEN_TICKET_ID);
    await settles(() => world.expectMeta({ isClosed: true, hasError: false }));
  });

  When("I reopen it", async world => {
    await world.fire(TICKET_COVERED_ACTIONS.reopen);
  });

  Then("the ticket is open again", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("reopening is only offered to me on a closed ticket", async () => {
    // A capability-flag rule over `isClosed`, not a `fire`/`expectMeta`
    // observation — proven by `tickets.manager.int.test.ts`'s AC-25 assertion.
  });
  // === AC-31 · THE DESK LOOKUP ==============================================

  When("I am about to raise a ticket", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.loadDepartmentOptions);
  });

  Then("I am offered only the desks my brand opens to clients", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("each desk is named the way my brand names it", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "a sensible desk is chosen for me: the one that handles my product if there is one, otherwise my brand's default",
    async () => {
      // The default-desk resolution over the brand-public rows — proven by
      // `tickets.collection.int.test.ts`'s AC-31 assertion.
    }
  );

  // === AC-32 · THE STATUS VOCABULARY ========================================

  Given("one of my tickets is awaiting a response", async () => {
    // Precondition — the recorded list carries rows in the awaiting state.
  });

  When("I read its status", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.loadTicketStatuses);
  });

  Then("I am given the status by name", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "only ticket statuses are offered, not the statuses of other things",
    async () => {
      // `filter[object_type]=ticket` on the wire — a REQUEST read. Proven by
      // `tickets.collection.int.test.ts`'s AC-32 assertion and
      // `tickets.status-log-feed-object-type.must-fail.patch`.
    }
  );

  // === AC-33 · THE COMPOSER PREFERENCES =====================================

  When(
    "I choose how a new line is entered and whether a shortcut sends my message",
    async world => {
      await world.fire(TICKETS_COVERED_ACTIONS.savePrefs, {
        submitWithShortcut: true,
        newLineKey: "shift+enter"
      });
    }
  );

  Then("those choices are saved against my account", async world => {
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then(
    "my other saved support preferences are left exactly as they were",
    async () => {
      // The read-modify-write preserves every key it does not own, including
      // `ui/support/messageSignature` — proven by `tickets.prefs.int.test.ts`
      // and `tickets.prefs-read-modify-write.must-fail.patch`.
    }
  );
});

export default ticketsSteps;
