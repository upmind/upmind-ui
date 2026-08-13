# Module: module

> **TEMPLATE — doctrine wins.** `docs-modules.md` + `docs-modules.companion.md` (ADR-019, the Contabo-workshop deliverable) are the authority; this skeleton and its named worked example are one worked example each, never a match target. A disagreement is a surfaced finding, never silently resolved toward either.

<!--
@doctrine authored by the DOCUMENTER seat in the factory's Docs stage
(`/docs-foundation`, SKILL.md's Docs row) — never by the developer seat that
scaffolds this skeleton (seat separation). This file fixes the SECTION SHAPE
`/docs-foundation` must fill in; it carries no real module content, and the
Docs stage may not certify a capability here without a PRESENT verdict from
Verify (SKILL.md's Docs gate).
@worked-example `account/docs/foundation.md` (full-length reference — same
section order this skeleton names, including its `⚠️ UNRATIFIED` /
`⚠️ STILL OPEN` callout convention for genuinely open questions).
-->

## What it is

<!-- One paragraph: the module's job to be done, its problem-space, and its
sibling demarcation — see `account/docs/foundation.md`'s "shares its problem
space with two siblings" paragraph for the shape. Strip any client-only
`meta`/`object_meta` envelope content per `docs-modules.companion.md`. -->

## Core concepts

<!-- Bulleted glossary of the module's domain terms. -->

## State model

<!-- Only if the module's behaviour is a genuine lifecycle — a table of
states, what each is derived from, and what advances it. Omit for a module
with no lifecycle. -->

## Operations

<!-- Numbered capability table: # | Capability | Inputs | Outputs. -->

## Data shape

<!-- TS type blocks for the module's request/response/view-model shapes. -->

## Dependencies

<!-- Dependants (fan-in, from `graphify-out/graph.json`) and this module's own
dependencies — see `docs-modules.companion.md`'s dependants-table exclusions
(`query`, `routing`, UI-internal helpers). -->

## API endpoints

<!-- One entry per BE endpoint the module owns: role, request-body type,
curl, sample response, fixture path. -->

## Failure modes

<!-- Real captured failure responses only — never an invented shape. -->

## Flows

<!-- One `mermaid flowchart` per named flow, with the guarantees the platform
holds and the constraints a caller has to plan around. -->

## Lessons (hard-won)

<!-- Non-obvious behaviour a rebuilder would otherwise relearn the hard way. -->
