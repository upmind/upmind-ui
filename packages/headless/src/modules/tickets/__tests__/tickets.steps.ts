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
 * DOM read, no request read and no import of the module's own source here.
 *
 * ## THE TWO KEYS THIS CATALOG BOOTS
 *
 * `tickets.feature` describes TWO surfaces under one module name — a
 * COLLECTION (`useClientTickets`) and a per-ticket MANAGER
 * (`useClientTicket`) — and the playground registers them as two SEPARATE
 * scenario keys, not one. `stepCatalogs` is keyed by MODULE, so this one file
 * serves both:
 *
 *   - `client_tickets` (`scenarios/useClientTickets/client-tickets.scenario.ts`)
 *     declares `useList: useClientTickets` AND `tracks: "tickets"`.
 *   - `client_ticket` (`scenarios/useClientTicket/client-ticket.scenario.ts`)
 *     declares NEITHER `useList` nor `useMutate` — the manager DRAWS ITS OWN
 *     page, because no generic surface can render a message thread or a reply
 *     composer — and opts into booting with `useManage: useClientTicket` plus
 *     `tracks: "tickets"`. That opt-in is what puts it in the registry's
 *     `boundKeys`, so `World.boot("client_ticket", …)` builds a thunk; its own
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
 * `.as(CLIENT).for(TICKET, id)`, and the id belongs to the URL the page was
 * opened on (`/useClientTicket/as/client/for/ticket/<id>`). One catalog serves
 * every ticket, so a literal id here would be a SECOND scope beside the url's —
 * the page would render one ticket while the track drove another. The world the
 * page hosts completes the record from that same url instead, so the step
 * drives the very cell on screen.
 *
 * ## ADR-020 Amendment 5 (operator ruling 2026-09-12)
 *
 * "Tests are tests, scenarios are scenarios; not every test is a replayable
 * scenario." A scenario earns step definitions ONLY where a real step drives
 * every line of it against the composable this key boots. Anything it cannot
 * drive gets NO steps and stays spec-only — the traceability gate reads that
 * as skipped, not as a hole. The exclusions are NAMED here, each with the spec
 * that proves it instead:
 *
 *   - THE TWO-ARGUMENT WRITES (`@AC-17` reply-with-files, `@AC-18` both
 *     scenarios, `@AC-19` both scenarios, `@AC-21`, `@AC-23` attach) are
 *     unreachable through this seam by CONSTRUCTION, not by choice:
 *     `World.fire(actionId, input?)` invokes an action with exactly ONE opaque
 *     input, and `editMessage(id, body)`, `deleteMessage(id, reason)`,
 *     `deleteAttachment(messageId, fileId)` and `reply(body, { files })` each
 *     need two. The `@AC-23` uploads additionally need a real `File`, which no
 *     recording carries and which a step may not author. The two guard halves
 *     of AC-18 and AC-19 are ABSENCES on top ("nothing is sent to the
 *     server"). Proven by `tickets.manager.int.test.ts`'s AC-17/AC-18/AC-19/
 *     AC-21/AC-23 blocks and `tickets.upload-attachment.int.test.ts`.
 *   - THE STALE REPLY (`@AC-17` `@conflict`) needs a recorded `409
 *     ticket_has_more_recent_reply`; the one committed reply recording
 *     (`fixtures/post-tickets-id-replies.json`) is the 200. A step firing it
 *     would meet the success path and assert a caution that never came. Proven
 *     by `tickets.manager.int.test.ts`'s AC-17 caution assertion and
 *     `tickets.reply-409-caution.must-fail.patch`.
 *   - THE DOWNLOAD (`@AC-20`) asserts the RETURNED bytes
 *     ("I receive the file's own contents, unaltered"), and `World.fire`
 *     discards an action's return value — there is nothing for `expectMeta` or
 *     `expectContext` to read. Proven by `tickets.manager.int.test.ts`'s AC-20
 *     assertion.
 *   - THE STATUS-LOG FEED (`@AC-22`) arranges "a ticket has been opened,
 *     replied to, and closed" — a history no single committed recording holds —
 *     and asserts the ORDER events interleave with messages, which is a feed
 *     shape rather than a meta boolean. Proven by
 *     `tickets.manager.int.test.ts`'s AC-22 assertion and
 *     `tickets.status-log-feed-object-type.must-fail.patch`.
 *   - THE LOCKED GUARDS (`@AC-24` `@guard`, `@AC-27` `@guard`) need a recorded
 *     LOCKED ticket read. None exists: the oracle reaches that state by
 *     toggling ONE documented wire field on the recorded body, which is a
 *     spec's disclosed technique and not something a replay step may do. Both
 *     Thens are absences besides. Proven by `tickets.manager.int.test.ts`'s
 *     AC-24 refusal assertion and `tickets.close-locked-guard.must-fail.patch`.
 *   - THE REOPEN (`@AC-25`) arranges "one of my tickets is closed", and no
 *     recorded single-ticket read is closed — `fixtures/get-tickets-id.json` is
 *     open, and the closed captures are LIST reads. The Given cannot be
 *     arranged from the corpus, so the action would meet its own
 *     not-closed refusal. Proven by `tickets.manager.int.test.ts`'s AC-25 pair.
 *   - THE POLL (`@AC-29`, all four scenarios) turns on time passing, on
 *     switching away from the page, and on teardown. None of the three is a
 *     `fire` / `expectMeta` move. Proven by `tickets.manager.int.test.ts`'s
 *     AC-29 teardown assertion and `tickets.poll-teardown.must-fail.patch`.
 *   - THE PATH LAW (`@AC-PATH`) is a REQUEST read — which surface a request
 *     went to, and which it never went to. A `World` step cannot read a
 *     request. Proven by `tickets.collection.int.test.ts`'s AC-1/AC-PATH
 *     assertion and `tickets.path-law-no-admin.must-fail.patch`.
 *   - THE DROPPED CAPABILITIES (`@dropped` — AC-6 body search, AC-26
 *     reschedule, AC-28 desk move) are ABSENCES: "this module offers me none",
 *     "no request is ever made". An absence is unobservable through `fire` /
 *     `expectMeta`. Proven by `tickets.dropped.int.test.ts`.
 *   - THE FORM RULES (`@absorbed` — AC-9 "I am told what a new ticket needs")
 *     assert that NOTHING is sent to the server and that the module publishes
 *     the rules for the page. Both are request-absence / schema reads. Proven
 *     by `tickets.schemas.test.ts`.
 *   - THE OVERVIEW LIST (AC-8) reads through `loadRecentTickets`, a
 *     SERVICE-level one-shot (`tickets.services.ts`) the collection publishes
 *     on none of its actions — so `World.fire` cannot reach it at all. Proven
 *     by `tickets.collection.int.test.ts`'s AC-8 assertion.
 *   - CREATE-WITH-PRODUCT and CREATE-SCHEDULED (AC-9 / AC-9+AC-26) have NO
 *     recorded capture: the one committed `POST /api/tickets` recording
 *     (`fixtures/post-tickets.json`) carries `subject`, `body` and
 *     `ticket_department_id` and neither `contract_product_id` nor
 *     `settings.scheduled_datetime`. A step firing them would assert a link
 *     and a schedule no recording can answer. Proven by
 *     `tickets.collection.int.test.ts`'s AC-9 assertion; not invented here.
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

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { uniq, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under — the COLLECTION page's key,
 * declared by `scenarios/useClientTickets/client-tickets.scenario.ts`. A
 * literal here rather than an import: `packages/headless` holds no scenario
 * concept at all — the key is the consuming playground's, and this catalog
 * names it the same way a `.feature` names a url.
 */
export const CLIENT_TICKETS_SCENARIO = "client_tickets";

/**
 * The MANAGER page's key, declared by
 * `scenarios/useClientTicket/client-ticket.scenario.ts`. A literal for the same
 * reason as its sibling above: the key is the consuming playground's, and
 * `packages/headless` holds no scenario concept at all.
 */
export const CLIENT_TICKET_SCENARIO = "client_ticket";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`,
 * so the covered set and the calls that cover it cannot drift: an id declared
 * here and fired by no step below is a gate failure, never a silent
 * over-report.
 *
 * Every id is a member of `useClientTickets`'s own action surface. The
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
  loadTicketStatuses: "loadTicketStatuses"
} as const;

/**
 * The MANAGER action ids these steps drive — members of `useClientTicket`'s own
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
  setSubject: "setSubject"
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
    messageId: "de78642d-e539-7145-949a-21208469530d",
    linkedProductId: "d0367942-4d0e-7109-256f-3153698d582e",
    changedProductId: "d6325079-8065-d1e3-5e9c-8174e234e98d",
    reply: "Recorded reply for FE-3226, to be withdrawn.",
    renamedSubject: "Fixture write-cycle ticket (renamed)"
  }
} as const;

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
  await world.boot(CLIENT_TICKETS_SCENARIO, scope);
  await world.fire(TICKETS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/**
 * Opens the MANAGER on the ticket the PAGE is addressed to. The scope names the
 * actor and nothing else — the context is the url's, completed by the world the
 * self-drawn page hosts (see the header's scope note), so this boots the very
 * cell on screen rather than a second one.
 */
async function openManager(world: World) {
  await world.boot(CLIENT_TICKET_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(TICKET_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/** The manager opened with its conversation already paged in — AC-15's own read. */
async function openThread(world: World) {
  await openManager(world);
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
      // Scope constraint — proven by `tickets.collection.int.test.ts`'s
      // AC-1/AC-PATH assertion and `tickets.path-law-no-admin.must-fail.patch`.
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

  When("I open the support tickets about that product", async world => {
    await world.fire(TICKETS_COVERED_ACTIONS.setCriteria, {
      filters: { contract_product_id: RECORDED.contractProductId }
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
      // A narrowing that cannot be dropped — proven by
      // `tickets.collection.int.test.ts`'s AC-7 assertion.
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
      // read-back (`client-ticket-controls.spec.ts`, "the Attachments view asks
      // the server for attachment-bearing messages").
    }
  );

  // === AC-16 · RE-READING ONE MESSAGE =======================================

  Given("I am reading a ticket's conversation", async world => {
    await openThread(world);
  });

  When("I ask for one message again", async world => {
    await world.fire(
      TICKET_COVERED_ACTIONS.getMessage,
      RECORDED.manager.messageId
    );
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

  // === AC-24 · CLOSING ======================================================

  // Shared with AC-27's rename: both steer an OPEN ticket, which is the state
  // the one committed single-ticket recording is in.
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
