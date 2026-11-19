// -----------------------------------------------------------------------------
/**
 * @fileoverview useDataLayer — Google consent defaults
 *
 * ## Job To Be Done
 * `init()` sends the Google consent defaults and the `set` commands to the
 * data layer before GTM loads. Each command is an `arguments` object, the
 * `gtag()` form, with the same values as the legacy client area.
 *
 * ## What Breaks If These Fail
 * Google tags ignore a command pushed as an array. Consent shows as "not set",
 * and a CMP in the brand's GTM container cannot apply its consent update.
 */

// --- external
import { describe, it, expect, beforeEach, vi } from "vitest";

// ----------------------------------------------------------------------------

vi.mock("../../..", () => ({}));
vi.mock("../../../../utils", () => ({}));
vi.mock("../utils", () => ({}));
vi.mock("../../../routing", () => ({}));

const isArguments = (entry: unknown): boolean =>
  Object.prototype.toString.call(entry) === "[object Arguments]";

describe("useDataLayer", () => {
  beforeEach(() => {
    vi.resetModules();
    window.dataLayer = [];
    window.uetq = [];
  });

  describe("init", () => {
    it("pushes the consent commands as Google tag arguments, not arrays", async () => {
      const { useDataLayer } = await import("../useDataLayer");

      await useDataLayer().init();

      expect(window.dataLayer).toHaveLength(3);
      expect(window.dataLayer.every(isArguments)).toBe(true);
    });

    it("denies every consent type by default", async () => {
      const { useDataLayer } = await import("../useDataLayer");

      await useDataLayer().init();

      expect(Array.from(window.dataLayer[0])).toEqual([
        "consent",
        "default",
        {
          ad_personalization: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          analytics_storage: "denied",
          functionality_storage: "denied",
          personalization_storage: "denied",
          security_storage: "denied",
          wait_for_update: 500
        }
      ]);
    });

    it("redacts ads data and passes the click IDs through the URL", async () => {
      const { useDataLayer } = await import("../useDataLayer");

      await useDataLayer().init();

      expect(Array.from(window.dataLayer[1])).toEqual([
        "set",
        "ads_data_redaction",
        true
      ]);
      expect(Array.from(window.dataLayer[2])).toEqual([
        "set",
        "url_passthrough",
        true
      ]);
    });
  });
});
