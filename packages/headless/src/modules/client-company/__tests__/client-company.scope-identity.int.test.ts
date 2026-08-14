// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company — the account acted on is the one the scope resolved (AC-27, R2, the FE-2824 shape)
 *
 * ## Job To Be Done
 * Prove AC-27 both ways:
 *  - STRUCTURALLY, neither composable's call signature accepts a `clientId`
 *    (nor the destructured `{ clientId }` shape the pre-conversion
 *    `useClientCompanyManager(id, { clientId })` advertised) as a
 *    consumer-supplied argument;
 *  - BEHAVIOURALLY, every request the module issues — list, create, update,
 *    delete, set-default — carries the client id resolved from
 *    `useActiveSession()`, never a caller-named one.
 *
 * `client-company.scope-identity.must-fail.patch` re-introduces the
 * caller-supplied `clientId` exactly as it stood pre-conversion and must flip
 * the structural assertion below RED.
 *
 * ## What Breaks If These Fail
 * The FE-2824 shape returning: an option that reaches machine context but
 * never a request URL, so a caller believes they retargeted the module and
 * did not.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { useClientCompanies, useClientCompanyManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/** Every module source file, excluding its tests. */
function moduleSourceFiles(): string[] {
  return readdirSync(MODULE_DIR).filter(entry => entry.endsWith(".ts"));
}

/** Non-comment lines across the module carrying the destructured `{ clientId }` shape. */
function linesDestructuringClientId(): { file: string; line: string }[] {
  const hits: { file: string; line: string }[] = [];
  for (const file of moduleSourceFiles()) {
    const lines = readFileSync(join(MODULE_DIR, file), "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      const isComment =
        trimmed.startsWith("//") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("/*");
      if (!isComment && /\{\s*clientId\s*[,}]/.test(line)) {
        hits.push({ file, line: trimmed });
      }
    }
  }
  return hits;
}

// -----------------------------------------------------------------------------

describe("client-company — no consumer-supplied clientId, structurally (AC-27)", () => {
  it("AC-27 neither composable's factory takes a `{ clientId }` option — the FE-2824 shape verbatim", () => {
    expect(linesDestructuringClientId()).toEqual([]);
  });

  it("AC-27 useClientCompanies takes no consumer-supplied argument at all", () => {
    expectTypeOf(useClientCompanies).parameters.toEqualTypeOf<[]>();
  });

  it("AC-27 useClientCompanyManager takes no consumer-supplied argument at all", () => {
    expectTypeOf(useClientCompanyManager).parameters.toEqualTypeOf<[]>();
  });
});

describe("client-company — every request carries the SCOPE-resolved id, never a caller-named one (AC-27)", () => {
  it("AC-27 addresses list, create, update, delete and set-default by the session-resolved client id", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { primary } = recordedRows();
    const created = recorded.created().data;

    server?.use(
      http.post(`*/clients/${clientId}/companies`, () =>
        HttpResponse.json(recorded.created(), { status: 200 })
      ),
      http.put(`*/clients/${clientId}/companies/${primary.id}`, () =>
        HttpResponse.json(recorded.updated(), { status: 200 })
      ),
      http.delete(`*/clients/${clientId}/companies/${primary.id}`, () =>
        HttpResponse.json(recorded.removed(), { status: 200 })
      )
    );

    const observedRequests: {
      method: string;
      url: string;
      headers: Record<string, string>;
    }[] = [];
    const listener = ({ request }: { request: Request }): void => {
      if (!request.url.includes("/companies")) return;
      observedRequests.push({
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries())
      });
    };
    server?.events.on("request:start", listener);

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    await companies.useActions().ensure({
      name: created.name,
      addressId: primary.address_id ?? undefined
    });
    await companies
      .useActions()
      .setDefault(primary.id)
      .catch(() => undefined);
    await companies
      .useActions()
      .remove(primary.id)
      .catch(() => undefined);

    server?.events.removeListener("request:start", listener);

    expect(observedRequests.length).toBeGreaterThan(0);
    for (const request of observedRequests) {
      assertClientIdentityTransport(request, clientId, accessToken);
    }
    const misaddressed = observedRequests.filter(
      request => !request.url.includes(`/clients/${clientId}/companies`)
    );
    expect(misaddressed.map(request => request.url)).toEqual([]);
  });

  it("AC-27 the manager's create carries the session-resolved client id — never one this test names", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const created = recorded.created().data;
    let captured: { url: string; headers: Record<string, string> } | undefined;

    server?.use(
      http.post(`*/clients/${clientId}/companies`, ({ request }) => {
        captured = {
          url: request.url,
          headers: Object.fromEntries(request.headers.entries())
        };
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();
    await manager.useActions().update({
      name: created.name,
      addressId: created.address_id
    });

    await vi.waitFor(() => expect(captured).toBeDefined());
    assertClientIdentityTransport(
      { method: "POST", ...captured! },
      clientId,
      accessToken
    );
  });
});
