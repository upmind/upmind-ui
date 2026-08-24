// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details definition-driven read (AC-63)
 *
 * ## Job To Be Done
 * Prove `usePersonalDetails`'s read half renders a row for EVERY one of the
 * brand's custom-field DEFINITIONS, not only the ones the client happens to
 * hold a value entry for. The prior, value-driven implementation reduced
 * over `record.customFieldValues` alone: a client with zero value entries
 * got zero custom-field rows and the module never issued a `custom_fields`
 * request at all. Legacy is definition-driven — the render loop iterates the
 * DEFINITIONS list, joining values in where present:
 *
 *   `customFields.vue:10` (vue-app SHA `ea310f5a42e32b7ae1255c223b77918ef0594286`):
 *     `v-for="(field, index) in filteredCustomFields"` — the loop is over
 *     definitions, never over the client's value entries. Two supporting
 *     facts, also verified against that SHA: the `filters` prop's default is
 *     `null` (`:183-186`), which is what makes `filteredCustomFields`'s
 *     `if (this.filters !== null)` short-circuit — so a client-area mount
 *     that passes no `filters` prop applies no `hidden`/`user_only`
 *     visibility filter, and every definition renders; and the `#noResults`
 *     slot (`clientCustomFieldsForm.vue:15-21`) is keyed to the DEFINITIONS
 *     list being empty, never to the values.
 *
 * The two-case shape this suite proves (per the AC's own read-back): with a
 * definitions fixture of N definitions and a client whose `custom_fields` is
 * `[]`, `useContext().data` has `4 + N` entries — the module's 4 native
 * fields, then the N custom-field rows in the definitions' own `order` — and
 * the `GET custom_fields` request was actually issued (the value-driven
 * implementation issued none). The WITH-VALUES case alone cannot distinguish
 * the two implementations: this brand's one real staging client holds a
 * value entry for BOTH of its real definitions, so value-driven and
 * definition-driven rendering are byte-identical against that data — which
 * is exactly why the empty-values case is the load-bearing one and the
 * with-values case is only a regression guard.
 *
 * `isReady()` now folds in A's definitions collection alongside B's own
 * profile query (confirmed empirically: `useContext().data` already carries
 * the joined shape the instant `isReady()` resolves), so every assertion
 * below reads straight off `isReady()` — no `vi.waitFor` polling past it.
 *
 * @decision the per-type empty value, from the oracle
 * what:   an unanswered field's projected value is `undefined` for EVERY
 *         type — never a type-specific placeholder.
 * why:    legacy only seeds `form.custom_fields[code]` for fields the client
 *         has already answered (`clientCustomFieldsForm.vue:78-80`); an
 *         unanswered field's `v-model` reads plain, un-seeded `undefined`.
 *         The checkbox/SELECT_RADIO case differs only through TEMPLATE
 *         truthiness (an unchecked box), never a different underlying value.
 * rejected: a type-specific empty default (e.g. `0` for NUMBER, `""` for
 *         TEXT) — rejected: the oracle seeds nothing, so inventing a default
 *         would be a mapper behaviour with no legacy behaviour behind it.
 *
 * ## What Breaks If These Fail
 * `/account/profile` renders nothing for a client who has never answered a
 * custom field, and silently drops the JTBD's "read my custom field values"
 * verb for exactly the clients who most need to see the field so they CAN
 * answer it.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
// See client-personal-details.read.int.test.ts's own note: the real
// session-store must resolve before this module's barrel is imported, or the
// transitive walk through ../scope crashes createScopedComposable mid-eval.
import { usePersonalDetails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCustomFieldDefinitionsHandler,
  recorded,
  seedClientSession,
  type Envelope
} from "./client-personal-details.int-helpers";
import { server } from "./setup.integration";
import type { IClient } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

type ProjectedField = {
  code: string;
  value: unknown;
  meta: { isCustomField: boolean };
};

/**
 * DERIVED from the recorded `get-clients-id` capture — NOT a second
 * recording. Spreads the real envelope and overrides only `data.custom_fields`
 * to `[]`: a client who has never answered either of this brand's two real
 * definitions. Every other field (id, native values, language) is the
 * recorded value, unchanged. This staging brand has exactly one real client,
 * so a second real "never answered" account to record this fixture against
 * does not exist — the empty array is the only constructed part.
 */
function emptyValuesProfileEnvelope(): Envelope<IClient> {
  const base = recorded.profile();
  return {
    ...base,
    data: { ...base.data, custom_fields: [] }
  };
}

/** The raw embedded field definitions this module's own `get-clients-id` capture carries. */
function recordedFieldDefinitions(): unknown[] {
  return (recorded.profile().data.custom_fields ?? []).map(row => row.field);
}

function findRecordedFieldByCode(code: string): unknown {
  const field = recordedFieldDefinitions().find(
    entry => (entry as { code?: string }).code === code
  );
  if (!field) {
    throw new Error(
      `Fixture regression: no recorded field definition for code '${code}' ` +
        "— re-capture rather than construct one."
    );
  }
  return field;
}

function recordedValueRowByCode(
  code: string
): { value: unknown; field_id: string } | undefined {
  return recorded
    .profile()
    .data.custom_fields?.find(
      row => (row.field as { code?: string } | undefined)?.code === code
    ) as { value: unknown; field_id: string } | undefined;
}

/** Observes every outbound request to A's definitions endpoint. */
function observeDefinitionsRequests(): {
  all: () => Array<{ method: string; url: string }>;
  stop: () => void;
} {
  const seen: Array<{ method: string; url: string }> = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/custom_fields")) return;
    seen.push({ method: request.method, url: request.url });
  };
  server?.events.on("request:start", listener);
  return {
    all: () => seen,
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

function installProfile(clientId: string, body: Envelope<IClient>): void {
  server?.use(
    http.get(`*/clients/${clientId}`, () =>
      HttpResponse.json(body, { status: 200 })
    )
  );
}

// -----------------------------------------------------------------------------

describe("usePersonalDetails — definition-driven read renders every brand definition (AC-63)", () => {
  it("AC-63 renders a row for every definition, even when I've never answered any of them — natives (4) then N custom rows in definition order, each with its type's oracle empty value, and a custom_fields request with no sort param is actually issued", async () => {
    const { clientId } = await seedClientSession();
    installProfile(clientId, emptyValuesProfileEnvelope());
    installCustomFieldDefinitionsHandler(server);
    const definitionsObserved = observeDefinitionsRequests();

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    await details.useActions().isReady();
    definitionsObserved.stop();

    const fields = details.useContext().data.value as ProjectedField[];
    expect(fields).toHaveLength(4 + 2);

    const natives = fields.slice(0, 4);
    const customRows = fields.slice(4);
    expect(natives.every(field => field.meta.isCustomField === false)).toBe(
      true
    );
    expect(customRows.every(field => field.meta.isCustomField === true)).toBe(
      true
    );
    expect(customRows.map(field => field.code)).toEqual([
      "age",
      "profile_picture"
    ]);
    // Per the oracle @decision above: an unanswered field's value is
    // `undefined` for every type — the row's PRESENCE is what AC-63 proves;
    // this pins the empty value itself rather than leaving it unstated.
    for (const row of customRows) {
      expect(row.value).toBeUndefined();
    }

    const definitionsRequests = definitionsObserved.all();
    expect(definitionsRequests.length).toBeGreaterThan(0);
    const params = new URL(definitionsRequests[0]!.url).searchParams;
    expect(params.get("filter[object_type]")).toBe("client");
    expect(params.get("brand_id")).toBeTruthy();
    expect(params.get("limit")).toBe("0");
    expect(params.get("order")).toBe("order");
    expect(params.has("sort")).toBe(false);
  });

  it("AC-63 (regression guard) renders the SAME 4+N shape for a client who HAS value entries, with values correctly joined — this case alone cannot distinguish value-driven from definition-driven rendering, which is the whole point of the empty-values case above", async () => {
    const { clientId } = await seedClientSession();
    installProfile(clientId, recorded.profile());
    installCustomFieldDefinitionsHandler(server);

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    await details.useActions().isReady();

    const fields = details.useContext().data.value as ProjectedField[];
    expect(fields).toHaveLength(4 + 2);

    const ageRow = recordedValueRowByCode("age");
    const pictureRow = recordedValueRowByCode("profile_picture");
    if (!ageRow || !pictureRow) {
      throw new Error(
        "Fixture regression: the recorded client no longer carries value " +
          "entries for both real definitions."
      );
    }

    const projectedAge = fields.find(field => field.code === "age");
    const projectedPicture = fields.find(
      field => field.code === "profile_picture"
    );
    expect(projectedAge).toBeDefined();
    expect(projectedAge!.value).toBe(ageRow.value);
    expect(projectedPicture).toBeDefined();
  });

  it("AC-63 renders in the definitions' own order — 'age' (order 1) before 'profile_picture' (order 2)", async () => {
    const { clientId } = await seedClientSession();
    installProfile(clientId, emptyValuesProfileEnvelope());
    installCustomFieldDefinitionsHandler(server);

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    await details.useActions().isReady();

    const fields = details.useContext().data.value as ProjectedField[];
    const ageIndex = fields.findIndex(field => field.code === "age");
    const pictureIndex = fields.findIndex(
      field => field.code === "profile_picture"
    );

    expect(ageIndex).toBeGreaterThanOrEqual(0);
    expect(pictureIndex).toBeGreaterThanOrEqual(0);
    expect(ageIndex).toBeLessThan(pictureIndex);
  });

  it("AC-63 renders natives only when the brand has zero definitions and the client has zero values", async () => {
    const { clientId } = await seedClientSession();
    installProfile(clientId, emptyValuesProfileEnvelope());
    installCustomFieldDefinitionsHandler(server, []);

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    await details.useActions().isReady();

    const fields = details.useContext().data.value as ProjectedField[];
    expect(fields).toHaveLength(4);
    expect(fields.every(field => field.meta.isCustomField === false)).toBe(
      true
    );
  });

  it("AC-63 still renders a value whose field_id is NOT among the fetched definitions, via its own embedded field (the remainder pass)", async () => {
    const { clientId } = await seedClientSession();
    installProfile(clientId, recorded.profile());
    // Only 'age' is returned as a known definition; 'profile_picture' has a
    // recorded value entry (embedding its own field) but is absent from this
    // definitions list — it must still render via the remainder pass, which
    // keeps module A's embedded-definition preference rather than replacing
    // it (that preference is proven at module A's own AC, not re-proven here).
    installCustomFieldDefinitionsHandler(server, [
      findRecordedFieldByCode("age")
    ]);

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    await details.useActions().isReady();

    const fields = details.useContext().data.value as ProjectedField[];
    expect(fields).toHaveLength(4 + 2);
    const projectedPicture = fields.find(
      field => field.code === "profile_picture"
    );
    expect(projectedPicture).toBeDefined();
    expect(projectedPicture!.meta.isCustomField).toBe(true);
  });

  it("AC-63 degrades gracefully when the definitions load fails: natives still render, and the failure is reachable through useContext().error", async () => {
    const { clientId } = await seedClientSession();
    // Empty-values, deliberately: a client WITH value entries renders custom
    // rows via the remainder pass regardless of A's failure (each value
    // embeds its own field), which would prove nothing about THIS
    // degradation path. Zero value entries removes that fallback, so
    // natives-only + a surfaced error is the only way this settles.
    installProfile(clientId, emptyValuesProfileEnvelope());
    // server.use() is LIFO — registered AFTER seedClientSession()'s own
    // default definitions-success stub, so this 500 wins.
    server?.use(
      http.get("*/custom_fields*", () =>
        HttpResponse.json({ status: "error", data: null }, { status: 500 })
      )
    );

    const details = usePersonalDetails().as(ScopeActorTypes.SELF);
    // isReady() now folds in A's readiness (definitions), so it settles
    // false through the retry/backoff on this 500 — the same generous race
    // AC-31 uses, guarding against a genuine hang without mistaking normal
    // backoff for one.
    await Promise.race([
      details.useActions().isReady(),
      new Promise(resolve => setTimeout(resolve, 20000))
    ]);

    const fields = details.useContext().data.value as
      | ProjectedField[]
      | undefined;
    expect(fields).toBeDefined();
    expect(fields).toHaveLength(4);
    expect(fields!.every(field => field.meta.isCustomField === false)).toBe(
      true
    );
    expect(details.useContext().error.value).toBeDefined();
  }, 25000);
});
