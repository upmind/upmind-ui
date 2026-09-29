# @upmind-automation/foundation

The presentation glue every domain package shares: the form host, the glyph resolver, the
section wrapper, the "back" affordance, the hero banner, and the terms-and-conditions text.
It knows no domain state of its own beyond what it reads from the session and brand layers.

## What Is This?

| Export | Role |
| --- | --- |
| `Form` | The form host every domain package mounts to render a JSON-schema-driven form. Supplies the icon set, country reference data and the active renderer list to the underlying engine, and translates its validation messages. |
| `useFormI18n` | The translator the form host passes in: nested-key lookup, a plain-message fallback, and a human-readable example in place of a raw regex on a pattern-validation error. |
| `Icon` | The shared glyph component. Resolves a name against the bundled glyph set first, then an app-registered SVG pack (country flags, provider logos, brand-specific glyphs) for names the bundled set has none for. |
| `registerIcons`, `setIconVariant`, `iconVariant` | Registers a host app's SVG asset map and the active pack (icon-variant) selection `Icon`'s asset-fallback path reads. |
| `Hero` | The page banner: title, optional subtitle/description, an optional badge, and `prepend`/`title`/`subtitle`/`description` slots for a caller that needs more than plain text. |
| `Back` | The "back to the previous step" affordance, drawn as a button or an inline link. |
| `Section`, `Sections`, `useSection` | The shared section wrapper (a titled, optionally card-framed content block with an actions slot) and the store that lets a template set its card/border/inset defaults once for every section on the page. |
| `TermsAndConditions` | The terms-and-conditions sentence a registration or checkout form shows, with the brand's own terms link when the brand has one and plain text otherwise. |
| `useFormRenderers`, `FORM_RENDERERS` | The one app-root injection this package still uses: the list of schema-driven field renderers a domain package's form controls resolve against. Defaults to an empty list when nothing provides it. |

## Templates and slots

This package holds no page organism itself, so it defines no `templates` prop or page-level
slots. Every other domain package's page organism takes its `templates` prop and named slots
independently (see that package's own docs); `foundation` supplies the pieces those pages and
templates are built from (`Icon`, `Hero`, `Back`, `Section`, `Form`).

## Dependencies

`@upmind-automation/headless` (validation, session, brand and reference data),
`@upmind/ui` (`Form`, `Button`, `Link`, `Badge`, the design tokens `Icon` and `Hero` draw on).

## Styles

The package ships its own `./styles` export (`@upmind-automation/foundation/styles`). A host
app `@import`s it directly rather than pointing a build alias at a relative path inside this
package.
