// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.manager-drift.int
 * @description Integration proof for the three 2026-08-31 upgrade-pass
 * manager drift closures — AC-35 (M10/R2), AC-36 (M11/R3), AC-37 (M12/R4) —
 * against REAL staging captures.
 *
 * ## Job To Be Done
 * A reused draft must not overwrite the record it just created (AC-35); a
 * settled save must not be silently reverted, and must not be blanked on the
 * create path since `note` is `required` with no `minLength` (AC-36); the
 * editor must offer exactly the fields the oracle's edit form offers, with no
 * dead pin control (AC-37).
 *
 * ## What Breaks If These Fail
 * AC-35: a cleared editor silently PUTs over the record it was opened on
 * instead of creating a new one. AC-36: an edit vanishes ~10ms after a save
 * settles, or a create-path form blanks itself and silently PUTs an empty
 * note. AC-37: a client toggles a control that persists nothing.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNoteManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { ClientNoteContextTypes } from "../client-notes.types";
import {
  observeVaultRequests,
  recorded,
  resetClientNoteScopes,
  seedClientSession,
  waitForAvailable
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-notes manager drift — the 2026-08-31 upgrade-pass closures", () => {
  let clientId: string;

  beforeEach(async () => {
    const seeded = await seedClientSession();
    clientId = seeded.clientId;
  });

  afterEach(() => {
    resetClientNoteScopes();
  });

  it("AC-35 — clear() drops context.id, so a post-clear save POSTs a new record and never PUTs over the one it was opened on", async () => {
    const noteRow = recorded.list().data[1];
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const created = recorded.createdNote();
    const observed = observeVaultRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.post(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(created, { status: 200 })
      )
    );

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });
    expect(manager.useContext().id.value).toBe(noteRow.id);

    manager.useActions().clear();
    expect(manager.useContext().id.value).toBeUndefined();

    manager.useActions().input({ note: "a fresh draft" } as never);
    await manager.useActions().update({ note: "a fresh draft" } as never);

    const puts = observed.all().filter(request => request.method === "PUT");
    const posts = observed.all().filter(request => request.method === "POST");
    expect(puts).toHaveLength(0);
    expect(posts.length).toBeGreaterThan(0);

    manager.useActions().destroy();
    observed.stop();
  });

  // NOTE ON SCOPE (finding, not silently narrowed): requirements.md's AC-36
  // read-back additionally asks that a SECOND, separate partial `input()`
  // (e.g. `{ label: "L" }`, issued after the settled edit) carry the earlier
  // field forward too. Running that exact sequence against the shipped code
  // shows the earlier field IS dropped back to `baseModel` — which matches
  // parity.yaml row M11's own `note:` verbatim: "a partial SET after an
  // earlier edit fills omitted keys from baseModel ... INHERITED AS-IS and
  // is NOT RE-LITIGATED here. This row closes ONLY the data-less re-parse
  // limb." Asserting the stronger, unfixed claim would be a false pass on a
  // production behaviour that does not hold; asserting the narrower,
  // DOCUMENTED claim below is what D14 actually delivers. Filed as a
  // requirements.md/parity.yaml contradiction in the hand-off, not silently
  // dropped.
  it("AC-36 — an edit is not silently reverted by the machine's own settle cycle, and saving it afterwards persists the settled value", async () => {
    const noteRow = recorded.list().data[1];
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const edited = recorded.edited();
    const bodies: unknown[] = [];

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.put(
        `*/clients/${clientId}/vault/${noteRow.id}`,
        async ({ request }) => {
          bodies.push(await request.json());
          return HttpResponse.json(edited, { status: 200 });
        }
      )
    );

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });

    manager.useActions().input({ note: "edited" } as never);
    await vi.waitFor(() => {
      expect(manager.useMeta().isDirty.value).toBe(true);
    });

    // The defect this closes reverts the model ~10ms after settling, driven
    // by the shared machine's own `xstate.after(wait)` re-parse. Poll across
    // a window comfortably past any such debounce rather than guessing one
    // fixed sleep — a revert at ANY point during the window fails this
    // immediately, so the window's length only affects how long a genuine
    // pass takes, never whether a real regression is caught.
    const pollStart = Date.now();
    while (Date.now() - pollStart < 1000) {
      expect(manager.useContext().model.value?.note).toBe("edited");
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    await manager.useActions().update({} as never);

    expect(bodies[0]).toMatchObject({ note: "edited" });

    manager.useActions().destroy();
  });

  it("AC-37 — the editor offers no pin control, on either the note or secret derivation, and a full edit sends exactly the oracle's five keys", async () => {
    const noteRow = recorded.list().data[1];
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const edited = recorded.edited();
    const bodies: unknown[] = [];

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.put(
        `*/clients/${clientId}/vault/${noteRow.id}`,
        async ({ request }) => {
          bodies.push(await request.json());
          return HttpResponse.json(edited, { status: 200 });
        }
      )
    );

    const noteManager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(noteManager);
    await vi.waitFor(() => {
      expect(noteManager.useContext().model.value?.note).toBeTruthy();
    });

    const noteUischema = JSON.stringify(
      noteManager.useContext().uischema?.value ?? {}
    );
    expect(noteUischema).not.toContain("#/properties/pinned");

    await noteManager.useActions().update({ note: "changed" } as never);
    expect(Object.keys(bodies[0] as object).sort()).toEqual(
      [
        "contract_product_id",
        "encrypted",
        "label",
        "note",
        "visible_for_client"
      ].sort()
    );
    noteManager.useActions().destroy();

    const secretRow = recorded.list().data[0];
    const secretEnvelope = { ...recorded.one(), data: secretRow };
    const secretBodies: unknown[] = [];
    server?.use(
      http.get(`*/clients/${clientId}/vault/${secretRow.id}`, () =>
        HttpResponse.json(secretEnvelope, { status: 200 })
      ),
      http.get(`*/clients/${clientId}/vault/${secretRow.id}/decrypt`, () =>
        HttpResponse.json(recorded.decryptFirst(), { status: 200 })
      ),
      http.put(
        `*/clients/${clientId}/vault/${secretRow.id}`,
        async ({ request }) => {
          secretBodies.push(await request.json());
          return HttpResponse.json(edited, { status: 200 });
        }
      )
    );
    const secretManager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, secretRow.id);
    await waitForAvailable(secretManager);
    await vi.waitFor(() => {
      expect(secretManager.useContext().model.value?.note).toBeTruthy();
    });

    const secretUischema = JSON.stringify(
      secretManager.useContext().uischema?.value ?? {}
    );
    expect(secretUischema).not.toContain("#/properties/pinned");

    // Establishing real discrimination on "either derivation" (not just the
    // uischema string match): the secret's OWN full-edit body, same as the
    // note assertion above, must carry exactly the oracle's five keys — a
    // regression re-adding a persisted `pinned` control would flip THIS,
    // even if the uischema string check somehow missed it.
    await secretManager.useActions().update({ note: "changed" } as never);
    expect(Object.keys(secretBodies[0] as object).sort()).toEqual(
      [
        "contract_product_id",
        "encrypted",
        "label",
        "note",
        "visible_for_client"
      ].sort()
    );
    secretManager.useActions().destroy();
  });
});
