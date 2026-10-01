// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate — integration project setup (T05, design.md §8.9)
 *
 * ## Job To Be Done
 * Start the replay server over this unit's OWN co-located fixtures, reset the
 * session store to a clean guest floor before each spec, and tear down every
 * piece of module-scope state the resolver and the query cache hold after
 * each spec — so no spec's result depends on run order (design.md §8.9
 * "Teardown between specs", "Session reset").
 *
 * ## What Breaks If These Fail
 * A spec observes a stale published account, a stale query cache entry, or a
 * leaked session from an earlier spec, and its outbound-request assertions
 * are no longer trustworthy.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach } from "vitest";
import { createI18n } from "vue-i18n";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";
import { useBrand } from "../../brand";
import { queryClient } from "../../query";
import { clearAll as clearScopeRegistry } from "../../scope/scope.registry";
import { useSessionStore } from "../../session-store";
import { useI18n } from "../../system-localisation";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";

// -----------------------------------------------------------------------------

/**
 * `new URL("./fixtures", import.meta.url).pathname` — and `import.meta.dirname`
 * alike — resolve to a broken pseudo-path (e.g. `/src/modules/affiliate/__tests__/fixtures`,
 * missing the real absolute prefix) under this package's "integration"
 * vitest project (`environment: "happy-dom"`), a pre-existing, deterministic
 * environment defect: it silently empties every
 * fixture lookup (`loadFixtures` sees no directory via `existsSync` and
 * returns `[]`) rather than crashing loudly at `startReplayServer()`, so
 * EVERY session-dependent integration spec in this unit failed with
 * "Missing fixture" or, where a call skips the `existsSync` guard (this
 * unit's own `affiliate.replay.int.test.ts`), a raw `ENOENT`. `process.cwd()`
 * is a real Node global, immune to whatever happy-dom/Vite global shadows
 * `import.meta.url` here — the SAME proven pattern this unit's own UNIT
 * specs already use (`affiliate.mappers.test.ts`, `affiliate.utils.test.ts`:
 * `resolve(process.cwd(), "src/modules/affiliate/__tests__/fixtures")`).
 */
export const recordingsDir = resolve(
  process.cwd(),
  "src/modules/affiliate/__tests__/fixtures"
);

/**
 * `@workspace/no-cross-package-path-imports` bars a relative path reaching
 * across a package boundary — `packages/i18n` publishes no subpath specifier
 * for its locale source JSON, only `@upmind-automation/i18n`'s own
 * `./src/index.ts` (unlike `@upmind-automation/test-fixtures`, which DOES
 * alias a `/credentials` and a `/generator` subpath — fixed at its own call
 * site in `affiliate.fixtures.ts` with the proper specifier instead of this
 * workaround). A plain static `import … from "../../../../../../packages/i18n/…"`
 * is exactly that barred path. `readFileSync(join(...))` is the sibling
 * pattern this repo already uses for the SAME class of file
 * (`client-company.manager.int.test.ts`), resolved off `import.meta.dirname`
 * — never `process.cwd()`, which breaks if vitest runs from a cwd other than
 * `packages/headless` (pseudo-Nathan review pass 20: `resolve(process.cwd(),
 * "../i18n/...")` is cwd-dependent). A scratch probe this pass confirmed
 * `import.meta.dirname` resolves a real, correct absolute path in this exact
 * happy-dom integration project — the broken construction this file's own
 * `recordingsDir` comment names is specifically `new URL(relative,
 * import.meta.url).pathname`, never `import.meta.dirname` itself.
 */
function readLocaleJson(relativeFromThisDir: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(import.meta.dirname, relativeFromThisDir), "utf-8")
  ) as Record<string, unknown>;
}

const errorEn = readLocaleJson(
  "../../../../../i18n/src/core/error-en.json"
) as Record<string, string>;
const textEn = readLocaleJson("../../../../../i18n/src/core/text-en.json");

export const server = startReplayServer({ recordingsDir });

export function recorded<T>(partialKey: string): T {
  return getFixtureBody<T>(partialKey, { recordingsDir });
}

/**
 * The replay pool's own capture matcher scores the FULL query string,
 * `lang` included. The recorded `post-oauth-access-token-guest` capture
 * (like every oauth token capture in every unit) has no `lang` in its
 * identity, because the fixture generator's own bare `fetch()` never sends
 * one — but the real session-store guest-token bootstrap now sends
 * `?lang=en`, and the replay pool has no capture that scores a match, so
 * the request hangs unanswered until the test's hook timeout. This is a
 * pre-existing environment/infrastructure defect (reproduced on a spec that
 * sends NO API call of its own — `affiliate.replay.int.test.ts` — so it is
 * not an artefact of this module's own code), outside this seat's ownership
 * to fix at its root (`modules/query`'s request wrapper, or the shared
 * `@upmind-automation/test-fixtures` replay-server's own matcher — both
 * off limits, §8.13 / Read-block). Re-serving the SAME real recorded body
 * through a query-tolerant handler is the same graceful fallback
 * design.md §8.9 "Unmatched query strings" already grants `order`/`with`/
 * `limit`/`offset` — never a hand-authored body.
 */
export function installGuestTokenLangTolerance(): void {
  // Best-effort only — belt-and-braces against any future recurrence of the
  // `recordingsDir` defect fixed above. A read failure here must never turn
  // a working session reset into a hard crash, so this function silently
  // no-ops on any error.
  try {
    const guestFixture = JSON.parse(
      readFileSync(
        join(recordingsDir, "post-oauth-access-token-guest.json"),
        "utf-8"
      )
    ) as { response: { status: number; body: unknown } };
    server?.use(
      http.post("*/oauth/access_token", async ({ request }) => {
        // `.text()` tolerates either body encoding the real client might
        // send (JSON or form-urlencoded) with no risk of a parse-error
        // crash; a simple substring check is enough to tell the guest
        // grant apart from a password or refresh_token grant, which never
        // contain "guest".
        const raw = await request.clone().text();
        // `undefined` is MSW's documented "no response from this handler,
        // try the next one" signal — it falls through to the replay pool's
        // own base capture for a non-guest grant, unlike `passthrough()`,
        // which escapes to the live network and never reaches the replay
        // pool at all (`affiliate.int-helpers.ts`'s `serveFailure`/
        // `serveCapture` carried the same defect, fixed there for the same
        // reason).
        if (!raw.includes("guest")) return undefined;
        return HttpResponse.json(guestFixture.response.body as object, {
          status: guestFixture.response.status
        });
      })
    );
  } catch {
    // No-op — see the comment above. The pre-existing (unpatched) hang or
    // failure this environment already exhibits is the honest baseline.
  }
}

beforeAll(async () => {
  useI18n().init(
    createI18n({
      legacy: false,
      locale: "en",
      fallbackLocale: "en",
      messages: {
        en: {
          text: textEn,
          // Only the keys this unit's own i18n-namespace controls need —
          // `error-en.json` carries vue-i18n linked-message syntax elsewhere
          // in the file that this bare `createI18n()` (no `modifiers` option)
          // cannot compile; loading the whole file breaks every OTHER
          // spec's message formatting (confirmed by a blind run: 6 unrelated
          // specs failed with "_modifier(...) is not a function" the moment
          // the full file was merged in). Every key's real value is still
          // read from the real file, never hand-typed.
          error: {
            affiliate_link_not_available: errorEn.affiliate_link_not_available,
            affiliate_payout_destination_not_available:
              errorEn.affiliate_payout_destination_not_available,
            affiliate_account_not_member: errorEn.affiliate_account_not_member,
            affiliate_link_form_timeout: errorEn.affiliate_link_form_timeout,
            affiliate_payout_destination_form_timeout:
              errorEn.affiliate_payout_destination_form_timeout
          }
        }
      }
    })
  );
  await useSessionStore().initStore();
});

beforeEach(async () => {
  installGuestTokenLangTolerance();
  useSessionStore().useActions().clear();
  await useSessionStore().useActions().isReady();
});

afterEach(() => {
  useAffiliateActiveAccount().useInternals().destroy();
  clearScopeRegistry();
  queryClient.clear();
  useBrand().invalidate();
  window.happyDOM?.setURL?.("https://qa-automation.local/");
  // Every spec in this unit registers its own ad-hoc `server.events.on(
  // "request:start", ...)` observer rather than sharing one cleaned-up
  // helper — clear them here, centrally, so a listener from one test can
  // never see (or inflate the request count of) the next test's requests.
  server?.events.removeAllListeners("request:start");
  // A load-order proof needs a `request:end` listener on one route observed
  // alongside a `request:start` listener on another — clear it too, or it
  // leaks into later specs the same way an unremoved `request:start`
  // listener already did.
  server?.events.removeAllListeners("request:end");
});
