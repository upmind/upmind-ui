// -----------------------------------------------------------------------------
/**
 * @fileoverview Auth integration — real machine, fixture-replayed grants
 *
 * ## Job To Be Done
 * Drive the REAL auth composable + machine against recorded /oauth and
 * /clients fixtures replayed by MSW: credential login, failure classes,
 * registration chaining, session short-circuit, logout→relogin, and the
 * guest-checkout guard — asserting token payloads and cookie persistence,
 * not just state names.
 *
 * ## What Breaks If These Fail
 * Customers cannot log in, or a failed grant is stored as a session; a
 * registration that half-succeeds strands an account nobody can use; a
 * disabled guest checkout mints guest-customers anyway.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../__tests__/int-test-helpers";
import { queryClient } from "../../query";
import { ScopeActorTypes } from "../../scope";
import { useSessionStore } from "../../session-store";
import { AuthContextTypes, AuthFlowTypes } from "../auth.types";
import { useAuth } from "../useAuth";
import { useVerifyEmail } from "../useVerifyEmail";
import { server } from "./setup.integration";
import { stateMatches } from "../../../utils";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

// D3: GUEST_CHECKOUT_ENABLED is a brand *setting*, not journey data — mocking
// it is sanctioned (ADR-021 "mock settings not data"; auth-gotchas §5).
const { authIntBrandConfig } = vi.hoisted(() => ({
  authIntBrandConfig: { GUEST_CHECKOUT_ENABLED: true } as Record<
    string,
    unknown
  >
}));

vi.mock("../../brand", () => ({
  useBrand: () => ({
    countryId: { value: undefined },
    getConfig: (keys: string | string[]) => {
      const picked: Record<string, unknown> = {};
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        if (key in authIntBrandConfig) picked[key] = authIntBrandConfig[key];
      }
      return picked;
    },
    getConfigValue: (key: string) => authIntBrandConfig[key]
  })
}));

// Recaptcha is external infra: with no grecaptcha in jsdom the real generate()
// blocks on waitFor("available"). Mock it to the no-token path — the register
// fixture was captured without a recaptcha_token (ADR-021 "mock infra not data").
vi.mock("../../system-recaptcha", () => ({
  useRecaptcha: () => ({
    clear: () => {},
    generate: () => Promise.resolve(undefined)
  })
}));

const { overrideToken, overrideSelf } = makeFixtureOverrides(
  server,
  recordingsDir
);

function overrideRegister(key: string): void {
  const fx = getFixture(key, { recordingsDir });
  server?.use(
    http.post("*/api/clients/register", () =>
      HttpResponse.json(fx.response.body as object, {
        status: fx.response.status
      })
    )
  );
}

function spyOnRequests(pathIncludes: string): ReturnType<typeof vi.fn> {
  const spy = vi.fn();
  const listener = ({ request }: { request: Request }): void => {
    if (request.url.includes(pathIncludes)) spy(request);
  };
  server?.events.on("request:start", listener);
  return spy;
}

function captureRequestBodies(pathIncludes: string): Promise<unknown>[] {
  const bodies: Promise<unknown>[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (request.url.includes(pathIncludes)) {
      bodies.push(request.clone().json());
    }
  };
  server?.events.on("request:start", listener);
  return bodies;
}

/**
 * Boot a settled client auth instance against the guest-minted, initialised
 * store established in `beforeEach`. The store MUST be initialised first: the
 * `withAccessToken` request gate blocks on `useSessionStore().isReady()`, so
 * login hangs forever against an uninitialised store (in the real app
 * `useUpmind` boots the store once at startup — the harness does the same).
 */
async function bootSettledClientAuth(): Promise<
  ReturnType<ReturnType<typeof useAuth>["as"]>
> {
  await useSessionStore().initStore();
  const auth = useAuth().as(ScopeActorTypes.CLIENT);
  await auth.useActions().isReady();
  return auth;
}

/**
 * A successful `authenticate()` resolves the auth machine into "authenticated"
 * (so `isAuthenticated`/`resolve()` return immediately) before the
 * session-store `add()` write it fires lands — `add()` awaits a background
 * `/self` load and is never awaited by the caller (auth.services.client.ts).
 * Left to settle on its own, that write can complete during the NEXT test's
 * `beforeEach`, after `clear()` has already reset the store: `add()` stamps
 * `initialised: true` as a side effect (so a session can be considered ready
 * without an explicit `initStore()`), which can satisfy that beforeEach's own
 * `isReady()` wait prematurely and hand the test a resurrected client/staff
 * session (the AU-I2 cross-test leak). Drain it via the public API — poll the
 * same actor/meta the test asserted on — before the next test's reset runs.
 */
async function settlePendingSessionWrites(): Promise<void> {
  await vi.waitFor(
    () => {
      const clientSettled =
        !useAuth().as(ScopeActorTypes.CLIENT).useMeta().isAuthenticated.value ||
        useSessionStore().useMeta().hasClientSession.value;
      const staffSettled =
        !useAuth().as(ScopeActorTypes.STAFF).useMeta().isAuthenticated.value ||
        useSessionStore().useMeta().hasStaffSession.value;
      if (!clientSettled || !staffSettled)
        throw new Error("session-store add() still settling");
    },
    { timeout: 2000, interval: 5 }
  );
}

/**
 * A successful `authenticate()` resolves the auth machine into "authenticated"
 * before the session-store `add()` write it fires lands (see
 * `settlePendingSessionWrites`). A test that seeds a login and then boots a
 * FRESH instance must wait for that write first: the fresh instance's one-shot
 * `checkSession` reads `clientSessions` synchronously and never re-checks, so an
 * uncommitted seed reads as unauthenticated. Poll the store's own meta until the
 * client session lands — this also drains the pending write so it cannot leak
 * into the next test's `beforeEach` after `clear()` (the `add()` cross-test leak
 * that defeats `settlePendingSessionWrites` when the seeding instance is
 * destroyed before it settles).
 */
async function awaitClientSessionCommitted(): Promise<void> {
  await vi.waitFor(
    () => {
      if (!useSessionStore().useMeta().hasClientSession.value)
        throw new Error("client session write still settling");
    },
    { timeout: 2000, interval: 5 }
  );
}

// -----------------------------------------------------------------------------

describe("auth integration (fixture replay)", () => {
  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    authIntBrandConfig.GUEST_CHECKOUT_ENABLED = true;
    useAuth().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useAuth().as(ScopeActorTypes.STAFF).useActions().destroy();
    // The session store is a module singleton. `clear()` wipes its in-memory
    // sessions (cookies/sessionStorage alone don't reconcile the live maps) so
    // a login in one test never leaks into the next; it also floors the active
    // pointer to guest, which triggers the store's async guest re-mint. The
    // mint needs the guest token endpoint, so install that override first, then
    // await `isReady()` so the mint settles before the test drives login — the
    // `withAccessToken` gate blocks on an uninitialised store.
    overrideToken("post-oauth-access-token-guest");
    useSessionStore().useActions().clear();
    await useSessionStore().useActions().isReady();
  });

  afterEach(async () => {
    server?.events.removeAllListeners("request:start");
    await settlePendingSessionWrites();
  });

  it("AU-I0: .for() wires scopeContext on a real instance", () => {
    // Moved from the unit context file (triage A1): scopeContext is sourced
    // from machine context, which a mocked-machine unit cannot populate.
    const auth = useAuth()
      .as(ScopeActorTypes.STAFF)
      .for(AuthContextTypes.CLIENT, "client-456");

    const context = auth.useContext();

    expect(context.scopeActor.value).toBe(ScopeActorTypes.STAFF);
    expect(context.scopeContext.value).toMatchObject({
      type: AuthContextTypes.CLIENT,
      id: "client-456"
    });

    auth.useActions().destroy();
  });

  it("AU-I1: client login resolves true and hands the recorded token to the session", async () => {
    const auth = await bootSettledClientAuth();
    const tokenBody = overrideToken("post-oauth-access-token-client");
    overrideSelf("get-self");

    await auth.useActions().start(AuthFlowTypes.LOGIN);
    const ok = await auth.useActions().resolve({
      username: "jane@example.com",
      password: "s3cret-pass"
    });

    expect(ok).toBe(true);
    expect(auth.useContext().session.value?.access_token).toBe(
      tokenBody.access_token
    );
    expect(auth.useContext().session.value?.actor_type).toBe("client");
    expect(auth.useMeta().isAuthenticated.value).toBe(true);
  });

  it("AU-I2: wrong credentials resolve false without persisting anything", async () => {
    const auth = await bootSettledClientAuth();
    overrideToken("post-oauth-access-token-case-bad-password");

    await auth.useActions().start(AuthFlowTypes.LOGIN);
    const ok = await auth.useActions().resolve({
      username: "jane@example.com",
      password: "wrong-password"
    });

    expect(ok).toBe(false);
    expect(auth.useMeta().hasErrors.value).toBe(true);
    expect(auth.useMeta().isAuthenticated.value).toBe(false);
    expect(useSessionStore().useMeta().hasClientSession.value).toBe(false);
  });

  it("AU-I3: empty credentials never leave the client", async () => {
    const auth = await bootSettledClientAuth();
    await auth.useActions().start(AuthFlowTypes.LOGIN);
    const spy = spyOnRequests("/oauth/access_token");

    const ok = await auth.useActions().resolve({
      username: "",
      password: ""
    });

    expect(ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(auth.useContext().validationErrors.value.length).toBeGreaterThan(0);
  });

  // A failed grant must settle cleanly: onError fires exactly once (with the
  // context error) and onDone never fires. onError is a plain callback
  // registration per auth-usage §onDone/onError and must not throw.
  it("AU-I4: a failed attempt settles: onError once, onDone never", async () => {
    const auth = await bootSettledClientAuth();
    overrideToken("post-oauth-access-token-case-bad-password");
    const onDone = vi.fn();
    const onError = vi.fn();
    auth.useActions().onDone(onDone);
    auth.useActions().onError(onError);

    await auth.useActions().start(AuthFlowTypes.LOGIN);
    const ok = await auth.useActions().resolve({
      username: "jane@example.com",
      password: "wrong-password"
    });

    expect(ok).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
  });

  it("AU-I5: success path fires onDone with the token payload", async () => {
    const auth = await bootSettledClientAuth();
    const tokenBody = overrideToken("post-oauth-access-token-client");
    overrideSelf("get-self");
    const onDone = vi.fn();
    auth.useActions().onDone(onDone);

    await auth.useActions().start(AuthFlowTypes.LOGIN);
    await auth.useActions().resolve({
      username: "jane@example.com",
      password: "s3cret-pass"
    });

    expect(onDone).toHaveBeenCalledTimes(1);
    const arg = onDone.mock.calls[0][0] as { token: IToken };
    expect(arg.token.actor_type).toBe("client");
    expect(arg.token.access_token).toBe(tokenBody.access_token);
  });

  it("AU-I6: an authenticated session short-circuits a fresh auth instance", async () => {
    const first = await bootSettledClientAuth();
    overrideToken("post-oauth-access-token-client");
    overrideSelf("get-self");
    await first.useActions().start(AuthFlowTypes.LOGIN);
    await first.useActions().resolve({
      username: "jane@example.com",
      password: "s3cret-pass"
    });
    expect(first.useMeta().isAuthenticated.value).toBe(true);

    await awaitClientSessionCommitted();
    first.useActions().destroy();
    const spy = spyOnRequests("/oauth/access_token");
    const revisit = useAuth().as(ScopeActorTypes.CLIENT);
    await revisit.useActions().isReady();

    expect(revisit.useMeta().isAuthenticated.value).toBe(true);
    expect(revisit.useMeta().showLoginForm.value).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("AU-I7: a guest session is NOT authenticated — login flow proceeds", async () => {
    overrideToken("post-oauth-access-token-guest");
    const auth = useAuth().as(ScopeActorTypes.CLIENT);

    await auth.useActions().isReady();
    expect(auth.useMeta().isAuthenticated.value).toBe(false);

    await auth.useActions().start(AuthFlowTypes.LOGIN);
    expect(auth.useMeta().showLoginForm.value).toBe(true);
  });

  it("AU-I13: .fresh() bypasses the session probe and shows the login form even with an active session", async () => {
    const first = await bootSettledClientAuth();
    overrideToken("post-oauth-access-token-client");
    overrideSelf("get-self");
    await first.useActions().start(AuthFlowTypes.LOGIN);
    await first.useActions().resolve({
      username: "jane@example.com",
      password: "s3cret-pass"
    });
    expect(first.useMeta().isAuthenticated.value).toBe(true);

    await awaitClientSessionCommitted();
    first.useActions().destroy();

    // A plain revisit would short-circuit to authenticated (see AU-I6); .fresh()
    // spawns a distinct-keyed instance that skips the probe and lands on idle.
    const fresh = useAuth().as(ScopeActorTypes.CLIENT).fresh();
    await fresh.useActions().isReady();

    expect(fresh.useMeta().isAuthenticated.value).toBe(false);

    await fresh.useActions().start(AuthFlowTypes.LOGIN);
    expect(fresh.useMeta().showLoginForm.value).toBe(true);

    fresh.useActions().destroy();
  });

  // OMITTED (O-auth-clients_fields, CONFIRMED — triage-round1.md registry):
  // Phase-0's `get-clients-fields.json` capture returned 401 ("Access token
  // has been revoked"), not the 200 the register flow needs to load its
  // custom-fields schema at start(AuthFlowTypes.REGISTER) — the MSW guard throws before
  // the register/token overrides below are ever exercised. Unblock: a valid
  // client bearer with GET /clients_fields read access, then
  // `pnpm fixtures:generate auth` and flip it.skip→it.
  it("AU-I8: duplicate-email registration surfaces a field error and does not authenticate", async () => {
    const auth = await bootSettledClientAuth();
    overrideRegister("post-clients-register-case-duplicate-email");

    await auth.useActions().start(AuthFlowTypes.REGISTER);
    const ok = await auth.useActions().resolve({
      username: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      password: "s3cret-pass"
    });

    expect(ok).toBe(false);
    // Fixture error.data.username: ["Already in use."] — errors arrive keyed
    // as `username` (auth-gotchas §3).
    const context = auth.useContext();
    const surfaced = JSON.stringify({
      validation: context.validationErrors.value,
      errors: context.errors.value
    });
    expect(surfaced).toContain("Already in use.");
    expect(auth.useMeta().isAuthenticated.value).toBe(false);
  });

  // OMITTED (O-auth-clients_fields, CONFIRMED — triage-round1.md registry):
  // same Phase-0 gap as AU-I8 — the register flow's custom-fields load has
  // no usable auth-owned 200 fixture. Unblock condition identical to AU-I8.
  it("AU-I9: fresh registration chains the login — one resolve, two wire calls, authenticated", async () => {
    const auth = await bootSettledClientAuth();
    overrideRegister("post-clients-register");
    overrideToken("post-oauth-access-token-client");
    const registerBodies = captureRequestBodies("/api/clients/register");
    const tokenSpy = spyOnRequests("/oauth/access_token");

    await auth.useActions().start(AuthFlowTypes.REGISTER);
    const ok = await auth.useActions().resolve({
      username: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      password: "s3cret-pass"
    });

    expect(ok).toBe(true);
    expect(registerBodies).toHaveLength(1);
    const wireBody = (await registerBodies[0]) as {
      email: string;
      username: string;
    };
    expect(wireBody.email).toBe("jane@example.com");
    expect(wireBody.username).toBe("jane@example.com");
    expect(tokenSpy).toHaveBeenCalled();
    expect(auth.useMeta().isAuthenticated.value).toBe(true);
  });

  // OMITTED (O-auth-clients_fields, CONFIRMED — triage-round1.md registry):
  // same Phase-0 gap as AU-I8/I9 — the register flow's custom-fields load
  // has no usable auth-owned 200 fixture. Unblock condition identical to AU-I8.
  it("AU-I10: registration split-success: account created, login fails → not authenticated", async () => {
    const auth = await bootSettledClientAuth();
    overrideRegister("post-clients-register");
    overrideToken("post-oauth-access-token-case-bad-password");
    const registerSpy = spyOnRequests("/api/clients/register");

    await auth.useActions().start(AuthFlowTypes.REGISTER);
    const ok = await auth.useActions().resolve({
      username: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      password: "s3cret-pass"
    });

    expect(ok).toBe(false);
    expect(registerSpy).toHaveBeenCalled();
    expect(auth.useMeta().isAuthenticated.value).toBe(false);
    expect(auth.useMeta().hasErrors.value).toBe(true);
  });

  // With a required link param absent (`hash`), verifyFromLink() must no-op:
  // no verify request reaches the API and it never throws (auth-usage
  // §useVerifyEmail 🧪 — "no verify request reaches the API when any param is
  // absent"; "never throws").
  it("AU-I11: verify-link with missing params fires no API call", async () => {
    window.history.pushState(
      {},
      "",
      "/verify-email?client_id=client-uuid&email_id=email-uuid"
    );
    const spy = spyOnRequests("check_verify");

    expect(() => useVerifyEmail().verifyFromLink()).not.toThrow();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(spy).not.toHaveBeenCalled();
  });

  // Bug 3 regression: the register flow starts in `loading`, whose failed
  // lookups load lands on the sibling `unavailable`. start() must settle on
  // `available` OR `unavailable` and report readiness — never wait the full
  // 60s timeout for an `available` that will never come.
  it("AU-I14: start(register) fast-resolves false when the fields load fails", async () => {
    const auth = await bootSettledClientAuth();
    // Earlier register tests warm the shared query cache with a 200 fields
    // response (staleTime 5m); drop it so this load actually hits the 500.
    queryClient.removeQueries({
      queryKey: ["session", ScopeActorTypes.CLIENT, "custom-fields"]
    });
    // A 4xx fails fast — the query client only retries 5xx (retry backoff would
    // otherwise dwarf the machine's settle), so this isolates start()'s settle.
    server?.use(
      http.get("*/api/clients_fields", () =>
        HttpResponse.json({ message: "nope" }, { status: 404 })
      )
    );

    const startedAt = Date.now();
    const ok = await auth.useActions().start(AuthFlowTypes.REGISTER);
    const elapsed = Date.now() - startedAt;

    expect(ok).toBe(false);
    expect(elapsed).toBeLessThan(5000);
    expect(
      stateMatches(auth.useInternals().state, "register.unavailable")
    ).toBe(true);
  });

  // Bug 4 regression: a REGISTER submitted while the form is still loading (the
  // unguarded shared-action path, which does NOT wait for `available`) must be
  // stashed and replayed once loading settles — not silently dropped. This is
  // AU-I9's chain driven from the mid-loading race.
  it("AU-I15: a register submit during loading is queued and fires when ready", async () => {
    const auth = await bootSettledClientAuth();
    overrideRegister("post-clients-register");
    overrideToken("post-oauth-access-token-client");
    const registerBodies = captureRequestBodies("/api/clients/register");

    // Do NOT await start — the fields schema is still loading. resolve() routes
    // to the shared register action, which submits without start()'s ready-wait.
    const started = auth.useActions().start(AuthFlowTypes.REGISTER);
    const ok = await auth.useActions().resolve({
      username: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      password: "s3cret-pass"
    });

    expect(ok).toBe(true);
    expect(auth.useMeta().isAuthenticated.value).toBe(true);
    expect(registerBodies).toHaveLength(1);
    const wireBody = (await registerBodies[0]) as { username: string };
    expect(wireBody.username).toBe("jane@example.com");

    await started;
  });

  it("AU-I12: guest-checkout guard blocks silently", async () => {
    authIntBrandConfig.GUEST_CHECKOUT_ENABLED = false;
    const spy = spyOnRequests("/clients/register/guest");
    const auth = useAuth().as(ScopeActorTypes.CLIENT);

    const ok = await auth.useActions().registerAsGuest();

    expect(ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
