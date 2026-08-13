# /factory — developer guide

> One door, two lanes: build a scoped composable, build the page that proves it, or both in one pass.

This is the developer-facing guide to the `/factory` skill itself — what it is, how it works, and how to invoke it properly. If you want to understand what gets *built* — the declaration contract, the renderers, the replay and forcing mechanism — read the playground's own docs instead: [`playgrounds/labs-nuxt/modules/scenarios/docs/`](../../../../playgrounds/labs-nuxt/modules/scenarios/docs/README.md). This guide is about the tool, not its output.

## What it is

`/factory` is a single entry point that produces two things a module can need, chained so you never answer the same question twice:

1. **A scoped composable** — the headless implementation of a business capability, built to this codebase's actor-aware, scope-based pattern.
2. **Its playground page** — a generated, working demonstration of that composable: a table or a form, filtering and sorting, an editor, and a replayable set of scenarios drawn straight from the module's own capability spec.

Before this door existed, the second half had exactly one example in the whole codebase, hand-built, with nothing capturing how to build the next one. `/factory` turns "build the page" into the same kind of repeatable, derived process "build the composable" already was.

Internally it is one door in front of two lanes:

- the **composable lane** — everything the codebase already had for building a scoped composable end to end (research, plan, code, tests, verify, review, docs), unchanged in substance, just moved under this door;
- the **scenario lane** — new: it reads a *landed* composable and derives its page from it, asking nothing.

Neither lane is invoked on its own. You always talk to the door.

## How it works

### One shared intake, asked once

Before anything runs, the door collects seven things — the module's job to be done, the target module, whether this is a conversion of something existing or a net-new module, which of three structural variants it is, which actor×context cells are in scope, where the work happens, and which route to take. Answer any or all of them in your invocation and the door will not ask again for what you already gave it; a genuinely missing or contradictory answer is one blocking question, never a batch, and never a silent default (except the route, which defaults to building both halves).

### A precondition that refuses rather than guesses

Every route, before anything runs, checks that the module you named actually carries the scope-based shape (it exports its own scope matrix and is driven through the standard actor-scoping accessors). If it does not, the door refuses outright and says exactly which module and which part of the shape is missing — it never half-builds a page over a module that is not really ready for one, and it never invents the missing shape on your behalf.

### Three routes

| Route | What it does | When to reach for it |
| --- | --- | --- |
| **`both`** (the default) | Builds the composable end to end, then the page over the module it just landed | Starting from nothing — you have a job to be done and neither the module nor its page exists yet |
| **`composable`** | Builds only the composable; stops before the page | You specifically don't want a page yet (rare — the page is how anyone else actually sees the module work) |
| **`page`** | Builds only the page, over a module that already exists | The composable landed separately (by hand, or in an earlier run) and just needs its demonstration |

### Add-or-update, always

Whichever route you take, it creates whatever is missing and brings whatever already exists up to the current shape — nothing is skipped because a file happens to already be there. Run the same command again over a module whose page already exists, and it re-derives that page from the module as it stands *today*, rewriting the declaration and presentation files in place, and reports exactly what changed. There is no separate "review this diff before it lands" step and no shadow output folder — `git` is how you see, and if needed recover from, what a re-run changed. Because of that, a re-run over a page carrying uncommitted local edits is refused before it writes anything: commit first, or the re-run has no way to tell your tuning apart from something safe to overwrite.

### The scenario lane asks nothing

On the default route, the module the page will be built over does not exist yet at the point you're answering the intake — so there is nothing about the page's own surface for you to answer. Everything the page needs (its table columns, its filter and sort options, which actors it can offer, whether it has an editor) is read off the *landed* module, its schemas, and its own capability spec, once the composable half is done. You tune the result afterwards by editing the generated files directly — that's what they're there for.

## How to use it properly

### Building a page for a composable that already exists

```text
/factory module=packages/headless/src/modules/<your-module>/ playground=page
```

This is the everyday case once a module is already scoped: point the door at it, and it derives and writes the page.

### Building a composable and its page together, starting from scratch

```text
/factory jtbd="let a consumer manage <the capability>" module=packages/headless/src/modules/<your-module>/ mode=net-new variant=query cells=client×self playground=both
```

`playground=both` is the default even if you omit it — it's written out here for clarity. The composable lane runs to its own completion first; the door only opens the scenario lane once that lane's own documentation stage is green, because deriving a page from a module that might still change underneath it would be a guess dressed up as a page.

### Converting an existing, not-yet-scoped implementation

```text
/factory jtbd="port <the legacy capability> at full parity" module=packages/headless/src/modules/<your-module>/ mode=conversion cells=client×self,staff×admin-context playground=both
```

For a conversion, the variant (which of the three structural shapes the module ends up as) is *derived* from what the thing you're replacing actually looks like, rather than asked outright — naming `variant=` yourself is treated as an override, and if your override disagrees with what the lane derives, the run halts and shows you both determinations rather than silently picking one.

### What to check when a run finishes

- Read the run's own report before the diff — it names every channel or field that changed, so you're reading the diff with the "why" already in hand.
- If the run built a page, open it and look at the two files it wrote: the declaration (what composables it boots, its handoffs, what module's scenarios it plays) and the presentation (its table, card, and actions). [The playground's usage guide](../../../../playgrounds/labs-nuxt/modules/scenarios/docs/usage.md) walks through both, field by field, against a real example.
- Tune the module's icon by hand — the door leaves a placeholder there deliberately, since naming it is a judgement call, not a derivation.
- If anything about the derived page looks wrong (a field excluded that shouldn't be, a renderer that doesn't fit), that is a legitimate hand edit to the presentation file — it survives future re-runs as long as it is committed first.

## The two lanes, briefly

**The composable lane** dispatches this codebase's existing research → plan → code → tests → verify → review → docs pipeline for a scoped composable, unchanged from before this door existed — only its entry point moved. If you're debugging *that* lane specifically, its own conductor file is the authority: [`composable/SKILL.md`](../composable/SKILL.md).

**The scenario lane** derives everything it writes from the landed module: which composables to boot, the table's columns and their renderers, the card layout, the offered actions, and whether the module has anything on its own capability spec worth wiring up to the page's transport bar. It writes no source file inside the composable's own package — its two files are the playground declaration and its presentation, and everything about the module's own tests it touches is additive, never a rewrite of what's already there. Its own conductor file, for anyone extending this lane itself, is [`scenario/SKILL.md`](../scenario/SKILL.md).

## Further reading

- [`playgrounds/labs-nuxt/modules/scenarios/docs/`](../../../../playgrounds/labs-nuxt/modules/scenarios/docs/README.md) — what a page actually is once it's built, and how to change one by hand afterwards.
- [ADR 033](../../../../docs/adr/033-scenario-declaration-contract.md) — why the declaration a page reads from is shaped the way it is.
