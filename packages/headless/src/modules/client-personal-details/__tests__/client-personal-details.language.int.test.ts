// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details editor — the language choice list
 * (AC-34, AC-35)
 *
 * ## Job To Be Done
 * Prove the language enum the manager's schema offers comes from the
 * TARGET CLIENT's own brand, not a hardcoded or session-generic list
 * (AC-34), and that a client whose CURRENT language has fallen out of the
 * brand's offered set still renders it — visible, never silently blanked
 * (AC-35). At `client x self` (this module's one resolving cell) the
 * session brand IS the client's own brand — R1/T1 — so AC-34's own
 * cross-brand scenario belongs to the dropped staff row (`parity.yaml`
 * B-staff-onbehalf); what this module owns is that the list is REAL brand
 * data reaching the schema at all, not a stale session-generic default.
 *
 * `get-brand-settings` is a REAL recorded capture — 28 real languages, the
 * brand's actual `language_id`. AC-35's precondition (a client whose current
 * language the brand no longer offers) does not exist in staging as a
 * recordable state — the account's own `interface_language_id` IS one of
 * the 28 — so `LANGUAGE_ID_ABSENT_FROM_BRAND` is a labelled CONSTRUCTED
 * literal, standing in for the client's own `interface_language_id` on a
 * cloned profile envelope, never presented as recorded.
 *
 * ## Retraction (2026-08-11)
 * An earlier version of this file asserted, from an in-session observation,
 * that `baseModel`/`model` start `{customFields:{}}` on load and drove
 * AC-35's value through a manual `input()` call rather than the load itself
 * — annotated "confirmed empirically". That observation was made against a
 * staging client whose ONLY custom-field value was `null`, which makes an
 * UNSEEDED model and a correctly-seeded-but-empty one byte-identical; the
 * distinction was never observable from that state, so it was never the
 * prover's call to make from it. It also generalised to a claim ("loadLookups
 * seeds ONLY customFields") that turned out wrong on both halves once
 * checked against a real non-null value — see
 * `client-personal-details.editor-seeding.int.test.ts`, which that
 * generalisation should have been. **This file no longer derives its
 * assertions from what a run showed — only from the AC.** AC-35's own
 * read-back is "still renders" (the LOADED value survives), not "input()
 * accepts a manually re-supplied value", so the test below now opens the
 * editor and checks what settled on load, before calling anything.
 *
 * ## What Breaks If These Fail
 * A stale session-brand language list (G-11) offered instead of the target
 * client's own, or a client's current language silently disappearing from
 * the form the moment the brand stops offering it.
 */

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
  installBrandSettingsHandler,
  installProfileGetHandler,
  recorded,
  seedClientSession
} from "./client-personal-details.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Not one of the 28 real recorded brand language ids — labelled constructed. */
const LANGUAGE_ID_ABSENT_FROM_BRAND = "constructed-absent-language-id";

function languageEnum(schema: unknown): unknown[] {
  const properties = (
    schema as { properties?: Record<string, { enum?: unknown[] }> }
  )?.properties;
  return properties?.language?.enum ?? [];
}

/** The rendered option descriptor for one language id (AC-35's `disabled` flag lives here, not on `.enum`). */
function languageOption(
  schema: unknown,
  value: string
): { label?: unknown; value?: unknown; disabled?: boolean } | undefined {
  const properties = (
    schema as {
      properties?: Record<
        string,
        { options?: { label?: unknown; value?: unknown; disabled?: boolean }[] }
      >;
    }
  )?.properties;
  return properties?.language?.options?.find(option => option.value === value);
}

// -----------------------------------------------------------------------------

describe("usePersonalDetailsManager — the language choice list is my own brand's (AC-34)", () => {
  it("AC-34 offers exactly the REAL recorded brand's language ids, not a hardcoded or stale list", async () => {
    await seedClientSession();
    installBrandSettingsHandler(server); // real recorded fixture, explicit for clarity

    const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
    await manager.useActions().isReady();

    const realLanguageIds = recorded
      .brandSettings()
      .data.languages.map(language => language.id);
    const enumIds = languageEnum(manager.useContext().schema.value);

    expect(realLanguageIds.length).toBeGreaterThan(1);
    for (const id of realLanguageIds) {
      expect(enumIds).toContain(id);
    }
    manager.useActions().destroy();
  });
});

describe("usePersonalDetailsManager — a language the brand no longer offers still appears (AC-35)", () => {
  it("AC-35 renders my current language on load, even though it is absent from the brand's list, and does not blank it", async () => {
    const { clientId } = await seedClientSession();
    // Labelled CONSTRUCTED: the recorded envelope's own
    // `interface_language_id`, replaced with an id provably absent from the
    // real 28-language list — the staging account's real language is always
    // IN the brand's own list, so this precondition cannot be recorded.
    const recordedProfile = recorded.profile();
    const clientWithAbsentLanguage = {
      ...recordedProfile,
      data: {
        ...recordedProfile.data,
        interface_language_id: LANGUAGE_ID_ABSENT_FROM_BRAND
      }
    };
    installProfileGetHandler(server, clientId, clientWithAbsentLanguage);
    installBrandSettingsHandler(server); // real recorded language list

    const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
    await manager.useActions().isReady();

    const realLanguageIds = recorded
      .brandSettings()
      .data.languages.map(language => language.id);
    expect(realLanguageIds).not.toContain(LANGUAGE_ID_ABSENT_FROM_BRAND);

    // AC-35's read-back is "still renders" — the value the load itself
    // seeded, not one this test hands it. AC-30 (the read verb) requires the
    // loaded profile to reach baseModel; this is that requirement, not an
    // observation of what the run happened to do — it is expected to be RED
    // until the seeding fix lands, and is not weakened to pass in the
    // meantime.
    expect(manager.useContext().baseModel.value.language).toBe(
      LANGUAGE_ID_ABSENT_FROM_BRAND
    );
    expect(manager.useContext().model.value.language).toBe(
      LANGUAGE_ID_ABSENT_FROM_BRAND
    );

    // Still appears: the schema's enum carries it alongside the brand's own
    // offered set, so a consumer can render it (disabled) rather than have
    // it vanish from the choice list entirely.
    const enumIds = languageEnum(manager.useContext().schema.value);
    expect(enumIds).toContain(LANGUAGE_ID_ABSENT_FROM_BRAND);

    // Selectable-but-disabled: the option survives (asserted above) but is
    // marked non-selectable, mirroring the oracle's :disabled="true" option.
    const orphanedOption = languageOption(
      manager.useContext().schema.value,
      LANGUAGE_ID_ABSENT_FROM_BRAND
    );
    expect(orphanedOption?.disabled).toBe(true);

    manager.useActions().destroy();
  });
});
