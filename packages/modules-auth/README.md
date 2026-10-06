# @upmind-automation/auth

The client's own session views — sign in, register, recover a password, sign out — plus the
session-status components (tabbed auth panel, account/guest-upgrade forms, the header's
login control) that read the active session.

## What Is This?

**Page organisms** — one per route, mounted directly by a host app's page:

| Export | Role |
| --- | --- |
| `UpmAuthLogin` | Sign-in page |
| `UpmAuthRegister` | Registration page; also carries a guest client's upgrade-to-full-account form |
| `UpmAuthRecoverPassword` | Password-recovery page |
| `UpmAuthLogout` | The signed-out interstitial, with a "continue shopping" link back to the storefront |

**Session-status components** — mounted by a host's own chrome (header, page), not routed to:

| Export | Role |
| --- | --- |
| `UpmAuthAction` | The header's own login control: a login popover when signed out, an avatar + details dropdown when signed in |
| `UpmAuth` | The tabbed login/register/recover/verify panel the three page organisms embed |
| `UpmAccount` | The account forms (verify email, guest-upgrade, resend) the panel switches to |
| `UpmAuthLoading` | The default loading interstitial a page organism shows while it resolves |

## Templates

`UpmAuthLogin`, `UpmAuthRegister` and `UpmAuthRecoverPassword` resolve the brand's chosen
template value and hand it to their own default slot (`v-slot="{ template }"`). The package
names no layout of its own and keeps no record of one — the host page reads that value, looks
it up against its own template enum and component map, falls back to its own default, and
mounts the result inside the slot. Nothing reaches the organism through an app-root injection.
`UpmAuthLogout` and the session-status components take no template at all.

## Slots

Every page organism exposes named slots with a default, so a host may fill or leave each one.
The host's own template component — the one its default slot mounted — is what actually fills
them, and may set a slot's own display option with a bound attribute on the call
(`<slot name="form" :card="true" />`, never a bare `card`); the organism reads each option with
its own fallback.

| Slot | Default | Options a template may set |
| --- | --- | --- |
| `loading` | `UpmAuthLoading` | — (`UpmAuthLogin`, `UpmAuthRegister` only; `UpmAuthRecoverPassword` renders nothing while it resolves) |
| `back` | The funnel "back" link | `compact` — the short "Back" over the full "Back to basket"/"Back to login" label |
| `hero` | The page's title + subtitle | — |
| `form` | The tabbed `UpmAuth` (or `UpmAccount` for a guest upgrade) | `card` — wraps the form in a titled, tab-framed card; `active` — shows that tab header and the brand's note inside the form, `UpmAuthLogin`/`UpmAuthRegister` only; `guestSpacing` — the gap around `guest-checkout`, `UpmAuthRegister` only (one of the `GUEST_CHECKOUT_SPACING` values) |
| `summary` | — | Basket summary beside the form, shown only when the host's config marks it visible |
| `markdown` | The brand's own note for the page, when one is set | `flush` — drops the note's own spacing; `UpmAuthLogin`/`UpmAuthRegister` only, `UpmAuthRecoverPassword` has no `markdown` slot |
| `guest-checkout` | — | `UpmAuthRegister` only; fills with `{ registerAsGuest, isRegistering, class }`, a slot-props type this package owns |

## Navigation

A page organism does not navigate on its own. When the host runs a funnel, resolving or
rejecting calls the funnel's own next/back step directly. With no funnel running, the page
emits `resolve` or `reject` and leaves the decision to whatever mounted it. A host with no
funnel and no listener on these events does not navigate at all.

Resolving waits for the active session to hold the signed-in user before it settles. This
holds for `UpmAuth`'s own resolve path and for `UpmAccount`'s guest-upgrade branch. A failed
user load rejects instead of hanging.

## Exports

`AUTH_FORMS` and `GUEST_CHECKOUT_SPACING` (the `guestSpacing` slot option's values) live in
`types.ts`, alongside every prop/emit/slot-prop type (`AuthProps`, `AuthViewProps`,
`AuthViewEmits`, `AuthRoutes`, `AuthSummarySlotProps`, `AuthGuestCheckoutSlotProps`,
`AuthActionProps`, `AuthExpiredProps`).

## Dependencies

`@upmind-automation/headless` (the session, brand and validation state), `@upmind-automation/foundation`
(the shared `Hero`, `Section`, `Back`, `Icon`, form host and renderer socket), `@upmind/ui`.

## Styles

The package ships its own `./styles` export (`@upmind-automation/auth/styles`). A host app
`@import`s it directly rather than pointing a build alias at a relative path inside this package.
