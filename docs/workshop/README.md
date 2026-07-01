# Workshop — Contabo Cart + Customer Panel Prototype

This folder holds the materials for a 2-day, hands-on, agent-assisted workshop where the Contabo team builds an e-commerce cart + customer panel prototype against the Upmind back-end.

> **Audience for this README:** anyone running the workshop or preparing the handover bundle. Not the Contabo team — they receive the handover bundle, not this folder.

---

## What's in here

| File / folder | Purpose |
| --- | --- |
| [contabo.md](./contabo.md) | The locked plan — scope cut, deliverables, day shape, audience, output format. Reference, not a living doc. |
| [status.md](./status.md) | Living progress tracker. Updated as deliverables land. |
| [HANDOFF.md](./HANDOFF.md) | Notes from the autonomous orchestration run (decisions made, things to spot-check). |
| [foundations.md](./foundations.md) | Cross-cutting concerns (HTTP / auth / currency / errors) the prototype's foundations layer implements. |
| [build-your-own-core.md](./build-your-own-core.md) | Post-workshop architect synthesis — how to design your equivalent core for production. |
| [bundle-manifest.md](./bundle-manifest.md) | Source→bundle slot mapping + verification checklist. |
| [build-bundle.sh](./build-bundle.sh) | One-shot bash script that assembles the handover bundle. |
| [_initiator/](./_initiator/) | The kickoff prompt the team feeds to their AI agent on Day 1. Three layered variants: `generic.md` (base) · `cursor.md` (adds Cursor scaffolding) · `claude-code.md` (adds Claude Code orchestration). |
| [sdd/](./sdd/) | Per-feature SDDs (`00-scaffold.md` → `07-panel.md`) — drives the workshop vibe coding. |
| [references/](./references/) | Fixture index + any other lookup material. |

Workshop-adjacent docs that live **outside** this folder:

| Artefact | Home | Why there |
| --- | --- | --- |
| Module foundation docs | `packages/headless/src/modules/<module>/docs/foundation.md` | Lives next to source so it doesn't drift. Copied into the bundle by `build-bundle.sh`. |
| Doc-shape decisions (ADR) | [docs/adr/019-module-doc-shape.md](../adr/019-module-doc-shape.md) | Architectural record; living rule at [.agent/rules/docs-modules.md](../../.agent/rules/docs-modules.md). |
| Captured API fixtures | `tests/fixtures/recordings/` | 93 fixtures. Lives with the test infrastructure that captures them. Copied into the bundle by `build-bundle.sh`. |

---

## How to run the workshop

### 1. Pre-workshop (~1 day before Day 1)

1. **Confirm Contabo's stack + agent tooling.** Are they using Cursor? Claude Code? Something else? This determines which initiator variant they get.
2. **Spin up a staging brand** on Upmind for the workshop. Note the brand domain, brand UUID, and API base. The team needs these on Day 1 for the kickoff interview (section 4 of the initiator).
3. **Stripe test mode** on the staging brand — confirm 3DS happy-path works with `4000 0027 6000 3184` or the team's preferred test card.
4. **Verify all module foundation docs are at ≥ 90/100.** Track via [status.md](./status.md). Anything below the bar gets a quick polish before the workshop.
5. **Build the handover bundle** — `./docs/workshop/build-bundle.sh && tar -czf contabo-workshop.tar.gz contabo-workshop`. The team unzips this on Day 1.

### 2. Day 1 + Day 2

The team runs the bundle. Day shape is in [contabo.md](./contabo.md) section "Workshop day shape". Upmind guides; Contabo's hands are on the keyboard.

### 3. Post-workshop

The handover bundle stays with the team. No ongoing agent / no follow-up code support — the docs describe the platform, not Upmind's code, so they don't break when Upmind iterates.

---

## How to use the initiator

The initiator is the **single prompt** the team feeds to their agent at the start of Day 1. It's self-contained — everything the agent needs to drive the 2-day build.

### Which variant to use

| Team's agent | File to use |
| --- | --- |
| Aider · Codex · GitHub Copilot Workspace · Anthropic API direct · anything else | [`_initiator/generic.md`](./_initiator/generic.md) |
| Cursor | `_initiator/cursor.md` *(pending — extends generic)* |
| Claude Code | `_initiator/claude-code.md` *(pending — extends cursor)* |

The variants are **additive / cascading**: `cursor.md` builds on `generic.md`; `claude-code.md` builds on `cursor.md`. The team feeds whichever one matches their tool — they don't manually combine layers.

### What the initiator does

1. **Kickoff interview** — the agent asks the team 28 questions in 4 clusters (staging environment, stack, tooling/conventions, architecture decisions). Captures the answers verbatim into sections 4, 5, 6 of the initiator. Then confirms before any code.
2. **Reference reading** — the agent reads the relevant module foundation docs + per-feature SDD before generating each feature.
3. **Feature loop** — sequential by default, parallel where the dependency graph allows (section 11 of the initiator covers parallel work streams for teams with concurrent agent sessions).
4. **Validation** — checklist in section 9 gates "done".

### Paths

All paths inside the initiator are **bundle-relative** — `02-module-foundations/<name>.md`, `04-sdd/<NN>-<feature>.md`, `07-references/...`. They resolve against the handover bundle root, not against this monorepo. This is deliberate: the initiator must be portable.

---

## The handover bundle

What the Contabo team actually receives. Structure:

```text
workshop-bundle/
├── 01-workshop-plan.md           ← export of contabo.md
├── 02-module-foundations/         ← copies of each module's foundation.md
│   ├── session.md
│   ├── client.md
│   ├── ...
│   └── invoices.md
├── 03-foundations-chapter.md      ← export of docs/developer-handbook/foundations.md
├── 04-sdd/                        ← per-feature SDDs
│   ├── 01-auth.md
│   ├── 02-brand-bootstrap.md
│   └── ...
├── 05-build-your-own-core.md      ← export of docs/developer-handbook/build-your-own-core.md
├── 06-initiator/
│   ├── generic.md
│   ├── cursor.md
│   └── claude-code.md
└── 07-references/
    ├── fixture-index.md           ← pointers to captured API responses + what each demonstrates
    └── canonical-rule.md          ← .agent/rules/docs-modules.md (for the team to iterate the docs post-workshop)
```

Bundle generation is a packaging step — gather these artefacts from their source locations and zip them up. There's no live process; it's a one-shot export before the workshop starts.

---

## Updating the workshop materials

- **Plan changes** (scope, deliverables, day shape) → edit [contabo.md](./contabo.md) and add a `Change log` entry at the bottom.
- **Progress updates** → edit [status.md](./status.md). It's the source of truth for "what's done".
- **Initiator changes** → edit `_initiator/generic.md`. Cascading variants (`cursor.md`, `claude-code.md`) inherit; only override what's genuinely tool-specific.
- **Doc-shape rule changes** → edit [.agent/rules/docs-modules.md](../../.agent/rules/docs-modules.md). If the change is load-bearing (a new section, a renamed required field), bump [docs/adr/019-module-doc-shape.md](../adr/019-module-doc-shape.md) too.

---

## Related reading

- [contabo.md](./contabo.md) — the locked plan, including deliverables table and scope cut rationale
- [status.md](./status.md) — current progress
- [.agent/rules/docs-modules.md](../../.agent/rules/docs-modules.md) — canonical rule for module foundation docs
- [docs/adr/019-module-doc-shape.md](../adr/019-module-doc-shape.md) — *why* the docs look the way they do
