# Changelog

All notable changes to the `tickets` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

The module is **net-new**. Nothing existed under `packages/headless/src/modules/tickets/` before this build — a knowledge-graph query for every tickets construct returned no node in this tree.

### Changed

- **The product-scoped list is a SCOPE CONTEXT, not a filter column.** `filters.contract_product_id` is removed from `TicketsQueryModel` and from `useQuerySchema()`; AC-7 is now spelt `useTickets().as(CLIENT).for(TicketsContextTypes.CONTRACT_PRODUCT, id)`. The product a ticket is raised against is a RELATIONSHIP between two entities, and ADR-001 § 3/§ 4 already carries `product` in the `ContextType` union and grants it to the `client` actor — so the platform had a first-class home for it all along, while everything left under `filters` (`reference`, `subject`, `isClosed`, `created_at`) is a genuine attribute of a ticket. The collection matrix's previous all-`never` row conflated "may not be retargeted at another client" (true, and unchanged) with "has no contexts at all" (false), which is what left the relationship nowhere to live but a filter column.
  **The wire is unchanged**: `tickets.services.ts`'s `applyProductScopeFilter` re-spells the context onto `filter[contract_product_id]=<id>` at the module's own edge, the same seam `applyStatusCodeFilter` already uses, and an observed-request assertion in `tickets.collection.int.test.ts` pins it. The product id also joins the list query key, so a product-scoped read and the unscoped one can never serve each other's cached rows.

### Added

#### The two composables

- **`useTickets`** — the client's own ticket collection. Addressed `.as(ScopeActorTypes.SELF)` for the whole list, or `.as(ScopeActorTypes.CLIENT).for(TicketsContextTypes.CONTRACT_PRODUCT, id)` for the tickets raised about one of my contract products (AC-7). Its scope matrix declares that ONE member on the `client` row and leaves `self`, `staff` and `guest` `null as never`, so `.for('client', id)` cannot be reached at all.
- **`useTicket`** — the per-ticket manager. Addressed `.as(ScopeActorTypes.CLIENT).for(TicketContextTypes.TICKET, id)`, because a ticket is a genuine addressable **context** in this platform's actor model — it owns its own records (its messages) and so is not a leaf record addressed by an id alone.
- Both registered under the same module name (`"tickets"`), both built from **one** services factory, so the two halves can never disagree about whose tickets are being read.

#### Collection surface

- **`useActions().setCriteria(intent)`** — the one write verb over `query` · `filters` · `sort` · `pagination`, validated against the module's own declared schema **before** it commits. Merges branches; a branch that is given replaces that whole branch.
- **`useActions().nextPage()` / `.prevPage()`** — page walk.
- **`useActions().setPageSize(limit)`** — applies the limit **and** persists it to the client's own preferences.
- **`useActions().create(model)`** — raises a ticket, including create-time scheduling (`settings.scheduled_datetime`); invalidates the list on success.
- **`useActions().uploadAttachment(file)`** — uploads ahead of a create, returning the reference `create()`'s `files` consumes.
- **`useActions().loadDepartmentOptions()` / `.loadAllDepartments()` / `.loadTicketStatuses()`** — the module's own desk and status lookups.
- **`useActions().savePrefs(prefs)`** — read-modify-write over the client's `meta` map.
- **`useActions().isReady()` / `.refresh()` / `.invalidate()` / `.reset()` / `.destroy()`** — lifecycle.
- **`useContext().schemas`** — `{ query: { schema, uischema, sortUischema }, create: { schema, uischema } }`, published as plain JSON so a renderer derives its controls with no per-field UI code.
- **`useContext().data` / `.error` / `.findOne` / `.getOne` / `.pagination` / `.query`** — the reactive list, the captured error, row lookups, the pagination descriptor, and the live read-only criteria model.
- **`useMeta()`** — seven flags: `hasError`, `isAvailable`, `isEmpty`, `isLoading`, `hasNextPage`, `hasPrevPage`, `hasPages`.
- **`useInternals()`** — actor scope and the raw backing query.

#### Manager surface

- **`useActions().loadOlder()` / `.loadNewer()` / `.loadAttachments()`** — the conversation, cursor-paged in both directions on the message id, plus an attachments-only view that is a **different request** rather than a client-side filter. `loadOlder()` on an empty feed is the initial load.
- **`useActions().getMessage(id)`** — re-reads one message and replaces its row in the feed in place.
- **`useActions().reply(body, { isPrivate, files })`** — posts a reply carrying `last_message_id`; a `409 ticket_has_more_recent_reply` resolves to `undefined` as a **caution** and pages the thread forward.
- **`useActions().editMessage(id, body)` / `.deleteMessage(id, reason)`** — refused with **no request** when the held message's `can_manage` is false.
- **`useActions().downloadAttachment(fileId)` / `.deleteAttachment(messageId, fileId)` / `.uploadAttachment(file)`**.
- **`useActions().close()` / `.reopen()` / `.setSubject(subject)`** — close and rename refused when `settings.lock`; reopen refused unless the ticket is closed.
- **`useActions().setRelatedProduct(id)` / `.removeRelatedProduct()`** — link and change are the same write; unlink sends an **explicit `null`**.
- **`useContext().data` / `.department` / `.relatedProduct` / `.error` / `.feed`** — the feed being a merged, discriminated sequence of `message` and `log` entries drawn from **two** endpoints.
- **`useMeta()`** — eleven flags, every one derived **per record**: `isAvailable`, `isLoading`, `hasError`, `isClosed`, `isLocked`, `isScheduled`, `isStaged`, `isDelegated`, `isPollable`, `canReply`, `canReopen`.
- **`useInternals()`** — actor scope, the raw query, and the poll controls `armPoll()` / `disarmPoll()` / `teardown()`.

#### Behaviours worth naming

- **The `limit + 1` has-more probe** on the message thread — the paging contract carries no usable total, so the request asks for one row more than the page size and trims the overflow.
- **A 60-second poll** on a non-closed ticket, armed automatically by a watch on the loaded ticket's status code (`immediate: true`), skipped and **cleared** on a hidden view, re-fired once on `visibilitychange`.
- **Criteria-write validation at the module's own edge** — the raw merged candidate is validated against the schema before it is forwarded, and the rejection is folded into **both** `useContext().error` and `useMeta().hasError`.
- **Total mappers** — an unrecognised value passes through rather than throwing, because a throwing transform in the request pipeline surfaces as a 200 with zero rows.

### Changed (relative to the legacy implementation being migrated from)

- **Identity resolves from the scope the caller opened**, through one seam (`resolveClientId`), never from a session read inside a request-issuing function. Every request is `api/…`; there is no admin-prefixed variant anywhere and a guard spec asserts it by scanning observed requests.
- **The hidden-view poll clears its interval** instead of returning early. The legacy implementation returned early *without* clearing, leaking no-op fires for the life of the view.
- **The stale-reply `409` is a caution at the service layer**, resolving to `undefined`, rather than a thrown error every consumer has to special-case on one API code string.
- **`isReady()` always settles.** It answers addressability first, then waits on a fetch that is actually coming — so it cannot hang behind a query that will never fire.
- **`refresh()` rejects with a typed error** when the scope cannot address a client, instead of silently returning nothing.
- **Every write gate is per record**, read off the loaded ticket or message, never per actor. There is no `.{actor}.ts` sibling anywhere in this module.
- **Errors are state.** Nothing raises a toast or a notification; reads and rejected criteria writes land on `useContext().error` / `useMeta().hasError`, and local refusals throw.

### Removed / deliberately absent

- **`reschedule` (post-creation) and `changeDepartment` — dropped as admin-only.** Both are reachable in the legacy application only from an admin-mounted controls dropdown; the client action list renders neither. A dedicated test asserts the absence of both members, and that no observed request across a real read/write pass names `ticket_department_id` or a reschedule field.
  - **Create-time scheduling is unaffected and supported** — `create({ …, scheduledAt })`.
  - **Change subject is unaffected and supported** — `setSubject()`.
- **Message-body search is not supported**, final on a **server receipt**, not on a reading of client code: a phrase present verbatim in a recorded message body returns `200` with zero rows, while a reference fragment returns the matching ticket. Free-text search covers **subject and reference**.
- **No mutation state machine.** The module is query-backed throughout; form schemas are exported for the consuming page to render and validate against, and the module owns no form machine.
- **No toast or notification surface.**

### Recorded fixtures

**49** request/response pairs, every one captured against a live staging environment by this module's own generator (`pnpm fixtures:generate tickets`). **None was hand-authored**, and none is a hand-built wire body. The first 47 back the module's core behaviour; the final two are forced error states, recorded through the same generator rather than written by hand.

| Group                         | Covers                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| List — default & tabs         | the `with_staged_imports=1` default read, the active (`status.code\|neq`) tab, the closed (`status.code`) tab |
| List — paging                 | a real page 1 and page 2 with disjoint rows                                                                |
| List — sort & filter          | sort by subject; the bare-EQUAL `filter[reference]` shape                                                  |
| List — search probes          | the **body-only** query returning zero rows, and the **reference-fragment** query returning one — the message-body-search-is-unsupported receipt |
| List — narrow slices          | the product-scoped list, the delegated-in co-mingled list, the short recent overview                       |
| List — refusals               | the criteria error-collection refusal, and the create error-action refusal                                 |
| Ticket — single read          | the full detail record, plus the linked / changed / unlinked / delegated-in variants                       |
| Thread                        | the `filter[is_log]=0` message page, one single message, and the post-withdrawal thread                    |
| Writes                        | create, reply, reply-with-file, edited reply, withdrawn reply (with its reason), close, final close, reopen, rename |
| Product link                  | link, change and unlink `PUT`s, with the reads that confirm each                                           |
| Attachments                   | the multipart upload, the binary download, the file delete                                                 |
| Lookups                       | brand desks, all desks, ticket statuses                                                                    |
| Preferences                   | the client record before and after the meta read-modify-write                                              |
| Delegation                    | the invite, the accept, and the hook-log status feed                                                       |
| Session / identity            | `GET api/self`, the brand lookup, the contract-product lookup                                              |

**Twelve `*.must-fail.patch` negative controls** sit alongside them — unified diffs that mutate production source and must flip a named assertion red: the staged-imports parameter, the status-code `neq` shape, the locked-close guard, the admin-path law, the poll teardown, the prefs read-modify-write, the bare-equal reference operator, the reply `409` caution, the search minimum length, the status-log feed's object type, the thread cursor direction, and the `limit + 1` probe.

### Notes

- Both composables act on the calling client's own desk. There is no staff scope, no acting on behalf of another client, and no admin path anywhere in this module.
- `Ticket` is `ITicket` **un-reduced** — the list row carries `department`, `settings` and `contract_product` in full, so drawing a rich row needs no second read.
- `tickets.services.ts`, `tickets.schemas.ts` and `tickets.mappers.ts` are `@internal`; resolve them through `useTickets.ts` / `useTicket.ts` only. `index.ts` is curated named re-exports with **no `export *`**.

### Not captured

- **The allowed-file-type rejection.** The recorded brand's `GET api/brand/settings` returns `200` with no upload keys at all, so the type-refusal branch has never been exercised end to end. It is coded, specified, and honestly recorded as unproven — never asserted as verified. The size refusal (25 MiB, `26214399` bytes) **is** proven.
- **A response carrying an expanded `status` relation, or any `settings` key.** Both are requested via `with=` and neither came back on the recorded environment; every recorded ticket carries `status_id` only. The specs that exercise the lock and closed guards overlay that single field onto the recorded envelope to reach them — the guard behaviour is proven, its input is synthetic. See [gotchas.md](./gotchas.md) #21.

---

## Migration Guide

For a consumer moving off the legacy client-facing ticket views, or off the portal mock.

### Calling either surface

```diff
- // the portal mock's collection matrix — FORBIDDEN here
- useTickets().as('client').for('client', clientId)
+ useTickets().as(ScopeActorTypes.SELF)

- useTicket().withId(ticketId)
+ useTicket()
+   .as(ScopeActorTypes.CLIENT)
+   .for(TicketContextTypes.TICKET, ticketId)
```

Enum members, never string literals. No cast on the scope builder — a whole-surface cast erases the matrix's type checking entirely, so a wrong actor or a wrong context compiles silently.

### Narrowing the list

```diff
- // a hand-built wire key beside the channel
- params['filter[status.code|neq]'] = 'ticket_closed'
+ tickets.useActions().setCriteria({
+   filters: { statusCode: { neq: "ticket_closed" } }
+ })
```

Write the **undotted** `statusCode`; the module re-spells it onto the dotted wire column at its own edge. Writing `"status.code"` in the model is the bug, not the fix — see [gotchas.md](./gotchas.md) #1.

### Reading the conversation

```diff
- const messages = await api.get(`tickets/${id}/messages`)
+ await ticket.useActions().loadOlder()          // the initial load
+ const { entries } = ticket.useContext().feed   // messages AND status-log rows
```

The feed is a discriminated union — branch on `entry.kind`. Status changes are no longer a second list to render separately; they are interleaved into the conversation by created date.

### Replying

```diff
- try { await api.post(`tickets/${id}/replies`, body) }
- catch (e) { if (e.code === 'ticket_has_more_recent_reply') showWarning() }
+ const result = await ticket.useActions().reply(body)
+ if (result === undefined) {
+   // support replied first — the thread has ALREADY been paged forward
+ }
```

### Attaching a file

```diff
- await systemUpload(file)                     // wrong surface — emits an images path
+ const ref = await ticket.useActions().uploadAttachment(file)
+ await ticket.useActions().reply("See attached.", { files: [ref] })
```

Upload and attach are two steps. The same two-step shape works on the collection for a create.

### Closing and reopening

```diff
- const updated = await api.put(`tickets/${id}/status`, { status_code: 'ticket_closed' })
- render(updated)
+ await ticket.useActions().close()             // resolves null — the wire returns no body
+ const updated = ticket.useContext().data.value // read it back from state
```

Guard locally first (`useMeta().isLocked`, `.canReopen`) — the module refuses these before any request, and the refusal **throws**.

### Unlinking a product

```diff
- await api.put(`tickets/${id}`, {})            // omitting the key leaves the link in place
+ await ticket.useActions().removeRelatedProduct()   // sends an explicit null
```

### Saving a preference

```diff
- await api.put(`clients/${id}`, { meta: { 'ui/support/limit': 50 } })  // destroys siblings
+ await tickets.useActions().savePrefs({ limit: 50 })                   // read-modify-write
```

`PUT api/clients/{id}` replaces the whole `meta` map. The module reads the record, merges only the `ui/support/*` keys it owns, and writes the whole map back — so an unrelated key such as `ui/support/messageSignature` survives.

### Reading the client's own id

```diff
- const clientId = self.id          // ALWAYS undefined on GET api/self
+ const clientId = self.actor_id
```

This has already caused a real, expensive mistake: comparing against `self.id` (i.e. against `undefined`) once produced a written finding that the account held no contract products and two tickets, when it held 993 and 25.

### Waiting for readiness

```diff
- while (!loaded) await sleep(100)
+ const ready = await tickets.useActions().isReady()  // always settles; false = not addressable
```
