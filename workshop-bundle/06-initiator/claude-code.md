# Workshop Initiator — Claude Code layer

> Read [`generic.md`](./generic.md) first, then [`cursor.md`](./cursor.md), then continue here. This layer adds Claude Code-specific scaffolding on top of both: `CLAUDE.md` project memory, slash-command skills, subagent orchestration via the Agent tool, hooks, and TodoWrite-driven per-feature loops.
>
> If your team is running the workshop on Claude Code, **this** file is your initiator.
>
> Conflict order: `generic.md` > `cursor.md` > `claude-code.md`. This layer adapts the prior layers' guidance to Claude Code's primitives; it does not override their principles. Where `cursor.md` describes a mechanic that has a direct Claude Code analogue (e.g. `.cursorrules` → `CLAUDE.md`, Background Agents → backgrounded subagents), use the Claude Code form below.

---

## How to load this initiator in Claude Code

Day 1, first thirty minutes:

1. **Create the prototype repo.** Empty git repo in the team's chosen folder. Feature 0 will scaffold; Claude Code just needs a folder to open.
2. **Drop the handover bundle into the repo.** Unzip into `workshop-bundle/` at the repo root. Claude Code's `Read` tool resolves paths relative to the working directory, so keeping the bundle inside the repo is the path of least friction.
3. **Launch Claude Code** from the repo root (`claude` in the terminal, or open the repo in the VS Code extension). Confirm the session has the repo as its working directory before pasting the loading prompt — `pwd` is a one-line sanity check.
4. **Paste the loading prompt** (below) into the first input. This is the only thing the team types to boot the workshop. The agent's first action is to drop the pre-built `CLAUDE.md` and `.claude/settings.json` templates from `workshop-bundle/06-initiator/templates/` into the repo root — you do **not** hand-place these. From turn 2 onward, `CLAUDE.md` auto-loads on every session, and `.claude/settings.json` cuts the permission prompts down to near-zero for the broad dev-loop tools.
5. Claude Code then reads the bundle files via `Read` tool calls in response to the loading prompt, runs the Kickoff Interview, and finally **tailors the templates** to the stack the team locked in (prunes the package-manager allowlist, appends stack-specific notes to `CLAUDE.md`'s "Working style" block).

### Loading prompt — paste verbatim into the first Claude Code prompt

```
You are the workshop implementation agent for a 2-day cart + customer-panel
prototype build against the Upmind back-end. The handover bundle is at
workshop-bundle/ in this repo.

Do the following in order. Each step gates the next.

STEP 0 — drop the safety-net templates into place

Before reading anything else, check whether these two files exist at the
repo root and, if either is missing, copy it from the bundle:

  ./CLAUDE.md                  <- workshop-bundle/06-initiator/templates/CLAUDE.md
  ./.claude/settings.json      <- workshop-bundle/06-initiator/templates/.claude/settings.json

Use the Read tool to load the template, then Write to drop it at the
destination. Do NOT modify the template content at this stage — leave
tailoring to step 4 below. If a file already exists at the destination,
leave it alone (assume the team customised it).

Tell me in one line which files you placed.

STEP 1 — read the initiator layers

Read these three files end-to-end, in this order:

  workshop-bundle/06-initiator/generic.md
  workshop-bundle/06-initiator/cursor.md
  workshop-bundle/06-initiator/claude-code.md

Use the Read tool on each path directly.

STEP 2 — confirm context loaded

In one short message confirm you've loaded all three files and understand:
  - the mission (section 1 of generic.md)
  - the feature sequence (section 8)
  - your operating principles (section 10)
  - the Claude Code adaptations (this file)

STEP 3 — run the Kickoff Interview

Run generic.md section 10, Step 0, against me. One cluster at a time.
Ask in plain language. Capture my answers verbatim back into sections 4,
5, and 6 of generic.md as you go — use the Edit tool to update the file
in place. Read each cluster back to me and wait for "confirmed" before
moving on. Use TodoWrite to track the four kickoff clusters so I can see
progress.

STEP 4 — tailor the templates to the locked stack

Once sections 4 / 5 / 6 of generic.md are filled and confirmed, tailor
the two templates you dropped in step 0 to the team's locked choices:

  ./.claude/settings.json
    - Prune the Bash allowlist to the package manager actually chosen
      (e.g. remove npm/yarn/bun entries if pnpm was locked). Keep node,
      git, and dev-tool entries broad.
    - Add any extra Bash entries the locked stack needs (e.g. the test
      runner, lint tool, framework CLI).

  ./CLAUDE.md
    - Locate the "AGENT-TAILORED" HTML comment in the "Working style"
      section. Replace it with 3-6 short bullets capturing the load-
      bearing stack pins from the interview — especially package
      majors that are likely to drift from training cutoff (Tailwind
      version, framework version, UI-kit variant, etc.).

Use Edit, not Write, for both files. Show me the diff in one message
when done, then wait for "confirmed".

STEP 5 — confirm build cadence

The last cluster of the Kickoff Interview asks which cadence to run in:

  - "step" (default): I type /workshop-feature N for each feature; you
    wait for explicit go-ahead at every gate.
  - "factory": after each feature passes validation you auto-advance to
    the next one (with a 30s pause to let me say "pause"/"skip"/"review"),
    and spawn background subagents for parallel-safe pairs from
    generic.md section 11. Stop conditions still apply — validation
    failures, SDD ambiguity, my interruptions, recorded stop_conditions.

Record the choice in section 5 of generic.md under "cadence:" (and any
stop_conditions: I listed). If I'm unsure, default to step.

STEP 6 — do not generate project code until steps 0-5 are complete and
confirmed. Once confirmed, behave according to the locked cadence.

If I interrupt the interview to start coding, finish the cluster you're
on, capture what you have, mark the rest "TBD — ask when relevant", and
continue.
```

That's it. The agent now owns the workshop.

---

## `CLAUDE.md` — persistent project memory

The agent drops a ready-to-use `CLAUDE.md` at the **prototype repo root** as step 0 of the loading prompt above. Claude Code loads it at the start of every session (including after `/clear`), which is how the load-bearing principles survive across the two-day workshop and between teammates picking up where the last one left off.

**Template source:** `workshop-bundle/06-initiator/templates/CLAUDE.md` (in this repo: [`templates/CLAUDE.md`](./templates/CLAUDE.md)).

**Tailoring after the Kickoff Interview:** the agent uses `Edit` to replace the `<!-- AGENT-TAILORED -->` comment with stack-specific bullets (Tailwind major, framework version, UI-kit variant, etc.). This pins the load-bearing version choices so they survive `/clear`.

The template is intentionally distilled — full operating principles live in `generic.md`; `CLAUDE.md` is the always-on safety net that ensures the hard rules apply even before the agent re-reads the bundle.

> If your team's Claude Code version supports per-folder `CLAUDE.md` files (a `CLAUDE.md` in a subdirectory is layered on top of the root one when the agent works inside that folder), you can drop scoped rules into `src/features/basket/CLAUDE.md` etc. as feature work spreads. For a 2-day prototype, the single root file is sufficient.

---

## Workshop slash-command skills

Three small skills smooth the workshop loop. Each lives under `.claude/skills/<name>/SKILL.md` at the repo root and is invocable as `/<name>` from any Claude Code prompt.

> If your team's Claude Code version uses `.claude/commands/<name>.md` instead of `.claude/skills/`, the same body works in either location — the frontmatter is the only thing to adjust. Pick whichever the local CLI supports.

### `/workshop-kickoff` — rehydrate context after a `/clear`

Path: `.claude/skills/workshop-kickoff/SKILL.md`

```markdown
---
name: workshop-kickoff
description: Reload the workshop bundle into context and re-run the Kickoff Interview if sections 4-6 of generic.md are still blank. Use after /clear, after a session restart, or when handing the agent to a different teammate.
---

You are resuming the Contabo workshop. Do the following in order:

1. Read these files end-to-end using the Read tool:
   - workshop-bundle/06-initiator/generic.md
   - workshop-bundle/06-initiator/cursor.md
   - workshop-bundle/06-initiator/claude-code.md
2. Check sections 4, 5, and 6 of generic.md.
   - If all three are filled in: confirm to the team in one short message
     what stack / architecture is locked, list the next feature in the
     sequence (section 8), and stop. Wait for instruction.
   - If any are blank or marked "TBD": run the Kickoff Interview from
     section 10 Step 0 for the missing clusters only. Use TodoWrite to
     track which clusters still need running.
3. Do not generate code in this command. The team will invoke
   /workshop-feature when they're ready to build.
```

### `/workshop-feature` — start (or resume) a feature build

Path: `.claude/skills/workshop-feature/SKILL.md`

```markdown
---
name: workshop-feature
description: Start a per-feature build. Pass the feature number as argument (e.g. /workshop-feature 4). Loads the SDD + module foundation docs, sets up a TodoWrite plan from the per-feature loop, and begins the build.
---

The team is starting work on the feature whose number they passed as the
argument to this command. If no number was passed, ask them which feature
(reference the sequence in workshop-bundle/06-initiator/generic.md
section 8).

Steps:

1. Read workshop-bundle/04-sdd/<NN>-<feature>.md end-to-end. If the SDD
   doesn't exist, generate it from the relevant module foundation doc
   before any implementation code, and confirm the spec with the team.
2. Read every module foundation doc the SDD references, in full. Use the
   Read tool directly on workshop-bundle/02-module-foundations/<name>.md.
3. Read workshop-bundle/03-foundations-chapter.md if this feature touches
   HTTP / auth / currency / errors (it almost always does indirectly).
4. Re-skim sections 5 and 6 of workshop-bundle/06-initiator/generic.md to
   confirm the team's locked conventions.
5. Use TodoWrite to build a plan covering the per-feature loop from
   generic.md section 10:
   - Read SDD + foundation docs (mark complete after step 1-3)
   - Confirm team profile covers needed choices
   - Walk the team through the plan (file list, key types, write order)
   - Generate the feature in the agreed conventions
   - Wire to prior features' surfaces
   - Run end-to-end against staging
   - Update SDD if reality diverged
   - Update section 8 checklist in generic.md
6. Present the plan to the team. Wait for "go" before writing any code.

Hard reminders before you start:
- One feature at a time. Don't pre-build the next one.
- WAITING / AWAITING_CLIENT are success-path states on payment.
- paymentDetails captures; payment makes. Don't blur.
- After basket seating, diff to find new entries.
- Don't pass basket_id on broad catalogue reads.
```

### `/workshop-status` — print where the workshop is

Path: `.claude/skills/workshop-status/SKILL.md`

```markdown
---
name: workshop-status
description: Print current workshop progress — which features are done per the section 8 checklist, which is next, what's blocked. Useful for handover between team members or after a break.
---

Print a concise status report. Do not generate code.

Read workshop-bundle/06-initiator/generic.md section 8 (Feature sequence)
and section 9 (Validation checklist).

Report:

1. **Done** — features whose checkbox is ticked in section 9. List by
   number and name.
2. **In progress** — the most recent feature where some but not all
   sub-items are done. State which sub-items remain.
3. **Next up** — the next feature in section 8 whose dependencies are met.
4. **Blocked** — any feature whose dependencies aren't met, with the reason.
5. **Open questions** — any "TBD" markers in sections 4-6 of generic.md.
6. **Background subagents** — if you've spawned any via the Agent tool
   that are still running, name them and what they're working on.

Format as a short markdown report. No code generation, no edits.
```

---

## Subagent orchestration — parallel work streams via the Agent tool

This is Claude Code's superpower for the workshop. The `Agent` tool spawns a subagent with its own context window and its own conversation; passing `run_in_background: true` lets the main session keep coaching the team while the subagent builds a feature on the side.

> If your team's Claude Code version doesn't expose the `Agent` tool, or doesn't support `run_in_background`, ignore this section and stick to the sequential baseline in `generic.md` section 11. The workshop is achievable sequentially.

### Subagent prompt template — parallel feature build

Copy-paste, fill the `[BRACKETS]`. The main session passes this as the `prompt` argument to the `Agent` tool.

```
You are a parallel workshop implementation subagent for the Contabo
cart + customer-panel prototype. The handover bundle is at
workshop-bundle/ in this workspace.

Read these files in full using the Read tool before generating any code:

  workshop-bundle/06-initiator/generic.md
  workshop-bundle/06-initiator/claude-code.md
  workshop-bundle/04-sdd/[NN-feature].md
  workshop-bundle/02-module-foundations/[primary-module].md
  [workshop-bundle/02-module-foundations/<secondary-module>.md ...]
  workshop-bundle/03-foundations-chapter.md   # if you touch HTTP / auth / currency / errors

Sections 4, 5, 6 of generic.md are filled in — the team's stack and
architecture are locked. Respect them exactly. The relevant values are:

  Framework:      [from section 5]
  Styling:        [from section 5]
  State / data:   [from section 5]
  HTTP client:    [from section 5]
  Folder layout:  [from section 6]
  Module pattern: [from section 6]
  HTTP layer:     [from section 6]

Your task: implement feature [NN] end-to-end per its SDD. Follow the
per-feature loop in generic.md section 10. Use TodoWrite to track your
sub-steps so the main session can see progress.

Scope boundaries (do NOT cross):
- Do not modify the foundations layer — it's owned by the main session
  or another stream.
- Do not start work on feature [N+1] or any other feature.
- Do not touch files outside this feature's directory unless wiring to a
  prior-feature surface that already exists.

If you hit a real blocker — missing SDD content, contradictory foundation
doc, ambiguous endpoint shape — stop, commit what you have on a branch
named "feature/[NN-short-name]", and write a short summary of the blocker
as your final message. Do not guess.

When done:
- Every checklist item in the SDD passes.
- The feature runs end-to-end against the staging API.
- You've committed in logical chunks with clear messages.
- Your final message is a short summary: what you built, files touched,
  any deviations from the SDD, anything the main session needs to know
  before merging.
```

### When to spawn one

Refer to `generic.md` section 11's parallel-safe pairs. The Claude Code mechanic is:

| Foreground stream (main session) | Background subagent |
|---|---|
| Feature 1 (auth) | Feature 2 (brand bootstrap) |
| Feature 3 (catalogue grid + categories) | Feature 7 (panel scaffolding, mocked reads until feature 6 lands) |
| Feature 5 (checkout address UI) | Feature 6 (payment SDK handshake plumbing) |

The main session spawns one subagent per stream. The subagent reads its own SDD + foundation docs; it has no memory of the foreground chat. The main session keeps coaching the team and reviews each subagent's branch when it surfaces a completion summary. Merge before moving on.

### Subagent caveats specific to Claude Code

- **Subagents share the workspace but not the conversation.** They cannot ask the team clarifying questions in real time, and they cannot see what's been discussed in the main session. Give them enough in the spawn prompt to drive a feature end-to-end against the staging API.
- **Subagents inherit the workspace's git state.** Have the subagent create and check out its own branch as its first action — otherwise concurrent subagents will trample each other's commits on the same branch.
- **Subagents may or may not inherit `CLAUDE.md`** depending on the Claude Code version. To be safe, the spawn prompt above re-states the hard rules. Don't rely on `CLAUDE.md` being silently picked up.
- **Token budget.** Each subagent burns through its own context. For a feature whose SDD + foundation docs total > 30k tokens, brief the subagent on what to skip-read vs deep-read.

### Rules when going parallel (restated from `generic.md` section 11)

1. **Lock the contract at the boundary before splitting.** In the foreground chat, agree the shape of what stream A hands to stream B (token format, fetcher signature, types at the seam). Then spawn the subagent.
2. **Each subagent re-reads its own foundation doc + SDD.** No cross-contamination.
3. **One human reviewer per stream.** Two people steering one subagent creates conflicting steers.
4. **Merge before moving on.** Don't pile feature N+1 on top of two un-merged streams.

---

## Hooks (optional, but useful for the workshop)

Two hooks worth setting up in `.claude/settings.json` (or `.claude/settings.local.json` if the team wants them off-by-default for other contributors). Hook syntax varies slightly between Claude Code versions; if the keys below don't match your version, the principle still applies — wire the equivalent.

### Pre-tool-use hook on `Bash` — workshop safety net

Block destructive commands and remote pushes. The workshop is local-only; nothing should leave the laptop.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const i=JSON.parse(require('fs').readFileSync(0,'utf8'));const c=i.tool_input.command||'';const bad=[/\\brm\\s+-rf\\b/,/\\bgit\\s+push\\b/,/\\bcd\\s+\\//,/sudo\\s+rm/];for(const p of bad){if(p.test(c)){console.error('Workshop guard: blocked '+c);process.exit(2);}}\""
          }
        ]
      }
    ]
  }
}
```

The team can lift specific blocks if they genuinely need them (e.g. allow `git push` on Day 2 when the prototype goes to a shared repo) — edit the regex list. The point is the safety net exists.

### Post-tool-use hook on `Edit` / `Write` — surface the validation checklist

After every code-changing edit, remind the agent (and the team watching) to revisit the per-feature SDD's checklist. This is a soft nudge, not a block — it just prints to the agent's transcript.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: when this feature is built, validate against the SDD checklist + generic.md section 9 before marking done.'"
          }
        ]
      }
    ]
  }
}
```

### UserPromptSubmit hook (optional) — auto-tag workshop context

If the team wants every prompt to implicitly include "you're working on the workshop", a `UserPromptSubmit` hook can append a one-line context tag. Most teams find `CLAUDE.md` enough; only reach for this if context loss across long sessions becomes a real issue.

---

## TodoWrite usage for the workshop

The team sees the agent's todo list in real time — it's the cheapest progress indicator you get.

- **One TodoWrite call at the start of each feature**, listing the per-feature loop steps from `generic.md` section 10 (read SDD, read foundation doc, plan, generate, wire, validate, update SDD, mark done).
- **Mark items `in_progress` as you start them and `completed` as you finish.** Only one item `in_progress` at a time.
- **Don't track trivia.** Skip "open file X", "save file Y". Track the substantive steps the team would care about checking off.
- **For parallel subagents**, the main session keeps a top-level todo list (the foreground stream); each subagent runs its own internal TodoWrite — don't try to share one list across processes.

---

## Build cadence — step vs factory mode

The Kickoff Interview (`generic.md` section 10, cluster 5) locks the team's cadence into `section 5: cadence:` of `generic.md`. Two modes:

### Step mode (default)

- Team types `/workshop-feature <NN>` to start each feature.
- Agent presents a plan, waits for "go", builds, validates, commits, stops.
- Team types `/workshop-feature <NN+1>` when ready.
- This is the per-feature loop documented below.

### Factory mode

When `cadence: factory` is locked, you (the agent) drive the sequence end-to-end without per-feature prompting from the team. You still pause for gates that matter — the team isn't asleep, they're spot-checking.

**Factory loop** (replaces the per-feature loop below for mode = factory):

1. After completing feature N (validation green, committed), do **not** stop and wait.
2. Announce in one line: `Feature N done — starting N+1 ([name]) in 30s. Type "pause" to stop, "skip" to jump to N+2, "review" to walk the diff.` Use a TodoWrite update to reflect the transition.
3. If the team says nothing within ~30s of conversational silence (or they say "go" / "continue"), invoke the equivalent of `/workshop-feature <NN+1>` automatically — read the SDD, set up the plan, present it.
4. **You still wait for "go" on the *plan*** for the new feature. The plan walkthrough is the cheap-to-correct moment; the team has to see it. The change vs step mode is that the team doesn't have to *initiate* — they only have to *approve or redirect*.
5. Build, validate, commit. Loop to step 1.

**Stop conditions (auto-pause, do not auto-advance):**

- Validation fails on the current feature.
- An SDD step is ambiguous, contradictory with a foundation doc, or missing.
- A foundation doc itself looks wrong.
- The team's recorded `stop_conditions:` from cluster 5 fires (e.g. "before payment").
- The team says "pause", "stop", "wait", "hold on", or any clear interruption.
- A subagent surfaces a blocker.
- **No-approver scenario: 3+ permission prompts in a row with no human approval observed in conversation.** If you're auto-advancing through features and Bash / MCP / Write calls are queued for approval while the team is offsite, **stop**. Without live validation, factory-mode code accumulates unverified bugs (this is a documented failure mode from a previous workshop run). Surface the queued prompts, mark the in-progress todo as blocked on approval, dump current state, and wait. Do not produce more feature code while approvals are stalled.

On any stop condition: announce why, mark the in-progress todo as blocked, dump current state, and wait.

**Parallel subagents in factory mode:**

When the dependency graph in `generic.md` section 8 + the parallel-safe pairs in section 11 allow it, spawn a background subagent for the parallel stream as soon as the foreground stream's gating dependency lands. Specifically:

| Foreground stream finishes | Spawn background subagent for |
|---|---|
| Feature 0 (scaffold) | — (feature 1 must be foreground; the team needs to watch auth land) |
| Feature 1 (auth) — foreground continues with feature 3 | Feature 2 (brand bootstrap) |
| Feature 4 (basket) — foreground continues with feature 5 | Feature 7 (panel scaffolding, mocked reads) |
| Feature 5 (checkout address) — foreground continues with feature 6 | (already parallel with feature 6 plumbing if scoped per generic.md §11) |

Use the subagent prompt template earlier in this file. **Merge before moving on past the parallel pair's merge point** — never let two unmerged streams pile up.

**Factory mode reporting cadence:**

- After every commit: one-line status to the team.
- After every parallel-subagent completion: surface its summary message, propose a merge.
- After every stop condition: full context dump.
- Every ~hour of wall-clock time: a `/workshop-status`-shaped digest unprompted.

**Switching modes mid-workshop:**

The team can say "switch to step mode" or "go factory" at any time. Update `cadence:` in `generic.md` section 5 to reflect the change. Don't litigate the choice — they're in the driver's seat.

---

## Per-feature loop in Claude Code

A Claude Code-specific restatement of `generic.md` section 10's per-feature loop. Principles are the same; mechanics adapt.

1. **`/clear` if the previous feature is fully merged and validated.** Fresh context per feature keeps the agent focused — no bleed from feature N-1's debugging. Then `/workshop-kickoff` to rehydrate.
2. **Invoke `/workshop-feature <NN>`.** The skill loads the SDD + foundation docs + sets up the TodoWrite plan.
3. **Review the plan before any code.** Push back on misreads of the SDD now, not after.
4. **Approve, then let the agent build.** Multi-file `Edit` / `Write` calls happen automatically.
5. **Watch the diffs.** Claude Code surfaces per-file diffs as the agent writes; the team reviews inline.
6. **Iterate** via follow-up prompts in the same session — context is retained.
7. **Run the feature end-to-end against staging.** Confirm against the SDD's checklist and `generic.md` section 9.
8. **Commit** when green. One commit per feature is typical.
9. **Update the SDD** if reality diverged: "update `workshop-bundle/04-sdd/<NN>-<feature>.md` to reflect what we actually built". The agent uses `Edit` to do this in place.
10. **Tick the section 8 checklist** in `generic.md`. The agent does this too.
11. **`/workshop-status`** to confirm where you are, then start the next feature.

If a feature spans more than ~90 minutes of work, consider `/compact` once mid-feature to keep the context window healthy. Don't `/clear` mid-feature — you'll lose the agent's working memory of file shapes it just wrote.

---

## Settings recommended for the workshop

These go in `.claude/settings.json` (or `.claude/settings.local.json`) at the repo root. None are strictly required; all smooth the experience.

### Permissions allowlist

The agent drops a pre-built `.claude/settings.json` at the repo root as step 0 of the loading prompt. The template lives at [`templates/.claude/settings.json`](./templates/.claude/settings.json) and ships with a **broad sandbox allowlist** suitable for a 2-day prototype — every common dev-loop tool (all major package managers, framework CLIs, test runners, network tools, mkcert / Caddy, common UNIX utilities) is pre-approved. Denies cover the destructive cases (`rm -rf /`, `sudo rm`, `git push --force`, remote `git push`).

After the Kickoff Interview, the agent tailors the allowlist — typically pruning the unused package managers (e.g. removing `npm`/`yarn`/`bun` if the team locked `pnpm`) and adding any stack-specific CLIs the chosen framework needs.

If the workshop later needs to allow `git push` (e.g. Day 2 when the prototype goes to a shared repo), edit the `deny` list to remove that line.

**Hot-reload note:** Claude Code reads `.claude/settings.json` at session start; if you edit it mid-session, restart Claude Code (or run `/config reload` if your version supports it) for the changes to take effect.

**MCP permission syntax — different from Bash.** MCP-tool permissions use the wire-format pattern `mcp__<server-name>__<tool-name>` (double underscore between segments) and accept a trailing `*` wildcard. NO parentheses, unlike `Bash(...)`:

- `mcp__plugin_playwright_playwright__*` — allow every Playwright MCP browser tool (navigate, click, evaluate, snapshot, etc.) without per-tool approval.
- `mcp__claude_ai_Linear__*` — allow every Linear MCP tool (read/save issues, search, etc.).
- `mcp__plugin_playwright_playwright__browser_navigate` — allow a single specific tool (no wildcard).

**Common mistakes to avoid:**

- ❌ `mcp__plugin_playwright_playwright(*)` — Bash-style parens; doesn't match.
- ❌ `Bash(mcp__...)` — MCP tools are not Bash invocations.
- ❌ `mcp__plugin_playwright_playwright__browser_*` — partial-segment wildcards are not supported; use full suffix `__*`.
- ✅ `mcp__plugin_playwright_playwright__*` — the correct shape.

This syntax is **undocumented in most Claude Code release notes** but it's what the harness expects. The template ships with the wildcards for the MCP servers commonly attached to a workshop session (Playwright + Linear + Notion + Figma); add others as needed during STEP 4 of the loading prompt.

### Model

Pin to **Claude Opus** or **Claude Sonnet** (4.5+). The workshop assumes high-capability — switching to a smaller model mid-workshop creates inconsistent output. If the team's plan supports it, Opus is the safer bet for the multi-file SDD reads and the cross-doc reasoning the per-feature loop demands.

### Compact threshold

If your version supports configuring when auto-compact fires, set it high so the agent doesn't lose mid-feature working memory. Manual `/compact` between features is the cleaner pattern.

### MCP servers (optional)

If the team uses MCP-backed integrations (e.g. a Postgres MCP for poking the staging DB, a Figma MCP for screen references), wire them in `.mcp.json` before the workshop starts. The workshop scope doesn't require any; mention them only if the team specifically asks. Adding MCP mid-workshop steals time.

---

## What this layer does NOT change vs `generic.md` / `cursor.md`

These are owned by the prior layers and not overridden here:

- The mission, scope cut, and BUILT vs DOC'D-ONLY split (`generic.md` sections 1-3)
- The kickoff interview questions themselves (`generic.md` section 10, Step 0)
- The feature sequence and dependency graph (`generic.md` section 8)
- The validation checklist / definition of done (`generic.md` section 9)
- The 10 operating principles (`generic.md` section 10)
- The parallel-safe pairs and rules for going parallel (`generic.md` section 11)
- The workshop day shape (`generic.md` section 11)
- Anything in sections 4, 5, 6 of `generic.md` (filled in during the kickoff interview, not pre-written)
- The Cursor-layer mechanics that don't have a Claude Code analogue (notepads, Composer vs Chat modes, `@docs` references) — these don't apply here; the equivalents above (slash skills, `Read`-tool-on-bundle-paths, `CLAUDE.md`) cover the same intent

If the team finds tension between this layer and the prior ones, **the earlier layer wins**. Surface the tension to the workshop facilitator — the initiator should be tightened, not worked around.
