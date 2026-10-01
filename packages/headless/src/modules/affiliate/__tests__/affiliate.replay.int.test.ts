// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.replay — every recorded capture is a scrubbed
 * staging recording (@AC38)
 *
 * ## Job To Be Done
 * Protect the provenance guarantee every other spec in this unit leans on:
 * each `fixtures/*.json` file is a REAL staging recording (never
 * hand-authored, ADR-025 §A1.3), and no capture leaks a live `Bearer` token
 * (design.md §8.9 "The generator", §8.11 `bearer-capture` control).
 *
 * ## What Breaks If These Fail
 * A hand-authored or PII-leaking fixture would certify something false about
 * every spec that replays it — green built on fiction.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { recordingsDir } from "./setup.integration";

// -----------------------------------------------------------------------------

/**
 * The owed captures, derived independently from the CONTRACT (design.md
 * §8.1 reads, §8.2 writes, §8.1 "the reads of useBrand()"), not copied from
 * a directory listing at authoring time — a list built BY listing disk can
 * never independently catch a later-deleted capture. Each entry cites the
 * design.md row that demands it — a capture with no citation below does not
 * belong here.
 */
const OWED_CAPTURES = [
  // §8.1 module-owned self read (AC10, AC13)
  "get-self",
  // §8.1 account + relations read (AC2, AC5, AC6)
  "get-accounts-id-affiliate-with-staged-imports-1",
  // §8.1 balance read (AC3)
  "get-accounts-id-affiliate-balance-with-staged-imports-1",
  // §8.1 links read (AC7-AC9)
  "get-accounts-id-affiliate-links-with-staged-imports-1",
  // §8.1 one-link read (AC11)
  "get-accounts-id-affiliate-links-id",
  // §8.2 link create, success + 422 (AC10)
  "post-accounts-id-affiliate-links",
  "post-accounts-id-affiliate-links-case-rejected",
  // §8.2 link edit, success + 422 (AC11)
  "put-accounts-id-affiliate-links-id",
  "put-accounts-id-affiliate-links-id-case-rejected",
  // §8.2 link delete, success + 404 (AC12)
  "delete-accounts-id-affiliate-links-id",
  "delete-accounts-id-affiliate-links-id-case-rejected",
  // §8.2 enrol, refused (AC4 — enrolled account has no success capture)
  "post-accounts-id-affiliate-case-rejected",
  // §8.2 withdraw — real success (AC19, message provided, operator brief
  // 2026-09-30). The empty-message failure branch is a declared
  // `serveFailure(422)` control, not a recorded capture — this account no
  // longer refuses an empty message server-side, and recording it for real
  // would raise a second real ticket over the one-ticket budget (see
  // affiliate.withdraw.int.test.ts's own header).
  "post-accounts-id-affiliate-withdraw",
  // §8.1 referrals read (AC14, AC15)
  "get-accounts-id-affiliate-referrals",
  // §8.1 pending commissions read (AC16, AC17)
  "get-accounts-id-affiliate-pending-commissions-with-staged-imports-1",
  // §8.1 payouts read (AC20, AC21)
  "get-accounts-id-affiliate-payouts-with-staged-imports-1",
  // §8.1 payout destinations read (AC22)
  "get-brands-id-affiliate-payout-destination",
  // §8.1 PayPal emails read (AC23)
  "get-clients-id-emails-with-staged-imports-1",
  // §8.2 the account save — PayPal destination + email (AC23, operator brief
  // 2026-09-30)
  "put-accounts-id",
  // §8.2 the account save — a genuinely different (non-PayPal) destination,
  // recorded and restored around the PayPal save above (AC23, review-notes.md
  // pass-7 blocker 1)
  "put-accounts-id-case-non-paypal-save",
  // §8.1 gate key set (AC1) — `affiliate.fixtures.ts` builds the `keys`
  // parameter from the real `BrandConfigKeys` enum VALUES, not the TS member
  // NAMES; the generator's hashed filename replaces the old, wrongly-keyed
  // slug (that capture answered `data: []` on every run because staging
  // never recognised the literal enum-name string as a config key).
  "get-config-brand-values-6b52bc3c",
  // §8.1 area key set (AC10, AC18) — both the plain and the `brand_id`
  // variant (the seat Read-block bars confirming which one this build
  // sends; the MSW matcher answers whichever shape the real request
  // carries, see affiliate.fixtures.ts's own comment). Same enum-VALUE fix
  // as the gate key set above.
  "get-config-brand-values-63a08b76",
  "get-config-brand-values-dba1bf2f",
  // §8.1 "the reads of useBrand()" — brand/settings, org/modules, config/organisation/values
  "get-brand-settings",
  "get-org-modules",
  "get-config-organisation-values",
  // guest session bootstrap, shared by every session-dependent spec (T05)
  "post-oauth-access-token-guest",
  // §8.2 guest link visit, base success (AC24)
  "post-affiliate-link-visit",
  // §8.2 guest link visit of an unknown link hash — no `referral_cookie` in
  // the response, the real trigger of the attribution-removed/delete path
  // (AC24, NO-EMPTY-COOKIE-CAPTURE closed)
  "post-affiliate-link-visit-case-unknown-hash",
  // R-ENROL (review-notes.md, 2026-09-30) — otherClient's self read and its
  // post-enrolment account read. The not-enrolled-404 and enrol-POST
  // captures this ruling also authorised were lost to a guard-path bug on
  // an accidental second run (affiliate.fixtures.ts's own comment) and are
  // not owed here because they no longer exist and cannot be re-taken.
  "get-self-case-otherclient",
  "get-accounts-id-affiliate-case-enrolled-otherclient-with-staged-imports-1",
  // R-ENROL-2 (review-notes.md, 2026-10-01) — a second, distinct staging
  // client's not-enrolled 404, the real enrol POST success (base, no
  // `case`), and the real enrolled re-read (AC4, AC5's not-enrolled row).
  "get-accounts-id-affiliate-case-not-enrolled-with-staged-imports-1",
  "post-accounts-id-affiliate",
  "get-accounts-id-affiliate-case-after-enrol-with-staged-imports-1",
  // R-DATA-3 (review-notes.md, 2026-10-01) — the same R-ENROL-2 client's own
  // self, account (empty payout destination) and emails reads, read-only.
  "get-self-case-reenrol2-empty-destination",
  "get-accounts-id-affiliate-case-reenrol2-empty-destination-with-staged-imports-1",
  "get-clients-id-emails-case-reenrol2-empty-destination-with-staged-imports-1"
];

function fixtureFiles(): string[] {
  return readdirSync(recordingsDir).filter(file => file.endsWith(".json"));
}

describe("affiliate.replay — each capture is a scrubbed staging recording", () => {
  // Title restates the Gherkin scenario name — pairs with AC38 for the
  // traceability gate (only `it()` titles count, never a `describe` title).
  it("each capture is a scrubbed staging recording — the fixture set is exactly the owed, capturable list, no more, no fewer", () => {
    const onDisk = fixtureFiles()
      .map(file => file.replace(/\.json$/, ""))
      .sort();

    expect(onDisk).toEqual([...OWED_CAPTURES].sort());
  });

  it("no capture holds a live Bearer token", () => {
    // Per-MATCH exemption, not per-file: a file that legitimately carries a
    // scrubbed `mock-` token elsewhere (e.g. a guest bootstrap's
    // `mock-access_token`) must not blanket-exempt a DIFFERENT, live-looking
    // `Bearer <token>` occurrence planted anywhere else in the same file.
    const leaks: string[] = [];
    for (const file of fixtureFiles()) {
      const raw = readFileSync(join(recordingsDir, file), "utf-8");
      const matches = raw.match(/Bearer [A-Za-z0-9._-]{10,}/g) ?? [];
      if (matches.some(match => !match.includes("mock-"))) {
        leaks.push(file);
      }
    }
    expect(leaks).toEqual([]);
  });

  it("every capture is version 3, sourced as a case, and carries a real captured_at", () => {
    for (const file of fixtureFiles()) {
      const fixture = JSON.parse(
        readFileSync(join(recordingsDir, file), "utf-8")
      ) as { version: number; source: string; captured_at: string };

      expect(fixture.version, file).toBe(3);
      expect(fixture.source, file).toBe("case");
      expect(Number.isNaN(Date.parse(fixture.captured_at)), file).toBe(false);
    }
  });
});
