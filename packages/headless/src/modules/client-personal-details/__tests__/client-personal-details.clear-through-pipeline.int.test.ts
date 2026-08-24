// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details editor — clearing a value through
 * the REAL pipeline (AC-46, AC-47)
 *
 * ## Job To Be Done
 * `client-personal-details.mappers.test.ts`'s AC-46/AC-47 tests call
 * `mapIProfileFields` DIRECTLY with a hand-built `{customFields:{age:null}}`
 * / `{publicName:""}` model — a shape the real pipeline cannot produce
 * (`useValidation.ts`'s `compactDeep`/`isDeepEmpty` treats an empty native
 * value as non-meaningful and OMITS the key before the mapper ever sees it,
 * and `age` — the only real custom field this brand exposes — is REQUIRED
 * in the two mapper-mutant tests specifically, which makes `update()` reject
 * before any request either way, masking the wire body entirely). Both
 * halves are therefore proven here through the REAL pipeline instead:
 * `input()` → `update()` → the OUTBOUND wire body, against an OPTIONAL
 * field in each case (`public_name`, native; the real, non-required `age`,
 * custom) so nothing short-circuits before the request leaves.
 *
 * The two clears fail differently under the developer-authored
 * `client-personal-details.clear-through-pipeline.must-fail.patch` mutant,
 * so they carry different assertions on purpose:
 *   - AC-47 (native): the mutant still issues a PUT, but `JSON.stringify`
 *     drops the `undefined`-valued key, landing the wire body as literally
 *     `{}`. Assert the request happens AND its body is
 *     `{"public_name":""}` — natives clear as the blanked form value itself
 *     (legacy sends it straight through, `clientProfileBasicConfigurationForm.vue:260-269`;
 *     `""->null` is a CUSTOM-field-only rule, `clientCustomFieldsForm.vue:78-80`),
 *     matching `fixtures/put-clients-id-case-native-falsy.json`'s own
 *     recorded request body VERBATIM — not just its response.
 *   - AC-46 (custom): the mutant's failure mode is a REQUEST THAT NEVER
 *     LEAVES — `mapCustomFieldValuesToRequest` iterates the (now-empty)
 *     `customFields` keys and emits nothing. A body-only assertion would
 *     pass vacuously against zero requests, so this test asserts the
 *     request COUNT and the body separately. The expected body,
 *     `{"custom_fields":{"age":null}}`, matches
 *     `fixtures/put-clients-id-case-clear-custom-field.json`'s own recorded
 *     request body verbatim too.
 *
 * ## What Breaks If These Fail
 * The JTBD's "manage" verb's own clear path (G-4/G-5) ships broken while
 * every existing control stays green — exactly the class the mapper-only
 * mutants (`clear-custom-field`, `falsy-native`) cannot see, because they
 * mutate only the unit the real pipeline never reaches with this model
 * shape.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
// Primed by import order (not mocked): see client-personal-details.read.int.test.ts's
// top-of-file note — the real session-store must resolve before this
// module's own barrel, or the transitive `../scope` walk re-enters itself
// mid-evaluation at `client-email/useClientEmails.ts:80`. Sorting this
// block alphabetically regresses the whole suite (module A's prover lost a
// cycle to exactly this).
import { usePersonalDetailsManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installProfileGetHandler,
  recorded,
  seedClientSession
} from "./client-personal-details.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

type CapturedPut = { body?: unknown };

function capturePutBody(
  clientId: string,
  responseBody: unknown
): { captured: CapturedPut; count: () => number } {
  const captured: CapturedPut = {};
  let count = 0;
  server?.use(
    http.put(`*/clients/${clientId}`, async ({ request }) => {
      count += 1;
      captured.body = await request.json();
      return HttpResponse.json(responseBody, { status: 200 });
    })
  );
  return { captured, count: () => count };
}

// -----------------------------------------------------------------------------

describe("usePersonalDetailsManager — clearing an optional NATIVE field through the real pipeline (AC-47)", () => {
  it('input()s public_name to empty, update()s, and the outbound PUT body is exactly {public_name: ""}', async () => {
    const { clientId } = await seedClientSession();
    installProfileGetHandler(server, clientId, recorded.profile());
    const { captured, count } = capturePutBody(
      clientId,
      recorded.nativeFalsy().response.body
    );

    const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
    await manager.useActions().isReady();

    await manager.useActions().input({ publicName: "" });
    await manager.useActions().update();

    expect(count()).toBe(1);
    // Matches fixtures/put-clients-id-case-native-falsy.json's own recorded
    // REQUEST body verbatim — natives clear as the blanked value itself,
    // never coerced to null (that coercion is a custom-field-only rule).
    expect(captured.body).toEqual({ public_name: "" });

    manager.useActions().destroy();
  });
});

describe("usePersonalDetailsManager — clearing an optional CUSTOM field through the real pipeline (AC-46)", () => {
  it("input()s the real, non-required 'age' field to null, update()s, and a request is issued carrying the cleared code", async () => {
    const { clientId } = await seedClientSession();
    const profile = recorded.profile();
    const ageField = profile.data.custom_fields?.find(
      row => (row.field as { code?: string } | undefined)?.code === "age"
    )?.field as { required?: boolean } | undefined;
    if (ageField?.required) {
      throw new Error(
        "Fixture regression: this spec needs the real 'age' field to be " +
          "NOT required, so update() cannot short-circuit before the " +
          "request leaves — check the recorded capture."
      );
    }
    installProfileGetHandler(server, clientId, profile);
    const { captured, count } = capturePutBody(
      clientId,
      recorded.clearedCustomField().response.body
    );

    const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
    await manager.useActions().isReady();

    await manager.useActions().input({ customFields: { age: null } });
    await manager.useActions().update();

    // The trap this AC's own mutant sets: absence of a request and absence
    // of a key look identical to a body-only assertion — so the request
    // count is asserted SEPARATELY from the body shape, never folded into
    // one `toEqual`.
    expect(count()).toBe(1);
    // Matches fixtures/put-clients-id-case-clear-custom-field.json's own
    // recorded REQUEST body verbatim.
    expect(captured.body).toEqual({ custom_fields: { age: null } });

    manager.useActions().destroy();
  });
});
