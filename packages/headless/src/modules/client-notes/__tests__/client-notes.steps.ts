// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-notes.feature`. Engine-free by construction: it imports `defineSteps`
 * and `World` and nothing else, so the same catalog can be re-registered
 * against any runner.
 *
 * A TRACK drives the vault and asserts what the drive changed (ADR-020 Am.5;
 * operator ruling 2026-09-12, the `client-billing-settings` precedent). Four
 * scenarios qualify on THIS corpus, and each drives a request the capture run
 * recorded and asserts the answer that came back:
 *
 * - `@AC-3` the label search (`filter[label|like]=%prover%`) — the one recorded
 *   row carrying a label comes back, where the default read answers with two
 *   unlabelled notes;
 * - `@AC-6` paging at the page size the capture run paged at (`limit=2`,
 *   `limit=2&offset=2`);
 * - `@AC-7` the order the server chose, then the label order in both directions;
 * - `@AC-11` reveal / hide / reveal of the one recorded secret.
 *
 * EVERY OTHER SCENARIO IS SPEC, deliberately, and the reason is the CORPUS
 * rather than the module (each is named against its own scenario below):
 *
 * - a WRITE never re-reads changed. The shared replay lands a mutation on its
 *   session rows, but this module's collection captures are pooled ahead of the
 *   single paged capture a mutation can land on, so the unmutated row wins the
 *   de-dupe. Pin (`@AC-8`), delete (`@AC-9`) and convert (`@AC-10`) each fire,
 *   are answered 200 by their own recordings, and leave the list exactly as it
 *   was — a step asserting the change would assert what the replay cannot show.
 * - no recorded row is PINNED (`filter[pinned|eq]=1` recorded `total: 0`) and
 *   none carries a CONTRACT PRODUCT, so `@AC-4` and `@AC-5` narrow to nothing.
 * - the default read is answered by the notes-only capture, so `@AC-1`'s "notes
 *   and secrets together" and `@AC-2`'s "together they account for everything"
 *   are not what comes back.
 * - a failed read or delete is unreachable: the recorded 404 delete is only
 *   addressable by its `case=` label, which the module never sends (`@AC-16`).
 * - "another client signs in on the same device" (`@AC-34`) is a precondition
 *   the `World` seam cannot stage.
 *
 * Contracts — scope addressing, request shape, "nothing is asked of the server"
 * — are spec here by construction, proven by the module's own integration tests
 * (`client-notes.collection.int.test.ts`'s `assertClientIdentityTransport` and
 * its siblings), never by a track.
 *
 * Every handler speaks to the module through the `World` members only. There is
 * no DOM read, no request read and no import of the module's own source here.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url. Matches `CLIENT_NOTES_SCENARIO` in
 * `useClientNotes/client-notes.scenario.ts` (the declaration's own key).
 */
export const CLIENT_NOTES_SCENARIO = "client_notes";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`,
 * so the covered set and the calls that cover it cannot drift: an id declared
 * here and fired by no step below is a gate failure, never a silent
 * over-report. `destroy`, `remove`, `setPinned` and `convert` are NOT here —
 * every scenario that drove one is spec on this corpus (module note above).
 */
export const CLIENT_NOTES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  filterBy: "filterBy",
  sortBy: "sortBy",
  nextPage: "nextPage",
  prevPage: "prevPage",
  setCriteria: "setCriteria",
  reveal: "reveal",
  hide: "hide"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_NOTES_COVERED_ACTIONS
);

/**
 * What the recordings actually hold, named here because a `World` step cannot
 * read the collection back to find it.
 *
 * @see fixtures/get-clients-id-vault-filter-encrypted-eq-0.json — the two
 * unlabelled notes the default read is answered with (`total: 2`).
 * @see fixtures/get-clients-id-vault-filter-encrypted-eq-1.json and
 * fixtures/get-clients-id-vault-filter-label-like-prover.json — the one
 * labelled secret, the only row either filter answers with.
 * @see fixtures/get-clients-id-vault-id-decrypt-case-first-reveal.json — the
 * plaintext the decrypt endpoint answers with.
 * @see fixtures/get-clients-id-vault-case-page-1.json and `-page-2.json` — the
 * page size the capture run paged at, and the total it paged over.
 */
const RECORDED = {
  secretId: "320e4357-95e7-8d18-45ea-31643202d986",
  secretLabel: "prover fixture secret 7383146",
  secretValue: "prover fixture secret value 7383146",
  pageSize: 2,
  pagedTotal: 4,
  /** The module's own default page — what a read naming no limit asks for. */
  defaultPageSize: 3
} as const;

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the collection settles on it. */
async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    try {
      return await assertion();
    } catch {
      await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
    }
  }
  return assertion();
}

async function open(world: World, scope: Parameters<World["boot"]>[1]) {
  await world.boot(CLIENT_NOTES_SCENARIO, scope);
  await world.fire(CLIENT_NOTES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
  );
}

// -----------------------------------------------------------------------------

export const clientNotesSteps = defineSteps(({ Given, When, Then }) => {
  // --- Background — every scenario inherits these three ---------------------

  Given("I am an authenticated client acting on my own vault", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  // `isAvailable` IS the brand gate: the services predicate it is handed
  // through from is true only while the brand's vault feature is switched on
  // (`useClientNotes.meta.ts`), so this reads the flag rather than staging it.
  Given("my brand has notes and secrets switched on", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Given(
    "every request I make is addressed to my own vault as that client",
    world => settles(() => world.expectMeta({ isAvailable: true }))
  );

  // --- AC-3 / AC-7: the label — searched for, then ordered by ---------------

  Given("my vault holds assets with different labels", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("I search my vault for part of a label", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      label: { like: "prover" }
    })
  );

  // The default read answers with two UNLABELLED notes, so this row can only be
  // here because the search reached the wire and the labelled row came back.
  Then(
    "I see only the assets whose label contains what I searched for",
    world =>
      settles(() =>
        world.expectContext({
          data: [{ id: RECORDED.secretId, label: RECORDED.secretLabel }]
        })
      )
  );

  When("I first open my vault", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.refresh)
  );

  // An expected `null` is CLEARED (the World's own match semantics): the read
  // carried no order of mine, so what came back is the order the server chose.
  Then(
    "I am given the order the server chooses, with my pinned assets brought forward",
    world => settles(() => world.expectContext({ query: { sort: null } }))
  );

  Then(
    "when I then ask for my vault ordered by label, I see it ordered by label",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.sortBy, [
        { field: "label", dir: "asc" }
      ]);
      await settles(() =>
        world.expectContext({
          query: { sort: [{ field: "label", dir: "asc" }] }
        })
      );
    }
  );

  Then(
    "asking for it in the opposite direction reverses that order",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.sortBy, [
        { field: "label", dir: "desc" }
      ]);
      await settles(() =>
        world.expectContext({
          query: { sort: [{ field: "label", dir: "desc" }] }
        })
      );
    }
  );

  // --- AC-6: a page at a time, at the size the capture run paged at ---------

  Given("my vault holds more assets than fit on one page", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: RECORDED.pageSize }
    });
    await settles(() =>
      world.expectContext({
        pagination: {
          limit: RECORDED.pageSize,
          total: RECORDED.pagedTotal,
          pages: 2
        }
      })
    );
  });

  When("I open my vault a page at a time", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.refresh)
  );

  Then(
    "I am given the first page of my assets and told how many I have in total",
    world =>
      settles(() =>
        world.expectContext({
          pagination: {
            page: 1,
            limit: RECORDED.pageSize,
            total: RECORDED.pagedTotal
          }
        })
      )
  );

  Then("I can move to the next page and back again", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.nextPage);
    await settles(() => world.expectContext({ pagination: { page: 2 } }));
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.prevPage);
    await settles(() => world.expectContext({ pagination: { page: 1 } }));
  });

  Then("I can ask for a larger or smaller page", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: RECORDED.defaultPageSize }
    });
    await settles(() =>
      world.expectContext({
        query: { pagination: { limit: RECORDED.defaultPageSize } }
      })
    );
  });

  // --- AC-11: reveal / hide / reveal ----------------------------------------
  //
  // `revealed` is a `World.context` member only — the presentation never draws
  // it on a cell (client-notes.presentation.ts), so these Thens read `revealed`
  // and never a table cell.

  Given(
    "one of my vault assets is a secret shown to me masked",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        encrypted: { eq: true }
      });
      // `note: ""` IS the mask — the mapper blanks an encrypted row's body.
      await settles(() =>
        world.expectContext({
          data: [{ id: RECORDED.secretId, encrypted: true, note: "" }]
        })
      );
    }
  );

  When("I ask to see it", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.reveal, RECORDED.secretId)
  );

  Then("I am shown its real value", world =>
    settles(() =>
      world.expectContext({
        revealed: { [RECORDED.secretId]: RECORDED.secretValue }
      })
    )
  );

  Then(
    "hiding it again masks it without asking the server anything",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.hide, RECORDED.secretId);
      await settles(() =>
        world.expectContext({ revealed: { [RECORDED.secretId]: null } })
      );
    }
  );

  Then(
    "asking to see it a second time fetches it again, because its value was never kept",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.reveal, RECORDED.secretId);
      await settles(() =>
        world.expectContext({
          revealed: { [RECORDED.secretId]: RECORDED.secretValue }
        })
      );
    }
  );
});

export default clientNotesSteps;
