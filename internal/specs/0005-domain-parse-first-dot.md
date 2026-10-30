---
type: spec
title: Domain parsing splits at the first dot
description: parseDomain splits a domain at its first dot, so a wildcard ccTLD such as .bd no longer crashes the domains page.
tags: [domain, dac, hotfix]
story: FE-3580
status: approved
generated: {by: planner/opus, at: 2026-10-30T00:00:00Z}
verified: [{by: "human:Dominic da Costa", at: 2026-10-30}]
sources: [https://linear.app/upmind-automation/issue/FE-3580]
---

## Context

`/order/domains/` crashes when the basket holds `upmindtesting.bd`. `parseDomain` asks `psl` (the Public Suffix List) where the extension starts. The list marks `*.bd` as a wildcard suffix, so `psl` returns no domain. `parseDomain` then returns `undefined`. The DAC machine reads `parsed!.tld` on that value and throws.

Nine ccTLDs fail in this way: `.bd .ck .er .fk .jm .kh .mm .np .pg`. No `psl` release fixes the bug class. The legacy cart and the widgets do not use `psl` to parse a domain. They split the domain at the first dot. This spec makes headless do the same.

## Scope / Non-goals

- In: `parseDomain` splits at the first dot. It no longer calls `psl`.
- In: the DAC machine never throws on a basket item that does not parse.
- In: a baseline test over a fixed list of domains, run before and after the change.
- Out: removing the `psl` package. `useCookies` still uses `psl` to find the cookie domain.
- Out: the Meta Pixel currency warning on the same page. It is harmless and separate.

## Design

### Behaviour

The basket holds `upmindtesting.bd`. The operator opens `/order/domains/`. The page loads. The basket row shows `upmindtesting.bd`, with SLD `upmindtesting` and TLD `.bd`.

### Contract

`parseDomain` is a public export of `@upmind-automation/headless`. Its return shape does not change: `{ sld, tld, domain }`, or `undefined`.

- `parseDomain` cleans the input with `sanitiseDomainInput`, then splits it. This is the rule that the widgets use.
- The SLD is the first label. The TLD is a dot plus every label after it.
- The cleaning removes a protocol, a leading `www.`, a port, a path and invalid characters. The output is lower case.
- `parseDomain` does not reject input with a pattern. The API decides if a domain is valid, as in the legacy cart and the widgets.
- Input that has no SLD or no TLD after the cleaning returns `undefined`.

The baseline table pins every case. "Same" means the after result equals the before result.

| Input | Before (`psl`) | After (first dot) |
| --- | --- | --- |
| `example.com` | `example` · `.com` | same |
| `example.co.uk` | `example` · `.co.uk` | same |
| `example.com.au` | `example` · `.com.au` | same |
| `example.uk` | `example` · `.uk` | same |
| `example.photography` | `example` · `.photography` | same |
| `EXAMPLE.COM` | `example` · `.com` | same |
| `my-site.com` | `my-site` · `.com` | same |
| `123.com` | `123` · `.com` | same |
| `xn--bcher-kva.com` | `xn--bcher-kva` · `.com` | same |
| `example.blogspot.com` | `example` · `.blogspot.com` | same |
| `www.example.com` | `example` · `.com` | same |
| `www.example.co.uk` | `example` · `.co.uk` | same |
| `upmindtesting.com.bd` | `upmindtesting` · `.com.bd` | same |
| `upmindtesting.bd` | `undefined` | `upmindtesting` · `.bd` |
| `example.ck` `.er` `.fk` `.jm` `.kh` `.mm` `.np` `.pg` | `undefined` | `example` · the ccTLD |
| `shop.example.com` | `example` · `.com` | `shop` · `.example.com` |
| `example` | `undefined` | same |
| empty string | `undefined` | same |
| `-example.com` | `undefined` | `example` · `.com` |
| `exa mple.com` | `undefined` | `example` · `.com` |
| `example..com` | `undefined` | `example` · `.com` |
| `https://example.com` | `undefined` | `example` · `.com` |
| `example.com-` | `undefined` | `example` · `.com` |
| `_dmarc.example.com` | `example` · `.com` | `dmarc` · `.example.com` |
| `co.uk` | `undefined` | `co` · `.uk` |
| `www.com` | `www` · `.com` | `undefined` |

### Invariants and failure paths

- The DAC machine leaves out a basket item that does not parse. The domains page does not throw.
- No `parsed!` non-null assertion stays in the DAC machine.

### Decisions

- Split at the first dot, as the legacy cart and the widgets do. Rejected: match the longest extension that the brand sells. No client endpoint lists the brand's extensions. Only the admin `/tlds` endpoint does.
- Clean the input, do not reject it. The legacy cart and the widgets both clean and leave validation to the API. Rejected: keep `DOMAIN_PATTERN` as a gate. Without `psl` behind it, the pattern lets invalid names through and rejects valid ones.
- Accept the subdomain change. `shop.example.com` now gives SLD `shop`. The operator accepted this to match the legacy cart and the widgets.
- Keep `psl` as a dependency for `useCookies`. Rejected: remove the package. `useCookies` needs the registrable domain for a cookie.

## Tasks

- [ ] Baseline tests pin the before column of the table and the DAC basket rows of today. They pass on the current code. (T01, T03)
- [ ] A regression test proves the `.bd` crash. It fails on the current code. (T02)
- [ ] `parseDomain` gives the after column of the table, with no `psl` call. (T04)
- [ ] The DAC machine loads a basket that holds `upmindtesting.bd`, and it holds no `parsed!` assertion. (T05)
- [ ] The headless unit suite passes. (T06)
- [ ] The domain e2e specs pass. (T07)

## Test plan

- Every row of the baseline table, before and after. Only the rows the table marks as changed may change.
- The DAC machine receives a basket with `upmindtesting.bd`. Before the fix it throws. After the fix the basket row holds SLD `upmindtesting` and TLD `.bd`.
- The DAC machine receives a basket with one item that does not parse. It drops the item and keeps the others.
- The existing DAC basket behaviour stays the same for `.com` and `.co.uk` items.
- The e2e specs under `tests/Playwright/e2e/e2e-tests/domain-availability-checker/` and `buying-journeys/domain-customers.spec.ts` pass.

## Open questions

None.
