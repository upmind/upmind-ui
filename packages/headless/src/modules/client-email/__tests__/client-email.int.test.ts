/**
 * @fileoverview client-email integration — real collection query + MSW replay
 *
 * ## Job To Be Done
 * Drive the REAL `useClientEmails` collection over a seeded client session
 * against replayed `/clients/:id/emails` fixtures: the happy list maps the
 * recorded IEmail envelope into the view-model (default flagged, verify state
 * carried), a 401 and a 4xx surface as an error (never as silent empty data),
 * and a mutation (remove) issues the correct DELETE to the client-scoped URL.
 *
 * ## What Breaks If These Fail
 * The profile + checkout email pickers render another shape than the API
 * returns (mapper drift), an auth/permission failure looks like "no emails"
 * (data loss masked as empty state), or delete targets the wrong URL.
 *
 * Mutation 4xx error handling is intentionally not re-tested here — it flows
 * through the shared query error machinery proven in `query.int.test.ts`
 * (ADR-021 documented omission).
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import {
  useSessionStore,
  useActiveSession,
  mapSessionUser
} from "../../session-store";
import { ScopeActorTypes } from "../../scope";
import { useClientEmails } from "../useClientEmails";
import { server } from "./setup.integration";
import type { Email } from "../client-email.types";
import type { ISelf, IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

// Cross-module input (never asserted on): a client grant + profile to put an
// authenticated client-scoped session in place, reused from session-store's
// own Phase-0 capture (see account.int.test.ts D2 for the same seam).
const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

type SelfResponse = { data: ISelf };

/**
 * Seeds an authenticated client session via the store's own public `add()`
 * (after `initStore()`) — the same seam account's integration suite uses. The
 * guest-mint override unblocks `initStore()` in this replay realm.
 */
async function seedClientSession(): Promise<void> {
  const clientToken = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir: sessionStoreRecordingsDir
  });
  const selfResponse = getFixtureBody<SelfResponse>("get-self", {
    recordingsDir: sessionStoreRecordingsDir
  });

  const guestFx = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guestFx.response.body as object, {
        status: guestFx.response.status
      })
    )
  );

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfResponse.data));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });
}

// -----------------------------------------------------------------------------

describe("client-email integration (fixture replay)", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    useClientEmails().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useClientEmails().as(ScopeActorTypes.SELF).useActions().destroy();
  });

  it("maps the recorded email list into the collection view-model", async () => {
    await seedClientSession();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();
    await vi.waitFor(() =>
      expect(emails.useContext().data.value.length).toBe(2)
    );

    const context = emails.useContext();
    const ids = context.data.value.map(e => e.id);
    expect(ids).toEqual(["mock-email-1", "mock-email-2"]);

    // Mapper contract: default + verify state carried off the raw IEmail.
    const primary = context.getOne("mock-email-1") as Email;
    expect(primary.email).toBe("primary@example.com");
    expect(primary.meta.isDefault).toBe(true);
    expect(primary.meta.isVerified).toBe(true);
    expect((context.default() as Email)?.id).toBe("mock-email-1");

    expect(emails.useMeta().hasError.value).toBe(false);
    expect(emails.useMeta().isEmpty.value).toBe(false);
  });

  it("surfaces a 401 as an error, not as an empty list", async () => {
    await seedClientSession();
    server?.use(
      http.get(
        "*/clients/*/emails",
        () => new HttpResponse(null, { status: 401 })
      )
    );

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    // Force a live network round-trip: the shared query cache (staleTime: DAY)
    // may still hold a prior test's 200, so refetch to hit the 401 override.
    await emails
      .useActions()
      .refresh()
      .catch(() => undefined);

    await vi.waitFor(() => expect(emails.useMeta().hasError.value).toBe(true), {
      timeout: 5000
    });
    expect(emails.useContext().error.value).toBeTruthy();
  });

  it("surfaces a 4xx (404) as an error, not as an empty list", async () => {
    await seedClientSession();
    server?.use(
      http.get("*/clients/*/emails", () =>
        HttpResponse.json({ error: "not found" }, { status: 404 })
      )
    );

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    // Force a live round-trip past the shared query cache to hit the 404.
    await emails
      .useActions()
      .refresh()
      .catch(() => undefined);

    await vi.waitFor(() => expect(emails.useMeta().hasError.value).toBe(true), {
      timeout: 5000
    });
    expect(emails.useContext().error.value).toBeTruthy();
  });

  it("remove(id) issues a DELETE to the client-scoped email URL", async () => {
    await seedClientSession();

    const deleted: string[] = [];
    server?.use(
      http.delete("*/clients/*/emails/*", ({ request }) => {
        deleted.push(new URL(request.url).pathname);
        return HttpResponse.json({ status: "ok", data: null }, { status: 200 });
      })
    );

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();

    emails.useActions().remove("mock-email-2");

    await vi.waitFor(() => expect(deleted.length).toBe(1));
    expect(deleted[0]).toContain("/emails/mock-email-2");
  });
});
