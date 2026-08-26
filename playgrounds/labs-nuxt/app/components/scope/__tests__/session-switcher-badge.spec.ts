/**
 * @module components/scope/__tests__/session-switcher-badge.spec
 * @description FE-3125 T-1/T-2: Verify Badge slot migration in SessionSwitcher.
 * Tests that Badge content renders via slot children, not label/icon props.
 *
 * @anchor session-switcher.feature
 */

import { config } from "@vue/test-utils";
import { describe, it, expect, afterEach, vi } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  seedPool,
  benchOn,
  labs,
  node,
  openPanel,
  resetDom,
  headlessDouble,
  textOf,
  MINUTE_MS,
  type Bench
} from "./harness";

config.global.stubs = { Teleport: true };

vi.mock("@upmind-automation/headless", async () =>
  headlessDouble(await vi.importActual("@upmind-automation/headless"))
);

describe("SessionSwitcher Badge slot migration", () => {
  let bench: Bench;

  afterEach(() => {
    bench?.wrapper.unmount();
    resetDom();
  });

  /**
   * @anchor T-1
   */
  describe("impersonation badge", () => {
    it(
      "displays impersonation indicator via slot content",
      { timeout: 15000 },
      async () => {
        seedPool(
          [
            {
              id: "staff-1",
              actor: AccessRoleTypes.STAFF,
              publicName: "Staff User"
            },
            {
              id: "client-1",
              actor: AccessRoleTypes.CLIENT,
              publicName: "Client User",
              impersonatedBy: "staff-1"
            }
          ],
          { active: "client-1" }
        );

        const { default: SessionSwitcher } =
          await import("../SessionSwitcher.vue");
        bench = await benchOn(SessionSwitcher);

        const impersonationCue = node("session-impersonation-cue");
        expect(impersonationCue).toBeTruthy();

        // The catalogue's own value, not "some non-empty text": a raw key or a
        // dropped slot child both read as truthy, and neither is the badge.
        expect(textOf(impersonationCue)).toContain(
          labs("session_impersonating")
        );
        expect(impersonationCue?.querySelector("svg, img")).toBeTruthy();
      }
    );

    it("renders badge content as slot children not props", async () => {
      seedPool(
        [
          {
            id: "staff-1",
            actor: AccessRoleTypes.STAFF,
            publicName: "Staff User"
          },
          {
            id: "client-1",
            actor: AccessRoleTypes.CLIENT,
            publicName: "Client User",
            impersonatedBy: "staff-1"
          }
        ],
        { active: "client-1" }
      );

      const { default: SessionSwitcher } =
        await import("../SessionSwitcher.vue");
      bench = await benchOn(SessionSwitcher);

      // The retired prop API fell THROUGH to the DOM as literal attributes, so
      // its fingerprint is any element still wearing them. Asserted over the
      // whole subtree: a per-badge loop can pass on an empty match.
      const props = bench.wrapper.element.querySelectorAll("[label], [icon]");
      expect(Array.from(props).map(element => element.outerHTML)).toEqual([]);

      // …and the badge the migration moved is really on screen, so the sweep
      // above has something to be true about.
      expect(textOf(node("session-impersonation-cue"))).toContain(
        labs("session_impersonating")
      );
    });
  });

  /**
   * @anchor T-2
   */
  describe("session expiry badge", () => {
    it("displays countdown via slot content", async () => {
      seedPool(
        [
          {
            id: "client-1",
            actor: AccessRoleTypes.CLIENT,
            publicName: "Client User",
            expiresIn: 30 * MINUTE_MS
          }
        ],
        { active: "client-1" }
      );

      const { default: SessionSwitcher } =
        await import("../SessionSwitcher.vue");
      bench = await benchOn(SessionSwitcher);

      // The countdown lives in the PANEL, so the panel is what the assertion
      // opens: the trigger's existence says nothing about the badge.
      await openPanel("session-switcher");

      const expiry = node("session-expiry");
      expect(expiry).toBeTruthy();
      expect(textOf(expiry)).toMatch(/\d/);
      expect(expiry?.querySelector("svg, img")).toBeTruthy();
    });
  });

  /**
   * @anchor T-3
   */
  describe("nest count badge", () => {
    it("displays session depth via slot content", async () => {
      seedPool(
        [
          {
            id: "staff-1",
            actor: AccessRoleTypes.STAFF,
            publicName: "Staff 1"
          },
          {
            id: "client-1",
            actor: AccessRoleTypes.CLIENT,
            publicName: "Client 1",
            impersonatedBy: "staff-1"
          },
          {
            id: "client-2",
            actor: AccessRoleTypes.CLIENT,
            publicName: "Client 2",
            impersonatedBy: "staff-1"
          }
        ],
        { active: "client-1" }
      );

      const { default: SessionSwitcher } =
        await import("../SessionSwitcher.vue");
      bench = await benchOn(SessionSwitcher);

      await openPanel("session-switcher");

      // Two clients hang off staff-1, so the depth the badge reports is 2 —
      // the seeded nest, read back, not the trigger's existence.
      expect(textOf(node("session-nest-count"))).toBe("2");
    });
  });

  /**
   * @anchor contract
   */
  describe("data-test-key contracts", () => {
    it("session-switcher selector exists", async () => {
      seedPool(
        [
          {
            id: "client-1",
            actor: AccessRoleTypes.CLIENT,
            publicName: "Client User"
          }
        ],
        { active: "client-1" }
      );

      const { default: SessionSwitcher } =
        await import("../SessionSwitcher.vue");
      bench = await benchOn(SessionSwitcher);

      expect(node("session-switcher")).toBeTruthy();
    });

    it("session-impersonation-cue selector exists when impersonating", async () => {
      seedPool(
        [
          {
            id: "staff-1",
            actor: AccessRoleTypes.STAFF,
            publicName: "Staff User"
          },
          {
            id: "client-1",
            actor: AccessRoleTypes.CLIENT,
            publicName: "Client User",
            impersonatedBy: "staff-1"
          }
        ],
        { active: "client-1" }
      );

      const { default: SessionSwitcher } =
        await import("../SessionSwitcher.vue");
      bench = await benchOn(SessionSwitcher);

      expect(node("session-impersonation-cue")).toBeTruthy();
    });
  });
});
