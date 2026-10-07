# @upmind-automation/foundation

The presentation glue that every domain package shares: the form host and its control
registry, the glyph component, the section wrapper, the "back" link, the hero banner, the
manage kit, the overlay, the terms text, the announcement store and `LayoutProvider`. It knows
no domain of its own. It reads the session, brand and reference data from
`@upmind-automation/headless`.

## Public barrel

`src/index.ts` is the only entry. It is one `export *` line per folder. Each folder's
`index.ts` sets what the folder publishes.

| Folder | Exports | What they are |
| --- | --- | --- |
| `forms` | `Form`, `useFormI18n` | The form host every domain package mounts for a schema-driven form, and the translator it passes to the form engine. |
| `renderers` | `foundationRenderers`, `registerFormRenderers`, `useFormRenderers`, `FormRendererEntry` | This package's own form controls, as one list, and the form-control registry. |
| `slots` | `LayoutProvider`, `isEmptySlot` | `LayoutProvider` fills a page's layout with a main component's named blocks. `isEmptySlot(name, slots)` is true when a slot is absent or renders only comments or empty fragments; a layout uses it to draw no frame for an empty block. |
| `layout` | `Layout`, `InsetLayout`, `Root`, `Content`, `Column`, `Container`, `Ribbon`, `useLayout`, `LAYOUT_VARIANTS`, `LAYOUT_MODE`, `LAYOUT_OVERFLOW`, `LayoutProps`, `UseLayoutProps`, and the types and constants of `Column`, `Container`, `Content` and `Ribbon` | The layout tree: the layout switch, its arrangements and their parts. The page templates draw it. |
| `shell` | `useShell`, `SHELL`, `Shell` | Tracks which shell part (`header`, `footer`, `layout`) a page configured in the current navigation. |
| `variants` | `createVariantConstants`, `VariantValue` | Turns the keys of a style-variant map into named constants. |
| `icon` | `Icon`, `registerIcons`, `setIconVariant`, `iconVariant`, `IconRef`, `IconProps`, `IconImportMap` | The glyph component, and the app's registration of its SVG packs. |
| `hero` | `Hero` | The page banner. |
| `navigation` | `Back`, `useBreadcrumbs`, `BreadcrumbCategory`, `UseBreadcrumbItemsOptions`, `StorefrontRoute` | The "back" link and the breadcrumb builder. |
| `section` | `Section`, `Sections`, `useSection`, `SectionItem` | The section wrapper, and the store that sets the section defaults for a page. |
| `manage` | `Manage`, `ManageForm`, `ManageSkeleton`, `ManageRendererProps`, `MinimalListComposable`, `MinimalMutateComposable` | The collection kit: a row list, a change form and their frames. |
| `overlays` | `OverlayContainer`, `OverlayContainerProps` | The modal and drawer frame. |
| `brand` | `TermsAndConditions` | The terms-and-conditions sentence, with the brand's terms link when the brand has one. |
| `announcements` | `useAnnouncement`, `AnnouncementOptions` | The announcement store. One module-level store serves the whole app. |
| `viewport` | `isMobile` | A shared flag, true below Tailwind's `lg` breakpoint. |

## LayoutProvider

A main component in a domain package wraps its template in `LayoutProvider`. The page's layout
renders first, through the main component's default slot. The main component's named blocks
then fill that layout's slots:

```vue
<template>
  <LayoutProvider>
    <slot :template="template" />

    <template #image>
      <ProductImage :images="images" />
    </template>
  </LayoutProvider>
</template>
```

A slot that the page writes on its layout replaces the block with the same name. The other
blocks stay. The rebuilt layout keeps the page's ref, scoped-style id and directives.
`LayoutProvider` takes no props. A page renders a main component in three lines:

```vue
<UpmOrder v-slot="{ template }">
  <component :is="orderTemplate(template)" />
</UpmOrder>
```

## Form controls

`foundation`'s `Form` passes the registry's controls to the form engine. The registry starts
empty: nothing writes to it until an app, or an imported package, calls
`registerFormRenderers(entries)`.

`foundation` holds its own set of generic, domain-free controls — `ImageRenderer`,
`LookupRenderer` and the `Filter*`/`EnumToggleGroup` family — in `src/renderers/`, and exports
them as one list, `foundationRenderers`. `foundation` does not register that list itself: a
host app imports it and calls `registerFormRenderers(foundationRenderers)` at startup,
alongside the call each domain package it depends on makes for its own list from its own
`src/index.ts`. `foundation`'s controls:

| Control | Matches |
| --- | --- |
| `ImageRenderer` | A control with the `file` format, or with the `image` type option. |
| `LookupRenderer` | A control of UI schema type `Lookup`. It searches through `headless`'s `useLookup`. |
| `FilterButtonGroupRenderer` | A boolean enum control with the `button-group` format. |
| `FilterExclusiveToggleGroupRenderer` | An object control with the `filter-exclusive-toggle-group` format. |
| `FilterToggleGroupRenderer` | A boolean enum control with the `toggle-group` format. |
| `EnumToggleGroupRenderer` | A non-boolean enum control with the `toggle-group` or `button-group` format. |
| `FilterSearchRenderer` | A string control with the `search` format. |
| `FilterMultiSelectRenderer` | An array control of unique items with the `multi-select` format. |
| `FilterRangeRenderer` | An object control with the `range` format. |
| `FilterBarRenderer` | A layout of UI schema type `FilterBar`. |

## Styles

The app's CSS imports the package's styles entry:

```css
@import "@upmind-automation/foundation/styles";
```

The entry (`src/styles.css`) imports `src/assets/styles/index.css`: the shared app-width
utilities and the base prose styles. It also adds this package's files to the app's Tailwind
source scan.

## Imports

The package may import `@upmind/ui`, `@upmind-automation/headless`, `@upmind-automation/types`,
`@upmind-automation/i18n` and `@upmind-automation/icons`, through the shared
`tsconfig/vue-package.json` `paths`.

It must not import:

- Any domain package, or `@upmind-automation/client-vue`. Every domain package imports
  `foundation`, so an import back makes a cycle. By name, the repo-root `vue-tsc -b` gate
  reports it as `TS2307`. By relative path, the `@workspace/no-cross-package-path-imports`
  lint rule reports it.
- A file inside another package (`@upmind-automation/<name>/…`). The `import/no-internal-modules`
  lint rule reports it.
