# Module: module

> **TEMPLATE — doctrine wins.** `docs-modules.md` + `docs-modules.companion.md` (ADR-019) are the authority; this skeleton and its named worked example are one worked example each, never a match target. A disagreement is a surfaced finding, never silently resolved toward either.

<!--
@doctrine authored by the DOCUMENTER seat in the factory's Docs stage
(`/docs-foundation`, SKILL.md's Docs row) — never by the developer seat that
scaffolds this skeleton (seat separation). This file fixes the SECTION SHAPE
`/docs-foundation` must fill in; it carries no real module content, and the
Docs stage may not certify a capability here without a PRESENT verdict from
Verify (SKILL.md's Docs gate).

@surfaced-finding no shipped query-variant module has authored a
`docs/foundation.md` yet — `client-email/docs/` carries only a `README.md`.
The section shape below is therefore cited from the XState-variant worked
example (ADR-019's shape is variant-agnostic), not fabricated as if a live
query-variant foundation doc existed.
@worked-example `account/docs/foundation.md` (machine variant, full-length
reference — same section order this skeleton names).
-->

## What it is

<!-- One paragraph: the module's job to be done, its problem-space, and its
sibling demarcation. Strip any client-only `meta`/`object_meta` envelope
content per `docs-modules.companion.md`. -->

## Core concepts

<!-- Bulleted glossary of the module's domain terms. -->

## Operations

<!-- Numbered capability table: # | Capability | Inputs | Outputs. A
query-backed collection typically has no "State model" section — its state is
loading/error/data, not a lifecycle; omit that section unless the collection
genuinely has one. -->

## Data shape

<!-- TS type blocks for the module's item/response/view-model shapes. -->

## Dependencies

<!-- Dependants (fan-in, from `graphify-out/graph.json`) and this module's own
dependencies. -->

## API endpoints

<!-- One entry per BE endpoint the module owns: role, request-body type,
curl, sample response, fixture path. -->

## Failure modes

<!-- Real captured failure responses only — never an invented shape. -->

## Flows

<!-- One `mermaid flowchart` per named flow, if the collection has any
multi-step flow (e.g. find-or-create) beyond plain CRUD. -->

## Lessons (hard-won)

<!-- Non-obvious behaviour a rebuilder would otherwise relearn the hard way. -->
