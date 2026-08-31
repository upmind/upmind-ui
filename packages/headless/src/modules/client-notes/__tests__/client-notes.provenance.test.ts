// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notes fixture provenance — AC-28 / parity.yaml row X1
 *
 * ## Job To Be Done
 * Every fixture under `__tests__/fixtures/` must be a RECORDED capture — a
 * non-empty `request.path`, a real `response.status`, and a `.../vault` path
 * that matches the URL shape the module builds. This is the guard against the
 * 2026-08-05 receipt (a prover hand-authored fixtures and presented them as
 * recorded) — `verify-cosplay.companion.md`.
 *
 * Unit-layer: reads the fixture files directly, no HTTP, no composable boot.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

type StoredFixture = {
  request?: { path?: string; method?: string };
  response?: { status?: number };
  provenance?: unknown;
  captured_at?: string;
};

function loadFixtures(): Array<{ file: string; fixture: StoredFixture }> {
  return readdirSync(FIXTURES_DIR)
    .filter(file => file.endsWith(".json"))
    .map(file => ({
      file,
      fixture: JSON.parse(
        readFileSync(join(FIXTURES_DIR, file), "utf-8")
      ) as StoredFixture
    }));
}

// -----------------------------------------------------------------------------

describe("client-notes fixture provenance (AC-28)", () => {
  it("every fixture carries a non-empty recorded request.path and a response.status", () => {
    const fixtures = loadFixtures();
    expect(fixtures.length).toBeGreaterThan(0);

    for (const { file, fixture } of fixtures) {
      expect(fixture.request?.path, `${file} has no request.path`).toBeTruthy();
      expect(
        typeof fixture.response?.status,
        `${file} has no response.status`
      ).toBe("number");
    }
  });

  it("every captured request path targets this module's own /vault resource", () => {
    const fixtures = loadFixtures();
    const relevant = fixtures.filter(
      ({ fixture }) =>
        fixture.request?.path?.includes("/vault") ||
        fixture.request?.path?.includes("/config/brand/values") ||
        fixture.request?.path?.includes("/org/modules") ||
        fixture.request?.path?.includes("/brand/settings")
    );

    expect(relevant.length).toBe(fixtures.length);
    const vaultFixtures = fixtures.filter(({ fixture }) =>
      fixture.request?.path?.includes("/vault")
    );
    for (const { file, fixture } of vaultFixtures) {
      expect(
        fixture.request?.path,
        `${file} does not address /api/clients/{id}/vault`
      ).toMatch(/\/api\/clients\/[^/]+\/vault/);
    }
  });

  it("the capture corpus covers the module's full endpoint surface — no capability proven by an uncaptured wire shape", () => {
    const fixtures = loadFixtures();
    const paths = fixtures.map(({ fixture }) => fixture.request?.path ?? "");

    expect(
      paths.some(path => /\/vault\?filter\[encrypted\|eq\]=0/.test(path))
    ).toBe(true);
    expect(
      paths.some(path => /\/vault\?filter\[encrypted\|eq\]=1/.test(path))
    ).toBe(true);
    expect(paths.some(path => /\/vault\/[^/]+\/decrypt/.test(path))).toBe(true);
    for (const field of ["label", "pinned", "created_at"]) {
      expect(
        paths.some(path => path.includes(`order=${field}`)),
        `no captured order=${field}`
      ).toBe(true);
      expect(
        paths.some(path => path.includes(`order=-${field}`)),
        `no captured order=-${field}`
      ).toBe(true);
    }
  });
});
