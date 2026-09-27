/**
 * @fileoverview `contract.feature` ↔ test-suite anchor enforcement
 *
 * ## Job To Be Done
 * Ride this module's own suite and fail when a `contract.feature` scenario's
 * `@AC-n` id has no matching test in this `__tests__` tree (a coverage hole
 * the feature promises and nothing proves), or when a test's `AC-n` claim
 * names an id no scenario in `contract.feature` carries (a stale/untethered
 * test asserting something the contract no longer states). A `@todo`-tagged
 * scenario is exempt from the first direction.
 *
 * ## What Breaks If These Fail
 * `contract.feature` drifts from the suite silently — a capability is
 * promised and never proven, or a test outlives the capability it once
 * proved, and nobody notices either drift until a real regression ships.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TESTS_DIR = import.meta.dirname;
const FEATURE_FILE = "contract.feature";

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
        name !== "contract.traceability.test.ts"
    )
    .map(file => ({
      file,
      content: readFileSync(join(TESTS_DIR, file), "utf-8")
    }));
}

/**
 * Named, reviewed exceptions to full coverage — never a silent hole, keyed
 * on the EXACT `id::scenario` pair (see `contract-product.traceability.test.ts`
 * for why an id-only exemption or an id-only "some test mentions this id"
 * check can silently let one covered scenario discharge every OTHER scenario
 * sharing its id).
 *
 * EMPTY, AND THAT IS THE STATE — every `contract.feature` scenario has a test
 * naming its id. AC-7's half-proof is NOT a scenario gap: its failure half IS
 * proven (both withdraw tests drive the sandbox's real `404`), and only its
 * success half is unproven for want of a recorded 200 capture. A half-proven
 * scenario is the PARTIAL_PROMISES ledger's business, not this set's, and
 * that is where AC-7 is registered.
 */
const SCENARIO_GAPS = new Set<string>();

/**
 * The PARTIAL-PROMISE ledger — the blind spot the id+scenario floor below
 * cannot see; see the sibling `contract-product.traceability.test.ts` for the
 * full rationale. A `gap` entry needs a `@gap <feature>:<line>` marker in a
 * KNOWN GAP comment; a `proves` entry needs a `@proves <feature>:<line>`
 * marker on the proving test. Each pins its feature line VERBATIM.
 */
type PartialPromise = {
  line: number;
  text: string;
  disposition: "gap" | "proves";
};

const PARTIAL_PROMISES: PartialPromise[] = [
  {
    line: 113,
    text: "| first             | forward to the next page  | the next page comes back                                                 |",
    disposition: "proves"
  },
  {
    line: 114,
    text: "| second            | back to the previous page | the previous page comes back                                             |",
    disposition: "proves"
  },
  {
    line: 115,
    text: "| first             | forward to the last page  | the last page comes back and I am told there is no further page to go to |",
    disposition: "gap"
  },
  {
    line: 138,
    text: "Then it arrives with the cancellation request on it",
    disposition: "proves"
  },
  {
    line: 139,
    text: "And with that cancellation request's state",
    disposition: "proves"
  },
  {
    line: 140,
    text: "And with the contract's own status",
    disposition: "proves"
  },
  { line: 141, text: "And with my account's image", disposition: "proves" },
  {
    line: 142,
    text: "And with each of its products' status",
    disposition: "proves"
  },
  {
    line: 143,
    text: "And with each of its products' tags",
    disposition: "proves"
  },
  {
    line: 144,
    text: "And with each of its products' catalogue product image",
    disposition: "proves"
  },
  {
    line: 145,
    text: "And with the currency of each of its products' brand",
    disposition: "proves"
  },
  {
    line: 146,
    text: "And with the products that are still being imported included rather than hidden",
    disposition: "proves"
  },
  {
    line: 174,
    text: "| an active subscription   |",
    disposition: "proves"
  },
  {
    line: 175,
    text: "| a suspended subscription |",
    disposition: "proves"
  },
  {
    line: 176,
    text: "| a one-off purchase       |",
    disposition: "proves"
  },
  {
    line: 177,
    text: "| delegated to me          |",
    disposition: "gap"
  },
  {
    line: 192,
    text: "| no method at all           |",
    disposition: "proves"
  },
  {
    line: 193,
    text: "| the method it already uses |",
    disposition: "proves"
  },
  {
    line: 225,
    text: "| I open my contracts                              |",
    disposition: "proves"
  },
  {
    line: 226,
    text: "| I open one of my contracts                       |",
    disposition: "proves"
  },
  {
    line: 227,
    text: "| I force a change to my contract's payment method |",
    disposition: "proves"
  },
  {
    line: 248,
    text: "| opening one of my contracts         |",
    disposition: "proves"
  },
  {
    line: 249,
    text: "| changing how a contract is paid for |",
    disposition: "proves"
  },
  {
    line: 259,
    text: "Scenario: The contract I have open carries everything the manager read about it",
    disposition: "proves"
  },
  {
    line: 265,
    text: "Scenario: The contract I have open shows me its name",
    disposition: "proves"
  },
  {
    line: 271,
    text: "Scenario: My stored payment methods are loaded ready for the payment-method form",
    disposition: "proves"
  },
  {
    line: 277,
    text: "Scenario: When reading my contract fails I am shown why",
    disposition: "proves"
  },
  {
    line: 283,
    text: "Scenario: A failed read of my contract stops loading and settles on an error instead of hanging",
    disposition: "proves"
  },
  {
    line: 289,
    text: "Scenario: A failed read tells me at once that my contract is not ready",
    disposition: "proves"
  },
  {
    line: 295,
    text: "Scenario: A reset after a failed read reads my contract again",
    disposition: "proves"
  },
  {
    line: 302,
    text: "Scenario: A stored card I choose in the payment-method form is taken in and checked",
    disposition: "proves"
  },
  {
    line: 308,
    text: "Scenario: Close the payment-method form without changing how my contract is paid for",
    disposition: "proves"
  },
  {
    line: 315,
    text: "Scenario: Submit the payment-method form with the card I hand it",
    disposition: "proves"
  },
  {
    line: 322,
    text: "Scenario: While my payment-method change is being sent I am told it is in progress",
    disposition: "proves"
  },
  {
    line: 329,
    text: "Scenario: When my payment-method change finishes I am told it is done",
    disposition: "proves"
  },
  {
    line: 335,
    text: "Scenario: A payment-method choice outside my stored cards is not sent and tells me why",
    disposition: "proves"
  },
  {
    line: 342,
    text: "Scenario: A card I choose and submit straight away is the one that is sent",
    disposition: "proves"
  },
  {
    line: 348,
    text: "Scenario: With no payment-method change under way I am not told a change is done",
    disposition: "proves"
  },
  {
    line: 354,
    text: "Scenario: A contract read whose status is none I know settles on an error instead of a state",
    disposition: "proves"
  },
  {
    line: 361,
    text: "Scenario: The contract I manage is the one I addressed by id",
    disposition: "proves"
  },
  {
    line: 373,
    text: "Scenario: The payment-method form never opens empty",
    disposition: "proves"
  },
  {
    line: 380,
    text: "Scenario Outline: I change how my contract is paid for through the payment-method form, whatever its standing",
    disposition: "proves"
  },
  { line: 387, text: "| active    |", disposition: "proves" },
  { line: 388, text: "| cancelled |", disposition: "proves" },
  { line: 389, text: "| lapsed    |", disposition: "proves" },
  {
    line: 392,
    text: "Scenario: The payment-method form is refused on a contract held for fraud",
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

describe("contract — every contract.feature @AC-n scenario is anchored to a real test (traceability)", () => {
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
   * The id+scenario cardinality floor — see the sibling
   * `contract-product.traceability.test.ts` for the full rationale and the
   * live AC-1 case that motivated it.
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
    "$disposition $line — the ledger still quotes contract.feature:$line verbatim",
    ({ line, text }) => {
      expect(featureLines[line - 1]?.trim()).toBe(text);
    }
  );

  it.each(PARTIAL_PROMISES)(
    "$disposition $line — a `@$disposition` marker for contract.feature:$line sits in this module's __tests__ tree",
    ({ line, disposition }) => {
      expect(
        treeContent.includes(`@${disposition} ${FEATURE_FILE}:${line}`)
      ).toBe(true);
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
   * Examples data row out of `contract.feature` and fails when one has no
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
    "contract.feature:%s — this Examples row carries a disposition in the ledger",
    line => {
      const declared = new Set(PARTIAL_PROMISES.map(promise => promise.line));
      expect(declared.has(line)).toBe(true);
    }
  );

  /**
   * THE @member FLOOR. A `@member` scenario carries no `@AC-n` id, so the id
   * floor above never sees it. Each one must be proven by a test whose title
   * IS the scenario name, and must carry a ledger entry at its own
   * `Scenario:` line, so its `@proves` marker is checked like every other.
   */
  const memberScenarios: { line: number; name: string }[] = (() => {
    const found: { line: number; name: string }[] = [];
    let pendingTags: string[] = [];
    featureLines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (line.startsWith("@")) {
        pendingTags.push(...line.split(/\s+/));
        return;
      }
      const scenarioMatch = /^Scenario(?: Outline)?:\s*(.+)$/.exec(line);
      if (scenarioMatch) {
        if (pendingTags.includes("@member") && !pendingTags.includes("@todo")) {
          found.push({ line: index + 1, name: scenarioMatch[1] });
        }
        pendingTags = [];
        return;
      }
      if (line.length > 0 && !line.startsWith("#")) pendingTags = [];
    });
    return found;
  })();

  it("finds @member scenarios to grade, so this check itself is not vacuous", () => {
    expect(memberScenarios.length).toBeGreaterThan(0);
  });

  it.each(memberScenarios)(
    "@member $line ($name) is proven by a test titled with its scenario name",
    ({ name }) => {
      expect(treeContent.includes(`it("${name}"`)).toBe(true);
    }
  );

  it.each(memberScenarios)(
    "@member $line ($name) carries a `proves` ledger entry at its Scenario line",
    ({ line }) => {
      const entry = PARTIAL_PROMISES.find(promise => promise.line === line);
      expect(entry?.disposition).toBe("proves");
    }
  );

  it("names no test-TITLE AC-n claim absent from contract.feature (no stale/untethered test)", () => {
    const featureIds = new Set(scenarios.map(scenario => scenario.id));
    const untethered = [...allTitleIds].filter(id => !featureIds.has(id));
    expect(untethered).toEqual([]);
  });
});
