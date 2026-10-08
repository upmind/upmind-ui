/**
 * @fileoverview Registration-activation landing, guest x self (integration)
 *
 * ## Job To Be Done
 * Drive the real `useVerifyRegistration` composable and machine against the
 * recorded staging answers of the verify and `complete_registration` requests:
 * which token each request carries, which body keys it sends, which outcome
 * and which error the landing publishes. Each title starts with its criterion.
 *
 * ## What Breaks If These Fail
 * A guest who opens the activation email lands on an expired page although the
 * link is good, sends a staff token to the verify endpoint, leaks the password
 * confirmation to the API, or is moved to an unsafe address.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes, BrandConfigKeys } from "@upmind-automation/types";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { messageDisplays, useFeedback, useMessage } from "../../feedback";
import { useRoutingEngine } from "../../routing";
import {
  persistTokenToStorage,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VERIFY_ROUTE,
  landing,
  overrideSelf,
  overrideToken,
  recordingsDir,
  serve,
  server,
  useLandingHarness
} from "./useVerifyRegistration.kit";
import type { Landing } from "./useVerifyRegistration.kit";
import {
  filter,
  find,
  forEach,
  get,
  includes,
  isEmpty,
  keys,
  map,
  omit,
  reject,
  size,
  sortBy
} from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/", component: { render: () => null } }]
});

const { brandConfig } = vi.hoisted(() => ({
  brandConfig: {} as Record<string, unknown>
}));

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: (key: string) => brandConfig[key]
  })
}));

type Outbound = {
  method: string;
  pathname: string;
  authorization: string | null;
  body: Record<string, unknown> | undefined;
};

/**
 * Records every request from the call on.
 *
 * @returns A reader that settles the body reads and answers the requests in
 * the order they went out.
 */
function recordOutbound(): () => Promise<Outbound[]> {
  const pending: Promise<Outbound>[] = [];
  server?.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    const snapshot = request.clone();
    pending.push(
      snapshot.text().then(text => {
        const isForm = (snapshot.headers.get("content-type") ?? "").includes(
          "x-www-form-urlencoded"
        );
        let body: Record<string, unknown> | undefined;
        if (text && isForm) {
          body = Object.fromEntries(new URLSearchParams(text));
        } else if (text) {
          body = JSON.parse(text) as Record<string, unknown>;
        }
        return {
          method: request.method,
          pathname: url.pathname,
          authorization: request.headers.get("authorization"),
          body
        };
      })
    );
  });
  return () => Promise.all(pending);
}

const isGrant = (call: Outbound): boolean =>
  call.pathname.endsWith("/oauth/access_token");
const isVerify = (call: Outbound): boolean =>
  call.pathname.endsWith("/reg_hash/verify");

/** Edits one documented field of a recorded verify body. */
const withVerifyField =
  (field: string, value: unknown) =>
  (body: Record<string, unknown>): Record<string, unknown> => ({
    ...body,
    data: { ...(body.data as Record<string, unknown>), [field]: value }
  });

// -----------------------------------------------------------------------------

describe("registration landing, guest x self (recorded staging answers)", () => {
  beforeAll(() => {
    useRoutingEngine().init(router);
  });

  useLandingHarness();

  beforeEach(() => {
    forEach(keys(brandConfig), key => delete brandConfig[key]);
  });

  afterEach(() => {
    server?.events.removeAllListeners("request:start");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("AC-4 a landing that has not started waits and sends nothing", async () => {
    const outbound = recordOutbound();
    const instance = landing();
    const meta = instance.useMeta();
    const context = instance.useContext();

    expect(meta.isVerifying.value).toBe(true);
    forEach(
      [
        meta.needsPassword,
        meta.needsCompleteStep,
        meta.twoFARequired,
        meta.isSuccess,
        meta.isExpiredOrInvalid,
        meta.isProcessing,
        meta.hasErrors,
        meta.hasValidationErrors,
        meta.isComplete
      ],
      flag => expect(flag.value).toBe(false)
    );
    expect(context.twoFAProvider.value).toBeNull();
    expect(context.validationErrors.value).toStrictEqual([]);
    expect(await outbound()).toStrictEqual([]);
  });

  describe("AC-1 the link is checked with the client token only", () => {
    const cases = [
      { name: "no session", seed: [], expected: null },
      {
        name: "a guest token only",
        seed: [AccessRoleTypes.GUEST],
        expected: null
      },
      {
        name: "a client token",
        seed: [AccessRoleTypes.CLIENT],
        expected: "client-bearer"
      },
      {
        name: "a staff token and a client token",
        seed: [AccessRoleTypes.STAFF, AccessRoleTypes.CLIENT],
        expected: "client-bearer"
      }
    ];

    forEach(cases, ({ name, seed, expected }) => {
      it(`AC-1 sends one verify with the link values and the right bearer for ${name}`, async () => {
        for (const actorType of seed) {
          await seedSession(`${actorType}-bearer`, actorType);
        }
        if (isEmpty(seed)) clearSessionCookies();
        serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
        serve("post", GRANT_ROUTE, RECORDING.grantDirect);
        overrideSelf(RECORDING.self);
        const outbound = recordOutbound();

        const instance = landing();
        await instance.useActions().verify(LINK);
        await instance.useActions().isReady();

        const verifies = filter(await outbound(), isVerify);
        expect(verifies).toHaveLength(1);
        expect(verifies[0].method).toBe("PATCH");
        expect(verifies[0].body).toStrictEqual({
          username: LINK.username,
          reg_hash: LINK.hash
        });
        expect(verifies[0].authorization).toBe(
          expected ? `Bearer ${expected}` : null
        );
      });
    });
  });

  it("AC-2 a client with a password is activated at once, with no password and no bearer", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
    serve("post", GRANT_ROUTE, RECORDING.grantDirect);
    overrideSelf(RECORDING.self);
    const outbound = recordOutbound();

    const instance = landing();
    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    const grants = filter(await outbound(), isGrant);
    expect(grants).toHaveLength(1);
    expect(sortBy(keys(grants[0].body))).toStrictEqual([
      "grant_type",
      "reg_hash",
      "username"
    ]);
    expect(grants[0].body).toMatchObject({
      grant_type: "complete_registration",
      username: LINK.username,
      reg_hash: LINK.hash
    });
    expect(grants[0].authorization).toBeNull();
    expect(instance.useMeta().isSuccess.value).toBe(true);
    expect(instance.useMeta().isComplete.value).toBe(true);
  });

  describe("AC-3 the activated account becomes the client session", () => {
    it("AC-3 saves the grant token as the client cookie and publishes the session id", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      overrideSelf(RECORDING.self);
      const grant = grantBody(RECORDING.grantDirect);

      const instance = landing();
      expect(instance.useContext().sessionId.value).toBeUndefined();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(clientCookie()).toContain(grant.access_token);
      expect(instance.useContext().sessionId.value).toBe(grant.actor_id);
    });

    it("AC-3 saves the token as a client even when the grant names no actor type", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serveGrantEdited(RECORDING.grantDirect, body => omit(body, "actor_type"));
      overrideSelf(RECORDING.self);
      const grant = grantBody(RECORDING.grantDirect);

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(clientCookie()).toContain(grant.access_token);
    });
  });

  describe("AC-5 two-factor sign-in is reported", () => {
    it("AC-5 reports that two-factor is necessary and still reaches success", async () => {
      serve(
        "patch",
        VERIFY_ROUTE,
        RECORDING.hasPassword,
        withVerifyField("twofa_enabled", true)
      );
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      overrideSelf(RECORDING.self);

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(instance.useMeta().twoFARequired.value).toBe(true);
      expect(instance.useMeta().isSuccess.value).toBe(true);
    });

    it("AC-5 publishes the provider in lower case", async () => {
      serve(
        "patch",
        VERIFY_ROUTE,
        RECORDING.hasPassword,
        withVerifyField("twofa_provider", "TOTP")
      );
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      overrideSelf(RECORDING.self);

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(instance.useContext().twoFAProvider.value).toBe("totp");
    });
  });

  it("AC-6 a client with no name still completes with one grant", async () => {
    serve(
      "patch",
      VERIFY_ROUTE,
      RECORDING.hasPassword,
      withVerifyField("has_name", false)
    );
    serve("post", GRANT_ROUTE, RECORDING.grantDirect);
    overrideSelf(RECORDING.self);
    const outbound = recordOutbound();

    const instance = landing();
    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(instance.useMeta().needsCompleteStep.value).toBe(true);
    expect(filter(await outbound(), isGrant)).toHaveLength(1);
    expect(instance.useMeta().isSuccess.value).toBe(true);
  });

  it("AC-7 a client with no password stops at the set-password step", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
    const outbound = recordOutbound();

    const instance = landing();
    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    const context = instance.useContext();
    expect(context.currentState.value).toBe("needsPassword");
    expect(instance.useMeta().needsPassword.value).toBe(true);
    expect(sortBy(keys(get(context.schema.value, "properties")))).toStrictEqual(
      ["password", "password_confirmation", "username"]
    );
    expect(context.model.value?.username).toBe(LINK.username);
    expect(context.validationErrors.value).toStrictEqual([]);
    expect(filter(await outbound(), isGrant)).toStrictEqual([]);
  });

  describe("AC-8 a weak or mismatched password is refused", () => {
    const cases = [
      {
        password: "abcdef1",
        confirmation: "abcdef1",
        path: "/password",
        keyword: "minLength"
      },
      {
        password: "12345678",
        confirmation: "12345678",
        path: "/password",
        keyword: "pattern"
      },
      {
        password: "abcdefgh",
        confirmation: "abcdefgh",
        path: "/password",
        keyword: "pattern"
      },
      {
        password: "abcdefg1",
        confirmation: "abcdefg2",
        path: "/password_confirmation",
        keyword: "const"
      }
    ];

    forEach(cases, ({ password, confirmation, path, keyword }) => {
      it(`AC-8 refuses ${password} with confirmation ${confirmation} under ${keyword} and sends nothing`, async () => {
        serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
        const outbound = recordOutbound();

        const instance = landing();
        await instance.useActions().verify(LINK);
        await instance.useActions().isReady();
        instance
          .useActions()
          .set({ password, password_confirmation: confirmation });
        await instance.useActions().completeRegistration();

        expect(instance.useMeta().hasValidationErrors.value).toBe(true);
        expect(instance.useContext().currentState.value).toBe("needsPassword");
        expect(instance.useContext().validationErrors.value).toMatchObject([
          { instancePath: path, keyword }
        ]);
        expect(filter(await outbound(), isGrant)).toStrictEqual([]);
      });
    });
  });

  it("AC-9 a valid password activates the account without the confirmation", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
    serve("post", GRANT_ROUTE, RECORDING.grantWithPassword);
    overrideSelf(RECORDING.self);
    const outbound = recordOutbound();

    const instance = landing();
    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();
    instance
      .useActions()
      .set({ password: "abcdefg1", password_confirmation: "abcdefg1" });
    await instance.useActions().completeRegistration();
    await instance.useActions().isReady();

    const grants = filter(await outbound(), isGrant);
    expect(grants).toHaveLength(1);
    expect(sortBy(keys(grants[0].body))).toStrictEqual([
      "grant_type",
      "password",
      "reg_hash",
      "username"
    ]);
    expect(grants[0].body?.password).toBe("abcdefg1");
    expect(grants[0].authorization).toBeNull();
    expect(instance.useMeta().isSuccess.value).toBe(true);
  });

  describe("AC-10 an old link is refused at the set-password step", () => {
    const expires = "2020-01-01T10:00:00Z";

    it("AC-10 refuses a past expiry date with the invalid-link error and no grant", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
      const outbound = recordOutbound();

      const instance = landing();
      await instance.useActions().verify({ ...LINK, expires });
      await instance.useActions().isReady();

      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useContext().error.value?.message).toBe(
        "error.session_verify_link_invalid"
      );
      expect(filter(await outbound(), isGrant)).toStrictEqual([]);
    });

    it("AC-10 does not check the expiry date on the direct path", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      overrideSelf(RECORDING.self);

      const instance = landing();
      await instance.useActions().verify({ ...LINK, expires });
      await instance.useActions().isReady();

      expect(instance.useMeta().isSuccess.value).toBe(true);
    });
  });

  describe("AC-11 the analytics ids travel with the activation", () => {
    const GA = "_ga=GA1.1.123456789.1690000000";
    const GA_SESSION = "_ga_ABC123=GS1.1.1690000000.5.1.1690000100.0.0.0";

    async function activate(): Promise<Outbound | undefined> {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      overrideSelf(RECORDING.self);
      const outbound = recordOutbound();
      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();
      return find(await outbound(), isGrant);
    }

    afterEach(() => {
      forEach(["_ga", "_ga_ABC123"], name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
    });

    it("AC-11 sends the client id and the session id with the grant", async () => {
      brandConfig[BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID] = "G-ABC123";
      document.cookie = `${GA}; path=/`;
      document.cookie = `${GA_SESSION}; path=/`;

      const grant = await activate();

      expect(grant?.body?.meta).toMatchObject({
        ga_client_id: "123456789.1690000000",
        ga_session_id: "1690000000"
      });
    });

    it("AC-11 sends no meta when the brand has no analytics id", async () => {
      document.cookie = `${GA}; path=/`;
      document.cookie = `${GA_SESSION}; path=/`;

      const grant = await activate();

      expect(grant?.body?.meta).toBeUndefined();
    });

    it("AC-11 sends no meta when the session cookie is absent", async () => {
      brandConfig[BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID] = "G-ABC123";
      document.cookie = `${GA}; path=/`;

      const grant = await activate();

      expect(grant?.body?.meta).toBeUndefined();
    });
  });

  it("AC-12 a link with a missing value is refused at once", async () => {
    const outbound = recordOutbound();

    const noUsername = landing();
    await noUsername.useActions().verify({ hash: "x" });
    await noUsername.useActions().isReady();
    const first = {
      expired: noUsername.useMeta().isExpiredOrInvalid.value,
      error: noUsername.useContext().error.value
    };
    noUsername.useActions().destroy();

    const noHash = landing();
    await noHash.useActions().verify({ username: "a" });
    await noHash.useActions().isReady();

    expect(first.expired).toBe(true);
    expect(first.error).toMatchObject({
      status: 400,
      origin: "headless",
      message: "error.session_verify_link_invalid"
    });
    expect(noHash.useMeta().isExpiredOrInvalid.value).toBe(true);
    expect(noHash.useContext().error.value).toMatchObject({
      status: 400,
      origin: "headless",
      message: "error.session_verify_link_invalid"
    });
    expect(await outbound()).toStrictEqual([]);
  });

  describe("AC-13 a refused link shows the failure", () => {
    it("AC-13 publishes the recorded refusal and sends no grant", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.invalidHash);
      const refusal = getFixture(RECORDING.invalidHash, {
        recordingsDir
      }).response;
      const outbound = recordOutbound();

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useMeta().hasErrors.value).toBe(true);
      expect(instance.useContext().error.value?.status).toBe(refusal.status);
      expect(instance.useContext().error.value?.message).toBe(
        get(refusal.body, "error.message")
      );
      expect(filter(await outbound(), isGrant)).toStrictEqual([]);
    });

    it("AC-13 keeps the 500 status of a server failure", async () => {
      serveStatus("patch", VERIFY_ROUTE, 500);
      const outbound = recordOutbound();

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useMeta().hasErrors.value).toBe(true);
      expect(instance.useContext().error.value?.status).toBe(500);
      expect(filter(await outbound(), isGrant)).toStrictEqual([]);
    });
  });

  describe("AC-14 a refused activation after the form shows the failure", () => {
    async function submitValidPassword(): Promise<ReturnType<typeof landing>> {
      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();
      instance
        .useActions()
        .set({ password: "abcdefg1", password_confirmation: "abcdefg1" });
      await instance.useActions().completeRegistration();
      await instance.useActions().isReady();
      return instance;
    }

    it("AC-14 publishes the recorded grant refusal as expired-or-invalid", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantRefused);
      const refusal = getFixture(RECORDING.grantRefused, {
        recordingsDir
      }).response;

      const instance = await submitValidPassword();

      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useMeta().isSuccess.value).toBe(false);
      expect(instance.useContext().error.value?.status).toBe(refusal.status);
    });

    it("AC-14 publishes expired-or-invalid when a 2xx grant carries no access_token", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantWithPassword, body =>
        omit(body, "access_token")
      );

      const instance = await submitValidPassword();

      expect(instance.useContext().currentState.value).toBe("expiredOrInvalid");
      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useMeta().hasErrors.value).toBe(true);
      expect(instance.useContext().error.value).toBeTruthy();
      expect(instance.useMeta().isProcessing.value).toBe(false);
      expect(instance.useMeta().isSuccess.value).toBe(false);
      expect(document.cookie).not.toContain("upm_client_session=");
    });

    it("AC-14 keeps the 500 status of a server failure on the grant", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
      serveStatus("post", GRANT_ROUTE, 500);

      const instance = await submitValidPassword();

      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useMeta().isSuccess.value).toBe(false);
      expect(instance.useContext().error.value?.status).toBe(500);
    });
  });

  describe("AC-15 a refused direct activation shows an error", () => {
    it("AC-15 reports the completion failure with the recorded refusal", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantRefused);
      const refusal = getFixture(RECORDING.grantRefused, {
        recordingsDir
      }).response;

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(instance.useContext().currentState.value).toBe("completionFailed");
      expect(instance.useMeta().hasErrors.value).toBe(true);
      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(false);
      expect(instance.useContext().error.value?.status).toBe(refusal.status);
    });

    it("AC-15 reports a completion failure when a 2xx grant carries no access_token", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect, body =>
        omit(body, "access_token")
      );

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(instance.useContext().currentState.value).toBe("completionFailed");
      expect(instance.useMeta().hasErrors.value).toBe(true);
      expect(instance.useContext().error.value).toBeTruthy();
      expect(instance.useMeta().isProcessing.value).toBe(false);
      expect(instance.useMeta().isSuccess.value).toBe(false);
      expect(document.cookie).not.toContain("upm_client_session=");
    });

    it("AC-15 keeps the 500 status of a server failure on the grant", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serveStatus("post", GRANT_ROUTE, 500);

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();

      expect(instance.useContext().currentState.value).toBe("completionFailed");
      expect(instance.useContext().error.value?.status).toBe(500);
    });
  });

  it("AC-16 a blocked address keeps its API code and refusal status", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.invalidHash, body => ({
      ...body,
      error: {
        ...(body.error as Record<string, unknown>),
        code: "ip_address_disallowed"
      }
    }));
    const refusal = getFixture(RECORDING.invalidHash, {
      recordingsDir
    }).response;
    const outbound = recordOutbound();

    const instance = landing();
    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(instance.useMeta().hasErrors.value).toBe(true);
    expect(instance.useContext().error.value?.apiCode).toBe(
      "ip_address_disallowed"
    );
    expect(instance.useContext().error.value?.status).toBe(refusal.status);
    expect(instance.useContext().currentState.value).toBe("expiredOrInvalid");
    expect(filter(await outbound(), isGrant)).toStrictEqual([]);
  });

  describe("AC-17 the landing never moves the guest", () => {
    const outcomes = [
      {
        name: "the direct activation of AC-2",
        state: "success",
        drive: async (instance: Landing) => {
          serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
          serve("post", GRANT_ROUTE, RECORDING.grantDirect);
          overrideSelf(RECORDING.self);
          await instance.useActions().verify(LINK);
        }
      },
      {
        name: "the set-password step of AC-7",
        state: "needsPassword",
        drive: async (instance: Landing) => {
          serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
          await instance.useActions().verify(LINK);
        }
      },
      {
        name: "the password activation of AC-9",
        state: "success",
        drive: async (instance: Landing) => {
          serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
          serve("post", GRANT_ROUTE, RECORDING.grantWithPassword);
          overrideSelf(RECORDING.self);
          await instance.useActions().verify(LINK);
          await instance.useActions().isReady();
          instance
            .useActions()
            .set({ password: "abcdefg1", password_confirmation: "abcdefg1" });
          await instance.useActions().completeRegistration();
        }
      },
      {
        name: "the invalid link of AC-12",
        state: "expiredOrInvalid",
        drive: (instance: Landing) =>
          instance.useActions().verify({ hash: "x" })
      },
      {
        name: "the refused link of AC-13",
        state: "expiredOrInvalid",
        drive: async (instance: Landing) => {
          serve("patch", VERIFY_ROUTE, RECORDING.invalidHash);
          await instance.useActions().verify(LINK);
        }
      },
      {
        name: "the refused direct activation of AC-15",
        state: "completionFailed",
        drive: async (instance: Landing) => {
          serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
          serve("post", GRANT_ROUTE, RECORDING.grantRefused);
          await instance.useActions().verify(LINK);
        }
      }
    ];

    forEach(outcomes, ({ name, state, drive }) => {
      it(`AC-17 leaves the route, the page and the history alone at ${name}`, async () => {
        const push = vi.spyOn(router, "push");
        const routerReplace = vi.spyOn(router, "replace");
        const assign = vi.fn();
        const replace = vi.fn();
        vi.stubGlobal("location", {
          hostname: window.location.hostname,
          host: window.location.host,
          origin: window.location.origin,
          protocol: window.location.protocol,
          href: window.location.href,
          assign,
          replace
        });
        const pushState = vi.spyOn(window.history, "pushState");
        const replaceState = vi.spyOn(window.history, "replaceState");

        const instance = landing();
        await drive(instance);
        await instance.useActions().isReady();

        expect(instance.useContext().currentState.value).toBe(state);
        expect(push).not.toHaveBeenCalled();
        expect(routerReplace).not.toHaveBeenCalled();
        expect(assign).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
        expect(pushState).not.toHaveBeenCalled();
        expect(replaceState).not.toHaveBeenCalled();
      });
    });
  });

  describe("AC-18 only a safe return path is offered", () => {
    const cases = [
      { target: "/billing?tab=1", offered: "/billing?tab=1" },
      { target: "\\/billing", offered: "/billing" },
      { target: "//evil.example", offered: undefined }
    ];

    forEach(cases, ({ target, offered }) => {
      it(`AC-18 offers ${String(offered)} for ${target}`, async () => {
        serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
        serve("post", GRANT_ROUTE, RECORDING.grantDirect);
        overrideSelf(RECORDING.self);

        const instance = landing();
        await instance.useActions().verify({ ...LINK, redirect: target });
        await instance.useActions().isReady();

        expect(instance.useContext().redirect.value).toBe(offered);
      });
    });
  });

  describe("AC-19 the consumer can wait for the new client", () => {
    it("AC-19 resolves with the recorded user when no client was signed in", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      overrideSelf(RECORDING.self);
      const self = getFixture(RECORDING.self, { recordingsDir }).response.body;

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();
      const user = await twoStepRead(instance);

      expect(get(user, "id")).toBe(get(self, "data.actor.id"));
    });

    it("AC-19 keeps the signed-in client active when /self fails for the new token", async () => {
      await seedSession("client-a-bearer", AccessRoleTypes.CLIENT);
      const self = getFixture(RECORDING.self, { recordingsDir }).response;
      server?.use(
        http.get("*/self", ({ request }) =>
          request.headers.get("authorization") === "Bearer client-a-bearer"
            ? HttpResponse.json(self.body as Record<string, unknown>, {
                status: self.status
              })
            : new HttpResponse(null, { status: 500 })
        )
      );
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      const outbound = recordOutbound();

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();
      await vi.waitFor(async () => {
        const failed = filter(
          await outbound(),
          call =>
            call.pathname.endsWith("/self") &&
            call.authorization ===
              `Bearer ${grantBody(RECORDING.grantDirect).access_token}`
        );
        expect(failed).toHaveLength(1);
      });

      expect(instance.useMeta().isSuccess.value).toBe(true);
      expect(useActiveSession().useContext().sessionId.value).toBe(
        "client-a-bearer-actor"
      );
      expect(instance.useContext().sessionId.value).toBe(
        grantBody(RECORDING.grantDirect).actor_id
      );
    });

    it("AC-19 C1 makes the new client the active session when /self succeeds for its token", async () => {
      await seedSession("client-a-bearer", AccessRoleTypes.CLIENT);
      overrideSelf(RECORDING.self);
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      const grant = grantBody(RECORDING.grantDirect);
      const self = getFixture(RECORDING.self, { recordingsDir }).response.body;

      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();
      const user = await twoStepRead(instance);

      expect(clientCookie()).toContain(grant.access_token);
      expect(useActiveSession().useContext().sessionId.value).toBe(
        grant.actor_id
      );
      expect(get(user, "id")).toBe(get(self, "data.actor.id"));
    });
  });

  describe("AC-21 a retry runs the link check again", () => {
    it("AC-21 publishes the invalid-link error again and sends nothing", async () => {
      const outbound = recordOutbound();
      const instance = landing();
      await instance.useActions().verify({ hash: "x" });
      await instance.useActions().isReady();
      const refusal = instance.useContext().error.value;

      instance.useActions().reset();
      await instance.useActions().isReady();

      expect(instance.useContext().currentState.value).toBe("expiredOrInvalid");
      expect(instance.useContext().error.value).not.toBe(refusal);
      expect(instance.useContext().error.value).toMatchObject({
        status: 400,
        message: "error.session_verify_link_invalid"
      });
      expect(await outbound()).toStrictEqual([]);
    });

    it("AC-21 sends the verify again after a refused link", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.invalidHash);
      const outbound = recordOutbound();
      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();
      const first = size(filter(await outbound(), isVerify));

      instance.useActions().reset();
      await vi.waitFor(async () => {
        expect(size(filter(await outbound(), isVerify))).toBe(first * 2);
      });
    });

    it("AC-21 ignores a reset on a landing that has not started", async () => {
      const outbound = recordOutbound();
      const instance = landing();
      instance.useActions().reset();

      expect(instance.useContext().currentState.value).toBe("idle");
      expect(await outbound()).toStrictEqual([]);
    });
  });

  describe("AC-22 one landing per scope, fresh after destroy", () => {
    it("AC-22 returns one instance per scope and a fresh idle one after destroy", async () => {
      expect(landing().useInternals().service).toBe(
        landing().useInternals().service
      );

      const first = landing();
      first.useActions().destroy();
      const second = landing();

      expect(second.useInternals().service).not.toBe(
        first.useInternals().service
      );
      expect(second.useContext().currentState.value).toBe("idle");
    });

    it("AC-22 keeps the held instance on success and hands a new idle one after the session switch", async () => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      const self = getFixture(RECORDING.self, { recordingsDir }).response;
      let release: () => void = () => undefined;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      server?.use(
        http.get("*/self", async () => {
          await gate;
          return HttpResponse.json(self.body as Record<string, unknown>, {
            status: self.status
          });
        })
      );

      const held = landing();
      await held.useActions().verify(LINK);
      await held.useActions().isReady();

      expect(landing().useInternals().service).toBe(
        held.useInternals().service
      );
      release();
      await twoStepRead(held);

      const next = landing();
      expect(next.useInternals().service).not.toBe(held.useInternals().service);
      expect(next.useContext().currentState.value).toBe("idle");
      expect(held.useMeta().isSuccess.value).toBe(true);
    });
  });
  describe("committed recordings", () => {
    const captures = [
      RECORDING.noPassword,
      RECORDING.hasPassword,
      RECORDING.invalidHash,
      RECORDING.grantRefused,
      RECORDING.badBearer,
      RECORDING.grantWithPassword,
      RECORDING.grantDirect
    ];

    forEach(captures, capture => {
      it(`holds the auth generator's staging capture ${capture}`, () => {
        const file = join(recordingsDir, `${capture}.json`);

        expect(existsSync(file)).toBe(true);
        expect(JSON.parse(readFileSync(file, "utf-8"))).toMatchObject({
          source: "case",
          provenance: { case: "auth" }
        });
      });
    });
  });

  describe("D16 401 the house retry on a refused verify", () => {
    async function verifyRefused(): Promise<{
      verifies: Outbound[];
      instance: Landing;
    }> {
      serve("patch", VERIFY_ROUTE, RECORDING.badBearer);
      const outbound = recordOutbound();
      const instance = landing();
      await instance.useActions().verify(LINK);
      await instance.useActions().isReady();
      return { verifies: filter(await outbound(), isVerify), instance };
    }

    it("D16 401 resends the staff bearer when a staff and a client token are held", async () => {
      await seedSession("staff-bearer", AccessRoleTypes.STAFF);
      await seedSession("client-bearer", AccessRoleTypes.CLIENT);

      const { verifies, instance } = await verifyRefused();

      expect(verifies.length).toBeGreaterThan(1);
      expect(map(verifies, "authorization")).toContain("Bearer staff-bearer");
      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useContext().error.value).toMatchObject({ status: 401 });
    });

    it("D16 401 shows the 401 interstitial and ends at expired-or-invalid when no token is stored", async () => {
      clearSessionCookies();
      const shownBefore = map(useFeedback().messages.value, "id");

      const { instance } = await verifyRefused();

      await vi.waitFor(() => {
        const shown = map(
          reject(useFeedback().messages.value, ({ id }) =>
            includes(shownBefore, id)
          ),
          item => useMessage(item).message.value
        );
        expect(shown).toContainEqual(
          expect.objectContaining({
            display: messageDisplays.INTERSTITIAL,
            data: { status: 401 }
          })
        );
      });
      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useContext().error.value).toMatchObject({ status: 401 });
    });

    it("D16 401 resends the refreshed guest bearer on the second request when only a guest token is held", async () => {
      await seedSession("guest-bearer", AccessRoleTypes.GUEST);

      const { verifies, instance } = await verifyRefused();

      const refreshed = grantBody(RECORDING.guestToken).access_token;
      expect(refreshed).not.toBe("guest-bearer");
      expect(verifies.length).toBeGreaterThan(1);
      expect(verifies[0].authorization).toBeNull();
      expect(verifies[1].authorization).toBe(`Bearer ${refreshed}`);
      expect(
        useSessionStore().useContext().guestSession.value?.access_token
      ).toBe(refreshed);
      expect(instance.useMeta().isExpiredOrInvalid.value).toBe(true);
      expect(instance.useContext().error.value).toMatchObject({ status: 401 });
    });
  });
});

type GrantBody = { access_token: string; actor_id: string };

function grantBody(key: string): GrantBody {
  return getFixtureBody<GrantBody>(key, { recordingsDir });
}

function serveGrantEdited(
  key: string,
  edit: (body: Record<string, unknown>) => Record<string, unknown>
): void {
  serve("post", GRANT_ROUTE, key, edit);
}

function serveStatus(
  method: "patch" | "post",
  route: string,
  status: number
): void {
  server?.use(http[method](route, () => new HttpResponse(null, { status })));
}

function clientCookie(): string {
  const pair = find(document.cookie.split(";"), part =>
    part.trim().startsWith("upm_client_session=")
  );
  return atob(decodeURIComponent((pair ?? "").split("=").slice(1).join("=")));
}

const staffRecordings = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

const recordedToken = (actorType: AccessRoleTypes): IToken => {
  if (actorType === AccessRoleTypes.STAFF) {
    return getFixtureBody<IToken>("post-oauth-access-token-user", {
      recordingsDir: staffRecordings
    });
  }
  return getFixtureBody<IToken>(
    actorType === AccessRoleTypes.GUEST
      ? RECORDING.guestToken
      : RECORDING.grantDirect,
    { recordingsDir }
  );
};

/**
 * Seeds a session whose token carries a distinct, readable bearer. The edited
 * fields of the recorded token are `access_token`, because every recorded
 * token is masked to the same text, and the `actor_id` of a signed-in actor.
 */
async function seedSession(
  accessToken: string,
  actorType: AccessRoleTypes
): Promise<void> {
  if (actorType === AccessRoleTypes.STAFF) {
    const adminSelf = getFixture("get-admin-self", {
      recordingsDir: staffRecordings
    }).response;
    server?.use(
      http.get("*/admin/self", () =>
        HttpResponse.json(adminSelf.body as Record<string, unknown>, {
          status: adminSelf.status
        })
      )
    );
  }
  const recorded = recordedToken(actorType);
  const isGuest = actorType === AccessRoleTypes.GUEST;
  await persistTokenToStorage({
    ...recorded,
    actor_id: isGuest ? recorded.actor_id : `${accessToken}-actor`,
    access_token: accessToken
  });
  await vi.waitFor(() => {
    const store = useSessionStore();
    const held = {
      [AccessRoleTypes.GUEST]: () =>
        store.useContext().guestSession.value?.access_token === accessToken,
      [AccessRoleTypes.CLIENT]: () => store.useMeta().hasClientSession.value,
      [AccessRoleTypes.STAFF]: () => store.useMeta().hasStaffSession.value
    };
    if (!held[actorType]()) throw new Error("session still settling");
  });
}

/** The consumer's two-step read of the new client session. */
async function twoStepRead(instance: Landing): Promise<unknown> {
  const sessionId = instance.useContext().sessionId.value;
  await vi.waitFor(() => {
    if (useActiveSession().useContext().sessionId.value !== sessionId) {
      throw new Error("session not active yet");
    }
  });
  return useActiveSession().useActions().whenAuthenticated();
}
