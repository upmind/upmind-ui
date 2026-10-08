// -----------------------------------------------------------------------------
/**
 * @module auth/__tests__/useVerifyRegistration.kit
 * @description Shared scaffolding of the registration-landing layer specs: the
 * replay server of the auth recordings, served answers for the verify and the
 * grant, a gate that holds an answer, and the per-test reset of the landing
 * instances and the session store. Holds no assertion.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../__tests__/int-test-helpers";
import { ScopeActorTypes } from "../../scope";
import { useSessionStore } from "../../session-store";
import { useVerifyRegistration } from "../useVerifyRegistration";
import { server } from "./setup.integration";
import { forEach, includes } from "lodash-es";

// -----------------------------------------------------------------------------

export const recordingsDir = join(import.meta.dirname, "fixtures");

export const VERIFY_ROUTE = "*/api/clients/reg_hash/verify";
export const GRANT_ROUTE = "*/oauth/access_token";

export const RECORDING = {
  noPassword: "patch-clients-reg-hash-verify-case-no-password",
  hasPassword: "patch-clients-reg-hash-verify-case-has-password",
  invalidHash: "patch-clients-reg-hash-verify-case-invalid-hash",
  grantRefused: "post-oauth-access-token-case-complete-refused",
  grantWithPassword:
    "post-oauth-access-token-case-complete-with-password-client",
  grantDirect: "post-oauth-access-token-case-complete-direct-client",
  self: "get-self"
} as const;

export const LINK = {
  username: "link-user@example.com",
  hash: "link-hash-value"
};

export const VALID_PASSWORD = {
  password: "abcdefg1",
  password_confirmation: "abcdefg1"
};

export { server };

export type Landing = ReturnType<
  ReturnType<typeof useVerifyRegistration>["as"]
>;

const { overrideToken, overrideSelf } = makeFixtureOverrides(
  server,
  recordingsDir
);

export { overrideSelf };

/** Serves a recording's recorded status and body on `route`. */
export function serve(
  method: "patch" | "post",
  route: string,
  key: string
): void {
  const { response } = getFixture(key, { recordingsDir });
  server?.use(
    http[method](route, () =>
      HttpResponse.json(response.body as Record<string, unknown>, {
        status: response.status
      })
    )
  );
}

/** Serves a control answer with a status and an optional JSON body. */
export function serveControl(
  method: "patch" | "post",
  route: string,
  status: number,
  body?: unknown
): void {
  server?.use(
    http[method](route, () =>
      body === undefined
        ? new HttpResponse(null, { status })
        : HttpResponse.json(body as Record<string, unknown>, { status })
    )
  );
}

/**
 * Serves a recording on `route` only after the returned release is called.
 *
 * @returns The function that lets the held answer go.
 */
export function serveHeld(
  method: "patch" | "post",
  route: string,
  key: string
): () => void {
  const { response } = getFixture(key, { recordingsDir });
  let release: () => void = () => undefined;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  server?.use(
    http[method](route, async () => {
      await gate;
      return HttpResponse.json(response.body as Record<string, unknown>, {
        status: response.status
      });
    })
  );
  return release;
}

export function landing(): Landing {
  return useVerifyRegistration().as(ScopeActorTypes.SELF);
}

function destroyLandings(): void {
  forEach(
    [
      ScopeActorTypes.SELF,
      ScopeActorTypes.GUEST,
      ScopeActorTypes.CLIENT,
      ScopeActorTypes.STAFF
    ],
    actor => useVerifyRegistration().as(actor).useActions().destroy()
  );
}

/** Drives a landing from the link to the set-password step. */
export async function reachSetPassword(): Promise<Landing> {
  serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
  const instance = landing();
  await instance.useActions().verify(LINK);
  await instance.useActions().isReady();
  return instance;
}

/** Registers the per-test reset of the landing instances and the store. */
export function useLandingHarness(): void {
  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    destroyLandings();
    overrideToken("post-oauth-access-token-guest");
    useSessionStore().useActions().clear();
    await useSessionStore().useActions().isReady();
    await vi.waitFor(() => {
      if (includes(document.cookie, "upm_client_session=")) {
        clearSessionCookies();
        useSessionStore().useActions().clear();
        throw new Error("a client session of the previous test came back");
      }
    });
    await useSessionStore().useActions().isReady();
  });

  afterEach(async () => {
    await vi.waitFor(() => {
      if (
        includes(document.cookie, "upm_client_session=") !==
        useSessionStore().useMeta().hasClientSession.value
      ) {
        throw new Error("session-store write still settling");
      }
    });
    destroyLandings();
  });
}
