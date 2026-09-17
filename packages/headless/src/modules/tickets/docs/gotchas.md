# tickets — Gotchas

The sharp edges. Every entry below is a thing a reader hits in practice, and every one is recorded because the code alone does not explain itself.

---

## 1. The status filter is ONE tri-state boolean — and the query core never sees it

**This is the single most surprising thing in the module.** Read this one before you touch the criteria schema.

The criteria schema declares the active/closed split as **`isClosed`**, a single tri-state boolean leaf:

```ts
// tickets.schemas.ts — useQuerySchema()
filters: {
  properties: {
    isClosed: {
      type: "object",
      properties: {
        // `false` active · `true` closed · `null` All
        eq: { type: ["boolean", "null"], enum: [false, true, null] }
      }
    }
  }
}
```

…and you write it the same way:

```ts
tickets.useActions().setCriteria({ filters: { isClosed: { eq: false } } });
```

But the **wire carries a dotted status column, with a different operator per position**:

| `filters.isClosed.eq` | the wire |
| --- | --- |
| `false` (Active) | `filter[status.code|neq]=ticket_closed` |
| `true` (Closed) | `filter[status.code]=ticket_closed` |
| absent (All) | NEITHER key |

The translation happens at the module's own service edge (`tickets.services.ts` → `applyStatusCodeFilter`, driven by a `flush: "sync"` watcher inside `loadList`).

### Why one leaf and not two

The two positions want two DIFFERENT operators on one column. A JSON Forms control scopes ONE leaf, so a schema-driven control cannot drive `eq` on one position and `neq` on another. A tri-state boolean can: the module owns the mapping from position to operator, and the filter bar draws exactly the control `client-email-history` draws for `sent.eq`.

### Why it cannot simply be spelled `"status.code"` in the schema

The query core's model parser walks the schema's own declared property names and writes each through a plain lodash `set(result, key, value)`. Lodash reads a literal `"status.code"` key as the **path** `status` → `code`, not as the key `"status.code"`. So the parser emits a nested `{ status: { code: … } }` object where the schema declared a flat `"status.code"` property, AJV then rejects that nested object as an **additional property**, and the filter **silently never reaches the wire**.

### Why the branch is WITHHELD from the query core

`translateQuery` emits one wire key per branch it can see under `filters`, spelt with the branch's own property name. A visible `isClosed` branch therefore adds `filter[isClosed|eq]=0` **beside** the real key — and `isClosed` is not a column this API has. Measured against staging 2026-09-17: the dotted key alone answers `200`; the dotted key plus the undotted stray answers `500 "A critical database error occurred"`. So `loadList` hands `list()` **`useWireQuerySchema()`** — the query schema minus that one branch — and holds the position itself. Everything else still reads the FULL `useQuerySchema()`: the filter bar draws the control, the refinement chips name it, the url replay serialises it.

### The symptom you will actually see

- A filter you can see in the model, that never appears in the request's query string;
- a **`422`** validation rejection out of `setCriteria` naming an additional/unexpected property, with no request sent at all; or
- a **`500`** on every narrowed read, because a stray filter key on a column the API does not have rode along.

### The rule

- **Do not "fix" the schema to the dotted spelling.** It looks more correct and it is the bug.
- **Do not declare the status branch in the schema `list()` receives.** That is what mints the stray.
- **Do not edit `packages/headless/src/modules/query/**`.** The shared query platform is off limits to this module; the fix is a route-around at this module's own edge, never a core edit. (Teaching `translateQuery` a per-branch wire-column keyword is the real fix and would delete `useWireQuerySchema` outright — it is a core change, and a separate decision.)

> **🧪 For Testers:** Assert the **wire**, not the model. `filter[status.code|neq]=ticket_closed` for Active, `filter[status.code]=ticket_closed` for Closed, NEITHER key for All — and **no `filter[isClosed…]` in any of the three**. Those assertions are the read-back that proves the translation works; weakening them removes the only proof.

---

## 2. Attachments do not go through `system-upload`

Uploads in this module go to a **tickets-local** endpoint:

```text
POST api/ticket_messages/files      (multipart: file, brand_id)
```

Not the shared `system-upload` module. The reason is concrete: `system-upload` switches on image object types and **every branch emits a `.../images` path**, so its surface cannot carry an arbitrary file (a PDF, a log, a `.zip`). The premise that "system-upload's surface is sufficient" was tested and refuted.

Do **not** edit `system-upload` to accommodate tickets. The overlap is recorded here deliberately: a later consolidation may absorb it, and when it does, this is the entry that tells it what tickets actually needs.

`brand_id` on the multipart body is read off the **active session's own user** (`activeUser.value?.brandId`), not `useBrand().brandId` — the latter is the global brand-settings singleton, resolved independently of the caller's session and not guaranteed settled when an upload fires. That is the same race `client-custom-fields` moved off of.

---

## 3. The department and status lookups are owned by `tickets`, not `system`

`loadDepartmentOptions()`, `loadAllDepartments()` and `loadTicketStatuses()` issue their requests **from this module**:

```text
GET api/brand/tickets/departments?limit=0&with=department
GET api/tickets/departments?limit=0&with=brand_ticket_departments
GET api/statuses?filter[object_type]=ticket
```

The shared `system` module has equivalents — and they are **commented out**, at `useSystem.ts:37-38`:

```ts
// let statusesQuery: ReturnType<typeof services.fetchStatuses>;
// let departmentsQuery: ReturnType<typeof services.fetchDepartments>;
```

Do **not** revive those two lines and do **not** edit the shared `system` module to serve tickets. Because the shared services are commented out and not exposed, no live duplication exists today — this entry names the overlap so a future reader does not "discover" it and consolidate in the wrong direction.

---

## 4. The FIRST thread load is `loadOlder()` — there is no public `loadFeed()`

The merged feed starts **empty**. Opening a ticket does not populate it; `useContext().data` (the ticket) and `useContext().feed` (the conversation) are two independent reads.

The internal `loadFeed()` is not on the actions surface. The public entry points are `loadOlder()`, `loadNewer()` and `loadAttachments()`, and the first load is:

```ts
await ticket.useActions().isReady();
await ticket.useActions().loadOlder(); // <- this is the initial load
```

It works because `loadOlder()` reads the oldest **held** message id as its cursor, and with an empty feed that cursor is `undefined`, so the request carries no `filter[id|lt]` and returns the newest page. It reads oddly and it is the executed spelling.

> **🧪 For Testers:** `feed.entries` being empty right after `isReady()` resolves is correct, not a bug. Drive `loadOlder()` and then wait on `feed.entries.value.length`.

---

## 5. The two composables are addressed differently — and neither takes a cast

```ts
// COLLECTION — SELF, no context, ever
useClientTickets().as(ScopeActorTypes.SELF);

// MANAGER — CLIENT actor, TICKET context
useClientTicket().as(ScopeActorTypes.CLIENT).for(TicketContextTypes.TICKET, id);
```

The points that trip people:

- **`.as(SELF)` on the manager will not work.** `SELF` has **no contexts at all**, by design — the platform's actor→context model declares `guest`, `client` and `staff` as actors, and there is no `self` row among them. `TICKET_SCOPE_MATRIX` gives `CLIENT: TicketContextTypes.TICKET` and leaves every other actor `null as never`.
- **`.as(CLIENT)` is NOT `.for('client', id)`.** Actor and context are independent axes. `.as(CLIENT)` is the client actor on their own session — this **is** the client-acting-for-themselves case. `.for('client', id)` remains forbidden and is unspellable here: the only context this module declares is `ticket`.
- **The collection's matrix is all-`never`.** Every actor maps to `null as never`, so `.for()` cannot be spelled on it at all.
- **Always enum members, never string literals.** `ScopeActorTypes.SELF`, `ScopeActorTypes.CLIENT`, `TicketContextTypes.TICKET`.
- **No cast on the scope builder.** A whole-surface type-erasing cast (`useClientTicket() as unknown as { as: … for: … }`) would erase the entire composable surface — a wrong actor or a wrong context would then compile silently, exactly the failure a strict scope-builder type is meant to prevent. Narrowing the cast is **not** acceptable; there must be no cast.

---

## 6. There is no `reschedule` and no `changeDepartment`

Neither composable exposes a member for either capability, and that absence is deliberate and asserted by a dedicated test.

Both are **admin-only** in the legacy application: they are reachable only from an admin-mounted controls dropdown, and the client action list renders neither. This module is client-facing only, so both are dropped as not supported on the client path.

What this does **not** mean:

- **Create-time scheduling is supported.** `create({ …, scheduledAt })` sends `settings.scheduled_datetime` and is unambiguously a client capability. "No reschedule" means no *post-creation* reschedule.
- **Change subject is supported.** `setSubject()` is retained (refused when locked). Only change-*department* is dropped.

> **🧪 For Testers:** `tickets.dropped.int.test.ts` asserts the absence directly — no `reschedule` / `changeDepartment` member on either surface, and no observed request across a real read/write pass ever names `ticket_department_id` or a reschedule field. If either member ever appears, that spec goes red, which is the point.

---

## 7. The upload's allowed-file-**TYPE** rejection is CODED but UNPROVEN on this brand

Be precise about what is proven here, because it is easy to over-claim.

`uploadFile()` carries **two** pre-request guards:

| Guard                                                  | State                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Size ceiling — 25 MiB (`26214399` bytes)               | **PROVEN.** A file over the ceiling is refused with no request sent.     |
| Allowed file types — brand's `ALLOWED_UPLOAD_FILE_TYPES` | **CODED, UNPROVEN on this brand.** See below. Never describe it as verified. |

The captured environment's `GET api/brand/settings` returns **200 with no upload keys at all**. The module reads that as **unrestricted**: an absent or empty allowed-types list means every file type is permitted, and no request is refused on type grounds. That is the behaviour the recorded fixture proves.

The type-rejection branch itself is real code and stays. It has simply never been exercised against a brand that actually publishes an allowed-types list, so **no proof exists that it rejects correctly**. Do not delete it, do not assert it as proven, and do not weaken the size guard to make this tidy.

> **🧪 For Testers:** The 25 MiB size guard is the only upload guard on this module carrying a proof. A test that "proves" the type guard by supplying an allowed-types list the recorded brand never returns is proving the test's own fixture, not the module.

---

## 8. Two department lookups, two different shapes — and the option key is not `id`

`loadDepartmentOptions()` and `loadAllDepartments()` are **not** two spellings of the same thing:

| Member                     | Endpoint                        | Returns                                                | Use for                       |
| -------------------------- | ------------------------------- | ------------------------------------------------------ | ----------------------------- |
| `loadDepartmentOptions()`  | `api/brand/tickets/departments` | `{ value, label, isDefault }[]` — the brand's **public** desks | the create form's desk picker |
| `loadAllDepartments()`     | `api/tickets/departments`       | raw `ITicketDepartment[]` — **all** desks              | lookups / display resolution  |

The trap is the option key. `loadDepartmentOptions()` maps `value` from **`row.ticket_department_id`**, not `row.id` — the brand rows are join records, so `row.id` is the *join's* id and sending it as `ticket_department_id` on a create produces a desk the platform does not recognise. `isDefault` comes from the brand row's own `default` flag and pre-selects the brand's default desk.

The label falls back through four candidates in order: `name_translated` → `name` on the brand row, then the same two on the joined `department`.

---

## 9. `body` is required on create **only when no files are attached**

The create schema's requirement is conditional, matching the server exactly:

```ts
required: ["subject"],
anyOf: [{ required: ["body"] }, { required: ["files"] }]
```

The server's own message is verbatim: *"The body field is required when files is not present."* So **a subject-plus-attachment create with no message body is valid** and the module accepts it.

`subject` is required unconditionally, regardless of files — the guard is narrowed, not removed.

An earlier build required `body` unconditionally, which rejected client-side a create the server would have accepted. That is a real capability narrowing, and it is the kind of silent shortfall this entry exists to prevent recurring.

---

## 10. Quick search covers subject and reference — message bodies are NOT searchable

`setCriteria({ query: "…" })` is the free-text search. It does **not** search message bodies, and that is a property of the platform, not a shortfall in this module.

Proven by live probe, not by reading client code:

- `GET api/tickets?query=<a phrase present verbatim in a recorded message body on this client's own ticket>` → **HTTP 200, `data: []`, `total: 0`**.
- `GET api/tickets?query=LHG-27` → **1 row**, reference `LHG-275-42348`, whose subject does not contain the term — so the match is on the **reference**.

Both probes are recorded fixtures in `__tests__/fixtures/`. Message-body search is confirmed absent by this server receipt, not merely by reading the legacy client's own request code.

Also note the schema's `minLength: 3` on `query` — a one- or two-character term is rejected by validation and issues **no request at all**. That is intentional, not a debounce.

---

## 11. `GET api/self` returns the client id on `actor_id`, NOT on `id`

`id` is **`undefined`** on that payload. Code that reads `self.id` to get the client id gets `undefined`, and any comparison against it silently fails.

This is recorded because it already caused a real, expensive error: a fixture capture compared each contract product's `client_id` against `self.id` (i.e. against `undefined`), concluded the client owned **no** contract products and only two tickets, and wrote three genuinely-capturable capabilities down as un-capturable absences. The live figures were **993 contract products** and **25 tickets**.

Read the client id from **`actor_id`**. And the general lesson, which is the reason this is in a gotchas file rather than a commit message: *a "checked absence" that rests on an undefined comparand is not a checked absence.* Re-probe before writing one down.

---

## 12. Unlinking a product sends an explicit `null`, never an omitted key

```ts
await ticket.useActions().removeRelatedProduct();
// PUT api/tickets/{id}   body: { contract_product_id: null }
```

Omitting the key leaves the existing link in place — the platform treats an absent key as "unchanged", not as "clear". `setRelatedProduct(id)` and `removeRelatedProduct()` are the same write with different payloads; linking and *changing* are likewise the same call, so there is no separate "change" member.

---

## 13. The poll clears its interval on a hidden tab — it does not just skip a beat

`useClientTicket().useInternals()` owns a 60-second poll, armed automatically whenever the loaded ticket's status changes (including the moment a poll's own response closes the ticket) and only while the ticket is not closed.

The legacy implementation returned early on a hidden tab **without clearing the interval**, leaking no-op fires forever. This one clears the interval outright instead, and re-fires once on `visibilitychange` when the tab comes back.

`destroy()` disarms the poll **first**, then removes the visibility listener and the registry entry. A manager torn down without `destroy()` leaves a live interval behind.

> **🧪 For Testers:** Assert that no request fires *after* `destroy()`. `useMeta().isPollable` is `true` for any loaded, non-closed ticket — it reports pollability, not that an interval is currently armed.

---

## 14. Refusals are thrown, not returned — and they send nothing

Five writes refuse locally before touching the network:

| Write                  | Refused when                        | Error                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------- |
| `close()`              | `ticket.settings.lock` is true      | `403` "This ticket is locked"            |
| `setSubject()`         | `ticket.settings.lock` is true      | `403` "This ticket is locked"            |
| `editMessage()`        | the message's `can_manage` is false | `403` "This message cannot be edited"    |
| `deleteMessage()`      | the message's `can_manage` is false | `403` "This message cannot be withdrawn" |
| `reopen()`             | the ticket is **not** closed        | `422` "This ticket is not closed"        |

These **throw**; they do not resolve to `undefined` and they do not land in `useContext().error` (that member carries read failures and rejected criteria writes). Wrap a write you expect might be refused, or gate it on the matching meta flag first (`isLocked`, `canReopen`, the message's own `can_manage`).

The `can_manage` refusals are skipped when the message is not in the loaded feed — the guard reads the held row, so a message id the feed does not hold goes to the server and lets the platform decide.

---

## 15. Two exported form schemas are unreachable from outside the module

`tickets.schemas.ts` exports four form-schema pairs. Only two are actually reachable by a consumer:

| Schema pair                                     | Published at                              | Reachable? |
| ----------------------------------------------- | ----------------------------------------- | ---------- |
| `useQuerySchema` / `useQueryUischema` / `useSortUischema` | `useClientTickets().useContext().schemas.query` | ✅ yes      |
| `useCreateSchema` / `useCreateUischema`         | `useClientTickets().useContext().schemas.create` | ✅ yes      |
| `useSubjectSchema` / `useSubjectUischema`       | — nothing                                 | ❌ **no**  |
| `useMessageEditSchema` / `useMessageEditUischema` | — nothing                                 | ❌ **no**  |

The subject and message-edit pairs are exported from `tickets.schemas.ts` but are re-exported by neither `index.ts` nor any context member, and have **zero** consumers in the repo. A page that wants to validate a rename or a message correction against the module's own contract cannot currently reach these; it must either use the model types (`TicketSubjectModel`, `TicketMessageEditModel`, both exported) and its own rules, or the schemas need publishing on the manager's context.

Recorded as measured state, not as a recommendation to change it either way.

---

## 16. `loadRecentTickets` exists in the services layer and is wired to nothing

`tickets.services.ts` exports `loadRecentTickets` — a one-shot imperative read of a short, newest-first overview list. It is called by **no** composable, no action, and no test.

The dashboard-overview capability it was written for is delivered instead through the ordinary collection with a narrow page size (`setCriteria({ pagination: { limit: 3 } })`), which is what the spec exercises. Treat `loadRecentTickets` as unreached code, not as the supported entry point.

---

## 17. The manager's action docblock undercounts its own surface

`useClientTicket.actions.ts`'s module docblock says *"Twelve shared members"*. The factory returns **nineteen**. The comment is stale.

Count from the returned object, not the prose — the full list is in [usage.md](./usage.md). Named here because a reader budgeting against "twelve" will conclude members are missing that are in fact present.

---

## 18. Cache keys are shared, and invalidation is targeted

Both halves share the base key `["client", "tickets"]`, partitioned by resolved client id.

- A **create** on the collection invalidates the whole base key non-exactly, so every open list re-reads.
- A **write on the manager** (`close`, `reopen`, `setSubject`, product link/unlink) invalidates only `[...queryKey, "ticket", ticketId]`, so an open *list* does **not** automatically refresh after a close. A consumer showing both surfaces at once needs to invalidate the list itself, or accept the list's one-minute `staleTime`.
- `reply()` is the exception: it refreshes the ticket and reloads the feed directly, because a reply can move the ticket's status server-side.

---

## 19. Attachment download bypasses the shared request layer — deliberately

`downloadAttachment()` uses a plain `fetch()` with the session's bearer token, not `useQuery()`.

The shared `doFetch` unconditionally calls `response.json()`, and a binary attachment is not JSON — carrying it through the shared path would mean editing a headless-core file every module depends on. The download stays module-local instead: same bearer-token seam, same base URL, `ArrayBuffer` back, un-mapped.

The practical consequence: it is **not cached, not retried, and not visible to `useMeta()`**. A failed download throws a `DetailedError` carrying the HTTP status; it never lands in `useContext().error`.

---

## 20. Mappers are total on purpose

Every mapper in `tickets.mappers.ts` passes an unrecognised value through rather than throwing. That is not laziness: a throwing `select` in the query layer surfaces as a **200 with zero rows** — the network tab shows success while the list reads empty, which is among the hardest failures in this codebase to diagnose.

If you add a mapper here, keep it total.

`mapTicketMessage` derives `isDeleted` from **`is_log`**, not from `deleted_at`. The wire never populates `deleted_at`; a withdrawal arrives as a separate `is_log: true` row. That was resolved against a recorded withdrawal fixture, not inferred.

---

## 21. The recorded wire carries **no** `status` relation and **no** `settings` key

The list request and the single read both ask for `status` and `settings` via `with=`. Neither came back on the environment the fixtures were recorded from. Every recorded ticket carries **`status_id` only**, and no `settings` key at all.

The consequences are real and worth knowing before you debug something that is not broken:

- `useMeta().isClosed`, `.isScheduled`, `.canReopen` all read `data.status?.code`, which is `undefined` on every recorded response — so they report `false`.
- `useMeta().isLocked` and `.canReply` read `data.settings?.lock`, also absent — so `isLocked` is `false` and `canReply` is `true`.
- Consequently `close()`'s lock refusal and `reopen()`'s not-closed refusal are **never triggered by recorded data alone**. The specs that exercise those guards overlay a single field (`status: { code }`, or a `settings.lock`) onto the recorded envelope to reach them. That is honest — the wire assertion that follows (the PUT actually went out, or no request went out) is real — but it means the guards' *inputs* are synthetic while their *behaviour* is proven.

The derivations are deliberately defensive (`?.` throughout, `!!` coercions) precisely because of this. Do not "simplify" them to direct property reads.

> **🧪 For Testers:** `expect(isClosed.value).toBe(false)` against a plain recorded fixture proves nothing about closedness — it only proves the read did not throw. Assert the **type** (`typeof … === "boolean"`) for safety-of-derivation, and overlay the field explicitly when you mean to exercise a guard.

---

## 22. `PUT api/tickets/{id}/status` returns no ticket body

The recorded response is `{"status":"ok","data":null}` — there is no ticket in it.

`close()` and `reopen()` are typed `Promise<Ticket>` and pass that `null` through the (total, passthrough) ticket mapper, so **they resolve to `null` wearing a `Ticket` type**. The type is optimistic; the wire is not.

Read the transitioned ticket from `useContext().data` after the action settles — both writes invalidate this ticket's own cache key, so the next read refetches. Do not consume the return value of `close()` or `reopen()`.

`setSubject()`, `setRelatedProduct()` and `removeRelatedProduct()` go through `PUT api/tickets/{id}`, which **does** return the updated ticket; their return values are real.
