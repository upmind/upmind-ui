// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.reveal-merges-note.int
 * @description The reveal capability must SHOW something. The mapper blanks an
 * encrypted row's `note` to `""` (the ciphertext envelope never renders), and
 * the decrypted plaintext lives only in the `revealed` map. `useContext().data`
 * merges that map back into each row's `note`, so a revealed secret has a value
 * to draw in the table and the detail overlay; `hide` removes it again.
 *
 * Without the merge, `reveal` populates `revealed` (proved by AC-34) but every
 * consumer still reads `note === ""` — reveal appears to do nothing.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useClientNotes } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  recorded,
  resetClientNoteScopes,
  seedClientSession,
  waitForAvailable
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";
import { find } from "lodash-es";

// -----------------------------------------------------------------------------

describe("client-notes reveal merges plaintext into the row note", () => {
  let clientId: string;

  beforeEach(async () => {
    const seeded = await seedClientSession();
    clientId = seeded.clientId;
  });

  afterEach(() => {
    resetClientNoteScopes();
  });

  it("a revealed secret's plaintext lands on its row in useContext().data, and hide clears it", async () => {
    // Find the ENCRYPTED row by its own flag. Its POSITION in the recorded
    // list is staging's ordering, not a contract — it moves between
    // re-records, and pinning an index makes this spec fail on a re-record
    // that changed nothing about the behaviour under test.
    const secretRow = find(recorded.list().data, { encrypted: true });
    expect(
      secretRow,
      "the recorded vault list must carry an encrypted row"
    ).toBeTruthy();
    const secretId = secretRow!.id;
    const plaintext = recorded.decryptFirst().data.note;

    server?.use(
      http.get(`*/clients/${clientId}/vault/${secretId}/decrypt`, () =>
        HttpResponse.json(recorded.decryptFirst(), { status: 200 })
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);

    // Before reveal: the mapper blanks an encrypted row's note and defaults
    // `meta.isRevealed` to false.
    const rowBefore = find(notes.useContext().data.value, { id: secretId });
    expect(rowBefore?.encrypted).toBe(true);
    expect(rowBefore?.note).toBe("");
    expect(rowBefore?.meta.isRevealed).toBe(false);

    // Reveal: the plaintext is merged into THIS row's note and `isRevealed`
    // flips true — the pair the `reveal`/`hide` controls gate on.
    await notes.useActions().reveal(secretId);
    const rowRevealed = find(notes.useContext().data.value, { id: secretId });
    expect(rowRevealed?.note).toBe(plaintext);
    expect(rowRevealed?.meta.isRevealed).toBe(true);

    // Hide: the row falls back to the blanked note and `isRevealed` false.
    notes.useActions().hide(secretId);
    const rowHidden = find(notes.useContext().data.value, { id: secretId });
    expect(rowHidden?.note).toBe("");
    expect(rowHidden?.meta.isRevealed).toBe(false);
  });
});
