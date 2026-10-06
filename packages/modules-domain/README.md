# @upmind-automation/domain

Domain search and the domain availability check (DAC). The client searches for a domain name,
sees which names are available, and adds them to the basket. The package holds the DAC page,
the DAC widget that the catalogue shows, the domain search drawer, the smart domain field, and
two form controls that bring the domain search into a product form.

## Public barrel

`src/index.ts` is the only entry. It publishes this package's own components, constants and
types. Read state from `@upmind-automation/headless` directly.

| Export | What it is |
| --- | --- |
| `UpmDac` | The main component of the DAC page. It emits `resolve` with the chosen domain names. |
| `UpmDacWidget` | The DAC in the catalogue. It places its own blocks in the catalogue's page. |
| `UpmDomain` | The domain search in the package's own drawer. |
| `UpmSmartDomainField` | The domain field of a product form. Its choices are skip, register, existing and basket (`SMART_DOMAIN_CHOICES_ORDER`). |
| `domainRenderers` | The two form controls. One matches a control with the `domain_name` semantic type, the other a string control with the `sld` format. |
| `DOMAIN_TEMPLATE` | The layout names: `full`, `drawer`, `widget`. Unlike this package's siblings, `domain` keeps its own template names: `UpmDacWidget` and the drawer use picks one directly, without going through a host page. |
| `SMART_DOMAIN_CHOICES_ORDER` | The order of the smart domain field's choices. |
| `DacProps`, `DomainProps`, `DomainSlotProps`, `DomainActionsProps`, `DomainCardProps`, `DomainCardMeta`, `DomainCardsProps`, `DomainCardSkeletonProps`, `DomainSummaryProps`, `SmartDomainDrawerProps`, `SmartDomainExistingProps`, `SmartDomainFieldProps`, `SmartDomainSummaryProps` | The prop types. |

## Render the main component on a page

`UpmDac` wraps its template in `foundation`'s `LayoutProvider`: the page's layout renders
through the component's default slot, and the component's own named blocks then fill that
layout's slots. A normal page is three lines:

```vue
<UpmDac :tlds="tlds" v-slot="{ template }" @resolve="doResolve">
  <component :is="domainTemplate(template)" />
</UpmDac>
```

`domainTemplate` is the host app's own function: it looks the page's `template` up in its own
record of layouts, keyed by `DOMAIN_TEMPLATE`, and falls back to its own default for a name the
record does not hold. The blocks are `hero`, `search`, `tabs`, `results`, `hint` and `resolve`.
The `hint` block does not render on a small screen.

To replace one block, write that slot on the layout. The other blocks stay:

```vue
<UpmDac :tlds="tlds" v-slot="{ template }" @resolve="doResolve">
  <component :is="domainTemplate(template)">
    <template #hero>
      <DomainOffer />
    </template>
  </component>
</UpmDac>
```

Props (`DacProps`): `template` (default `DOMAIN_TEMPLATE.FULL`), `type`, `touched` and `tlds`.
Unlike this package's siblings, `UpmDac` does not read the brand's configured template for
itself — a plain page leaves `template` at its default, and a caller that needs a specific
arrangement (the widget, the drawer) sets it directly. The setup waits for the search state, so
the component renders inside a `<Suspense>` boundary.

## The DAC widget in the catalogue

`UpmDacWidget` renders `UpmDac` with `:template="DOMAIN_TEMPLATE.WIDGET"` and places the blocks
itself. It needs no layout from the page and takes no props. `search` and `results` render
where the catalogue shows its widget. `hint` and `resolve` teleport to the catalogue's
`#domain-aside-footer` and `#domain-content-footer` targets. A resolve takes the next funnel
step. The catalogue loads the widget with a dynamic import, so a catalogue that never shows the
domain search never loads this package.

## Form controls

`src/index.ts` registers `domainRenderers` with `foundation`'s form registry when the package
loads. `package.json` lists `./src/index.ts` in `sideEffects`, so a build keeps the
registration. An app that sells domains imports the package at startup, so the controls exist
before a product or basket form renders.

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/domain/styles";
```

The entry (`src/styles.css`) adds this package's files to the app's Tailwind source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless`,
`@upmind-automation/foundation` and `@upmind-automation/product`. These are the entries in its
`tsconfig.json` `paths`. The edge to `product` is one-way: `product` does not import this
package.

It must not import:

- Any other domain package, `catalogue` included, or `@upmind-automation/client-vue`. The
  repo-root `vue-tsc -b` gate reports the import as `TS2307`.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
- Nuxt core (`#app`, `#imports`, `nuxt`, `nuxt/kit`, `nuxt/app`).
  `src/__tests__/boundary.test.ts` fails on it.
- A module that imports this package back. The `import/no-cycle` lint rule reports it.
