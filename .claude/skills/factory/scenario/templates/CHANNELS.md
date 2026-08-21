# Declaration channels — what each one is, what earns it, what omitting it costs

> **TEMPLATE — doctrine wins.** `playgrounds/labs-nuxt/modules/scenarios/runtime/scenario.types.ts` is the authority; this file is a navigation aid over it, never a match target. A disagreement between this guide, a template skeleton and the contract is a surfaced finding, never silently resolved toward either.

One module, ONE declaration. Every channel below is OPTIONAL except `key`, which is the declaration's identity and so is never in the table.

A channel is worth declaring only when the surface it buys is one this module actually offers. Declaring a channel the module cannot serve is not a richer page — it is a control that draws and then fails.

## The channels

| Optional channel | What earns it | What omitting it costs |
| --- | --- | --- |
| `useList` | the module exposes a collection | no collection surface — no table, no cards, no filter bar; an editor-only page declares no list |
| `useMutate` | the module exposes an editor | no editor: no Add-new, no row edit handoff, read-only |
| *(at least one of the two)* | — | **nothing to build** — the door refuses the run |
| `identifier` | the record's identity is not `id` | the wrong field is read as the identity, so handoffs target the wrong record |
| `persistCriteria` | the page's request state should survive a share or a reload | filters, sort and page die on reload; nothing is shareable |
| `handoff` | an action needs a model a click cannot supply | the control is not offered |
| `presentation.icon` | the module is drawn anywhere an icon appears | no icon in the sidebar, page header or card |
| `presentation.table` | the collection is offered as a table | no table view, and no column picker — the element list is what both read |
| `presentation.card` | the same records are offered as cards | no card view |
| `presentation.actions` | a live action member, or a declared handoff | the collection is read-only |
| `tracks` | the module's own `__tests__/` carries a `.feature` and the catalog that drives it — the channel is the module's NAME, and it keys headless's published test entry | the page is Live-only: no playlist, no transport, no replay |

**`useList` / `useMutate` — at least one, and which are present decides the surface.** Both: a collection with an editor its rows hand off to. `useList` alone: a read-only collection. `useMutate` alone: an editor with no collection behind it.

**`handoff` targets an INLINE editor spec**, not another declaration's key — one module is one declaration, so there is no second key to point at. `add` declares no `contextFrom`: a record that does not exist yet boots fresh. `edit` points at the row's own identifier.

**`tracks` is a module name and nothing else.** The declaration imports no feature text and no catalog; the page reads both from headless's published test entry at that name. A module is published there the moment its `__tests__/` keeps the layout — nothing is registered, and a page whose module keeps that layout plays its own spec without a seam edit.

## Not channels — facts that live somewhere else

Every row below was once a declaration channel and is now a second source of truth for a fact the codebase already owns. A declaration that re-states one of them is a page whose control and whose business rule can disagree.

| The fact | Where it actually lives |
| --- | --- |
| the boot scope | nowhere — the page boots as SELF with no context; the url's `/as/:actor` and `/for/:type/:id` segments are the only overrides. A context type with no id is meaningless, so there is nothing left to default |
| which actors are offerable | the list/mutate composable's own exported scope matrix, read from the composable reference the declaration already carries |
| a scope, wherever one IS expressed | headless's own `ScopeContext` (`{ type; id }`, both required) — never a bare string, never a half-set pair |
| the filter bar | the criteria schema's own uischema |
| the sort control's options and labels | the criteria schema's `sort` enum and its field titles |
| the editor form | the mutate composable's input schema and uischema |
| a filled-or-outline boolean (the ex-`marker`) | a renderer named by the table element's own `type` |
| which scenarios the bar shows | width — the rest go to the overflow. Every scenario is always available; there is no pin |
| the url segment and route name | the declaring DIRECTORY, attached by the registry from the glob key |

## The presentation shape

`presentation` is exactly `{ icon, table, card, actions }`, backed by the consts `tableUischema`, `cardUischema` and `actionsUischema`.

- **`table`** is a `TableLayout` with ONE element per field. That one list gives the header row, the column order, every cell's renderer and the column picker's DEFAULT visible set. The picker's OPTIONS are wider: every field of the mapped record is offerable, so a field the table does not draw by default is still switchable on.
- Each element's `type` names a real registered renderer — `TableCellText`, `TableCellBadges`, `TableCellDate`, `TableCellIcon` — carrying only `scope` and `i18n`. There is no options-discriminator and no cell enum: the uischema reads as what it draws.
- **`card`** is the same record drawn in card slots — a second declaration, never a second component.
- **`actions`** is ONE channel, drawn identically on a table row and on a card. Naming it after one surface was the mistake the single channel corrects.
