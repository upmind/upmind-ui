# 03 — AC-60: run-the-app read-back, no stubs

AC-60 ("the pages that show and edit my profile still work end to end") is tagged `@todo` in B's
feature because it cannot be proven by compiling — `playgrounds/labs`'s tsconfig lacks
`composite`, so `vue-tsc` fails there for reasons unrelated to this diff. It is the verifier's
read-back.

**Status: RECORDED.** Real app, real staging API, real login through the real form.

## How it was run

```
cd playgrounds/labs && pnpm dev --host qa-automation.local --port 5173     # Vite 7.3.0
# qa-automation.local -> 127.0.0.1 (/etc/hosts); dev env -> https://api.staging.upmind.io
# Playwright 1.57.0 real chromium; logged in as nathan.robinson+checkouttest@upmind.com
```

Why the browser was running **this run's source** and not a stale build — the load-bearing
detail that makes this evidence mean anything:

```
vite.config.ts: "@upmind-automation/headless" -> ../../packages/headless/src/index.ts
packages/headless/dist/*.js                  -> no matches found  (no dist exists)
```

## Rendered page — `/account/profile`, NO stub of any kind

```
Personal details
Here you can manage all personal details. …

First name        Value: Checkout          Edit
Last name         Value: Test              Edit
Public name       Value: Checkout T.       Edit
Language          Value: English           Edit
Age               Value: 44
Profile Picture   Value:

Emails
nathan.robinson+checkouttest@upmind.com   [Default]   Edit
Add new

Phones
…
```

Assertions I ran over that render:

```
errors captured (pageerror + console.error)  : NONE
HTTP 429 responses                            : NONE
still on bootstrap / Loading.vue screen?      : NO
Personal details section present?             : YES
Emails section present?                       : YES
literal "Value: undefined" anywhere?          : NO
language rendered as a raw UUID?              : NO — not a UUID
```

## The three things this settles

1. **The read verb is genuinely present end to end.** The baseline was *absent*, not rough:
   `SessionUser.customFields` (`session-store.types.ts:103`) is declared and never assigned, so
   `activeUser.customFields` was always `undefined` and every value rendered as the literal
   string `"undefined"`. It now renders a real value — `Age → Value: 44`.

2. **An edit saves.** See [`01`](./01-wire-captures-persist.md) — `{"custom_fields":{"age":44}}`,
   then the re-read rendered `44`.

3. **The language label is a NAME, not an id.** `Language → Value: English`. `mapProfileFields`
   resolves it via `find(languages, ["id", record.language])?.language ?? record.language`
   (raw-id fallback retained), while `FieldsModel.language` still holds the id so AC-33 is
   unaffected.

## An earlier stub, and why it is no longer needed — full history

My **first** attempt at this read-back could not render the page at all:

```
[Vue warn]: Unhandled error during execution of setup function
  at <ClientEmails >  … at <Profile …>
TypeError: isReady is not a function
  at .../src/pages/account/profile/components/ClientEmails.vue:31:51
```

`Profile.vue` mounts `<ClientProfile/> <ClientEmails/> <ClientPhones/>` inside one Suspense
boundary, so `ClientEmails`' throw blanked the whole page including the component under test.
`ClientEmails.vue` was **not touched by this run** — it was the `client-email` conversion's
leftover, calling the scope *builder* flat and destructuring `isReady` off it.

To grade this run's own component without editing the repo, I stubbed **only that one module at
the network layer** (Playwright `route()` fulfilling `/src/pages/.../ClientEmails.vue` with an
inert component). That was scaffolding, and I said so.

The operator authorised fixing `ClientEmails.vue` in this MR; it now resolves the scope once and
adapts the four layers to `client-vue`'s `MinimalListComposable` / `MinimalMutateComposable`
contract. **The read-back above was then re-run with the stub removed entirely** and the page
renders, so the caveat is withdrawn as resolved.

Note for accuracy: `ClientEmails.vue`'s *collection* half resolves `.as(ScopeActorTypes.SELF)`
(only its manager adapter uses `CLIENT`), and `ClientProfile.vue:49` still uses `.as("self")`.
Both are correct — `.as('self')` type-checks to plain `T` and neither needs `.for()`/`.fresh()`.

## Request economy observed on this page — RECORDED

Raw request count (not de-duplicated by my logger) for one `/account/profile` load with **both**
modules active:

```
GET /api/clients/{id}?with=custom_fields,custom_fields.field   x1
GET /api/custom_fields?…                                        x0
```

One profile read reached the network, not two. I originally attributed that to a shared
`["client", <clientId>, "record"]` query key; **that attribution is refuted** — module A's
effective key carries a `{locale}` segment (`useQuery.ts:262`) and module B's does not, so the two
entries were never shareable. In-flight dedupe or a warm `staleTime: DAY` hit are the likelier
mechanisms, and neither is visible at the network layer where I counted. The definitions list was
not fetched on the show page at all, because the embedded `custom_fields.field` satisfies it.
See [`07`](./07-gaps-and-limits.md) G3 for the full refutation and for why the post-commit
measurement must count at the **service seam**, not the network.

## The defect this read-back found (F5)

The same harness exposed that the **editor's base model is never seeded at runtime** — with the
server holding `age: 44` and all four native values, `/account/profile/edit` (no filter) rendered
all six controls blank with `model = {"customFields": {}}`. Full evidence and the reason no test
caught it are in [`07-gaps-and-limits.md`](./07-gaps-and-limits.md) and `../verify.md`
AMENDMENT 2 (F5).
