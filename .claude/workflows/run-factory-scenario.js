// factory-scenario.js — the playground lane: one module's driveable page.
//
// ADR 006: a runner delegates its work to named skills and owns ONLY
// determinism. Every prompt below is a FIXED template carrying dispatch facts
// only — the story ID, the worktree, the module. No prompt narrates a pipeline,
// restates a rubric, or approximates a skill: each seat invokes its own door
// and the door owns the work.
//
// Seat identity transport: `agentType` — the harness stamps it into every
// PreToolUse payload, and hooks/seat-guard.sh keys its lanes on it.
//
// Shape: derive -> code -> prove -> verify -> review. No Docs stage,
// deliberately: the declaration is its own documentation surface, and the
// module doc set belongs to the composable lane.
//
// Never invoked directly. `run-factory` dispatches it only after the ordering
// gate — the composable lane's Docs gate green AND a conformance re-grade
// returning drift 0 — because this lane derives from the LANDED module.
//
// args (strings, required unless noted):
//   id        — story ID or ad-hoc slug
//   worktree  — absolute path to the repo/worktree the seats work in
//   sddDir    — the story's SDD directory; research.md and review-notes.md live here
//   jtbd      — the run's binding termination condition, verbatim
//   module    — the LANDED module the page derives from
//   constraints — optional; run-scoped prohibitions, recorded verbatim
export const meta = {
  name: "run-factory-scenario",
  description:
    "The playground lane: derive a driveable page from a landed module, prove it, verify a hand can drive it",
  phases: [
    {
      title: "Derive",
      detail: "planner seat — fills the derivation table off the landed module",
      model: "opus"
    },
    {
      title: "Code",
      detail: "developer seat — invokes /code with the scenario templates",
      model: "sonnet"
    },
    {
      title: "Test review",
      detail: "pseudo-nathan grades the authored tests",
      model: "opus"
    },
    {
      title: "Prove",
      detail: "prover seat — step catalog, replay spec, traceability test",
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
    }
  ]
};

const A = args || {};
for (const k of ["id", "worktree", "sddDir", "jtbd", "module"]) {
  if (!A[k] || typeof A[k] !== "string")
    throw new Error(`factory-scenario: missing required arg '${k}'`);
}
const { id, worktree, sddDir, jtbd, module: target } = A;
const constraints =
  typeof A.constraints === "string" ? A.constraints : "none recorded";

// The 3-cycle cap (rules/agent-behavior.md). Bounded by construction: at most
// 1 + 1 + 1 + 3*2 + 3*2 + 3*2 = 21 agents, no unbounded accumulation.
const MAX_CYCLES = 3;

const FACTS = `Story: ${id}. Worktree: ${worktree}. Module: ${target}.`;
const JTBD = `Run JTBD, verbatim — your gate field is evidence toward THIS, never the goal itself; output that satisfies your gate while contradicting it must surface the contradiction rather than return green: "${jtbd}".`;
const INPUTS = `Filed inputs in ${sddDir} — read before starting: review-notes.md (operator rulings, ADR-level, never silently overridden), research.md and audit.md.`;
const BOUNDS = `Run constraints: ${constraints}`;

// D14/D15/D16: an absent criteria channel, sort member or pagination descriptor
// is a HALT back to the door for an M2 regrade — never derived around. A page
// built over a hole proves a capability the module does not have.
const HALT_TO_DOOR =
  "If the landed module has no criteria schema pair, no sort member, or no pagination descriptor, HALT and say so — that is a module gap for the composable lane, never something to derive around or absorb as a surfaced decision.";

const GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    blockers: { type: "array", items: { type: "string" } }
  },
  required: ["pass", "summary"]
};

const DERIVE_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    undecidedFields: { type: "number" },
    moduleGap: { type: "boolean" }
  },
  required: ["pass", "summary", "undecidedFields"]
};

// Code: the declaration's public surface is filed as the prover's hand-off; the
// diff is withheld from it (ADR-029).
const CODE_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    diffFileCount: { type: "number" },
    handOffFiled: { type: "boolean" },
    buildExit: { type: "number" }
  },
  required: ["pass", "summary", "diffFileCount", "handOffFiled", "buildExit"]
};

// Tests: the REPLAY spec is the red gate, not a report. A wrong meta flag, a
// wrong action id and a do-nothing step all TRACE perfectly and have never been
// run; only an execution sees them. A SKIP is correct — that is a spec-only
// contract scenario by design. A RED is a halt.
const TESTS_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    suiteExit: { type: "number" },
    buildExit: { type: "number" },
    replayGreen: { type: "boolean" },
    traceabilityGreen: { type: "boolean" },
    mutantsProvenRed: { type: "boolean" }
  },
  required: [
    "pass",
    "summary",
    "suiteExit",
    "buildExit",
    "replayGreen",
    "traceabilityGreen"
  ]
};

// Verify: a binary PRESENT/ABSENT, not a pass flag.
const VERDICT_GATE = {
  type: "object",
  properties: {
    verdict: { type: "string" },
    summary: { type: "string" },
    moduleGap: { type: "boolean" }
  },
  required: ["verdict", "summary"]
};

const REVIEW_GATE = {
  type: "object",
  properties: {
    blockerCount: { type: "number" },
    summary: { type: "string" },
    surfacedDecisions: { type: "array", items: { type: "string" } }
  },
  required: ["blockerCount", "summary"]
};

// Test review: the test oracle grades what the prover ACTUALLY authored, before
// any green cycle is spent on it. Blockers route to the PROVER — test
// authorship is its lane, never the developer's.
const TEST_REVIEW_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    blockers: { type: "array", items: { type: "string" } }
  },
  required: ["pass", "summary"]
};

const results = { id, stopped: null, cycles: {}, surfaced: [] };

// --- Derive -----------------------------------------------------------------------
// Every derived row carries a file:line in the LANDED module. A derivation over
// a promised module is a guess, which is why the door gates this lane behind a
// drift-0 re-grade.
phase("Derive");
results.derive = await agent(
  `Invoke /upmind-agent:plan (light route) for the playground declaration of story ${id}. ${FACTS} ${JTBD} ${INPUTS} ${BOUNDS} Fill the scenario lane's derivation table off the LANDED module — every row cited with a file:line in that module, none invented. Resolve the icon from the module's subject against the published lucide set; an unreplaced placeholder is a red gate. ${HALT_TO_DOOR}`,
  {
    agentType: "upmind-agent:planner",
    model: "opus",
    phase: "Derive",
    schema: DERIVE_GATE,
    label: `derive:${id}`
  }
);
if (!results.derive) {
  results.stopped = "derive-failed";
  return results;
}
// A module gap is the composable lane's work. Hand it back to the door rather
// than landing a page around the hole (receipt: 2026-08-14 client-email-history).
if (results.derive.moduleGap) {
  results.stopped = "module-gap";
  return results;
}
if (results.derive.undecidedFields !== 0) {
  results.stopped = "derive-undecided";
  return results;
}

// --- Code -------------------------------------------------------------------------
phase("Code");
results.code = await agent(
  `Invoke /upmind-agent:code for the playground declaration of story ${id}. ${FACTS} ${JTBD} ${INPUTS} ${BOUNDS} Author the scenario directory from this lane's templates against the filled derivation table. Author the negative-control mutant patches yourself — you know the mutated line; the prover applies them blind. File the declaration's public surface as the hand-off for the prover; withhold the diff. Run the FULL monorepo build and report its exit code. Commit.`,
  {
    agentType: "upmind-agent:developer",
    model: "sonnet",
    phase: "Code",
    schema: CODE_GATE,
    label: `scenario-code:${id}`
  }
);
if (!results.code) {
  results.stopped = "code-failed";
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
// The replay spec is the RED gate here, not a report: a wrong meta flag, a wrong
// action id and a do-nothing step all TRACE perfectly and have never been run.
// Only an execution sees them.
phase("Prove");
results.proofs = [];
results.prove = await agent(
  `Invoke /upmind-agent:test for the playground declaration of story ${id}. ${FACTS} ${JTBD} ${BOUNDS} Inputs: the declaration's public surface, the module's own .feature and its exported types only — the diff and the hand-off report are withheld. Author the step catalog, its one replay spec and its one traceability test together, over the module's recorded corpus through the shared replay. A scenario is a track only when a real step drives every line of it; a scenario nothing can drive stays spec and gets no steps. Apply each mutant patch blind, confirm the intended assertion goes RED, revert. Report the suite exit code per layer, the replay result, and the full monorepo build's exit code.`,
  {
    agentType: "upmind-agent:prover",
    model: "sonnet",
    phase: "Prove",
    schema: TESTS_GATE,
    label: `scenario-prove:${id}`
  }
);
if (!results.prove) {
  results.stopped = "prover-failed";
  return results;
}

const proveGreen = () =>
  results.prove.suiteExit === 0 &&
  results.prove.buildExit === 0 &&
  results.prove.replayGreen === true &&
  results.prove.traceabilityGreen === true &&
  results.prove.mutantsProvenRed !== false;

// --- Test review ------------------------------------------------------------
// Runs BEFORE the green loop, deliberately: a bad test caught here costs one
// prover revision; caught after, it costs the developer a wasted repair cycle
// chasing an assertion that was wrong to begin with. The oracle judges
// test-layer fit, scenario quality, and whether each test proves CAPABILITY
// rather than shape. It files findings and emits no approval verdict.
results.testReviews = [];
for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
  results.cycles.testReview = cycle;

  const verdict = await agent(
    `Review the tests authored for story ${id}. ${FACTS} ${JTBD} ${BOUNDS} Inputs: the step catalog, the replay spec, the traceability test and the module's own .feature only — the diff is withheld from you. A step that fires no real action id and presses no real control is FAKE; say so. Judge test-layer fit, scenario quality, and whether each test proves capability rather than shape. Pass = no blocker. File findings; emit no approval verdict.`,
    {
      agentType: "upmind-agent:pseudo-nathan",
      model: "opus",
      phase: "Test review",
      schema: TEST_REVIEW_GATE,
      label: `test-review:${id}#${cycle}`
    }
  );
  results.testReviews.push({ cycle, verdict });

  if (!verdict) {
    results.stopped = "test-review-failed";
    return results;
  }
  if (verdict.pass) break;
  if (cycle === MAX_CYCLES) {
    results.stopped = "test-review-blocked";
    return results;
  }

  log(
    `factory-scenario ${id}: test review cycle ${cycle} blocked — prover revising`
  );
  const revised = await agent(
    `Invoke /upmind-agent:test for story ${id} in REVISE mode. ${FACTS} ${BOUNDS} The tests you authored were graded and blocked. Fix them, then stop. Do not read the diff:\n\n${verdict.summary}`,
    {
      agentType: "upmind-agent:prover",
      model: "sonnet",
      phase: "Test review",
      label: `retest:${id}#${cycle}`
    }
  );
  if (revised === null) {
    results.stopped = "prover-failed";
    return results;
  }
}

for (let cycle = 1; cycle <= MAX_CYCLES && !proveGreen(); cycle++) {
  results.cycles.prove = cycle;
  log(
    `factory-scenario ${id}: suite red, cycle ${cycle} — developer repairing`
  );

  const fixed = await agent(
    `Invoke /upmind-agent:code for the playground declaration of story ${id}. ${FACTS} ${BOUNDS} The authored specs are red. Fix the declaration, never the assertions. A red that names an absent module capability is a module gap — say so rather than loosening the step. Re-run the suite and the full monorepo build, then commit:\n\n${results.prove.summary}`,
    {
      agentType: "upmind-agent:developer",
      model: "sonnet",
      phase: "Prove",
      schema: GATE,
      label: `fix-scenario-prove:${id}#${cycle}`
    }
  );
  if (!fixed) {
    results.stopped = "developer-failed";
    return results;
  }
  results.prove = await agent(
    `Invoke /upmind-agent:test for the playground declaration of story ${id} in RE-RUN mode. ${FACTS} ${BOUNDS} Re-run the catalog, the replay spec, the traceability test and the full monorepo build. Report every exit code. Do not read the diff.`,
    {
      agentType: "upmind-agent:prover",
      model: "sonnet",
      phase: "Prove",
      schema: TESTS_GATE,
      label: `re-scenario-prove:${id}#${cycle}`
    }
  );
  results.proofs.push({ cycle, verdict: results.prove });
  if (!results.prove) {
    results.stopped = "prover-failed";
    return results;
  }
  if (!proveGreen() && cycle === MAX_CYCLES) {
    results.stopped = "suite-red";
    return results;
  }
}

// --- Verify -----------------------------------------------------------------------------
// Measured against the MODULE'S ORACLE surface, never the declaration's
// self-report. A page that draws rows but cannot filter, sort or page what the
// oracle offers is ABSENT.
phase("Verify");
results.verifies = [];
for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
  results.cycles.verify = cycle;

  const verdict = await agent(
    `Invoke /upmind-agent:review (verify lane) over the playground page for story ${id}. ${FACTS} Bind to the CURRENT HEAD of the working branch — on a re-verify after a repair, grade the repaired commit, never the one you graded last cycle. ${JTBD} ${INPUTS} ${BOUNDS} Pass = the page boots and draws at every offered cell, its filter bar, sort control and pager render off the module's own criteria and pagination channels, and every drawn control presses a live member. Grade against the module's oracle surface, never the declaration's self-report.`,
    {
      agentType: "upmind-agent:verifier",
      model: "opus",
      phase: "Verify",
      schema: VERDICT_GATE,
      label: `scenario-verify:${id}#${cycle}`
    }
  );
  results.verifies.push({ cycle, verdict });

  if (!verdict) {
    results.stopped = "verify-failed";
    return results;
  }
  // A gap in the MODULE is the composable lane's work, handed back to the door
  // rather than patched around in the page.
  if (verdict.moduleGap) {
    results.stopped = "module-gap";
    return results;
  }
  if (verdict.verdict === "PRESENT") break;
  if (cycle === MAX_CYCLES) {
    results.stopped = "verify-absent";
    return results;
  }

  log(
    `factory-scenario ${id}: verify cycle ${cycle} ABSENT — developer landing the gap`
  );
  const fixed = await agent(
    `Invoke /upmind-agent:code for the playground declaration of story ${id}. ${FACTS} ${BOUNDS} The verifier found the page's capability ABSENT. Land it verbatim as named, green the suite and the full monorepo build, then commit. If what is missing is the MODULE's capability rather than the page's, say so and stop:\n\n${verdict.summary}`,
    {
      agentType: "upmind-agent:developer",
      model: "sonnet",
      phase: "Verify",
      label: `fix-scenario-verify:${id}#${cycle}`
    }
  );
  if (fixed === null) {
    results.stopped = "developer-failed";
    return results;
  }
}

// --- Review pre-gate -----------------------------------------------------------------------
phase("Review");
results.reviews = [];
for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
  results.cycles.review = cycle;

  const verdict = await agent(
    `Invoke /upmind-agent:review (code lane) over the playground diff for story ${id}. ${FACTS} ${INPUTS} ${BOUNDS} Pass = no blocker. File findings; emit no approval verdict.`,
    {
      agentType: "upmind-agent:reviewer",
      model: "opus",
      phase: "Review",
      schema: REVIEW_GATE,
      label: `scenario-review:${id}#${cycle}`
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
    `factory-scenario ${id}: review cycle ${cycle} blocked — developer fixing`
  );
  const fixed = await agent(
    `Invoke /upmind-agent:code for the playground declaration of story ${id}. ${FACTS} ${BOUNDS} The diff was reviewed and blocked. Fix these findings, green the suite and the full monorepo build, then commit:\n\n${verdict.summary}`,
    {
      agentType: "upmind-agent:developer",
      model: "sonnet",
      phase: "Review",
      label: `fix-scenario-review:${id}#${cycle}`
    }
  );
  if (fixed === null) {
    results.stopped = "developer-failed";
    return results;
  }
}

return results;
