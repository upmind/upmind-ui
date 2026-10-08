// -----------------------------------------------------------------------------
/**
 * @module auth/__tests__/useVerifyRegistration.recordings
 * @description The registration-landing recordings and the link they answer:
 * the recordings directory, the routes they are served on, their keys, the
 * link values, a password that passes every rule, and the answers that serve a
 * recording on a given replay server. Starts no server, so the headless kit
 * and the labs page specs each bind it to their own.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { getFixture } from "@upmind-automation/test-fixtures";
import type { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

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
  badBearer: "patch-clients-reg-hash-verify-case-bad-bearer",
  guestToken: "post-oauth-access-token-guest",
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

type ReplayServer = ReturnType<typeof startReplayServer>;

type Method = "patch" | "post";

type BodyEdit = (body: Record<string, unknown>) => Record<string, unknown>;

/**
 * Binds the recording answers to one replay server.
 *
 * @param server The replay server the answers are registered on.
 * @returns `serve`, which answers `route` with a recording's status and body,
 * optionally with one documented field of the body edited, and `serveHeld`,
 * which answers only once its returned release is called.
 */
export function makeLandingAnswers(server: ReplayServer): {
  serve: (method: Method, route: string, key: string, edit?: BodyEdit) => void;
  serveHeld: (method: Method, route: string, key: string) => () => void;
} {
  function serve(
    method: Method,
    route: string,
    key: string,
    edit?: BodyEdit
  ): void {
    const { response } = getFixture(key, { recordingsDir });
    const body = response.body as Record<string, unknown>;
    server?.use(
      http[method](route, () =>
        HttpResponse.json(edit ? edit(body) : body, {
          status: response.status
        })
      )
    );
  }

  function serveHeld(method: Method, route: string, key: string): () => void {
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

  return { serve, serveHeld };
}
