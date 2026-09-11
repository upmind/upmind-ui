# Legacy parity — billing pages

What a client can do on legacy's billing screens, against what the portal
sandbox offers. One row per legacy control. Actor is the client; staff-only
controls are out of scope, and legacy's own staff leaks are not copied.

**Oracle:** `vue-app` `master` at `0ab2fabdb3`, release 1.74.0, 8 September
2026.

Status: **Present** — same capability, wherever it sits. **Partial** — a
narrower form. **Absent** — nothing offers it. **Stub** — a client-vue
component the sandbox does not mock; the real portal gets it from client-vue.
**Dropped** — left out on a recorded decision, cited. **Unverified** — not
checked by hand yet.

## Billing menu

| Legacy control | Portal | Status |
| --- | --- | --- |
| `/billing` opens Orders | Same | Present |
| My orders, My invoices with paid / unpaid / credited, Credit notes, Payment methods, Account credit, Settings | Aside menu, status tabs on the invoices page | Present |
| "Place new order", brand storefront URL when set | Nav tab | Present |
| My legacy invoices, for a client with imported invoices | — | Absent |

## Orders

| Legacy control | Portal | Status |
| --- | --- | --- |
| Orders list: search, filters, sort, refresh, pagination, row click | client-vue `UpmOrder` | Stub |
| Order detail: status banner with pay link, "Cancel order", "Pay now", "View invoice", item links, item paging | client-vue `UpmOrder` | Stub |
| Order detail tabs | Legacy renders none for clients — a legacy bug, not copied | — |
| "Create segment" in the list's menu | Staff control leaking to clients in legacy — not copied | — |

## Invoices

| Legacy control | Portal | Status |
| --- | --- | --- |
| Tabs all / paid / unpaid / credited | Same | Present |
| Brand markdown slot above the list | Template slot | Present |
| Consolidation notice and "Consolidate invoices" | Notice and confirm dialog | Present |
| Consolidation modal: pick which invoices | Confirm consolidates them all | Partial |
| Search by number | Same | Present |
| Filters: created, due, invoice id, proforma, subtotal, number, total, discount; status on "All" | Same set | Present |
| Fraud-status filter | Staff filter leaking to clients in legacy — not copied | — |
| Sort: total, status, issued, paid, due; cancelled on the credited tab | Same | Present |
| Refresh button | — (no live data) | Absent |
| Pagination with page size | Same | Present |
| Row click opens the invoice | Title link | Partial |
| Row menu: go to invoice, pay, download | "Pay" button; menu with Go to invoice and Download | Present |
| Locked-invoice tooltip; delegate tooltip on "issued to" | — | Unverified |
| Detail: "Pay now" | "Pay" | Present |
| Detail: pay in another currency | — | Absent |
| Detail: pending-payment banner and "View payment instructions" | — | Absent |
| Detail: payment-method banner with change / select | client-vue stub | Stub |
| Detail: delegated-invoice notice | "Shared with you" | Present |
| Detail: share, download | Same | Present |
| Detail: item link to the product | — | Unverified |
| Detail: "Show n more items" / "Show less" | Same | Present |
| Detail: paid, clearing, credited and due totals | Paid and balance due; credited shown on a credited invoice | Present |
| Detail: payments list, hidden while clearing | "Payments" row | Present |
| `?init=pay` opens the pay flow on load | — | Absent |
| Pay modal: additional payment, change currency, change amount, pay in full, use account credit, stored methods, new gateway, pay | client-vue `PaymentDetails` | Stub |

## Credit notes

| Legacy control | Portal | Status |
| --- | --- | --- |
| Filters: id, amount, allocated / unallocated, created | Same | Present |
| Sort; refresh; pagination | Sort and pagination; no refresh | Partial |
| Row click opens the note | Title link | Partial |
| Delegated icon on a row | — | Unverified |
| Detail: delegated notice | "Shared with you" | Present |
| Detail: share, download | Download only | Partial |
| Detail: refund payments panel | "Refunds" | Present |
| Detail: not found redirects to the list | — | Unverified |

## Payment methods

| Legacy control | Portal | Status |
| --- | --- | --- |
| Add, list, inherited-from-parent list, edit, make default, retry verification, delete, auto-pay and default tags, no-gateway notice | client-vue `PaymentDetails · StoredPaymentMethods` | Stub |

## Account credit

| Legacy control | Portal | Status |
| --- | --- | --- |
| "Top up", disabled with a tooltip where the brand forbids it | Same | Present |
| Balances per currency | Same | Present |
| Per-currency top-up in the row menu | One "Top up" button | Partial |
| Credit limit panel, summary and progress | Same | Present |
| "View credit statements" opens a modal with filter, sort, refresh, download PDF / CSV, pagination | Statements listed on the page with filter, sort, pagination, downloads | Present |
| Top-up modal: currency, amount, stored or new method, submit | Same | Present |

## Billing settings

| Legacy control | Portal | Status |
| --- | --- | --- |
| Preferred currency; preferred payment currency where the brand allows | Same | Present |
| Price list select | Staff only in legacy; removed from the client form | Present |
| Save / revert | Save and cancel | Present |
| Consolidation section, gated by the brand setting | Same | Present |
| Enable / disable / inherit; weekly or monthly rule; day of week; day of month | Same | Present |
| Consolidated-invoice due-date day, 1 to 28 | "Days until it falls due" | Partial |

## Notices

| Legacy control | Portal | Status |
| --- | --- | --- |
| Delegated-object banner on invoices, orders and credit notes | "Shared with you" | Present |
| Empty states per list | Same | Present |

## Gaps to act on

1. Credit notes cannot be shared. Legacy shares them the way it shares invoices.
2. Consolidation asks which invoices to bring together; the portal takes all.
3. The consolidated invoice's due day should be a day of the month, 1 to 28.
4. Pay in another currency, pending-payment instructions, and `?init=pay` wait
   on the pay flow, which is client-vue's.
5. Orders and payment methods are client-vue stubs. Nothing to mock here.
6. Imported "legacy invoices" are not modelled. Decision needed: model them, or
   drop with a note.
