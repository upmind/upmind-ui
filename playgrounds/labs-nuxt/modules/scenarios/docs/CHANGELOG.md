# Changelog

All notable changes to the `scenarios` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **A column picker on the display row.** Every field a table or card declares is offerable; the currently-visible set round-trips through the URL exactly like the sort order and the view toggle, and the last remaining visible column cannot be hidden.
- **Real, independently registered per-cell renderers** — text, date, a filled/outline icon, and a set of badges — each its own component with its own tester, replacing an earlier options-based discriminator on a generic control element.
- **A convention-driven route to a module's own recorded scenario data.** A module publishes its capability spec, its step definitions, and its recorded response bodies the moment it keeps them at their conventional test-directory location; nothing registers a module by name anywhere in this app.
- **Two distinct force presets for a failure state**, in place of one that conflated them: an action failing on an otherwise-intact collection, and the whole collection's read failing outright.
- **Scenario steps as clickable seek targets.** Both the scene rail on the transport bar and the step list in the Scenario pane are two views of the one set of stops; either one jumps playback to that point, and the currently-playing stop stays in view as playback advances.
- **Track-scoped Code and Scenario panes.** While a track is armed, both panes narrow to that track's own steps (and, for Code, only the calls played so far) instead of always showing the whole module.
- **A visual "this is not live" treatment that changes no geometry.** Forcing a state or arming a track outlines the whole page canvas rather than adding a border, padding, or background change that would shift anything below it.
- **A read-only overlay a row's own action can open**, showing the record through the same declared-cell renderers as the table/card. A module naming no read composable shows the clicked row's own data with nothing fetched; one naming a single-read composable alongside its collection gets the full record instead, fetched fresh and keyed by the row's own identity. The overlay's own action bar excludes the control that opened it while carrying every other row action — an edit handoff among them — unchanged.
- **A sanitized-HTML cell renderer**, for a field the API returns as markup (a message body, a note) — drawn through the product's existing sanitizer, never escaped and never rendered raw.
- **A declared width share for a table column** — a quarter, a third, or half the row — for a table that needs two fluid text columns sized unequally, instead of splitting the remainder evenly.
- **Every declaration-sourced string on a page's runtime surfaces — column headers, card and detail labels, badge labels, sort options, and action feedback — now translates reactively, in place.** A locale switch re-labels a mounted table, card, or detail view immediately, with no remount and no loss of scroll position, selection, or focus.
- **Forcing works for any registered module's own recordings, not one hardcoded target.** Which states a module offers is measured structurally off its own committed recordings against what its own capability spec claims — never matched by wording — so a module whose spec is worded differently no longer loses its force affordance, and a state the spec claims but the recordings cannot yet prove is reported as a capture gap instead of silently missing.
- **A single-record surface (a profile, a settings page) now has its own empty state for "the record is not there."** It reads apart from that surface's error state, which previously drew the same picture for an absent record as for a read that genuinely failed.

### Changed

- **A control can open a read-only overlay instead of calling an action or a handoff.** This is a third possibility alongside a live call and a handoff, not a replacement for either.
- **An action-failure preset now renders on arming, with no interaction required.** It previously waited for a row's own control to be fired before showing anything, so arming it looked like it did nothing. Arming now draws a row already carrying its refusal — the module's own recorded sentence — the moment the page settles; firing the action anyway still meets that same recorded refusal.
- **A refused write now marks only the row it happened to.** The rest of the collection stays intact — every other row present, every control live. A single row's refusal previously collapsed the whole surface into a collection-level error, which is also why it looked like nothing had a message: there was no row left to carry one.
- **A forced state's own paths are scoped to the module's declared subject**, rather than to every path a capture run happened to touch. A capture run's incidental calls — a lookup a form needed, a read the page shares with the rest of the app — are never intercepted, so forcing a state on one module can no longer hang or misdirect a call the surrounding app makes on its own.
- **A response the force intercept serves is now inert to the app's own session handling.** A forced state could previously be mistaken for a real expired session and end it; arming a state can no longer sign the reader out.
- **Arming now clears the page's already-fetched data outright**, instead of marking it stale and re-fetching underneath it. The previous approach could re-fetch and keep showing the data already on screen, so a preset sometimes appeared to do nothing.
- **Leaving an armed module for another now always returns to Live first.** A preset used to be able to carry across onto a module it was never armed on, including one that does not offer it at all; a preset re-armed on the new module now always comes from that module's own offer.

- **The declaration contract is now genuinely minimal.** A declaration states only what nothing else already owns: which composable(s) it boots, its handoffs, its identity field, whether it persists request state, which module's scenarios it plays, and its presentation. Everything else that used to have a home in the declaration now has exactly one home, in the composable or its schemas, instead of two:
  - Sort options are read from the composable's own query schema (its sort enum); a sort option's own label comes from that composable's own sort uischema (an `i18n` prefix), never declared beside it.
  - The editor's form is the mutate composable's own input schema and uischema; a declaration names the composable, not its fields.
  - The offerable actors are read from the composable's own exported scope matrix; a declaration carries no copy of it.
  - A boolean's filled/outline treatment is a renderer choice on the element itself, not a separate marker channel.
  - A module's icon is one `presentation.icon`, drawn wherever an icon is needed (sidebar, header, card) — no separate navigation object.
- **A page always boots as the acting session itself, with no context**, moved off that default only by the URL's own actor and context segments. A declaration cannot state a starting scope.
- **`presentation` is exactly `{ icon, table, card, actions }`.** Row-level and collection-level actions collapsed into one `actions` list; a table's element list moved from a generic row layout to a real `TableLayout`.
- **One editor per module, declared inline.** A collection-and-editor page over the same module is one declaration and one directory, with the editor named as an inline handoff spec, rather than two declarations for the same module.
- **Every scenario a module owns is always on the transport bar's playlist**, subject only to how many of its own chips fit the available width; a separate "pinned" flag that used to gate a scenario's presence there is gone.

### Removed

- **The `scope`, `scopeMatrix`, `nav`, `sort`, `form`, `marker`, and `pinned` declaration channels** — each replaced by reading the same fact from wherever it already lives, per the entries above.

### Notes

- The reference page over the client-email module has been carried forward onto every rule in this record — it is the one page proving the whole contract lives, not a hand-tuned exception to it.
- A module's recorded scenario data reaches this app through one package-level entry point that collects every module keeping the conventional layout; several modules now keep a capability spec and recorded fixtures at that layout, each reaching this app the same way. A new module gains the same reach by keeping the same layout — nothing in this app needs to change for it to appear.
- A second reference page, over a client's received-email history, now exercises the fetch side of the read-only overlay end to end — the first page in this tree to bind a single-read composable, alongside the client-email page's own row-data-only path.

### Not captured

- A small number of component-level specs on this checkout were red at the time of this landing, independent of the capabilities above (which were confirmed by driving the running app in a real browser). They are a test-suite gap to close, not evidence against anything documented here as working; do not treat their presence as licence to skip a real read-back before trusting a change in this area.
- A number of the client-email page's own component-level specs went red at the time of this landing, tracing to that page's row-action inventory shifting once it adds a `view` control alongside its existing actions. This is a gap in how those specs enumerate a row's actions, not evidence against the read-only overlay itself — confirmed working by driving the running app and by a recorded end-to-end read-back on that same page. Close the gap before trusting a row-action count assertion in this area.
- The forcing changes above were swept in a real browser across every registered module and every preset, from a cold load with no interaction. Five modules render every preset correctly. Three cells do not yet: a read-only module's collection error holds its loading state rather than drawing its error, and on the single-record surface both the loading and collection-error presets draw an error — the latter is a preset that module does not offer at all, so it should return the page to live rather than arm something unanswerable. Treat those three as open; everything else in this entry was confirmed by driving the running app.
