// -----------------------------------------------------------------------------
/**
 * @module auth/__tests__/useVerifyRegistration.kit
 * @description Shared scaffolding of the registration-landing layer specs: the
 * replay server of the auth recordings, served answers for the verify and the
 * grant, a gate that holds an answer, and the per-test reset of the landing
 * instances, the session store and the request listeners. Holds no assertion.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, vi } from "vitest";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../__tests__/int-test-helpers";
import { ScopeActorTypes } from "../../scope";
import { useSessionStore } from "../../session-store";
import { useVerifyRegistration } from "../useVerifyRegistration";
import { server } from "./setup.integration";
import {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VALID_PASSWORD,
  VERIFY_ROUTE,
  makeLandingAnswers,
  recordingsDir
} from "./useVerifyRegistration.recordings";
import { forEach, includes } from "lodash-es";

// -----------------------------------------------------------------------------

export {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VALID_PASSWORD,
  VERIFY_ROUTE,
  recordingsDir
};

export { server };

export type Landing = ReturnType<
  ReturnType<typeof useVerifyRegistration>["as"]
>;

const { overrideToken, overrideSelf } = makeFixtureOverrides(
  server,
  recordingsDir
);

export { overrideSelf, overrideToken };

export const { serve, serveHeld } = makeLandingAnswers(server);

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

export function landing(): Landing {
  return useVerifyRegistration().as(ScopeActorTypes.SELF);
}

export function destroyLandings(): void {
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
    server?.events.removeAllListeners("request:start");
    server?.events.removeAllListeners("response:mocked");
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
