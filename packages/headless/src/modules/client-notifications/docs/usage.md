# client-notifications — Usage

## Getting an instance

```ts
import {
  useClientNotifications,
  useClientNotificationsManager
} from "@upmind-automation/headless";

// Collection — signed-in account
const list = useClientNotifications().as("client");

// Collection — a guest holding an emailed link token
const guestList = useClientNotifications().as("guest").withId(token);

// Editor — signed-in account
const editor = useClientNotificationsManager().as("client");

// Editor — guest link token
const guestEditor = useClientNotificationsManager().as("guest").withId(token);

// A signed-in account following its own emailed link also type-checks:
const both = useClientNotifications().as("client").withId(token);
```

There is no `.for(actorType, id)` on either composable — both scope matrices declare every actor `never` for that call, so it is a compile-time error, not a runtime refusal. There is no context enum to import for it either; nothing publishes one.

Each `.as(...)` (optionally `.withId(token)`) call resolves to its own scoped instance, cached by that exact call shape. Two different tokens resolve to two independent instances with independent cached reads.

## The collection — `useClientNotifications`

### Collection actions — `useActions()`

#### `isReady()`

```ts
const ready = await list.useActions().isReady();
```

Resolves once the account is addressable (signed in, or holding a token) **and** all three reads (topics, channels, opt-outs) have completed their first fetch. Resolves `false` immediately if the scope settles as not addressable, and `false` if any of the three reads failed — never hangs.

#### `refresh()`

```ts
await list.useActions().refresh();
```

Refetches all three reads from the server.

#### `destroy()`

```ts
list.useActions().destroy();
```

Releases this scoped instance from the registry.

### Collection context — `useContext()`

```ts
const {
  topics,
  channels,
  optOuts,
  isEnabled,
  lookups,
  findOne,
  getOne,
  pagination,
  query,
  schemas,
  error,
  clientId,
  data
} = list.useContext();
```

| Member                          | Type                                 | Notes                                                                                                                     |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `topics`                        | `NotificationTopic[]`                | Every topic                                                                                                               |
| `channels`                      | `NotificationChannel[]`              | Every client-recipient channel                                                                                            |
| `optOuts`                       | `OptOut[]`                           | Every currently disabled pair                                                                                             |
| `data`                          | `NotificationTopic[]`                | Alias for `topics` — feeds a generic row-per-record consumer; the module's real contract is `topics`/`channels`/`optOuts` |
| `isEnabled(topicId, channelId)` | `boolean`                            | Reads SERVER state (the opt-out set)                                                                                      |
| `lookups`                       | `{ topics, channels }`               | The same reference shape the editor's `lookups` carries                                                                   |
| `findOne(partial)`              | `NotificationTopic \| undefined`     | Looks up a TOPIC by a partial field match                                                                                 |
| `getOne(id)`                    | `NotificationTopic \| undefined`     | Looks up a TOPIC by id                                                                                                    |
| `pagination`                    | `PaginationInfo`                     | One representative read's pagination descriptor (all three share one criteria schema)                                     |
| `query`                         | the active criteria model            | Read-only view of the request state; `limit` only                                                                         |
| `schemas.query`                 | `{ schema, uischema, sortUischema }` | Pagination-only criteria schema; the ui/sort schemas are honest empty layouts — there is no filter bar or sort control    |
| `error`                         | `unknown`                            | The first of the three reads' captured error, if any                                                                      |
| `clientId`                      | `string \| undefined`                | The resolved account id, or `undefined` for a guest                                                                       |

There is deliberately **no** `default` member — no topic is a platform default, so one was not invented.

### Collection meta — `useMeta()`

| Flag          | True when                                                    |
| ------------- | ------------------------------------------------------------ |
| `hasError`    | Any of the three reads resolved with an error                |
| `isLoading`   | Any of the three reads has not completed its first fetch     |
| `isAvailable` | Addressable AND all three reads have completed with no error |

### Collection internals — `useInternals()`

Debugging only. `query.topics` / `.channels` / `.optOuts` each carry a narrowed, read-only projection (`data`, `error`, `isFetched`, `queryKey`, `pagination`, `refetch`) — never the raw request object, and never a write verb. `queryKey` on this projection is the stable resource prefix, never the identity-salted key the opt-outs read actually queries on — the salt carries the guest link token, and a debugging surface must not become a second door the token reaches.

## The per-account editor — `useClientNotificationsManager`

### Editor actions — `useActions()`

#### `isReady()`

```ts
const ready = await editor.useActions().isReady();
```

Resolves once the account is addressable and the editor has reached a settled state (ready, or genuinely unavailable). Resolves `false` rather than hanging when the scope can never become addressable (e.g. a guest with no token and no session).

#### `toggle(topicId, channelId)`

```ts
editor.useActions().toggle(topicId, channelId);
```

Flips one pair in the draft. Silently refused, with no dirty flag raised, when the topic is locked.

#### `selectAll(topicId)` / `clearAll(topicId)`

```ts
editor.useActions().selectAll(topicId); // every channel ON for this topic
editor.useActions().clearAll(topicId); // every channel OFF for this topic
```

Both refused on a locked topic.

#### `isAllSelected(topicId)`

```ts
const allOn = editor.useActions().isAllSelected(topicId);
```

`true` if every channel is currently enabled (in the draft) for the given topic.

#### `revert()`

```ts
editor.useActions().revert();
```

Restores the draft to the last-saved (server) state and clears the dirty flag.

#### `update(value?)`

```ts
const saved = await editor.useActions().update();
// or, with an explicit replacement draft:
const saved = await editor.useActions().update({ preferences: { ... } });
```

Saves the current (or given) draft as the account's WHOLE opt-out set. Rejects with `"Nothing to save"` when called with no argument and nothing has changed since the last save.

A `value` carrying a **newly** disabled pair on a locked topic has that pair filtered out before the save — the guard runs here, not only inside the toggle actions, so a hand-built replacement draft cannot bypass it. A pair on a locked topic that was **already** disabled in the current baseline is left untouched.

After a rejected save, calling `update()` again with no argument resends the same draft rather than issuing a bare retry — the shared save machinery has no bare-retry handler in its error/invalid states, so a resend is what actually reaches the server again.

#### `onDone()` / `onError()`

```ts
const saved = await editor.useActions().onDone();
const failed = await editor.useActions().onError();
```

Resolve once a save completes, or once a save failure is captured, respectively.

#### `stop()` / `destroy()`

```ts
editor.useActions().stop(); // pause, keep the registry entry
editor.useActions().destroy(); // stop AND remove from the registry
```

### Editor context — `useContext()`

```ts
const {
  model,
  lookups,
  isEnabled,
  isTopicLocked,
  schema,
  uischema,
  error,
  validationErrors
} = editor.useContext();
```

| Member                          | Type                          | Notes                                                                  |
| ------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `model`                         | `NotificationsModel`          | The draft — `{ preferences: Record<string, boolean> }`                 |
| `lookups`                       | `{ topics, channels }`        | The reference data the draft/form is built against                     |
| `isEnabled(topicId, channelId)` | `boolean`                     | Reads the DRAFT — never the server state (that's the collection's job) |
| `isTopicLocked(topicId)`        | `boolean`                     | `canOptOut === false` for that topic                                   |
| `schema`                        | `JsonSchema7`                 | The form's JSON Schema, generated from `lookups`                       |
| `uischema`                      | `UISchemaElement`             | The form's layout — one `Group` per topic, one `Control` per channel   |
| `error`                         | captured save failure, if any | Read, never raised as an event                                         |
| `validationErrors`              | `ErrorObject[]`               | Field-level validation failures, if any                                |

There is no whole-machine-context passthrough on this surface — the guest link token is a bearer credential and is never assigned into anything this context could republish. The named members above cover every read a consumer needs.

### Editor meta — `useMeta()`

| Flag           | True when                                                         |
| -------------- | ----------------------------------------------------------------- |
| `isAvailable`  | The editor is ready for input                                     |
| `isLoading`    | Subscribing, loading, or resolving reference data                 |
| `hasError`     | A save failed, the draft is invalid, or the editor is unavailable |
| `isValid`      | The current draft passes schema validation                        |
| `isDirty`      | The draft differs from its last-saved baseline                    |
| `isProcessing` | A save is in flight                                               |
| `isComplete`   | The current save has settled                                      |

### Editor internals — `useInternals()`

Debugging only. Exposes the raw underlying state/service/send handle for the editor's save machinery — the machine-variant sibling of the collection's raw-query projection above.

## The form definition — paste-ready

`schema` and `uischema` are generated from whatever topics/channels the account actually has — there is no fixed field list to paste. The shape, for two topics x two channels:

### Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "preferences": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "<topicIdA>::<channelIdA>": { "type": "boolean", "default": true },
        "<topicIdA>::<channelIdB>": { "type": "boolean", "default": true },
        "<topicIdB>::<channelIdA>": { "type": "boolean", "default": true },
        "<topicIdB>::<channelIdB>": { "type": "boolean", "default": true }
      }
    }
  }
}
```

### UI schema

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Group",
      "label": "<topic A name>",
      "i18n": "field.notification_topic",
      "elements": [
        {
          "type": "Control",
          "scope": "#/properties/preferences/properties/<topicIdA>::<channelIdA>",
          "label": "<channel A name>",
          "i18n": "field.notification_channel"
        },
        {
          "type": "Control",
          "scope": "#/properties/preferences/properties/<topicIdA>::<channelIdB>",
          "label": "<channel B name>",
          "i18n": "field.notification_channel"
        }
      ]
    },
    {
      "type": "Group",
      "label": "<topic B name — LOCKED example>",
      "i18n": "field.notification_topic",
      "elements": [
        {
          "type": "Control",
          "scope": "#/properties/preferences/properties/<topicIdB>::<channelIdA>",
          "label": "<channel A name>",
          "i18n": "field.notification_channel",
          "options": { "readonly": true }
        },
        {
          "type": "Control",
          "scope": "#/properties/preferences/properties/<topicIdB>::<channelIdB>",
          "label": "<channel B name>",
          "i18n": "field.notification_channel",
          "options": { "readonly": true }
        }
      ]
    }
  ]
}
```

A locked topic's controls carry `options.readonly: true` at the form layer, alongside — not instead of — the action-level guard.

## Errors and feedback

| Event                                        | Surface                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A read fails                                 | `useContext().error` (collection) surfaces it; `isReady()`/`isAvailable` reflect it as not-ready                     |
| A save is rejected by the server             | `useContext().error` (editor); `useMeta().hasError` true; the draft is preserved, not reverted                       |
| A save's draft fails local schema validation | The save rejects before any request is sent; `useContext().validationErrors` is populated; `useMeta().isValid` false |
| A save succeeds                              | The collection's cached opt-out read is invalidated so it re-reads on next access                                    |

## Types

```ts
import type {
  NotificationTopic,
  NotificationChannel,
  OptOut,
  OptOutRequestRow,
  NotificationsModel,
  NotificationsLookups,
  UseClientNotifications,
  UseClientNotificationsManager,
  UseClientNotificationsActions,
  UseClientNotificationsContext,
  UseClientNotificationsMeta,
  UseClientNotificationsInternals,
  UseClientNotificationsManagerActions,
  UseClientNotificationsManagerContext,
  UseClientNotificationsManagerMeta,
  UseClientNotificationsManagerInternals
} from "@upmind-automation/headless";
```

No context enum and no scope-matrix type are exported — there is nothing to import for `.for(...)`, because neither composable accepts it.
