# scenarios — Architecture

## Overview

Every page this module draws is the same component, mounted at a different route, over a different declaration. There is no per-module page file to drift, and no per-module Vue component to keep in sync with the composable it draws: the declaration is the only thing that varies, and everything downstream of it is generic.

Reading this document top to bottom follows the same order the page itself builds in: how the page is found (build time), what it boots and how it draws (mount time), and how the reader can steer or replay it afterwards (runtime).

## How a page comes to exist

A declaration lives in its own directory, beside a presentation file for the same module:

```text
modules/scenarios/
├── runtime/                       the shared machinery every page uses
└── useClientEmails/               one page's own directory
    ├── client-email.scenario.ts       the declaration
    └── client-email.presentation.ts   its table / card / actions
```

**At build time**, a Nuxt module scans this module's own tree for every directory holding a `*.scenario.ts` file. For each one found, it registers exactly one route, named and pathed after that directory — nothing about the declaration's _contents_ is read at this point (the build-time process cannot safely import application code), only the fact that the file exists and which directory it sits in. A second directory declaring the same route name is a hard build failure, not a warning: two pages silently sharing one URL is the failure this check exists to make impossible.

**At runtime**, every one of those routes renders the same one shared page component. On mount, that component reads which directory the current route came from, looks up the matching declaration in an in-memory registry built the same way (by scanning every declaration file, this time for real, inside the running app), and boots from there. Nothing else about "how a page exists" needs to be true for a new module to get one: keep a declaration in its own named directory, and the page exists.

This is deliberately the same discovery law the page router already used before this system existed — a directory _is_ a route, and nothing is ever separately registered.

## The runtime pipeline: registry → declaration → renderers → criteria/url → replay/forcing

Once a route resolves to a declaration, five things happen, roughly in this order, every time a page mounts:

1. **Registry lookup.** The route names a directory; the registry (built by the same directory scan, at runtime, over every declaration file and its raw source alongside it) hands back the declaration for that directory, plus the original source text unchanged — which is what the Scenario pane below shows verbatim.

2. **Boot.** The page boots whichever of the declaration's composables it names — a collection, an editor, or both — as the actor and scope the current URL carries. **A declaration never states a starting scope.** Absent any scope segment in the URL, a page boots as the acting session itself, with no context narrowing at all; only the URL's own actor and context segments ever move it off that default. Where the declaration names both a collection and an editor, the collection is what boots the page — the editor is opened later, per record, through a handoff.

3. **Reflection.** The booted composable is reflected into a generic descriptor: its live data, its available action names, and its declared meta flags, none of which the renderer holds any module-specific knowledge of. The renderer is handed this descriptor together with the declaration's own presentation, and draws _only_ what the presentation names, gated by _only_ what the descriptor's own flags allow for that record.

4. **Criteria and URL.** Where the booted composable owns request state (it publishes a query schema), that state is wired two ways at once: the filter bar and sort control read and write it directly, through the schema the composable itself exposes; and, only where the declaration opts in, the _whole_ current request state (filters, sort, page, and which columns are visible) round-trips to the page's own URL, so a colleague opening a shared link lands on the same view. Neither wiring invents a fact the composable does not already carry — the schema's field titles, its sort enum, and its own filter shape are the only vocabulary either surface uses.

5. **Replay and forcing.** Independently of all the above, the page always carries a transport (armed only when the module names one it can actually play) and a force handle (available only where the module has recorded response data behind it). Both are described in their own sections below.

The rest of this document expands each of those five steps.

## The declaration and its presentation

A declaration is one file, one export, one module. It says:

- which composable(s) it boots (a collection, an editor, or both — at least one is required, since a page with neither has nothing to show);
- an inline handoff spec for any action that opens an editor, naming which composable that editor is and, where relevant, which field of the row seeds it;
- the record's identity field, only where it is not `id`;
- whether the page's request state should persist to the URL;
- which module's recorded scenarios it plays (a name, nothing else — see "Replay" below); and
- its presentation: an icon, a table, a card, and its actions.

Everything else a page needs — what is filterable, what is sortable, what the editor's form looks like, which actors the module can be viewed as — is read directly off the composable(s) the declaration names, never restated beside them. If a fact already has a home in the composable or its schemas, the declaration does not carry a second copy of it; where it would have to, that is treated as a defect in the declaration, not a legitimate extra channel. This is the single most important rule this whole system holds to, and [ADR 033](../../../../../docs/adr/033-scenario-declaration-contract.md) records why, in more depth than a working doc needs to restate.

The **table** is a list of elements, each pointing at one field of the record and naming the header/label it draws under. That one list gives four things at once: the column headers, the column order, each cell's own renderer, and the _default_ set of columns the column picker shows — the picker's full option list is every field the table (or the card) names, so a column hidden by default is still switchable back on. A column normally shares the row's remaining width evenly with every other such column; an element may instead reserve a fixed share of the row — a quarter, a third, or half — so two columns need not split it evenly when one is reliably shorter than the other. That share is presentation-only: it moves no data, and the card ignores it. The **card** is the same shape, over the same or a different subset of fields, with each element optionally naming which card region (title, subtitle, body) it belongs in. The **actions** list is one list, not one per surface: the same declared action draws identically on a table row and on a card, and only its placement (visible beside the row, tucked into the overflow menu, or beside the page's own heading for a collection-level action) tells the two apart. A control may also open a read-only overlay over its record instead of calling an action or a handoff — see [Detail](#detail-a-read-only-overlay-over-one-record), below.

## Cell renderers

A table, card, or detail element names a renderer type, and that renderer is a real, independently registered component — not a branch inside a bigger one. Today's set:

| Renderer | Draws                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| Text     | The field's value, as text                                                                 |
| Html     | The field's value as sanitized markup — drawn as markup, never escaped, never rendered raw |
| Date     | A date value, in its relative form                                                         |
| Icon     | A boolean, as one glyph — filled where true, outlined where false                          |
| Badges   | A set of named badges, one per truthy flag the element names                               |

A dispatcher component asks every registered renderer's own tester which of them claims a given element (the same tester-and-registry mechanism the rest of the form-rendering stack in this codebase already uses), and renders whichever one answers. Adding a new visual treatment is: write the component, give it a tester, add it to the registry — never edit the dispatcher, and never touch an existing renderer.

## Detail: a read-only overlay over one record

A row's own control can open a read-only overlay over that record instead of calling a live action or a handoff — the read twin of the editor handoff above. What it shows comes from either of two feeds:

- **The row itself**, when the declaration names no read composable — the overlay is fed exactly what the list already holds, and nothing further is fetched.
- **A freshly fetched full record**, when the declaration names a single-read composable alongside its collection — the overlay boots that composable at the row's own identity (derived from the row itself, never declared as a second context block) and shows what it returns. A record reached this way may carry fields the list row never does; a detail element is free to name any of them.

Either way, the record draws through the same declared-cell renderers the table and card use — a column cannot mean one thing there and another here. The overlay's own action bar never re-offers the control that opened it: every other action the row carries, an edit handoff among them, still appears alongside the record and behaves exactly as it does from the row.

The overlay's own shell is a presentation choice, not a fact about the record: a side panel by default, opening from the right edge by default, swappable to another edge or to a centred dialog. None of it changes what is shown or how it is fetched.

## The scope bar, and how a page's own scope works

The scope bar is chrome, not part of any one page: it lives in the app layout, above whatever page is open, and shows the active brand, the current session, and (where relevant) who the session is currently acting for. It has nothing to do with which page is open — a page's _own_ scope is entirely a function of the URL's own actor/context segments, resolved independently by the composable-boot step above.

The acting-for picker only ever offers actors a page's own booted composable actually supports: it reads the composable's exported scope matrix (where one exists) and greys out anything not in it, rather than offering every actor type unconditionally and letting an unsupported choice fail later.

## Replay: tracks, the transport, and the sheets

A module's own capability spec — a human-readable list of scenarios, each a short list of steps — is read together with that module's own set of step definitions. A scenario becomes a **track** — something the page can actually play — the moment every one of its own steps has a matching definition; a scenario with no matching steps at all simply is not on the playlist yet, which is a legitimate, ordinary state rather than an error.

Arming a track:

- takes the page to the scope that track declares (if it is not already there), by navigating rather than by silently swapping data underneath the reader;
- switches the page's own controls (search, filters, sort, paging, row actions, "add new") into a locked, read-only state, because a track playing is a script, and a hand touching a locked control while a script runs would fight it;
- reveals a transport (play / pause / step back / step forward / a scrubbable rail of scenes) that runs the track's own steps against the live page, one at a time, holding on each one long enough to actually be seen;
- keeps the currently-playing scene in the page's URL, so a colleague can be handed a link that resumes exactly there.

Stepping backward is **replay**, not an undo: nothing in this system can un-fire a step a scenario has already run, so moving to an earlier scene re-runs the track from its very first scene up to that point. This is safe only because the module's own force preset (below) is always armed _before_ the very first scene of a replay runs, so nothing a scenario does ever reaches the real API.

Two panes read the same armed track from a different angle: a **Scenario** pane shows the track's own steps as a legible, clickable list — each one a valid jump target, marked done / current / pending — and a **Code** pane shows the calls the steps actually made, up to wherever playback currently is. A third, **Debug**, pane is unrelated to replay: it shows the booted composable's own raw schema, model, and the request it would build, live, whether or not any track is armed.

## Forcing: pinning a hard-to-catch state

Independently of replay, a page can be pinned into one of a small set of states — loading, an empty collection, one action's write failing, or the whole collection's read failing — using only response bodies that were genuinely recorded from the real API once. Forcing never invents a response: every preset picks which of a fixed, recorded set of bodies a request receives, and a request the recorded set does not own is passed straight through rather than answered.

Arming a preset installs an in-browser network intercept for the tab, and immediately invalidates whatever the page had already fetched — otherwise the page would go on showing data it fetched before the preset was armed, which would be exactly the same kind of lie forcing exists to avoid. Nothing about the page's own layout changes while a preset (or a track) is active; the entire canvas the page draws inside takes on a visual "this is not live" treatment that reserves no extra space and moves nothing else on the page.

## Module boundary

This module owns everything above: the shared page component, every cell renderer, the replay and forcing machinery, and the registry that finds a declaration. It has no concept, anywhere, of what a _specific_ module's fields or actions are — that knowledge lives entirely in each module's own declaration and presentation file, and in the composable those files name. Nothing here is imported by, or exported to, the composable layer itself; the relationship is one-directional, and this module is the only side of it that knows the other exists.
