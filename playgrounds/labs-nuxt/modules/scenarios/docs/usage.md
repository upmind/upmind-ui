# scenarios — Usage

This page is a walkthrough: you already have a scoped composable (a module built on the four-layer, actor-aware pattern this codebase uses everywhere), and you want its page. Read [architecture.md](./architecture.md) first if you want the *why* behind any step below — this document is deliberately just the *how*.

## The fast path: let the factory build it

If the composable already exists and follows the scope-based shape (it exports its own scope matrix and is driven through `.as()` / `.for()`), you do not write a declaration by hand. You invoke the factory door and give it the module:

```text
/factory module=packages/headless/src/modules/<your-module>/ playground=page
```

`playground=page` tells the door "the composable already exists — just build the page for it." The door will refuse outright, with a plain reason, if the module does not actually carry the scope-based shape yet; it never guesses at a missing piece of that shape on your behalf. Everything the page needs — its table columns, its filter and sort options, which actors it can offer, whether it has an editor — is *derived* by reading the composable itself, its schemas, and its own capability spec; you are not asked to answer any of that. What comes out the other side is a declaration file and a presentation file, already wired, plus (if the module's capability spec has scenarios your work makes driveable) an update to that spec and its step definitions.

If the composable does **not** exist yet, the same door builds it first — `playground=both` (the default) runs the composable work end to end and then builds the page over the module it just landed, in one pass, so you never answer the module's own intake twice.

You then open the module in your editor and tune two things a machine cannot decide for you: the module's icon (the door leaves a placeholder), and — if you disagree with anything the derivation picked (an excluded field, a renderer choice) — the presentation file directly. Everything you change by hand there survives the next time someone re-runs the door over the same module, because a re-run rewrites the files in place using the same current rules, and `git` is how you'd see and recover from any local edit that got overwritten.

The rest of this document explains what those two generated files actually contain, so a hand edit is an informed one.

## Anatomy of a declaration

A worked, real example — the collection-and-editor page over the client-email module:

```ts
import {
  ClientEmailContextTypes,
  useClientEmailManager,
  useClientEmails
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  tableUischema
} from "./client-email.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

export const CLIENT_EMAILS_SCENARIO = "client_emails";

const SAVE_FEEDBACK = {
  success: "confirm.email_saved",
  failure: "error.client_email_update_failed"
};

export default {
  key: CLIENT_EMAILS_SCENARIO,
  useList: useClientEmails,
  useMutate: useClientEmailManager,
  persistCriteria: true,
  handoff: {
    add: { feedback: SAVE_FEEDBACK },
    edit: {
      context: { type: ClientEmailContextTypes.EMAIL, from: "/id" },
      feedback: SAVE_FEEDBACK
    }
  },
  tracks: "client-email",
  presentation: {
    icon: "mail-01",
    table: tableUischema,
    card: cardUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
```

Reading it field by field:

- **`key`** — a stable identifier for this scenario. Used internally; not the URL (the URL segment is the directory name).
- **`useList` / `useMutate`** — the module's own collection and manager composables, named directly. At least one is required. Naming both is what makes the collection's rows able to hand off to the editor.
- **`persistCriteria`** — opts this page's request state (filters, sort, page, visible columns) into the URL. Leave it off for a page where a shareable link is not worth the extra URL noise.
- **`handoff`** — one entry per editor control the presentation declares (`add`, `edit`, or any other name a presentation action references). `add` names no `context`, because a record that does not exist yet has nothing to seed an editor from; `edit` names the field on the row (`/id` here) that becomes the editor's context id. `feedback` is a pair of i18n keys said aloud when the save settles either way.
- **`tracks`** — the module's own name, matched against how that module's capability spec, step definitions, and recorded response bodies are keyed. This is a **read key**, not a registration: naming a module that keeps the conventional test-directory layout is all that is required for its recorded scenarios to reach this page. Omit it, and the page still works — it simply has nothing on its transport bar.
- **`presentation`** — an icon, and the table/card/actions uischemas, imported from the sibling presentation file.

What is **not** here, and why, is as important as what is: no scope, no copy of the scope matrix, no sort options, no form fields, no sidebar-specific icon field. Every one of those is read from the composables named above, at runtime, every time the page mounts — see [architecture.md](./architecture.md#the-declaration-and-its-presentation) if you are tempted to add one back.

## Anatomy of a presentation

The same module's presentation file, trimmed to the table:

```ts
export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellIcon",
      scope: "#/properties/meta/properties/isDefault",
      i18n: "text.default_label",
      options: { icon: "star-01" }
    },
    {
      type: "TableCellText",
      scope: "#/properties/email",
      i18n: "text.email_address"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: {
        badges: [
          { flag: "isVerified", i18n: "text.verified_label", color: "success" },
          { flag: "isBounced", i18n: "text.bounced_label", color: "danger" }
        ]
      }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/bouncedAt",
      i18n: "text.date_bounced"
    }
  ]
};
```

Each element is: a `scope` (a JSON Pointer into the mapped record the composable publishes), an `i18n` key (its column header / card label — **never** a hardcoded English string), and a `type` naming a registered cell renderer, plus whatever options that specific renderer needs (an icon name; the set of badges to draw). This one list is simultaneously the column order, the header row, every cell's drawing logic, and the column picker's default visible set — see [architecture.md](./architecture.md#cell-renderers) for the full renderer catalogue.

The `actions` uischema in the same file is one list shared by the table row and the card: each entry names a live member of the composable's own action map (or a `handoff` key from the declaration, for a control that opens an editor instead of calling a function directly), its placement, and — through a JSONForms rule evaluated against the row — when it should be disabled or hidden. A real example from the same module:

```ts
{
  type: "Action",
  name: "remove",
  i18n: "action.remove",
  icon: "trash-01",
  color: "danger",
  placement: ActionPlacementTypes.VISIBLE,
  feedback: {
    success: "confirm.email_removed",
    failure: "error.client_email_delete_failed"
  },
  rule: {
    effect: RuleEffect.DISABLE,
    condition: {
      type: "LEAF",
      scope: "#/properties/meta/properties/canDelete",
      expectedValue: false
    }
  }
}
```

The record's own `canDelete` flag — not a client-side guess — is what greys the button out.

## Changing a page afterwards

Two ways, depending on how big the change is:

- **A small, presentational tweak** (reorder columns, change a renderer, adjust an action's placement or rule) — edit the presentation file directly. Nothing about the declaration or the runtime needs to know; the change takes effect the next time the page mounts.
- **The composable itself changed shape** (a new filterable field, a new action, a widened scope matrix) — re-run the factory door with `playground=page` (or `playground=both`, if the composable itself needs work too) over the same module. Every route this system offers is *add-or-update*: nothing is skipped because a file already exists, and the run rewrites the declaration and presentation files in place to match the composable's current shape, reporting exactly what changed (a field added or dropped, a renderer's type changed, a channel gained or retired) so you can read that report beside `git diff` rather than hunting for the difference yourself. There is no shadow output directory and no `.new` file to reconcile — `git` is the record, which is also why an upgrade run refuses outright over a page carrying uncommitted local edits: commit first, then re-run, so nothing you tuned by hand is silently lost.

## Trying it without the factory

You can always write a declaration and a presentation file by hand, following the shapes above — nothing in the runtime requires the factory to have produced them. What you lose by skipping it is the *derivation*: reading the composable's schemas and scope matrix correctly, picking the right renderer per field, and excluding the fields that should never be columns (system ids, duplicates, always-empty fields) is exactly the part a human is most likely to get wrong or skip under time pressure. Hand-authoring is a legitimate way to learn the shape; it is not the recommended way to keep a real module's page in step with its composable over time.
