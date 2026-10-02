// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.criteria-labels — each criteria control label
 * resolves (@AC39)
 *
 * ## Job To Be Done
 * Protect that the uischema each control declares — read from the REAL
 * exported uischema functions and the real listing composables' published
 * `schemas.query.sortUischema` (design.md §8.3, §8.5), not a hand-authored
 * parallel key list — resolves in `packages/i18n/src/core/form-en.json`
 * (bdd.md AC39). A wrong or renamed `i18n` key in `affiliate.schemas.ts`
 * must reach this spec's assertions and redden it.
 *
 * ## What Breaks If These Fail
 * A criteria control renders its bare i18n key instead of a label — "form
 * affiliate_links_sort" instead of "Sort" — because the key that
 * `affiliate.schemas.ts` declares was never added to `form-en.json`, or was
 * added under the wrong field name, or the declaring function itself was
 * edited to point at a key that does not exist.
 *
 * `beforeEach` seeds a real client session and awaits the resolver, which
 * replays this unit's recorded fixtures through MSW — the ONLY requests this
 * file causes. Every assertion below then calls the real, exported
 * form-building functions or the listing composables' published context
 * in-process, with no further request (bdd.md AC39).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  useLinkUischema,
  useWithdrawalUischema,
  usePayoutDestinationUischema,
  useLinksQueryUischema,
  useReferralsQueryUischema
} from "../affiliate.schemas";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateCommissions } from "../useAffiliateCommissions";
import { useAffiliateLinks } from "../useAffiliateLinks";
import { useAffiliatePayouts } from "../useAffiliatePayouts";
import { useAffiliateReferrals } from "../useAffiliateReferrals";
import { seedRealClient } from "./affiliate.int-helpers";

// -----------------------------------------------------------------------------

type FormEntry = {
  label: string | null;
  description: string | null;
  placeholder: string | null;
  [field: string]: unknown;
};

type UischemaNode = {
  type?: string;
  i18n?: string;
  elements?: UischemaNode[];
  options?: Record<string, unknown>;
};

// `@workspace/no-cross-package-path-imports` bars a relative path reaching
// across a package boundary — `packages/i18n` publishes no subpath specifier
// for its locale source JSON. `readFileSync(join(...))` is the sibling
// pattern this repo already uses for the SAME class of file
// (`client-company.manager.int.test.ts`), resolved off `import.meta.dirname`
// — never `process.cwd()`, which breaks if vitest runs from a cwd other than
// `packages/headless` (pseudo-Nathan review pass 20). A scratch probe this
// pass confirmed `import.meta.dirname` resolves a real, correct absolute path
// in this exact happy-dom integration project; only the OTHER construction,
// `new URL(relative, import.meta.url).pathname`, is the broken one
// `setup.integration.ts`'s own `recordingsDir` comment names.
const FORM = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../../../../i18n/src/core/form-en.json"),
    "utf-8"
  )
) as Record<string, FormEntry>;

function hasKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(FORM, key);
}

function stripFormPrefix(i18nKey: string): string {
  return i18nKey.startsWith("form.") ? i18nKey.slice("form.".length) : i18nKey;
}

/**
 * Walks a live, real uischema tree and collects every declared `i18n` key —
 * derived from the actual object the module's own exported function
 * returns, never a hand-authored parallel list.
 */
function collectI18nKeys(
  node: UischemaNode | undefined,
  out: string[] = []
): string[] {
  if (!node) return out;
  if (typeof node.i18n === "string") out.push(node.i18n);
  for (const child of node.elements ?? []) collectI18nKeys(child, out);
  return out;
}

describe("affiliate.criteria-labels — each criteria control label resolves", () => {
  beforeEach(async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
  });

  // A canonical, non-`it.each` title restating the Gherkin scenario name —
  // the traceability gate's regex does not see `it.each` titles.
  it("each criteria control label resolves", () => {
    const linkKeys = collectI18nKeys(useLinkUischema() as UischemaNode).map(
      stripFormPrefix
    );
    expect(linkKeys.length).toBeGreaterThan(0);
    for (const key of linkKeys) {
      expect(hasKey(key), key).toBe(true);
    }
  });

  it.each([
    ["link form", () => useLinkUischema() as UischemaNode],
    ["withdrawal form", () => useWithdrawalUischema() as UischemaNode],
    [
      "payout destination form",
      () => usePayoutDestinationUischema() as UischemaNode
    ],
    ["links free-text search", () => useLinksQueryUischema() as UischemaNode],
    [
      "referrals free-text search",
      () => useReferralsQueryUischema() as UischemaNode
    ]
  ] as const)(
    "every control the real %s uischema declares resolves in form-en.json",
    (_, getUischema) => {
      const keys = collectI18nKeys(getUischema()).map(stripFormPrefix);
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        expect(hasKey(key), key).toBe(true);
        const entry = FORM[key];
        expect(entry.label !== null || entry.placeholder !== null, key).toBe(
          true
        );
      }
    }
  );

  it.each([
    [
      "links",
      () => useAffiliateLinks().as(ScopeActorTypes.CLIENT),
      ["created_at", "visit_count", "referral_count"]
    ],
    [
      "referrals",
      () => useAffiliateReferrals().as(ScopeActorTypes.CLIENT),
      ["created_at"]
    ],
    [
      "commissions",
      () => useAffiliateCommissions().as(ScopeActorTypes.CLIENT),
      ["amount", "created_at"]
    ],
    [
      "payouts",
      () => useAffiliatePayouts().as(ScopeActorTypes.CLIENT),
      ["amount", "created_at"]
    ]
  ] as const)(
    "the %s listing's REAL published sortUischema resolves, with one option key for each sortable field",
    async (_, getListing, fields) => {
      const listing = getListing();
      await listing.useActions().isReady();
      const sortUischema = (
        listing.useContext() as unknown as {
          schemas: { query: { sortUischema: UischemaNode } };
        }
      ).schemas.query.sortUischema;

      const key = stripFormPrefix(sortUischema.i18n ?? "");
      expect(
        key.length,
        "the sort uischema declares no i18n key"
      ).toBeGreaterThan(0);
      expect(hasKey(key), key).toBe(true);
      for (const field of fields as readonly string[]) {
        expect(FORM[key][field], `${key}.${field}`).toBeTypeOf("string");
      }
    }
  );

  it.each([
    ["commissions", () => useAffiliateCommissions().as(ScopeActorTypes.CLIENT)],
    ["payouts", () => useAffiliatePayouts().as(ScopeActorTypes.CLIENT)]
  ] as const)(
    "every control the %s listing's REAL published criteria uischema declares resolves in form-en.json",
    async (_, getListing) => {
      const listing = getListing();
      await listing.useActions().isReady();
      const uischema = listing.useContext().schemas.query
        .uischema as UischemaNode;

      const keys = collectI18nKeys(uischema).map(stripFormPrefix);
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        expect(hasKey(key), key).toBe(true);
        const entry = FORM[key];
        expect(entry.label !== null || entry.placeholder !== null, key).toBe(
          true
        );
      }
    }
  );

  it("declares no sort option key for a field outside its own sortable-field set", async () => {
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();
    const sortUischema = (
      links.useContext() as unknown as {
        schemas: { query: { sortUischema: UischemaNode } };
      }
    ).schemas.query.sortUischema;
    const key = stripFormPrefix(sortUischema.i18n ?? "");

    // The links sort enum has no `amount` field (design.md §8.3) — the
    // commissions and payouts sort key must not leak onto the links entry.
    expect(FORM[key].amount).toBeUndefined();
  });
});
