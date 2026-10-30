---
type: sdd-design
title: domain-parse-first-dot — design
description: The parse rule for a domain and the DAC basket guard.
tags: [sdd, domain, dac, hotfix]
spec: internal/specs/0005-domain-parse-first-dot.md
story: FE-3580
generated: {by: planner/opus, at: 2026-10-30T00:00:00Z}
verified: []
sources: []
stage: draft
---

# Architecture: domain-parse-first-dot

## 1. Introduction and Goals

`parseDomain` splits a domain at its first dot ([requirements](requirements.md)). The spec baseline table is the contract ([spec §Contract](../../specs/0005-domain-parse-first-dot.md#contract)).

## 5. Building Block View

- `packages/headless/src/modules/domain/utils.ts` holds `parseDomain`, `DOMAIN_PATTERN`, `sanitiseDomainInput` and `useDomainParser`. `useDomainParser` already splits at the first dot. Do not keep two copies of the split rule.
- `parseDomain` accepts a string or an object with a `domain` key. Keep both inputs.
- `parseDomain` has about 25 call sites in `dac.machine.ts`, `domain.machine.ts`, `services.ts`, `useDomain.ts` and `utils.ts`. They read the return shape only.
- `dac.machine.ts` `parseBasketProduct` reads `parsed!.tld`, `parsed!.sld` and `parsed!.domain`. `isDomainProduct` accepts an item from its blueprint code or its `sld` provision field, even when `parsed` is `undefined`.
- `packages/headless/src/utils/useCookies.ts` imports `psl`. Do not change it.
- The negative-control binding is `patches`. A new test ships a colocated `*.must-fail.patch`, as `__tests__/domain-default-type.must-fail.patch` does.

## 6. Runtime View

### 6.2 State flow

See [flow.md](flow.md). No state or transition changes.

## 8. Crosscutting Concepts

### 8.1 Contract

- The return shape of `parseDomain` does not change ([spec §Contract](../../specs/0005-domain-parse-first-dot.md#contract)).

### 8.2 Invariants and failure paths

- The DAC machine never throws on a basket item that does not parse.

## 9. Architecture Decisions

The spec holds the decisions ([spec §Decisions](../../specs/0005-domain-parse-first-dot.md#decisions)). The governing ADRs are 005 (XState), 007 (headless architecture) and 013 (testing strategy).
