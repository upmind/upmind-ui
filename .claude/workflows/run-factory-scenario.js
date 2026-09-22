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
// Shape: ordering gate -> derive -> code -> prove -> verify -> review ->
// readback. No Docs stage, deliberately: the declaration is its own
// documentation surface, and the module doc set belongs to the composable lane.
//
// The `/factory` door dispatches it directly, after the composable lane (or
// straight after the audit at M3). This lane derives from the LANDED module, so
// it OPENS with the ordering gate — a fresh conformance re-grade that must
// return drift 0 — and CLOSES with the terminal JTBD readback. Both used to
// live in a parent `run-factory` runner; the harness nests workflow() one
// level only, so the parent is retired and the two gates live here as code.
//
// THE LANE CALLS THE PLUGIN'S WORKFLOWS; IT DOES NOT RE-IMPLEMENT THEM
// (operator ruling 2026-09-22; the FE-3029 receipt in run-factory-composable.js
// applies here verbatim — this lane's test-review prompt was the same
// byte-identical-every-cycle prompt). Stage by stage (each decision is recorded
// again at the stage):
//   * Prove + Test review -> `upmind-agent:run-test` (calls it)
//   * Ordering gate, Derive, Code, Readback -> stay lane-local: each is ONE
//     seat with a MECHANICAL gate (a drift count, an undecided-field count, exit
//     codes, a filed table) and no reviewer, so the exhaustive-review law has
//     no loop to bind, and no plugin workflow exposes that single step bare
//     (run-audit files a survey and pre-gates it; the door already ran it at
//     Stage 0 — the ordering gate only re-confirms drift 0 on the LANDED module).
//   * Verify, Review -> stay lane-local: the plugin has no standalone verify or
//     code-review workflow (run-build's loops are inseparable from its Ship
//     step), and their gate fields are the factory's (PRESENT/ABSENT with
//     `moduleGap`, pass-and-surface). Both obey the same law as the plugin
//     loops: the whole verdict travels to the repair, cycle 2+ is a
//     DIFFERENTIAL, and the differential is ENFORCED in code — see
//     `applyDifferential`.
//
// THE DIFFERENTIAL, ENFORCED (rules/code-reviews.md, the exhaustive-review law,
// clause 3; operator ruling 2026-09-22). Cycle 2 and later judge ONLY the
// repair against the previous cycle's full findings list. A finding that is
// neither on that list nor introduced by the repair is a NOTE, never a
// blocker. The reviewer's prompt states it, and the loop enforces it: on cycle
// 2+ every blocker and warning returned is intersected with the previous list
// plus `introducedByRepair`; anything outside that set is recorded in
// `results.surfaced` and does not gate.
//
// args (strings, required unless noted):
//   id        — story ID or ad-hoc slug
//   worktree  — absolute path to the repo/worktree the seats work in
//   sddDir    — the story's SDD directory; research.md and review-notes.md live here
//   jtbd      — the run's binding termination condition, verbatim
//   module    — the LANDED module the page derives from
//   cells     — optional; the ADR-001 actor x context cells, for the re-grade and readback briefs
//   constraints — optional; run-scoped prohibitions, recorded verbatim
export const meta = {
  name: "run-factory-scenario",
  description:
    "The playground lane: re-grade the landed module, derive a driveable page, prove it, verify a hand can drive it, read the goal back",
  phases: [
    {
      title: "Ordering gate",
      detail:
        "planner seat — conformance re-grade over the landed module, drift must be 0",
      model: "opus"
    },
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
      title: "Prove",
      detail:
        "run-test — prover authors the step catalog, replay spec and traceability test (diff withheld), developer greens, pseudo-nathan grades under the differential"
    },
    {
      title: "Verify",
      detail:
        "verifier seat — invokes /review verify lane (pre-gate, differential)",
      model: "opus"
    },
    {
      title: "Review",
      detail:
        "reviewer seat — invokes /review code lane (pre-gate, differential)",
      model: "opus"
    },
    {
      title: "Readback",
      detail:
        "verifier seat — the JTBD capability table, files jtbd-readback.md",
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
const cells = typeof A.cells === "string" ? A.cells : "as audited";

// The 3-cycle cap (rules/code-reviews.md, the exhaustive-review law — "the cap
// stays at three rounds"). Bounded by construction: this lane's own seats are
// 1 + 1 + 1 + 3*2 + 3*2 + 1 = 16; run-test carries its own cap.
const MAX_CYCLES = 3;

const FACTS = `Story: ${id}. Worktree: ${worktree}. Module: ${target}. Cells: ${cells}.`;
const JTBD = `Run JTBD, verbatim — your gate field is evidence toward THIS, never the goal itself; output that satisfies your gate while contradicting it must surface the contradiction rather than return green: "${jtbd}".`;
const INPUTS = `Filed inputs in ${sddDir} — read before starting: review-notes.md (operator rulings, ADR-level, never silently overridden), research.md and audit.md.`;
const BOUNDS = `Run constraints: ${constraints}`;

// D14/D15/D16: an absent criteria channel, sort member or pagination descriptor
// is a HALT back to the door for an M2 regrade — never derived around. A page
// built over a hole proves a capability the module does not have.
const HALT_TO_DOOR =
  "If the landed module has no criteria schema pair, no sort member, or no pagination descriptor, or a non-never scope-matrix cell a hand cannot drive from the acting-for bar (a RETARGET context with no schemas.lookups control keyed by its context value — a plain id text input counts ONLY where no list endpoint that actor's token can reach exists for the entity, stated in a one-line comment on the input; a SELECTOR context not choosable), HALT and say so — that is a module gap for the composable lane, never something to derive around or absorb as a surfaced decision.";

// The exhaustive-review preamble every lane-local reviewer carries — the same
// text the plugin's loops carry, so a lane-local reviewer is held to the same
// law as a plugin one (rules/code-reviews.md, the exhaustive-review law and
// "Severity is decided by CONSUMER IMPACT").
const EXHAUSTIVE = `Then report EVERY finding in ONE list — never stop at the first defect. Stopping early costs the run a whole cycle per straggler and is itself a defect (rules/code-reviews.md, the exhaustive-review law; Incident 2026-09-18, FE-3029). If there are ten defects, your verdict carries ten.\n\nSEVERITY IS CONSUMER IMPACT. Before grading anything, ask: would a consumer of this page build the wrong thing, or lose a capability, because of this? A blocker means yes — the consumer is misled, a capability is lost, or a decision rests on a claim its source refutes. A warning means something real is wrong but the consumer can still build the right thing. A note is bookkeeping that changes nothing a consumer does: a count disagreeing with another count, a self-referential grep resolving to 2 instead of 1, a heading that says three over a table of four, a stale total, a cross-reference to a renumbered section. Put every note in \`notes\`. Notes DO NOT GATE. Filing bookkeeping as a blocker or a warning to force it through breaks this rule. Size is not severity: one wrong line anchor that sends a developer to the wrong function IS a blocker, and a whole table of stale counts is not.\n\nPass = no blocker AND no warning left unaddressed. A warning is a finding, not a suggestion — report it in \`warnings\` with its evidence, the same as a blocker. Praise and suggestions carry no gate and never block. File findings; emit no approval verdict.`;

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

// The findings lists every lane-local pre-gate verdict carries — the SAME gate
// fields the plugin's loops carry (blockers / warnings / notes), plus the
// differential's own field. A warning gates too; a note never does
// (rules/code-reviews.md, "A warning gates too").
const FINDINGS = {
  blockers: { type: "array", items: { type: "string" } },
  warnings: { type: "array", items: { type: "string" } },
  notes: { type: "array", items: { type: "string" } },
  // Cycle 2+ only: every blocker or warning the REPAIR introduced, verbatim.
  // With the previous cycle's list it is the whole set that may gate; a
  // finding in neither is a note (operator ruling 2026-09-22).
  introducedByRepair: { type: "array", items: { type: "string" } }
};

// Verify: a binary PRESENT/ABSENT, not a pass flag — with the findings that
// justify ABSENT itemised, so the repair is handed the whole list and the next
// cycle can judge the repair against it.
const VERDICT_GATE = {
  type: "object",
  properties: {
    verdict: { type: "string" },
    summary: { type: "string" },
    moduleGap: { type: "boolean" },
    ...FINDINGS
  },
  required: ["verdict", "summary"]
};

// Review: `blockerCount` is kept for the door; the loop gates on the lists.
const REVIEW_GATE = {
  type: "object",
  properties: {
    blockerCount: { type: "number" },
    summary: { type: "string" },
    surfacedDecisions: { type: "array", items: { type: "string" } },
    ...FINDINGS
  },
  required: ["blockerCount", "summary"]
};

const REGRADE_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    driftCount: { type: "number" }
  },
  required: ["pass", "summary", "driftCount"]
};

const READBACK_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    undriveableCapabilities: { type: "array", items: { type: "string" } },
    readbackFiled: { type: "boolean" }
  },
  required: ["pass", "summary", "readbackFiled"]
};

// --- The differential gate ---------------------------------------------------
// rules/code-reviews.md, the exhaustive-review law, clause 3; operator ruling
// 2026-09-22. Cycle 2+ judges ONLY the repair against the previous cycle's
// list. The prompt says so; this makes it so. Same code as the plugin's
// run-test / run-document and the composable lane carry.
const FINDING_LISTS = ["blockers", "warnings"];

const normalise = s =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const tokens = s =>
  new Set(
    normalise(s)
      .split(" ")
      .filter(t => t.length > 2)
  );

// Two findings are the same when their normalised text matches, or when they
// share most of their words — a reviewer rewording a carried-over item must
// not turn it into an out-of-scope one.
function sameFinding(a, b) {
  const na = normalise(a);
  const nb = normalise(b);
  if (na.slice(0, 160) === nb.slice(0, 160)) return true;
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return false;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.min(ta.size, tb.size) >= 0.6;
}

// The previous cycle's list as the next reviewer sees it: P1..Pn, blockers
// first. This is the list the repair was handed, so it is the list the next
// differential judges.
function priorList(verdict) {
  const all = [...(verdict?.blockers ?? []), ...(verdict?.warnings ?? [])];
  return all.map((text, i) => ({ label: `P${i + 1}`, text }));
}

function inScope(finding, prior, introduced) {
  const f = String(finding);
  return (
    prior.some(
      p => new RegExp(`\\b${p.label}\\b`).test(f) || sameFinding(f, p.text)
    ) || introduced.some(i => sameFinding(f, i))
  );
}

// Returns the verdict this loop GATES on, plus what it set aside. Cycle 1 (or
// no prior list) passes through untouched: the first review is the full hunt.
// On cycle 2+ a blocker or warning outside the previous list plus
// `introducedByRepair` is moved to `notes`, recorded in `surfaced`, and does
// not gate.
function applyDifferential(verdict, prior, cycle) {
  if (cycle === 1 || !prior?.length) return { verdict, surfaced: [] };
  const introduced = verdict.introducedByRepair ?? [];
  const kept = { ...verdict };
  const surfaced = [];
  for (const list of FINDING_LISTS) {
    if (!Array.isArray(verdict[list])) continue;
    kept[list] = [];
    for (const f of verdict[list]) {
      if (inScope(f, prior, introduced)) kept[list].push(f);
      else surfaced.push({ cycle, list, finding: f });
    }
  }
  kept.notes = [
    ...(verdict.notes ?? []),
    ...surfaced.map(
      s => `[outside the differential — was ${s.list}] ${s.finding}`
    )
  ];
  return { verdict: kept, surfaced };
}

// The differential instruction a cycle-2+ reviewer carries, with the previous
// cycle's list inline. Empty on cycle 1.
function differentialBrief(cycle, prior, producer) {
  if (cycle === 1 || !prior.length) return "";
  return `\n\nThis is cycle ${cycle}, so it is a DIFFERENTIAL over the repair, not a fresh hunt. Judge ONLY the repair against THE PREVIOUS CYCLE'S LIST below. For each item on it: confirm it is CLOSED, or report it again carrying its label (P1, P4 …) verbatim. A warning the ${producer} neither closed nor dispositioned with a stated reason you report again — and here it is a BLOCKER, because a full cycle has now been spent on it. Then check the repair introduced nothing new: a defect the repair CAUSED goes in blockers or warnings AND, verbatim, in \`introducedByRepair\`. A finding that is neither on the list nor introduced by the repair is a NOTE, never a blocker or a warning — put it in \`notes\` only, however real it is; it was there before the repair and it is not what this cycle judges. An unclosed note stays a NOTE forever and never escalates. This loop enforces the rule: a blocker or warning outside the list plus \`introducedByRepair\` is recorded as surfaced and does not gate, so filing one buys nothing.\n\nTHE PREVIOUS CYCLE'S LIST:\n${prior.map(p => `${p.label}. ${p.text}`).join("\n")}`;
}

// The gap list a repair dispatch MUST carry — the WHOLE verdict, verbatim,
// never a prose summary of it (rules/code-reviews.md, the exhaustive-review
// law, clause 2). Blockers first, then the warnings — they gate too — then the
// notes under their own label, because they gate nothing.
function gapList(verdict) {
  const blockers = (verdict?.blockers ?? []).map((b, i) => `B${i + 1}. ${b}`);
  const warnings = (verdict?.warnings ?? []).map((w, i) => `W${i + 1}. ${w}`);
  const notes = (verdict?.notes ?? []).map((n, i) => `N${i + 1}. ${n}`);
  const parts = [];
  if (verdict?.summary) parts.push(verdict.summary);
  if (blockers.length)
    parts.push(`EVERY BLOCKER, verbatim:\n${blockers.join("\n\n")}`);
  if (warnings.length) {
    parts.push(
      "EVERY WARNING — close each one, or disposition it with a stated reason. " +
        "Silence is not a disposition, and an unaddressed warning fails the next cycle. Verbatim:\n" +
        warnings.join("\n\n")
    );
  }
  if (notes.length) {
    parts.push(
      "NOTES — bookkeeping only. These gate nothing. Close them while the file is open; " +
        "never let one hold up the run. Verbatim:\n" +
        notes.join("\n\n")
    );
  }
  return parts.join("\n\n");
}

// --- No-progress escape hatch -------------------------------------------------
// A cycle cap bounds COST, not futility. A cycle whose gating findings the
// previous cycle already raised means the repair changed nothing that
// mattered, and the next one will not either. Escalate on the FIRST repeat
// (Incident 2026-09-15, FE-3239: three identical review cycles). Same code as
// the plugin's loops carry.
function blockerFingerprint(verdict) {
  const all = [...(verdict?.blockers ?? []), ...(verdict?.warnings ?? [])];
  return all
    .map(b => normalise(b).slice(0, 160))
    .sort()
    .join(" | ");
}

function stalled(previousFingerprint, verdict) {
  const current = blockerFingerprint(verdict);
  return Boolean(current) && current === previousFingerprint;
}

const results = { id, stopped: null, cycles: {}, surfaced: [] };

// --- The ordering gate ----------------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL. One planner
// seat, one mechanical count, no reviewer, no artefact. `run-audit` grades a
// target against a contract too, but it files a survey and pre-gates it over
// up to three cycles — and the door already ran it at Stage 0. This gate only
// re-confirms drift 0 on the module the composable lane LANDED. Nothing here
// for the review law to bind.
//
// This lane reads the LANDED module's mapper, schemas, criteria surface and
// matrix, so a derivation over a still-partial module is a guess. A fresh
// re-grade of what the module HAS — not of what the composable lane reported —
// stands between the lanes. At M3 the audit's own grade is what this confirms.
phase("Ordering gate");
results.regrade = await agent(
  `Re-grade the landed module for story ${id} against the current template contract. ${FACTS} ${BOUNDS} Return the drift count and name every drifted row with a file:line. Grade what the module HAS, not what the run reported.`,
  {
    agentType: "upmind-agent:planner",
    model: "opus",
    phase: "Ordering gate",
    schema: REGRADE_GATE,
    label: `regrade:${id}`
  }
);
if (!results.regrade) {
  results.stopped = "regrade-failed";
  return results;
}
if (results.regrade.driftCount !== 0) {
  results.stopped = "ordering-gate-drift";
  return results;
}

// --- Derive -----------------------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL. `run-plan`
// authors a spec under docs/sdd and pre-gates it with two reviewers; this stage
// fills ONE derivation table off the landed module and gates on two mechanical
// fields (`undecidedFields`, `moduleGap`) that run-plan's gate cannot carry.
// One seat, no reviewer — nothing for the review law to bind.
//
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
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL. `run-build`
// develops a spec, but its Develop step is inseparable from Ship (a change
// request this lane may not open) and cannot take the scenario templates or
// this stage's gate (`handOffFiled`, `buildExit`). One developer seat, a
// mechanical gate, no reviewer — nothing for the review law to bind.
phase("Code");
results.code = await agent(
  `Invoke /upmind-agent:code for the playground declaration of story ${id}. ${FACTS} ${JTBD} ${INPUTS} ${BOUNDS} Author the scenario directory from this lane's templates against the filled derivation table. Author the negative-control mutant patches yourself as *.must-fail.patch beside the spec each must flip — you know the mutated line; the prover applies them blind. File the declaration's public surface as the hand-off for the prover; withhold the diff. Run the FULL monorepo build and report its exit code. Commit.`,
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
// DECISION (operator ruling 2026-09-22, rule 1): the plugin's `run-test`
// workflow OWNS this stage — Prove, Green and Test review together, under the
// law the hand-rolled loop lacked (every finding in one list, routed and
// handed over verbatim, cycle 2+ a differential enforced in code, a stalled
// loop escalates). The factory's facts about the scope travel as run-test's
// optional args (plugin 0.30.3): `inputs`, `layers`, `controls`, `checks`.
//
// The replay spec is the RED gate here, not a report: a wrong meta flag, a
// wrong action id and a do-nothing step all TRACE perfectly and have never been
// run. Only an execution sees them — which is why the replay spec and the
// traceability test are named in `layers` and the FULL monorepo build in
// `checks`. What this stage gives up by calling rather than re-implementing:
// its separate `replayGreen` / `traceabilityGreen` / `mutantsProvenRed` fields
// (they are specs in the suite run-test greens and grades) and its Prove-stage
// `module-gap` halt (Derive and Verify still carry it).
//
// run-test's `stopped` names are the halts this stage always emitted
// (prover-failed, suite-red, test-review-failed, test-review-blocked,
// developer-failed) plus test-review-no-progress; they surface verbatim.
phase("Prove");
results.prove = await workflow("upmind-agent:run-test", {
  id,
  worktree,
  size: "unset",
  scope: `the playground declaration of story ${id} — the ${target} module's page (cells: ${cells}). ${JTBD} ${BOUNDS}`,
  inputs: `the declaration's public surface, the module's own .feature and its exported types only. Author the step catalog, its one replay spec and its one traceability test together, over the module's recorded corpus through the shared replay. A scenario is a track only when a real step drives every line of it; a scenario nothing can drive stays spec and gets no steps. A step that fires no real action id and presses no real control is FAKE`,
  layers:
    "the step catalog, the replay spec (the RED gate — a SKIP is a spec-only contract scenario by design, a RED is a halt) and the traceability test; a red that names an absent module capability is a module gap — say so rather than loosening the step",
  controls: true,
  checks: "the FULL monorepo build (never scoped down)"
});
if (!results.prove) {
  results.stopped = "prover-failed";
  return results;
}
results.cycles.testReview = results.prove.cycles;
if (Array.isArray(results.prove.surfaced))
  results.surfaced.push(
    ...results.prove.surfaced.map(s => ({ stage: "Prove", ...s }))
  );
if (results.prove.stopped) {
  results.stopped = results.prove.stopped;
  return results;
}

// --- Verify -----------------------------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL, with the law
// applied. The plugin has no standalone verify workflow (run-build's loop is
// inseparable from its Ship step) and this gate is the factory's — binary
// PRESENT/ABSENT plus `moduleGap`, graded against the module's oracle surface.
// The loop obeys the same principles as the plugin loops: EVERY finding in one
// list, the WHOLE verdict to the repair verbatim, cycle 2+ a DIFFERENTIAL
// enforced by `applyDifferential` (out-of-scope findings recorded in
// results.surfaced, never gating), a stalled loop escalates, the cap is three.
//
// Measured against the MODULE'S ORACLE surface, never the declaration's
// self-report. A page that draws rows but cannot filter, sort or page what the
// oracle offers is ABSENT.
phase("Verify");
results.verifies = [];
let lastVerifyBlockers = "";
let verifyPrior = [];
for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
  results.cycles.verify = cycle;

  const verifyDifferential = differentialBrief(cycle, verifyPrior, "developer");

  const raw = await agent(
    `Invoke /upmind-agent:review (verify lane) over the playground page for story ${id}. ${FACTS} Bind to the CURRENT HEAD of the working branch — on a re-verify after a repair, grade the repaired commit, never the one you graded last cycle. ${JTBD} ${INPUTS} ${BOUNDS} PRESENT = the page boots and draws at every offered cell, its filter bar, sort control and pager render off the module's own criteria and pagination channels, and every drawn control presses a live member. Grade against the module's oracle surface, never the declaration's self-report.\n\nCHECK THE WHOLE SURFACE, every capability the oracle offers, start to finish. ${EXHAUSTIVE} Return verdict PRESENT or ABSENT — ABSENT only with the blockers that make it so itemised in \`blockers\` — and set moduleGap when what is missing is the MODULE's capability rather than the page's.${verifyDifferential}`,
    {
      agentType: "upmind-agent:verifier",
      model: "opus",
      phase: "Verify",
      schema: VERDICT_GATE,
      label: `scenario-verify:${id}#${cycle}`
    }
  );

  if (!raw) {
    results.verifies.push({ cycle, verdict: raw });
    results.stopped = "verify-failed";
    return results;
  }
  // A gap in the MODULE is the composable lane's work, handed back to the door
  // rather than patched around in the page. Mechanical, so it halts on every
  // cycle before the differential is applied.
  if (raw.moduleGap) {
    results.verifies.push({ cycle, verdict: raw });
    results.stopped = "module-gap";
    return results;
  }
  // An ABSENT with nothing itemised still carries its reason: the summary
  // stands in as the one finding, so the repair and the next differential
  // have a list to work from.
  const itemised =
    raw.verdict === "PRESENT" || (raw.blockers ?? []).length
      ? raw
      : { ...raw, blockers: [raw.summary] };
  const { verdict, surfaced } = applyDifferential(itemised, verifyPrior, cycle);
  results.surfaced.push(...surfaced.map(s => ({ stage: "Verify", ...s })));
  results.verifies.push({ cycle, verdict: raw, gated: verdict, surfaced });

  // Cycle 1: the verifier's binary stands. Cycle 2+: ABSENT gates only on a
  // finding inside the differential.
  const gatingFindings =
    (verdict.blockers ?? []).length + (verdict.warnings ?? []).length;
  const absent =
    cycle === 1 ? verdict.verdict !== "PRESENT" : gatingFindings > 0;
  if (!absent) break;
  if (cycle === MAX_CYCLES) {
    results.stopped = "verify-absent";
    return results;
  }
  if (stalled(lastVerifyBlockers, verdict)) {
    results.stopped = "verify-no-progress";
    return results;
  }
  lastVerifyBlockers = blockerFingerprint(verdict);
  // The list the repair is handed IS the list the next differential judges.
  verifyPrior = priorList(verdict);

  log(
    `factory-scenario ${id}: verify cycle ${cycle} ABSENT — developer landing the gap`
  );
  const fixed = await agent(
    `Invoke /upmind-agent:code for the playground declaration of story ${id}. ${FACTS} ${BOUNDS} The verifier found the page's capability ABSENT. Below is the WHOLE verdict — every blocker AND every warning the verifier found. Close ALL of it in this one pass: landing some of the list fails the next cycle on the rest. A warning you neither close nor disposition with a stated reason comes back next cycle as a blocker. Land each one verbatim as named, green the suite and the full monorepo build, then commit. If what is missing is the MODULE's capability rather than the page's, say so and stop:\n\n${gapList(verdict)}`,
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
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL, with the law
// applied. The plugin has no standalone code-review workflow (run-build's loop
// is inseparable from its Ship step and reviews a pushed branch against a base
// this lane has not got), and this gate is the factory's pass-and-surface. The
// loop obeys the same principles as the plugin loops: EVERY finding in one
// list, the WHOLE verdict to the repair verbatim, cycle 2+ a DIFFERENTIAL
// enforced by `applyDifferential`, a stalled loop escalates, the cap is three.
phase("Review");
results.reviews = [];
let lastReviewBlockers = "";
let reviewPrior = [];
for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
  results.cycles.review = cycle;

  const reviewDifferential = differentialBrief(cycle, reviewPrior, "developer");

  const raw = await agent(
    `Invoke /upmind-agent:review (code lane) over the playground diff for story ${id}. ${FACTS} ${INPUTS} ${BOUNDS} A deviation carrying a complete @decision (what / why / rejected) is NOT a blocker — pass it and return it in surfacedDecisions so the run reports it rather than absorbing it silently.\n\nREAD THE WHOLE DIFF, every hunk start to finish, against the filled derivation table. ${EXHAUSTIVE} Return the blocker count beside the lists.${reviewDifferential}`,
    {
      agentType: "upmind-agent:reviewer",
      model: "opus",
      phase: "Review",
      schema: REVIEW_GATE,
      label: `scenario-review:${id}#${cycle}`
    }
  );

  if (!raw) {
    results.reviews.push({ cycle, verdict: raw });
    results.stopped = "review-failed";
    return results;
  }
  if (Array.isArray(raw.surfacedDecisions))
    results.surfaced.push(...raw.surfacedDecisions);
  // A count with nothing itemised still carries its reason: the summary
  // stands in as the one finding, so the repair and the next differential
  // have a list to work from.
  const itemised =
    raw.blockerCount > 0 && !(raw.blockers ?? []).length
      ? { ...raw, blockers: [raw.summary] }
      : raw;
  const { verdict, surfaced } = applyDifferential(itemised, reviewPrior, cycle);
  results.surfaced.push(...surfaced.map(s => ({ stage: "Review", ...s })));
  results.reviews.push({ cycle, verdict: raw, gated: verdict, surfaced });

  const blocked =
    (verdict.blockers ?? []).length + (verdict.warnings ?? []).length > 0;
  if (!blocked) break;
  if (cycle === MAX_CYCLES) {
    results.stopped = "reviewer-blocked";
    return results;
  }
  if (stalled(lastReviewBlockers, verdict)) {
    results.stopped = "review-no-progress";
    return results;
  }
  lastReviewBlockers = blockerFingerprint(verdict);
  // The list the repair is handed IS the list the next differential judges.
  reviewPrior = priorList(verdict);

  log(
    `factory-scenario ${id}: review cycle ${cycle} blocked — developer fixing`
  );
  const fixed = await agent(
    `Invoke /upmind-agent:code for the playground declaration of story ${id}. ${FACTS} ${BOUNDS} The diff was reviewed and blocked. Below is the WHOLE verdict — every blocker AND every warning the reviewer found. Close ALL of it in this one pass: a fix that answers some of the list fails the next cycle on the rest. A warning you neither close nor disposition with a stated reason comes back next cycle as a blocker. Fix these findings, green the suite and the full monorepo build, then commit:\n\n${gapList(verdict)}`,
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

// --- The terminal JTBD readback -----------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL. One verifier
// seat filing one table, gated on `readbackFiled` and `pass`; no plugin
// workflow does this and there is no reviewer loop for the law to bind.
//
// The binding goal's only exit. Green lane gates are evidence toward the goal,
// never the goal: this is the gate the 2026-08-14 run lacked — five green gates,
// and nobody was required to ask "can a hand actually do the job?"
phase("Readback");
results.readback = await agent(
  `File the terminal JTBD readback for story ${id}. ${FACTS} ${JTBD} ${BOUNDS} Write a two-column capability table to ${sddDir}/jtbd-readback.md, beside your own verify.md, BEFORE returning: the ORACLE's surface — what the legacy oracle lets a consumer do, filter, sort, page, search, open, act — beside the LANDED PAGE's driveable surface, row for row. Any oracle capability a hand cannot drive on the page means the run FAILED the JTBD, regardless of every lane gate being green. List those capabilities verbatim.`,
  {
    agentType: "upmind-agent:verifier",
    model: "opus",
    phase: "Readback",
    schema: READBACK_GATE,
    label: `readback:${id}`
  }
);
if (!results.readback) {
  results.stopped = "readback-failed";
  return results;
}
if (!results.readback.readbackFiled) {
  results.stopped = "readback-unfiled";
  return results;
}
if (!results.readback.pass) {
  results.stopped = "jtbd-failed";
  return results;
}

return results;
