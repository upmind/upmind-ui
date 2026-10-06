# Companion — /health-check-codebase (Upmind monorepo bindings)

## Authority in this repo

- Rules: the plugin's one-principle rules (`rules/<id>.md`), this repo's project rules (`.claude/rules/<id>.md`) and the companions (`.claude/rules/<id>.companion.md`). The project rules hold the module shape: `mod-classify`, `mod-layer-contents`, `mod-form-model`, the `svc-` rules, `comp-scoped-when`, `comp-arm-compat`, `comp-actor-filters`, `comp-canonical-names`, `comp-destroy-vs-stop`, `comp-lifecycle-doc` and `ui-module-anatomy`.
- File-kind rules (base *Proposed actions* and *Architecture* steps 1–2): classify a declaration by `mod-classify`; its home is the file kind in `mod-layer-contents` (headless modules) or `ui-module-anatomy` (`packages/modules-*`, client-vue modules).
- Lanes: the `svc-` project rules go to the `architecture` lane.
- ADRs: `# ADR <n>:` documents with a `**Status:**` line (today all under `docs/adr/`). ADR-001 (scope-based composables, four layers, instance keying), ADR-005 (XState), ADR-006 (TanStack; the guard shape at its "guard" example: `guard: async () => { if (!…) throw new NotAuthenticatedError(); return true }`), ADR-014 (service layer), ADR-032 (schema family) bind module shape. ADR-002 is Proposed: context, not authority. ADR-011 says it is superseded by rules; the rules carry the current direction.
- The variance law applies ADR-001. The `scope-based/*` lints (`complete-layer-set`, `actor-scope-first`, `no-cosplay-arm`, `no-self-branch`, `require-decision`, `no-private-instance-axis`) carry its decidable clauses; rules `comp-scoped-when` and `comp-arm-compat` carry the rest. Its required shapes are not findings: the four-layer return; the `scopedServices` switch with only a `default:` case in an armless module (the uniform seam an arm is later spread into); the `actorScope` first parameter on every layer factory.
- A `@decision` comment records a deviation; it never licenses one. Grade the construct it defends by the rules, and grade the block itself by the cruft lane.

## Reference modules — the mature shape leads

| Variant | Reference | Note |
| --- | --- | --- |
| Machine-backed, scoped, with actor arms | `packages/headless/src/modules/auth/` | The one module with zero lint suppressions. Its layers, factory, `scopedServices` switch, machine-service shape and alphabetical returns are the standard. It is not above the rules: it imports `t` from `xstate` (an identity, so its keys never translate) and carries hard-coded English messages — those are findings. |
| Machine-backed, flat | `basket/`, `product/` | The flat `export default { … }` services bag and inline `Promise.reject(new DetailedError(t("error.…"), responseCodes.…, ErrorOrigin.Headless))` precondition are the standard. Their `parse*` mappers in utils and commented-out code are findings. |
| Query-backed, scoped collection | **none is mature.** | Every query-backed module (client-*, invoices, contract, contract-product, tickets) carries the 2026-08-05 `client-email` shape: reactive state and meta in the services factory. Grade them by `mod-state-once`, `mod-layer-contents`, the `comp-` rules and the machine-backed references for everything the variant shares (precondition, error, URL, factory of functions, alphabetical returns). The exemplar for this variant is designated by decision once one module is rewritten to the rules (FE-3272 rewrites `contract-product`). |

## Platform seams — one home each (consume, never re-derive)

| Knowledge | Owner | Copies to report |
| --- | --- | --- |
| Resolve the request-target client from a scope context | `session-store` `resolveClientId(scopeContext)` (`session-store.utils.ts`, exported from the barrel) | module-local `resolveClientId` / `addressableClientId` / `useIsAddressable` in services files; the shared seam gates on `isScopeAllowed` where the copies do not — surface that as the decision |
| Is the scope addressable (authenticated and targeting a client) | no helper: the one-line check `isAuthenticated.value && !!clientId.value` is written inline where it is needed; in meta it is `isAvailable` | `isAddressable`, `ensureAddressable` helpers |
| Wait for the session to settle, then for a list to fetch | **no home today** — `addressableOutcome` / `whenSessionSettles` / `whenListFetched` are copied into ~20 actions files; this is the under-abstraction the consistency lane names, and its home is the session store (settle) and the query wrapper (fetched) | every copy |
| Cache-key invalidation | `invalidateQueryByKey` / `resetQueryByKey` from `../query`, called where the action is written | a `refresh` service that only wraps one `invalidateQueryByKey` call |
| Query handle and request state | `useQuery()` from `../query` (`list`, `listInfinite`, `query`, `get`, `post`, …) | `useQuery as useVueQuery` from `@tanstack/vue-query`; a hand-built handle of computeds |
| Errors | `DetailedError(t("error.<key>"), responseCodes.X, ErrorOrigin.Headless[, data])` with `t` from `../system-localisation` | a literal message; `t` from any other module |

## Vocabulary — the names the mature code uses (report anything else as drift)

| Concept | Name | Receipt |
| --- | --- | --- |
| Services factory | `create<Module>Services(scopeActor, scopeContext, …refs)`; members are function references in alphabetical order; `scopedServices(scopeActor): <Module>Services` switch | `auth.services.client.ts` factory; `auth.services.ts` switch |
| Machine services map | `<module>MachineServices` | `auth.services.ts` |
| Machine service | `async function x(context: <Module>Context, _event: AnyEventObject)`; unused params `_`-prefixed | `auth.services.ts` `checkSession` |
| Read requests | `load` (the machine's read), `loadList`, `loadOne`, `loadLookups`, `load<Thing>` — never `fetch*`, `get*`, `read*` for a request function | `loadLookups` (auth), `loadList` ×13 |
| Write requests | the domain verb (`authenticate`, `register`, `convert`, `claimBasket`); CRUD as `add` / `update` / `remove`; a property write as `set<Property>` | auth arms; client modules |
| Request → body mapper | `map<Form>Data` (auth) · `to<Thing>Body` (newer) — **decision pending**; report the split, do not pick | `auth.mappers.ts`; `contract-product.mappers.ts` |
| API → model mapper | `parse*` in the mappers file (today in utils in basket/product — a finding) | — |
| Cache key | `export const queryKey: QueryKey = ["<root>", …]` in the services file, exposed as the factory's one non-function member | 14 services files |
| Layer factories | `create<Module><Layer>(actorScope, <holder>[, scopeKey, …refs])`; arm `create<Actor><Module><Layer>` | `useAuth.*.ts` |
| Scope function | `create<Module>ForScope(config, scopeKey)` | 28 of 28 |
| Meta | `is* / has* / can* / show*` booleans only; `isAvailable` (the scope can act), `isLoading`, `hasError` (singular) | `hasError` ×19 vs `hasErrors` ×9 — decision pending, report the split |
| Context | `data` (list), `model` (record), `error`, `schema` / `uischema`, `lookups` | — |
| Actions | `destroy` (stops the holder + `remove(scopeKey)`), `isReady(): Promise<boolean>`, `refresh`, `reset`, `invalidate`, `filterBy` / `sortBy` / `setCriteria`, `nextPage` / `prevPage`, `input` (debounced form feed), `update` (submit); `set` for a whole model | `useAuth.actions.ts`; client lists |
| Precondition failure | `return Promise.reject(new DetailedError(…))` in a service; `throw new NotAuthenticatedError()` inside an `async` guard | `basket.services.ts`, `product.services.ts`; ADR-006 |
| Request options | mutations open `mutationKey, url`; queries open `url, queryKey` (mature) — the newer `queryKey, url` order is a split; report it | `auth.services.client.ts`; `invoices.services.ts` |
| File header | `/** @internal */` on line 1 (internal kinds); `@module` block **after** the imports between 80-char rules | `auth.services.ts` |

## Comments in this repo

- Density: the mature modules sit at 0.27–0.31 (comment lines ÷ code lines, header and separators excluded); the repo median file is 0.31. Report any file above 0.6 as a cruft finding in its own right; types files above 1.0 are JSDoc-per-member restatement.
- Provenance tokens to count: `FE-\d+`, `\bR\d+[a-z]?\b`, `AC-\d+`, `ADR[- ]?\d+`, `design \d` / `§\d`, `parity`, `legacy`, `20\d\d-\d\d-\d\d`, `operator (ruling|correction)`, `withdrawn|corrected`, `\w+\.(vue|ts):\d+`.
- `@decision` blocks: the mature modules have none. A block that cites an ADR and states what / why / rejected in the present is KEEP; one that carries dates, ids, rulings or history is Bloat + Provenance.
- Term drift: the code and the i18n keys say `product` and `migration`; comments that say `plan` are drift.

## i18n in this repo

Keys live in `packages/i18n/src/` only (`public/locales` is generated). Error messages: `src/core/error-en.json`, flat `snake_case`, prefixed by context, read as `t("error.<key>")` with `t` from `../system-localisation` (`packages/i18n/CLAUDE.md`). A thrown `DetailedError` takes its message from such a key. There is no `errors.*` namespace.

## Generators

The factory templates live in `.claude/skills/factory/composable/templates/` (`query/`, `machine/`). Grade them as source whenever the target is `packages/headless` or the templates themselves. They currently seed the query-backed anti-shape (reactive client id in services, `new Promise` guards, meta from the factory, 1.49 comment lines per code line).

## Fan-out

`packages/headless/src/modules/` holds 55 modules. Fan out one assessor per group of ~5 modules off the main context, and merge the per-group triage into one report.
