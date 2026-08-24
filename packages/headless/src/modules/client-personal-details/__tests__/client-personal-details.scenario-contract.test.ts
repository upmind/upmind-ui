// -----------------------------------------------------------------------------
/**
 * @fileoverview AC-60 — the Nuxt scenario declaration is the pages' real
 * proof, reachable without booting the playground
 *
 * ## Job To Be Done
 * `client-personal-details.feature:214`'s `@todo` said AC-60's proof lives at
 * a different altitude — a run-the-app read-back — because the playground's
 * own `tsconfig` has no `composite`. That altitude is now reachable: D3 (see
 * `design.md` §3) creates the Nuxt scenario declaration this spec reads as a
 * filesystem/source assertion, the same technique
 * `client-personal-details.playground-admin-removed.test.ts` already uses to
 * read outside this package. No playground boot, no `composite` tsconfig
 * needed.
 *
 * ## What Breaks If This Fails
 * The declaration stops binding both halves, drops `tracks`, or the step
 * catalog the tracks channel needs goes missing — any of which would make the
 * feature un-driveable from the playground page, silently.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const SCENARIO_DIR = join(
  import.meta.dirname,
  "../../../../../../playgrounds/labs-nuxt/modules/scenarios/usePersonalDetails"
);

const SCENARIO_FILE = join(SCENARIO_DIR, "client-personal-details.scenario.ts");

const STEPS_FILE = join(
  import.meta.dirname,
  "client-personal-details.steps.ts"
);

// -----------------------------------------------------------------------------

describe("client-personal-details Nuxt scenario declaration — AC-60", () => {
  it("AC-60 the scenario file exists at the expected path", () => {
    expect(existsSync(SCENARIO_FILE), `${SCENARIO_FILE} should exist`).toBe(
      true
    );
  });

  it("AC-60 the scenario binds both usePersonalDetails and usePersonalDetailsManager", () => {
    const source = readFileSync(SCENARIO_FILE, "utf-8");

    expect(source).toMatch(/useList:\s*usePersonalDetails\b/);
    expect(source).toMatch(/useMutate:\s*usePersonalDetailsManager\b/);
  });

  it('AC-60 the scenario declares tracks: "client-personal-details"', () => {
    const source = readFileSync(SCENARIO_FILE, "utf-8");

    expect(source).toMatch(/tracks:\s*["']client-personal-details["']/);
  });

  it("AC-60 the step catalog exists beside the feature, so the tracks channel resolves", () => {
    expect(existsSync(STEPS_FILE), `${STEPS_FILE} should exist`).toBe(true);
  });

  it("AC-60 the scenario names no staff actor and no /for/client/:id context", () => {
    const source = readFileSync(SCENARIO_FILE, "utf-8");

    expect(source).not.toMatch(/ScopeActorTypes\.STAFF/);
    expect(source).not.toMatch(/\/for\/client\/:id/);
    expect(source).not.toMatch(/context:\s*\{\s*type:\s*["']client["']/);
  });
});
