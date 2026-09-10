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
| Card / row: unresolved provisioning request icon | — | Absent |
| Table row: click opens the product | Title link, button, "…" menu | Partial |
| Needs-confirmation billboard + load more | Dashboard only ("Almost ready") | Partial |
| Sole product: redirect to its page | `soleProductRedirect` | Present |

## Dashboard product group list

| Legacy control | Portal | Status |
| --- | --- | --- |
| "View all" | Same | Present |
| Service / category tiles, "Show more" | Same | Present |
| Row: name link, featured function button, "Manage" | Same helpers | Present |
| Row menu: every function, Manage, Manage billing | Same | Present |
| Compact pagination inside a group | — | Unverified |
| Empty state "Place new order" | — | Unverified |

## Product detail shell

| Legacy control | Portal | Status |
| --- | --- | --- |
| Tabs setup / overview / billing / settings | Same, plus Tickets and Delegates | Present |
| Mobile: tabs as a dropdown, featured functions appended | — | Absent |
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
| Fields the client may not edit shown read-only | — | Unverified |
| Revert to initial values | "Cancel" | Partial |
| Redirect away when setup is not pending | Tab hidden; direct URL not checked | Unverified |

## Billing

| Legacy control | Portal | Status |
| --- | --- | --- |
| Manage-subscription band | Same | Present |
| End trial early | Same | Present |
| Upgrade / downgrade | Same | Present |
| Issue next invoice / late renewal invoice | Same | Present |
| Cancellation options (end of term, immediate, reason) | Form | Present |
| Custom fields on the cancellation form | — | Unverified |
| "Don't cancel" on the pending-request and auto-expire messages | Same | Present |
| Timeline links: create invoice, turn on auto-renew, stop auto-expire | Timeline rows carry no actions | Absent |
| Timeline: due invoice number opens the invoice | — | Unverified |
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
| Create an address or company from here | — | Unverified |
| Invite delegate, revoke delegate | Same | Present |

## Modals

| Legacy control | Portal | Status |
| --- | --- | --- |
| Migrations list: pick a product, read more, load more | Options list | Partial |
| Upgrade / downgrade: confirm, then the resulting invoice | Confirm | Unverified |
| Provisioning function input form | — | Absent |

## Place new order — first screen

The portal's Order page is a one-step catalogue: "Order" creates a processing
order and its unpaid invoice. Legacy's shop step is the cart's job. Every row
below is a simplification, not yet a recorded decision.

| Legacy control | Portal | Status |
| --- | --- | --- |
| Currency switcher, basket stepper, basket button | — | Absent |
| Category search, category tree | Aside categories | Partial |
| Product search, domain search widget | — | Absent |
| Product title opens a product view; "read more" | — | Absent |
| CTA: add to basket / view / try free | "Order" | Partial |
| Load more | Pagination | Present |

## Gaps to act on

1. Timeline rows need their actions back: create invoice, turn on auto-renew,
   stop auto-expire, open the due invoice.
2. A provisioning function that asks for input has no form.
3. The needs-confirmation billboard is missing from the Products page.
4. Unresolved provisioning requests have no indicator on a row or card.
5. Mobile tabs: check what the tabs module does at 390px.
6. Payment method on Settings waits on client-vue.
7. Decide the Order page's scope against the cart, then record it.
