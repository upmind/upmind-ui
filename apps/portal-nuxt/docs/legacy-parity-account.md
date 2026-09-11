# Legacy parity — account pages

What a client can do on legacy's account screens, against what the portal
sandbox offers. One row per legacy control. Actor is the client; staff-only
controls are out of scope.

**Oracle:** `vue-app` `master` at `0ab2fabdb3`, release 1.74.0, 8 September
2026.

Status: **Present** — same capability, wherever it sits. **Partial** — a
narrower form. **Absent** — nothing offers it. **Stub** — a client-vue
component the sandbox does not mock yet (`client-vue-placeholder-audit.md`). **Dropped** — left out on a recorded
decision, cited. **Unverified** — not checked by hand yet.

## Header and profile dropdown

| Legacy control | Portal | Status |
| --- | --- | --- |
| Notifications bell | Same | Present |
| Profile dropdown: signed-in name and email | Same | Present |
| Support PIN: show, then copy and hide | Same | Present |
| "My account", "Sign out" | Same | Present |
| Account selection where the session may act for several accounts | "Switch account" in the dropdown | Present |
| Impersonation ribbon with "end impersonation" | Same | Present |
| Mobile nav dropdown with sign out | Bottom nav | Partial |

## Account menu and card

| Legacy control | Portal | Status |
| --- | --- | --- |
| Avatar upload; remove avatar | "Change photo" by address; no remove | Partial |
| Username links to Security | Card row links to Security | Present |
| Parent-account link opens the relation | — | Unverified |
| Children link to Child accounts | Same | Present |
| Client tags, read-only | Same | Present |
| Support PIN panel: reveal, copy, generate new | Same | Present |
| Section links, gated by brand settings | Same; vault and affiliate gates | Present |
| `/account` opens Profile | Same | Present |
| Pinned vault shortcut | Staff-only in legacy; not offered | — |

## Profile

| Legacy control | Portal | Status |
| --- | --- | --- |
| First name, last name, public name, language; save / revert | Same | Present |
| Custom fields form | "About your account" | Present |
| Emails: add, copy, edit, set default, per-address topics, resend verification, enter code, delete | Same; the code prompt on the unconfirmed sign-in address | Present |
| Phones: add, edit, set default, delete | Same | Present |
| Addresses and companies: add, edit, set default, copy, delete | One "Address and company details" section with a find box, as legacy draws it | Present |

## Security

| Legacy control | Portal | Status |
| --- | --- | --- |
| Change username; change password | Same | Present |
| Current password asked mid-flow; second-step code where two-factor is on | "Confirm it is you" prompt: password, plus the code with two-factor on | Present |
| Two-factor enable / disable with QR and six-digit code | Enable dialog with key, link and code | Present |
| Two-factor disable | — | Unverified |
| IP whitelist: first entry form, search, edit, delete, add | Same | Present |
| Login history | Under Logs in both | Present |

## Notifications

| Legacy control | Portal | Status |
| --- | --- | --- |
| Feed filter: all / read / unread | — | Absent |
| "Mark all as read"; per-item mark read | Same | Present |
| Load more | Pagination | Present |
| Preferences grid per topic and channel; mandatory topics locked | Same | Present |
| "Select all" / "Clear all" per topic; save / revert | Same | Present |

## Notes and secrets

| Legacy control | Portal | Status |
| --- | --- | --- |
| Section hidden by brand setting | — | Unverified |
| Add note; pin; edit; convert; delete | Same | Present |
| Add secret; reveal; copy; pin; edit; convert; delete | Same | Present |
| Linked-product link on an asset | — | Unverified |
| Pagination per list | Same | Present |

## Delegates

| Legacy control | Portal | Status |
| --- | --- | --- |
| Invite: email, access type, products and tickets pickers, send | Same | Present |
| List: search, filter, sort, pagination; row opens manage | Same | Present |
| Remove delegate | Same | Present |
| Manage: access type, product and ticket grants, save, remove | Same | Present |
| Accept an emailed invite at `/delegate_access/accept/:hash` | Delegate-access page | Present |
| Account selection modal | "Switch account" | Present |

## Child accounts

| Legacy control | Portal | Status |
| --- | --- | --- |
| Screen only for parents | Gated on child accounts | Present |
| Filter, sort, pagination | Same | Present |
| Manage relation: allow impersonation, inherit payment details, use parent branding; save | Relation page toggles | Present |
| Log in as child | — | Unverified |
| Detach | Same | Present |
| Brand appearance: name, colour, font, images | Form with name, colour, font, logo | Present |

## Affiliate

| Legacy control | Portal | Status |
| --- | --- | --- |
| Section gated by two brand settings | Gated | Present |
| Opt-in CTA when not enrolled; disabled notice | — | Unverified |
| Stats grid | Same | Present |
| Request withdrawal, gated on a payable balance; modal with message; lands on a ticket | "Request withdrawal" | Partial |
| Create link; copy; edit; delete; filter, sort, pagination | Create and list; edit / delete | Partial |
| Referrals table | Same | Present |
| Commissions with invoice links | Commissions list | Partial |
| Payout destination with PayPal email; save / revert | Same | Present |
| Payout history | Same | Present |

## Logs

| Legacy control | Portal | Status |
| --- | --- | --- |
| Email history: tabs all / sent / bounced / failed, row preview, filters, pagination | client-vue `UpmEmailHistory` | Stub |
| Login attempts: list, filter, sort | Same | Present |

## Template slots and notices

| Legacy control | Portal | Status |
| --- | --- | --- |
| Affiliate overview slot; footer slot | Same | Present |
| Section descriptions | Same | Present |

## Not copied from legacy

- The pinned-vault shortcut on the profile card is staff-only.
- Staff controls behind `isAdmin`: mark email verified, validate tax number,
  manage commissions, unlink referral, retry or resend email.

## Gaps to act on

1. Notification feed filter: all / read / unread.
2. Remove avatar.
3. Affiliate: withdrawal message and the ticket it raises; link edit and delete;
   commission rows linking to their invoice.
4. Email history is still a placeholder: no client-vue component serves it
   (`client-vue-placeholder-audit.md`), so it is mocked next.
5. Unverified rows above.
