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

Each page organism takes a required `templates` prop: a record keyed by `AUTH_TEMPLATE`
(`split`, `enclosed`, `canvas-card`, `surface-box`, `two-column-ltr`, `two-column-rtl`, `inset`),
each value a component. The host page passes the record; nothing reaches the organism through
an app-root injection. The organism reads the brand's chosen template name (or the page's own
`template` prop as a fallback) and renders the matching component from the record. A name
missing from the record throws at render time, naming the missing key — the type also makes
the record required at compile time, so a host that leaves out a key fails its type-check.

## Slots

Every page organism exposes named slots with a default, so a host may fill or leave each one:

| Slot | Default | Notes |
| --- | --- | --- |
| `loading` | `UpmAuthLoading` | Shown while the page organism is mid-resolve |
| `back` | The funnel "back" link | Only rendered when the host runs a funnel |
| `hero` | The page's title + subtitle | |
| `form` | The tabbed `UpmAuth` (or `UpmAccount` for a guest upgrade) | |
| `summary` | — | Basket summary beside the form, shown only when the host's config marks it visible |
| `guest-checkout` | — | `UpmAuthRegister` only; fills with `{ registerAsGuest, isRegistering, class }`, a slot-props type this package owns |

## Navigation

A page organism does not navigate on its own. When the host runs a funnel, resolving or
rejecting calls the funnel's own next/back step directly. With no funnel running, the page
emits `resolve` or `reject` and leaves the decision to whatever mounted it. A host with no
funnel and no listener on these events does not navigate at all.

Resolving waits for the active session to hold the signed-in user before it settles (`UpmAuth`'s
own resolve path, and `UpmAccount`'s guest-upgrade branch); a failed user load rejects instead of
hanging.

## Exports

`AUTH_FORMS`, `AUTH_TEMPLATE` and every prop/emit/slot-prop type (`AuthProps`, `AuthViewProps`,
`AuthViewEmits`, `AuthTemplates`, `AuthRoutes`, `AuthSummarySlotProps`,
`AuthGuestCheckoutSlotProps`, `AuthActionProps`, `AuthExpiredProps`) live in `types.ts`.

## Dependencies

`@upmind-automation/headless` (the session, brand and validation state), `@upmind-automation/foundation`
(the shared `Hero`, `Section`, `Back`, `Icon`, form host and renderer socket), `@upmind/ui`.

## Styles

The package ships its own `./styles` export (`@upmind-automation/auth/styles`). A host app
`@import`s it directly rather than pointing a build alias at a relative path inside this package.
