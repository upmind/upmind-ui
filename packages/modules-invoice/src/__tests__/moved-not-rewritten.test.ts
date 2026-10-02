// -----------------------------------------------------------------------------
/**
 * @fileoverview The extraction moved the order module; it did not rewrite it
 *
 * ## Job To Be Done
 * Prove every marker the legacy order module carried survives the move, and none is added.
 *
 * ## What Breaks If These Fail
 * A state no e2e route reaches, such as a locked invoice, loses its panel.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEGACY_COMMIT,
  LEGACY_ROOT,
  MOVED_FILES,
  PACKAGE_FILES,
  markersIn
} from "./legacy-markers";
import snapshot from "./legacy-markers.json";

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());
const REPO_ROOT = resolve(PACKAGE_ROOT, "..", "..");

const legacyMarkers: string[] = snapshot.markers;

const movedSource = MOVED_FILES.map(file => ({
  file,
  from: `${LEGACY_ROOT}/${file}`,
  to: join("packages/modules-invoice/src", PACKAGE_FILES[file]),
  source: readFileSync(join(PACKAGE_ROOT, "src", PACKAGE_FILES[file]), "utf8")
}));

const carried = new Set(movedSource.flatMap(entry => markersIn(entry.source)));

const UNWATCHED_BRANCHES = [
  {
    branch: "a locked invoice",
    markers: [
      "invoice.order_locked",
      "invoice.order_locked_msg",
      "!orderMeta.isLocked"
    ]
  },
  {
    branch: "an offline payment still pending",
    markers: [
      "invoice.order_pending",
      "invoice.order_pending_msg",
      "text.pending"
    ]
  },
  {
    branch: "the free-order cold path",
    markers: ["invoice.order_free_msg"]
  },
  {
    branch: "the inline guest-registration section",
    markers: [
      "meta.showInlineGuestRegistration",
      "!showGuestUpgrade",
      "guest-registration",
      "auth.guest_register_title",
      "auth.guest_register_description",
      "action.register"
    ]
  }
];

const ACCOUNT_CTA_MOUNTS = [
  "action && !orderMeta.isComplete",
  "action && orderMeta.isComplete"
];

const UNREACHABLE_SESSION_BRANCH = [
  "!orderMeta.isAuthenticated",
  "text.session_expired",
  "text.session_expired_return_store_msg"
];

const PAYMENT_METHOD_ROW = ["text.payment_method", "text.card_ending"];

const SECTION_IDS = ["order-products", "order-details", "guest-registration"];

// -----------------------------------------------------------------------------

describe("the oracle this move is judged against", () => {
  it("pins a commit rather than a branch, which deletion could silence", () => {
    expect(LEGACY_COMMIT).toMatch(/^[0-9a-f]{40}$/);
    expect(snapshot.commit).toBe(LEGACY_COMMIT);
    expect(snapshot.source).toBe(LEGACY_ROOT);
  });

  it("carries a marker set large enough to be worth asserting", () => {
    expect(legacyMarkers.length).toBeGreaterThan(60);
    expect(new Set(legacyMarkers).size).toBe(legacyMarkers.length);
  });

  it("names every file the move carried", () => {
    expect(snapshot.files).toEqual([...MOVED_FILES]);
  });
});

describe("the move, read back file by file", () => {
  it.each(movedSource)("carries $file into the package", entry => {
    expect(existsSync(join(REPO_ROOT, entry.to))).toBe(true);
    expect(entry.source.length).toBeGreaterThan(0);
  });

  it.each(movedSource)(
    "leaves nothing of $file behind in client-vue",
    entry => {
      expect(
        existsSync(join(REPO_ROOT, entry.from)),
        `${entry.from} still exists, so the extraction copied rather than moved ` +
          `and two surfaces now drift apart`
      ).toBe(false);
    }
  );
});

describe("what the moved surface still carries", () => {
  it("keeps every marker the legacy module carried", () => {
    const lost = legacyMarkers.filter(marker => !carried.has(marker));

    expect(
      lost,
      `the move dropped ${lost.length} observable marker(s), so the surface ` +
        `changed on the way across: ${lost.join(", ")}`
    ).toEqual([]);
  });

  it.each(UNWATCHED_BRANCHES)(
    "keeps $branch, which no test can reach",
    ({ branch, markers }) => {
      for (const marker of markers) {
        expect(
          legacyMarkers,
          `${marker} is not in the oracle, so this guard over ${branch} asserts nothing`
        ).toContain(marker);
        expect(
          carried.has(marker),
          `${branch} lost ${marker} in the move, and nothing else watches it`
        ).toBe(true);
      }
    }
  );

  it("keeps both mount points of the one control that has two", () => {
    for (const mount of ACCOUNT_CTA_MOUNTS) {
      expect(legacyMarkers).toContain(mount);
      expect(carried.has(mount)).toBe(true);
    }
  });

  it("keeps the expired-session branch the cart's guard makes unreachable", () => {
    for (const marker of UNREACHABLE_SESSION_BRANCH) {
      expect(legacyMarkers).toContain(marker);
      expect(carried.has(marker)).toBe(true);
    }
  });

  it("keeps the payment-method row a stored method fills", () => {
    for (const marker of PAYMENT_METHOD_ROW) {
      expect(legacyMarkers).toContain(marker);
      expect(carried.has(marker)).toBe(true);
    }
  });

  it("keeps the section ids the standing e2e net locates through", () => {
    for (const id of SECTION_IDS) {
      expect(legacyMarkers).toContain(id);
      expect(carried.has(id)).toBe(true);
    }
  });

  it("adds no marker the legacy module did not carry", () => {
    const legacy = new Set(legacyMarkers);
    const added = [...carried].filter(marker => !legacy.has(marker)).sort();

    expect(
      added,
      `the move added behaviour rather than carrying it: ${added.join(", ")}`
    ).toEqual([]);
  });
});
