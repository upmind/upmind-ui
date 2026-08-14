// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone whole-module guarantees (AC-24, AC-30, AC-33, AC-34)
 *
 * ## Job To Be Done
 * Prove the cross-cutting guarantees that do not belong to either half alone:
 *
 * AC-24 — a settled manager save invalidates the ONE shared cache key, so a
 * collection instance open elsewhere re-fetches and reflects the save.
 *
 * AC-30 — every fixture this module's tests replay carries the real recording
 * pipeline's v3 envelope (`version`, `provenance`, `captured_at`,
 * `brand_domain`) — the structural signature only the genuine
 * `pnpm fixtures:generate` capture path produces, never a hand-typed body.
 *
 * AC-33 — the one repair this run owns: `basket-billing/unified`'s
 * `vi.mock("../../../client-phone", …)` factory is re-pointed at the surviving
 * seam (`useClientPhones().as(SELF).useActions().ensure`), not the retired
 * `useClientPhoneServices`.
 *
 * AC-34 — every negative control this story adds is present, colocated with
 * the spec it targets, per `design.md` §8.1. The RED confirmation itself is
 * the prover's blind-apply pass (recorded in the test gate), not a runtime
 * assertion here — this guards against the patches quietly disappearing.
 *
 * ## What Breaks If These Fail
 * AC-24: a save appears to succeed while every other open view of the data
 * goes stale. AC-30: a green suite that certifies a contract no real system
 * exhibits (the 2026-08-05 fixture-fabrication receipt). AC-33: a mock that
 * silently stops exercising the module it claims to stub. AC-34: a safeguard
 * this module claims to have, with nothing ever having tried to break it.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { useClientPhoneManager, useClientPhones } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { ClientPhoneContextTypes } from "../client-phone.types";
import {
  installPhonesListHandler,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const FIXTURES_DIR = join(TEST_DIR, "fixtures");
const MODULE_DIR = join(TEST_DIR, "..");
const UNIFIED_TEST_FILE = join(
  MODULE_DIR,
  "../basket-billing/unified/__tests__/unified.int.test.ts"
);

describe("client-phone — a settled save refreshes the collection (AC-24)", () => {
  it("AC-24 a manager save invalidates the shared cache key and the open collection re-fetches with the saved value", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const list = installPhonesListHandler(server, clientId, [
      primary,
      secondary
    ]);
    const updated = recorded.updated().data;

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );
    const readsBeforeSave = list.reads();

    const manager = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, secondary.id);
    await manager.useActions().isReady();

    list.setRows([
      primary,
      { ...secondary, phone: updated.phone, phone_code: updated.phone_code }
    ]);
    await manager.useActions().update({
      phone: {
        number: null,
        nationalNumber: updated.phone,
        countryCallingCode: updated.phone_code.replace("+", ""),
        country: updated.phone_country_code
      }
    });

    await vi.waitFor(() =>
      expect(list.reads()).toBeGreaterThan(readsBeforeSave)
    );
    await vi.waitFor(() => {
      expect(
        phones.useContext().data.value.find(row => row.id === secondary.id)
          ?.phone.nationalNumber
      ).toBe(updated.phone);
    });
  });
});

describe("client-phone — every fixture replays a genuinely recorded exchange (AC-30)", () => {
  it("AC-30 every captured fixture carries the real recording pipeline's v3 envelope", () => {
    const files = readdirSync(FIXTURES_DIR).filter(file =>
      file.endsWith(".json")
    );
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const fixture = JSON.parse(
        readFileSync(join(FIXTURES_DIR, file), "utf-8")
      ) as {
        version?: number;
        provenance?: { case?: string; journey?: string };
        captured_at?: string;
        brand_domain?: string;
        request?: { method?: string; path?: string };
        response?: { status?: number };
      };

      expect(fixture.version, `${file}: version`).toBe(3);
      expect(fixture.provenance?.case, `${file}: provenance.case`).toBe(
        "client-phone"
      );
      expect(
        fixture.captured_at && !Number.isNaN(Date.parse(fixture.captured_at)),
        `${file}: captured_at is a real timestamp`
      ).toBe(true);
      expect(fixture.brand_domain, `${file}: brand_domain`).toBeTruthy();
      expect(fixture.request?.method, `${file}: request.method`).toBeTruthy();
      expect(typeof fixture.response?.status, `${file}: response.status`).toBe(
        "number"
      );
    }
  });
});

describe("client-phone — the unified-billing mock is re-pointed at the surviving seam (AC-33)", () => {
  it("AC-33 unified.int.test.ts mocks client-phone via useClientPhones().as(SELF), not the retired useClientPhoneServices", () => {
    const content = readFileSync(UNIFIED_TEST_FILE, "utf-8");

    expect(content).toContain("useClientPhones");
    expect(content).not.toContain("useClientPhoneServices");
  });
});

describe("client-phone — every safeguard is proven by trying to break it first (AC-34)", () => {
  it("AC-34 all six negative controls are present, colocated with the spec each must flip red", () => {
    const expectedPatches = [
      "client-phone.manager-amputation.must-fail.patch",
      "client-phone.client-id-limb.must-fail.patch",
      "client-phone.scope-derived-id.must-fail.patch",
      "client-phone.feedback.must-fail.patch",
      "client-phone.parse-fallback.must-fail.patch",
      "client-phone.default-body.must-fail.patch"
    ];
    const present = readdirSync(TEST_DIR);

    for (const patch of expectedPatches) {
      expect(present, `missing negative control: ${patch}`).toContain(patch);
    }
  });
});
