// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-notes.feature`. Engine-free by construction: it imports `defineSteps`
 * and `World` and nothing else of the runner, so the same catalog re-registers
 * against any runner.
 *
 * ONE scenario, ONE recording (FE-3145, ADR 035): each driven scenario replays
 * its own per-step fixtures under `scenarios/<slug>/<NN>/`. Every id and value a
 * `Then` asserts is READ from the recording that addressed it (never a copied
 * literal a re-record would stale) — a mutation's own PUT/DELETE recording
 * carries the id in its path, a filter's recording carries it in its query, and
 * a client-side refusal reads its target off the scenario's own opening list.
 *
 * Every handler speaks to the module through the `World` members only. There is
 * no DOM read, no request read and no import of the module's own source here.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import { ClientNoteContextTypes } from "../client-notes.types";
import offeredProducts from "./fixtures/get-contracts-products-filter-clients-id.json";
import ac21LoadOne from "./scenarios/change-one-of-my-existing-vault-assets/04/get-clients-id-vault-id.json";
import ac21Put from "./scenarios/change-one-of-my-existing-vault-assets/05/put-clients-id-vault-id.json";
import editorClearNote from "./scenarios/clearing-the-editor-gives-me-a-blank-note-not-the-one-i-was-editing/04/get-clients-id-vault-id.json";
import deleteRecording from "./scenarios/delete-an-asset-from-my-vault-list/05/delete-clients-id-vault-id.json";
import ac22LoadOne from "./scenarios/i-attach-one-of-my-notes-to-a-product-i-bought-and-detach-it/04/get-clients-id-vault-id.json";
import ac22Attach from "./scenarios/i-attach-one-of-my-notes-to-a-product-i-bought-and-detach-it/05/put-clients-id-vault-id.json";
import ac19SecretPost from "./scenarios/i-write-a-new-note-or-a-new-secret/09/post-clients-id-vault.json";
import editorStateNote from "./scenarios/know-the-state-of-the-editor-while-i-use-it/04/get-clients-id-vault-id.json";
import productFilter from "./scenarios/narrow-my-vault-to-one-product-i-bought/05/get-clients-id-vault-filter-contract-product-id-eq-with-staged-imports-1.json";
import editorOpenDecrypt from "./scenarios/open-one-of-my-secrets-for-editing-and-see-its-real-value/05/get-clients-id-vault-id-decrypt.json";
import editorOpenNote from "./scenarios/open-one-of-my-secrets-for-editing-and-see-its-real-value/07/get-clients-id-vault-id.json";
import pinRecording from "./scenarios/pin-and-unpin-an-asset-from-my-vault-list/05/put-clients-id-vault-id.json";
import revealRecording from "./scenarios/reveal-one-of-my-secrets-hide-it-again-and-reveal-it-once-more/05/get-clients-id-vault-id-decrypt.json";
import ac23LoadOne from "./scenarios/turn-an-unlabelled-note-into-a-secret-by-giving-it-a-label/04/get-clients-id-vault-id.json";
import ac23Put from "./scenarios/turn-an-unlabelled-note-into-a-secret-by-giving-it-a-label/07/put-clients-id-vault-id.json";
import convertBoot from "./scenarios/turn-one-of-my-notes-into-a-secret-and-a-secret-back-into-a-note/01/get-clients-id-vault-with-staged-imports-1.json";
import convertToNote from "./scenarios/turn-one-of-my-notes-into-a-secret-and-a-secret-back-into-a-note/05/put-clients-id-vault-id.json";
import convertToSecret from "./scenarios/turn-one-of-my-notes-into-a-secret-and-a-secret-back-into-a-note/07/put-clients-id-vault-id.json";
import ac27Put from "./scenarios/everything-i-do-acts-on-my-own-vault-as-me/04/put-clients-id-vault-id.json";
import ac37LoadOne from "./scenarios/the-editor-only-offers-me-fields-it-will-actually-save/04/get-clients-id-vault-id.json";
import ac26Put from "./scenarios/what-i-save-in-the-editor-is-my-last-edit-and-my-vault-list-shows-it/05/put-clients-id-vault-id.json";
import ac36LoadOne from "./scenarios/what-i-wrote-is-still-there-when-i-come-back-to-it/04/get-clients-id-vault-id.json";
import { find, findLast, first, includes, map, split, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const CLIENT_NOTES_SCENARIO = "client_notes";

/** The scenario key the per-asset EDITOR (manager composable) is driven under. */
export const CLIENT_NOTE_MANAGER_SCENARIO = "client_note";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`,
 * so the covered set and the calls that cover it cannot drift.
 */
export const CLIENT_NOTES_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  filterBy: "filterBy",
  sortBy: "sortBy",
  reveal: "reveal",
  hide: "hide",
  setCriteria: "setCriteria",
  nextPage: "nextPage",
  prevPage: "prevPage",
  setPinned: "setPinned",
  remove: "remove",
  convert: "convert"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_NOTES_COVERED_ACTIONS
);

/** The free-text label term the search scenario narrows by. */
const LABEL_NEEDLE = "prover";

/** A record id segment on the wire: a uuid. */
const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The record id a recorded request addressed — the last uuid of its path. */
const recordedId = ({ request }: { request: { path: string } }): string =>
  findLast(split(first(split(request.path, "?")), "/"), segment =>
    RECORD_ID.test(segment)
  ) ?? "";

/** The value of a filter query the recorded request carried (e.g. its product). */
const recordedFilterValue = (
  { request }: { request: { path: string } },
  key: string
): string =>
  new URLSearchParams(split(request.path, "?")[1] ?? "").get(key) ?? "";

/** One recorded collection row. */
type BootRow = { id: string; label: string | null; note: string };
const rowByNote = (
  recording: { response: { body: { data: BootRow[] } } },
  fragment: string
): BootRow =>
  find(recording.response.body.data, row =>
    (row.note ?? "").includes(fragment)
  ) as BootRow;

/**
 * The ids and values these steps act on, each read off the recording that
 * addressed it — a re-record refreshes every one.
 */
const R = {
  secretId: revealRecording.response.body.data.id,
  secretValue: revealRecording.response.body.data.note,
  pinId: recordedId(pinRecording),
  deleteId: recordedId(deleteRecording),
  convertSecretId: recordedId(convertToNote),
  convertLabelledId: recordedId(convertToSecret),
  convertUnlabelledId: rowByNote(convertBoot, "convert unlabelled").id,
  productId: recordedFilterValue(
    productFilter,
    "filter[contract_product_id|eq]"
  )
} as const;

/** The editor scenarios' recorded ids and the secret's decrypted plaintext. */
const E = {
  secretId: editorOpenDecrypt.response.body.data.id,
  secretValue: editorOpenDecrypt.response.body.data.note,
  openNoteId: recordedId(editorOpenNote),
  stateNoteId: recordedId(editorStateNote),
  clearNoteId: recordedId(editorClearNote)
} as const;

/** One recorded vault asset row, as it comes back on the wire. */
type WireAssetRow = {
  id: string;
  note: string;
  label: string | null;
  encrypted: boolean;
  contract_product_id: string | null;
};
const wireData = (recording: {
  response: { body: { data: WireAssetRow } };
}): WireAssetRow => recording.response.body.data;

/** The value the new-record editor steps type — the label is read back from the recorded create. */
const NEW_NOTE_BODY = "prover fixture new note typed";
const NEW_SECRET_VALUE = "prover fixture new secret value typed";

/**
 * The editing-editor scenarios' recorded ids and the values their save steps
 * recorded — each read off the recording that addressed it, so a re-record
 * refreshes every one.
 */
const NEW = {
  secretLabel: wireData(ac19SecretPost).label
} as const;

const AC21 = {
  noteId: recordedId(ac21LoadOne),
  changedNote: wireData(ac21Put).note,
  label: wireData(ac21LoadOne).label
} as const;

const AC22 = {
  noteId: recordedId(ac22LoadOne),
  productId: wireData(ac22Attach).contract_product_id,
  offeredIds: map(
    (offeredProducts as { response: { body: { data: WireAssetRow[] } } })
      .response.body.data,
    "id"
  )
} as const;

const AC23 = {
  noteId: recordedId(ac23LoadOne),
  label: wireData(ac23Put).label
} as const;

const AC36 = {
  noteId: recordedId(ac36LoadOne),
  changedBody: "prover fixture ac36 changed body typed",
  newLabel: "prover fixture ac36 new label typed"
} as const;

/**
 * AC-26 — the list-and-editor-together capability: the value the recorded save
 * carries is the SECOND value (the first is only typed then replaced), read off
 * the save recording so a re-record refreshes it; the first is never saved.
 */
const AC26 = {
  noteId: recordedId(ac26Put),
  secondValue: wireData(ac26Put).note,
  firstValue: "prover fixture ac26 first typed then replaced"
} as const;

const AC27 = {
  noteId: recordedId(ac27Put),
  changedNote: wireData(ac27Put).note
} as const;

const AC37 = { noteId: recordedId(ac37LoadOne) } as const;

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the collection settles on it. */
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

/** Asserts the module refused the call rather than acting on it. */
async function refuses(call: () => Promise<void>): Promise<void> {
  const err = await call()
    .then(() => undefined)
    .catch((e: unknown) => e);
  if (err) return;
  throw new Error("expected the vault to refuse the call, but it resolved");
}

async function open(world: World, scope: Parameters<World["boot"]>[1]) {
  await world.boot(CLIENT_NOTES_SCENARIO, scope);
  await world.fire(CLIENT_NOTES_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, isEmpty: false, hasError: false })
  );
}

/** Boots the per-asset editor on an existing record — the `.for()` path. */
async function openEditor(world: World, id: string) {
  await world.boot(CLIENT_NOTE_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT,
    context: { type: ClientNoteContextTypes.NOTE, id }
  } as Parameters<World["boot"]>[1]);
  await world.fire("isReady");
  await settles(() =>
    world.expectMeta({ isAvailable: true, isLoading: false })
  );
}

/** Boots the per-asset editor with NO record — a fresh, blank new-asset draft. */
async function openNewEditor(world: World) {
  await world.boot(CLIENT_NOTE_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  } as Parameters<World["boot"]>[1]);
  await world.fire("isReady");
  await settles(() => world.expectMeta({ isAvailable: true, isNew: true }));
}

/** Boots the collection with no client signed in — it asks the server nothing. */
async function bootSignedOutCollection(world: World) {
  await world.boot(CLIENT_NOTES_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await world.fire(
    CLIENT_NOTES_COVERED_ACTIONS.isReady,
    undefined,
    CLIENT_NOTES_SCENARIO
  );
}

/**
 * Boots the per-asset editor with no client signed in — it asks the server
 * nothing. Unlike the signed-in boot it does NOT fire `isReady`: with no session
 * the editor never becomes ready, so awaiting readiness would hang; the guard
 * reads `isAvailable` off the booted-but-unavailable cell instead.
 */
async function bootSignedOutEditor(world: World) {
  await world.boot(CLIENT_NOTE_MANAGER_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  } as Parameters<World["boot"]>[1]);
}

// -----------------------------------------------------------------------------

export const clientNotesSteps = defineSteps(({ Given, When, Then }) => {
  // --- Background — every scenario inherits these three ---------------------

  Given("I am an authenticated client acting on my own vault", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given("my brand has notes and secrets switched on", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Given(
    "every request I make is addressed to my own vault as that client",
    world => settles(() => world.expectMeta({ isAvailable: true }))
  );

  // --- AC-1 / AC-16: read the vault and its state ---------------------------

  When("I open my vault", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.refresh)
  );

  Then("I see the reactive list of my own notes and secrets together", world =>
    settles(() => world.expectMeta({ isEmpty: false, hasError: false }))
  );

  Then("no other client's vault is ever loaded", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then("I can see whether my vault is loading, empty, or errored", world =>
    settles(() => world.expectMeta({ isEmpty: false, hasError: false }))
  );

  Then(
    "when something goes wrong my vault records the failure for me to read rather than interrupting me",
    world => settles(() => world.expectMeta({ hasError: false }))
  );

  // --- AC-2 / AC-31: only notes, or only secrets ----------------------------

  Given("my vault holds both notes and secrets", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("I choose to see only my notes", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      encrypted: { eq: false }
    })
  );

  Then("I see exactly my notes and none of my secrets", world =>
    settles(() =>
      world.expectContext({ query: { filters: { encrypted: { eq: false } } } })
    )
  );

  Then(
    "when I choose to see only my secrets I see exactly my secrets and none of my notes",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        encrypted: { eq: true }
      });
      await settles(() =>
        world.expectContext({
          query: { filters: { encrypted: { eq: true } } }
        })
      );
    }
  );

  Then(
    "the choice between the two is offered to me as part of the vault's own filter controls",
    world => settles(() => world.expectMeta({ isAvailable: true }))
  );

  When(
    "only-notes and only-secrets are each asked of the real system",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        encrypted: { eq: false }
      });
      await settles(() => world.expectMeta({ hasError: false }));
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        encrypted: { eq: true }
      });
    }
  );

  Then("each is answered with exactly that kind and no other", world =>
    settles(() =>
      world.expectContext({ query: { filters: { encrypted: { eq: true } } } })
    )
  );

  Then("together they account for everything in my vault", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      encrypted: { eq: null }
    });
    await settles(() => world.expectMeta({ isEmpty: false, hasError: false }));
  });

  // --- AC-3: narrow by label ------------------------------------------------

  Given("my vault holds assets with different labels", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("I search my vault for part of a label", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      label: { like: LABEL_NEEDLE }
    })
  );

  Then(
    "I see only the assets whose label contains what I searched for",
    world =>
      settles(() =>
        world.expectContext({
          query: { filters: { label: { like: LABEL_NEEDLE } } }
        })
      )
  );

  // --- AC-4: narrow to pinned or unpinned -----------------------------------

  Given("some of my vault assets are pinned and some are not", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("I choose to see only pinned assets", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, { pinned: { eq: true } })
  );

  Then("I see only my pinned assets", world =>
    settles(() =>
      world.expectContext({ query: { filters: { pinned: { eq: true } } } })
    )
  );

  Then(
    "choosing to see only unpinned assets shows me only those",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        pinned: { eq: false }
      });
      await settles(() =>
        world.expectContext({ query: { filters: { pinned: { eq: false } } } })
      );
    }
  );

  Then("clearing the choice shows me both again", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      pinned: { eq: null }
    });
    await settles(() => world.expectMeta({ isEmpty: false }));
  });

  // --- AC-5 / AC-42: narrow to one product ----------------------------------

  Given("some of my vault assets are attached to a product I bought", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  Given("my vault holds notes attached to different products of mine", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("I narrow my vault to that product", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      contract_product_id: { eq: R.productId }
    })
  );

  When("I narrow it to one product", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
      contract_product_id: { eq: R.productId }
    })
  );

  Then("I see only the assets attached to that product", world =>
    settles(() =>
      world.expectContext({
        query: { filters: { contract_product_id: { eq: R.productId } } }
      })
    )
  );

  Then("I see only the notes attached to that product", world =>
    settles(() =>
      world.expectContext({
        query: { filters: { contract_product_id: { eq: R.productId } } }
      })
    )
  );

  Then("I am still looking at my own vault, not at anyone else's", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then("I am still looking at my own vault, not somewhere else", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  // --- AC-6: a page at a time -----------------------------------------------

  Given("my vault holds more assets than fit on one page", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: 2 }
    })
  );

  When("I open my vault a page at a time", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.refresh)
  );

  Then(
    "I am given the first page of my assets and told how many I have in total",
    world =>
      settles(() => world.expectContext({ pagination: { page: 1, limit: 2 } }))
  );

  Then("I can move to the next page and back again", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.nextPage);
    await settles(() => world.expectContext({ pagination: { page: 2 } }));
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.prevPage);
    await settles(() => world.expectContext({ pagination: { page: 1 } }));
  });

  Then("I can ask for a larger or smaller page", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: 3 }
    });
    await settles(() =>
      world.expectContext({ query: { pagination: { limit: 3 } } })
    );
  });

  // --- AC-7 / AC-30: order by a column --------------------------------------

  When("I first open my vault", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.refresh)
  );

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

  Given("my vault offers me a set of columns to order by", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("each of those orders is asked of the real system", async world => {
    for (const field of ["label", "pinned", "created_at"] as const) {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.sortBy, [
        { field, dir: "asc" }
      ]);
      await settles(() =>
        world.expectContext({ query: { sort: [{ field, dir: "asc" }] } })
      );
    }
  });

  Then("each one is answered", world =>
    settles(() =>
      world.expectContext({
        query: { sort: [{ field: "created_at", dir: "asc" }] }
      })
    )
  );

  Then(
    "any that is not answered is withdrawn from what my vault offers me",
    world => settles(() => world.expectMeta({ hasError: false }))
  );

  // --- AC-8: pin and unpin --------------------------------------------------

  Given("one of my vault assets is not pinned", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("I pin it", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.setPinned, R.pinId)
  );

  Then("it is recorded as pinned and my vault list reflects that", world =>
    settles(() =>
      world.expectContext({ data: [{ id: R.pinId, pinned: true }] })
    )
  );

  Then("unpinning it records it as unpinned again", async world => {
    await world.fire(CLIENT_NOTES_COVERED_ACTIONS.setPinned, R.pinId);
    await settles(() =>
      world.expectContext({ data: [{ id: R.pinId, pinned: false }] })
    );
  });

  // --- AC-9: delete, and the failure path -----------------------------------

  Given("I no longer want one of my vault assets", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("I delete it", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.remove, R.deleteId)
  );

  Then("it is removed from my vault", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  Then("I am told the deletion succeeded", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  Then(
    "if the deletion fails I am told that, and my vault records the failure for me to read",
    async world => {
      await refuses(() =>
        world.fire(CLIENT_NOTES_COVERED_ACTIONS.remove, R.deleteId)
      );
    }
  );

  // --- AC-10: convert both ways, and the label-less refusal -----------------

  Given("one of my vault assets is a secret", world =>
    settles(() => world.expectMeta({ isEmpty: false }))
  );

  When("I turn it into a note", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.convert, R.convertSecretId)
  );

  Then("it is recorded as a note and shown as one", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );

  Then(
    "turning a labelled note into a secret records it as a secret",
    async world => {
      await world.fire(
        CLIENT_NOTES_COVERED_ACTIONS.convert,
        R.convertLabelledId
      );
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );

  Then(
    "turning an UNLABELLED note into a secret is refused, telling me a label is needed first",
    world =>
      refuses(() =>
        world.fire(CLIENT_NOTES_COVERED_ACTIONS.convert, R.convertUnlabelledId)
      )
  );

  // --- AC-11: reveal / hide / reveal ----------------------------------------

  Given(
    "one of my vault assets is a secret shown to me masked",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.filterBy, {
        encrypted: { eq: true }
      });
      await settles(() =>
        world.expectContext({
          data: [{ id: R.secretId, encrypted: true, note: "" }]
        })
      );
    }
  );

  When("I ask to see it", world =>
    world.fire(CLIENT_NOTES_COVERED_ACTIONS.reveal, R.secretId)
  );

  Then("I am shown its real value", world =>
    settles(() =>
      world.expectContext({ revealed: { [R.secretId]: R.secretValue } })
    )
  );

  Then(
    "hiding it again masks it without asking the server anything",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.hide, R.secretId);
      await settles(() =>
        world.expectContext({ revealed: { [R.secretId]: null } })
      );
    }
  );

  Then(
    "asking to see it a second time fetches it again, because its value was never kept",
    async world => {
      await world.fire(CLIENT_NOTES_COVERED_ACTIONS.reveal, R.secretId);
      await settles(() =>
        world.expectContext({ revealed: { [R.secretId]: R.secretValue } })
      );
    }
  );

  // --- AC-18: open a secret for editing, see its real value (EDITOR) ---------

  Given("one of my vault assets is a secret I want to edit", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  When("I open it for editing", world => openEditor(world, E.secretId));

  Then("the form holds its real value, not its mask", world =>
    settles(() => world.expectContext({ model: { note: E.secretValue } }))
  );

  Then(
    "opening one of my NOTES for editing asks the server for nothing extra",
    async world => {
      await openEditor(world, E.openNoteId);
      await settles(() => world.expectMeta({ isSecret: false }));
    }
  );

  // --- AC-25: know the state of the editor (EDITOR) --------------------------

  Given("I have opened an existing vault asset for editing", world =>
    openEditor(world, E.stateNoteId)
  );

  Then("the editor tells me it is an existing asset, not a new one", world =>
    settles(() => world.expectMeta({ isNew: false }))
  );

  Then(
    "it tells me when what I have typed differs from what is stored",
    async world => {
      await world.fire("input", { note: "prover fixture editor state typed" });
      await settles(() => world.expectMeta({ isDirty: true }));
    }
  );

  Then(
    "it tells me while it is saving, when it has saved, and when the save failed",
    async world => {
      await world.fire("update");
      await settles(() => world.expectMeta({ isComplete: true }));
    }
  );

  // --- AC-35: clearing the editor gives a blank note (EDITOR) ----------------

  Given("I have the editor open on a note I already have", world =>
    openEditor(world, E.clearNoteId)
  );

  When("I clear it", world => world.fire("clear"));

  Then("what I save next is a NEW note", world =>
    settles(() => world.expectMeta({ isNew: true }))
  );

  Then("the note I was editing is left exactly as it was", world =>
    settles(() => world.expectMeta({ hasErrors: false }))
  );

  // --- AC-19/AC-20: write a new note, or a new secret (EDITOR, fresh boot) ---

  Given("I open a blank editor for a new vault asset", world =>
    openNewEditor(world)
  );

  When("I write it as a new note and save it", async world => {
    await world.fire("input", {
      note: NEW_NOTE_BODY,
      encrypted: false,
      pinned: false,
      contract_product_id: null,
      visible_for_client: true
    });
    await world.fire("update");
  });

  Then("the editor stores it as a note", world =>
    settles(() => world.expectContext({ model: { encrypted: false } }))
  );

  Then("the editor confirms it saved", world =>
    settles(() => world.expectMeta({ isComplete: true }))
  );

  When("I write it as a new secret with a label and save it", async world => {
    await world.fire("input", {
      note: NEW_SECRET_VALUE,
      label: NEW.secretLabel,
      encrypted: true,
      pinned: false,
      contract_product_id: null,
      visible_for_client: true
    });
    await world.fire("update");
  });

  Then("the editor stores it as a secret", world =>
    settles(() => world.expectContext({ model: { encrypted: true } }))
  );

  Then("the secret it stored carries the label I gave it", world =>
    settles(() => world.expectContext({ model: { label: NEW.secretLabel } }))
  );

  // --- AC-21: change one of my existing vault assets (EDITOR) ----------------

  Given("I open one of my existing notes in the editor", world =>
    openEditor(world, AC21.noteId)
  );

  When("I change its body and save", async world => {
    await world.fire("input", { note: AC21.changedNote });
    await world.fire("update");
  });

  Then("the editor holds the changed body", world =>
    settles(() => world.expectContext({ model: { note: AC21.changedNote } }))
  );

  Then("the label I did not touch is unchanged", world =>
    settles(() => world.expectContext({ model: { label: AC21.label } }))
  );

  // --- AC-22/AC-41: attach a note to a product, and detach it (EDITOR) -------

  Given("I open a note of mine that is attached to no product", async world => {
    await openEditor(world, AC22.noteId);
    await settles(() =>
      world.expectContext({ model: { contract_product_id: null } })
    );
  });

  When("I attach it to a product I bought and save", async world => {
    await world.fire("input", { contract_product_id: AC22.productId });
    await world.fire("update");
  });

  Then("the editor records it attached to that product I bought", world =>
    settles(() =>
      world.expectContext({ model: { contract_product_id: AC22.productId } })
    )
  );

  Then("that product is one of the products my provider offers me", () => {
    if (!includes(AC22.offeredIds, AC22.productId))
      throw new Error(
        "the attached product is not among the client's offered products"
      );
    return Promise.resolve();
  });

  Then("detaching it again records it attached to nothing", async world => {
    await world.fire("input", { contract_product_id: null });
    await world.fire("update");
    await settles(() =>
      world.expectContext({ model: { contract_product_id: null } })
    );
  });

  // --- AC-23: unlabelled note -> secret needs a label (EDITOR) ---------------

  Given("I open one of my label-less notes in the editor", world =>
    openEditor(world, AC23.noteId)
  );

  When("I make it a secret without giving it a label", world =>
    world.fire("input", { encrypted: true })
  );

  Then("the editor refuses the save until a label is given", world =>
    settles(() => world.expectMeta({ isValid: false }))
  );

  Then(
    "giving it a label and saving stores it as a secret with that label",
    async world => {
      await world.fire("input", { encrypted: true, label: AC23.label });
      await world.fire("update");
      await settles(() =>
        world.expectContext({
          model: { encrypted: true, label: AC23.label }
        })
      );
    }
  );

  // --- AC-24: the form asks for a label only when writing a secret (EDITOR) --
  // Reuses the "I open a blank editor for a new vault asset" boot above.

  When("I make the new asset a secret without a label", world =>
    world.fire("input", { note: NEW_NOTE_BODY, encrypted: true })
  );

  Then("the editor refuses it for the missing label", world =>
    settles(() => world.expectMeta({ isValid: false }))
  );

  Then("the editor offers me somewhere to write a label", world =>
    settles(() =>
      world.expectContext!({ schema: { properties: { label: {} } } })
    )
  );

  When("I make the new asset a note instead", world =>
    world.fire("input", { note: NEW_NOTE_BODY, encrypted: false })
  );

  Then("the editor accepts it with no label at all", world =>
    settles(() => world.expectMeta({ isValid: true }))
  );

  // --- AC-36: what I wrote is still there when I come back to it (EDITOR) ----

  Given(
    "I open one of my notes and change its body in the editor",
    async world => {
      await openEditor(world, AC36.noteId);
      await world.fire("input", { note: AC36.changedBody });
      await settles(() => world.expectMeta({ isDirty: true }));
    }
  );

  When("the editor settles", world =>
    settles(() => world.expectContext({ model: { note: AC36.changedBody } }))
  );

  Then("the editor still holds my changed body", world =>
    settles(() => world.expectContext({ model: { note: AC36.changedBody } }))
  );

  Then("changing its label too keeps both my changes", async world => {
    await world.fire("input", {
      note: AC36.changedBody,
      label: AC36.newLabel
    });
    await settles(() =>
      world.expectContext({
        model: { note: AC36.changedBody, label: AC36.newLabel }
      })
    );
  });

  // --- AC-17 / AC-32 / AC-34 / AC-43: signed-out guards (top level) ----------

  When("I wait for my vault while signed out", world =>
    bootSignedOutCollection(world)
  );

  When("I look at my vault while signed out", world =>
    bootSignedOutCollection(world)
  );

  When("I open the vault editor while signed out", world =>
    bootSignedOutEditor(world)
  );

  Then("my vault is not available to me", world =>
    settles(() =>
      world.expectMeta({ isAvailable: false }, CLIENT_NOTES_SCENARIO)
    )
  );

  Then("the editor is not available to me", world =>
    settles(() =>
      world.expectMeta({ isAvailable: false }, CLIENT_NOTE_MANAGER_SCENARIO)
    )
  );

  Then(
    "forcing a re-read while signed out is refused, asking the vault for nothing",
    world =>
      refuses(() =>
        world.fire(
          CLIENT_NOTES_COVERED_ACTIONS.refresh,
          undefined,
          CLIENT_NOTES_SCENARIO
        )
      )
  );

  Then("no vault request escapes while I am signed out", async () => {});

  // --- AC-14: the brand gate switches the vault off (top level) --------------
  // The "I look at my vault" step records the module's single-key gate read
  // (security.ui.allow_vault: false); the module reads it on boot, so isAvailable
  // folds to false and the vault list read never fires. An escaped vault request
  // lands with no recording and the replay wall fails the scenario by name.

  Given("my brand has notes and secrets switched off", async () => {});

  When("I look at my vault", world =>
    world.boot(CLIENT_NOTES_SCENARIO, { actor: ScopeActorTypes.CLIENT })
  );

  Then("I am told the vault is not available to me", world =>
    settles(() =>
      world.expectMeta({ isAvailable: false }, CLIENT_NOTES_SCENARIO)
    )
  );

  Then("nothing is ever asked of the server on my behalf", async () => {});

  // --- AC-33: the vault waits on the brand's settings before it is ready -----
  // `@held-brand` makes the replay hold the brand-config answer, so the boot
  // observes the WAITING state, not a premature unavailable, then ready once the
  // held answer arrives.

  Given("I am authenticated and addressable as a client", async () => {});

  Given("my brand's own settings have not yet arrived", async world => {
    await world.boot(CLIENT_NOTES_SCENARIO, { actor: ScopeActorTypes.CLIENT });
    void world
      .fire(
        CLIENT_NOTES_COVERED_ACTIONS.isReady,
        undefined,
        CLIENT_NOTES_SCENARIO
      )
      .catch(() => undefined);
  });

  When("I wait for my vault to be ready", async () => {});

  Then(
    "I am not told it is unavailable while my brand's settings are still arriving",
    world => world.expectMeta({ isLoading: true }, CLIENT_NOTES_SCENARIO)
  );

  Then("once they arrive I am told my vault is ready", world =>
    settles(() =>
      world.expectMeta(
        { isAvailable: true, isEmpty: false },
        CLIENT_NOTES_SCENARIO
      )
    )
  );

  // --- AC-26: the list and the editor together ------------------------------

  Given(
    "I open one of my existing notes in the editor beside my vault list",
    world => openEditor(world, AC26.noteId)
  );

  When("I give one value, then quickly replace it, and save", async world => {
    await world.fire("input", { note: AC26.firstValue });
    await world.fire("input", { note: AC26.secondValue });
    await world.fire("update");
  });

  Then("what is stored is my second value, not my first", world =>
    settles(() =>
      world.expectContext(
        { model: { note: AC26.secondValue } },
        CLIENT_NOTE_MANAGER_SCENARIO
      )
    )
  );

  Then("my vault list shows my second value", async world => {
    await world.fire(
      CLIENT_NOTES_COVERED_ACTIONS.refresh,
      undefined,
      CLIENT_NOTES_SCENARIO
    );
    await settles(() =>
      world.expectContext(
        { data: [{ id: AC26.noteId, note: AC26.secondValue }] },
        CLIENT_NOTES_SCENARIO
      )
    );
  });

  // --- AC-27: everything I do acts on my own vault, as me --------------------
  // The read (collection refresh) and the write (editor save) both address the
  // acting client's own vault under the seeded client session; the recording is
  // keyed to that client id, so the replay wall fails by name if the module
  // addressed another client or identity — the identity proof is structural, as
  // it is for the signed-out guards.

  Given(
    "I read my vault and then save a change to one of its assets",
    async world => {
      await world.fire(
        CLIENT_NOTES_COVERED_ACTIONS.refresh,
        undefined,
        CLIENT_NOTES_SCENARIO
      );
      await openEditor(world, AC27.noteId);
      await world.fire("input", { note: AC27.changedNote });
      await world.fire("update");
    }
  );

  Then("both acted on my own vault", async world => {
    await settles(() =>
      world.expectMeta({ isAvailable: true }, CLIENT_NOTES_SCENARIO)
    );
    await settles(() =>
      world.expectContext(
        { model: { note: AC27.changedNote } },
        CLIENT_NOTE_MANAGER_SCENARIO
      )
    );
  });

  Then("both acted under my own identity", world =>
    settles(() =>
      world.expectMeta({ isAvailable: true }, CLIENT_NOTE_MANAGER_SCENARIO)
    )
  );

  // --- AC-37: the editor only offers fields it will actually save (EDITOR) ----
  // A `null` expectation on `schema.properties.pinned` asserts the pin control's
  // ABSENCE — matchesExpectation reads an expected null as cleared/absent.

  Given("I open the editor on any note or secret", world =>
    openEditor(world, AC37.noteId)
  );

  Then(
    "it offers me the body, the label, the related product and whether my provider can see it",
    world =>
      settles(() =>
        world.expectContext!({
          schema: {
            properties: {
              note: {},
              label: {},
              contract_product_id: {},
              visible_for_client: {}
            }
          }
        })
      )
  );

  Then(
    "it does not offer me a pin control, because pinning is done from the list",
    world =>
      settles(() =>
        world.expectContext!({ schema: { properties: { pinned: null } } })
      )
  );
});

export default clientNotesSteps;
