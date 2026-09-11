// -----------------------------------------------------------------------------
/**
 * @module auth/__tests__/auth.tokens
 * @internal
 * @description The ONE place a recording run mints a REAL token. Minting is
 * auth-domain knowledge — the `/oauth/access_token` path, the grant shapes, the
 * `access_token`-or-`data` envelope, `IToken` — so it lives with `auth` and
 * every other module's `*.fixtures.ts` consumes it instead of re-rolling it.
 *
 * ## Why a plain `fetch` and not the Generator
 * `Generator` sanitises every body before it touches disk — that is its job, so
 * a recorded fixture never carries a real credential. A token minted THROUGH it
 * would come back sanitised and authenticate nothing. So an authed capture's
 * bearer must come from a plain `fetch` that never enters the capture pipeline
 * and never reaches disk. That is the shape below, and the reason for it.
 *
 * ## Why this is not the module's `internal-kit`
 * `auth.internal-kit.ts` re-exports the module's `@internal` SOURCE surface for
 * OTHER packages' test lanes, reached lazily as `internalKits["auth"]`. This
 * file is recording-time scaffolding for THIS package's own `*.fixtures.ts`
 * lane, consumed synchronously in `beforeAll`, so it stays off that registry.
 */

import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { GrantTypes } from "@upmind-automation/types";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to mint a recording token (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to mint a recording token (e.g. " +
          "set it in .env.recording). The API resolves the brand from the " +
          'Origin header; without it every call returns 404 "Domain not found!".'
      );
    })();

// -----------------------------------------------------------------------------

/** One request to the token endpoint. Keeps the status for error reporting. */
async function requestToken(
  grant: Record<string, string>
): Promise<{ status: number; token: IToken | undefined }> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: ORIGIN
    },
    body: new URLSearchParams(grant).toString()
  });
  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;
  return {
    status: response.status,
    token: token?.access_token ? token : undefined
  };
}

/**
 * Mint a REAL (unsanitised) token outside the capture pipeline. Returns
 * `undefined` when the grant is refused, so a caller can decide whether a
 * missing token is fatal or an honest omission (the refresh-grant case).
 * Prefer the actor helpers below; reach for this only for a raw grant the
 * actor set does not cover — `refresh_token`, `twofa`, a deliberate 401.
 */
export async function mintToken(
  grant: Record<string, string>
): Promise<IToken | undefined> {
  const { token } = await requestToken(grant);
  return token;
}

/**
 * The grant each staging actor logs in with. Staff authenticate through the
 * ADMIN grant, not PASSWORD — the staff/admin login path. Getting this wrong
 * returns a 401 that looks like bad credentials, so it is bound here once.
 */
const ACTOR_GRANTS: Record<keyof typeof API_CREDENTIALS, GrantTypes> = {
  client: GrantTypes.PASSWORD,
  otherClient: GrantTypes.PASSWORD,
  staff: GrantTypes.ADMIN
};

/**
 * Mint a token for one of the staging actors, or throw. Use this when the
 * capture cannot proceed without a bearer — the common case, where a silent
 * `undefined` would only surface later as an unexplained 401 fixture.
 */
async function mintActorToken(
  actor: keyof typeof API_CREDENTIALS
): Promise<IToken> {
  const { status, token } = await requestToken({
    grant_type: ACTOR_GRANTS[actor],
    username: API_CREDENTIALS[actor].username,
    password: API_CREDENTIALS[actor].password
  });
  if (!token) {
    throw new Error(
      `Could not mint a ${actor} token (${status}) — check ` +
        "tests/fixtures/credentials.ts against the recording brand."
    );
  }
  return token;
}

/** The staging client — the actor almost every capture records as. */
export const mintClientToken = (): Promise<IToken> => mintActorToken("client");

/** The staging staff user — mints through the ADMIN grant. */
export const mintStaffToken = (): Promise<IToken> => mintActorToken("staff");

/**
 * A SECOND, distinct client on the same brand — for capturing a real ownership
 * denial (reading another client's resource).
 */
export const mintOtherClientToken = (): Promise<IToken> =>
  mintActorToken("otherClient");

/**
 * Mint a guest token. Unlike the actor grants this returns `undefined` rather
 * than throwing: a brand can legitimately refuse the guest grant, and a caller
 * records that as an omission rather than failing the run.
 */
export const mintGuestToken = (): Promise<IToken | undefined> =>
  mintToken({ grant_type: GrantTypes.GUEST });
