// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone per-phone editor — the manager surface (AC-17…AC-28)
 *
 * ## Job To Be Done
 * Drive the REAL `useClientPhoneManager()` THROUGH THE BARREL against
 * MSW-replayed staging recordings and prove every editor capability: open a
 * phone for editing or start a fresh draft, country resolution before the
 * form is usable, debounced parse/validate, saving an edit without losing
 * what was just typed, the form's own schema/uischema through machine
 * context, progress flags, model/id/display-string/error reads, clear/stop/
 * destroy/onDone, isolated concurrent drafts, and waiting for an addressable
 * client instead of firing early.
 *
 * The import is `from ".."` on purpose: this whole surface is the one the
 * 2026-08-05 client-email run amputated while every gate stayed green.
 * Importing it through the public barrel is what gives the
 * manager-amputation negative control teeth over these specs, not only over
 * the surface test.
 *
 * ## Session lifecycle (harness fidelity)
 * The session is booted ONCE in a file-level `beforeAll`, exactly as a real
 * app boots — mirroring `client-phone.session.int.test.ts` (AC-35). The
 * previous per-test `seedClientSession()` reboot was a harness artifact: it
 * rebuilds `useSessionStore().initStore()` before every one of this file's 15
 * tests, and REPEATED session boots in one process are what leaked the
 * module-singleton query observers (`countriesQuery`, `brandSettingsQuery`)
 * gating `useSystem()`/`useBrand()` readiness — the cause of the 30s hangs
 * this file used to exhibit from AC-23 onward. Every test below still calls
 * its own `manager.useActions().destroy()`, which is what keeps reusing the
 * same `target.id` across tests safe under a single shared session (proven by
 * AC-35's own repeated-open sequence in one boot).
 *
 * AC-28 is the ONE test kept on its own isolated seed
 * (`seedAuthenticatedSessionWithoutClientId`): it needs a session that
 * authenticates WITHOUT a resolved client id, a different shape than the
 * shared boot provides, and it is the last test in the file so its own reboot
 * poisons nothing downstream.
 *
 * ## What Breaks If These Fail
 * The 2026-08-05 amputation, silently: an editor that cannot open, cannot
 * validate, or saves against a client the scope never named.
 */

import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { useClientPhoneManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { ClientPhoneContextTypes } from "../client-phone.types";
import {
  assertClientIdentityTransport,
  clientPhoneScopeKeys,
  observePhoneRequests,
  recorded,
  resolveClientIdOnActiveSession,
  seedAuthenticatedSessionWithoutClientId,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";
import type { ObservedRequest } from "./client-phone.int-helpers";

// -----------------------------------------------------------------------------

type Captured = { request?: ObservedRequest; body?: unknown };

function capture(request: Request, into: Captured): void {
  into.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };
}

const GB = "GB";

// -----------------------------------------------------------------------------

// ONE session boot for the whole file — see the fileoverview's "Session
// lifecycle" note. `clientId` / `accessToken` are this shared session's own.
let clientId: string;
let accessToken: string;

beforeAll(async () => {
  ({ clientId, accessToken } = await seedClientSession());
});

// -----------------------------------------------------------------------------

describe("client-phone editor — opening a number, or a fresh draft (AC-17)", () => {
  it("AC-17 opens one of my numbers, populated, knowing which number it is editing", async () => {
    const target = recorded.one().data;

    const manager = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, target.id);
    await manager.useActions().isReady();

    expect(manager.useContext().id.value).toBe(target.id);
    expect(manager.useContext().model.value.phone?.nationalNumber).toBe(
      target.phone
    );

    // The manager's per-record read replays the RECORDED fixture — no
    // override handler is installed here, so this asserts against the
    // replay server's own automatic match on client id + phone id.
    expect(clientId).toBeTruthy();
    expect(accessToken).toBeTruthy();

    manager.useActions().destroy();
  });

  it("AC-17 opens a fresh draft empty, ready for a brand-new entry", async () => {
    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    expect(manager.useContext().id.value).toBeUndefined();
    expect(manager.useMeta().isNew.value).toBe(true);
    expect(manager.useContext().model.value.phone?.number).toBeNull();

    manager.useActions().destroy();
  });

  it("AC-17 keeps two fresh drafts apart — typing into one leaves the other untouched", async () => {
    const first = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    const second = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await first.useActions().isReady();
    await second.useActions().isReady();

    expect(first.useInternals().service).not.toBe(
      second.useInternals().service
    );
    expect(clientPhoneScopeKeys().length).toBeGreaterThanOrEqual(2);

    const secondBefore = { ...second.useContext().model.value };
    first.useActions().input({
      phone: {
        number: null,
        nationalNumber: "7911123456",
        countryCallingCode: "44",
        country: GB
      }
    });

    await vi.waitFor(() =>
      expect(first.useContext().model.value.phone?.nationalNumber).toBe(
        "7911123456"
      )
    );
    expect(second.useContext().model.value).toEqual(secondBefore);

    first.useActions().destroy();
    second.useActions().destroy();
  });
});

describe("client-phone editor — country resolution before use (AC-18)", () => {
  it("AC-18 seeds the base model's country from the resolved country before a keystroke, and reports not-yet-changed", async () => {
    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    const countries = recorded.countries().data;
    expect(countries.length).toBeGreaterThan(0);
    expect(manager.useContext().model.value.phone?.country).toBeTruthy();
    expect(manager.useMeta().isDirty.value).toBe(false);

    manager.useActions().destroy();
  });
});

describe("client-phone editor — the form definition (AC-19)", () => {
  it("AC-19 gives me the form's schema and its matching UI definition through the editor", async () => {
    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    const schema = manager.useContext().schema.value as {
      properties?: { phone?: { required?: string[] } };
    };
    expect(schema.properties?.phone?.required).toEqual(
      expect.arrayContaining([
        "number",
        "nationalNumber",
        "countryCallingCode",
        "country"
      ])
    );
    expect(JSON.stringify(schema)).toContain("phone_country_code");
    expect(JSON.stringify(manager.useContext().uischema.value)).toContain(
      "Control"
    );

    manager.useActions().destroy();
  });
});

describe("client-phone editor — typing a number (AC-20, AC-21)", () => {
  it("AC-20 parses a bare national number against the resolved GB context", async () => {
    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    // input() is DEBOUNCED (M6/D-2 note): with `leading:false` the synchronous
    // call always returns undefined — the settled value surfaces via state,
    // not the call's own return, exactly like every other manager test here
    // (AC-21, AC-25 …) that fires-and-forgets then polls via vi.waitFor.
    manager.useActions().input({
      phone: {
        number: null,
        nationalNumber: "07911123456",
        countryCallingCode: null,
        country: GB
      }
    });

    await vi.waitFor(() =>
      expect(manager.useContext().model.value.phone?.number).toBe(
        "+447911123456"
      )
    );
    expect(manager.useContext().model.value.phone?.countryCallingCode).toBe(
      "44"
    );

    manager.useActions().destroy();
  });

  it("AC-20 saving right after typing uses what I actually typed, never a stale value (debounce)", async () => {
    const captured: Captured = {};

    server?.use(
      http.post(`*/clients/${clientId}/phones`, async ({ request }) => {
        capture(request, captured);
        captured.body = await request.json();
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    // A genuinely fresh number: every recorded fixture row is checked against
    // this literal (see the int-helpers' recorded rows) so `ensure`'s
    // find-or-create correctly POSTs here rather than resolving an existing
    // row — a real collision on this exact suite's own recorded list is the
    // reason this literal was replaced (see the Test-stage gate notes).
    manager.useActions().input({
      phone: {
        number: null,
        nationalNumber: "7900112233",
        countryCallingCode: "44",
        country: GB
      }
    });
    await manager.useActions().update();

    expect((captured.body as { phone: string }).phone).toBe("7900112233");

    manager.useActions().destroy();
  });

  it("AC-21 reports an unparseable number as field-level state and sends nothing to the server", async () => {
    const observed = observePhoneRequests();

    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    manager.useActions().input({
      phone: {
        number: null,
        nationalNumber: "not-a-number",
        countryCallingCode: null,
        country: GB
      }
    });

    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(false));
    const errors = manager.useContext().validationErrors.value ?? [];
    expect(errors.length).toBeGreaterThan(0);
    expect(JSON.stringify(errors)).toContain("phone");
    observed.stop();

    const postAttempts = observed
      .all()
      .filter(request => request.method === "POST");
    expect(postAttempts).toEqual([]);

    manager.useActions().destroy();
  });
});

describe("client-phone editor — save an edit (AC-23)", () => {
  it("AC-23 flushes a pending keystroke before saving, so the pre-edit number is never sent", async () => {
    const target = recorded.one().data;
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/clients/${clientId}/phones/${target.id}`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.updated(), { status: 200 });
        }
      )
    );

    const manager = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, target.id);
    await manager.useActions().isReady();

    manager.useActions().input({
      phone: {
        number: null,
        nationalNumber: "7999888777",
        countryCallingCode: "44",
        country: GB
      }
    });
    await manager.useActions().update();

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("PUT");
    expect((captured.body as { phone: string }).phone).toBe("7999888777");
    expect((captured.body as { phone: string }).phone).not.toBe(target.phone);

    manager.useActions().destroy();
  });
});

describe("client-phone editor — progress and reads (AC-25, AC-26)", () => {
  it("AC-25 reports isNew true for a fresh draft, false for an opened number, and isDirty tracking input", async () => {
    const target = recorded.one().data;

    const draft = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await draft.useActions().isReady();
    expect(draft.useMeta().isNew.value).toBe(true);
    expect(draft.useMeta().isDirty.value).toBe(false);

    const editing = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, target.id);
    await editing.useActions().isReady();
    expect(editing.useMeta().isNew.value).toBe(false);

    editing.useActions().input({
      phone: {
        number: null,
        nationalNumber: "7000000001",
        countryCallingCode: "44",
        country: GB
      }
    });
    await vi.waitFor(() => expect(editing.useMeta().isDirty.value).toBe(true));

    draft.useActions().destroy();
    editing.useActions().destroy();
  });

  it("AC-26 reads the model, id, title, description and errors through useContext()", async () => {
    const target = recorded.one().data;

    const manager = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, target.id);
    await manager.useActions().isReady();

    expect(manager.useContext().id.value).toBe(target.id);
    expect(manager.useContext().title.value).toBeTruthy();
    expect(manager.useContext().description.value).toBeTruthy();
    expect(manager.useContext().errors.value).toBeFalsy();

    manager.useActions().destroy();
  });
});

describe("client-phone editor — clear, stop, destroy, onDone (AC-27)", () => {
  it("AC-27 clear() returns the form to its starting state and stops reporting it as changed", async () => {
    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();
    const startingModel = { ...manager.useContext().model.value };

    manager.useActions().input({
      phone: {
        number: null,
        nationalNumber: "7911123456",
        countryCallingCode: "44",
        country: GB
      }
    });
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));

    manager.useActions().clear();

    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(false));
    expect(manager.useContext().model.value).toEqual(startingModel);

    manager.useActions().destroy();
  });

  it("AC-27 stop() stops the editor but leaves it registered; destroy() releases it and the next open is fresh", async () => {
    const target = recorded.one().data;

    const manager = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, target.id);
    await manager.useActions().isReady();
    const firstService = manager.useInternals().service;
    const keyCount = clientPhoneScopeKeys().length;

    manager.useActions().stop();
    expect(clientPhoneScopeKeys()).toHaveLength(keyCount);

    manager.useActions().destroy();
    expect(clientPhoneScopeKeys()).toHaveLength(keyCount - 1);

    const reopened = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, target.id);
    expect(reopened.useInternals().service).not.toBe(firstService);

    reopened.useActions().destroy();
  });

  it("AC-27 onDone() awaits a save already in flight before resolving", async () => {
    let release: () => void = () => {};
    const held = new Promise<void>(resolve => {
      release = resolve;
    });

    server?.use(
      http.post(`*/clients/${clientId}/phones`, async () => {
        await held;
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    manager.useActions().input({
      phone: {
        number: null,
        nationalNumber: "7222333444",
        countryCallingCode: "44",
        country: GB
      }
    });
    const saving = manager.useActions().update();
    const done = manager.useActions().onDone();

    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(true)
    );
    release();
    await saving;

    await expect(done).resolves.toBe(true);

    manager.useActions().destroy();
  });
});

describe("client-phone editor — waits for an addressable client (AC-28)", () => {
  it("AC-28 sits in subscribing with zero requests until the identity resolves, then advances", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const target = recorded.one().data;
    const observed = observePhoneRequests();

    const manager = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, target.id);

    await new Promise(resolve => setTimeout(resolve, 250));
    expect(observed.all().map(request => request.url)).toEqual([]);
    expect(manager.useInternals().state.value.matches("subscribing")).toBe(
      true
    );

    await resolveClientIdOnActiveSession();

    await vi.waitFor(() =>
      expect(manager.useMeta().isAvailable.value).toBe(true)
    );
    observed.stop();

    manager.useActions().destroy();
  });
});
