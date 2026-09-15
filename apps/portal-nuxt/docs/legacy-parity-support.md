# Legacy parity — support, dashboard and chrome

What a client can do on legacy's support and dashboard screens, and in the
client chrome, against what the portal sandbox offers. One row per legacy
control. Actor is the client; staff-only controls are out of scope.

**Oracle:** `vue-app` `master` at `0ab2fabdb3`, release 1.74.0, 8 September
2026.

Status: **Present** — same capability, wherever it sits. **Partial** — a
narrower form. **Absent** — nothing offers it. **Dropped** — left out on a
recorded decision, cited. **Unverified** — not checked by hand yet.

## Support shell

| Legacy control | Portal | Status |
| --- | --- | --- |
| Whole section hidden when the brand disables support | Same gate | Present |
| Menu: My tickets, Add | Aside menu | Present |
| Support PIN panel: show, copy and hide, generate new | PIN band with reveal, copy and "Generate new" | Present |
| Knowledge base or status page link | None in legacy either; the brand's slot may carry one | — |

## Tickets list

| Legacy control | Portal | Status |
| --- | --- | --- |
| "Open new ticket" | Same | Present |
| Brand markdown slot | Template slot | Present |
| Tabs active / closed | Same | Present |
| Quick search over reference and subject; clear | Search | Present |
| Filters: status (multi), created date | Status select where the tab holds more than one; created range | Present |
| Sort: reference, subject, created | Same, newest first by default | Present |
| Refresh button | — (no live data) | Absent |
| Row click opens the thread | Title link | Partial |
| Lock tooltip on a locked ticket | — | Unverified |
| Delegated marker; scheduled-open date | "Delegated" and "Scheduled" tags | Present |
| Pagination with page size | Same | Present |
| Row menu | None for clients; none here | Present |

## New ticket

| Legacy control | Portal | Status |
| --- | --- | --- |
| Subject; department where more than one is public; related product; message | Same | Present |
| Schedule for later, gated by the brand setting | Same gate | Present |
| Attachments | File names only | Partial |
| "Create ticket", then the thread | Same | Present |

## Ticket detail

| Legacy control | Portal | Status |
| --- | --- | --- |
| Breadcrumb to My tickets | Aside link | Present |
| Status notice with date | Same | Present |
| Summary: status, department, dates, assigned to; copy the reference | Same | Present |
| Manage: reopen, edit subject, delegate access, add / change / remove related product, close | Same menu; delegates as a panel | Present |
| Actions disabled with a reason while locked | — | Unverified |
| Related product aside: product link, order link, show notes / secrets | Same | Present |
| Thread tabs: all, attachments | Same | Present |
| Load older messages; "show other changes" | — | Unverified |
| Per-message edit and delete | Same | Present |
| View a deleted message; download the source email | — | Absent |
| Attachment download and delete | — | Unverified |
| Reply box hidden once closed; attachments; post reply | Same | Present |
| Draft autosave; recall last message; Enter to send | — | Absent |
| "Post options": newline setting, submit shortcut | Same | Present |
| Rating or feedback | None in legacy either | — |

## Dashboard

| Legacy control | Portal | Status |
| --- | --- | --- |
| Brand slot, markdown or iframe | Same | Present |
| Needs-attention billboard, "Complete setup", load more | "Almost ready" | Present |
| Stat tiles: orders, invoices, unpaid invoices, active tickets; each links on | Same | Present |
| Currency dropdown on the stats | — | Absent |
| Upmind quota grid | Upmind's own tenant; dropped in the rebuild plan | Dropped |
| Products by group: view all, empty onboarding, group chips, show more, rows with function, manage, billing | Same | Present |
| In-group paging | "Show more" | Partial |
| Child accounts panel with view all | Same | Present |
| Recent invoices with go to, pay, download | Same | Present |
| Active tickets with view all, four rows | Same | Present |

## Client chrome

| Legacy control | Portal | Status |
| --- | --- | --- |
| Impersonation ribbon | Same | Present |
| Logo hidden when white-labelled | — | Unverified |
| Bell: filter all / read / unread, mark all read, load more, row opens the object, dismiss, read more | Feed with mark all read, read more, paging; no filter | Partial |
| Profile dropdown | Same | Present |
| Primary nav, support tab gated, store tab gated | Same | Present |
| Mobile menu | Bottom nav | Present |
| Custom pages in the nav | Same | Present |
| Footer slot; "Powered by Upmind" gated by the org | Same | Present |
| Language switcher, signed-out only | — | Unverified |
| Currency switcher; cookie banner | None in legacy either | — |

## Not copied from legacy

- Staff controls behind `isAdmin`: bulk ticket operations, the custom filter
  builder, internal notes, message signature, the notes feed tab.
- The department filter the portal offered on ticket lists; legacy's clients
  have none. Removed.

## Gaps to act on

1. Bell feed filter: all / read / unread.
2. Real attachments on tickets.
3. Thread extras: deleted-message view, source email download, draft autosave,
   Enter to send.
4. Stats currency dropdown for a multi-currency brand.
5. Unverified rows above.
