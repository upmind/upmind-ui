# Legacy parity — product pages

What a client can do on legacy's product screens (`vue-app`), against what the
portal sandbox offers today. One row per legacy control. Actor is the client;
staff-only controls are out of scope.

Status: **Present** — same capability, wherever it sits. **Partial** — a
narrower form. **Absent** — nothing offers it. **Dropped** — left out on a
recorded decision, cited. **Unverified** — not checked by hand yet.

## Products list

| Legacy control | Portal | Status |
| --- | --- | --- |
| Header "Place new order" | Nav tab, and the group's Order page | Present |
| Section menu: all / subscriptions / one-time / by category | Aside menu | Present |
| "Show delegated products" switch | — (`mock/selectors.ts`: belongs to the delegates area) | Dropped |
| Tabs active / cancelled / all | Status tabs on the list | Present |
| Quick search | "Search by name" | Present |
| Filters: purchased, next due, price, category, status | Same, plus tag | Present |
| Sort: status, purchased, next due, cancelled | Sort control | Present |
| Refresh button | — (no live data to reload) | Absent |
| Grid / table toggle | Same | Present |
| Pagination with per-page size | Same | Present |
| Empty state "Place new order" | `emptyAction` on the list | Present |
| Card: whole card opens the product; "Manage" CTA | Title link and footer button | Partial |
| Card: setup warning icon → Setup tab | "Complete setup" button | Present |
| Card / row: unresolved provisioning request icon | Danger tag on the row and card, opens the product | Present |
| Table row: click opens the product | Title link, button, "…" menu | Partial |
| Needs-confirmation billboard + load more | "Almost ready" heads the dashboard and the Products page | Present |
| Sole product: redirect to its page | `soleProductRedirect` | Present |

## Dashboard product group list

| Legacy control | Portal | Status |
| --- | --- | --- |
| "View all" | Same | Present |
| Service / category tiles, "Show more" | Same | Present |
| Row: name link, featured function button, "Manage" | Same helpers | Present |
| Row menu: every function, Manage, Manage billing | Same | Present |
| Compact pagination inside a group | "Show more" only | Partial |
| Empty state "Place new order" | — | Unverified |

## Product detail shell

| Legacy control | Portal | Status |
| --- | --- | --- |
| Tabs setup / overview / billing / settings | Same, plus Tickets and Delegates | Present |
| Mobile: tabs as a dropdown, featured functions appended | The tab row stays; no dropdown, no appended functions | Partial |
| Notice: "Go to order" while pending | Same | Present |
| Notice: "Don't cancel" (auto-expire, cancellation request) | Same | Present |
| Notice: "Complete setup" | Same | Present |
| Notice: "View invoices" (suspended, unpaid) | "View unpaid invoices" | Present |
| Notice: "Turn on auto-renew" | Settings toggle only | Partial |
| Quick actions: featured functions | Same | Present |
| Quick actions: upgrade / downgrade | "Change product" | Present |
| Summary: purchase date links to the order | "View order" | Present |
| Trial message: end trial early | Same | Present |
| "Open a support ticket" | Same | Present |

## Overview

| Legacy control | Portal | Status |
| --- | --- | --- |
| Copy a provisioning value | Copy icons | Present |
| "Show all details" | Same | Present |
| One button per provisioning function; redirect opens the panel | "Provisioning actions" | Present |
| Function that asks for input fields first | — (run takes no fields) | Absent |
| Add note, add secret | Same | Present |
| Secret reveal and copy | Same | Present |
| Note / secret menu: edit, convert, delete | Same | Present |

## Setup

| Legacy control | Portal | Status |
| --- | --- | --- |
| Provisioning field form, confirm | Setup form, save | Present |
| Fields the client may not edit shown read-only | — (the mock marks no field read-only) | Absent |
| Revert to initial values | "Cancel" | Partial |
| Redirect away when setup is not pending | `setupAreaRedirect` sends the URL to the overview | Present |

## Billing

| Legacy control | Portal | Status |
| --- | --- | --- |
| Manage-subscription band | Same | Present |
| End trial early | Same | Present |
| Upgrade / downgrade | Same | Present |
| Issue next invoice / late renewal invoice | Same | Present |
| Cancellation options (end of term, immediate, reason) | Form | Present |
| Custom fields on the cancellation form | Same | Present |
| "Don't cancel" on the pending-request and auto-expire messages | Same | Present |
| Timeline links: create invoice, turn on auto-renew, stop auto-expire | Inline actions on the three events | Present |
| Timeline: due invoice number opens the invoice | The payment event links to the invoice | Present |
| Invoice consolidation choice | Same | Present |
| Invoices and credit notes listings | Same | Present |

## Settings

| Legacy control | Portal | Status |
| --- | --- | --- |
| Custom label | Same | Present |
| Change / select payment method | client-vue stub | Absent |
| Turn auto-renew off (confirm) / on | Toggle | Present |
| Unpaid-invoices link, cancellation-options link | Same | Present |
| Billing address / company selectors | Same | Present |
| Create an address or company from here | "Add a new address", "Add company" | Present |
| Invite delegate, revoke delegate | Same | Present |

## Modals

| Legacy control | Portal | Status |
| --- | --- | --- |
| Migrations list: pick a product, read more, load more | Options list | Partial |
| Upgrade / downgrade: confirm, then the resulting invoice | "Review changes", then the migration | Present |
| Provisioning function input form | — | Absent |

## Place new order — first screen

The portal's Order page is a one-step catalogue: "Order" creates a processing
order and its unpaid invoice. Decision, 10 September 2026: the cart owns the
shop, so the portal never re-implements legacy's shop step. Every row below is
dropped on that decision.

| Legacy control | Portal | Status |
| --- | --- | --- |
| Currency switcher, basket stepper, basket button | — | Dropped |
| Category search, category tree | Aside categories | Dropped |
| Product search, domain search widget | — | Dropped |
| Product title opens a product view; "read more" | — | Dropped |
| CTA: add to basket / view / try free | "Order" | Dropped |
| Load more | Pagination | Present |

## Gaps to act on

1. A provisioning function that asks for input has no form. The mock's
   functions carry no fields.
2. Setup fields the client may not edit are not modelled as read-only.
3. Payment method on Settings waits on client-vue.
4. Dashboard groups page with "Show more" only; legacy paged inside a group.
5. Mobile keeps the tab row; legacy folded the tabs into a dropdown.
6. The dashboard's empty state and the trial "end early" confirm remain to be
   checked by hand.
