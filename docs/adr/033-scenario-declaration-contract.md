# ADR 033: The Scenario Declaration Contract — Single Source of Truth, Table Renderers, Convention-Driven Discovery

**Date:** August 2026
**Status:** Accepted and built. Driven live in a real browser against the reference module (client-email) across every capability this record names.
**Authors:** Dominic da Costa
**Related:**

- [ADR 027: Flow Factory — Dynamic, Framework-Agnostic Playground Generation](027-flow-factory-playground-generation.md) — establishes the generated-playground concept and the dumb-renderer/smart-upstream keystone this ADR narrows into one concrete contract.
- [ADR 032: The Schema Family for Scoped Collection Composables](032-schema-family-for-scoped-collections.md) — the query, actions and row schemas a scenario declaration reads rather than restates.
- [ADR 001: Scope-Based Composable Architecture](001-scope-based-composables.md) — the four-layer composable shape, its scope matrix, and `ScopeContext`, all consumed here rather than re-spelled.
- [ADR 020: Gherkin as Test Planning Spec](020-gherkin-test-planning.md) — Amendment 5 records the companion decision that a module's `.feature` is the executed artefact this contract plays.

---

## Context

A scenario page is a generated view over a scope-based composable: it needs to know what to boot, how to draw it, and what to let a developer replay against it. Early drafts of that declaration grew a channel for nearly everything the page might need — a boot scope, a copy of the composable's scope matrix, a sort-options list, a form description, a boolean "marker" field, a "pinned" flag on the scenario bar, a `nav` object for the sidebar icon.

Each of those channels turned out to restate a fact some other part of the system already owned:

- **Sort options** restated the query schema's own sort enum and field titles.
- **The editor form** restated the mutate composable's own input schema and uischema.
- **A boot scope** and a copied **scope matrix** restated the composable's own exported matrix — the one artefact that can answer "which actors can this page offer" without drifting from what the composable actually supports.
- **A "marker" channel** (a bespoke shape for a filled/outline icon) restated what a per-field renderer already does for every other cell type.
- **A `nav` object** restated `presentation.icon`, which the page already needed for its header and its cards.
- **A "pinned" flag** restated a layout fact (how many chips fit the bar) as if it were a declared permission.

Every one of these is the same failure at a different join: a shape invented beside a contract the codebase already owns, so the declaration and its source of truth could quietly disagree. A parallel finding applied to how the table drew a row: an early table renderer discriminated on an `options.cell` enum inside a generic `Control` element, so adding a new visual treatment meant widening a switch statement rather than registering a new component.

A third finding applied to how a scenario, and the data it plays back, are found at all: an early design listed scenarios and their recorded test artefacts by hand — a registry file naming each module, and package-export rows added one at a time as a module gained a recording. That is the same shape the page-routing layer had already rejected: a page is discovered by directory, never declared in a list a human must remember to update.

## Decision

**A scenario declares only what no other artefact already owns, draws its table through real per-cell renderers instead of a discriminated `Control`, and is discovered — along with the recorded scenario data it plays — by keeping a fixed directory layout, never by being added to a list.**

### 1. Single source of truth — a declaration restates nothing a composable or its schemas already say

- **Filters and sort are the composable's query schema, not the declaration's.** A scenario page's filter bar and sort control render directly off the schema the composable's own list context exposes: the schema's `filters` branch supplies the filter controls, and its `sort` branch supplies the sort options, each carrying its own field titles. A declaration names no filter, no sort field and no sort label.
- **The editor form is the composable's own, not the declaration's.** Where a module exposes a manager (`useMutate`), that composable's own input schema and uischema are the form a handoff opens. The declaration names which composable to open and, where the row's identity must seed the editor, a JSON Pointer into the row — nothing about the form's fields.
- **The offerable actors are the composable's own scope matrix, not a copy of it.** A composable that exports `ActorContextMatrix` publishes which actor×context cells it supports; the declaration reads that reference rather than restating the same cells beside it. A composable exporting no matrix offers no actor picker at all, rather than a declaration guessing on its behalf.
- **A page boots as itself, with no context, and only a URL segment ever moves it.** No declaration may state a starting scope. This closes a shape that could otherwise go half-set — an actor with a context type and no id, which is meaningless on its own — by consuming the existing scope-context type (an actor, or an actor plus a *complete* context: a type together with its id) rather than a page-local, looser one.
- **A cell's visual treatment is a renderer, not a bespoke flag.** A boolean drawn as a filled or outline glyph is one of the cell types below, chosen the same way every other cell type is chosen — by declaring it in the element list — never a separate marker object with its own scope and icon keys.
- **A sidebar icon is presentation, not a separate channel.** One `presentation.icon` serves everywhere a module's icon is drawn — sidebar, page header, and card — because it is one fact, however many surfaces draw it.
- **A scenario's presence on the transport bar is not a declared permission.** Every scenario a module plays is always available; how many of their chips fit the bar, and which ones move to an overflow menu, is a layout question decided by the space available, not by anything a declaration states.

What a declaration is therefore left to state is exactly what nothing else owns: which composables it boots (a collection, an editor, or both — at least one), the inline editor spec a handoff opens, the record's identity field where it is not `id`, whether the page's request state persists to the URL, the module whose recorded scenarios it plays, and its presentation — an icon, a table, a card, and its actions. Presentation is `{ icon, table, card, actions }`; row-level and collection-level actions are one list, because the same action set draws identically on a table row and on a card, and only its placement differs.

### 2. `TableLayout`, and every declared cell is a real, registered renderer

The table's uischema layout type names what it is — `TableLayout`, not a generic horizontal layout pressed into service — and its element list is the *whole* table: the header labels, the column order, every cell's renderer, and the column picker's default visible set, in one place. The picker's own options are wider than that default set: every field the declaration's table or card names is switchable on, so the declared list decides only what draws by default, never the ceiling of what a user may choose to see.

Each element's `type` names a real, independently registered renderer — a text cell, a date cell, an icon cell, a badge-set cell today, and any further cell type as it earns one — each carrying its own tester, resolved by the same registry-and-tester mechanism the rest of the form-rendering stack already uses. An element carries only the two things every cell needs to be found and labelled — the field it points at, and the column header / card label it is called — plus whatever that renderer's own options require. A cell dispatcher asks the registry which renderer claims an element and draws that one; it holds no vocabulary of cell types itself, so a new cell type is a new component and a registry entry, never a branch inside a surface that already exists.

The card is the same mechanism over the same element list, with each element optionally naming which card slot (title, subtitle, or body) it occupies; the table ignores that option, and the card ignores column order. One declared record therefore draws twice — as a table row and as a card — from one authored list, never two.

### 3. Convention-driven discovery, at both ends of the pipeline

A scenario, and the recorded test data it plays, are each found by keeping to a fixed, predictable layout — never by being added to a list a human must remember to update.

- **A scenario is its directory.** Every directory beside the scenario runtime that holds a declaration file is a page: the build-time module discovers them by pattern, registers one route per directory, and the running app resolves the same set the same way. Writing a declaration and leaving it unrouted is impossible, and a route with no declaration behind it is equally impossible — the two facts are read off the one glob.
- **A module's recorded scenario data is discovered from its own test directory layout, never listed module by module.** A module that keeps its capability spec, its step definitions, and its recorded response bodies at their conventional paths beneath its own tests is *published* the moment it keeps that layout — nothing registers it. The package that owns those artefacts exposes one collecting entry point, itself built by scanning that same layout across every module, so a second module gains the same reach the first one did by keeping the same three files in the same place.
- **A declaration's own pointer to its scenario data is a read key, not a registration.** The one thing a declaration states about its recorded data is the name of the module whose artefacts it plays — the same name that collecting entry point keys its result by. Naming a module is asking a question of an index that already exists, never adding an entry to one.

The same law governs both the page a developer never manually routes and the recorded conversation a developer never manually wires into a package export: a fixed place to look, kept, is what "discovered" means here.

## Alternatives considered and rejected

**A declaration-local scope, and a declaration-local copy of the scope matrix.** Rejected because the composable already carries both facts, and a second copy has no honest way to disagree with the first without one of them being wrong. The composable's export is now the only place either fact is stated.

**A `nav` object for the sidebar icon, separate from `presentation`.** Rejected once it was clear the sidebar's icon, the page header's icon and a card's icon are one fact, not three — the sidebar is simply one more place `presentation.icon` is drawn.

**A `pinned` flag deciding which scenarios show on the bar.** Rejected: "pinned" was never a permission a scenario could hold or lack — it only ever meant "which few chips fit," which is a fact about the bar's width, decided at render time, never a fact a declaration is positioned to know in advance.

**A `presentation.form` channel naming a manager's input/submit members and its feedback keys.** Rejected as a second description of a form the mutate composable's own schemas already define completely; the declaration names the composable, and the renderer reads that composable's schemas directly.

**`options.cell` as a discriminator on a generic `Control` element.** Rejected in favour of one real renderer per cell type. A discriminator forces every new visual treatment through the same switch statement; a registered renderer is added the way every other renderer in this codebase is added, and a uischema element reads as what it actually draws.

**Hand-listing which modules' scenario data an app may reach, module by module, as package-export rows or as a seam file naming each module.** Rejected for the same reason page routing already rejects a hand-maintained list: a listed module is a fact that can go stale the moment a module is renamed, split, or added, and nothing forces the list to be updated. A layout convention, scanned once by the owning package, cannot go stale in that way — a module either keeps the layout or it does not, and the collecting entry point can only ever answer honestly.

## Consequences

### Positive

- **A declaration cannot disagree with its own composable.** Every fact that used to have two homes now has exactly one; changing a query schema's sort enum, or a mutate composable's form, changes what every page over that composable offers, with nothing left in the declaration to fall out of step.
- **Adding a new cell type, or a new module's recorded scenario data, is additive.** A new renderer is a new component and a registry entry; a new module's recorded data is published by keeping the conventional test-directory layout. Neither requires editing a list that already has entries in it.
- **The table's element list is genuinely one list with four jobs** (header, order, renderer, picker default), so those four things cannot silently disagree with each other the way four separate lists could.

### Costs accepted

- **A declaration's author must know where a fact already lives** before reaching for a new channel — the discipline this record exists to hold the line on is exactly the discipline that makes a new channel a rare, deliberate addition rather than a convenient default.
- **A module with no query schema, no scope matrix, or no recorded test directory offers correspondingly less** — no sort, no actor picker, no transport bar — rather than a declaration papering over the gap with an invented shape. This is treated as an honest reflection of what the module actually publishes, not a defect in the contract.

### Out of scope

- Which concrete renderer types exist beyond the ones already registered — new cell types are added as modules need them, under the same mechanism.
- The shape of the query, actions and row schemas a declaration reads — that is [ADR 032](032-schema-family-for-scoped-collections.md)'s record.
- The four-layer composable shape and its scope matrix — that is [ADR 001](001-scope-based-composables.md)'s record.
