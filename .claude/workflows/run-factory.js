// factory.js — the factory chain: audit, the composable lane, the page, the readback.
//
// ADR 006: a runner delegates its work to named skills and owns ONLY
// determinism. This runner's whole job is the audit, the route, the two gates
// between the lanes, and the terminal readback. It writes no seat prompts for
// lane work: each lane is its own workflow and owns its seat chain.
//
// `/factory` stays the DOOR — intake, the one blocking question, the operator
// ruling. This runs the chain the door dispatches. Same seam `/start` uses.
//
// Shape: stage-0 audit -> (composable lane, unless the module is already full)
// -> ordering gate -> (scenario lane, unless the intent opts out) -> the JTBD
// readback. The runner holds every gate; it never self-advances.
//
// THE MID-RUN RULING. A workflow cannot hold a conversation, and a factory run
// routinely turns up a question only the operator can settle — an override the
// audit contradicts, a capability gap it cannot disposition. So a ruling point
// STOPS the run with `stopped: 'ruling-required'` and names what it needs. The
// operator answers by re-invoking with that answer in `rulings` and
// `resumeFromRunId` set: every finished stage replays from cache, so a settled
// run is never re-paid for. Same idiom as `run-staged`'s `approvedThrough`.
//
// Agent budget: 15 on a clean full run (1 audit + 7 composable + 1 re-grade +
// 5 scenario + 1 readback). Worst case, every repair loop exhausted, 53 — above
// this account's 40-agent default ceiling, so a run that degenerates into
// repairs stops at a lane's own 3-cycle cap well before then, by construction.
//
// args:
//   id          — story ID or ad-hoc slug (string, required)
//   worktree    — absolute path to the repo/worktree (string, required)
//   sddDir      — the story's SDD directory (string, required)
//   jtbd        — the run's binding termination condition, verbatim (string, required)
//   module      — target module path (string, required)
//   cells       — the ADR-001 actor x context cells in scope (string, required)
//   mode        — optional operator OVERRIDE of the audit's derivation
//   variant     — optional operator OVERRIDE of the Research derivation
//   playground  — both | page | composable (string, optional, default 'both')
//   constraints — optional; run-scoped prohibitions, recorded verbatim
//   arms        — optional operator override of the Plan-stage arms derivation
//   rulings     — optional object of operator answers to earlier halts, e.g.
//                 { mode: 'conversion', variant: 'hybrid' }. A field present
//                 here settles that contradiction; the run does not re-raise it.
export const meta = {
  name: "run-factory",
  description:
    "The factory chain: audit the module, run the composable lane, derive its playground page, read the goal back",
  phases: [
    {
      title: "Audit",
      detail: "planner seat — grades the module and the page, files audit.md",
      model: "opus"
    },
    {
      title: "Composable",
      detail: "the composable lane — one module to its Docs gate"
    },
    {
      title: "Ordering gate",
      detail: "planner seat — conformance re-grade over the landed module",
      model: "opus"
    },
    {
      title: "Scenario",
      detail: "the playground lane — the page that proves the module"
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
for (const k of ["id", "worktree", "sddDir", "jtbd", "module", "cells"]) {
  if (!A[k] || typeof A[k] !== "string")
    throw new Error(`factory: missing required arg '${k}'`);
}
const { id, worktree, sddDir, jtbd, module: target, cells } = A;
const playground = typeof A.playground === "string" ? A.playground : "both";
const constraints =
  typeof A.constraints === "string" ? A.constraints : "none recorded";
const modeOverride = typeof A.mode === "string" ? A.mode : null;
const variantOverride = typeof A.variant === "string" ? A.variant : null;
const rulings = A.rulings && typeof A.rulings === "object" ? A.rulings : {};

const FACTS = `Story: ${id}. Worktree: ${worktree}. Module: ${target}. Cells: ${cells}.`;
const JTBD = `Run JTBD, verbatim — your gate field is evidence toward THIS, never the goal itself; output that satisfies your gate while contradicting it must surface the contradiction rather than return green: "${jtbd}".`;
const BOUNDS = `Run constraints: ${constraints}`;

const AUDIT_GATE = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    summary: { type: "string" },
    moduleState: { type: "string" },
    playgroundState: { type: "string" },
    derivedMode: { type: "string" },
    driftCount: { type: "number" },
    auditFiled: { type: "boolean" },
    targetDirty: { type: "boolean" }
  },
  required: [
    "pass",
    "summary",
    "moduleState",
    "playgroundState",
    "derivedMode",
    "auditFiled"
  ]
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

const results = { id, stopped: null, rulings: Object.keys(rulings) };

// --- Stage 0: the audit -----------------------------------------------------------
// The route is DERIVED, never trusted. The seat files audit.md before returning:
// a returned table is not a record, and a session lost mid-run used to lose the
// whole sweep.
phase("Audit");
results.audit = await agent(
  `Run the Stage-0 factory audit for story ${id}. ${FACTS} ${JTBD} ${BOUNDS} Grade the module M0 absent / M1 unscoped / M2 scoped-partial / M3 full, and the playground P0 absent / P1 stale / P2 current, against what today's templates would produce for every composable the module ships OR OWES — the oracle decides what is owed. Every present row carries a file:line; every absent row names the missing file or member. Report whether the target directory carries uncommitted changes. Write the state table, the drift list, the derived route and every blocker to ${sddDir}/audit.md BEFORE returning your fields.`,
  {
    agentType: "upmind-agent:planner",
    model: "opus",
    phase: "Audit",
    schema: AUDIT_GATE,
    label: `audit:${id}`
  }
);
if (!results.audit) {
  results.stopped = "audit-failed";
  return results;
}
if (!results.audit.auditFiled) {
  results.stopped = "audit-unfiled";
  return results;
}

// Rewrite-in-place makes git the only record of local hand-tuning, so an
// upgrade over a dirty target is refused before anything is written.
if (results.audit.targetDirty) {
  results.stopped = "target-dirty";
  return results;
}

// An override the audit contradicts is a RULING POINT, not a silent pick: halt
// with both determinations shown and let the operator settle it.
const derivedMode = results.audit.derivedMode;
if (
  modeOverride &&
  derivedMode &&
  modeOverride !== derivedMode &&
  !rulings.mode
) {
  results.stopped = "ruling-required";
  results.question = "mode";
  results.determinations = { override: modeOverride, derived: derivedMode };
  return results;
}
const mode = rulings.mode || modeOverride || derivedMode;
const variant = rulings.variant || variantOverride || null;

// The composable lane derives the variant from the oracle at its Research stage,
// so the door only needs one when it is skipping that lane entirely.
const moduleState = results.audit.moduleState;

// --- The composable lane ------------------------------------------------------------
// Runs at M0-M2. Skipped only at M3: there is nothing left to close.
if (moduleState === "M3") {
  log(`factory ${id}: module already full — composable lane skipped`);
  results.composable = { skipped: "M3" };
} else {
  if (!variant) {
    results.stopped = "ruling-required";
    results.question = "variant";
    results.determinations = { override: null, derived: null };
    return results;
  }

  phase("Composable");
  results.composable = await workflow("run-factory-composable", {
    id,
    worktree,
    sddDir,
    jtbd,
    module: target,
    mode,
    variant,
    cells,
    constraints,
    ...(typeof A.arms === "string" ? { arms: A.arms } : {})
  });

  if (!results.composable || results.composable.stopped) {
    results.stopped = `composable-blocked:${(results.composable && results.composable.stopped) || "lane-failed"}`;
    return results;
  }
}

// The deliberate opt-out: the module alone, page deferred.
if (playground === "composable") {
  log(`factory ${id}: intent is composable-only — stopping at the Docs gate`);
  return results;
}

// --- The ordering gate ----------------------------------------------------------------
// The scenario lane reads the LANDED module's mapper, schemas, criteria surface
// and matrix, so a derivation over a still-partial module is a guess.
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

// --- The scenario lane ------------------------------------------------------------------
phase("Scenario");
results.scenario = await workflow("run-factory-scenario", {
  id,
  worktree,
  sddDir,
  jtbd,
  module: target,
  constraints
});
if (!results.scenario || results.scenario.stopped) {
  results.stopped = `scenario-blocked:${(results.scenario && results.scenario.stopped) || "lane-failed"}`;
  return results;
}

// --- The terminal JTBD readback -----------------------------------------------------------
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
