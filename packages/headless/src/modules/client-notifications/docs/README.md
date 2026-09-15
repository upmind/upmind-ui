# client-notifications

> An account's notification preferences — which topic x channel combinations reach it. No inbox, no message list.

## What Is This?

Think of `client-notifications` as the account's notification settings page — a grid of topics (billing, marketing, security…) crossed with channels (email, in-app…), each cell a switch.

- Every switch reads **positively**: on means "send me this."
- The server holds the **opposite** list — only the switches that are OFF. See [gotchas.md](./gotchas.md#1-the-opt-out-inversion--read-the-model-positively-never-the-wire) before touching the wire shape directly.
- Some topics are **locked** (e.g. security notices) — always on, never switchable.

The module ships **two composables**, because reading the grid and editing it are different jobs:

| Surface            | Composable                      | Use it when                                        |
| ------------------ | ------------------------------- | -------------------------------------------------- |
| **The collection** | `useClientNotifications`        | You are showing the current grid, read-only        |
| **The editor**     | `useClientNotificationsManager` | You are letting the account change its preferences |

> **🧪 For Testers:** Both composables support only `client x self` and `guest x self` — a signed-in account managing its own preferences, or a single-use link token standing in for one. `staff` is a compile-time error on both: nothing in this module lets a staff member manage another account's preferences on their behalf. See [gotchas.md](./gotchas.md#9-staff-cannot-act-for-a-client-here--and-there-is-no-context-to-widen-into).

## Quick Start

```ts
import {
  useClientNotifications,
  useClientNotificationsManager
} from "@upmind-automation/headless";

const list = useClientNotifications().as("client");
await list.useActions().isReady();
const { topics, channels } = list.useContext();

const editor = useClientNotificationsManager().as("client");
editor.useActions().toggle(topics.value[0].id, channels.value[0].id);
await editor.useActions().update();
```

> **🧪 For Testers:** A guest following an emailed link uses the same two composables with `.as("guest").withId(token)` in place of `.as("client")` — see [usage.md](./usage.md#getting-an-instance).

## Features

| Capability                               | Surface                                                                   | What it does                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Read the topic / channel / opt-out lists | `useClientNotifications().useContext()`                                   | Reactive `topics`, `channels`, `optOuts`                         |
| Check a pair against SERVER state        | `…useContext().isEnabled(topicId, channelId)`                             | Reads the server-held opt-out set                                |
| Know the collection is ready             | `…useMeta().isAvailable` / `useActions().isReady()`                       | Addressable **and** all three reads settled clean                |
| Re-read from the server                  | `…useActions().refresh()`                                                 | Refetches all three lists                                        |
| Flip one pair                            | `useClientNotificationsManager().useActions().toggle(topicId, channelId)` | Mutates the DRAFT only; refused on a locked topic                |
| Enable / disable a whole topic           | `…useActions().selectAll(topicId)` / `.clearAll(topicId)`                 | Refused on a locked topic                                        |
| Check a pair against the DRAFT           | `…useContext().isEnabled(topicId, channelId)`                             | Reads the in-progress draft, not the server                      |
| Know a topic is locked                   | `…useContext().isTopicLocked(topicId)`                                    | `canOptOut === false`                                            |
| Discard unsaved changes                  | `…useActions().revert()`                                                  | Restores the last-saved draft                                    |
| Save                                     | `…useActions().update(value?)`                                            | Full-set save; rejects "nothing to save" when nothing changed    |
| Render the form                          | `…useContext().schema` / `.uischema`                                      | One boolean field per topic x channel pair, derived at read time |

## Key Concepts

### The opt-out inversion

The model you read (`NotificationsModel` / `isEnabled(...)`) is positive: `true` means enabled. The wire is negative: a row in the opt-out list means _disabled_, and absence means _enabled_. This module performs the conversion at its read and save boundaries; nowhere else. See [gotchas.md](./gotchas.md#1-the-opt-out-inversion--read-the-model-positively-never-the-wire).

> **👩‍💻 For Developers:** Never build your own request against the raw opt-out endpoint expecting a positive flag — there isn't one on the wire.

### The full set, always

All three reads (topics, channels, opt-outs) always request the complete list — never a server-default page. A missing opt-out row, because absence means enabled, is not a smaller correct answer; it is a wrong one that shows a preference as ON when it might not be. There is deliberately no filter bar and no sort control on any of the three — the platform doesn't support one on this data, and inventing a UI for one would draw a control the server rejects. See [gotchas.md](./gotchas.md#3-limit-0-is-load-bearing-not-a-preference).

### The locked-topic rule cuts both ways

A locked topic (`canOptOut === false`) can never be **newly** opted out of — the guard sits at the action, so even a hand-built draft handed to `update(value)` cannot smuggle a new disabled row through. But a pair that was **already** disabled on a topic before it became locked is left alone by an unrelated save; a blanket filter that strips every locked row on every save would quietly re-enable that pre-existing choice. See [gotchas.md](./gotchas.md#4-the-locked-topic-rule-is-two-sided).

### The guest link token never comes back out

A guest link token (`.withId(token)`) rides the request as a URL query parameter, never as an authorization header, and it separates one token's cached reads from every other token's and from a signed-in account's. The token itself is not published on any context, meta, or debugging surface this module offers — the only proof of its use is in the outbound request itself.

> **🧪 For Testers:** Two different tokens must never see each other's cached opt-out state. If you are testing the guest path, use two distinct tokens and confirm they read independently.

### There is no staff-for-client capability here

Every endpoint this module reads and writes is account-implicit — none of them carry a target-account identifier a staff caller could redirect. `.for(...)` does not typecheck against either composable; there is no context to widen it into. This is a platform fact this module documents, not a limitation this module introduces. See [gotchas.md](./gotchas.md#9-staff-cannot-act-for-a-client-here--and-there-is-no-context-to-widen-into).

### The editor is driven through a generated form, not a bespoke grid

The editor publishes a form definition (`schema` / `uischema`) generated at read time from the account's own topics and channels — one boolean field per pair, grouped by topic. A generic form-rendering surface can draw and save the whole grid from that definition alone, with no bespoke per-cell component. See [architecture.md](./architecture.md) for how this is wired.

## Documentation

| Doc                                  | Audience                                             | Content                                                                     |
| ------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| **This README**                      | Everyone                                             | Overview, concepts, quick start                                             |
| [usage.md](./usage.md)               | All devs                                             | Full API reference for both composables                                     |
| [architecture.md](./architecture.md) | Internal / contributors                              | Data flow, the shared identity seam, dependencies                           |
| [gotchas.md](./gotchas.md)           | All                                                  | The sharp edges — the inversion, locked topics, the guest token, open items |
| [foundation.md](./foundation.md)     | Teams building against the platform on another stack | Framework-neutral spec: endpoints, payloads, failure modes                  |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                  | Change history                                                              |

## Playground

The `labs-nuxt` scenario at `/useClientNotifications` drives both composables — the collection as a topic-per-row table, and the editor's full topic x channel grid opened through the row's **manage** action (the generic playground harness has no per-cell toggle renderer, so the grid is driven through the generated form definition rather than the table itself).

The `labs` (Vue) playground's own notification pages (`playgrounds/labs/src/pages/account/notifications/`) are unwired placeholders today — see [gotchas.md](./gotchas.md#8-the-labs-vue-playground-pages-are-unwired-placeholders).
