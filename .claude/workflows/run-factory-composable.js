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
// Shape: research -> plan -> code -> template review -> prove -> verify ->
// review -> document.
//   * Template review runs straight after Code, BEFORE Prove: every member a
//     repair adds or renames is then proven by the prover like any other code.
//     It is the member-level template re-grade the scenario lane's ordering
//     gate runs, moved to where drift is made (Incident 2026-09-24, FE-3029:
//     the conformance lint grades only files and exports, so 14 manager
//     members drifted past every composable gate and surfaced at the scenario
//     lane's first stage). A clean Review then signs the module off.
//   * Verify runs BEFORE Review and Docs: an ABSENT verdict must not reach
//     either, and the documenter takes the verdict as an input and may not
//     certify a capability the verifier did not confirm.
//   * The documenter never grades its own output — the docs-lane review is a
//     separate reviewer dispatch (rules/agent-seat-separation.md).
//   * Every repair is a FRESH developer dispatch, never the invocation that
//     produced the original diff: seat separation holds across a repair.
//
// THE LANE CALLS THE PLUGIN'S WORKFLOWS; IT DOES NOT RE-IMPLEMENT THEM
// (operator ruling 2026-09-22). Research and Plan always did — `run-research`
// and `run-plan`. Every stage after them used to spawn raw `agent()` calls with
// hand-written prompts and its own repair loop, and none of those loops carried
// the exhaustive-review law the plugin's six workflows implement
// (rules/code-reviews.md, "The exhaustive-review law"). The proof was a live
// FE-3029 run: the test-review prompt was byte-identical on every cycle — no
// prior verdict, no differential instruction — so cycles 1, 2 and 3 were three
// independent full reviews that returned three DIFFERENT single blockers, none
// introduced by a repair, all present from the start. Hours burned, nothing
// converged.
//
// So, stage by stage (each decision is recorded again at the stage):
//   * Prove + Test review  -> `upmind-agent:run-test`     (calls it)
//   * Document + Docs review -> `upmind-agent:run-document` (calls it)
//   * Code                 -> stays lane-local: no plugin workflow exposes a
//                             bare develop step (run-build's runs through Ship
//                             and opens a change request, which this lane may
//                             not), and the stage's gate is the factory's own —
//                             scaffold + conformance, arms, scope-from-oracle,
//                             criteria schema. It has no reviewer, so the
//                             review law does not bind it.
//   * Verify, Review       -> stay lane-local: the plugin has no standalone
//                             verify or code-review workflow (run-build's loops
//                             are inseparable from its Ship step), and their
//                             gate fields are the factory's (PRESENT/ABSENT,
//                             pass-and-surface). Both now obey the same law as
//                             the plugin loops: the whole verdict travels to
//                             the repair, cycle 2+ is a DIFFERENTIAL, and the
//                             differential is ENFORCED in code — see
//                             `applyDifferential`.
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
// Never invoked directly. The `/factory` door dispatches it once the Stage-0
// audit has graded the module M0-M2 and the door has settled mode and variant.
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
//   machine     — optional; bespoke | shared (default shared). Selects the
//                  manager's machine file in the variant's template set and is
//                  passed verbatim to the scaffold and the conformance gate.
//   arms        — accepted for interface compatibility, and deliberately NOT
//                  threaded into the Plan dispatch: run-plan carries fixed args,
//                  and an arms override is an operator RULING. It reaches the
//                  planner the way every other ruling does — recorded in
//                  review-notes.md in sddDir, which the planner reads first. The
//                  Code stage still re-derives arms independently and reports a
//                  mismatch either way.
//   researchFiled, codeDone, templateReviewDone, proveDone, verifyDone,
//   reviewDone, docsDone —
//                  optional booleans. Each one skips its stage. The door sets
//                  them from what it finds on disk; the script cannot read disk.
//   planApproved — optional boolean. The OPERATOR'S plan verdict, and the only
//                  thing that lets Code start. Absent or false, the lane stops
//                  at `plan-gate` with the spec filed and the story handed to a
//                  human. The operator reads the bundle, runs /sdd-review, and
//                  re-invokes with planApproved: true and resumeFromRunId set —
//                  every finished stage replays from cache.
export const meta = {
  name: "run-factory-composable",
  description:
    "The scoped-composable lane: research, spec, code, tests, verify, review, docs — one module to its Docs gate",
  phases: [
    {
      title: "Research",
      detail:
        "run-research — planner sweeps the references, reviewer pre-gates the sweep"
    },
    {
      title: "Plan",
      detail:
        "run-plan — planner authors, reviewer + pseudo-nathan pre-gate, operator ratifies"
    },
    {
      title: "Code",
      detail:
        "developer seat — invokes /code (scaffold, conformance, arms, scope, criteria)",
      model: "sonnet"
    },
    {
      title: "Template review",
      detail:
        "reviewer seat — member-level template re-grade, every row in one list (pre-gate, differential)",
      model: "opus"
    },
    {
      title: "Prove",
      detail:
        "run-test — prover authors (diff withheld), developer greens, pseudo-nathan grades under the differential"
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
      title: "Document",
      detail:
        "run-document — documenter authors, reviewer grades the docs lane under the differential"
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
const machine = A.machine === "bespoke" ? "bespoke" : "shared";
// The template set ships in the worktree; the plugin's ci/ scripts do not. The
// lane cannot see ${CLAUDE_PLUGIN_ROOT}, so the seat resolves it through
// /upmind-agent:code (skills/code-scoped-composable/SKILL.md §Template law).
const templateDir = `${worktree}/.claude/skills/factory/composable/templates/${variant}`;
const planApproved = A.planApproved === true;
// Work already filed and signed is not re-run. The script has no filesystem
// access, so the door states what it found on disk.
const skipResearch = A.researchFiled === true;
const skipPlan = planApproved;
const skipCode = A.codeDone === true;
const skipTemplateReview = A.templateReviewDone === true;
const skipProve = A.proveDone === true;
const skipVerify = A.verifyDone === true;
const skipReview = A.reviewDone === true;
const skipDocument = A.docsDone === true;

// The 3-cycle cap (rules/code-reviews.md, the exhaustive-review law — "the cap
// stays at three rounds"). Bounded by construction: this lane's own seats are
// 1 (Code) + 3*2 (Template review) + 3*2 (Verify) + 3*2 (Review) = 19;
// run-research, run-plan, run-test
// and run-document each carry their own cap. A fourth failure of the same
// behaviour escalates to the operator rather than cycling again.
const MAX_CYCLES = 3;

const FACTS = `Story: ${id}. Worktree: ${worktree}. Module: ${target}. Mode: ${mode}. Variant: ${variant}. Cells: ${cells}.`;

// Every seat brief states the JTBD verbatim and frames its gate field as
// EVIDENCE toward it — a seat whose output satisfies its gate field while
// visibly contradicting the JTBD must surface the contradiction, not return
// green (receipt: 2026-08-05 client-email — every gate green, JTBD failed).
const JTBD = `Run JTBD, verbatim — your gate field is evidence toward THIS, never the goal itself; output that satisfies your gate while contradicting it must surface the contradiction rather than return green: "${jtbd}".`;

// review-notes.md carries the operator rulings and binds at ADR level for this
// story (the seat laws (agents/*.md, Laws section)). research.md is the Research stage's
// own filed output. Both are read, never re-derived.
const INPUTS = `Filed inputs in ${sddDir} — read before starting: review-notes.md (operator rulings, ADR-level, never silently overridden) and research.md (the Research stage's filed findings; read it instead of re-deriving it).`;
const BOUNDS = `Run constraints: ${constraints}`;

// Doctrine outranks any example or template it disagrees with; the
// disagreement is surfaced as a finding, never silently resolved toward a
// template (code-composables.companion.md, precedence correction).
const DOCTRINE = `Where doctrine and a template or worked example disagree, doctrine wins and you surface the disagreement as a finding rather than resolving it toward the template.`;

// The exhaustive-review preamble every lane-local reviewer carries — the same
// text the plugin's loops carry, so a lane-local reviewer is held to the same
// law as a plugin one (rules/code-reviews.md, the exhaustive-review law and
// "Severity is decided by CONSUMER IMPACT").
const EXHAUSTIVE = `Then report EVERY finding in ONE list — never stop at the first defect. Stopping early costs the run a whole cycle per straggler and is itself a defect (rules/code-reviews.md, the exhaustive-review law; Incident 2026-09-18, FE-3029). If there are ten defects, your verdict carries ten.\n\nSEVERITY IS CONSUMER IMPACT. Before grading anything, ask: would a consumer of this module build the wrong thing, or lose a capability, because of this? A blocker means yes — the consumer is misled, a capability is lost, or a decision rests on a claim its source refutes. A warning means something real is wrong but the consumer can still build the right thing. A note is bookkeeping that changes nothing a consumer does: a count disagreeing with another count, a self-referential grep resolving to 2 instead of 1, a heading that says three over a table of four, a stale total, a cross-reference to a renumbered section. Put every note in \`notes\`. Notes DO NOT GATE. Filing bookkeeping as a blocker or a warning to force it through breaks this rule. Size is not severity: one wrong line anchor that sends a developer to the wrong function IS a blocker, and a whole table of stale counts is not.\n\nPass = no blocker AND no warning left unaddressed. A warning is a finding, not a suggestion — report it in \`warnings\` with its evidence, the same as a blocker. Praise and suggestions carry no gate and never block. File findings; emit no approval verdict.`;

// The member-level template re-grade — the same brief the scenario lane's
// ordering gate carries, so both lanes grade one contract one way. The
// conformance lint stops at files and exports; this grades what each layer
// factory RETURNS.
const TEMPLATE_REGRADE = `Grade the landed module against the template set ${templateDir} MEMBER BY MEMBER, for EVERY composable the module ships or owes: every member each context, actions and meta factory returns, every machine state the template names, and the criteria channel. Grade what the module HAS, never what a run reported. A template member the module lacks, renames or reshapes is a drift row with the template file:line beside the module file:line. A row is excused ONLY by a \`template-departure:\` line in ${sddDir} that names BOTH the member AND the composable it excuses (for example \`template-departure: lookups (useContractProducts)\`); a departure line that names the module or nothing excuses nothing, and a departure for one composable never excuses another. DECIDE every row yourself wherever the answer is already given — by a ruling in review-notes.md, a decision in operator-review.md, a declared departure's reasoning, or a house exemplar. The answer "restore the template member" puts the row in \`driftRows\`. The answer "keep the landed shape" puts it in \`departRows\` as the exact departure line to file (\`template-departure: <member> (<composable>) — <reason> (<the ruling or exemplar that decides it>)\`). Put a row in \`rulingRows\` ONLY for a genuine architectural choice, or a contradiction between rulings whose answer is NOT obvious from any of those sources — and say why none of them decides it. A choice you can answer with a citation is never a ruling. Grade module SOURCE only: a test or a doc that still reads an old member name is not a drift row — list it in \`consumerRows\` with its file:line, because the developer seat may not write tests or docs and the Prove and Document stages own them. Grade to the end: EVERY row in one list, never stop at the first; a row found next cycle that was there this cycle costs the run a whole round. Return the HEAD you graded as headSha.`;

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
    armsRecorded: { type: "string" },
    templateConformance: {
      type: "object",
      properties: {
        exit: { type: "number" },
        violations: { type: "array", items: { type: "string" } }
      },
      required: ["exit", "violations"]
    }
  },
  required: [
    "pass",
    "summary",
    "diffFileCount",
    "handOffFiled",
    "buildExit",
    "templateConformance"
  ]
};

// The template re-grade: rows, not findings — a drift row either names a real
// gap or it does not, so severity does not apply. Rows that need a ruling stop
// the lane with every row shown; the rest go to one repair.
const TEMPLATE_GATE = {
  type: "object",
  properties: {
    summary: { type: "string" },
    headSha: { type: "string" },
    driftCount: { type: "number" },
    driftRows: { type: "array", items: { type: "string" } },
    departRows: { type: "array", items: { type: "string" } },
    consumerRows: { type: "array", items: { type: "string" } },
    rulingRows: { type: "array", items: { type: "string" } },
    introducedByRepair: { type: "array", items: { type: "string" } }
  },
  required: ["summary", "headSha", "driftCount", "driftRows", "rulingRows"]
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
    negativeControlsGreen: { type: "boolean" },
    ...FINDINGS
  },
  required: ["verdict", "summary"]
};

// Review: pass-and-surface — a deviation carrying a complete @decision is not a
// blocker; it passes and the run reports it rather than absorbing it silently.
// `blockerCount` is kept for the door; the loop gates on the lists.
const REVIEW_GATE = {
  type: "object",
  properties: {
    blockerCount: { type: "number" },
    summary: { type: "string" },
    headSha: { type: "string" },
    surfacedDecisions: { type: "array", items: { type: "string" } },
    ...FINDINGS
  },
  required: ["blockerCount", "summary"]
};

// --- The differential gate ---------------------------------------------------
// rules/code-reviews.md, the exhaustive-review law, clause 3; operator ruling
// 2026-09-22. Cycle 2+ judges ONLY the repair against the previous cycle's
// list. The prompt says so; this makes it so. Same code as the plugin's
// run-test / run-document carry, so a lane-local loop obeys the same principle.
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

// --- Research -------------------------------------------------------------------
// Files research.md BEFORE returning its fields: a returned field is not a
// record, and a session lost between Research and Plan used to lose the whole
// oracle sweep.
phase("Research");
// The plugin's `run-research` workflow OWNS this stage: a planner sweeps the
// references and FILES research.md, then a reviewer PRE-GATES the sweep — is
// every capability claim cited, is every asserted absence evidenced, was every
// question answered or reported unanswered — and the planner revises on a
// blocker up to its own 3-cycle cap.
//
// That pre-gate is the guard against the failure this whole lane exists to
// prevent: a capability the reference has and the sweep missed is dropped by
// everything downstream, with every gate green.
//
// The references and the questions are the factory's; the chain is not. The
// variant derivation is asked as a KEYED question so this lane can gate on the
// answer rather than read it out of prose.
results.research = skipResearch
  ? { skipped: true, filed: `${sddDir}/research.md` }
  : await workflow("upmind-agent:run-research", {
      id,
      worktree,
      outDir: sddDir,
      subject: `the ${target} module — every composable it ships or owes`,
      references: [
        mode === "conversion"
          ? "the implementation being ported — wherever it lives, named in the run constraints; follow a capability out of it when it is implemented elsewhere"
          : "the closest legacy-parity analogue to this subject",
        "the knowledge graph and the docs corpus (glossary + docs/reference/) for existing constructs this module must consume rather than re-mint",
        "the landed sibling modules under packages/headless/src/modules/ as the current shape of the art"
      ],
      questions: [
        "variant: which composable shapes does the reference actually ship — a query-backed collection, a dataManager-machine manager, a bespoke machine, or a combination? Derive the variant from the shapes you find, never from what you were told.",
        "owed: how many composables does this module owe in total, and what is each one's shape?",
        "criteria: which filters, which sort fields and what pagination must this module's query criteria schema own? Name each with its wire key.",
        "types: which existing types, enums and constructs must this module CONSUME rather than re-declare? Give each a file:line.",
        "precedent: which landed module is the closest pattern to copy, and for which part?"
      ],
      jtbd,
      scope: constraints
    });
if (!results.research || results.research.stopped) {
  results.stopped = `research-blocked:${(results.research && results.research.stopped) || "research-failed"}`;
  return results;
}
const sweep = results.research.sweep || {};

// Derivation vs operator override: halt with BOTH shown, never a silent pick
// (receipt: 2026-08-05 client-email — `variant=query` against a reference
// shipping a manager amputated the entire manager surface).
const derivedVariant = (sweep.answers || {}).variant;
if (
  typeof derivedVariant === "string" &&
  derivedVariant &&
  !derivedVariant.toLowerCase().includes(variant.toLowerCase())
) {
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
// The plugin's `run-plan` workflow OWNS this stage's chain — planner authors,
// then a reviewer and pseudo-nathan pre-gate the spec IN PARALLEL, then the
// planner revises on any blocker, up to its own 3-cycle cap, and it stops at
// the operator gate. Dispatching a lone planner seat here instead would
// re-implement that badly: it drops both pre-gates, drops the revise loop, and
// hands the operator an ungraded spec.
//
// Depth: `conversion` and `net-new` are never trivial, so they take the FULL
// SDD route. `upgrade` takes the light route — the factory does not second-
// guess a gap-closure's shape.
//
// The factory's own intake does not ride run-plan's fixed args; it reaches the
// planner through the files already on disk in sddDir — review-notes.md (the
// operator rulings, ADR-tier) and research.md (the filed oracle sweep). That is
// what those files are for.
results.plan = skipPlan
  ? { skipped: true, approved: true, spec: sddDir }
  : await workflow("upmind-agent:run-plan", {
      id,
      worktree,
      depth: mode === "upgrade" ? "plan" : "sdd",
      size: "unset"
    });
if (!results.plan) {
  results.stopped = "plan-failed";
  return results;
}
// run-plan stops at `plan-gate` when BOTH pre-gates come back clean — that is
// the operator's turn, and the verdict is theirs alone (ADR-029). Any other
// stop is a pre-gate that blocked or a seat that died; surface it verbatim.
if (results.plan.stopped && results.plan.stopped !== "plan-gate") {
  results.stopped = `plan-blocked:${results.plan.stopped}`;
  return results;
}

// --- THE PLAN GATE — a human ratifies the spec before any code is written ----
//
// The pre-gates say the spec carries no blocker. They cannot say it is RIGHT.
// Every lifecycle table puts a finished plan in front of a human (actor:Human +
// action:Review, status Needs Review) and only the operator's `/sdd-review
// approve` flips it back to the agent for dev. A runner that walks from Plan
// into Code has emitted the plan verdict itself, which no agent seat may do
// (rules/agent-seat-separation.md, ADR-029).
//
// The spec is filed and readable; nothing is discarded. The operator reads it,
// runs /sdd-review, and re-invokes with planApproved: true and resumeFromRunId
// set — every finished stage replays from cache, and Code opens on a ratified
// spec.
if (!planApproved) {
  results.stopped = "plan-gate";
  results.awaiting = "operator plan review";
  results.spec = sddDir;
  return results;
}

// --- Code -------------------------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL. `run-build`
// plainly develops a spec — but its Develop step is inseparable from the chain
// that follows it (Prove, Test review, Green, SHIP — which pushes and opens a
// change request this lane may not open (SKILL.md §Non-goals), Review, Verify,
// Document), it exposes no per-stage skip, and its DEV_GATE cannot carry what
// this stage uniquely gates on: the template scaffold + conformance gate
// (plugin 0.30.x, `template-drift`), the independent arms re-derivation
// (`arms-mismatch`), the scope-block-from-oracle law and the criteria-schema
// law. Threading those through run-build would fork it. The stage is a single
// developer dispatch with a MECHANICAL gate — exit codes and counts, no
// reviewer — so the exhaustive-review law has no loop here to bind.
//
// The full monorepo build is part of this gate: everything builds or the run
// halts, never scoped down (receipt: 2026-08-14 — a criteria-less module shipped
// through five green gates because no gate built anything).
if (!skipCode) {
  phase("Code");
  results.code = await agent(
    `Invoke /upmind-agent:code for story ${id}. ${FACTS} ${JTBD} ${INPUTS} ${BOUNDS} ${DOCTRINE} Spec: ${sddDir}. Template: ${templateDir}. Machine: ${machine}. The template is the shape contract: run the plugin's ci/scaffold-module.mjs against it before your first write (never hand-copy), fill the slots only, and run ci/lint-template-conformance.mjs against the landed module before reporting — report its exit code and every violation row as templateConformance. THREE things bind this stage. (1) Re-derive the arms determination independently from the landed parity table against the variance-law clauses themselves — never by trusting the recorded block; report armsMismatch with both determinations if they differ, and stop. (2) The scope block comes from the ORACLE, never the template's placeholder enum: where the oracle names entities the actor may act for, mint the context enum and matrix from exactly those; where it names none and the composable reads one record by id, mint NO context enum and an all-never item matrix you still pass as TMatrix; where it names none and it is not a single-record read, STOP and ask the operator rather than minting a context type to fill the slot. A minted context with no oracle behind it is a claimed capability that does not exist. (3) The criteria schema owns ALL request state — filters, sort, pagination, limit — and every one reaches the wire only through list({ criteria: { schema } }); a hand-rolled filter ref, a filter[...] string or a raw sort/limit literal beside the channel is a defect here. Author every negative-control mutant yourself as <spec-basename>.must-fail.patch beside the spec it must flip — you know the mutated line; the prover applies them blind. File the public-surface hand-off for the prover. Run the FULL monorepo build and report its exit code. Work only in the worktree. Commit as you go.`,
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
  // A red conformance lint does not halt: its rows go to the Template review,
  // which grades every member and repairs them all in one round.
  results.violations = results.code.templateConformance.violations ?? [];
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
} else {
  results.code = { skipped: true };
}

// --- Template review -------------------------------------------------------------
// DECISION (operator ruling 2026-09-24): the member-level template re-grade
// runs HERE, in the composable lane, not first at the scenario lane's ordering
// gate. Lane-local for the same reason as Verify and Review: no plugin
// workflow grades a module against the factory's templates. It obeys the same
// law: every row in one list, the whole list to one repair, cycle 2+ a
// differential over that list, a stalled loop escalates, the cap is three.
// Rows that need an operator choice do NOT stop the lane: every other row is
// repaired and every later stage runs, and the lane ends with `rulings-pending`
// and every such row shown, so a ruling is asked once for the whole module.
if (!skipTemplateReview) {
  phase("Template review");
  results.templateReviews = [];
  let lastTemplateRows = "";
  let templatePrior = [];
  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    results.cycles.templateReview = cycle;
    const lintRows =
      cycle === 1 && results.violations?.length
        ? `\n\nThe conformance lint at Code reported these rows; each is one of yours too:\n${results.violations.join("\n")}`
        : "";
    const raw = await agent(
      `Invoke /upmind-agent:review (code lane) as the template re-grade for story ${id}. ${FACTS} ${INPUTS} ${BOUNDS} ${TEMPLATE_REGRADE}${lintRows}${differentialBrief(
        cycle,
        templatePrior,
        "developer"
      )}`,
      {
        agentType: "upmind-agent:reviewer",
        model: "opus",
        phase: "Template review",
        schema: TEMPLATE_GATE,
        label: `template-review:${id}#${cycle}`
      }
    );
    if (!raw) {
      results.templateReviews.push({ cycle, verdict: raw });
      results.stopped = "template-review-failed";
      return results;
    }
    const { verdict, surfaced } = applyDifferential(
      { ...raw, blockers: raw.driftRows, warnings: [] },
      templatePrior,
      cycle
    );
    results.surfaced.push(
      ...surfaced.map(s => ({ stage: "Template review", ...s }))
    );
    results.templateReviews.push({ cycle, verdict: raw, gated: verdict });
    const drift = verdict.blockers ?? [];
    // A row that needs an operator choice never blocks the repair of the
    // rest: it is carried to the end of the lane and reported there.
    results.rulingRows = raw.rulingRows ?? [];
    // Stale tests and docs belong to the seats that own them: Prove and
    // Document are handed this list, so the developer is never asked for them.
    results.consumerRows = raw.consumerRows ?? [];
    // A row the grader decided as "keep the landed shape" is filed, not asked:
    // the planner writes each departure line and its decision row, and the
    // next cycle re-grades with them in place.
    if ((raw.departRows ?? []).length) {
      const filed = await agent(
        `File these template departures for story ${id}. ${FACTS} ${BOUNDS} Append each line VERBATIM to the template-departures section (9.x) of the design file in ${sddDir}, and one decision row per line to ${sddDir}/operator-review.md with the next free D id, citing the ruling or exemplar the line names. Touch nothing else:\n\n${raw.departRows.join("\n")}`,
        {
          agentType: "upmind-agent:planner",
          model: "sonnet",
          phase: "Template review",
          label: `file-departures:template:${id}#${cycle}`
        }
      );
      if (filed === null) {
        results.stopped = "planner-failed";
        return results;
      }
      results.departuresFiled = [
        ...(results.departuresFiled ?? []),
        ...raw.departRows
      ];
    }
    if (!drift.length && !(raw.departRows ?? []).length) {
      results.templateSignedAt = raw.headSha;
      break;
    }
    if (cycle === MAX_CYCLES) {
      results.stopped = "template-drift";
      results.driftRows = drift;
      return results;
    }
    if (stalled(lastTemplateRows, verdict)) {
      results.stopped = "template-review-no-progress";
      results.driftRows = drift;
      return results;
    }
    lastTemplateRows = blockerFingerprint(verdict);
    templatePrior = priorList(verdict);

    log(
      `factory-composable ${id}: template review cycle ${cycle} — ${drift.length} drift rows, developer closing all`
    );
    const fixed = await agent(
      `Invoke /upmind-agent:code for story ${id}. ${FACTS} ${BOUNDS} ${DOCTRINE} Template: ${templateDir}. The template re-grade found the module drifting from its template. Below is EVERY drift row. Close ALL of them in this one pass by bringing the module to the template member as named — a pass that closes some rows fails the next cycle on the rest. Author a .must-fail.patch for every member you add or reshape, beside the spec that must flip; the prover applies them blind. Green the suite and the full monorepo build, then commit:\n\n${gapList(verdict)}`,
      {
        agentType: "upmind-agent:developer",
        model: "sonnet",
        phase: "Template review",
        label: `fix-template:${id}#${cycle}`
      }
    );
    if (fixed === null) {
      results.stopped = "developer-failed";
      return results;
    }
  }
} else {
  results.templateReviews = [{ skipped: true }];
}

// --- Prove ---------------------------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): the plugin's `run-test`
// workflow OWNS this stage — Prove, Green and Test review together. It does
// exactly what this lane used to hand-roll here, and it does it under the law
// the hand-rolled loop lacked: the prover authors against the contract only
// (diff and hand-off withheld — the prover seat's own laws enforce that, not
// this prompt), the developer greens the suite (a src red is developer work),
// pseudo-nathan grades EVERY test in ONE list with warnings and notes, every
// blocker and warning is routed to the lane that owns it and handed over
// VERBATIM, cycle 2+ is a DIFFERENTIAL enforced in code, and a stalled loop
// escalates instead of grinding to the cap.
//
// The factory's own facts about the scope travel as run-test's optional args
// (added to the plugin in 0.30.3 for exactly this): `inputs` (what the prover
// is fed), `layers` (unit and integration only — this lane never routes a
// behaviour to e2e), `controls` (developer-authored mutants exist; apply
// blind, RED, revert), `checks` (the FULL monorepo build must exit 0, receipt
// 2026-08-14). What this stage gives up by calling rather than re-implementing:
// its separate `noBoundaryDetermination` field, and its own test-review-
// before-green ordering — run-test greens first, then grades; the plugin's
// order is the plugin's.
//
// Negative controls: the DEVELOPER authored each *.must-fail.patch at Code —
// it knows the mutated line, and mutating source is not a test assertion, so
// it neither self-certifies nor grades. The PROVER applies it blind, confirms
// RED, reverts. Author-of-mutation != verifier-of-red.
//
// run-test's `stopped` names are the halts this stage always emitted
// (prover-failed, suite-red, test-review-failed, test-review-blocked,
// developer-failed) plus test-review-no-progress; they surface verbatim.
if (!skipProve) {
  phase("Prove");
  results.prove = await workflow("upmind-agent:run-test", {
    id,
    worktree,
    size: "unset",
    scope: `story ${id} — the ${target} module (${variant} variant; cells: ${cells}). ${JTBD} ${BOUNDS} ${DOCTRINE}`,
    inputs: `${sddDir}/design.md, the module's co-located .feature, the parity table, and the exported public surface only. Anchor every test to a scenario in the feature; an unmapped test means the feature gains the missing scenario, never that the test is dropped${results.consumerRows?.length ? `. These tests still read a member the Template review renamed or removed — update each one to the landed public surface:\n${results.consumerRows.join("\n")}` : ""}`,
    layers:
      "unit and integration only; never e2e — this lane proves the feature's journey scenarios at the integration altitude",
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
} else {
  results.prove = { skipped: true };
}

// --- Verify (U7) ---------------------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL, with the law
// applied. The plugin has no standalone verify workflow — run-build's Verify
// loop is inseparable from its Ship step and its GATE is pass/fail, where this
// stage's is the factory's binary PRESENT/ABSENT plus `negativeControlsGreen`
// and the oracle-measured, fixture-re-capturing brief below. So the loop stays
// here and obeys the same principles as the plugin loops: the verifier reports
// EVERY finding in one list (blockers / warnings / notes), the WHOLE verdict
// travels to the repair verbatim, cycle 2+ is a DIFFERENTIAL that judges only
// the repair, a finding outside the previous list plus the repair is a NOTE
// (enforced by `applyDifferential`, recorded in results.surfaced), a stalled
// loop escalates, and the cap is three.
//
// A binary PRESENT/ABSENT on whether the capability the JTBD names actually
// landed — measured against the ORACLE, never only the parity table's own
// self-declared in-scope list. ABSENT does not advance to Review or Docs.
//
// This is a DELIVERY check only: it neither runs the variance-law lint nor
// judges a clause. That is the Review gate's job.
if (!skipVerify) {
  phase("Verify");
  results.verifies = [];
  let lastVerifyBlockers = "";
  let verifyPrior = [];
  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    results.cycles.verify = cycle;

    const verifyDifferential = differentialBrief(
      cycle,
      verifyPrior,
      "developer"
    );

    const raw = await agent(
      `Invoke /upmind-agent:review (verify lane) for story ${id}. ${FACTS} Bind to the CURRENT HEAD of the working branch — on a re-verify after a repair, grade the repaired commit, never the one you graded last cycle. ${JTBD} ${INPUTS} ${BOUNDS} Grade the JTBD's surface against the oracle — for a conversion, every composable surface of the implementation being replaced — never only the parity table's in-scope list. Where the run's diff touches __tests__/fixtures/, re-capture against the real system yourself and compare structurally (keys, shapes, enums — not volatile values); a stored receipt is forgeable and is not evidence, only the live re-capture is.\n\nCHECK THE WHOLE SURFACE, every capability the oracle offers, start to finish. ${EXHAUSTIVE} Return verdict PRESENT or ABSENT — ABSENT only with the blockers that make it so itemised in \`blockers\` — and whether every new negative control ran green.${verifyDifferential}`,
      {
        agentType: "upmind-agent:verifier",
        model: "opus",
        phase: "Verify",
        schema: VERDICT_GATE,
        label: `verify:${id}#${cycle}`
      }
    );

    if (!raw) {
      results.verifies.push({ cycle, verdict: raw });
      results.stopped = "verify-failed";
      return results;
    }
    // An ABSENT with nothing itemised still carries its reason: the summary
    // stands in as the one finding, so the repair and the next differential
    // have a list to work from.
    const itemised =
      raw.verdict === "PRESENT" || (raw.blockers ?? []).length
        ? raw
        : { ...raw, blockers: [raw.summary] };
    const { verdict, surfaced } = applyDifferential(
      itemised,
      verifyPrior,
      cycle
    );
    results.surfaced.push(...surfaced.map(s => ({ stage: "Verify", ...s })));
    results.verifies.push({ cycle, verdict: raw, gated: verdict, surfaced });

    // Cycle 1: the verifier's binary stands. Cycle 2+: ABSENT gates only on a
    // finding inside the differential. A RED negative control is mechanical —
    // an exit code, not a finding — so it gates on every cycle.
    const gatingFindings =
      (verdict.blockers ?? []).length + (verdict.warnings ?? []).length;
    const absent =
      verdict.negativeControlsGreen === false ||
      (cycle === 1 ? verdict.verdict !== "PRESENT" : gatingFindings > 0);
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
      `factory-composable ${id}: verify cycle ${cycle} ABSENT — developer landing the gap`
    );
    const fixed = await agent(
      `Invoke /upmind-agent:code for story ${id}. ${FACTS} ${BOUNDS} ${DOCTRINE} The verifier found the capability ABSENT. Below is the WHOLE verdict — every blocker AND every warning the verifier found. Close ALL of it in this one pass: landing some of the list fails the next cycle on the rest. A warning you neither close nor disposition with a stated reason comes back next cycle as a blocker. Land every missing load-bearing part verbatim as named, author a fresh .must-fail.patch for every behaviour you land or re-arm, green the suite and the full monorepo build, then commit:\n\n${gapList(verdict)}`,
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
} else {
  results.verifies = [{ skipped: true }];
}

// --- Review pre-gate -------------------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): stays LANE-LOCAL, with the law
// applied. The plugin has no standalone code-review workflow — run-build's
// Review loop is inseparable from its Ship step and reviews a pushed branch
// against a base this lane has not got, and this stage's gate is the
// factory's pass-and-surface (a complete @decision passes and is reported in
// `surfacedDecisions`, never a blocker). So the loop stays here and obeys the
// same principles as the plugin loops: EVERY finding in one list (blockers /
// warnings / notes), the WHOLE verdict to the repair verbatim, cycle 2+ a
// DIFFERENTIAL enforced by `applyDifferential`, a stalled loop escalates, the
// cap is three.
//
// Holds the built module to the variance law. The decidable clauses are already
// mechanically enforced by the standing scope-based ESLint plugin via pnpm lint;
// this gate owns what stays judgement — return-shape uniformity, override
// quality, @decision quality. The reviewer may BLOCK; it never emits the
// approval verdict (ADR-029).
if (!skipReview) {
  phase("Review");
  results.reviews = [];
  let lastReviewBlockers = "";
  let reviewPrior = [];
  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    results.cycles.review = cycle;

    const reviewDifferential = differentialBrief(
      cycle,
      reviewPrior,
      "developer"
    );

    const raw = await agent(
      `Invoke /upmind-agent:review (code lane) over the diff for story ${id}. ${FACTS} ${INPUTS} ${BOUNDS} Hold the module to the variance law. A deviation carrying a complete @decision (what / why / rejected) is NOT a blocker — pass it and return it in surfacedDecisions so the run reports it rather than absorbing it silently. An override whose body is byte-equal to the shared implementation IS a blocker: it claims to override and delivers nothing. A conversion target's pre-existing unscoped structure is advisory, never a blocker, until this diff adds or modifies scoped structure.\n\nREAD THE WHOLE DIFF, every hunk start to finish, against the spec at ${sddDir}. ${EXHAUSTIVE} Every member a repair since the Template review added, renamed or reshaped is held to the template too: a new drift row is a blocker. Return the blocker count beside the lists, and the HEAD you graded as headSha.${reviewDifferential}`,
      {
        agentType: "upmind-agent:reviewer",
        model: "opus",
        phase: "Review",
        schema: REVIEW_GATE,
        label: `review:${id}#${cycle}`
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
    const { verdict, surfaced } = applyDifferential(
      itemised,
      reviewPrior,
      cycle
    );
    results.surfaced.push(...surfaced.map(s => ({ stage: "Review", ...s })));
    results.reviews.push({ cycle, verdict: raw, gated: verdict, surfaced });

    const blocked =
      (verdict.blockers ?? []).length + (verdict.warnings ?? []).length > 0;
    if (!blocked) {
      // The sign-off: the module is template-conformant at this HEAD. The door
      // records it and passes `regradeDone` to the scenario lane when the
      // module has no change since, so the ordering gate is not paid twice.
      if (results.templateSignedAt || skipTemplateReview)
        results.signoff = { module: target, sha: raw.headSha };
      break;
    }
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
      `factory-composable ${id}: review cycle ${cycle} blocked — developer fixing`
    );
    const fixed = await agent(
      `Invoke /upmind-agent:code for story ${id}. ${FACTS} ${BOUNDS} ${DOCTRINE} The diff was reviewed and blocked. Below is the WHOLE verdict — every blocker AND every warning the reviewer found. Close ALL of it in this one pass: a fix that answers some of the list fails the next cycle on the rest. A warning you neither close nor disposition with a stated reason comes back next cycle as a blocker. Fix these findings, green the suite and the full monorepo build, then commit. A tolerated exception is an in-place native eslint-disable line carrying its reason, never a loosened rule:\n\n${gapList(verdict)}`,
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
} else {
  results.reviews = [{ skipped: true }];
}

// --- Document -----------------------------------------------------------------------------
// DECISION (operator ruling 2026-09-22, rule 1): the plugin's `run-document`
// workflow OWNS this stage — documenter writes, a SEPARATE reviewer runs the
// docs lane, the documenter revises on a blocker — under the law the
// hand-rolled loop lacked: every finding in one list, the whole verdict to the
// revise verbatim, cycle 2+ a differential enforced in code, a stalled loop
// escalates. The factory's facts travel as run-document's optional `inputs`
// (added in 0.30.3) and the doc-set completeness as the gate's
// `missingArtefacts` count (also 0.30.3), which fails a cycle on its own.
// What this stage gives up by calling rather than re-implementing: its own
// score-at-least-85 threshold — the docs review lane owns its scoring, and the
// gate is the severity law's (no blocker, no unaddressed warning, no missing
// artefact); and its `docs-blocked` halt name, which is run-document's
// `docs-review-blocked` now.
//
// After Verify, deliberately: the documenter takes the verifier's verdict as an
// input and refuses to certify a capability not returned PRESENT. The docs-lane
// grade is a SEPARATE reviewer dispatch — an author never grades its own output
// (rules/agent-seat-separation.md).
if (!skipDocument) {
  phase("Document");
  results.document = await workflow("upmind-agent:run-document", {
    id,
    worktree,
    scope: `story ${id} — the ${target} module's FULL documentation set (the /docs factory's required artefacts). ${BOUNDS} ${DOCTRINE}`,
    inputs: `${sddDir}/review-notes.md (operator rulings, ADR-level, never silently overridden), ${sddDir}/research.md (the filed oracle sweep) and the verifier's verdict for this story — it returned PRESENT on the capability; describe as delivered nothing it did not confirm${results.consumerRows?.length ? `. These docs still name a member the Template review renamed or removed — update each one to the landed public surface:\n${results.consumerRows.join("\n")}` : ""}`
  });
  if (!results.document) {
    results.stopped = "documenter-failed";
    return results;
  }
  results.cycles.docsReview = results.document.cycles;
  if (Array.isArray(results.document.surfaced))
    results.surfaced.push(
      ...results.document.surfaced.map(s => ({ stage: "Document", ...s }))
    );
  if (results.document.stopped) {
    results.stopped = results.document.stopped;
    return results;
  }
} else {
  results.document = { skipped: true };
}
// Every stage ran. A choice still open withholds the sign-off: the module is
// not signed conformant until the operator rules.
if (results.rulingRows?.length) {
  results.stopped = "rulings-pending";
  delete results.signoff;
}
return results;
