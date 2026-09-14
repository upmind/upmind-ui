// run-factory-composable.js — the scoped-composable lane, Research through Docs.
//
// ADR 006: a runner delegates its work to named skills and owns ONLY
// determinism. Every prompt below is a FIXED template carrying dispatch facts
// only. No prompt narrates a pipeline, restates a rubric, or approximates a
// skill: each seat invokes its own door and the door owns the work.
//
// Seat identity transport: `agentType` — the harness stamps it into every
// PreToolUse payload, and hooks/seat-guard.sh keys its lanes on it. Every
// dispatch also pins an explicit model: absent one, a seat inherits the live
// session's max-price model and loses its write-lane enforcement
// (rules/agent-orchestration.md §3, rules/agent-seat-separation.md).
//
// Shape: research -> plan -> code -> prove -> verify -> review -> document.
//   * Verify runs BEFORE Review and Docs: an ABSENT verdict must not reach
//     either, and the documenter takes the verdict as an input and may not
//     certify a capability the verifier did not confirm.
//   * The documenter never grades its own output — the docs-lane review is a
//     separate reviewer dispatch (rules/agent-seat-separation.md).
//   * Every repair is a FRESH developer dispatch, never the invocation that
//     produced the original diff: seat separation holds across a repair.
//
// Never invoked directly. `run-factory` dispatches it once the Stage-0 audit
// has graded the module M0-M2 and the door has settled mode and variant.
//
// args (strings, required unless noted):
//   id          — story ID or ad-hoc slug
//   worktree    — absolute path to the repo/worktree the seats work in
//   sddDir      — the story's SDD directory; research.md and review-notes.md live here
//   jtbd        — the run's binding termination condition, verbatim
//   module      — target module path
//   mode        — net-new | conversion | upgrade (settled by the door)
//   variant     — machine | query | hybrid (settled by the door)
//   cells       — the ADR-001 actor x context cells in scope
//   constraints — optional; run-scoped prohibitions, recorded verbatim
//   arms        — optional operator override of the Plan-stage arms derivation
export const meta = {
  name: "run-factory-composable",
  description:
    "The scoped-composable lane: research, spec, code, tests, verify, review, docs — one module to its Docs gate",
  phases: [
    {
      title: "Research",
      detail: "planner seat — oracle sweep, files research.md",
      model: "opus"
    },
    { title: "Plan", detail: "planner seat — invokes /plan", model: "opus" },
    {
      title: "Code",
      detail: "developer seat — invokes /code",
      model: "sonnet"
    },
    {
      title: "Prove",
      detail: "prover seat — invokes /test (public surface only)",
      model: "sonnet"
    },
    {
      title: "Verify",
      detail: "verifier seat — invokes /review verify lane",
      model: "opus"
    },
    {
      title: "Review",
      detail: "reviewer seat — invokes /review code lane (pre-gate)",
      model: "opus"
    },
    {
      title: "Document",
      detail: "documenter authors, reviewer grades the docs lane",
      model: "sonnet"
    }
  ]
};

const A = args || {};
for (const k of [
  "id",
  "worktree",
  "sddDir",
  "jtbd",
  "module",
  "mode",
  "variant",
  "cells"
]) {
  if (!A[k] || typeof A[k] !== "string")
    throw new Error(`factory-composable: missing required arg '${k}'`);
}
const { id, worktree, sddDir, jtbd, module: target, mode, variant, cells } = A;
const constraints =
  typeof A.constraints === "string" ? A.constraints : "none recorded";
const armsOverride = typeof A.arms === "string" ? A.arms : null;

// The 3-cycle cap (rules/agent-behavior.md §5). Bounded by construction: at most
// 1 + 1 + 1 + 1 + 3*2 + 3*2 + 3*2 + 1 + 3*2 = 29 agents, no unbounded
// accumulation. A fourth failure of the same behaviour escalates to the
// operator rather than cycling again.
const MAX_CYCLES = 3;

const FACTS = `Story: ${id}. Worktree: ${worktree}. Module: ${target}. Mode: ${mode}. Variant: ${variant}. Cells: ${cells}.`;

// Every seat brief states the JTBD verbatim and frames its gate field as
// EVIDENCE toward it — a seat whose output satisfies its gate field while
// visibly contradicting the JTBD must surface the contradiction, not return
// green (receipt: 2026-08-05 client-email — every gate green, JTBD failed).
const JTBD = `Run JTBD, verbatim — your gate field is evidence toward THIS, never the goal itself; output that satisfies your gate while contradicting it must surface the contradiction rather than return green: "${jtbd}".`;

// review-notes.md carries the operator rulings and binds at ADR level for this
// story (agent-behavior.companion.md §1). research.md is the Research stage's
// own filed output. Both are read, never re-derived.
const INPUTS = `Filed inputs in ${sddDir} — read before starting: review-notes.md (operator rulings, ADR-level, never silently overridden) and research.md (the Research stage's filed findings; read it instead of re-deriving it).`;
const BOUNDS = `Run constraints: ${constraints}`;

// Doctrine outranks any example or template it disagrees with; the
// disagreement is surfaced as a finding, never silently resolved toward a
// template (code-composables.companion.md, precedence correction).
const DOCTRINE = `Where doctrine and a template or worked example disagree, doctrine wins and you surface the disagreement as a finding rather than resolving it toward the template.`;

const GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    blockers: { type: "array", items: { type: "string" } }
  },
  required: ["pass", "summary"]
};

// Research additionally returns the variant it derived from the oracle's
// composable shapes. A mismatch against an operator `variant=` is a halt with
// both shown (receipt: 2026-08-05 client-email — `variant=query` against an
// oracle shipping a manager amputated the entire manager surface).
const RESEARCH_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    genericCitations: { type: "number" },
    oracleCitations: { type: "number" },
    researchFiled: { type: "boolean" },
    derivedVariant: { type: "string" }
  },
  required: [
    "pass",
    "summary",
    "genericCitations",
    "oracleCitations",
    "researchFiled"
  ]
};

const PLAN_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    sddSetComplete: { type: "boolean" },
    undispositionedCells: { type: "number" },
    armsPresent: { type: "boolean" },
    jtbdContradictedDrops: { type: "number" }
  },
  required: [
    "pass",
    "summary",
    "sddSetComplete",
    "undispositionedCells",
    "armsPresent",
    "jtbdContradictedDrops"
  ]
};

// Code: the developer re-derives the arms determination independently from the
// landed parity table, never by trusting the recorded block. A mismatch is a
// gate failure surfaced with BOTH determinations shown, never a silent pick
// (rules/agent-behavior.md §1 — contradiction escalates).
const CODE_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    diffFileCount: { type: "number" },
    handOffFiled: { type: "boolean" },
    buildExit: { type: "number" },
    armsMismatch: { type: "boolean" },
    armsDerived: { type: "string" },
    armsRecorded: { type: "string" }
  },
  required: ["pass", "summary", "diffFileCount", "handOffFiled", "buildExit"]
};

// Tests: a no-boundary determination on the integration branch is a RECORDED
// field, never a silent skip.
const TESTS_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    suiteExit: { type: "number" },
    buildExit: { type: "number" },
    noBoundaryDetermination: { type: "string" }
  },
  required: ["pass", "summary", "suiteExit", "buildExit"]
};

// Verify: a binary PRESENT/ABSENT, not a pass flag.
const VERDICT_GATE = {
  type: "object",
  properties: {
    verdict: { type: "string" },
    summary: { type: "string" },
    negativeControlsGreen: { type: "boolean" }
  },
  required: ["verdict", "summary"]
};

// Review: pass-and-surface — a deviation carrying a complete @decision is not a
// blocker; it passes and the run reports it rather than absorbing it silently.
const REVIEW_GATE = {
  type: "object",
  properties: {
    blockerCount: { type: "number" },
    summary: { type: "string" },
    surfacedDecisions: { type: "array", items: { type: "string" } }
  },
  required: ["blockerCount", "summary"]
};

const DOCS_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    score: { type: "number" },
    missingArtefacts: { type: "number" }
  },
  required: ["pass", "summary", "missingArtefacts"]
};

const results = { id, stopped: null, cycles: {}, surfaced: [] };

// --- Research -------------------------------------------------------------------
// Files research.md BEFORE returning its fields: a returned field is not a
// record, and a session lost between Research and Plan used to lose the whole
// oracle sweep.
phase("Research");
results.research = await agent(
  `Run the Research stage for story ${id}. ${FACTS} ${JTBD} ${BOUNDS} ${DOCTRINE} Sweep the knowledge graph and the docs corpus (glossary + docs/reference/), then the ${mode} oracle — for a conversion, wherever the existing implementation lives, the current headless module and/or the legacy surface being ported; for net-new, the closest legacy-parity analogue. Inventory the oracle's composable shapes (query collection / dataManager-machine manager / bespoke machine) and derive the variant from them. Write your findings to ${sddDir}/research.md BEFORE returning: the oracle capability inventory with file:line receipts, the composable-shape inventory and the variant it derives, the criteria surface, the precedent modules, and every question you cannot close. Then return your gate fields.`,
  {
    agentType: "upmind-agent:planner",
    model: "opus",
    phase: "Research",
    schema: RESEARCH_GATE,
    label: `research:${id}`
  }
);
if (!results.research) {
  results.stopped = "research-failed";
  return results;
}
if (
  !(results.research.genericCitations > 0) ||
  !(results.research.oracleCitations > 0)
) {
  results.stopped = "research-citations";
  return results;
}
if (!results.research.researchFiled) {
  results.stopped = "research-unfiled";
  return results;
}
// Derivation vs operator override: halt with BOTH shown, never a silent pick.
const derivedVariant = results.research.derivedVariant;
if (derivedVariant && derivedVariant !== variant) {
  results.stopped = "variant-mismatch";
  results.determinations = { override: variant, derived: derivedVariant };
  return results;
}

// --- Plan -----------------------------------------------------------------------
// conversion/net-new run the FULL-depth SDD route: a ported or net-new module is
// never trivial, so the light plan route is not an option. `upgrade` dispatches
// /plan BARE and inherits whatever depth that door picks for the drift — the
// factory does not second-guess it.
phase("Plan");
const PLAN_DEPTH =
  mode === "upgrade"
    ? "Invoke it BARE — that door owns the light-vs-full depth decision for a gap-closure. Scope the work to exactly the audited drift; the gates are unchanged, because a gap-closure over a landed module is precisely where silent capability drops hide."
    : "Run its FULL-depth SDD route (requirements -> design -> BDD -> tasks). The depth is already derived; do not re-derive it and do not run the light route. A lone design.md is not acceptable output.";
const ARMS = armsOverride
  ? ` Operator arms override, in force over your own derivation: ${armsOverride}.`
  : " Derive the arms determination per layer — services, actions, context, meta, schemas — from the parity table and the research oracle; it is never asked. Each layer is `none` or its earning actors, and every earned arm cites the parity row that earns it.";
results.plan = await agent(
  `Invoke /upmind-agent:plan for story ${id}. ${PLAN_DEPTH} ${FACTS} ${JTBD} ${INPUTS} ${BOUNDS} ${DOCTRINE}${ARMS} The co-located <module>.feature belongs in the module's __tests__/ at capability altitude — one scenario per actor x context behaviour the parity table carries, in actor/business language, never a per-mapper unit and never a vague "it works". It is the coverage contract for both the developer and the prover. Write only under ${sddDir} and the module's __tests__/; write no module source.`,
  {
    agentType: "upmind-agent:planner",
    model: "opus",
    phase: "Plan",
    schema: PLAN_GATE,
    label: `plan:${id}`
  }
);
if (!results.plan) {
  results.stopped = "plan-failed";
  return results;
}
if (!results.plan.sddSetComplete) {
  results.stopped = "plan-set-incomplete";
  return results;
}
if (results.plan.undispositionedCells !== 0) {
  results.stopped = "plan-cells-undispositioned";
  return results;
}
if (!results.plan.armsPresent) {
  results.stopped = "plan-arms-absent";
  return results;
}
// A disposition row is paperwork, not permission: a drop the JTBD forbids is a
// gate FAIL and an operator escalation (receipt: client-email R17, 2026-08-05).
if (results.plan.jtbdContradictedDrops !== 0) {
  results.stopped = "plan-jtbd-contradicted";
  return results;
}

// --- Code -------------------------------------------------------------------------
// The full monorepo build is part of this gate: everything builds or the run
// halts, never scoped down (receipt: 2026-08-14 — a criteria-less module shipped
// through five green gates because no gate built anything).
phase("Code");
results.code = await agent(
  `Invoke /upmind-agent:code for story ${id}. ${FACTS} ${JTBD} ${INPUTS} ${BOUNDS} ${DOCTRINE} Spec: ${sddDir}. Scaffold from the ${variant} template set. THREE things bind this stage. (1) Re-derive the arms determination independently from the landed parity table against the variance-law clauses themselves — never by trusting the recorded block; report armsMismatch with both determinations if they differ, and stop. (2) The scope block comes from the ORACLE, never the template's placeholder enum: where the oracle names entities the actor may act for, mint the context enum and matrix from exactly those; where it names none and the composable reads one record by id, mint NO context enum and an all-never item matrix you still pass as TMatrix; where it names none and it is not a single-record read, STOP and ask the operator rather than minting a context type to fill the slot. A minted context with no oracle behind it is a claimed capability that does not exist. (3) The criteria schema owns ALL request state — filters, sort, pagination, limit — and every one reaches the wire only through list({ criteria: { schema } }); a hand-rolled filter ref, a filter[...] string or a raw sort/limit literal beside the channel is a defect here. File the public-surface hand-off for the prover. Run the FULL monorepo build and report its exit code. Work only in the worktree. Commit as you go.`,
  {
    agentType: "upmind-agent:developer",
    model: "sonnet",
    phase: "Code",
    schema: CODE_GATE,
    label: `code:${id}`
  }
);
if (!results.code) {
  results.stopped = "code-failed";
  return results;
}
if (results.code.armsMismatch) {
  results.stopped = "arms-mismatch";
  results.determinations = {
    derived: results.code.armsDerived,
    recorded: results.code.armsRecorded
  };
  return results;
}
if (!(results.code.diffFileCount > 0)) {
  results.stopped = "code-empty-diff";
  return results;
}
if (!results.code.handOffFiled) {
  results.stopped = "code-handoff-unfiled";
  return results;
}
if (results.code.buildExit !== 0) {
  results.stopped = "build-red";
  return results;
}

// --- Prove ---------------------------------------------------------------------------
// Contract-fed: the diff and the builder's hand-off report are WITHHELD from the
// prover (ADR-029, rules/agent-seat-separation.md). A legitimately-red test is
// not a run halt — it routes back to the developer as a FRESH dispatch.
//
// Negative controls: the DEVELOPER authors each *.must-fail.patch — it knows the
// mutated line, and mutating source is not a test assertion, so it neither
// self-certifies nor grades. The PROVER applies it blind, confirms RED, reverts.
// Author-of-mutation != verifier-of-red.
phase("Prove");
results.proofs = [];
results.prove = await agent(
  `Invoke /upmind-agent:test for story ${id}. ${FACTS} ${JTBD} ${BOUNDS} ${DOCTRINE} Inputs: ${sddDir}/design.md, the co-located .feature, the parity table, and the exported public surface only — the diff and the builder's hand-off are withheld from you. Unit and integration only; this lane never routes a behaviour to e2e. Anchor every test to a scenario in the feature; an unmapped test means the feature gains the missing scenario, never that the test is dropped. Apply each developer-authored .must-fail.patch blind, confirm the intended assertion goes RED, then revert — never read implementation source to construct one. Report the suite exit code, the full monorepo build's exit code, and any no-boundary determination as a recorded field rather than a silent skip.`,
  {
    agentType: "upmind-agent:prover",
    model: "sonnet",
    phase: "Prove",
    schema: TESTS_GATE,
    label: `prove:${id}`
  }
);
if (!results.prove) {
  results.stopped = "prover-failed";
  return results;
}

for (
  let cycle = 1;
  cycle <= MAX_CYCLES &&
  (results.prove.suiteExit !== 0 || results.prove.buildExit !== 0);
  cycle++
) {
  results.cycles.prove = cycle;
  log(
    `factory-composable ${id}: suite or build red, cycle ${cycle} — developer repairing`
  );

  const fixed = await agent(
    `Invoke /upmind-agent:code for story ${id}. ${FACTS} ${BOUNDS} ${DOCTRINE} The authored tests or the build are red. Fix the SOURCE, not the tests. Where a fixed or newly-armed behaviour needs a fresh negative control, author the .must-fail.patch yourself — you know the mutated line. Re-run the suite and the full monorepo build, then commit:\n\n${results.prove.summary}`,
    {
      agentType: "upmind-agent:developer",
      model: "sonnet",
      phase: "Prove",
      schema: GATE,
      label: `fix-prove:${id}#${cycle}`
    }
  );
  if (!fixed) {
    results.stopped = "developer-failed";
    return results;
  }
  results.prove = await agent(
    `Invoke /upmind-agent:test for story ${id} in RE-RUN mode. ${FACTS} ${BOUNDS} Re-run the suite you authored and the full monorepo build, and verify any new mutant goes RED blind. Report every exit code. Do not read the diff.`,
    {
      agentType: "upmind-agent:prover",
      model: "sonnet",
      phase: "Prove",
      schema: TESTS_GATE,
      label: `reprove:${id}#${cycle}`
    }
  );
  results.proofs.push({ cycle, verdict: results.prove });
  if (!results.prove) {
    results.stopped = "prover-failed";
    return results;
  }
  if (
    (results.prove.suiteExit !== 0 || results.prove.buildExit !== 0) &&
    cycle === MAX_CYCLES
  ) {
    results.stopped = "suite-red";
    return results;
  }
}

// --- Verify (U7) ---------------------------------------------------------------------
// A binary PRESENT/ABSENT on whether the capability the JTBD names actually
// landed — measured against the ORACLE, never only the parity table's own
// self-declared in-scope list. ABSENT does not advance to Review or Docs.
//
// This is a DELIVERY check only: it neither runs the variance-law lint nor
// judges a clause. That is the Review gate's job.
phase("Verify");
results.verifies = [];
for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
  results.cycles.verify = cycle;

  const verdict = await agent(
    `Invoke /upmind-agent:review (verify lane) for story ${id}. ${FACTS} ${JTBD} ${INPUTS} ${BOUNDS} Grade the JTBD's surface against the oracle — for a conversion, every composable surface of the implementation being replaced — never only the parity table's in-scope list. Where the run's diff touches __tests__/fixtures/, re-capture against the real system yourself and compare structurally (keys, shapes, enums — not volatile values); a stored receipt is forgeable and is not evidence, only the live re-capture is. Return verdict PRESENT or ABSENT, and whether every new negative control ran green.`,
    {
      agentType: "upmind-agent:verifier",
      model: "opus",
      phase: "Verify",
      schema: VERDICT_GATE,
      label: `verify:${id}#${cycle}`
    }
  );
  results.verifies.push({ cycle, verdict });

  if (!verdict) {
    results.stopped = "verify-failed";
    return results;
  }
  if (verdict.verdict === "PRESENT" && verdict.negativeControlsGreen !== false)
    break;
  if (cycle === MAX_CYCLES) {
    results.stopped = "verify-absent";
    return results;
  }

  log(
    `factory-composable ${id}: verify cycle ${cycle} ABSENT — developer landing the gap`
  );
  const fixed = await agent(
    `Invoke /upmind-agent:code for story ${id}. ${FACTS} ${BOUNDS} ${DOCTRINE} The verifier found the capability ABSENT. Land the missing load-bearing part verbatim as named, green the suite and the full monorepo build, then commit:\n\n${verdict.summary}`,
    {
      agentType: "upmind-agent:developer",
      model: "sonnet",
      phase: "Verify",
      label: `fix-verify:${id}#${cycle}`
    }
  );
  if (fixed === null) {
    results.stopped = "developer-failed";
    return results;
  }
}

// --- Review pre-gate -------------------------------------------------------------------
// Holds the built module to the variance law. The decidable clauses are already
// mechanically enforced by the standing scope-based ESLint plugin via pnpm lint;
// this gate owns what stays judgement — return-shape uniformity, override
// quality, @decision quality. The reviewer may BLOCK; it never emits the
// approval verdict (ADR-029).
phase("Review");
results.reviews = [];
for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
  results.cycles.review = cycle;

  const verdict = await agent(
    `Invoke /upmind-agent:review (code lane) over the diff for story ${id}. ${FACTS} ${INPUTS} ${BOUNDS} Hold the module to the variance law. A deviation carrying a complete @decision (what / why / rejected) is NOT a blocker — pass it and return it in surfacedDecisions so the run reports it rather than absorbing it silently. An override whose body is byte-equal to the shared implementation IS a blocker: it claims to override and delivers nothing. A conversion target's pre-existing unscoped structure is advisory, never a blocker, until this diff adds or modifies scoped structure. Return the blocker count. File findings; emit no approval verdict.`,
    {
      agentType: "upmind-agent:reviewer",
      model: "opus",
      phase: "Review",
      schema: REVIEW_GATE,
      label: `review:${id}#${cycle}`
    }
  );
  results.reviews.push({ cycle, verdict });

  if (!verdict) {
    results.stopped = "review-failed";
    return results;
  }
  if (Array.isArray(verdict.surfacedDecisions))
    results.surfaced.push(...verdict.surfacedDecisions);
  if (verdict.blockerCount === 0) break;
  if (cycle === MAX_CYCLES) {
    results.stopped = "reviewer-blocked";
    return results;
  }

  log(
    `factory-composable ${id}: review cycle ${cycle} blocked — developer fixing`
  );
  const fixed = await agent(
    `Invoke /upmind-agent:code for story ${id}. ${FACTS} ${BOUNDS} ${DOCTRINE} The diff was reviewed and blocked. Fix these findings, green the suite and the full monorepo build, then commit. A tolerated exception is an in-place native eslint-disable line carrying its reason, never a loosened rule:\n\n${verdict.summary}`,
    {
      agentType: "upmind-agent:developer",
      model: "sonnet",
      phase: "Review",
      label: `fix-review:${id}#${cycle}`
    }
  );
  if (fixed === null) {
    results.stopped = "developer-failed";
    return results;
  }
}

// --- Document -----------------------------------------------------------------------------
// After Verify, deliberately: the documenter takes the verifier's verdict as an
// input and refuses to certify a capability not returned PRESENT. The docs-lane
// grade is a SEPARATE reviewer dispatch — an author never grades its own output
// (rules/agent-seat-separation.md).
phase("Document");
results.document = await agent(
  `Invoke /upmind-agent:docs for story ${id}. ${FACTS} ${INPUTS} ${BOUNDS} ${DOCTRINE} The verifier returned PRESENT; do not describe as delivered anything it did not confirm. Generate the module's full documentation set and report how many required artefacts are still missing. Commit.`,
  {
    agentType: "upmind-agent:documenter",
    model: "sonnet",
    phase: "Document",
    schema: DOCS_GATE,
    label: `document:${id}`
  }
);
if (!results.document) {
  results.stopped = "documenter-failed";
  return results;
}
if (results.document.missingArtefacts !== 0) {
  results.stopped = "docs-artefacts-missing";
  return results;
}

results.docsReviews = [];
for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
  results.cycles.docsReview = cycle;

  const verdict = await agent(
    `Invoke /upmind-agent:review (docs lane) over the documentation set for story ${id}. ${FACTS} ${INPUTS} ${BOUNDS} Pass = a score of at least 85 out of 100 with zero blockers and zero warnings. Report the score and the count of required artefacts still missing. File findings; emit no approval verdict.`,
    {
      agentType: "upmind-agent:reviewer",
      model: "opus",
      phase: "Document",
      schema: DOCS_GATE,
      label: `docs-review:${id}#${cycle}`
    }
  );
  results.docsReviews.push({ cycle, verdict });

  if (!verdict) {
    results.stopped = "docs-review-failed";
    return results;
  }
  if (verdict.pass && verdict.score >= 85 && verdict.missingArtefacts === 0)
    break;
  if (cycle === MAX_CYCLES) {
    results.stopped = "docs-blocked";
    return results;
  }

  log(
    `factory-composable ${id}: docs review cycle ${cycle} blocked — documenter revising`
  );
  const revised = await agent(
    `Invoke /upmind-agent:docs for story ${id} in REVISE mode. ${FACTS} ${BOUNDS} The documentation set was graded and blocked. Fold in every finding AND every suggestion — the gate requires zero warnings and every suggestion implemented — then commit:\n\n${verdict.summary}`,
    {
      agentType: "upmind-agent:documenter",
      model: "sonnet",
      phase: "Document",
      label: `redocument:${id}#${cycle}`
    }
  );
  if (revised === null) {
    results.stopped = "documenter-failed";
    return results;
  }
}

return results;
