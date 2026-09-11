// -----------------------------------------------------------------------------
/**
 * @fileoverview Session-Store Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `session-store` module's boot flow hits and
 * (re)generate their sanitised v3 fixtures into this module's OWN co-located
 * `fixtures/` dir — the same files the session-store integration tests replay
 * through MSW. Run on demand:
 *
 *   pnpm fixtures:generate session-store
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix (see the package vitest configs). It has
 * no assertions: an `it()` succeeds when the capture completes. `save()` in
 * `afterAll` writes every capture once.
 *
 * ## Ownership notes (ADR 025)
 * The boot flow's guest mint hits `/oauth/access_token` — the same endpoint
 * the auth module owns fixtures for. Replay loads ONLY a unit's own co-located
 * dir, so cross-module reuse is structurally impossible: this unit records its
 * OWN guest-grant copy. Duplication across units is intended.
 *
 * `GET admin/self` (staff variant) is captured only when the staff credentials
 * in tests/fixtures/credentials.ts are valid on the recording brand; otherwise
 * it is skipped and reported as an omission.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintGuestToken,
  mintStaffToken
} from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

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

// Mirrors session-store.services.ts loadClientUser / loadStaffUser exactly so
// the recorded envelope matches what the real service receives.
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

const ADMIN_SELF_QUERY =
  "with=" +
  [
    "actor",
    "actor.image",
    "brands",
    "brands.image",
    "brands.icon",
    "functionalities",
    "user_flow_secrets",
    "upmind_contract_product"
  ].join();

// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------

describe("Session-Store API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let staffToken: IToken | undefined;
  let guestToken: IToken | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "session-store"
    });

    clientToken = await mintClientToken();

    guestToken = await mintGuestToken();
    if (!guestToken?.refresh_token) {
      console.warn(
        "[session-store.fixtures] OMISSION: could not mint a guest token with " +
          "a refresh_token; POST /oauth/access_token refresh grant (guest) " +
          "not captured."
      );
    }

    staffToken = await mintStaffToken().catch(() => undefined);
    if (!staffToken) {
      console.warn(
        "[session-store.fixtures] OMISSION: staff credentials rejected on " +
          "the recording brand; GET admin/self (200) not captured."
      );
    }
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/self (200, client)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/self?${SELF_QUERY}`);
    generator.clearBearerToken();
  });

  it("captures GET /api/self with an invalid bearer (401)", async () => {
    generator.setBearerToken("fixturegen-invalid-token");
    await generator.get(`/api/self?case=invalid-token&${SELF_QUERY}`);
    generator.clearBearerToken();
  });

  it("captures POST /oauth/access_token guest grant (200) — boot-flow mint", async () => {
    const { status } = await generator.post(
      "/oauth/access_token",
      { grant_type: GrantTypes.GUEST },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] guest mint returned ${status}, not 200`
      );
    }
  });

  it("captures POST /oauth/access_token refresh grant (200, guest) — mid-session guest refresh", async () => {
    // `?case=` keeps this out of the boot-flow guest fixture's identity: both
    // responses carry actor_type "guest", so without it the filename collides
    // and the re-record overwrites the boot mint (fixture-naming.mjs).
    if (!guestToken?.refresh_token) return;
    const { status } = await generator.post(
      "/oauth/access_token?case=refresh-guest",
      {
        grant_type: GrantTypes.REFRESH_TOKEN,
        refresh_token: guestToken.refresh_token
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] guest refresh returned ${status}, not 200`
      );
    }
  });

  it("captures POST /oauth/access_token with a rejected grant (4xx)", async () => {
    const { status } = await generator.post(
      "/oauth/access_token?case=rejected-grant",
      {
        grant_type: GrantTypes.REFRESH_TOKEN,
        refresh_token: "fixturegen-invalid-refresh-token"
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status < 400) {
      console.warn(
        `[session-store.fixtures] rejected grant returned ${status}, ` +
          "expected 4xx — inspect the capture before committing."
      );
    }
  });

  it("captures POST /oauth/access_token password grant (200, client)", async () => {
    const { status } = await generator.post(
      "/oauth/access_token",
      {
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.client.username,
        password: API_CREDENTIALS.client.password
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] client login mint returned ${status}, not 200`
      );
    }
  });

  it("captures POST /oauth/access_token admin grant (200, staff)", async () => {
    if (!staffToken?.access_token) return;
    const { status } = await generator.post(
      "/oauth/access_token",
      {
        grant_type: GrantTypes.ADMIN,
        username: API_CREDENTIALS.staff.username,
        password: API_CREDENTIALS.staff.password
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    if (status !== 200) {
      console.warn(
        `[session-store.fixtures] staff login mint returned ${status}, not 200`
      );
    }
  });

  it("captures GET /api/admin/self (200, staff — only if creds valid)", async () => {
    if (!staffToken?.access_token) return;
    generator.setBearerToken(staffToken.access_token);
    await generator.get(`/api/admin/self?${ADMIN_SELF_QUERY}`);
    generator.clearBearerToken();
  });

  it("captures GET /api/admin/self with a client token (wrong actor, 4xx)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/admin/self?case=wrong-actor&${ADMIN_SELF_QUERY}`
    );
    generator.clearBearerToken();
    if (status < 400) {
      console.warn(
        `[session-store.fixtures] wrong-actor admin/self returned ${status}, ` +
          "expected 4xx — inspect the capture before committing."
      );
    }
  });
});
