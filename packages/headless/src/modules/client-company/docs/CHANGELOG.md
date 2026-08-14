# Changelog

All notable changes to the `client-company` module are documented here. Format
follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — rebuilt as two scoped composables

This module was rebuilt from two flat, unscoped composables into the scoped
shape documented here: a query-backed collection (`useClientCompanies`) and a
`dataManagerMachine`-backed per-company form editor (`useClientCompanyManager`),
sharing one identity seam and one services factory.

### Added

- **`useClientCompanies`** — the collection, as a scoped composable:
  `.as('client')` resolves the calling client's own companies.
  - 10 actions — `destroy`, `ensure`, `filters.query`, `invalidate`, `isReady`,
    `nextPage`, `prevPage`, `refresh`, `remove`, `setDefault`.
  - 6 context members — `data`, `default`, `error`, `findOne`, `getOne`,
    `pagination`.
  - 7 flat meta flags — `hasError`, `hasNextPage`, `hasPages`, `hasPrevPage`,
    `isAvailable`, `isEmpty`, `isLoading`.
  - 2 internals — `actorScope`, `query`.
- **`useClientCompanyManager`** — the per-company editor, as a scoped
  composable: `.as('client').for('company', id)` opens an existing company;
  `.as('client').fresh()` starts a new one, with its own isolated instance per
  call.
  - 7 actions — `clear`, `destroy`, `input`, `isReady`, `onDone`, `stop`,
    `update`.
  - 16 context members, including the model, the schema/uischema pair, and the
    client's own address/email/phone/country/region look-ups the form needs.
  - 8 flat meta flags — `hasErrors`, `isAvailable`, `isComplete`, `isDirty`,
    `isLoading`, `isNew`, `isProcessing`, `isValid`.
  - 4 internals — `actorScope`, `send`, `service`, `state`.
- **The list request now includes staged-import companies** and an explicit
  ascending order by creation date, closing two divergences from the legacy
  application's own request shape.
- **A brand-config-fetch ahead of the tax-validation flag read** — the flag a
  consumer reads to decide whether to show tax-validation status is now
  backed by a config value the module actually fetches for the current brand,
  rather than reading whatever the brand store happens to already hold.
- **An explicit create path on the editor** — a `.fresh()` save reaches a real
  create operation directly, rather than being routable only through
  find-or-create.
- **Address, email and phone controls on the form**, alongside the existing
  address block — a client can now choose which of their own email and phone
  records a company uses, not only its address. The client's own look-up
  collections were already being fetched; only the form controls were
  missing.
- **A partial-update path on edit** — editing an existing company now sends
  only the fields that actually changed, computed against the model's
  persisted baseline, rather than resending every field on every save.
- **A one-shot readiness resolution for both composables that always settles**
  — neither composable's readiness promise can hang forever on an
  unauthenticated or never-settling session.
- **A captured `422` rejection for an invalid dependency reference** (an
  address/email/phone id that does not resolve to a record the client owns),
  documented in [foundation.md](./foundation.md#failure-modes) and
  [gotchas.md](./gotchas.md).

### Changed

- **`useClientCompanies().useContext().default()` now returns the default
  company's id, not the row.** Every known call site inside this codebase has
  been migrated. See the migration guide below.
- **The company-editing form's display title and description are now built
  from the correct model fields** — a previous version read from a field path
  that did not exist on the form's model, so the registration number and tax
  number never rendered in the summary text.
- **A save failure on the editor now surfaces this module's own failure
  message**, rather than one belonging to a different module.
- **A construction-time authentication check no longer admits an
  unauthenticated, client-less caller to a destructive request.** Both delete
  and set-default now share one addressability check with every other
  request-issuing function in the module.
- **Documentation refreshed against the shipped surface** — README, usage,
  architecture, gotchas and foundation now describe both composables, the
  real recorded fixtures, and the real failure modes.

### Removed

- **The client-targeting option on the per-company editor.** A previous
  version of this composable accepted a client id as a constructor option
  that reached internal state but never actually retargeted a request — every
  outbound request always used the session's own client regardless of what
  was passed. That option is gone outright, not renamed; see
  [gotchas.md](./gotchas.md) for the migration.
- **`useClientCompanyServices` is no longer exported** from the module barrel.
  The one cross-module consumer that reached it directly now goes through the
  collection's `ensure` action instead.
- **Toast and notification feedback.** `remove` and `setDefault` no longer
  raise success or error messages from this module. Errors are captured as
  state; the consumer raises its own feedback. See the migration guide below.
- **Staff-acting-for-a-client, and every staff-only capability, are not part
  of this module.** The wider platform genuinely supports a staff member
  managing a named client's companies; this module does not carry that
  capability. This is a deliberate, tracked scope decision, not an
  accidental omission — see [gotchas.md](./gotchas.md) §1. A tracking issue
  for restoring it is owed and its reference is, as of this writing, still
  pending assignment.
- **Client-triggered tax/VAT-number _validation_ is not part of this module.**
  The module can display whether a company's tax number has been validated,
  and by what service — that display capability is unchanged and fully
  present. _Triggering_ a fresh validation check was never a capability a
  client held on the legacy application either (it was gated to staff there)
  and is not one here; a future story would be needed if that capability is
  ever wanted for a client.

### Fixed

- **Every request URL derives its target client from the resolved scope**,
  through one seam shared by the collection, the editor and every
  request-issuing function — the list read, the per-company read, create,
  update, delete and set-default. An instance addresses exactly the client
  its scope named.
- **Companies now come back in a stable, oldest-first order** by default,
  rather than in whatever order the server happened to return on a given
  call.
- **The collection's readiness wait no longer hangs** when the session settles
  without an addressable client; same fix applied to the editor's own
  readiness wait, which previously had no timeout at all on that path.
- **A collision between concurrently-open "new company" drafts is closed** —
  two `.fresh()` editors opened at the same time no longer share one
  underlying instance.
- **`useMeta().isAvailable` on the collection now reflects both preconditions**
  — authenticated, and a client id resolved — rather than the session flag
  alone, which previously advertised availability the underlying request
  layer would still refuse.

### Recorded fixtures

Real request/response pairs captured against a live environment back the
documented behaviour, alongside the sibling look-ups the form editor depends
on:

| Fixture                                                                                     | Covers                                                                 |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `get-clients-id-companies-with-staged-imports-1.json`                                       | the list read, including staged-import companies                       |
| `get-clients-id-companies-case-page-1.json` / `-page-2.json`                                | the platform's own paging response shape (see gotchas §2)              |
| `get-clients-id-companies-case-order-check.json`                                            | the platform's server-side ordering                                    |
| `get-clients-id-companies-id.json`                                                          | the per-company read                                                   |
| `post-clients-id-companies.json`                                                            | create (request body captured too)                                     |
| `put-clients-id-companies-id.json`                                                          | a partial edit — one changed field                                     |
| `put-clients-id-companies-id-case-set-default.json`                                         | promoting a company to default                                         |
| `put-clients-id-companies-id-case-update-rejected.json`                                     | the `422` rejection on an invalid dependency reference                 |
| `delete-clients-id-companies-id.json`                                                       | delete                                                                 |
| `get-clients-id-addresses.json`, `get-clients-id-emails.json`, `get-clients-id-phones.json` | the client's own sibling look-ups the form editor loads                |
| `get-countries.json`, `get-countries-id-regions-case-country-a.json` / `-country-b.json`    | the country/region cascade the inline address block uses               |
| `get-config-brand-values-*.json`                                                            | the brand configuration the tax-validation flag and address rules read |

### Notes

- Both composables act on the calling client's own companies only. Neither
  scope matrix defines a context for `staff` or `guest`, so naming a target
  for either — the only way either could reach a client's companies at all —
  fails to compile.
- `default()` returns an id, editing sends only the changed fields, and
  neither composable exposes a way to target a different client — see
  [gotchas.md](./gotchas.md) for all three in detail.

### Not captured

- The rejection shape when the platform declines to delete a record it marked
  non-deletable (`can_delete: false`). The flag stays documented as
  informational until a rejection is observed.

---

## Migration Guide

### Reading the default company

**Breaking change:** the collection's `default()` now resolves an id, not a
row.

```ts
// Before
const defaultCompany = companies.useContext().default();
const name = defaultCompany?.name;

// After
const { default: defaultId, getOne } = companies.useContext();
const defaultCompany = getOne(defaultId());
const name = defaultCompany?.name;
```

### Removing a client id from the editor

**Breaking change:** there is no client-targeting option on the editor
anymore, under any name.

```ts
// Before
useClientCompanyManager(companyId, { clientId });

// After
useClientCompanyManager().as("client").for("company", companyId);
```

### Reaching the collection's services directly

**Breaking change:** the services layer is no longer exported.

```ts
// Before
const { ensure } = useClientCompanyServices();

// After
const { ensure } = useClientCompanies().as("client").useActions();
```

### Raising your own feedback

**Breaking change:** the module no longer raises toasts or notifications on
delete or set-default.

```ts
// Before — the module announced success and failure itself
await remove(id);

// After — read the outcome and decide what the user sees
const { error } = companies.useContext();
const { hasError } = companies.useMeta();

await remove(id).catch(() => undefined);
if (hasError.value) notifyFailure(error.value?.message);
else notifySuccess();
```

For the editor, `useActions().onDone()` resolves once a save has completed,
and `useContext().errors` / `.validationErrors` carry the failure detail.

### Reading the editor's state flags

The editor's `useMeta()` returns one computed per flag, not a single `meta`
object — this was already the shape before this rebuild and is unchanged:

```ts
const { isValid } = manager.useMeta();
if (isValid.value) await save();
```

Flags available: `hasErrors`, `isAvailable`, `isComplete`, `isDirty`,
`isLoading`, `isNew`, `isProcessing`, `isValid`.
