// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details editor — opening it seeds the real
 * values (AC-30's read verb landing on the editor, and AC-50's revert
 * baseline — model seeding itself composes A's own model-seeding seam,
 * `useCustomFieldsModel`, a MODULE A contract item outside this module's
 * own AC range and not named by tag here for that reason)
 *
 * ## Job To Be Done
 * The spec that should have existed before `client-personal-details.language.int.test.ts`
 * ever asserted anything about an empty model — see that file's retraction
 * note. Opening the editor against a profile carrying REAL native values
 * AND a REAL non-null custom-field value must seed `baseModel` (the
 * load-derived source of truth) and `model` (the draft a consumer renders)
 * with those exact values, and `meta.isDirty` must be `false` before any
 * edit — the JTBD's read verb reaching the EDITOR, not only the read-half
 * composable (`requirements.md` §7.1: "the editor's `baseModel.customFields`
 * is always empty and no existing value is ever shown" is the second named
 * consequence of the absent read verb this pair exists to fix).
 *
 * The recorded `get-clients-id` capture's `age` custom field is a REAL
 * non-null value (`44`) as of this run — the staging client's own current
 * state, not constructed. Native fields (`firstname`/`lastname`/
 * `public_name`/`interface_language_id`) are the same recorded row.
 *
 * A developer is fixing the seeding source in parallel; this file's
 * assertions come from the AC, not from a prior run, so it is expected to
 * be RED until that lands and is not weakened to pass in the meantime.
 *
 * ## What Breaks If These Fail
 * A client opens their profile editor and sees a blank form despite having
 * real values on file — the exact defect `requirements.md` §7.1 names, now
 * at the editor rather than only the read composable.
 */

import { describe, expect, it } from "vitest";
// Primed by import order (not mocked): see client-personal-details.read.int.test.ts's
// top-of-file note — the real session-store must resolve before this
// module's own barrel, or the transitive `../scope` walk re-enters itself
// mid-evaluation at `client-email/useClientEmails.ts:80`. Sorting this
// block alphabetically regresses the whole suite (module A's prover lost a
// cycle to exactly this).
// eslint-disable-next-line import/order
import {
  installProfileGetHandler,
  recorded,
  seedClientSession
} from "./client-personal-details.int-helpers";
import { usePersonalDetailsManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("usePersonalDetailsManager — opening the editor seeds the real profile (AC-30/AC-50)", () => {
  it("seeds baseModel AND model from the loaded profile's real native fields and non-null custom field value, with isDirty false", async () => {
    const { clientId } = await seedClientSession();
    const profile = recorded.profile();
    installProfileGetHandler(server, clientId, profile);

    const ageValue = profile.data.custom_fields?.find(
      row => (row.field as { code?: string } | undefined)?.code === "age"
    )?.value;
    if (ageValue == null) {
      throw new Error(
        "Fixture regression: this spec needs the recorded 'age' custom " +
          "field to hold a REAL non-null value — re-capture with " +
          "`pnpm fixtures:generate client-personal-details` rather than " +
          "constructing one."
      );
    }

    const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
    await manager.useActions().isReady();

    const baseModel = manager.useContext().baseModel.value;
    const model = manager.useContext().model.value;

    expect(baseModel.firstName).toBe(profile.data.firstname);
    expect(baseModel.lastName).toBe(profile.data.lastname);
    expect(baseModel.publicName).toBe(profile.data.public_name);
    expect(baseModel.language).toBe(profile.data.interface_language_id);
    expect(baseModel.customFields?.age).toBe(ageValue);

    expect(model.firstName).toBe(profile.data.firstname);
    expect(model.lastName).toBe(profile.data.lastname);
    expect(model.publicName).toBe(profile.data.public_name);
    expect(model.language).toBe(profile.data.interface_language_id);
    expect(model.customFields?.age).toBe(ageValue);

    expect(manager.useMeta().isDirty.value).toBe(false);

    manager.useActions().destroy();
  });
});
