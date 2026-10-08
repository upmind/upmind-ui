// @vitest-environment happy-dom
/**
 * @fileoverview Registration landing, RESET during an activation grant (unit)
 *
 * ## Job To Be Done
 * A `RESET` during `completing` or `completingWithPassword` stops
 * the grant, and the late answer of the stopped grant never activates a
 * session. Driven through the public `useVerifyRegistration` composable with a
 * held, recorded grant answer.
 *
 * ## What Breaks If These Fail
 * A guest who presses "Try again" while the activation is in flight is signed
 * in as the client anyway: the session cookie and the session store switch to
 * a client for a landing the guest already abandoned.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthEvents, useSessionStore } from "../../session-store";
import {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VALID_PASSWORD,
  VERIFY_ROUTE,
  landing,
  overrideSelf,
  reachSetPassword,
  serve,
  serveHeld,
  server,
  useLandingHarness
} from "./useVerifyRegistration.kit";
import { filter, includes, isPlainObject, get } from "lodash-es";
import type { Landing } from "./useVerifyRegistration.kit";

// -----------------------------------------------------------------------------

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

useLandingHarness();

const CLIENT_COOKIE = "upm_client_session=";
const GRANT_PATH = "/oauth/access_token";
const LATE_ANSWER_WAIT_MS = 100;

const loginEvents = (): unknown[] =>
  filter(
    get(window, "dataLayer", []) as unknown[],
    entry => isPlainObject(entry) && get(entry, "event") === AuthEvents.LOGIN
  );

const isGrant = (request: Request): boolean =>
  new URL(request.url).pathname.endsWith(GRANT_PATH);

beforeEach(() => {
  Reflect.deleteProperty(window, "dataLayer");
  server?.events.removeAllListeners("request:start");
  server?.events.removeAllListeners("response:mocked");
});

/**
 * Holds the grant answer, resets the landing while the grant is in flight and
 * then lets the answer go. The re-run link check is refused so the restarted
 * landing sends no grant of its own.
 *
 * @returns How many grant requests were sent and whether the held one was
 * answered after the reset.
 */
async function resetWhileGranting(
  instance: Landing,
  grantKey: string,
  trigger: () => void
): Promise<{ grants: number; answered: boolean }> {
  let grants = 0;
  let answered = false;
  server?.events.on("request:start", ({ request }) => {
    if (isGrant(request)) grants += 1;
  });
  server?.events.on("response:mocked", ({ request }) => {
    if (isGrant(request)) answered = true;
  });
  const release = serveHeld("post", GRANT_ROUTE, grantKey);

  await trigger();
  await vi.waitFor(() => expect(grants).toBe(1));
  serve("patch", VERIFY_ROUTE, RECORDING.invalidHash);
  instance.useActions().reset();
  release();
  await vi.waitFor(() => expect(answered).toBe(true));
  await new Promise(resolve => setTimeout(resolve, LATE_ANSWER_WAIT_MS));
  await instance.useActions().isReady();
  return { grants, answered };
}

function expectNoSession(instance: Landing): void {
  expect(includes(document.cookie, CLIENT_COOKIE)).toBe(false);
  expect(useSessionStore().useMeta().hasClientSession.value).toBe(false);
  expect(instance.useContext().sessionId.value).toBeUndefined();
  expect(instance.useMeta().isSuccess.value).toBe(false);
  expect(loginEvents()).toHaveLength(0);
}

describe("a reset during the activation grant", () => {
  it("never saves the client session when the direct grant is reset", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
    overrideSelf(RECORDING.self);
    const instance = landing();

    const outcome = await resetWhileGranting(
      instance,
      RECORDING.grantDirect,
      () => instance.useActions().verify(LINK)
    );

    expect(outcome).toStrictEqual({ grants: 1, answered: true });
    expectNoSession(instance);
  });

  it("never saves the client session when the set-password grant is reset", async () => {
    const instance = await reachSetPassword();
    overrideSelf(RECORDING.self);
    instance.useActions().set(VALID_PASSWORD);

    const outcome = await resetWhileGranting(
      instance,
      RECORDING.grantWithPassword,
      () => instance.useActions().completeRegistration()
    );

    expect(outcome).toStrictEqual({ grants: 1, answered: true });
    expectNoSession(instance);
  });

  it("saves the client session when the grant is not reset", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
    serve("post", GRANT_ROUTE, RECORDING.grantDirect);
    overrideSelf(RECORDING.self);
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    await vi.waitFor(() => {
      expect(includes(document.cookie, CLIENT_COOKIE)).toBe(true);
      expect(useSessionStore().useMeta().hasClientSession.value).toBe(true);
      expect(loginEvents()).toHaveLength(1);
    });
  });
});
