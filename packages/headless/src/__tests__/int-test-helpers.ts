// -----------------------------------------------------------------------------
/**
 * @module __tests__/int-test-helpers
 * @description Shared scaffolding for `*.int.test.ts` files across modules:
 * cookie-jar cleanup and MSW fixture-override factories for the
 * `/oauth/access_token`, `/self`, and `/admin/self` endpoints. Each module's
 * own `freshImports()` stays local — it imports module-specific paths and
 * doesn't belong here.
 */

import { http, HttpResponse } from "msw";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { filter, forEach } from "lodash-es";
import type { IToken } from "@upmind-automation/types";
import type { SetupServerApi } from "msw/node";

// -----------------------------------------------------------------------------

/** Clears every `upm_*_session` cookie (guest/client/user alike) from the jar. */
export function clearSessionCookies(): void {
  const names = filter(
    document.cookie.split(";").map(pair => pair.split("=")[0]?.trim()),
    name => /^upm_.*_session$/.test(name ?? "")
  );
  forEach(names, name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

export type FixtureOverrides = {
  overrideToken: (key: string) => IToken;
  overrideSelf: (key: string) => void;
  overrideAdminSelf: (key: string) => void;
};

/**
 * Builds per-file MSW override helpers bound to a given replay server and
 * fixtures directory. `overrideToken` returns the fixture body (the auth
 * suite's variant) so callers can assert on the minted token in addition to
 * installing the override.
 */
export function makeFixtureOverrides(
  server: SetupServerApi | undefined,
  recordingsDir: string
): FixtureOverrides {
  function overrideToken(key: string): IToken {
    const fixture = getFixture(key, { recordingsDir });
    server?.use(
      http.post("*/oauth/access_token", () =>
        HttpResponse.json(fixture.response.body as object, {
          status: fixture.response.status
        })
      )
    );
    return getFixtureBody<IToken>(key, { recordingsDir });
  }

  function overrideSelf(key: string): void {
    const fixture = getFixture(key, { recordingsDir });
    server?.use(
      http.get("*/self", () =>
        HttpResponse.json(fixture.response.body as object, {
          status: fixture.response.status
        })
      )
    );
  }

  function overrideAdminSelf(key: string): void {
    const fixture = getFixture(key, { recordingsDir });
    server?.use(
      http.get("*/admin/self", () =>
        HttpResponse.json(fixture.response.body as object, {
          status: fixture.response.status
        })
      )
    );
  }

  return { overrideToken, overrideSelf, overrideAdminSelf };
}
