#!/usr/bin/env node
// @ts-check
/**
 * Quarantine deadline enforcement (FE-2776, ADR 021 §Flakiness policy — AC4).
 *
 * The forcing function. Intended to run on a WEEKLY CI cron (see
 * .gitlab-ci/quarantine.yml):
 *
 *   --remind   Day-25: for every quarantine with ≤ (window − 25) days left,
 *              file a Linear "Quarantine expiring: <test>" issue assigned to the
 *              quarantiner. Best-effort: needs LINEAR_API_KEY; without it (or
 *              without --apply) it DRY-RUNS and prints what it would file.
 *   --enforce  Day-30: exit non-zero listing every quarantine PAST its
 *              delete-date, failing the build until each is deleted, refreshed
 *              with a documented justification, or fixed-and-restored.
 *
 * With no mode flag it runs --remind (dry-run) then --enforce.
 *
 * The ONLY exemption from the day-30 FAIL is an explicit baseline entry
 * (grandfathered pre-existing debt, burned down by the separate audit pass).
 * Enforcement deliberately does NOT care about id *shape*: a placeholder id
 * (`FE-XXXX`) must never grant a test permanent immunity from the deadline — that
 * was a silent bypass. A tagged quarantine whose delete-date is unparseable OR
 * entirely ABSENT (`@quarantine(FE-9999)` with no date) is likewise failed: it
 * has no computable deadline and must be fixed, so neither a garbage date nor a
 * missing one can become a permanent bypass.
 *
 * Usage:
 *   node tests/quarantine/quarantine-enforce.mjs [--remind] [--enforce] [--apply]
 */

import {
  collectStaticSkips,
  loadBaseline,
  ageOf,
  isValidISODate,
  QUARANTINE_WINDOW_DAYS
} from "./lib/quarantine.mjs";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const REMIND =
  args.has("--remind") || (!args.has("--enforce") && !args.has("--remind"));
const ENFORCE =
  args.has("--enforce") || (!args.has("--enforce") && !args.has("--remind"));

const REMIND_DAY = 25;
const LINEAR_API = "https://api.linear.app/graphql";

/**
 * Every quarantine the forcing function governs: any tagged static skip (one
 * carrying an id) that is NOT explicitly baselined. A missing delete-date is
 * deliberately NOT filtered out here — a dateless tag stays governed so
 * {@link enforce} can FAIL it as malformed, rather than letting it slip past the
 * deadline unnoticed (the old `r.id && r.date` filter silently dropped it). Id
 * *shape* is irrelevant on purpose — a placeholder id must not exempt a test.
 * The baseline (grandfathered debt) is the only exemption.
 * @returns {import("./lib/quarantine.mjs").QuarantineRecord[]}
 */
function governedQuarantines() {
  const baseline = loadBaseline();
  return collectStaticSkips()
    .filter(r => r.id)
    .filter(r => !baseline.has(r.key));
}

/**
 * Annotate the well-formed-date subset with its age. Records whose delete-date is
 * unparseable are dropped here (they have no computable age) and handled
 * separately by {@link enforce} — they are NOT silently exempted.
 * @param {import("./lib/quarantine.mjs").QuarantineRecord[]} records
 * @param {Date} [now]
 */
function withAge(records, now = new Date()) {
  return records
    .filter(r => isValidISODate(r.date))
    .map(r => ({ ...r, age: ageOf(/** @type {string} */ (r.date), now) }));
}

/**
 * Best-effort Linear issue create via GraphQL. No-ops (returns false) when the
 * API key is absent or --apply was not passed — the script never assumes it may
 * write to Linear.
 * @param {string} title
 * @param {string} description
 * @returns {Promise<boolean>}
 */
async function fileLinearIssue(title, description) {
  const key = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!APPLY || !key || !teamId) return false;
  const query = `mutation IssueCreate($input: IssueCreateInput!) {
    issueCreate(input: $input) { success issue { identifier url } }
  }`;
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key },
    body: JSON.stringify({
      query,
      variables: { input: { teamId, title, description } }
    })
  });
  const json = await res.json();
  const issue = json?.data?.issueCreate?.issue;
  if (issue) {
    console.log(`    → filed ${issue.identifier}: ${issue.url}`);
    return true;
  }
  console.warn(
    `    → Linear issueCreate failed: ${JSON.stringify(json?.errors ?? json)}`
  );
  return false;
}

async function remind() {
  const expiring = withAge(governedQuarantines()).filter(
    r => !r.age.expired && r.age.daysElapsed >= REMIND_DAY
  );
  if (expiring.length === 0) {
    console.log(
      `[quarantine-enforce] remind: nothing expiring within ${QUARANTINE_WINDOW_DAYS - REMIND_DAY} day(s).`
    );
    return;
  }
  console.log(
    `[quarantine-enforce] remind: ${expiring.length} quarantine(s) expiring ` +
      `soon${APPLY && process.env.LINEAR_API_KEY ? "" : " (DRY RUN — set LINEAR_API_KEY + LINEAR_TEAM_ID + --apply to file)"}:`
  );
  for (const r of expiring) {
    const title = `Quarantine expiring: ${r.title}`;
    const description =
      `The quarantined test \`${r.file}:${r.line}\` ("${r.title}") linked to ` +
      `${r.id} expires in ${r.age.daysRemaining} day(s) (delete-date ${r.date}).\n\n` +
      `Per ADR 021 §Flakiness policy it will auto-fail CI on its delete-date ` +
      `unless it is deleted, fixed-and-restored, or re-quarantined with a ` +
      `documented justification. See tests/quarantine/docs/14-quarantine-tooling.md.`;
    console.log(
      `  ⏰ ${r.id}  ${r.file}:${r.line}  "${r.title}"  (${r.age.daysRemaining}d left)`
    );
    await fileLinearIssue(title, description);
  }
}

function enforce() {
  const governed = governedQuarantines();
  const expired = withAge(governed).filter(r => r.age.expired);
  // A tagged quarantine whose delete-date is unparseable OR missing has no
  // computable deadline. Failing it (rather than dropping it) closes the same
  // class of bypass as the id-shape one: neither a garbage date nor an absent
  // one may buy permanent immunity. `isValidISODate(null)` is false, so a
  // dateless tag (now kept by governedQuarantines) lands here.
  const malformed = governed.filter(r => !isValidISODate(r.date));

  if (expired.length === 0 && malformed.length === 0) {
    console.log(
      "[quarantine-enforce] enforce: no quarantines past their delete-date. ✅"
    );
    return 0;
  }
  console.error(
    `\n[quarantine-enforce] FAIL: ${expired.length + malformed.length} quarantine(s) ` +
      `must be resolved (${QUARANTINE_WINDOW_DAYS}-day deadline) — delete, ` +
      `fix-and-restore, or re-quarantine with a valid ` +
      `@quarantine(<linear-id>, <delete-date>) and justification:`
  );
  for (const r of expired) {
    console.error(
      `  ⛔ ${r.id}  ${r.file}:${r.line}  "${r.title}"  ` +
        `(expired ${-r.age.daysRemaining}d ago, delete-date ${r.date})`
    );
  }
  for (const r of malformed) {
    const reason =
      r.date == null
        ? "delete-date is MISSING"
        : `delete-date "${r.date}" is not a valid ISO YYYY-MM-DD`;
    console.error(
      `  ⛔ ${r.id}  ${r.file}:${r.line}  "${r.title}"  ` +
        `(${reason} — cannot enforce; fix the tag to @quarantine(<id>, <YYYY-MM-DD>))`
    );
  }
  return 1;
}

async function main() {
  if (REMIND) await remind();
  let code = 0;
  if (ENFORCE) code = enforce();
  process.exit(code);
}

main();
