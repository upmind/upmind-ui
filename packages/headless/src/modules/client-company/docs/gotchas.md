# client-company — Gotchas

The sharp edges of the client's own company collection and its per-company
editor. For anyone consuming `useClientCompanies` / `useClientCompanyManager`,
or writing tests against them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour
> statement. Fixture names point at the recorded request/response pairs in
> `__tests__/fixtures/`.

## 1. This module only serves a client acting on their own companies — and there is no way to name a different target, for any actor

The platform this module talks to genuinely supports a staff member managing
an arbitrarily named client's companies, and a staff member's own client
record. **Neither is in this module.** Neither scope matrix defines a target
context for `staff`, `self`, or `guest` — only for `client` — which is
enforced where it actually matters: **chaining `.for(...)` after any actor
but `client` fails to compile**, because there is no context type for it to
accept.

```ts
// ⚠️ Wrong: there is no context to chain onto a staff (or self, or guest) scope
useClientCompanies().as("staff").for("client", someClientId); // compile-time error — no `.for()` exists here
useClientCompanyManager().as("staff").for("company", someCompanyId); // same

// ✅ Right: the only actor with a context on either matrix
useClientCompanies().as("client");
useClientCompanyManager().as("client").for("company", companyId);
```

**Be precise about what this does and does not block.** The bare call
`.as('staff')` — with no `.for(...)` after it — is not itself a compile
error; it returns a working instance, because a scope builder resolves any
bare, context-less actor the same way regardless of module. What that
instance then _does_ is the real story: with no context supplied, every
request this module issues resolves its target from whichever id the active
session itself carries — never from a named client. For a staff session that
id is not a client id at all, so a request built from it addresses a resource
that does not correspond to any real client's companies. There is no
capability behind that call, working or broken — it is simply not a path
anyone should use, and no fixture or test exercises it, because there is
nothing meaningful on the other end of it.

```ts
// ⚠️ Wrong: assuming this either works as staff-acting-for-a-client, or fails to compile
useClientCompanies().as("staff"); // compiles; resolves to the STAFF session's own id, not any client's
```

A staff-impersonating-a-client path, and staff-only capability gating on
create/update/delete, are likewise not in this module — the current headless
carries no capability read for either, because there is nothing to gate for
the one actor this module meaningfully serves.

> **🧪 For Testers:** Do not write a test asserting `.as('staff')` fails to
> compile — it does not. Assert instead that `.as('staff').for(...)` fails to
> compile (no such method exists on that result), and that no fixture,
> scenario, or assertion anywhere in this module's test suite claims a
> working staff-acting-for-a-client capability — because a dropped capability
> must have no green test claiming it, and there is none here.

This gap is tracked, not silently absent — a tracking issue for restoring
staff-acting-for-a-client is owed and, as of this writing, its reference is
still pending assignment. If your integration needs a staff member to manage
a named client's companies, that capability exists on the platform but not
through this module; raise it with whoever owns this module's roadmap rather
than assuming it will appear as a hidden option.

## 2. `nextPage()` / `prevPage()` need a page size before they have anywhere to go

The collection's query schema declares `pagination.limit` with `default: 0` —
an unpaged, whole-collection read, for every scope, unconditionally — because
both legacy consumers ask for exactly that
(`billableEntitiesProvider.vue:191-203`, `clientCompanySelect.vue:110-114`).
Under that default the query platform treats the request as returning exactly
one page, so `nextPage()` and `prevPage()` find there is no other page to move
to.

```ts
const companies = useClientCompanies().as("client");
const { hasNextPage } = companies.useMeta();

await companies.useActions().isReady();
console.log(hasNextPage.value); // false — the default is one unpaged page

await companies.useActions().nextPage(); // settles; nowhere to go yet
```

**`setCriteria({ pagination: { limit } })` is the door that opens paging.**
It is the platform's generic criteria door, publishing `query.setCriteria`
directly — the same door `client-address` and `client-email-history` publish
for the identical gap. Once a non-zero `limit` is set, `nextPage()` /
`prevPage()` walk real pages and `hasNextPage` / `hasPrevPage` / `hasPages`
track a real paged window:

```ts
await companies.useActions().setCriteria({ pagination: { limit: 2 } });
console.log(hasNextPage.value); // reflects the real second page, once loaded

await companies.useActions().nextPage(); // moves to offset=2, different rows
await companies.useActions().prevPage(); // back to offset=0
```

This default is **not a regression introduced by this conversion** — the same
"no page size" default was already the effective behaviour on both the legacy
application and the pre-conversion headless module. What changed is that there
is now a consumer-facing door past it.

> **🧪 For Testers:** Do not write a test that expects `nextPage()` to change
> the visible rows through `useClientCompanies()`'s DEFAULT configuration —
> `pagination.limit` starts at `0` on purpose. Do assert that
> `setCriteria({ pagination: { limit } })` changes that: the wire carries
> `limit=<N>&offset=0` immediately after, and a subsequent `nextPage()` moves
> the `offset` on by `limit` and returns different recorded rows.

Fixtures: `__tests__/fixtures/get-clients-id-companies-case-page-1.json`,
`-page-2.json` are the real recorded pages `setCriteria` + `nextPage()` /
`prevPage()` walk once a page size is set.

## 3. `default()` returns an id, not a row

`useClientCompanies().useContext().default()` resolves the default company's
**id** (a string), or `undefined` if no company is flagged default. It does
not resolve the row itself.

```ts
const { default: defaultId, getOne } = companies.useContext();

// ⚠️ Wrong: treating default() as the row
const name = defaultId()?.name; // undefined — default() has no `.name`

// ✅ Right: look the row up
const row = getOne(defaultId());
const name = row?.name;
```

This is a genuine contract change from an earlier version of this module,
where the equivalent call returned the row. Every known call site inside this
codebase has been migrated to the id contract; a caller integrating fresh
against this module should treat `default()` as an id from the start.

> **🧪 For Testers:** Against a fixture with exactly one `default: true` row,
> `default()` resolves that row's `id` and `meta.isDefault` reads `true` on it
> and `false` on every other row. Against a fixture with no default row,
> `default()` resolves `undefined` and does not throw. `getOne(undefined)` is
> safe and also resolves `undefined`.

## 4. There is no client-targeting option anywhere on this module

`useClientCompanyManager` takes no constructor option, of any name or shape,
that lets a caller name a different client than the one the scope resolved.
The company being edited comes from `.for('company', id)` or `.fresh()`; the
client it belongs to is always derived from the same identity seam the
collection uses, which always resolves to the calling client's own session
under this module's current scope.

```ts
// ⚠️ Wrong: there is no client-id parameter to pass, under any name
useClientCompanyManager(companyId, { clientId }); // not a real call signature

// ✅ Right
useClientCompanyManager().as("client").for("company", companyId);
```

If you are migrating code that used to pass a client id into the editor, there
is nothing to rename it to — remove it. The company being edited already
carries enough information (through the scope) to resolve the right client;
a caller-supplied client id was never actually honoured by any outbound
request in the first place.

> **🧪 For Testers:** No exported function on either composable accepts a
> `clientId` parameter, under any name, from a caller. Every request the
> module issues — list, read-one, create, update, delete, set-default —
> carries the client id resolved from the active session's own identity in
> its URL.

## 5. The services layer is not exported; two schema functions deliberately are

`useClientCompanyServices` — the raw functions behind both composables — is
**not** on the module barrel. Every function in it resolves a client and
issues a request, so exposing it directly would give a caller a second,
unscoped route to this module's data, bypassing the very scope resolution the
rest of the module relies on. A caller that used to reach it directly should
go through the collection's `ensure` action instead:

```ts
// ⚠️ Wrong: not exported
import { useClientCompanyServices } from "@upmind-automation/headless"; // undefined

// ✅ Right — the same find-or-create capability, through the resolved scope
const { ensure } = useClientCompanies().as("client").useActions();
await ensure({ name: "Acme Ltd", addressId: "some-address-id" });
```

Separately, and deliberately, **`useCompanySchema`** and **`useCompanyUischema`**
_are_ exported, even though nothing else on this module's data layer is. They
are pure functions — no scope, no session, no request, no reactive state — for
a different module to compose the company's form fields into a _parent_
schema. They are not a second way to render the company form for its own sake.

```ts
// ✅ Right — a consumer rendering the company form itself
const { schema, uischema } = useClientCompanyManager()
  .as("client")
  .for("company", id)
  .useContext();

// ✅ Also right — a DIFFERENT module composing the company's fields into its own schema
import {
  useCompanySchema,
  useCompanyUischema
} from "@upmind-automation/headless";
const fragment = useCompanySchema({ countries, regions, baseModel, config });
```

> **🧪 For Testers:** `useClientCompanyServices` is absent from the module's
> runtime exports; asserting it resolves is asserting `undefined`.
> `useCompanySchema` / `useCompanyUischema` ARE present, and calling either
> produces a plain object with no side effect and no request — calling them
> twice with the same arguments is safe and idempotent.

## 6. A failed save can render the raw i18n key instead of its message, until translations sync

The failure message the editor's `update()` rejects with is resolved through a
translation key that already exists in the shared source locale file every
module's messages are authored against. In a development environment, that
source file is loaded directly as a fallback, so the message resolves
correctly there regardless of what has reached the served translation bundle.
In a production build there is no such fallback — the message depends on the
separate translation-management sync having already picked the key up into
the bundle that ships. Until that sync has run, a production build renders
the **raw key string** to the user on a failed company save instead of a
readable sentence.

```ts
try {
  await manager.useActions().update({ name: "" });
} catch (error) {
  // In DEV: "We experienced an error updating this company"
  // In PROD, before the sync: the literal key string itself
  console.log(error.message);
}
```

> **🧪 For Testers:** Do not assume a resolved-looking error message in a local
> or DEV run proves the same message will render in a production build — DEV
> loads the source locale files directly as a fallback, which papers over a
> translation that has not yet reached the production message bundle. If you
> see the raw key rendered in a shipped environment, this is why.

## 7. A watcher waiting on a cold-boot client id can outlive the editor that started it

At construction, if the session has not yet resolved a client id, the editor
starts a one-shot watcher that waits for one to arrive and then feeds it into
the machine. That watcher stops itself once it fires — but if the editor is
destroyed _before_ the client id ever resolves (for example: a form is opened
during a page's initial load and closed again before sign-in settles), the
underlying watch is never explicitly torn down by `destroy()` or `stop()`.

> **🧪 For Testers:** This is only observable by mounting, then unmounting, an
> editor instance during the window before authentication settles, and
> checking whether the effect scope that held the watcher was released. It is
> not exercised by a normal "sign in, then open the form" flow, where the
> watcher already fired and self-cleared long before `destroy()` is ever
> called.

## 8. `isReady()`'s documented "settled in error" outcome cannot currently occur

The editor's `isReady()` is documented to resolve `false` if the machine
settles in error, mirroring the collection's readiness contract. The check
behind that promise, however, tests for a state path that the shared
form-editor machine never actually reaches from where the check runs — the
error sub-state the editor settles into is nested one level deeper than the
path the check looks for. In practice this means the "settled in error"
branch of `isReady()` never fires: an editor that settles with a captured
error still resolves `isReady()` `true`.

> **🧪 For Testers:** Do not write a test asserting `isReady()` resolves
> `false` after a `loadLookups` failure that leaves the machine in its error
> state — as currently wired, it resolves `true`. Assert `useMeta().hasErrors`
> instead; that flag reads the correct, nested state path and reports
> accurately.

Separately: if the shared machine were ever to settle in a state outside the
`available` branch entirely (rather than inside it, in an error sub-state),
`isReady()` would never resolve at all — the wait behind it has no timeout.
This has not been observed in practice, because the shared machine's only
paths out of loading lead into `available` one way or another, but it is worth
knowing the wait is unbounded if that ever changes.

## 9. `refresh()` on the collection can resolve successfully over a failed re-fetch

Forcing a re-read with `refresh()` only rejects when the scope cannot address
a client at all. Any _other_ failure — a `500` from the server, for example —
is not re-thrown; the call still resolves.

```ts
// ⚠️ Wrong: assuming a resolved refresh() means the re-fetch succeeded
await companies.useActions().refresh();
render(companies.useContext().data.value); // may still be showing stale/empty data

// ✅ Right: check the error state after refreshing
await companies.useActions().refresh();
if (companies.useMeta().hasError.value) {
  // the re-fetch failed; render from useContext().error
}
```

> **🧪 For Testers:** A `500` on the underlying re-fetch does not make
> `refresh()`'s promise reject. Only "no addressable client" does. Pair every
> `refresh()` call with a check of `useMeta().hasError` if you need to know
> whether the re-fetch actually succeeded.

## 10. The editor's `update()` write path for an existing company skips the shared addressability guard

Every other request-issuing function in this module — the collection's list
read, delete and set-default, and the editor's own create path — checks the
one addressability predicate before issuing a request. The editor's _update_
path for an already-existing company is wired slightly differently: it
resolves dependencies and sends the request directly, without that same
explicit pre-check.

In practice this is unlikely to be reachable by a normal caller, because
`update()` itself already refuses to proceed when the session cannot address a
client, before the machine-level write path is ever reached. It is recorded
here as a structural asymmetry worth knowing about if this file is ever
refactored — the write path in question is the one exception to "every request
function checks the guard directly," and a future change that removes the
caller-level check would silently remove the only guard this path has.

> **🧪 For Testers:** Do not write a unit test that isolates the internal
> update write path and asserts it independently checks addressability — it
> does not, and today's only protection is the outer `update()` check
> described above. Test the observable behaviour (`update()` rejects when
> unauthenticated) rather than the internal path.

## 11. An address is always resolved on save; an email or phone is only resolved when supplied

Saving a company always resolves an address dependency — by id, or by
creating one from an inline value — even when the model carries neither an
`addressId` nor an inline `address`. An email or a phone, by contrast, is
skipped entirely (resolved to nothing, not an error) when the model carries
neither its id form nor its inline form.

```ts
// Address dependency is ALWAYS attempted, even with nothing supplied
// Email and phone dependencies are skipped when nothing is supplied for them
await manager.useActions().update({ name: "Acme Ltd" }); // no addressId, no email, no phone
```

> **🧪 For Testers:** A save with no address information still issues an
> address-resolution attempt (and can fail on it); a save with no email or
> phone information issues neither an email- nor a phone-resolution request at
> all. Do not expect symmetric behaviour across the three dependency kinds.

## 12. Clearing a previously-set address id does not reach the server

Setting a model key to `undefined` is meant to express "clear this value," and
the outbound-payload mapper does include a key whenever it is present on the
input object — even when its value is `undefined` — for every field except
this one. An `addressId` explicitly cleared to `undefined` is mapped onto a
request body whose corresponding key is also `undefined`, and a plain
JavaScript object with an `undefined`-valued key serialises to JSON with that
key **dropped entirely**. The clear intent never reaches the server as a
request the platform can act on.

```ts
// ⚠️ Wrong: expecting this to clear the company's address server-side
await manager.useActions().update({ addressId: undefined });
// the outbound JSON body has no address_id key at all — nothing changes
```

> **🧪 For Testers:** Do not write a test asserting a cleared `addressId`
> produces a request body with `address_id: null` — it produces a request
> body with no `address_id` key, which the server (and any consumer relying on
> "clearing" this field) sees as "unchanged," not "cleared." See
> `client-company.mappers.ts`'s `mapICompany`.

## 13. A code comment in the services layer misdescribes the shared machine's own error handling

A comment beside the form's country/region look-up justifies rejecting only
on a genuinely failed countries fetch, on the stated grounds that the shared
form-editor machine has no error transition out of that look-up step at all.
That stated grounds is not accurate — the shared machine does have such a
transition. The actual _behaviour_ the comment defends (only reject on a
genuinely failed countries fetch, not on an empty regions list) is still the
right call for the reasons given elsewhere in the same comment; only the
"there is no error transition" claim about the shared machine is wrong. Do not
use that comment as evidence about the shared machine's shape.

> **🧪 For Testers:** Do not cite this comment as a spec for the shared
> machine's behaviour. If you need to know whether a look-up failure can
> transition the shared machine into an error state, read the shared machine
> directly rather than trusting this file's comment about it.

## 14. `.fresh()` and `.for('company', id)` mint different instances — and `destroy()` differs per half

Each `.fresh()` call mints an editor with its own scope key, so two concurrent
drafts never share a model. An editor opened `.for('company', id)` is keyed to
that company.

The two halves also clean up differently:

| Half       | `destroy()` does                                                |
| ---------- | --------------------------------------------------------------- |
| Collection | removes the registry entry (there is no service to stop)        |
| Editor     | stops the underlying service **and** removes the registry entry |

The editor additionally offers `stop()`, which stops the service but leaves
the registry entry in place.

```ts
onUnmounted(() => {
  companies.useActions().destroy();
  manager.useActions().destroy();
});
```

> **🧪 For Testers:** Typing into one `.fresh()` draft leaves a second draft
> untouched. Destroying the collection does not destroy an open editor, and
> vice versa — they are separate registry entries even though they belong to
> the same module.

## 15. Errors are state you render — nothing here raises feedback

No mutation in this module produces a toast, a notification or any other
user-visible message. Every failure is captured for the consumer to read.

| Surface                              | Read the failure from                                                   |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Collection row mutation or list read | `useContext().error`, `useMeta().hasError`                              |
| Editor save                          | `useContext().errors`, `useMeta().hasErrors` — and the rejected promise |
| Editor field validation              | `useContext().validationErrors`, `useMeta().isValid`                    |

If you are migrating a consumer that previously relied on this module raising
its own success/failure toasts on delete and on set-default, that consumer now
has to render that feedback itself from the state above.

> **🧪 For Testers:** A consumer that shows nothing after a failed delete has
> not lost the error — it has not rendered `useContext().error`. Assert on the
> captured state, never on a notification.
