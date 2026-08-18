// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone row actions — delete, set-default, save-new (AC-7, AC-8, AC-9, AC-22)
 *
 * ## Job To Be Done
 * Drive the REAL `useClientPhones().as('self')` row actions and the REAL
 * `useClientPhoneManager()` save path through the barrel and prove each one
 * reaches the wire as the contract states — addressed to the SCOPE-RESOLVED
 * client's own resource, carrying that client session's token and no
 * acting-as headers, with the documented body — and that a rejected
 * delete/set-default lands as READABLE STATE.
 *
 * ROW W6 — THE DELIBERATE DIVERGENCE FROM THE client-email REFERENCE: this
 * oracle raises feedback on `remove` and `setDefault` (client-email raises
 * none anywhere). AC-7/AC-8's success feedback and AC-9's failure feedback are
 * asserted explicitly here — the opposite of the reference's "raises no
 * feedback" guarantee, and just as load-bearing: dropping it silently would
 * lose real oracle-demonstrated capability.
 *
 * AC-9's real recorded 422 was captured against a set-default call (the
 * `Given` clause in the feature names either delete or set-default) — the
 * genuinely recorded body is used rather than a delete-specific error this
 * run never captured.
 *
 * ## Session lifecycle (harness fidelity)
 * The session is booted ONCE in a file-level `beforeAll`, mirroring
 * `client-phone.session.int.test.ts` (AC-35) and
 * `client-phone.manager.int.test.ts`: a real user never reboots their session
 * between a delete, a set-default and a save. AC-7/AC-8/AC-9 each call
 * `resetClientPhoneScopes()` themselves (registry + shared TanStack query
 * cache, WITHOUT rebooting the session store) before `openCollection()`, and
 * now `destroy()` their collection handle when done, so no test replays a
 * prior test's cached rows or leaves a live collection instance behind for
 * the next one. AC-22 deliberately does NOT reset — `.fresh()` already mints
 * a unique scope key per call, matching `client-phone.manager.int.test.ts`,
 * which never resets between its 15 manager-only tests either.
 *
 * ## RESOLVED — AC-22's 30s hangs were a harness handler-lifecycle bug, not
 * the module (previously misattributed to the AC-35 `effectScope` defect
 * class; corrected here after instrumentation)
 * `installBackgroundStubs()`'s `/countries` override (the one that merges in
 * the recorded GB row, per `countriesWithGb()`) was only installed once, in
 * the file-level `beforeAll`. `startReplayServer`'s `afterEach` calls
 * `resetHandlers()`, which wiped that override after AC-7 (this file's first
 * test) — so by the time the manager-based AC-22 tests ran, `/countries`
 * fell back to the raw, GB-less base fixture. This brand's real default
 * country (`GB`, from the unmodified `brand/settings` capture) was then
 * absent from the served list, so `useSystem().getCountry()`'s
 * default-country fallback could never resolve and `loadLookups` never
 * reached `available` — a correct module reacting to a mock that stopped
 * serving the data it needs. Fixed by re-installing the stubs in a
 * `beforeEach` below, so the override survives every `resetHandlers()`
 * regardless of run order.
 *
 * ## What Breaks If These Fail
 * A row action firing against the wrong client id is FE-2824 for writes. A
 * wrong body (a missing `default:true` on set-default) silently drifts from
 * the legacy wire contract. Losing W6's feedback is a silent capability loss
 * this oracle actually exhibits.
 */

import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useClientPhoneManager, useClientPhones } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installBackgroundStubs,
  installPhonesListHandler,
  recorded,
  recordedRows,
  resetClientPhoneScopes,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";
import type { ObservedRequest } from "./client-phone.int-helpers";

// -----------------------------------------------------------------------------

const feedback = vi.hoisted(() => ({
  calls: [] as Array<{ method: string; arg: unknown }>
}));

vi.mock("../../feedback", async importOriginal => {
  const actual = await importOriginal<typeof import("../../feedback")>();
  const watched = new Set(["addSuccess", "addError"]);
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
              feedback.calls.push({
                method: String(property),
                arg: callArgs[0]
              });
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

type Captured = { request?: ObservedRequest; body?: unknown };

function capture(request: Request, into: Captured): void {
  into.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };
}

/** Opens the collection over two recorded rows and waits for it to settle. */
async function openCollection(clientId: string) {
  const { primary, secondary } = recordedRows();
  const list = installPhonesListHandler(server, clientId, [primary, secondary]);
  const phones = useClientPhones().as(ScopeActorTypes.SELF);
  await vi.waitFor(() =>
    expect(phones.useContext().data.value).toHaveLength(2)
  );
  return { phones, list, primary, secondary };
}

// -----------------------------------------------------------------------------

// ONE session boot for the whole file — see the fileoverview's "Session
// lifecycle" note. Every test (AC-7, AC-8, AC-9, AC-22) calls
// `resetClientPhoneScopes()` itself before opening its own collection or
// manager, so a scope/cache entry left behind by a prior test never serves a
// stale row set. AC-22 previously skipped this reset on the empirical belief
// that clearing the query client reintroduced a hang; that hang was actually
// this file's `/countries`-override handler-lifecycle bug (see the
// `beforeEach` below), not a `queryClient.clear()` side effect — with that
// fixed, AC-22 resetting is what stops it reading a prior collection test's
// still-cached row set (e.g. AC-9's list) as its own duplicate-check data.
let clientId: string;
let accessToken: string;

beforeAll(async () => {
  ({ clientId, accessToken } = await seedClientSession());
});

// `startReplayServer`'s `afterEach` calls `resetHandlers()`, which wipes the
// `beforeAll`-installed GB-merged `/countries` override after the file's
// first test. Re-installed per test so the manager-based AC-22 tests (which
// alone need it, via `loadLookups` -> `ensureCountries`) never fall back to
// the truncated base fixture regardless of run order.
beforeEach(() => {
  installBackgroundStubs();
});

// -----------------------------------------------------------------------------

describe("client-phone row actions — delete (AC-7)", () => {
  it("AC-7 deletes a deletable number from my own collection, it leaves my list, and I am told it was removed", async () => {
    feedback.calls.length = 0;
    resetClientPhoneScopes();
    const { phones, list, primary, secondary } = await openCollection(clientId);
    const captured: Captured = {};

    server?.use(
      http.delete(
        `*/clients/${clientId}/phones/${secondary.id}`,
        ({ request }) => {
          capture(request, captured);
          list.setRows([primary]);
          return HttpResponse.json(recorded.removed(), { status: 200 });
        }
      )
    );

    await phones.useActions().remove(secondary.id);

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("DELETE");

    await vi.waitFor(() => {
      expect(
        phones.useContext().data.value.some(phone => phone.id === secondary.id)
      ).toBe(false);
    });

    expect(feedback.calls.some(call => call.method === "addSuccess")).toBe(
      true
    );

    phones.useActions().destroy();
  });
});

describe("client-phone row actions — set default (AC-8)", () => {
  it("AC-8 makes a number my default with body {default:true}, my previous default stops being it, and I am told it is now my default", async () => {
    feedback.calls.length = 0;
    resetClientPhoneScopes();
    const { phones, list, primary, secondary } = await openCollection(clientId);
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/clients/${clientId}/phones/${secondary.id}`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          list.setRows([
            { ...primary, default: false },
            { ...secondary, default: true }
          ]);
          return HttpResponse.json(recorded.defaulted(), { status: 200 });
        }
      )
    );

    await phones.useActions().setDefault(secondary.id);

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("PUT");
    expect(captured.body).toEqual({ default: true });

    await vi.waitFor(() => {
      const rows = phones.useContext().data.value;
      expect(rows.find(row => row.id === secondary.id)?.meta.isDefault).toBe(
        true
      );
      expect(rows.find(row => row.id === primary.id)?.meta.isDefault).toBe(
        false
      );
    });

    expect(feedback.calls.some(call => call.method === "addSuccess")).toBe(
      true
    );

    phones.useActions().destroy();
  });
});

describe("client-phone row actions — a failed mutation is state, not just an announcement (AC-9)", () => {
  it("AC-9 lands a rejected set-default on the collection's own error state AND raises an error feedback — both, not one", async () => {
    feedback.calls.length = 0;
    resetClientPhoneScopes();
    const { phones, secondary } = await openCollection(clientId);
    const rejection = recorded.defaultRejected();

    server?.use(
      http.put(`*/clients/${clientId}/phones/${secondary.id}`, () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );

    await expect(
      phones.useActions().setDefault(secondary.id)
    ).rejects.toBeDefined();

    await vi.waitFor(() => expect(phones.useMeta().hasError.value).toBe(true));
    expect(phones.useContext().error.value).toBeTruthy();
    expect(JSON.stringify(phones.useContext().error.value)).toContain("phone");
    expect(feedback.calls.some(call => call.method === "addError")).toBe(true);

    phones.useActions().destroy();
  });
});

describe("client-phone editor — save a brand-new number (AC-22)", () => {
  it("AC-22 POSTs mapIPhone(model) to my own collection on the client token, exactly once", async () => {
    resetClientPhoneScopes();
    const { primary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary]);
    const created = recorded.created().data;
    const captured: Captured = {};
    let postCount = 0;

    server?.use(
      http.post(`*/clients/${clientId}/phones`, async ({ request }) => {
        postCount += 1;
        capture(request, captured);
        captured.body = await request.json();
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();
    expect(manager.useMeta().isNew.value).toBe(true);

    manager.useActions().input({
      phone: {
        number: null,
        nationalNumber: created.phone,
        countryCallingCode: created.phone_code.replace("+", ""),
        country: created.phone_country_code
      }
    });
    await manager.useActions().update();

    expect(postCount).toBe(1);
    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("POST");
    expect(captured.body).toMatchObject({
      phone: created.phone,
      phone_code: created.phone_code,
      phone_country_code: created.phone_country_code
    });
    expect(captured.body).not.toHaveProperty("type");
  });

  it("AC-22 returns a number I already hold instead of duplicating it", async () => {
    resetClientPhoneScopes();
    const { primary, secondary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary, secondary]);
    let posted = false;

    server?.use(
      http.post(`*/clients/${clientId}/phones`, () => {
        posted = true;
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    manager.useActions().input({
      phone: {
        number: null,
        nationalNumber: primary.phone,
        countryCallingCode: primary.phone_code.replace("+", ""),
        country: primary.phone_country_code
      }
    });
    await manager.useActions().update();

    expect(posted).toBe(false);
  });
});
