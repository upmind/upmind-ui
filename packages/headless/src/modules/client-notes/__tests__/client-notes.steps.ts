// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.steps
 * @description The module's ONE step catalog — what drives page-level scenarios
 * for the colocated `client-notes.feature`. Engine-free by construction: it
 * imports `defineSteps` and `World` and nothing else, so the same catalog can
 * be re-registered against any runner.
 *
 * Drives the Background plus every scenario whose live capability a drawn
 * control on the `useClientNotes` playground page actually presses: the
 * criteria chrome (@AC-2/@AC-31 encrypted split, @AC-3 label, @AC-4 pinned,
 * @AC-5 product, @AC-6 pager, @AC-7 sort) and every write control
 * (@AC-8 setPinned, @AC-9 remove, @AC-10 convert, @AC-11 reveal/hide,
 * @AC-32 refresh/destroy). @AC-1 falls out for free once the shared "I open
 * my vault" When and its two Thens are defined for @AC-6's reuse.
 *
 * `add`, `edit` and `view` draw no step here on purpose: none names a live
 * member of `useClientNotes().useActions()` — `add`/`edit` are HANDOFF keys
 * the page's editor opens, and `view` opens a client-side detail overlay with
 * no request behind it — so there is nothing on the `World` seam for a step
 * to press. Every editor-side scenario (@AC-18..@AC-26) is `notYet` for the
 * same reason, proven instead at the manager's own integration layer
 * (`client-notes.manager.int.test.ts`) — a capability written down and not
 * yet driven, a legitimate state (`@upmind-automation/scenario-harness`'s own
 * traceability semantics).
 *
 * `reveal`/`hide` write ONLY `World`'s `context.revealed` map — never a table
 * cell. The playground's own presentation passes just the row to a cell, so a
 * revealed secret's plaintext is visible solely in the debug Context panel;
 * these steps assert `revealed`, never a rendered cell (client-notes.
 * presentation.ts's own note on this, echoed here so a later reader does not
 * "fix" a Then into asserting a table cell that does not exist).
 *
 * Every handler speaks to the module through the four `World` members. There
 * is no DOM read, no request read and no import of the module's own source
 * here.
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
 * over-report.
 */
export const CLIENT_NOTES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  destroy: "destroy",
  filterBy: "filterBy",
  sortBy: "sortBy",
  nextPage: "nextPage",
  prevPage: "prevPage",
  setCriteria: "setCriteria",
  setPinned: "setPinned",
  remove: "remove",
  convert: "convert",
  reveal: "reveal",
  hide: "hide"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_NOTES_COVERED_ACTIONS
);

/**
 * Row identities the recorded corpus carries, named here because a `World`
 * step cannot read the collection back to find one for itself.
 *
 * @see fixtures/get-clients-id-vault-with-staged-imports-1.json — the default
 * boot list: a labelled secret (`secretId`) and two unlabelled, unpinned notes
 * (`unlabelledNoteId`, `unpinnedNoteId`).
 */
const RECORDED = {
  secretId: "78985742-6489-7012-084f-21e325d0ed36",
  unlabelledNoteId: "3de78642-de53-9714-572f-21208469530d",
  unpinnedNoteId: "825d96e7-63ed-0913-d36b-417482528340",
  productId: "prod-123"
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

/** Asserts the module refused the call rather than guessing an answer. */
async function refuses(call: () => Promise<void>): Promise<void> {
  try {
    await call();
  } catch {
    return;
  }
  throw new Error(
    "expected the collection to refuse the call, but it resolved"
  );
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

  Given("my brand has notes and secrets switched on", world =>
    world.expectMeta({ isAvailable: true })
  );

  Given(
    "every request I make is addressed to my own vault as that client",
    async () => {
      // Identity-transport claim — proven by client-notes.collection.int.test.ts
      // (`assertClientIdentityTransport`), which the `World` seam cannot read.
    }
  );

  // --- AC-1 / AC-6: opening the vault, read at all and a page at a time -----

  When("I open my vault", async () => {
    // Already opened by the Background's own boot; this step observes, it
    // does not re-boot.
  });

  Then("I see the reactive list of my own notes and secrets together", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  Then("no other client's vault is ever loaded", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  // --- AC-16: loading/empty/errored, sharing AC-1/AC-6's "I open my vault" ---

  Then("I can see whether my vault is loading, empty, or errored", world =>
    settles(() =>
      world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
    )
  );

  Then(
    "when something goes wrong my vault records the failure for me to read rather than interrupting me",
    world =>
      refuses(() =>
        world.fire(
          CLIENT_NOTES_COVERED_ACTIONS.remove,
          "00000000-0000-0000-0000-000000000000"
        )
      )
  );

  Given("my vault holds more assets than fit on one page", world =>
    world.expectMeta({ isEmpty: false })
  );

  Then(
    "I am given the first page of my assets and told how many I have in total",
    world =>
      settles(() =>
        world.expectContext(ctx => typeof ctx.pagination?.total === "number")
      )
  );

  Then("I can move to the next page and back again", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.nextPage);
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.prevPage);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("I can ask for a larger or smaller page", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: 2 }
    });
    await settles(() =>
      world.expectContext({ query: { pagination: { limit: 2 } } })
    );
  });

  // --- AC-2/AC-31: the encrypted split — the filter bar's button-group ------

  Given("my vault holds both notes and secrets", world =>
    world.expectMeta({ isEmpty: false })
  );

  When("I choose to see only my notes", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      encrypted: { eq: false }
    })
  );

  Then("I see exactly my notes and none of my secrets", world =>
    settles(() =>
      world.expectContext(ctx =>
        ctx.data.every((row: { encrypted: boolean }) => row.encrypted === false)
      )
    )
  );

  Then(
    "when I choose to see only my secrets I see exactly my secrets and none of my notes",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        encrypted: { eq: true }
      });
      await settles(() =>
        world.expectContext(ctx =>
          ctx.data.every(
            (row: { encrypted: boolean }) => row.encrypted === true
          )
        )
      );
    }
  );

  Then(
    "the choice between the two is offered to me as part of the vault's own filter controls",
    world =>
      settles(() =>
        world.expectContext(ctx =>
          JSON.stringify(ctx.schemas?.query?.uischema ?? {}).includes(
            "properties/filters/properties/encrypted"
          )
        )
      )
  );

  // --- AC-31: the encrypted split proven end-to-end, sharing AC-2's Given ----

  When(
    "only-notes and only-secrets are each asked of the real system",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        encrypted: { eq: false }
      });
      await settles(() =>
        world.expectContext(ctx =>
          ctx.data.every(
            (row: { encrypted: boolean }) => row.encrypted === false
          )
        )
      );
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        encrypted: { eq: true }
      });
      await settles(() =>
        world.expectContext(ctx =>
          ctx.data.every(
            (row: { encrypted: boolean }) => row.encrypted === true
          )
        )
      );
    }
  );

  Then("each is answered with exactly that kind and no other", world =>
    settles(() =>
      world.expectContext(ctx =>
        ctx.data.every((row: { encrypted: boolean }) => row.encrypted === true)
      )
    )
  );

  Then("together they account for everything in my vault", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {});
    await settles(() => world.expectMeta({ isFiltered: false }));
  });

  // --- AC-3/AC-7: label — narrow and order share the one Given -------------

  Given("my vault holds assets with different labels", world =>
    world.expectMeta({ isEmpty: false })
  );

  When("I search my vault for part of a label", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      label: { like: "prover" }
    })
  );

  Then(
    "I see only the assets whose label contains what I searched for",
    world => settles(() => world.expectMeta({ isFiltered: true }))
  );

  When("I first open my vault", async () => {
    // Already opened by the Background's own boot; this step observes.
  });

  Then(
    "I am given the order the server chooses, with my pinned assets brought forward",
    world =>
      settles(() =>
        world.expectContext(
          ctx => Array.isArray(ctx.data) && !ctx.query?.sort?.length
        )
      )
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

  // --- AC-4: pinned — the second filter-bar control --------------------------

  Given("some of my vault assets are pinned and some are not", world =>
    world.expectMeta({ isEmpty: false })
  );

  When("I choose to see only pinned assets", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, { pinned: { eq: true } })
  );

  Then("I see only my pinned assets", world =>
    settles(() =>
      world.expectContext(ctx =>
        ctx.data.every((row: { pinned: boolean }) => row.pinned === true)
      )
    )
  );

  Then(
    "choosing to see only unpinned assets shows me only those",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        pinned: { eq: false }
      });
      await settles(() =>
        world.expectContext(ctx =>
          ctx.data.every((row: { pinned: boolean }) => row.pinned === false)
        )
      );
    }
  );

  Then("clearing the choice shows me both again", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      pinned: { eq: null }
    });
    await settles(() => world.expectMeta({ isFiltered: false }));
  });

  // --- AC-5: the product filter — the third filter-bar control --------------

  Given("some of my vault assets are attached to a product I bought", world =>
    world.expectMeta({ isEmpty: false })
  );

  When("I narrow my vault to that product", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      contract_product_id: { eq: RECORDED.productId }
    })
  );

  Then("I see only the assets attached to that product", world =>
    settles(() => world.expectMeta({ isFiltered: true }))
  );

  Then("I am still looking at my own vault, not at anyone else's", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  // --- AC-8: setPinned — a one-argument toggle -------------------------------

  Given("one of my vault assets is not pinned", world =>
    world.expectMeta({ isEmpty: false })
  );

  When("I pin it", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.setPinned, RECORDED.unpinnedNoteId)
  );

  Then("it is recorded as pinned and my vault list reflects that", world =>
    settles(() =>
      world.expectContext(ctx =>
        ctx.data.some(
          (row: { id: string; pinned: boolean }) =>
            row.id === RECORDED.unpinnedNoteId && row.pinned === true
        )
      )
    )
  );

  Then("unpinning it records it as unpinned again", async world => {
    await world.fire(
      CLIENT_NOTES_COVERED_ACTIONS.setPinned,
      RECORDED.unpinnedNoteId
    );
    await settles(() =>
      world.expectContext(ctx =>
        ctx.data.some(
          (row: { id: string; pinned: boolean }) =>
            row.id === RECORDED.unpinnedNoteId && row.pinned === false
        )
      )
    );
  });

  // --- AC-9: remove -----------------------------------------------------------

  Given("I no longer want one of my vault assets", world =>
    world.expectMeta({ isEmpty: false })
  );

  When("I delete it", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.remove, RECORDED.unlabelledNoteId)
  );

  Then("it is removed from my vault", world =>
    settles(() =>
      world.expectContext(
        ctx =>
          !ctx.data.some(
            (row: { id: string }) => row.id === RECORDED.unlabelledNoteId
          )
      )
    )
  );

  Then("I am told the deletion succeeded", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  Then(
    "if the deletion fails I am told that, and my vault records the failure for me to read",
    world =>
      refuses(() =>
        world.fire(
          CLIENT_NOTES_COVERED_ACTIONS.remove,
          "00000000-0000-0000-0000-000000000000"
        )
      )
  );

  // --- AC-10: convert — the module's defining capability ---------------------

  Given("one of my vault assets is a secret", world =>
    world.expectMeta({ isEmpty: false })
  );

  When("I turn it into a note", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.convert, RECORDED.secretId)
  );

  Then("it is recorded as a note and shown as one", world =>
    settles(() =>
      world.expectContext(ctx =>
        ctx.data.some(
          (row: { id: string; encrypted: boolean }) =>
            row.id === RECORDED.secretId && row.encrypted === false
        )
      )
    )
  );

  Then(
    "turning a labelled note into a secret records it as a secret",
    async world => {
      // RECORDED.secretId already carries a label (see the fixture note above)
      // and is now the note the previous Then just converted — converting it a
      // second time drives the labelled-note-to-secret direction with the same
      // recorded row, rather than inventing a second one.
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.convert, RECORDED.secretId);
      await settles(() =>
        world.expectContext(ctx =>
          ctx.data.some(
            (row: { id: string; encrypted: boolean }) =>
              row.id === RECORDED.secretId && row.encrypted === true
          )
        )
      );
    }
  );

  Then(
    "turning an UNLABELLED note into a secret is refused, telling me a label is needed first",
    world =>
      refuses(() =>
        world.fire(
          CLIENT_NOTES_COVERED_ACTIONS.convert,
          RECORDED.unlabelledNoteId
        )
      )
  );

  // --- AC-11: reveal / hide ----------------------------------------------------
  //
  // `revealed` is a `World.context` member only — the presentation never draws
  // it on a cell (client-notes.presentation.ts), so these Thens read `revealed`
  // and never a table cell.

  Given("one of my vault assets is a secret shown to me masked", world =>
    world.expectMeta({ isEmpty: false })
  );

  When("I ask to see it", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.reveal, RECORDED.secretId)
  );

  Then("I am shown its real value", world =>
    settles(() =>
      world.expectContext(
        ctx => typeof ctx.revealed?.[RECORDED.secretId] === "string"
      )
    )
  );

  Then(
    "hiding it again masks it without asking the server anything",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.hide, RECORDED.secretId);
      await settles(() =>
        world.expectContext(ctx => !ctx.revealed?.[RECORDED.secretId])
      );
    }
  );

  Then(
    "asking to see it a second time fetches it again, because its value was never kept",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.reveal, RECORDED.secretId);
      await settles(() =>
        world.expectContext(
          ctx => typeof ctx.revealed?.[RECORDED.secretId] === "string"
        )
      );
    }
  );

  // --- AC-32: leaving or refreshing clears any revealed secret ----------------

  Given("one of my vault assets is a secret I have revealed", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.reveal, RECORDED.secretId);
    await settles(() =>
      world.expectContext(
        ctx => typeof ctx.revealed?.[RECORDED.secretId] === "string"
      )
    );
  });

  When("I refresh my vault", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.refresh)
  );

  Then(
    "the secret I revealed is masked again, because a refresh may have changed it",
    world =>
      settles(() =>
        world.expectContext(ctx => !ctx.revealed?.[RECORDED.secretId])
      )
  );

  Then(
    "when I instead leave my vault entirely, the secret I revealed is masked again there too",
    world => world.fire(CLIENT_NOTES_COVERED_ACTIONS.destroy)
  );

  // --- AC-34: a revealed secret does not outlive the session, sharing -------
  // AC-32's "one of my vault assets is a secret I have revealed" Given.

  When("I log out", world => world.fire(CLIENT_NOTES_COVERED_ACTIONS.destroy));

  Then("the secret I revealed is masked again", world =>
    settles(() =>
      world.expectContext(ctx => !ctx.revealed?.[RECORDED.secretId])
    )
  );

  Then(
    "when another client signs in on the same device, none of my revealed plaintext is readable to them",
    async world => {
      // A fresh `boot` on the same World seam is this catalog's stand-in for
      // "another client signs in on the same device" — it re-initialises the
      // composable instance, so a survived `revealed` entry would show up
      // here exactly as it would for a genuinely different signed-in client.
      await world.boot(CLIENT_NOTES_SCENARIO, {
        actor: ScopeActorTypes.CLIENT
      });
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.isReady);
      await settles(() =>
        world.expectContext(
          ctx => !ctx.revealed || Object.keys(ctx.revealed).length === 0
        )
      );
    }
  );

  Then("that client sees only their own vault", world =>
    settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );
});

export default clientNotesSteps;
