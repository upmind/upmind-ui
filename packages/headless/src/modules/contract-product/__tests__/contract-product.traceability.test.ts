/**
 * @fileoverview `contract-product.feature` ↔ test-suite anchor enforcement
 *
 * ## Job To Be Done
 * Ride this module's own suite and fail when a `contract-product.feature`
 * scenario's `@AC-n` id has no matching test in this `__tests__` tree (a
 * coverage hole the feature promises and nothing proves), or when a test
 * title's `AC-n` claim names an id no scenario in `contract-product.feature`
 * carries (a stale/untethered test asserting something the contract no
 * longer states). A `@todo`-tagged scenario is exempt from the first
 * direction.
 *
 * ## What Breaks If These Fail
 * `contract-product.feature` drifts from the suite silently — a capability
 * is promised and never proven, or a test outlives the capability it once
 * proved, and nobody notices either drift until a real regression ships.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import { stepCatalogs } from "../../../testing";
import contractProductSteps, {
  coveredActionIds
} from "./contract-product.steps";
import { includes, map, reject, some } from "lodash-es";

const TESTS_DIR = import.meta.dirname;
const FEATURE_FILE = "contract-product.feature";

type ScenarioTag = { id: string; scenario: string; todo: boolean };

function parseFeatureTags(): ScenarioTag[] {
  const content = readFileSync(join(TESTS_DIR, FEATURE_FILE), "utf-8");
  const lines = content.split("\n");
  const found: ScenarioTag[] = [];
  let pendingTags: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("@")) {
      pendingTags.push(...trimmed.split(/\s+/));
      continue;
    }
    const scenarioMatch = /^Scenario(?: Outline)?:\s*(.+)$/.exec(trimmed);
    if (scenarioMatch) {
      const acTags = pendingTags.filter(tag => /^@AC-\d+$/.test(tag));
      const todo = pendingTags.includes("@todo");
      for (const tag of acTags) {
        found.push({
          id: tag.replace("@", ""),
          scenario: scenarioMatch[1],
          todo
        });
      }
      pendingTags = [];
      continue;
    }
    if (trimmed.length > 0 && !trimmed.startsWith("#")) {
      pendingTags = [];
    }
  }
  return found;
}

function testFileContents(): { file: string; content: string }[] {
  return readdirSync(TESTS_DIR)
    .filter(
      name =>
        (name.endsWith(".test.ts") || name.endsWith(".int.test.ts")) &&
        name !== "contract-product.traceability.test.ts"
    )
    .map(file => ({
      file,
      content: readFileSync(join(TESTS_DIR, file), "utf-8")
    }));
}

/**
 * Named, reviewed exceptions — never a silent hole, and keyed on the EXACT
 * `id::scenario` pair, never on the bare id. An id-only exemption (or an
 * id-only "does some test mention this id" check, which this file used to
 * run) lets one covered scenario silently discharge every OTHER scenario
 * sharing its id — proven live on `@AC-1`: five scenarios share that tag,
 * four are proven, and the fifth (`contract-product.feature:104`, "A brand
 * that hides one-off purchases hides them from me everywhere") had zero
 * matching assertions anywhere in this tree, yet the old id-only check
 * passed, because SOME `@AC-1` test existed. See `receipts.md` "Outstanding
 * gaps" for the reason each pair below is here rather than proven:
 *
 * - AC-2 (both scenarios) and AC-18 need a `client-personal-details`
 *   preference-read capture that does not exist on disk.
 * - AC-1's two brand scenarios (the collection one and the AC-19 category-count
 *   one amendment A18(d) adds) need a recorded brand-settings capture carrying
 *   the hide-one-off-purchases flag; see the KNOWN GAP note beside
 *   `contract-product.reads.int.test.ts`'s AC-1 describe block. Recording is
 *   forbidden this pass.
 * - AC-15's "An empty scheduled-actions result tells me why it is empty"
 *   (amendment A22(f)) needs a recorded product capture WITHOUT the
 *   `scheduled_actions` member at all, to tell "none are scheduled" from "not
 *   asked for yet". The one capture on disk carries `scheduled_actions: []`.
 * - AC-18's two split scenarios (amendments A18(c) and A19) ride the same
 *   `client-personal-details` preference seam as their host, which has no
 *   capture on disk.
 *
 * Every entry is a reported, cited gap — never a silently faked green.
 */
const SCENARIO_GAPS = new Set([
  "AC-2::Choose whether to see products delegated to me",
  "AC-2::Never be shown delegated products I do not have",
  "AC-18::My choice about delegated products is remembered",
  "AC-18::Having nothing delegated to me outranks what I chose before",
  "AC-18::My choice survives a profile I have open at the same time",
  "AC-19::A brand that hides one-off purchases hides them from my category counts too",
  "AC-1::A brand that hides one-off purchases hides them from me everywhere",
  "AC-15::An empty scheduled-actions result tells me why it is empty"
]);

/**
 * The PARTIAL-PROMISE ledger — the blind spot the id+scenario floor below
 * cannot see. That floor is a per-SCENARIO cardinality proof: it fires when a
 * whole scenario is unproven, and is silent when a scenario is proven in part
 * and one of its `And` lines is not. Those halves are where a parity loss
 * hides, so each one is written down here, at its exact feature line, with
 * its disposition:
 *
 * - `gap`   — the promise has no proof. The tree must carry a matching
 *             `@gap <feature>:<line>` marker in a KNOWN GAP comment, so the
 *             reason lives beside the tests rather than only in a report.
 * - `proves` — the promise IS proven. The tree must carry a matching
 *             `@proves <feature>:<line>` marker on the proving test, so the
 *             proof survives a rename of the title the floor counts.
 *
 * Every entry pins the feature line VERBATIM, so editing the promise (or
 * inserting a line above it) fails here instead of silently orphaning the
 * marker.
 *
 * WHAT THIS LEDGER IS AND IS NOT. It is a hand-curated ALLOW-LIST, so it
 * cannot DETECT an unregistered half-promise — only carry the disposition of
 * one already found. The mechanism that keeps the INPUT SET honest sits
 * upstream, in the feature itself: bdd.md's amendments A1, A20, A28 and A32
 * split every packed `Then` into ONE READING PER LINE, so a half-promise can
 * no longer hide inside a thirteen-reading sentence that one assertion appears
 * to discharge, and amendments A10-A13, A18, A19, A22, A24 and A25 move every
 * claim whose `Given` did not set its subject up onto a row that does. This
 * ledger then carries the per-line disposition for every line whose proof is
 * not self-evident from the test naming its scenario. A line added to the
 * feature without an entry here is still caught by review, not by this file:
 * that limitation is stated rather than papered over.
 */
type PartialPromise = {
  line: number;
  text: string;
  disposition: "gap" | "proves";
};

const PARTIAL_PROMISES: PartialPromise[] = [
  {
    line: 702,
    text: "| on                | on      |",
    disposition: "proves"
  },
  {
    line: 703,
    text: "| off               | off     |",
    disposition: "proves"
  },
  {
    line: 111,
    text: "And each one arrives with its status",
    disposition: "proves"
  },
  {
    line: 112,
    text: "And each one arrives with its catalogue product",
    disposition: "proves"
  },
  {
    line: 113,
    text: "And each one arrives with that product's brand",
    disposition: "proves"
  },
  {
    line: 114,
    text: "And each one arrives with its category",
    disposition: "gap"
  },
  {
    line: 115,
    text: "And each one arrives with its tags",
    disposition: "proves"
  },
  {
    line: 116,
    text: "And each one arrives with its pending contract request",
    disposition: "proves"
  },
  {
    line: 117,
    text: "And each one arrives with any cancellation scheduled against it for a future date",
    disposition: "proves"
  },
  {
    line: 118,
    text: "And each one arrives with the product it was moved to",
    disposition: "proves"
  },
  {
    line: 333,
    text: "And whether it is awaiting setup",
    disposition: "proves"
  },
  {
    line: 334,
    text: "And whether it is on trial",
    disposition: "proves"
  },
  {
    line: 335,
    text: "And whether that trial is about to end",
    disposition: "proves"
  },
  {
    line: 340,
    text: "And whether it was imported",
    disposition: "gap"
  },
  {
    line: 341,
    text: "And whether it was moved to another product",
    disposition: "gap"
  },
  {
    line: 342,
    text: "And whether it has unpaid recurring invoices",
    disposition: "gap"
  },
  {
    line: 352,
    text: "And it is not confused with a subscription whose renewal invoicing was switched off, which this surface tells me about but never changes",
    disposition: "proves"
  },
  {
    line: 433,
    text: "And my account-level consolidation preference is left exactly as it was",
    disposition: "proves"
  },
  {
    line: 464,
    text: "| stop it renewing                                |",
    disposition: "proves"
  },
  {
    line: 465,
    text: "| change whether it joins my consolidated invoice |",
    disposition: "proves"
  },
  {
    line: 466,
    text: "| book a cancellation for a date I choose         |",
    disposition: "proves"
  },
  {
    line: 520,
    text: "Given I am looking at one of my products, at my products list, and at my dashboard's count of them, all at the same time",
    disposition: "gap"
  },
  {
    line: 560,
    text: "| not been asked for them yet  |",
    disposition: "gap"
  },
  {
    line: 133,
    text: "| product name                              |",
    disposition: "proves"
  },
  {
    line: 134,
    text: "| category name                             |",
    disposition: "proves"
  },
  {
    line: 135,
    text: "| category                                  |",
    disposition: "proves"
  },
  {
    line: 136,
    text: "| lifecycle status                          |",
    disposition: "proves"
  },
  {
    line: 137,
    text: "| whether they are subscriptions or one-off |",
    disposition: "proves"
  },
  {
    line: 138,
    text: "| when I bought them                        |",
    disposition: "proves"
  },
  {
    line: 139,
    text: "| when they next fall due                   |",
    disposition: "proves"
  },
  {
    line: 140,
    text: "| price                                     |",
    disposition: "proves"
  },
  {
    line: 183,
    text: "| status                  |",
    disposition: "proves"
  },
  {
    line: 184,
    text: "| when I bought them      |",
    disposition: "proves"
  },
  {
    line: 185,
    text: "| when they next fall due |",
    disposition: "proves"
  },
  {
    line: 186,
    text: "| when they were cancelled |",
    disposition: "proves"
  },
  {
    line: 197,
    text: "| first             | forward to the next page  | the next page comes back                                                 |",
    disposition: "proves"
  },
  {
    line: 198,
    text: "| second            | back to the previous page | the previous page comes back                                             |",
    disposition: "proves"
  },
  {
    line: 214,
    text: "| narrow  |",
    disposition: "proves"
  },
  {
    line: 215,
    text: "| order   |",
    disposition: "proves"
  },
  {
    line: 216,
    text: "| page    |",
    disposition: "proves"
  },
  {
    line: 402,
    text: "| a reason and details | my reason and details travel with the change |",
    disposition: "proves"
  },
  {
    line: 403,
    text: "| nothing              | nothing travels in their place               |",
    disposition: "proves"
  },
  {
    line: 422,
    text: "| not allowed |",
    disposition: "proves"
  },
  {
    line: 423,
    text: "| allowed     |",
    disposition: "proves"
  },
  {
    line: 437,
    text: "| opted out         | kept out of my consolidated invoice                 |",
    disposition: "proves"
  },
  {
    line: 438,
    text: "| opted in          | joined to my consolidated invoice                   |",
    disposition: "proves"
  },
  {
    line: 439,
    text: "| follow my account | consolidated exactly as the rest of my account is   |",
    disposition: "proves"
  },
  {
    line: 506,
    text: "| a one-off purchase, live        | the consolidation choice is not offered to me, and neither is stopping it renewing |",
    disposition: "proves"
  },
  {
    line: 507,
    text: "| a one-off purchase, still pending | the consolidation choice is not offered to me, and neither is stopping it renewing |",
    disposition: "proves"
  },
  {
    line: 508,
    text: "| a subscription                  | the consolidation choice is offered to me, and so is stopping it renewing          |",
    disposition: "proves"
  },
  {
    line: 509,
    text: "| a subscription already asked to stop | the consolidation choice is offered to me, and aborting that stop is offered in its place |",
    disposition: "proves"
  },
  {
    line: 527,
    text: "| stop the renewal                        |",
    disposition: "proves"
  },
  {
    line: 528,
    text: "| abort that stop                         |",
    disposition: "proves"
  },
  {
    line: 529,
    text: "| set the consolidation value             |",
    disposition: "proves"
  },
  {
    line: 530,
    text: "| book a cancellation for a date I choose |",
    disposition: "proves"
  },
  {
    line: 531,
    text: "| revoke that booking                     |",
    disposition: "proves"
  },
  {
    line: 559,
    text: "| no billing actions scheduled |",
    disposition: "proves"
  },
  {
    line: 591,
    text: "| a reason and details | my reason and details travel with it       |",
    disposition: "proves"
  },
  {
    line: 592,
    text: "| nothing              | nothing travels in their place             |",
    disposition: "proves"
  },
  {
    line: 637,
    text: "| I open my products                       |",
    disposition: "proves"
  },
  {
    line: 638,
    text: "| I open one of my products                |",
    disposition: "proves"
  },
  {
    line: 639,
    text: "| I force one of my subscriptions to stop renewing |",
    disposition: "proves"
  },
  {
    line: 640,
    text: "| I force a consolidation change           |",
    disposition: "proves"
  },
  {
    line: 661,
    text: "| opening one of my products                      |",
    disposition: "proves"
  },
  {
    line: 662,
    text: "| stopping one of my subscriptions renewing       |",
    disposition: "proves"
  },
  {
    line: 663,
    text: "| changing whether one joins my consolidated invoice |",
    disposition: "proves"
  },
  {
    line: 664,
    text: "| booking a cancellation for a date I choose      |",
    disposition: "proves"
  },
  {
    line: 665,
    text: "| revoking that booking                           |",
    disposition: "proves"
  },
  {
    line: 145,
    text: "Scenario: Clearing what I asked for brings all my products back",
    disposition: "proves"
  },
  {
    line: 168,
    text: "| has chosen to hide  | nothing             | only my subscriptions come back |",
    disposition: "gap"
  },
  {
    line: 169,
    text: "| has chosen to hide  | one-off purchases   | only my subscriptions come back — my brand's choice outranks mine |",
    disposition: "gap"
  },
  {
    line: 170,
    text: "| has made no choice about | nothing        | all my products come back |",
    disposition: "gap"
  },
  {
    line: 171,
    text: "| has made no choice about | one-off purchases | my one-off purchases come back |",
    disposition: "gap"
  },
  {
    line: 199,
    text: "| first             | forward to the last page  | the last page comes back and I am told there is no further page to go to |",
    disposition: "gap"
  },
  {
    line: 227,
    text: "| see    | the products delegated to me are included alongside my own |",
    disposition: "gap"
  },
  {
    line: 228,
    text: "| hide   | only my own products come back                          |",
    disposition: "gap"
  },
  {
    line: 243,
    text: "| see    |",
    disposition: "gap"
  },
  {
    line: 244,
    text: "| hide   |",
    disposition: "gap"
  },
  {
    line: 263,
    text: "| see    | my products still include the ones delegated to me          |",
    disposition: "gap"
  },
  {
    line: 264,
    text: "| hide   | my products still leave out the ones delegated to me        |",
    disposition: "gap"
  },
  {
    line: 305,
    text: "| see delegated     |",
    disposition: "proves"
  },
  {
    line: 306,
    text: "| hide delegated    |",
    disposition: "proves"
  },
  {
    line: 351,
    text: "And it tells me the date it will end, and that it is ending because I asked it to stop renewing",
    disposition: "gap"
  },
  {
    line: 502,
    text: "And forcing a consolidation change anyway makes no request and is refused",
    disposition: "gap"
  },
  {
    line: 781,
    text: "| an active subscription                                 | offered     |",
    disposition: "proves"
  },
  {
    line: 782,
    text: "| a subscription with auto-renew off and no end date     | offered     |",
    disposition: "proves"
  },
  {
    line: 783,
    text: "| a subscription already set to expire                   | not offered |",
    disposition: "proves"
  },
  {
    line: 784,
    text: "| a product with a cancellation booked for a future date | not offered |",
    disposition: "proves"
  },
  {
    line: 785,
    text: "| a product with a cancellation request already pending  | not offered |",
    disposition: "proves"
  },
  {
    line: 786,
    text: "| a subscription still being imported                    | not offered |",
    disposition: "proves"
  },
  {
    line: 787,
    text: "| a cancelled subscription                               | not offered |",
    disposition: "proves"
  },
  {
    line: 801,
    text: "| a subscription, and my account consolidates                   | offered     |",
    disposition: "proves"
  },
  {
    line: 802,
    text: "| a subscription, and my account follows its default            | offered     |",
    disposition: "proves"
  },
  {
    line: 803,
    text: "| a subscription, and my account never consolidates             | not offered |",
    disposition: "proves"
  },
  {
    line: 804,
    text: "| a subscription whose product carries no consolidation setting | not offered |",
    disposition: "proves"
  },
  {
    line: 805,
    text: "| a one-off purchase                                            | not offered |",
    disposition: "proves"
  },
  {
    line: 806,
    text: "| a subscription still being imported                           | not offered |",
    disposition: "proves"
  },
  {
    line: 807,
    text: "| a cancelled subscription                                      | not offered |",
    disposition: "proves"
  }
];

/**
 * Every `it`/`describe`/`it.each` TITLE string in the content, paired with
 * the `AC-n` ids it names. One entry per title — never deduped across
 * titles — so two different scenarios sharing an id cannot be discharged
 * by counting the same title twice, and a single title used to prove two
 * unrelated scenarios cannot inflate the count either.
 */
function extractTitlesWithIds(
  content: string
): { title: string; ids: string[] }[] {
  const titlePattern = /\b(?:it|describe|it\.each)\s*\(\s*["'`]([^"'`]*)["'`]/g;
  const entries: { title: string; ids: string[] }[] = [];
  for (const titleMatch of content.matchAll(titlePattern)) {
    const ids = [...titleMatch[1].matchAll(/\bAC-\d+\b/g)].map(m => m[0]);
    if (ids.length > 0) entries.push({ title: titleMatch[1], ids });
  }
  return entries;
}

describe("contract-product — every contract-product.feature @AC-n scenario is anchored to a real test (traceability)", () => {
  const scenarios = parseFeatureTags();
  const files = testFileContents();
  const allTitleIds = new Set<string>();
  const titlesById = new Map<string, Set<string>>();
  for (const { content } of files) {
    for (const { title, ids } of extractTitlesWithIds(content)) {
      for (const id of ids) {
        allTitleIds.add(id);
        if (!titlesById.has(id)) titlesById.set(id, new Set());
        titlesById.get(id)!.add(title);
      }
    }
  }
  const titleCountById = new Map(
    [...titlesById.entries()].map(([id, titles]) => [id, titles.size])
  );

  it("names at least one @AC-n scenario, so this check itself is not vacuous", () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  const provable = scenarios.filter(
    scenario =>
      !scenario.todo &&
      !SCENARIO_GAPS.has(`${scenario.id}::${scenario.scenario}`)
  );

  it.each(provable)(
    "$id ($scenario) has a matching test TITLE in this module's __tests__ tree",
    ({ id }) => {
      expect(allTitleIds.has(id)).toBe(true);
    }
  );

  /**
   * The bare "some test mentions this id" check above cannot tell four
   * scenarios sharing one id apart from one scenario proven four times — the
   * exact gap that let AC-1's brand-hides-one-off-purchases scenario hide
   * behind AC-1's other four, proven scenarios. This is the id+scenario
   * floor: for every id, the number of DISTINCT provable scenarios sharing
   * it can never exceed the number of DISTINCT test titles claiming it. It
   * is a cardinality proof, not a semantic one — it cannot confirm WHICH
   * scenario a given title proves, only that there are at least as many
   * claims as promises. Combined with `SCENARIO_GAPS` naming every scenario
   * that cannot yet be proven, a shortfall here means a specific,
   * unregistered scenario is being discharged by another scenario's test.
   */
  const provableCountById = new Map<string, number>();
  for (const scenario of provable) {
    provableCountById.set(
      scenario.id,
      (provableCountById.get(scenario.id) ?? 0) + 1
    );
  }

  it.each([...provableCountById.entries()])(
    "%s has at least as many distinct test titles as provable scenarios sharing it",
    (id, requiredCount) => {
      expect(titleCountById.get(id) ?? 0).toBeGreaterThanOrEqual(requiredCount);
    }
  );

  const featureLines = readFileSync(
    join(TESTS_DIR, FEATURE_FILE),
    "utf-8"
  ).split("\n");
  const treeContent = files.map(entry => entry.content).join("\n");

  it.each(PARTIAL_PROMISES)(
    "$disposition $line — the ledger still quotes contract-product.feature:$line verbatim",
    ({ line, text }) => {
      expect(featureLines[line - 1]?.trim()).toBe(text);
    }
  );

  it.each(PARTIAL_PROMISES)(
    "$disposition $line — a `@$disposition` marker for contract-product.feature:$line sits in this module's __tests__ tree",
    ({ line, disposition }) => {
      const marker = `@${disposition} ${FEATURE_FILE}:${line}`;
      expect(treeContent.includes(marker)).toBe(true);
    }
  );

  it("carries no `@gap`/`@proves` marker the ledger never declared", () => {
    const declared = new Set(
      PARTIAL_PROMISES.map(
        promise => `@${promise.disposition} ${FEATURE_FILE}:${promise.line}`
      )
    );
    const found = [
      ...treeContent.matchAll(
        new RegExp(`@(?:gap|proves) ${FEATURE_FILE}:\\d+`, "g")
      )
    ].map(match => match[0]);
    expect(found.length).toBeGreaterThan(0);
    expect(found.filter(marker => !declared.has(marker))).toEqual([]);
  });

  /**
   * THE OUTLINE-ROW FLOOR — the detection mechanism the ledger above is not.
   * `PARTIAL_PROMISES` is a hand-curated allow-list: it carries the
   * disposition of a half-promise already found, and is blind to one nobody
   * thought to write down. A `Scenario Outline` is where that blindness bites
   * hardest, because each Examples row is a NAMED, independently falsifiable
   * promise, and the id+scenario cardinality floor counts the whole Outline as
   * ONE scenario — so an Outline proven on one row and silent on four passes
   * every other check in this file.
   *
   * This check is DERIVED from the feature, not declared here: it parses every
   * Examples data row out of `contract-product.feature` and fails when one has no
   * ledger entry at its own line. Adding a row to the feature — or splitting a
   * packed line into rows, which is exactly what the last repair did — makes
   * this check fail until each new row is either proven (`proves` + a marker on
   * the proving test) or reported with its cause (`gap` + a KNOWN GAP marker).
   */
  const exampleRowLines: number[] = (() => {
    const rows: number[] = [];
    let inExamples = false;
    let headerPending = false;
    featureLines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (/^Scenario(?: Outline)?:/.test(line)) {
        inExamples = false;
        return;
      }
      if (/^Examples:/.test(line)) {
        inExamples = true;
        headerPending = true;
        return;
      }
      if (inExamples && line.startsWith("|")) {
        if (headerPending) {
          headerPending = false;
          return;
        }
        rows.push(index + 1);
        return;
      }
      if (inExamples && line.length > 0 && !line.startsWith("#")) {
        inExamples = false;
      }
    });
    return rows;
  })();

  it("finds Examples rows to grade, so this check itself is not vacuous", () => {
    expect(exampleRowLines.length).toBeGreaterThan(0);
  });

  it.each(exampleRowLines)(
    "contract-product.feature:%s — this Examples row carries a disposition in the ledger",
    line => {
      const declared = new Set(PARTIAL_PROMISES.map(promise => promise.line));
      expect(declared.has(line)).toBe(true);
    }
  );

  /**
   * The AC-18 disclaimer docblock `contract-product.utils.must-fail.patch`
   * cites is anchored by the describe TITLE it opens, never by a line number:
   * two earlier revisions of that header cited a line, and an insertion above
   * the block orphaned both. This check fails if the title moves out of that
   * file or is reworded, so the header cannot rot silently a third time.
   */
  it("the AC-18 disclaimer this patch header cites still opens resolveExcludeDelegated's describe", () => {
    const utils = files.find(
      entry => entry.file === "contract-product.utils.test.ts"
    );
    const patch = readFileSync(
      join(TESTS_DIR, "contract-product.utils.must-fail.patch"),
      "utf-8"
    );
    const title =
      "resolveExcludeDelegated — the exclude_delegated flag the scope";
    expect(utils?.content).toContain(`describe("${title} sends"`);
    expect(patch).toContain(title);
    expect(patch).not.toMatch(/contract-product\.utils\.test\.ts:\d+/);
  });

  it("names no test-TITLE AC-n claim absent from contract-product.feature (no stale/untethered test)", () => {
    const featureIds = new Set(scenarios.map(scenario => scenario.id));
    const untethered = [...allTitleIds].filter(id => !featureIds.has(id));
    expect(untethered).toEqual([]);
  });
});

/**
 * The spec-to-catalog drift gate: a half-matched scenario, an orphan or
 * malformed step, a pattern another module's catalog claims, and an action id
 * declared covered that no step fires each FAIL. A scenario nothing matches
 * passes — it stays spec. The catalog fires through one constant per key.
 */
describe("contract-product — the step catalog drives only whole scenarios", () => {
  const featureText = readFileSync(join(TESTS_DIR, FEATURE_FILE), "utf-8");
  const unwrappedCatalog = readFileSync(
    join(TESTS_DIR, "contract-product.steps.ts"),
    "utf-8"
  ).replace(/\s+/g, "");
  const coveredActionMaps = [
    "CONTRACT_PRODUCTS_COVERED_ACTIONS",
    "CONTRACT_PRODUCT_COVERED_ACTIONS"
  ];
  const {
    scenarios: playable,
    driveable,
    partial,
    orphanStepDefs,
    duplicatedPatterns,
    malformedStepDefs
  } = createTraceabilityCheck(featureText, contractProductSteps, stepCatalogs);

  it(`drives ${driveable.length} of ${playable.length} scenarios`, () => {
    expect(map(partial, "name"), "Half-matched scenarios").toEqual([]);
    expect(
      map(orphanStepDefs, "pattern"),
      "Step definitions nothing calls"
    ).toEqual([]);
    expect(
      map(malformedStepDefs, "pattern"),
      "Patterns that do not compile"
    ).toEqual([]);
    expect(
      duplicatedPatterns,
      "Patterns another catalog already claims"
    ).toEqual([]);
    expect(
      reject(coveredActionIds, id =>
        some(coveredActionMaps, constant =>
          includes(unwrappedCatalog, `fire(${constant}.${id}`)
        )
      ),
      "Declared covered but fired by no step"
    ).toEqual([]);
  });
});
