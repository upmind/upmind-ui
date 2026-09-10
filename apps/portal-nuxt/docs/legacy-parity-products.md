# Legacy parity — product pages

What a client can do on legacy's product screens, against what the portal
sandbox offers. One row per legacy control. Actor is the client; staff-only
controls are out of scope.

**Oracle:** `vue-app` `master` at `0ab2fabdb3`, release 1.74.0, 8 September
2026. An earlier version of this table was graded on a July 2024 checkout and
is superseded.

Status: **Present** — same capability, wherever it sits. **Partial** — a
narrower form. **Absent** — nothing offers it. **Dropped** — left out on a
recorded decision, cited. **Unverified** — not checked by hand yet.

## Products list

| Legacy control | Portal | Status |
| --- | --- | --- |
| Header "Place new order"; brand storefront URL when set | Nav tab, Order page, storefront redirect | Present |
| Section menu: all / subscriptions / one-time / by category; one-time hidden by brand setting | Aside menu, same gate | Present |
| "Show delegated products" switch | — (`mock/selectors.ts`: belongs to the delegates area) | Dropped |
| Tabs active / cancelled / all | Status tabs | Present |
| Quick search | "Search by name" | Present |
| Filters: purchased, next due, price, name, category, status, type | Same, plus tag | Present |
| Sort, with the cancelled tab's own set | Sort control | Present |
| Refresh button | — (no live data to reload) | Absent |
| Grid / list toggle | Same | Present |
| Pagination with page size | Same | Present |
| Empty state, informational | Empty state with "Place new order" | Present |
| Card click and "Manage" CTA | Title link and one CTA: "Manage", or "Complete setup" while owed | Present |
| Card corner icon: pending setup → Setup tab | The "Complete setup" CTA | Present |
| Card / row icon: unresolved provisioning request | Red tag on row and card, opens the product | Present |
| Row click opens the product | Title link only | Partial |
| Row dropdown | None for clients; none here | Present |
| "Add label" tag; reference tag opens the label form | Same | Present |
| Free trial, delegated and promo-code tags | Same | Present |
| Original product name where the brand renamed it | "formerly …" in the row and billboard line | Present |
| Cancelled and lapsed rows dimmed, names struck through | Same, on rows, cards and table rows | Present |
| Sole product: redirect to its page | `soleProductRedirect` | Present |

## Dashboard product group list

| Legacy control | Portal | Status |
| --- | --- | --- |
| "View all" | Same | Present |
| Service / category chips, "Show more" | Same | Present |
| Row: name link, featured function button, "Manage" | Same helpers | Present |
| Row menu: every function, Manage, Manage billing | Same | Present |
| Compact pagination inside a group | "Show more" only | Partial |
| Empty state "Place new order" | — | Unverified |
| Needs-confirmation billboard + load more | "Almost ready" on dashboard and Products page | Present |
| Billboard excludes products pending cancellation, and delegated ones | — | Unverified |

## Product detail shell

| Legacy control | Portal | Status |
| --- | --- | --- |
| Tabs setup / overview / billing / tickets / settings | Same, plus a Delegates tab | Present |
| Mobile: tabs as a dropdown, featured functions appended | Tab row stays | Partial |
| Product root lands on Setup while setup is owed, else Overview | `productRootRedirect` | Present |
| Billboard: image, category, reference tag | Same | Present |
| Notice: "Go to order" while pending | Same | Present |
| Notice: "Don't cancel" for auto-expire, a hard request, a scheduled date | Same, one action for all three | Present |
| Notice: "Complete setup" | Same | Present |
| Notice: "View invoices" when suspended or unpaid | "View unpaid invoices" | Present |
| Notice: "Turn on auto-renew" | "Keep renewing" | Present |
| Quick actions: featured functions, upgrade / downgrade | Same; "Change product" | Present |
| Summary list; purchase date links to the order | "View order" | Present |
| Trial message: end trial early | Same | Present |
| About this product | Same | Present |
| "Open a support ticket" | Same | Present |

## Overview

| Legacy control | Portal | Status |
| --- | --- | --- |
| Delegated-access notice | — | Unverified |
| Brand markdown template | Template slot | Present |
| Copy a provisioning value; "Show all details" | Same | Present |
| One button per provisioning function; disabled per function | "Provisioning actions" | Present |
| Provisioning iframe panels | "From your provider" | Present |
| Add note; note pin, edit, convert, delete | Same | Present |
| Notes paged on the overview | Capped list with "View all" | Partial |
| Add secret; reveal, copy, pin, edit, convert, delete | Same | Present |

## Setup

| Legacy control | Portal | Status |
| --- | --- | --- |
| Setup fields form, "Confirm" | Setup form, save | Present |
| Revert to initial values | "Cancel" | Partial |
| Redirect away when setup is not owed | `setupAreaRedirect` | Present |

## Billing

| Legacy control | Portal | Status |
| --- | --- | --- |
| Price breakdown | "What you are charged for" | Present |
| Manage-subscription band | Same | Present |
| End trial early; upgrade / downgrade | Same | Present |
| "Cancellation options", disabled with a reason: pro-rata pending, overdue invoices, brand forbids | Same three reasons | Present |
| Pending pro-rata warning | "Pending change" notice | Present |
| "Don't cancel" on the request and auto-expire messages | Same | Present |
| Automation timeline | "What is scheduled" | Present |
| Timeline links: create invoice, turn on auto-renew, stop expiry | Inline actions on the three events | Present |
| Invoice consolidation form | Same | Present |
| Invoices and credit notes listings | Same | Present |

## Settings

| Legacy control | Portal | Status |
| --- | --- | --- |
| Custom label form | Same | Present |
| Change / select payment method | client-vue stub | Absent |
| Renewals: turn auto-renew off with confirm, on; create renewal invoice | Toggle and "Renew it yourself" | Present |
| Unpaid-invoices and cancellation-options links in the renewal message | Same | Present |
| "Cannot disable auto-renew" message offering cancellation instead | — | Unverified |
| Billing address / company form; create one from here | Same | Present |
| Invite delegate; per-delegate manage and revoke | Same | Present |

## Tickets tab

| Legacy control | Portal | Status |
| --- | --- | --- |
| Tickets filtered to this product, five at a time | Same | Present |
| "Open new ticket" here | Staff only in legacy; the aside button serves the client | Present |

## Modals

| Legacy control | Portal | Status |
| --- | --- | --- |
| Cancellation: don't cancel, end of term, immediate, future date with picker; reason and custom fields; submit | Same options and fields | Present |
| Migrations list: cards, read-more detail, load more, cancel | Options list, no detail modal | Partial |
| Upgrade / downgrade confirm, then the resulting invoice | "Review changes", then the migration | Unverified |
| Order-complete celebration | "Order complete" banner | Present |

## Brand custom pages

| Legacy control | Portal | Status |
| --- | --- | --- |
| Nav ribbon and side menu entry per page with "show on menu" | Nav item | Present |
| Route `/~/:slug`, one page per slug | `/:slug` custom area | Present |
| Title block over the body | Page header, body in a panel | Present |
| Body as markdown or embedded frame | Same two variants | Present |
| Not found state with "Go back" | Not-found page; no back button | Partial |

## Changes since July 2024 seen outside the product screens

From `RELEASES.md` 1.12.6 → 1.74.0. Not yet in the portal:

- A product filter on the client's ticket list.
- Notification topics chosen per email address.
- Pinned vault notes and secrets reachable from the profile menu.
- An email code before a username or password change.
- Brand setting that stops clients scheduling tickets.

## Gaps to act on

1. From outside the product screens: a product filter on the ticket list,
   notification topics per email address, pinned vault items in the profile
   menu, an email code before a username or password change, and the brand
   setting that stops clients scheduling tickets.
2. Payment method waits on client-vue.
3. Partial today: mobile tab dropdown, in-group paging on the dashboard, notes
   paging on the overview, the migration detail modal, a "Go back" on a custom
   page's not-found state, row click anywhere on a list row.
