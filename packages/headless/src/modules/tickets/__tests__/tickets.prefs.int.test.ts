// -----------------------------------------------------------------------------
/**
 * @fileoverview tickets — support composer preferences, read-modify-write
 * (AC-33)
 *
 * ## Job To Be Done
 * Prove the support-prefs write is a real read-modify-write over the
 * client's meta map: saving `submitWithShortcut`/`newLineKey` must never
 * clobber a sibling meta key it does not own (R7 — `ui/support/messageSignature`
 * belongs to FE-1931).
 *
 * ## What Breaks If These Fail
 * Saving a composer preference silently erases another feature's saved
 * setting on the same client meta map.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientTickets } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { server } from "./setup.integration";
import {
  installTicketsHandlers,
  recorded,
  seedClientSession
} from "./tickets.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("tickets support prefs — read-modify-write (AC-33)", () => {
  it("preserves an untouched sibling meta key across the save round trip", async () => {
    await seedClientSession();
    installTicketsHandlers();

    const before = recorded.clientPrefsBefore() as {
      data: { meta?: Record<string, unknown> };
    };
    const siblingKey = "ui/support/messageSignature";
    const siblingValue = "Kind regards, a real recorded signature";

    let capturedBody: Record<string, unknown> | undefined;
    server?.use(
      http.put("*/api/clients/:id", async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(recorded.clientPrefsAfter());
      }),
      http.get("*/api/clients/:id", () =>
        HttpResponse.json({
          ...before,
          data: {
            ...before.data,
            meta: { ...(before.data.meta ?? {}), [siblingKey]: siblingValue }
          }
        })
      )
    );

    const tickets = useClientTickets().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(tickets.useMeta().isLoading.value).toBe(false)
    );

    await tickets.useActions().savePrefs({
      submitWithShortcut: true,
      newLineKey: "shift+enter"
    });

    await vi.waitFor(() => expect(capturedBody).toBeDefined());
    const sentMeta = (capturedBody?.meta ?? {}) as Record<string, unknown>;
    expect(sentMeta[siblingKey]).toBe(siblingValue);
  });
});
