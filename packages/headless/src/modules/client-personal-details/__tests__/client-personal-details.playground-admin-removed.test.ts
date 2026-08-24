// -----------------------------------------------------------------------------
/**
 * @fileoverview The admin playground surface no longer advertises an
 * unsupported cell (AC-61)
 *
 * ## Job To Be Done
 * Prove the FE-2824 shape design.md §8 rules against — a staff user landing
 * on an admin profile page that silently renders their OWN client session
 * while presenting as if it were an arbitrary client's — cannot happen,
 * because the two pages and the two routes that would mount it are GONE.
 * `requirements.md` AC-61's own read-back allows either absence or a
 * rendered not-supported notice; `design.md` §8 rules absence, so this
 * spec proves the absence half at the altitude that's actually checkable
 * from this seat without running the playground app (its own `tsconfig`
 * has no `composite`, so it cannot be type-checked or driven from here —
 * AC-60 is the sibling case routed to the Verify stage for exactly that
 * reason).
 *
 * This is a filesystem/source assertion over the PLAYGROUND app's own
 * files — outside `packages/headless` — read-only, via plain `fs`, the same
 * technique `client-email.traceability.test.ts` uses to read paths outside
 * its own module. No playground file is written here.
 *
 * ## What Breaks If These Fail
 * A staff user reaches a URL that resolves to "my own profile, presented as
 * someone else's" — the exact defect the parity table's `B-staff-onbehalf`
 * drop (D1/D2) records as already broken, not a working feature — if either
 * page or either route silently comes back.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const PLAYGROUND_ROOT = join(
  import.meta.dirname,
  "../../../../../../playgrounds/labs/src/pages/account"
);

const REMOVED_PAGES = [
  join(PLAYGROUND_ROOT, "profile/admin/Profile.vue"),
  join(PLAYGROUND_ROOT, "profile/admin/Edit.vue")
];

const ROUTES_FILE = join(PLAYGROUND_ROOT, "admin/routes.ts");

// -----------------------------------------------------------------------------

describe("admin playground surface — AC-61", () => {
  it("AC-61 no longer ships either admin profile page", () => {
    for (const page of REMOVED_PAGES) {
      expect(existsSync(page), `${page} should not exist`).toBe(false);
    }
  });

  it("AC-61 no longer routes to an admin profile page, by name or by component import", () => {
    expect(existsSync(ROUTES_FILE), `${ROUTES_FILE} should exist`).toBe(true);
    const source = readFileSync(ROUTES_FILE, "utf-8");

    expect(source).not.toMatch(/name:\s*["']admin\.account\.profile["']/);
    expect(source).not.toMatch(/name:\s*["']admin\.account\.profile\.edit["']/);
    expect(source).not.toMatch(/profile\/admin\/(Profile|Edit)\.vue/);
  });

  it("AC-61 the new Nuxt scenario introduces no staff cell", () => {
    const scenarioFile = join(
      import.meta.dirname,
      "../../../../../../playgrounds/labs-nuxt/modules/scenarios/usePersonalDetails/client-personal-details.scenario.ts"
    );
    expect(existsSync(scenarioFile), `${scenarioFile} should exist`).toBe(true);
    const scenarioSource = readFileSync(scenarioFile, "utf-8");

    expect(scenarioSource).not.toMatch(/ScopeActorTypes\.STAFF/);
    expect(scenarioSource).not.toMatch(/\/for\/client\/:id/);

    const typesFile = join(
      import.meta.dirname,
      "../client-personal-details.types.ts"
    );
    const typesSource = readFileSync(typesFile, "utf-8");

    expect(typesSource).toMatch(/\[ScopeActorTypes\.STAFF\]:\s*null as never/);
  });
});
