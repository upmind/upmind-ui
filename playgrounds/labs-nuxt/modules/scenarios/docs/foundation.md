# Module: scenarios

## What it is

**scenarios** is the part of this app that turns a scope-based composable into a working page — a table or a form, or both, with filtering, sorting, paging, editing, and a working scope switch — without anyone hand-writing a page for it. A page is not built from a template you edit by hand: it is drawn, at runtime, from one small declaration file plus whatever the composable it names already publishes about itself.

The same system also lets a page **replay** a written-down set of scenarios against itself — arm one, and the page's own transport controls step it scene by scene, so a reviewer can watch exactly what a module does without touching a keyboard — and **force** a page into a state that is otherwise hard to catch live (loading, empty, or a specific recorded error), using only data that has genuinely been recorded from the real API once.

Every page this module draws lives at one route, in one component: nothing about a specific module's fields, actions, or labels is written anywhere in this module's own code. What differs from page to page is entirely the one declaration file that names it.

## Core concepts

- **Declaration** — the one file that says a page exists: which composable(s) it boots, how its rows draw, and which module's recorded scenarios it plays. One file, one page. Nothing about the composable's own behaviour is restated in it — see [architecture.md](./architecture.md) for exactly what a declaration is and is not allowed to say.
- **Presentation** — the part of a declaration describing how a record draws: an icon, a table, a card, and a set of actions. A table and a card are the _same_ declared fields, laid out two different ways.
- **Cell renderer** — the component that draws one declared field. A field's declared type (text, date, an icon, a set of badges) picks its renderer; a renderer is added to the system once and every declaration can then use it.
- **Handoff** — a declared editor a row's action opens instead of calling a plain function — used whenever an action needs more input than a click can supply (adding or editing a record through a form).
- **Track** — one scenario from a module's own written-down capability spec, once every one of its steps has a matching definition. A track is what shows up on the page's transport bar as something you can actually play.
- **Force preset** — a state the page can be pinned into on demand (loading, empty, an action failing, or the whole collection failing to load), served from data that was genuinely recorded once, never invented on the spot.
- **Scope bar** — the app-wide control cluster (brand, session, acting‑for) that decides _who_ a page is looking as and _for_ whom, independent of which page is open.

## Capabilities

| #   | Capability                                                | What it needs from the composable                                                        | What the page offers                                                                                |
| --- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | Draw a collection as a table                              | a collection composable (`useList`)                                                      | Sortable columns, a filter bar, paging, a column picker                                             |
| 2   | Draw the same collection as cards                         | the same, plus a declared card layout                                                    | A card grid alternative to the table, toggled by the reader                                         |
| 3   | Add, edit, or otherwise act on a record                   | a manager composable (`useMutate`), or a live action on the collection                   | Row actions and/or a collection-level action, each gated by the record's own flags                  |
| 4   | Open a form for an action that needs more than a click    | the manager's own input schema                                                           | A dialog editor seeded from the row, or opened fresh for "add"                                      |
| 5   | Persist the current filters/sort/page to a shareable link | the collection's own request-state surface                                               | A URL a colleague can open and land on the same view                                                |
| 6   | Offer only the actors a module actually supports          | the composable's own exported scope matrix                                               | An acting-for picker that greys out anything the module cannot serve                                |
| 7   | Replay a written capability as a demonstration            | a module keeping its capability spec and step definitions at their conventional location | A transport bar: play, pause, step, scrub, jump to any point, and a live/replay toggle              |
| 8   | Force a hard-to-catch state on demand                     | recorded response bodies for the module                                                  | Loading / empty / one action failing / the whole read failing, without touching the real API        |
| 9   | Inspect what's actually happening under a page            | nothing extra — read off the booted composable                                           | A raw-data pane, a "code that reproduces this" pane, and a Gherkin view of the scenario in progress |

**Additional always-on behaviours:**

- Every page boots as the acting session itself, with no scope narrowing, until the URL says otherwise.
- A page with neither a collection nor an editor to show simply cannot be built — a declaration must name at least one.
- A field nobody declared never appears anywhere — not as a column, not as a card field, not as a filter — regardless of what the underlying record actually carries.

## How a page comes to exist

A page is never written by hand and never has its own route file. At build time, every directory that holds a declaration file becomes one route, named after that directory; at runtime, the one shared page component looks up the declaration for the route it was given and boots accordingly. See [architecture.md](./architecture.md) for the full mechanism, and [usage.md](./usage.md) for how to actually create one.

## Dependencies

### This module reads from

| Dependency                                                      | What it reads                                                                                                 | Why                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| The scope-based composable a declaration names                  | its collection/manager composables, their schemas, and (where exported) its scope matrix                      | everything the page draws and offers is read from here — this module invents none of it                      |
| The package that publishes recorded test artefacts              | a module's own capability spec, its step definitions, and its recorded response bodies                        | what a page's transport bar plays, and what a forced state serves                                            |
| The shared UI component library and its form-rendering registry | every visual primitive (tables, cards, dialogs, menus) and the renderer-registration mechanism cell types use | this module composes existing components; it defines no new visual primitives outside its own cell renderers |

### Modules that read from this one

Nothing outside this module depends on it. It is a leaf: an app-level feature that consumes composables, never a composable other application code consumes in turn.

## Module boundary

Nothing scenario-specific may live in the composable layer this module reads from — that layer has no concept of a "page," a "declaration," or a "scenario." Equally, nothing about drawing a page belongs in the composable layer's own tests: what this module reads from a module's tests is exactly its capability spec and the data already recorded there for other purposes, never anything authored for this module's benefit alone.
