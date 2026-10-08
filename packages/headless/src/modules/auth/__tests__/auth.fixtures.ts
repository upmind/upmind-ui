// -----------------------------------------------------------------------------
/**
 * @fileoverview Auth Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `auth` module hits and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir —
 * the same files the auth integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate auth
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix (see the package vitest configs). It has
 * no assertions: an `it()` succeeds when the capture completes. `save()` in
 * `afterAll` writes every capture once.
 *
 * ## Variant discrimination
 * Several captures share one endpoint (`/oauth/access_token`,
 * `/api/clients/register`). Same-identity captures would collide on filename,
 * buffer key, and the fixture linter's `[dup]` check, so each variant carries a
 * synthetic `?case=<purpose>` identity param — the discriminator the naming /
 * lint / MSW-matching pipeline is built around. The param is inert server-side.
 *
 * An "error" capture that unexpectedly succeeds (2xx) is dropped from the
 * buffer instead of saved — a fixture named for a failure must contain one.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
import { mintClientToken, mintGuestToken } from "./auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

// Base is the API ROOT (not `/api`): the module's data endpoints live under
// `/api/*` while the OAuth token endpoint is served at the root `/oauth/*`, so
// each capture passes its full path.
const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set it " +
          "in .env.recording). The API resolves the brand from the Origin " +
          'header; without it every call returns 404 "Domain not found!".'
      );
    })();

const FORM_URLENCODED = {
  "Content-Type": "application/x-www-form-urlencoded"
};

// Mirrors session-store.services.ts loadClientUser exactly (param string copied
// from session-store.fixtures.ts) so the recorded envelope matches what the
// real service receives on the post-login /self handoff.
const SELF_QUERY =
  "with_count=actor.child_client_configs&with=" +
  [
    "actor",
    "actor.account",
    "actor.brand",
    "actor.image",
    "actor.parent_client_config.parent_client",
    "actor.parent_client_config.parent_client.image",
    "accounts",
    "delegated_ids",
    "enabled_modules"
  ].join();

// -----------------------------------------------------------------------------

/** Drop a buffered capture whose recorded path carries the given case tag. */
function dropCapture(generator: Generator, caseTag: string): void {
  const captures = generator.getCapturedFixtures();
  for (const [key, { fixture }] of captures) {
    if (fixture.request.path.includes(`case=${caseTag}`)) captures.delete(key);
  }
}

const disposableEmail = (purpose: string): string =>
  `nathan.robinson+fixturegen-${purpose}-${Date.now()}@upmind.com`;

// -----------------------------------------------------------------------------

describe("Auth API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken | undefined;
  let guestToken: IToken | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "auth"
    });

    clientToken = await mintClientToken();
    guestToken = await mintGuestToken();
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures POST /oauth/access_token password grant (200, client)", async () => {
    await generator.post(
      "/oauth/access_token",
      {
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.client.username,
        password: API_CREDENTIALS.client.password
      },
      FORM_URLENCODED
    );
  });

  it("captures POST /oauth/access_token with a bad password (401)", async () => {
    await generator.post(
      "/oauth/access_token?case=bad-password",
      {
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.client.username,
        password: "definitely-not-the-password"
      },
      FORM_URLENCODED
    );
  });

  it("captures POST /oauth/access_token guest grant (200, guest)", async () => {
    const { status } = await generator.post(
      "/oauth/access_token",
      { grant_type: GrantTypes.GUEST },
      FORM_URLENCODED
    );
    if (status !== 200) {
      console.warn(`[auth.fixtures] guest grant returned ${status}, not 200`);
    }
  });

  it("captures POST /oauth/access_token refresh grant (200)", async () => {
    if (!clientToken?.refresh_token) {
      console.warn(
        "[auth.fixtures] OMISSION: password grant returned no refresh_token; " +
          "refresh-grant fixture not captured."
      );
      return;
    }
    await generator.post(
      "/oauth/access_token?case=refresh",
      {
        grant_type: GrantTypes.REFRESH_TOKEN,
        refresh_token: clientToken.refresh_token
      },
      FORM_URLENCODED
    );
  });

  it("captures POST /oauth/access_token with a malformed payload (4xx)", async () => {
    const { status } = await generator.post(
      "/oauth/access_token?case=malformed",
      { grant_type: GrantTypes.PASSWORD },
      FORM_URLENCODED
    );
    if (status < 400) {
      dropCapture(generator, "malformed");
      console.warn(
        `[auth.fixtures] OMISSION: malformed payload returned ${status}; ` +
          "capture dropped."
      );
    }
  });

  it("captures POST /api/clients/register (200)", async () => {
    if (guestToken?.access_token) {
      generator.setBearerToken(guestToken.access_token);
    }
    const email = disposableEmail("register");
    const { status } = await generator.post("/api/clients/register", {
      email,
      username: email,
      firstname: "Fixture",
      lastname: "Generator",
      password: "Fixturegen-2026-Xy!"
    });
    generator.clearBearerToken();
    if (status !== 200) {
      console.warn(
        `[auth.fixtures] register returned ${status}, not 200 — capture kept ` +
          "(honest), but the happy path may need a recaptcha-disabled brand."
      );
    }
  });

  it("captures POST /api/clients/register with a duplicate email (4xx)", async () => {
    if (guestToken?.access_token) {
      generator.setBearerToken(guestToken.access_token);
    }
    const { status } = await generator.post(
      "/api/clients/register?case=duplicate-email",
      {
        email: API_CREDENTIALS.client.username,
        username: API_CREDENTIALS.client.username,
        firstname: "Fixture",
        lastname: "Generator",
        password: "Fixturegen-2026-Xy!"
      }
    );
    generator.clearBearerToken();
    if (status < 400) {
      dropCapture(generator, "duplicate-email");
      console.warn(
        `[auth.fixtures] OMISSION: duplicate-email register returned ` +
          `${status}; capture dropped.`
      );
    }
  });

  it("captures POST /api/clients/register with an invalid bearer (401)", async () => {
    generator.setBearerToken("fixturegen-invalid-token");
    const email = disposableEmail("invalid-token");
    const { status } = await generator.post(
      "/api/clients/register?case=invalid-token",
      {
        email,
        username: email,
        firstname: "Fixture",
        lastname: "Generator",
        password: "Fixturegen-2026-Xy!"
      }
    );
    generator.clearBearerToken();
    if (status < 400) {
      dropCapture(generator, "invalid-token");
      console.warn(
        `[auth.fixtures] OMISSION: invalid-token register returned ${status} ` +
          "(endpoint does not enforce auth); capture dropped."
      );
    }
  });

  it("captures GET /api/clients_fields (200, client)", async () => {
    // The password-grant capture above re-mints for the same user, which
    // revokes the beforeAll bearer — the authed GETs need a fresh mint.
    clientToken = await mintClientToken();
    if (clientToken?.access_token) {
      generator.setBearerToken(clientToken.access_token);
    }
    const { status } = await generator.get("/api/clients_fields");
    generator.clearBearerToken();
    if (status !== 200) {
      console.warn(
        `[auth.fixtures] clients_fields returned ${status}, not 200`
      );
    }
  });

  it("captures GET /api/self (200, client)", async () => {
    if (clientToken?.access_token) {
      generator.setBearerToken(clientToken.access_token);
    }
    const { status } = await generator.get(`/api/self?${SELF_QUERY}`);
    generator.clearBearerToken();
    if (status !== 200) {
      console.warn(`[auth.fixtures] self returned ${status}, not 200`);
    }
  });
});

// -----------------------------------------------------------------------------

const VERIFY_LINK_KEYS = [
  "RECORDING_VERIFY_USERNAME_NO_PASSWORD",
  "RECORDING_VERIFY_HASH_NO_PASSWORD",
  "RECORDING_VERIFY_USERNAME_WITH_PASSWORD",
  "RECORDING_VERIFY_HASH_WITH_PASSWORD"
] as const;

const VERIFY_PATH = "/api/clients/reg_hash/verify";
const MADE_UP_HASH = "0000000000000000000000000000000000000000";
const MADE_UP_USERNAME = "fixturegen-unknown@example.com";

type VerifyLink = { username: string; hash: string };

/** Read the one-time link values from the shell; they never live in a file. */
function readVerifyLinks(): {
  noPassword: VerifyLink;
  withPassword: VerifyLink;
} {
  const missing = VERIFY_LINK_KEYS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Registration-link captures need ${VERIFY_LINK_KEYS.join(", ")} ` +
        `exported in the shell. Missing: ${missing.join(", ")}.`
    );
  }
  const readEnv = (key: (typeof VERIFY_LINK_KEYS)[number]): string => {
    const value = process.env[key];
    if (!value) throw new Error(`${key} is not exported in the shell.`);
    return value;
  };
  return {
    noPassword: {
      username: readEnv("RECORDING_VERIFY_USERNAME_NO_PASSWORD"),
      hash: readEnv("RECORDING_VERIFY_HASH_NO_PASSWORD")
    },
    withPassword: {
      username: readEnv("RECORDING_VERIFY_USERNAME_WITH_PASSWORD"),
      hash: readEnv("RECORDING_VERIFY_HASH_WITH_PASSWORD")
    }
  };
}

const verifyBody = ({ username, hash }: VerifyLink) => ({
  username,
  reg_hash: hash
});

const completeBody = ({ username, hash }: VerifyLink, password?: string) => ({
  grant_type: GrantTypes.COMPLETE_REGISTRATION,
  username,
  reg_hash: hash,
  ...(password ? { password } : {})
});

describe("Auth registration-link fixtures generator", () => {
  let generator: Generator;

  beforeAll(() => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "auth"
    });
  });

  afterAll(() => {
    generator.save();
  });

  // Order matters: the verify captures read a link without using it, the
  // grant captures (8, 9) use each link up.
  it("captures PATCH verify, has_password false (1)", async () => {
    const { noPassword } = readVerifyLinks();
    await generator.patch(
      `${VERIFY_PATH}?case=no-password`,
      verifyBody(noPassword)
    );
  });

  it("captures PATCH verify, has_password true (2)", async () => {
    const { withPassword } = readVerifyLinks();
    await generator.patch(
      `${VERIFY_PATH}?case=has-password`,
      verifyBody(withPassword)
    );
  });

  it("captures PATCH verify with a made-up hash (3)", async () => {
    await generator.patch(`${VERIFY_PATH}?case=invalid-hash`, {
      username: MADE_UP_USERNAME,
      reg_hash: MADE_UP_HASH
    });
  });

  it("captures POST complete_registration with a made-up hash (4)", async () => {
    await generator.post(
      "/oauth/access_token?case=complete-refused",
      completeBody(
        { username: MADE_UP_USERNAME, hash: MADE_UP_HASH },
        "abcdefg1"
      ),
      FORM_URLENCODED
    );
  });

  it("captures PATCH verify with an invalid bearer (7)", async () => {
    generator.setBearerToken("fixturegen-invalid-token");
    await generator.patch(`${VERIFY_PATH}?case=bad-bearer`, {
      username: MADE_UP_USERNAME,
      reg_hash: MADE_UP_HASH
    });
    generator.clearBearerToken();
  });

  it("captures POST complete_registration with a password (8)", async () => {
    const { noPassword } = readVerifyLinks();
    await generator.post(
      "/oauth/access_token?case=complete-with-password",
      completeBody(noPassword, "Fixturegen-2026-Xy!"),
      FORM_URLENCODED
    );
  });

  it("captures POST complete_registration with no password (9)", async () => {
    const { withPassword } = readVerifyLinks();
    await generator.post(
      "/oauth/access_token?case=complete-direct",
      completeBody(withPassword),
      FORM_URLENCODED
    );
  });
});
