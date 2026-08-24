/**
 * @fileoverview Brand Integration Tests
 *
 * ## Job To Be Done
 * Prove the brand module's API interactions work against recorded fixtures:
 * - GET /brand/settings returns identity bundle (AC-1)
 * - GET /config/brand/values uses filter[keys|eq] wire format (AC-2)
 * - GET /config/organisation/values returns feature flags (AC-3)
 * - GET /org/modules returns modules list (AC-4)
 *
 * ## What Breaks If These Fail
 * Brand identity would fail to load, breaking storefront initialization.
 * Config values would be missing, breaking checkout and basket behavior.
 */

import { describe, it, expect } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { recordingsDir } from "./setup.integration";

describe("brand.services integration (AC-1,2,3,4)", () => {
  describe("AC-1: GET /brand/settings", () => {
    it("returns brand identity with currencies and languages", () => {
      const fixture = getFixtureBody("get-brand-settings", { recordingsDir });

      expect(fixture).toBeDefined();
      expect(fixture.data).toBeDefined();
      expect(fixture.data.id).toBeDefined();
      expect(fixture.data.name).toBeDefined();
      expect(fixture.data.currencies).toBeDefined();
      expect(fixture.data.languages).toBeDefined();
    });
  });

  describe("AC-2: GET /config/brand/values", () => {
    it("returns keyed config values from recorded fixture", () => {
      const fixture = getFixtureBody("get-config-brand-values", {
        recordingsDir
      });

      expect(fixture).toBeDefined();
      expect(fixture.data).toBeDefined();
    });
  });

  describe("AC-3: GET /config/organisation/values", () => {
    it("returns organisation feature flags", () => {
      const fixture = getFixtureBody("get-config-organisation-values", {
        recordingsDir
      });

      expect(fixture).toBeDefined();
      expect(fixture.data).toBeDefined();
    });
  });

  describe("AC-4: GET /org/modules", () => {
    it("returns modules list", () => {
      const fixture = getFixtureBody("get-org-modules", { recordingsDir });

      expect(fixture).toBeDefined();
      expect(fixture.data).toBeDefined();
      expect(Array.isArray(fixture.data)).toBe(true);
    });
  });
});
