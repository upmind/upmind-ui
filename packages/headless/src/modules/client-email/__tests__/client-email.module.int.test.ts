// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email whole-module guarantees (AC-22, AC-23)
 *
 * ## Job To Be Done
 * Prove the two cross-cutting guarantees the corrected module exists to hold:
 *
 * AC-22 — problems are reported TO the consumer, never announced BY the
 * module: a rejected mutation lands on the collection's `error`/`hasError` and
 * the editor's `errors`/`validationErrors`/`hasErrors`, and across every path
 * exercised here a spy on `useFeedback()` records ZERO calls. Both halves are
 * asserted in the same run — the state half alone would pass a module that
 * ALSO fired a toast.
 *
 * AC-23 — the FE-2824 fix: every request the module issues, from either
 * surface, is addressed by the client the SCOPE resolved. The
 * scope-derived-id `*.must-fail.patch` hardwires that resolution and must land
 * here, red.
 *
 * The rejection replayed is the REAL 409 staging returns for defaulting an
 * unverified address ("The default email cannot be changed to unverified
 * email address!") — captured, not invented.
 *
 * ## What Breaks If These Fail
 * AC-22: headless starts owning UI feedback again, or an error vanishes with
 * nowhere for a consumer to read it. AC-23: the module addresses whoever is
 * logged in rather than the scope it was opened with — FE-2824, exactly.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientEmailManager, useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installEmailsListHandler,
  observeEmailRequests,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const feedback = vi.hoisted(() => ({ calls: [] as string[] }));

// The spy watches the RAISING methods, not `useFeedback()` itself: the shared
// platform (query/data-manager) legitimately resolves the composable during
// these paths, and AC-22's read-back is about messages RAISED. The
// "client-email imports no feedback at all" half is asserted structurally
// below, where it can be stated exactly.
vi.mock("../../feedback", async importOriginal => {
  const actual = await importOriginal<typeof import("../../feedback")>();
  const watched = new Set(["addSuccess", "addError", "addWarning", "addInfo"]);
  return {
    ...actual,
    useFeedback: (...args: unknown[]) => {
      const api = (
        actual.useFeedback as unknown as (
          ...a: unknown[]
        ) => Record<string, unknown>
      )(...args);
      return new Proxy(api, {
        get(target, property) {
          const value = Reflect.get(target, property);
          if (typeof value === "function" && watched.has(String(property))) {
            return (...callArgs: unknown[]) => {
              feedback.calls.push(String(property));
              return (value as (...a: unknown[]) => unknown).apply(
                target,
                callArgs
              );
            };
          }
          return value;
        }
      });
    }
  };
});

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/** Every source file the module ships, excluding its tests. */
function moduleSourceFiles(): string[] {
  return readdirSync(MODULE_DIR).filter(entry => entry.endsWith(".ts"));
}

/** Module files whose CODE (not prose) mentions `token` — comments excluded. */
function moduleFilesReferencing(token: string): string[] {
  return moduleSourceFiles().filter(file =>
    readFileSync(join(MODULE_DIR, file), "utf-8")
      .split("\n")
      .some(line => {
        const trimmed = line.trim();
        const isComment =
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("/*");
        return !isComment && line.includes(token);
      })
  );
}

// -----------------------------------------------------------------------------

describe("client-email — problems are reported, never announced (AC-22)", () => {
  it("AC-22 lands a rejected list mutation on the collection's own error state, and raises no feedback", async () => {
    feedback.calls.length = 0;
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary, secondary]);
    const rejection = recorded.defaultRejected();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(2)
    );

    server?.use(
      http.put(`*/clients/${clientId}/emails/${secondary.id}`, () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );

    await expect(
      emails.useActions().setDefault(secondary.id)
    ).rejects.toBeDefined();

    await vi.waitFor(() => expect(emails.useMeta().hasError.value).toBe(true));
    expect(JSON.stringify(emails.useContext().error.value)).toContain(
      "unverified email address"
    );
    expect(feedback.calls).toEqual([]);
  });

  it("AC-22 lands a rejected save on the editor's own error state, and raises no feedback", async () => {
    feedback.calls.length = 0;
    const { clientId } = await seedClientSession();
    const target = recorded.one().data;
    const rejection = recorded.defaultRejected();

    server?.use(
      http.put(`*/clients/${clientId}/emails/${target.id}`, () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );

    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .withId(target.id);
    await manager.useActions().isReady();

    await expect(
      manager.useActions().update({ email: "prover-rejected@example.com" })
    ).rejects.toBeDefined();

    await vi.waitFor(() =>
      expect(manager.useMeta().hasErrors.value).toBe(true)
    );
    expect(JSON.stringify(manager.useContext().errors.value)).toContain(
      "unverified email address"
    );
    expect(feedback.calls).toEqual([]);
  });

  it("AC-22 tells me which field is wrong when my input is rejected, and raises no feedback", async () => {
    feedback.calls.length = 0;
    await seedClientSession();

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    manager.useActions().input({ email: "not-an-email" });

    await vi.waitFor(() =>
      expect(
        manager.useContext().validationErrors.value ?? []
      ).not.toHaveLength(0)
    );
    expect(
      JSON.stringify(manager.useContext().validationErrors.value)
    ).toContain("email");
    expect(feedback.calls).toEqual([]);
  });

  it("AC-22 raises no feedback across a whole read-and-mutate pass over both surfaces", async () => {
    feedback.calls.length = 0;
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const list = installEmailsListHandler(server, clientId, [
      primary,
      secondary
    ]);

    server?.use(
      http.delete(`*/clients/${clientId}/emails/${secondary.id}`, () => {
        list.setRows([primary]);
        return HttpResponse.json(recorded.removed(), { status: 200 });
      }),
      http.patch(`*/clients/${clientId}/emails/${primary.id}/send_verify`, () =>
        HttpResponse.json(recorded.verified(), { status: 200 })
      ),
      http.post(`*/clients/${clientId}/emails`, () =>
        HttpResponse.json(recorded.created(), { status: 200 })
      )
    );

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(2)
    );
    await emails.useActions().verify(primary.id);
    await emails.useActions().remove(secondary.id);

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();
    await manager.useActions().update({ email: recorded.created().data.email });

    expect(feedback.calls).toEqual([]);
  });

  it("AC-22 raises no feedback even when a mutation is rejected — the error goes to state, nowhere else", async () => {
    feedback.calls.length = 0;
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary, secondary]);
    const rejection = recorded.defaultRejected();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(2)
    );

    server?.use(
      http.put(`*/clients/${clientId}/emails/${secondary.id}`, () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );

    await emails
      .useActions()
      .setDefault(secondary.id)
      .catch(() => undefined);

    expect(feedback.calls).toEqual([]);
  });

  it("AC-22 raises nothing because the module never reaches for the feedback surface at all", () => {
    expect(moduleFilesReferencing("useFeedback")).toEqual([]);
  });
});

describe("client-email — the addresses I act on are the ones my scope named (AC-23)", () => {
  it("AC-23 addresses every request from both surfaces by the scope-resolved client, never another", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const list = installEmailsListHandler(server, clientId, [
      primary,
      secondary
    ]);
    const created = recorded.created().data;

    server?.use(
      http.post(`*/clients/${clientId}/emails`, () =>
        HttpResponse.json(recorded.created(), { status: 200 })
      ),
      http.put(`*/clients/${clientId}/emails/${secondary.id}`, () =>
        HttpResponse.json(recorded.updated(), { status: 200 })
      ),
      http.patch(
        `*/clients/${clientId}/emails/${secondary.id}/send_verify`,
        () => HttpResponse.json(recorded.verified(), { status: 200 })
      ),
      http.delete(`*/clients/${clientId}/emails/${secondary.id}`, () => {
        list.setRows([primary]);
        return HttpResponse.json(recorded.removed(), { status: 200 });
      })
    );

    const observed = observeEmailRequests();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(2)
    );
    await emails.useActions().ensure({ email: created.email });
    await emails.useActions().setDefault(secondary.id);
    await emails.useActions().verify(secondary.id);

    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .withId(secondary.id);
    await manager.useActions().isReady();
    await manager.useActions().update({ email: created.email });

    await emails.useActions().remove(secondary.id);
    observed.stop();

    const requests = observed.all();
    expect(requests.length).toBeGreaterThan(4);

    const misaddressed = requests.filter(
      request => !request.url.includes(`/clients/${clientId}/emails`)
    );
    expect(
      misaddressed.map(request => `${request.method} ${request.url}`)
    ).toEqual([]);

    for (const request of requests) {
      expect(
        request.headers.authorization ?? request.headers.Authorization
      ).toBe(`Bearer ${accessToken}`);
    }
  });

  it("AC-23 resolves the target client through the SHARED scope seam — no module file reads the session's active user at all (Task 57)", async () => {
    // The shared seam lives on session-store (P1-R11); the module keeps zero copies.
    expect(moduleFilesReferencing("activeUser")).toEqual([]);
    expect(moduleFilesReferencing("function resolveClientId")).toEqual([]);
    expect(moduleFilesReferencing("resolveClientId")).toEqual([
      "client-email.services.ts"
    ]);

    const sessionStore = await import("../../session-store");
    expect(typeof sessionStore.resolveClientId).toBe("function");
  });
});
