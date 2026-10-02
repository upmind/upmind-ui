# scenarios — The record archetype

One managed record (a contract, a contract product, a ticket) drawn as one page from one declaration. This is the third archetype beside the collection page (table/card) and the self-drawn page. The same shared page component draws it; nothing about a specific record is written in the runtime.

## How a declaration becomes a record page

A declaration is routed to the record archetype when it names a manager (`useManage`) **and** a route param addressing one record, and carries `presentation.record`. It names no `useList` or `useMutate`.

```ts
export default {
  key: CONTRACT_PRODUCT_SCENARIO,
  useManage: useContractProduct,
  params: ["id([0-9a-fA-F-]{36})?"],
  tracks: { module: "contract-product", without: ["@collection", "@migration"] },
  presentation: { icon: "box", record: contractProductRecord }
} satisfies ScenarioDeclaration;
```

- The page reads the param off the route and boots the manager `.withId(id)` through `useRecordTransport`. While a track is armed, the record the track's own recording addresses wins; Live hands the page back to the url's record. Every cell the page opens is held once and destroyed once.
- The param pattern is UUID-shaped on purpose: the scope suffix (`/as/client`) follows the id, and without a pattern `as` would resolve as the id.
- The param is optional. With no id in the url the page draws `RecordLookup` when the declaration has a `picker`: the owning collection's own picker form (`picker.schema`), whose pick navigates to the record, beside a direct id input. An input that is not an id resolves through the collection's criteria filter named in `picker.resolve` and opens the first match; no match shows the warning from `picker.resolve.i18n`.
- Navigation between records keeps the scope suffix: `recordPath` fills `:id` in a route template and carries the current `scopeSuffix` over.

## `RecordUischema`

```ts
type RecordUischema = {
  type: "RecordLayout";
  record: string;                       // context key holding the mapped record
  header: RecordHeaderDeclaration;
  sections: RecordSectionDeclaration[];
  actions: RecordActionDeclaration[];
  siblings?: string[];                  // further context keys folded into the model
  picker?: RecordPickerDeclaration;
};
```

Every scope in the declaration resolves against one model: the `record` value, plus each `siblings` key, plus the rows of any section `source` (below). Types live in `runtime/scenario.types.ts`.

## Layout conventions

These are fixed by the surface; a declaration chooses content, not layout.

- **One panel.** Header, body of sections, footer. No nested cards.
- **Header = title + one status badge + inline badges.** `header.title` and `header.status` are scopes into the model; `header.badges` are `TableBadge` entries whose `flag` is a meta flag (or whose `scope` yields a value passed to the label as `{value}`). A badge with a false flag is not drawn. Header actions are an opt-in exception (`placement: HEADER`); contract product uses one for Change of plan.
- **Write actions default to the footer** as one soft, small button group. A destructive write sets `color: RecordActionColorTypes.DANGER` for the danger tint.
- **"More" after two.** The first two footer writes draw as buttons; the rest, plus every `OVERFLOW` action, go under a "More" menu.
- **Utilities last.** `UTILITY` actions (refresh, reset) sit at the footer's trailing edge.
- **Hidden, never greyed.** An action's `gate` is a meta flag name, or a `#/` scope into the row (else the record); `!` negates it. While the gate is false the action is not drawn. An action whose `run` or `form.submit` the manager does not expose is not drawn either.
- **A clicked action shows loading** while its form is open or its `run` is in flight (`busy` names a meta flag to spin on instead). **Every other write is disabled** meanwhile. While a track is armed all controls are disabled with a "replay locked" tooltip.
- **Forms open in the one shared dialog.** An action with a `form` first fires its `run` (the manager's open transition, which fills the context slot), then the dialog draws `context[form.context]` (`{ schema, uischema, model }`). Change goes to `form.set`, the save to `form.submit`, dismissal to `form.cancel`; the dialog closes when submit settles. A write taking arguments publishes no model: the form declares its own `schema`, the dialog holds the draft, `prefill` seeds it from the row or record, and `submit` is called with the values `args` resolves. A refused write shows its error inside the dialog; a refused formless write shows it as an alert above the sections.
- **Sections use the foundation `Section`** — icon, label, and header links from the section's `actions` (for example Open product, Unlink product).
- **Empty is not drawn.** A field with no value or a hidden rule is skipped (`drawableCells`); a `fields` section with no drawable field is skipped; a `collection` with no items (and no read in flight) is skipped. Absent dates are not drawn (below).
- **Skeleton boot.** Before the first record arrives the surface draws a skeleton shaped by the declaration: a placeholder per header action, field, collection row, footer write and utility. A held record stays on screen through a refresh or refused write; the module's own state notice draws only when there is nothing to show.

### Actions

```ts
type RecordActionDeclaration = {
  name: string; i18n: string; icon?: string;
  variant?: ButtonVariants["variant"];   // header controls only
  color?: RecordActionColorTypes;        // PRIMARY (default) | DANGER
  placement?: RecordActionPlacementTypes;
  gate?: string; busy?: string;
  run?: string; args?: string[];
  form?: RecordFormDeclaration;
  navigate?: RecordNavigateDeclaration;
};
```

`RecordActionPlacementTypes`: `FOOTER` (default), `OVERFLOW`, `UTILITY`, `HEADER`, `ROW`. `ROW` draws as a link in a collection item's header. An action does one of three things: `navigate` pushes a route (`route` template with `:id` from `idScope`, `query` merged; with no `route`, the current path is kept and only `query` is merged), `form` opens the dialog, or `run` fires a manager action. `args` are scopes resolved against the row (else the record). Labels are i18n keys.

## Sections and the registry

`RecordSectionDeclaration` is resolved by `kind` through `recordSectionRenderers` in `record.renderers.ts`. A new kind is a registry entry and a component beside it, never a branch in `RecordSurface`. A kind with no entry draws nothing.

| `kind` | Draws | Notes |
| ------ | ----- | ----- |
| `fields` | `elements: TableCell[]` on a field grid | Section header from `i18n` + `icon`; header links from `actions`. |
| `collection` | One `Section` per item at `scope` | No group heading. See below. |
| `thread` | A timeline of entries, views, per-message and per-file controls, and a reply composer | Declared by `entries`, `discriminator`, `message`, `log`, `views`, `download`, `composer`, `empty`. Used by the ticket. |

### Fields and widths

Cells are the same `TableCell` types the table uses, drawn through the table's own cell dispatcher. A field's `options.width` is a `TableColumnWidthTypes` member, mapped by `columnWidthClasses`; absent, a quarter. Every share is a whole number of twelfths, so mixed widths flow onto one 12-column grid. `TableCellBadges` is populated only when at least one declared badge is true. A rule (`RuleEffect.SHOW` over a scope) hides a field conditionally.

### Collections

A collection never draws a group heading: each item is its own `Section`, header = title + link(s), details in the body.

- `rowTitle` — a scope or list of scopes; the first populated names the item. `itemLabel` is an i18n key given `{name}`; absent, the name alone. `rowIcon` is the item header icon.
- `row` — the cells in the item's body.
- `rowActions` — drawn as links in the item header (`ROW` placement). A `DANGER` colour tints the link.
- `summary` — cells drawn once under the items.

### Second-composable source: `useRecordSources`

A collection may read its rows from another composable by declaring `source`:

```ts
source: {
  use: useTickets,
  actor: ScopeActorTypes.CLIENT,
  context: { type: TicketsContextTypes.CONTRACT_PRODUCT, idScope: "#/properties/id" }
}
```

`useRecordSources` boots that composable through the same `useModulePort` a list page uses, at `actor`, `.for(context.type, id)`, with the id read off the record at `context.idScope`. Its rows (`context.data`, or the key `rows` names) are written into the model at the section's `scope`. A new record id destroys the old cell and boots a fresh one; unmount destroys all. While the first read is in flight the section shows a loading skeleton rather than being treated as empty. A record with no id at `idScope` boots nothing.

## Cell and date rules the record relies on

- **`TableCellStatus`** draws the value's `name` (a mapped `{ code, name }` status) or the value itself as the same status badge the header draws.
- **`isAbsentDate`** (`scenario.utils.ts`) treats an empty value, or a year at or below the epoch year, as absent. A date cell for an absent date is not drawn, so a zero date never reads "127 years ago".

## Shared summaries

When two records show the same thing, the fields are declared once in a summary module, never twice. Both sides import it:

| Summary | File | Shown by |
| ------- | ---- | -------- |
| `contractSummary(source)` | `useContract/contract.summary.ts` | Contract Details; Contract product Billing |
| `contractProductSummary` | `useContractProduct/contract-product.summary.ts` | Contract product Details; one section per product on the contract |
| `ticketSummary` | `useTicket/ticket.summary.ts` | Ticket Details; one section per ticket on the contract product |

`contractSummary` takes a base scope (the contract's own `raw`, or the product's `raw.contract`), scopes only one side carries (`billingCycle`, `paymentMethod`; a side passing none draws without them), and `prefixed`, which selects the label set that names the contract when it appears inside another record. The reciprocal links between records are `navigate` actions in a section or item header (Open product, Open contract, Open ticket).

## Worked examples

| Record | Declaration | Shows |
| ------ | ----------- | ----- |
| Contract | `useContract/contract.presentation.ts`, `contract.summary.ts` | `siblings: ["title"]`; Details from `contractSummary`; products collection through `contractProductSummary`, each with an Open link; a `payment-method` form action gated `!isFraud` (`set: "input"`, `submit: "update"`); refresh and reset utilities; a `picker` over `useContracts`. |
| Contract product | `useContractProduct/contract-product.presentation.ts`, `contract-product.summary.ts` | Eight flag badges; Change of plan as a `HEADER` `navigate` action gated `canMigrate`; `cancellation` (danger) and `consolidation` form actions opening the manager's own context slots; withdraw, resume and revoke-scheduled under `OVERFLOW`; a Billing section combining product fields with `contractSummary` and an Open contract header link; a tickets collection with a `source` on `useTickets`. |
| Ticket | `useTicket/ticket.presentation.ts`, `ticket.summary.ts` | `siblings: ["feed"]`; a Details section from `ticketSummary`; a products collection through `contractProductSummary` with Open product and a danger Unlink product link; a `thread` section with message edit/delete/reload, file delete and download, older/newer paging, and a reply composer; close (danger) and reopen; argument forms (`subject` prefilled, `link-product`); a "link by id" write under `OVERFLOW`. |

## Authoring checklist

1. Declare `useManage`, the optional UUID-shaped id param, and `presentation.record`; leave `useList` and `useMutate` out.
2. Put every write in `actions`; leave `placement` off unless it is not a footer write. Add `color: DANGER` for destructive ones.
3. Gate by meta flag, not by hiding in the template.
4. Reuse a shared summary if another record already shows the same thing; if two records now show one thing, move it to a summary and import it from both.
5. Add a `picker` so the bare url is useful.
6. Check the page against the recorded scenarios: an armed track locks the controls and drives the record its recording names.
