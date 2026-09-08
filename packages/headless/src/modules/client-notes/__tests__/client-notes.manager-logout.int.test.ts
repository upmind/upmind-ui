// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.manager-logout.int
 * @description Integration proof for AC-43 (M14/R6/D16) — a real production
 * logout leaves no decrypted plaintext anywhere the EDITOR can still reach.
 * AC-34/X8 already closes the collection half (its plaintext lives in a
 * closure the collection clears); this file closes the manager half, whose
 * plaintext lives in machine context, which only teardown (`destroy()`)
 * releases — the deliberate divergence `design.md` §14.3 (D16) states
 * verbatim. Isolated in its own file: it drives a real session logout and a
 * real second login, which no other `*.int.test.ts` in this module does.
 *
 * ## Job To Be Done
 * Prove the manager's plaintext is gone after a logout WITHOUT re-minting a
 * fresh manager as the only evidence — a re-mint would pass even if the old
 * context still held it (prover brief, R6). The retained handle's own
 * `model`/`baseModel` plaintext must be unreadable — not merely the
 * interpreter status, the registry key, or the decrypt-call count, none of
 * which can go false while the plaintext is still sitting in context
 * (2026-08-31 repair: those three proxies all stayed green while
 * `model.note`/`baseModel.note` still returned the plaintext on a retained
 * handle).
 *
 * ## What Breaks If This Fails
 * Client A opens a secret in the editor, reveals it, then logs out; client B
 * logs in on the same device and the editor's machine context still holds
 * client A's decrypted plaintext.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientNoteManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore } from "../../session-store";
import { ClientNoteContextTypes } from "../client-notes.types";
import {
  clientNoteScopeKeys,
  recorded,
  resetClientNoteScopes,
  seedClientSession,
  waitForAvailable
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-notes manager — logout containment, isolated (R6/M14/AC-43)", () => {
  it("AC-43 — a real production logout leaves no decrypted plaintext anywhere the editor can still reach", async () => {
    resetClientNoteScopes();
    const seeded = await seedClientSession();
    const secretRow = recorded.list().data.find(r => r.encrypted); // by PREDICATE, not index — capture order is not a contract
    const oneEnvelope = { ...recorded.one(), data: secretRow };
    const decrypt = recorded.decryptFirst();
    let decryptCalls = 0;

    server?.use(
      http.get(`*/clients/${seeded.clientId}/vault/${secretRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.get(
        `*/clients/${seeded.clientId}/vault/${secretRow.id}/decrypt`,
        () => {
          decryptCalls += 1;
          return HttpResponse.json(decrypt, { status: 200 });
        }
      )
    );

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, secretRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBe(decrypt.data.note);
    });
    expect(decryptCalls).toBe(1);

    const keyCountBefore = clientNoteScopeKeys().length;
    const decryptCallsBeforeLogout = decryptCalls;

    // The REAL production logout signal — never a hand-rolled stub. This is
    // the capability under test: the module's own subscription to it.
    useSessionStore().useActions().logout();

    await vi.waitFor(() => {
      expect(clientNoteScopeKeys().length).toBeLessThan(keyCountBefore);
    });
    // No decrypt was replayed to reach containment.
    expect(decryptCalls).toBe(decryptCallsBeforeLogout);

    // Primary proof, WITHOUT re-minting: the retained handle's own
    // decrypted plaintext is gone from BOTH members that ever seeded it
    // (design.md §14.3 — `client-notes.services.ts` seeds `model.note` AND
    // `baseModel.note` on open). `service.status`, the registry key, and the
    // decrypt-call count can all stay green while these two still hold the
    // secret — this is the capability itself, not a proxy for it.
    expect(manager.useContext().model.value?.note).toBeFalsy();
    expect(manager.useContext().context.value?.baseModel?.note).toBeFalsy();

    resetClientNoteScopes();
    await seedClientSession();
    server?.use(
      http.get(`*/clients/${seeded.clientId}/vault/${secretRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.get(
        `*/clients/${seeded.clientId}/vault/${secretRow.id}/decrypt`,
        () => {
          decryptCalls += 1;
          return HttpResponse.json(decrypt, { status: 200 });
        }
      )
    );

    // Supplementary proof (the AC's own additional clause): a manager minted
    // after a SECOND login carries none of the first client's plaintext —
    // its own note equals the (fresh, freshly-fetched) plaintext, never a
    // stale value from the torn-down instance.
    const secondLoginManager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, secretRow.id);
    await waitForAvailable(secondLoginManager);
    await vi.waitFor(() => {
      expect(secondLoginManager.useContext().model.value?.note).toBe(
        decrypt.data.note
      );
    });
    expect(decryptCalls).toBe(decryptCallsBeforeLogout + 1);

    secondLoginManager.useActions().destroy();
  });
});
