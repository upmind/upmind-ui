# Loading prompt — paste this into your agent on Day 1

> This is the **one thing the team types** to boot the workshop. Pick the section below that matches your agent tooling and paste it verbatim into the first prompt of a fresh session. The agent owns the workshop from there.

## Which section to pick

| Your agent | Section to paste |
| --- | --- |
| **Claude Code** (CLI or VS Code extension) | [Claude Code](#claude-code) |
| **Cursor** | [Cursor](#cursor) |
| **Aider / Codex / Copilot Workspace / Anthropic API direct / anything else** | [Generic](#generic) |

The three variants are layered — the Claude Code prompt builds on Cursor's, which builds on the generic baseline. The agent reads the full initiator file it's pointed at (`06-initiator/claude-code.md` / `cursor.md` / `generic.md`) and follows it from there.

## Before you paste

1. Create an **empty git repo** in the folder you want the prototype to live in. The workshop will scaffold inside it.
2. **Drop the bundle into the repo:** `tar -xzf workshop-bundle.tar.gz` at the repo root. You should now have `workshop-bundle/` next to `.git/`.
3. **Launch your agent** with the repo as the working directory. `pwd` should print the repo root.
4. **Confirm the prerequisites** — local DNS pointing your brand domain at 127.0.0.1, TLS strategy (mkcert / Caddy / plain HTTP on alt port) decided. The Kickoff Interview will probe these but having an answer ready speeds Day 1.
5. **Paste the prompt below.** Don't edit it — the agent's STEP 0 expects exact paths.

---

## Claude Code

Paste this verbatim into the first Claude Code prompt of a fresh session.

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

---

## Cursor

Paste this into a fresh Cursor Chat (or Composer) session. Make sure the workshop bundle and the repo are both indexed so `@workshop-bundle/...` references resolve.

```
You are the workshop implementation agent for a 2-day cart + customer-panel
prototype build against the Upmind back-end. The handover bundle is at
workshop-bundle/ in this repo.

Read these two files end-to-end, in this order:

  @workshop-bundle/06-initiator/generic.md
  @workshop-bundle/06-initiator/cursor.md

After reading:

1. Confirm in one short message that you've loaded both files and
   understand the mission (generic.md section 1), the feature sequence
   (section 8), the operating principles (section 10), and the Cursor
   adaptations (cursor.md).

2. Drop the safety-net rules into place. Cursor reads `.cursorrules` at
   the workspace root. If one doesn't exist, create it from
   `@workshop-bundle/06-initiator/cursor.md` — copy the content between
   the "BEGIN .cursorrules" and "END .cursorrules" markers verbatim. If
   one exists, leave it alone.

3. Run the Kickoff Interview (generic.md section 10, Step 0) against me.
   One cluster at a time. Ask in plain language. Capture my answers
   verbatim into sections 4, 5, and 6 of generic.md as you go — edit the
   file in place. Read each cluster back to me and wait for "confirmed"
   before moving on.

4. After the interview, confirm cadence preference (step / factory — see
   cluster 5). Record in section 5.

5. Do not generate any project code until steps 1–4 are complete and I've
   confirmed. Then build per the per-feature loop in generic.md section
   10.

If I interrupt to start coding, finish the cluster you're on, capture
what you have, mark the rest "TBD — ask when relevant", and continue.
```

---

## Generic

Paste this into any agent that can read repo files and write code (Aider, Codex, Copilot Workspace, Anthropic API direct, custom scripts). Adapt the path-reference syntax to your agent's conventions if it doesn't use bare relative paths.

```
You are the workshop implementation agent for a 2-day cart + customer-panel
prototype build against the Upmind back-end. The handover bundle is at
workshop-bundle/ in this repo.

Read this file end-to-end:

  workshop-bundle/06-initiator/generic.md

After reading:

1. Confirm in one short message that you've loaded the file and understand
   the mission (section 1), the feature sequence (section 8), and the
   operating principles (section 10).

2. Run the Kickoff Interview (section 10, Step 0) against me. One cluster
   at a time. Ask in plain language. Capture my answers verbatim into
   sections 4, 5, and 6 of generic.md as you go — edit the file in place.
   Read each cluster back to me and wait for "confirmed" before moving
   on.

3. After the interview, confirm cadence preference (step / factory — see
   cluster 5). Record in section 5.

4. Do not generate any project code until steps 1–3 are complete and I've
   confirmed. Then build per the per-feature loop in section 10.

If I interrupt to start coding, finish the cluster you're on, capture
what you have, mark the rest "TBD — ask when relevant", and continue.
```

---

## After the prompt — what happens next

The agent runs the Kickoff Interview (~10–20 minutes), captures your stack / architecture / cadence choices into `06-initiator/generic.md` sections 4–6, then waits for you to start the first feature.

For Claude Code: type `/workshop-feature 0` to begin the scaffold + foundations build. Per-feature loop continues from there.

For Cursor / Generic: tell the agent "start feature 0". Same per-feature loop.

The full feature sequence (8 features, 0 through 7) is in `06-initiator/generic.md` section 8. The agent works through them in order; each has its own SDD under `04-sdd/`.

## If the agent gets stuck

- **Permission prompts piling up** (Claude Code) — the safety-net `.claude/settings.json` should cover most. If you're hitting a new MCP tool, the wildcard pattern is `mcp__<server-name>__*` (no parentheses). See `06-initiator/claude-code.md` "Permissions allowlist" section.
- **The agent invents an endpoint or shape** — push back, point at the relevant module foundation doc under `02-module-foundations/`. The doc is the source of truth.
- **A foundation doc itself looks wrong** — that's a real find. Surface it; the maintainer will fold it back into the next bundle.
- **A 404 on the first API call** — check the `/oauth/*` vs `/api/*` path prefix routing per `03-foundations-chapter.md` §1.1. Most common day-0 failure.

After the workshop, the agent runs the retro prompt in `feedback-prompt.md` and produces a `RETRO-<date>.md` — bring it back to the workshop maintainer for the next bundle iteration.
