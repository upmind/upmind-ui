// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.i18n-keys.int
 * @description Every i18n key the module actually emits at runtime resolves
 * in the EN catalogue (`playgrounds/labs/src/assets/locales/en/*.json`) —
 * derived from the module's own public surface rather than a hardcoded list
 * of eleven (repair item 5).
 *
 * ## Job To Be Done
 * Before the fix, all eleven keys this module emits were absent from the
 * catalogue, so every one rendered as a raw key on the page —
 * `form.vault_asset_type` most visibly, since it labels the `encrypted`
 * button-group that makes the JTBD sentence ("notes and secrets are ONE
 * entity; a flag decides which") operable on screen. A hardcoded list of
 * eleven keys would pass today and silently stop discriminating the day a
 * twelfth key is added, so the first two specs below DERIVE their
 * expectations from what the module actually emits: every `i18n:` scope
 * cited by the collection's query uischema (all five `form.*` keys land
 * there — `vault_asset_type`, `vault_asset_search`, `pinned_filter`,
 * `contract_product_filter`, `vault_asset_sort`), plus every feedback/error
 * key genuinely raised by exercising the real delete-success, delete-failure
 * and label-required-refusal paths (mirroring the `../../feedback` spy
 * pattern `client-phone.mutations.int.test.ts` /
 * `client-address.feedback.int.test.ts` use).
 *
 * Two keys — `error.client_notes_not_available` and
 * `error.client_notes_validation_failed` — could not be reached through a
 * black-box integration trigger within this run (every unavailable-scope
 * attempt this run tried surfaced the shared auth guard's own
 * `auth.login_to_continue` first, and every malformed-model attempt tried
 * surfaced `client_notes_update_failed`); the third spec checks those two
 * directly against the catalogue rather than silently dropping them, and
 * says so rather than presenting a partial derivation as a full one.
 *
 * ## What Breaks If This Fails
 * A rendered vault page shows a raw i18n key instead of copy.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNotes } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  recorded,
  seedClientSession,
  waitForAvailable
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const feedback = vi.hoisted(() => ({
  calls: [] as Array<{ method: string; arg: unknown }>
}));

vi.mock("../../feedback", async importOriginal => {
  const actual = await importOriginal<typeof import("../../feedback")>();
  const watched = new Set(["addSuccess", "addError"]);
  return {
    ...actual,
    useFeedback: (...args: unknown[]) => {
      const api = (
        actual.useFeedback as unknown as (
          ...a: unknown[]
        ) => Record<string, unknown>
      )(...args);
      return new Proxy(api, {
        get(target, property) {
          const value = Reflect.get(target, property);
          if (typeof value === "function" && watched.has(String(property))) {
            return (...callArgs: unknown[]) => {
              feedback.calls.push({
                method: String(property),
                arg: callArgs[0]
              });
              return (value as (...a: unknown[]) => unknown).apply(
                target,
                callArgs
              );
            };
          }
          return value;
        }
      });
    }
  };
});

// -----------------------------------------------------------------------------

const LOCALES_DIR = join(
  import.meta.dirname,
  "../../../../../../playgrounds/labs/src/assets/locales/en"
);

function catalogue(file: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(LOCALES_DIR, `${file}.json`), "utf-8")
  ) as Record<string, unknown>;
}

/** Every string value under an `i18n` property anywhere in a schema/uischema tree. */
function collectI18nRefs(node: unknown, into: Set<string>): void {
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === "i18n" && typeof value === "string") into.add(value);
    else collectI18nRefs(value, into);
  }
}

/** Resolve one dotted "file.key" i18n reference against the real catalogue. */
function formRefResolves(dottedKey: string): boolean {
  const [file, ...rest] = dottedKey.split(".");
  const key = rest.join(".");
  try {
    return Object.prototype.hasOwnProperty.call(catalogue(file), key);
  } catch {
    return false;
  }
}

/** Every raw key fragment this module could plausibly raise, inside one raised feedback call or thrown message. */
function extractRawKeys(arg: unknown): string[] {
  const text = typeof arg === "string" ? arg : JSON.stringify(arg ?? "");
  return text.match(/\b(?:vault_asset|client_notes)_[a-z_]+\b/g) ?? [];
}

/** A bare key resolves if EITHER of the module's two flat namespaces declares it. */
function bareKeyResolves(key: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(catalogue("confirm"), key) ||
    Object.prototype.hasOwnProperty.call(catalogue("error"), key)
  );
}

// -----------------------------------------------------------------------------

describe("client-notes i18n — every key the module actually emits resolves in the EN catalogue", () => {
  let clientId: string;

  beforeEach(async () => {
    feedback.calls.length = 0;
    const seeded = await seedClientSession();
    clientId = seeded.clientId;
  });

  it("every `i18n:` reference cited by the collection's query uischema resolves — the five form.* keys, derived", async () => {
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );
    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);

    const found = new Set<string>();
    const family = (
      notes.useContext() as unknown as { schemas?: { query?: unknown } }
    ).schemas?.query;
    collectI18nRefs(family, found);

    expect(found.size).toBeGreaterThan(0);
    for (const ref of found) {
      expect(formRefResolves(ref), `${ref} has no catalogue entry`).toBe(true);
    }
    notes.useActions().destroy();
  });

  it("the delete success/failure and label-required refusal each raise a key that resolves — derived from the real thrown/raised value, not a hardcoded string", async () => {
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );
    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);

    const noteId = recorded.list().data[0].id;
    server?.use(
      http.delete(`*/clients/${clientId}/vault/${noteId}`, () =>
        HttpResponse.json(recorded.removed(), { status: 200 })
      )
    );
    await notes.useActions().remove(noteId);

    const missingId = "00000000-0000-0000-0000-000000000000";
    const rejected = recorded.removeRejected();
    server?.use(
      http.delete(`*/clients/${clientId}/vault/${missingId}`, () =>
        HttpResponse.json(rejected.response.body as object, {
          status: rejected.response.status
        })
      )
    );
    await notes
      .useActions()
      .remove(missingId)
      .catch(() => undefined);

    const labelLessRow = notes
      .useContext()
      .data.value?.find(row => !row.label && !row.encrypted);
    let labelRequiredMessage = "";
    if (labelLessRow) {
      await notes
        .useActions()
        .convert(labelLessRow as never)
        .catch(error => {
          labelRequiredMessage = (error as Error)?.message ?? "";
        });
    }

    const raisedKeys = feedback.calls.flatMap(call => extractRawKeys(call.arg));
    const inlineKeys = extractRawKeys(labelRequiredMessage);
    const allKeys = [...raisedKeys, ...inlineKeys];

    expect(raisedKeys.length).toBeGreaterThan(0);
    expect(inlineKeys.length).toBeGreaterThan(0);
    for (const key of allKeys) {
      expect(bareKeyResolves(key), `${key} has no catalogue entry`).toBe(true);
    }
    notes.useActions().destroy();
  });

  it("the two keys no black-box trigger in this run could reach — client_notes_not_available and client_notes_validation_failed — still resolve", () => {
    expect(catalogue("error").client_notes_not_available).toBeTruthy();
    expect(catalogue("error").client_notes_validation_failed).toBeTruthy();
  });
});
