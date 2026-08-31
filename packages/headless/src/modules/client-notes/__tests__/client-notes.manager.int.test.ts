// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.manager.int
 * @description Integration proof for the per-asset editor — `useClientNoteManager`
 * — against REAL staging captures. AC-18 through AC-26 (parity.yaml M1-M9).
 * AC-18/AC-20/AC-23/AC-24 are JTBD-load-bearing: this is the manager half of
 * "notes and secrets are ONE entity; a flag decides which."
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

describe("client-notes manager — useClientNoteManager", () => {
  let clientId: string;

  beforeEach(async () => {
    const seeded = await seedClientSession();
    clientId = seeded.clientId;
  });

  afterEach(() => {
    resetClientNoteScopes();
  });

  it("AC-18/M2 — a secret decrypts on open, so the form edits the real value, not the mask", async () => {
    const list = recorded.list();
    const secretRow = list.data[0]; // encrypted:true
    const decrypt = recorded.decryptFirst();
    const oneEnvelope = { ...recorded.one(), data: secretRow };
    let decryptCalls = 0;

    server?.use(
      http.get(`*/clients/${clientId}/vault/${secretRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.get(`*/clients/${clientId}/vault/${secretRow.id}/decrypt`, () => {
        decryptCalls += 1;
        return HttpResponse.json(decrypt, { status: 200 });
      })
    );

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, secretRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(decryptCalls).toBe(1);
    });

    expect(decryptCalls).toBe(1);
    expect(manager.useContext().model.value?.note).toBe(decrypt.data.note);
  });

  it("AC-18 — opening a NOTE for editing asks the server for nothing extra (no decrypt call)", async () => {
    const list = recorded.list();
    const noteRow = list.data[1]; // encrypted:false
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const observed = observeVaultRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      )
    );

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });

    expect(observed.matching("/decrypt")).toEqual([]);
    expect(manager.useContext().model.value?.note).toBe(noteRow.note);
    observed.stop();
  });

  it("AC-19 — creates a note with the oracle's exact create body", async () => {
    const created = recorded.createdNote();
    const observed = observeVaultRequests();
    server?.use(
      http.post(`*/clients/${clientId}/vault`, async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({
          encrypted: false,
          pinned: false,
          contract_product_id: null,
          note: expect.any(String),
          visible_for_client: true
        });
        return HttpResponse.json(created, { status: 200 });
      })
    );

    const manager = useClientNoteManager().as(ScopeActorTypes.SELF).fresh();
    await waitForAvailable(manager);
    await manager
      .useActions()
      .update({ note: "a new note", contract_product_id: null } as never);

    expect(observed.matching("/vault").at(-1)?.method).toBe("POST");
  });

  it("AC-20 — creates a secret through the SAME editor and endpoint, differing from AC-19 only by encrypted+label", async () => {
    const createdSecret = recorded.createdSecret();
    let capturedBody: unknown;
    server?.use(
      http.post(`*/clients/${clientId}/vault`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(createdSecret, { status: 200 });
      })
    );

    const manager = useClientNoteManager().as(ScopeActorTypes.SELF).fresh();
    await waitForAvailable(manager);
    await manager.useActions().update({
      note: "a secret value",
      label: "a label",
      encrypted: true,
      contract_product_id: null
    } as never);

    expect(capturedBody).toEqual({
      encrypted: true,
      pinned: false,
      contract_product_id: null,
      label: "a label",
      note: "a secret value",
      visible_for_client: true
    });

    const noteBody = recorded.createdNote(); // AC-19's own request body reference
    void noteBody;
    const diffKeys = Object.keys(capturedBody as object).filter(
      key =>
        (capturedBody as Record<string, unknown>)[key] !==
        (
          {
            encrypted: false,
            pinned: false,
            contract_product_id: null,
            note: "a new note",
            visible_for_client: true
          } as Record<string, unknown>
        )[key]
    );
    expect(new Set(diffKeys)).toEqual(new Set(["encrypted", "note", "label"]));
  });

  it("AC-21/AC-22 — edits an existing asset with the oracle's exact five-key body, and detaches a product with null", async () => {
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

    await manager
      .useActions()
      .update({ contract_product_id: "prod-1", note: "changed" } as never);
    expect(Object.keys(bodies[0] as object).sort()).toEqual(
      [
        "contract_product_id",
        "encrypted",
        "label",
        "note",
        "visible_for_client"
      ].sort()
    );

    await manager.useActions().update({ contract_product_id: null } as never);
    expect(
      (bodies[1] as { contract_product_id: unknown }).contract_product_id
    ).toBe(null);
    expect(bodies[1]).toHaveProperty("contract_product_id");
  });

  it("AC-23 — converting an unlabelled note refuses to save; supplying a label saves both together", async () => {
    const noteRow = recorded.list().data[1]; // label:null
    const oneEnvelope = {
      ...recorded.one(),
      data: { ...noteRow, encrypted: true }
    };
    const converted = recorded.convertedToSecret();
    const observed = observeVaultRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.put(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(converted, { status: 200 })
      )
    );

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });

    const before = observed.count();
    await expect(
      manager.useActions().update({ label: "" } as never)
    ).rejects.toBeTruthy();
    expect(manager.useMeta().isValid.value).toBe(false);
    expect(observed.count()).toBe(before);

    await manager.useActions().update({ label: "a new label" } as never);
    const putCall = observed
      .matching(`/vault/${noteRow.id}`)
      .find(request => request.method === "PUT");
    expect(putCall).toBeTruthy();
    observed.stop();
  });

  it("AC-24 — the form's schema/uischema follow the encrypted flag as a pair", async () => {
    const manager = useClientNoteManager().as(ScopeActorTypes.SELF).fresh();
    await waitForAvailable(manager);

    manager.useActions().input({ encrypted: true } as never);
    // A fixed short sleep raced the schema/uischema recompute here (confirmed
    // live this cycle: a 50ms wait read a stale `required: ["note"]`, a
    // longer one settles to the correct `["note","label"]`) — poll for the
    // settled value instead of guessing a duration.
    await vi.waitFor(() => {
      const required = (
        manager.useContext().schema?.value as { required?: string[] }
      )?.required;
      expect(required).toContain("label");
    });
    let schema = manager.useContext().schema?.value as
      | { required?: string[] }
      | undefined;
    let uischema = manager.useContext().uischema?.value;
    expect(schema?.required).toContain("label");
    expect(JSON.stringify(uischema ?? {})).toContain("#/properties/label");

    manager.useActions().input({ encrypted: false } as never);
    await vi.waitFor(() => {
      const required = (
        manager.useContext().schema?.value as { required?: string[] }
      )?.required;
      expect(required ?? []).not.toContain("label");
    });
    schema = manager.useContext().schema?.value as
      | { required?: string[] }
      | undefined;
    uischema = manager.useContext().uischema?.value;
    expect(schema?.required ?? []).not.toContain("label");
    expect(JSON.stringify(uischema ?? {})).not.toContain("#/properties/label");
  });

  it("AC-25 — knows the editor's state: isNew, isDirty, isProcessing, hasErrors", async () => {
    const fresh = useClientNoteManager().as(ScopeActorTypes.SELF).fresh();
    expect(fresh.useMeta().isNew.value).toBe(true);

    const noteRow = recorded.list().data[1];
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      )
    );
    const existing = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(existing);
    await vi.waitFor(() => {
      expect(existing.useContext().model.value?.note).toBeTruthy();
    });
    expect(existing.useMeta().isNew.value).toBe(false);

    expect(existing.useMeta().isDirty.value).toBe(false);
    existing.useActions().input({ note: "changed once" } as never);
    // A fixed short sleep raced isDirty's recompute here (confirmed live
    // this cycle, same class as AC-24's schema recompute) — poll for the
    // settled value instead of guessing a duration.
    await vi.waitFor(() => {
      expect(existing.useMeta().isDirty.value).toBe(true);
    });
    expect(existing.useMeta().isDirty.value).toBe(true);
  });

  it("JTBD — a second save on one .fresh() draft updates the created record instead of duplicating it (AC-19/AC-20/AC-21 repair)", async () => {
    const created = recorded.createdNote();
    const createdId = created.data.id;
    const edited = recorded.edited();
    const observed = observeVaultRequests();

    server?.use(
      http.post(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(created, { status: 200 })
      ),
      http.put(`*/clients/${clientId}/vault/${createdId}`, () =>
        HttpResponse.json(edited, { status: 200 })
      )
    );

    const manager = useClientNoteManager().as(ScopeActorTypes.SELF).fresh();
    await waitForAvailable(manager);
    await manager
      .useActions()
      .update({ note: "a", contract_product_id: null } as never);

    const postsAfterFirstSave = observed
      .matching("/vault")
      .filter(request => request.method === "POST");
    expect(postsAfterFirstSave).toHaveLength(1);

    manager.useActions().input({ note: "b" } as never);
    await manager.useActions().update({ note: "b" } as never);

    const posts = observed
      .matching("/vault")
      .filter(request => request.method === "POST");
    const putsToCreatedId = observed
      .matching(`/vault/${createdId}`)
      .filter(request => request.method === "PUT");

    expect(posts).toHaveLength(1);
    expect(putsToCreatedId).toHaveLength(1);
    expect(putsToCreatedId[0].url).toContain(`/vault/${createdId}`);

    observed.stop();
  });

  it("AC-26 — flushes the SECOND typed value before save, and destroy() releases the registry entry", async () => {
    const noteRow = recorded.list().data[1];
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const edited = recorded.edited();
    let savedBody: { note?: string } | undefined;

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.put(
        `*/clients/${clientId}/vault/${noteRow.id}`,
        async ({ request }) => {
          savedBody = (await request.json()) as { note?: string };
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

    manager.useActions().input({ note: "first value" } as never);
    manager.useActions().input({ note: "second value" } as never);
    await manager.useActions().update({} as never);

    expect(savedBody?.note).toBe("second value");

    manager.useActions().destroy();
    const second = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    expect(second).not.toBe(manager);
  });
});
