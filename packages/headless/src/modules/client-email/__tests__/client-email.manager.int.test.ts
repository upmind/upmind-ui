// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email per-email editor — the manager surface (AC-11…AC-21)
 *
 * ## Job To Be Done
 * Drive the REAL `useClientEmailManager()` THROUGH THE BARREL against
 * MSW-replayed staging recordings and prove every editor capability the
 * corrected parity table restored (R11-R21): open an address for editing,
 * readiness, debounced input + validation, saving an edit, saving a new
 * address, the form definition, clearing, isolated drafts, state flags, the
 * list refresh a settled save triggers, and lifecycle.
 *
 * The import is `from ".."` on purpose: this whole surface was amputated once
 * and reported as full parity. Importing it through the public barrel is what
 * gives the manager-amputation negative control teeth over these specs, not
 * only over the surface test.
 *
 * ## What Breaks If These Fail
 * The 2026-08-05 amputation, silently: an editor that cannot open, cannot
 * validate, or saves against a client the scope never named.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientEmailManager, useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  clientEmailScopeKeys,
  installEmailsListHandler,
  logoutClientSession,
  observeEmailRequests,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import { DEBOUNCE_DELAY } from "../../../utils";
import { find } from "lodash-es";
import type { ObservedRequest } from "./client-email.int-helpers";

// -----------------------------------------------------------------------------

type Captured = { request?: ObservedRequest; body?: unknown };

function capture(request: Request, into: Captured): void {
  into.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };
}

/** Settles past one debounce window. */
async function settleDebounce(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, DEBOUNCE_DELAY + 150));
}

const NEW_ADDRESS = "prover-new@example.com";

// -----------------------------------------------------------------------------

describe("client-email editor — opening an address (AC-11, AC-12)", () => {
  it("AC-11 opens one of my addresses, populated, knowing which address it is editing", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const target = recorded.one().data;
    const observed = observeEmailRequests();

    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", target.id);
    await manager.useActions().isReady();

    expect(manager.useContext().id.value).toBe(target.id);
    expect(manager.useContext().model.value.email).toBe(target.email);

    observed.stop();
    const seedRead = observed
      .all()
      .find(
        request =>
          request.method === "GET" &&
          request.url.includes(`/emails/${target.id}`)
      );
    expect(seedRead).toBeDefined();
    assertClientIdentityTransport(seedRead!, clientId, accessToken);
  });

  it("AC-12 becomes ready to accept input once it knows whose address it is editing", async () => {
    await seedClientSession();
    const target = recorded.one().data;

    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", target.id);

    await expect(manager.useActions().isReady()).resolves.toBe(true);
    expect(manager.useMeta().isAvailable.value).toBe(true);
    expect(manager.useInternals().state.value.matches("available")).toBe(true);
  });

  it("AC-12 sends no request before it knows whose address it is editing", async () => {
    await seedClientSession();
    await logoutClientSession();
    const target = recorded.one().data;

    const observed = observeEmailRequests();
    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", target.id);
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
    expect(manager.useInternals().state.value.matches("subscribing")).toBe(
      true
    );
    expect(manager.useMeta().isAvailable.value).toBe(false);
  });
});

describe("client-email editor — typing an address (AC-13)", () => {
  it("AC-13 rejects an empty address and names the field that is wrong", async () => {
    await seedClientSession();

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    manager.useActions().input({ email: "" });
    await settleDebounce();

    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(false));
    expect(
      manager.useInternals().state.value.matches("available.invalid")
    ).toBe(true);
    const errors = manager.useContext().validationErrors.value ?? [];
    expect(errors.length).toBeGreaterThan(0);
    expect(JSON.stringify(errors)).toContain("email");
  });

  it("AC-13 rejects a malformed address and names the field that is wrong", async () => {
    await seedClientSession();

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    manager.useActions().input({ email: "not-an-email" });
    await settleDebounce();

    await vi.waitFor(() =>
      expect(
        manager.useInternals().state.value.matches("available.invalid")
      ).toBe(true)
    );
    expect(manager.useMeta().isValid.value).toBe(false);
    expect(
      JSON.stringify(manager.useContext().validationErrors.value)
    ).toContain("email");
  });

  it("AC-13 accepts a well-formed address and clears the validation errors", async () => {
    await seedClientSession();

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    manager.useActions().input({ email: "a@b.com" });
    await settleDebounce();

    await vi.waitFor(() =>
      expect(
        manager.useInternals().state.value.matches("available.valid")
      ).toBe(true)
    );
    expect(manager.useMeta().isValid.value).toBe(true);
    expect(manager.useContext().validationErrors.value ?? []).toHaveLength(0);
  });

  it("AC-13 debounces typing — two keystrokes inside one window parse once", async () => {
    await seedClientSession();

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    let parses = 0;
    manager.useInternals().service.onTransition(state => {
      if (state.changed && state.matches("available.checking.parsing")) {
        parses += 1;
      }
    });

    manager.useActions().input({ email: "a@b.co" });
    manager.useActions().input({ email: "a@b.com" });
    await settleDebounce();

    await vi.waitFor(() => expect(parses).toBeGreaterThan(0));
    expect(parses).toBe(1);
    expect(manager.useContext().model.value.email).toBe("a@b.com");
  });
});

describe("client-email editor — saving (AC-14, AC-15, AC-20)", () => {
  it("AC-14 saves a change to one of my addresses — PUT to my own resource, re-marked unverified", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const target = recorded.one().data;
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/clients/${clientId}/emails/${target.id}`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.updated(), { status: 200 });
        }
      )
    );

    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", target.id);
    await manager.useActions().isReady();

    const saved = await manager.useActions().update({ email: NEW_ADDRESS });

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("PUT");
    expect(captured.body).toMatchObject({ email: NEW_ADDRESS, verified: 0 });
    expect(saved).toBeDefined();
  });

  it("AC-14 flushes a pending keystroke before saving, so the pre-edit address is never sent", async () => {
    const { clientId } = await seedClientSession();
    const target = recorded.one().data;
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/clients/${clientId}/emails/${target.id}`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.updated(), { status: 200 });
        }
      )
    );

    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", target.id);
    await manager.useActions().isReady();

    manager.useActions().input({ email: NEW_ADDRESS });
    await manager.useActions().update({ email: NEW_ADDRESS });

    expect((captured.body as { email: string }).email).toBe(NEW_ADDRESS);
    expect((captured.body as { email: string }).email).not.toBe(target.email);
  });

  it("AC-15 saves a brand-new address onto my own collection — POST {email}", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { primary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary]);
    const created = recorded.created().data;
    const captured: Captured = {};

    server?.use(
      http.post(`*/clients/${clientId}/emails`, async ({ request }) => {
        capture(request, captured);
        captured.body = await request.json();
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();
    expect(manager.useMeta().isNew.value).toBe(true);

    await manager.useActions().update({ email: created.email });

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("POST");
    expect(captured.body).toEqual({ email: created.email });
  });

  it("AC-15 returns an address I already hold instead of duplicating it", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary, secondary]);
    let posted = false;

    server?.use(
      http.post(`*/clients/${clientId}/emails`, () => {
        posted = true;
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    await manager.useActions().update({ email: primary.email });

    expect(posted).toBe(false);
  });

  it("AC-20 shows a brand-new address in my open list the moment the editor creates it", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    const list = installEmailsListHandler(server, clientId, [primary]);
    const created = recorded.created().data;

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(1)
    );

    server?.use(
      http.post(`*/clients/${clientId}/emails`, () => {
        list.setRows([primary, created]);
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    // `isNew` routes creates down a different post-effect from the update
    // below, so the list refresh has to be proven on both.
    const editor = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await editor.useActions().isReady();
    expect(editor.useMeta().isNew.value).toBe(true);

    await editor.useActions().update({ email: created.email });

    await vi.waitFor(() => {
      expect(
        find(emails.useContext().data.value, { id: created.id })?.email
      ).toBe(created.email);
    });
  });

  it("AC-20 shows the saved value in my open list after I save in the editor", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const list = installEmailsListHandler(server, clientId, [
      primary,
      secondary
    ]);
    const updated = recorded.updated().data;

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(2)
    );

    server?.use(
      http.put(`*/clients/${clientId}/emails/${secondary.id}`, () => {
        list.setRows([primary, { ...secondary, email: updated.email }]);
        return HttpResponse.json(recorded.updated(), { status: 200 });
      })
    );

    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", secondary.id);
    await manager.useActions().isReady();
    await manager.useActions().update({ email: updated.email });

    await vi.waitFor(() => {
      expect(
        emails.useContext().data.value.find(row => row.id === secondary.id)
          ?.email
      ).toBe(updated.email);
    });
  });
});

describe("client-email editor — the form definition (AC-16)", () => {
  it("AC-16 gives me the form's schema and its matching UI definition through the editor", async () => {
    await seedClientSession();

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    const schema = manager.useContext().schema.value as {
      required?: string[];
      properties?: Record<string, { format?: string; $ref?: string }>;
      definitions?: Record<string, { format?: string }>;
    };
    expect(schema.required).toContain("email");

    const emailProperty = schema.properties?.email;
    const resolved =
      emailProperty?.format !== undefined
        ? emailProperty
        : schema.definitions?.[
            emailProperty?.$ref?.replace("#/definitions/", "") ?? "email"
          ];
    expect(resolved?.format).toBe("email");

    expect(JSON.stringify(manager.useContext().uischema.value)).toContain(
      "Control"
    );
    expect(JSON.stringify(manager.useContext().uischema.value)).toContain(
      "email"
    );
  });
});

describe("client-email editor — clearing and isolation (AC-17, AC-18)", () => {
  it("AC-17 returns the form to its starting state and stops reporting it as changed", async () => {
    await seedClientSession();

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    manager.useActions().input({ email: "a@b.com" });
    await settleDebounce();
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));

    manager.useActions().clear();

    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(false));
    expect(manager.useContext().model.value.email).toBeNull();
  });

  it("AC-18 keeps two new-address forms apart — typing into one leaves the other untouched", async () => {
    await seedClientSession();

    const first = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    const second = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await first.useActions().isReady();
    await second.useActions().isReady();

    expect(first.useInternals().service).not.toBe(
      second.useInternals().service
    );
    expect(clientEmailScopeKeys().length).toBeGreaterThanOrEqual(2);

    const secondBefore = { ...second.useContext().model.value };
    first.useActions().input({ email: "a@b.com" });
    await settleDebounce();

    await vi.waitFor(() =>
      expect(first.useContext().model.value.email).toBe("a@b.com")
    );
    expect(second.useContext().model.value).toEqual(secondBefore);
  });
});

describe("client-email editor — state while I work (AC-19)", () => {
  it("AC-19 reports a brand-new form as new, and an opened address as not new", async () => {
    await seedClientSession();
    const target = recorded.one().data;

    const draft = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await draft.useActions().isReady();
    expect(draft.useMeta().isNew.value).toBe(true);

    const editing = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", target.id);
    await editing.useActions().isReady();
    expect(editing.useMeta().isNew.value).toBe(false);
  });

  it("AC-19 reports loading, ready, changed and valid as I work", async () => {
    await seedClientSession();

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    const meta = manager.useMeta();

    await manager.useActions().isReady();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isLoading.value).toBe(false);
    expect(meta.isDirty.value).toBe(false);
    expect(meta.hasErrors.value).toBe(false);

    manager.useActions().input({ email: "a@b.com" });
    await settleDebounce();

    await vi.waitFor(() => expect(meta.isDirty.value).toBe(true));
    expect(meta.isValid.value).toBe(true);
  });

  it("AC-19 reports itself as saving while a save is in flight, and finished once it settles", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary]);
    const created = recorded.created().data;
    let release: () => void = () => {};
    const held = new Promise<void>(resolve => {
      release = resolve;
    });

    server?.use(
      http.post(`*/clients/${clientId}/emails`, async () => {
        await held;
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientEmailManager().as(ScopeActorTypes.SELF).fresh();
    await manager.useActions().isReady();

    const saving = manager.useActions().update({ email: created.email });
    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(true)
    );

    release();
    await saving;

    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(false)
    );
    expect(manager.useMeta().isComplete.value).toBe(true);
  });
});

describe("client-email editor — lifecycle (AC-21)", () => {
  it("AC-21 stop() stops the editor but leaves it registered; destroy() releases it and the next open is fresh", async () => {
    await seedClientSession();
    const target = recorded.one().data;

    const manager = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", target.id);
    await manager.useActions().isReady();
    const firstService = manager.useInternals().service;
    const keyCount = clientEmailScopeKeys().length;

    manager.useActions().stop();
    expect(clientEmailScopeKeys()).toHaveLength(keyCount);

    manager.useActions().destroy();
    expect(clientEmailScopeKeys()).toHaveLength(keyCount - 1);

    const reopened = useClientEmailManager()
      .as(ScopeActorTypes.SELF)
      .for("email", target.id);
    expect(reopened.useInternals().service).not.toBe(firstService);
  });
});
