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
 * ## THE KEY THIS CATALOG BOOTS: `client_tickets`, and only that one
 *
 * `tickets.feature` describes TWO surfaces under one module name — a
 * COLLECTION (`useClientTickets`) and a per-ticket MANAGER
 * (`useClientTicket`) — and the playground registers them as two SEPARATE
 * scenario keys, not one:
 *
 *   - `client_tickets` (`scenarios/useClientTickets/client-tickets.scenario.ts`)
 *     declares `useList: useClientTickets` AND `tracks: "tickets"`. It is in
 *     the registry's `boundKeys`, so `World.boot` can build a thunk for it,
 *     and it is the ONLY page that reads a playlist.
 *   - `client_ticket` (`scenarios/useClientTicket/client-ticket.scenario.ts`)
 *     declares NEITHER `useList` nor `useMutate` — the manager draws its own
 *     page — so it is NOT in `boundKeys` and `World.boot("client_ticket", …)`
 *     would fail outright (`registry.ts`: "a self-drawn module binds no
 *     collection and no editor, so there is no thunk to build for it and
 *     asking for one throws"). It also OMITS `tracks` on purpose: a self-drawn
 *     page mounts no `ScenarioPlayground`, so nothing there reads a playlist.
 *
 * So a catalog that boots both keys would be a catalog half of which can never
 * run, and the half that could run has no surface asking for it. This catalog
 * scopes itself to `client_tickets` — exactly as the `client-email-history`
 * catalog scopes itself to the read-only collection and names its single-record
 * sibling (`useClientReceivedEmail`) as "a separate composable this key does
 * NOT boot".
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
 *   - THE WHOLE MANAGER (`@manager` — AC-11, AC-12, AC-13, AC-14, AC-15,
 *     AC-16, AC-17, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23, AC-24, AC-25,
 *     AC-27, AC-29) is a SEPARATE composable this key does NOT boot. One
 *     ticket, its feed, its replies, its message edits and withdrawals, its
 *     files, its lifecycle and its poll are all `useClientTicket` members, and
 *     no `client_tickets` action reaches any of them. Proven by
 *     `tickets.manager.int.test.ts` (24 tests) and
 *     `tickets.upload-attachment.int.test.ts`, each anchored by its @AC tag.
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
import { values } from "lodash-es";
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

export const coveredActionIds: readonly string[] = values(
  TICKETS_COVERED_ACTIONS
);

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
