# scenarios

> A generated, replayable page for any scope-based composable — write one small file, get a working table or form, plus a transport bar that can play a module's own written-down scenarios back on demand.

## What Is This?

Every scoped composable in this codebase can get its own page here — without anyone hand-writing that page. Point a small declaration file at a composable, and this module gives you:

- a **table**, or a **card grid**, or both, over that composable's own list — with real filtering, sorting, and paging, all driven off the composable's own schema, not reinvented per page;
- an **editor**, opened from a row or from a header button, for anything the composable can create or change;
- a **transport bar** that can arm one of the module's own written scenarios and step it, scene by scene, so someone reviewing the module can just press play instead of clicking through it themselves; and
- a way to **force** the page into a state that's normally hard to catch on demand — loading, empty, or a specific recorded failure — using only data that has genuinely been captured from the real API.

Think of it as a generated demo app for one module at a time, that never goes stale, because it is drawn fresh from the composable every time the page loads rather than hand-maintained beside it.

> **🧪 For anyone reviewing a module:** open its page, click the module's name on the transport bar, and hit play. You are watching real calls against a recorded, faithful copy of the API — nothing here is invented on the fly.

## Quick Start

Building a page for an existing scoped composable:

```text
/factory module=packages/headless/src/modules/<your-module>/ playground=page
```

That's it — the door reads the composable, its schemas, and its scope matrix, and writes the two files a page needs (its declaration and its presentation). You only touch anything by hand afterwards if you want to tune a renderer choice, an action's placement, or the module's icon.

Building both the composable and its page in one pass, starting from nothing:

```text
/factory jtbd="..." module=packages/headless/src/modules/<your-module>/ mode=net-new variant=query cells=client×self playground=both
```

See [usage.md](./usage.md) for the full walkthrough, including what a generated declaration and presentation file actually look like.

## Features

- Table and card views over the same declared fields, toggled by the reader.
- A column picker — every declared field is offerable, with a sensible default set.
- Real per-cell renderers (text, date, a filled/outline icon, badges), each independently registered.
- Row actions and a header action, gated by the record's own capability flags — never a client-side guess.
- An inline editor handoff for add/edit, seeded from the row where relevant.
- Filters and sort read straight from the composable's own query schema — no second declaration to keep in step.
- A shareable URL for the current view, opt-in per page.
- Only the actors a module actually supports are offered on the scope switch.
- A transport bar that plays a module's own written scenarios: play / pause / step / scrub / jump-to-scene.
- On-demand forcing of loading / empty / one-action-failing / whole-collection-failing states, from genuinely recorded data.
- Debug, Code, and Scenario panes for inspecting exactly what a page is doing and why.

## Key Concepts

### One declaration, one page, no page file to maintain

A directory holding a declaration file *is* a route. There is no separate `.vue` page per module to write or to keep in sync — the one shared page component reads the declaration for whichever route it was given and draws accordingly.

### The composable is the single source of truth

A declaration never restates a fact its composable already owns — what's filterable, what's sortable, the editor's form, which actors are offerable. If you're wondering why a declaration has no `sort` field or `form` field, that's deliberate: see [architecture.md](./architecture.md).

### A scenario, recorded once, drives replay everywhere

A module that keeps its capability spec and step definitions at their conventional location is automatically eligible to have those scenarios played back on its own page — nothing is registered by hand.

## Documentation

- [foundation.md](./foundation.md) — what this module is, its core concepts, and what it can do, in one place.
- [usage.md](./usage.md) — the walkthrough: from "I have a scoped composable" to "I have a working page," and how to change one afterwards.
- [architecture.md](./architecture.md) — how a page comes to exist, and how the runtime pipeline fits together end to end.
- [gotchas.md](./gotchas.md) — traps worth knowing before you touch a declaration or a presentation file.
- [CHANGELOG.md](./CHANGELOG.md) — what changed, and when.

For the tool that generates and upgrades pages in this module, see the factory's own docs: [`.claude/skills/factory/docs/README.md`](../../../../../.claude/skills/factory/docs/README.md).
