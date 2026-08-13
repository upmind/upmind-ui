# scenarios — Gotchas

## 1. A declaration cannot set a starting scope — and should not try to

A page always boots as the acting session itself, with no context, no matter what actor or context the composable's own scope matrix supports. Only the URL's own actor/context segments ever move it off that default. If you find yourself wanting to add a "boot as" field to a declaration, the fact you are trying to express almost certainly already belongs on the scope matrix (which actors/contexts the module can offer) — not on where the page starts.

## 2. Re-running the factory over a page with uncommitted edits is refused, not merged

Every route this system offers rewrites files in place. That is safe because `git` is the record of anything a re-run overwrites — but only for a **committed** target. Run an upgrade over a page carrying uncommitted hand-tuning and the run stops before writing anything, naming the dirty files. Commit first.

## 3. Sort, filters, and the editor's form are never declared — they come from the composable

If a column will not sort, or a form field will not appear, the fix is almost never in the presentation file. Check the composable's own query schema (for sort/filter) or the mutate composable's own input schema (for a form field) first. A declaration adding a sort option or a form field back in as its own channel is exactly the duplicated-source-of-truth failure this whole contract exists to prevent — see [architecture.md](./architecture.md#the-declaration-and-its-presentation).

## 4. While a track is armed, the page's own controls are locked — on purpose

A replay is playback, not a live session: touching search, a filter, sort, paging, or a row action while a track is armed would fight the script it is running and desynchronise the visible state from what the URL and the transport think is happening. The lock is real (not merely visual) and always says why via a tooltip or label. Picking Live releases every control in the same tick.

## 5. Forcing a state never changes page geometry

A forced state (or an armed track) draws as an outline around the whole canvas, never a border, padding, or background change — those would reserve or shift space and make the "before" and "after" layouts genuinely different, which is exactly what this treatment is designed to avoid. If a forced state ever looks like it moved something on the page, that is a bug in the treatment, not a deliberate design.

## 6. The Code and Scenario panes show different things Live vs armed

Live, both panes describe the whole declaration: every scenario, and the generic call that reproduces whatever the page currently shows. Once a track is armed, both narrow to that one track — its own steps, and (for Code) only the calls actually played so far. Do not expect the full module's spec to be visible in either pane while a track is playing; that is the point of narrowing them.

## 7. A module's `.feature` may be extended by this system, never rewritten

This module's own tooling only ever appends new scenarios to a module's existing capability spec, or lightly rephrases an existing scenario so a step definition can match it. It never deletes a scenario and never narrows what a module claims to do. If a module's spec is missing scenarios entirely, that is upstream work on the module itself, not something to patch around here.

## 8. No scope matrix on a composable means no actor picker for that page — not a broken one

A composable that exports no scope matrix is treated as offering nothing to switch to, not as an error. The acting-for picker simply shows nothing to pick for that page's own composable rather than falling back to every possible actor and letting an unsupported one fail downstream.

## 9. The row's identity is `id` unless the declaration says otherwise

A handoff's `context.from` pointer, and the row key used for animation/tracking, both default to reading `id` off the record. A module whose real identity field is named something else needs the declaration's `identifier` set explicitly — leaving it unset silently reads the wrong field rather than failing loudly.

## 10. The column picker's option list is wider than what is visible by default

Every field the table (or card) declares is a switchable option in the picker, whether or not it is part of the _default_ visible set. If a field seems "missing," check the picker before assuming it was never declared — it may simply be off by default.

## 11. Neither module code nor this app's own tooling may reference planning material under a story's own working directory

A module's spec is its own `.feature` file, colocated with its tests, and nothing else. Nothing in this system reads, asserts against, or points a developer at a temporary planning artefact as if it were a second, authoritative copy of that spec — a module's tests know one truth, and it lives beside them.
