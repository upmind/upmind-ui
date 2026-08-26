// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/ui-prop-vocabulary.spec
 * @description `AC-8` — no labs call site passes an UNDECLARED prop to an
 * `@upmind/ui` component.
 *
 * The empty-render class, in the story's own words: the new components declare
 * no `label`, `icon`, `icon-append`, `color`, `ring` or `depth`, and Vue emits
 * an undeclared prop as a bare DOM attribute — so the value reaches the markup
 * and renders NOTHING, while every count-based and shape-based assertion still
 * passes. That is how a blank sidebar and a labelless button shipped green.
 * The story's audit found 37 of them across 11 files by hand; a sweep by hand
 * stops the ones it found and nothing after.
 *
 * The oracle is each component's OWN published `types.ts` — the declared prop
 * set, with `extends` resolved through the library's other `*Props` interfaces
 * and reka's `PrimitiveProps`. Nothing here carries a list of what any
 * component accepts.
 *
 * Scope is the RETIRED vocabulary below and nothing wider. A component that
 * declares `icon` (several do) is clean when it is passed one; the offence is
 * always "this component does not declare this name", never the name alone.
 *
 * Falsifiability rides in the suite: the discrimination case feeds the finder
 * one offending source and one clean one and requires opposite answers.
 *
 * @anchor render-integrity.feature
 * @anchor AC-8
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  camelCase,
  flatMap,
  forEach,
  includes,
  intersection,
  isEmpty,
  keys,
  map,
  reject,
  size,
  some,
  sortBy,
  split,
  trim,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const PLAYGROUND_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

const UI_COMPONENTS_ROOT = fileURLToPath(
  new URL(
    "../../../../../design-system/packages/ui/src/components/",
    import.meta.url
  )
);

const SCANNED_ROOTS = ["app", "modules"];

const SKIPPED_DIRS = new Set(["__tests__", "node_modules", ".nuxt", "dist"]);

/**
 * The names the migration retired, from the story audit's own mapping table:
 * `label` became the default slot, `icon`/`icon-append` an `Icon` slot child,
 * `color` the single `variant` axis, `ring` the component's own focus coat, and
 * `depth` never existed on `Button`.
 */
const RETIRED = ["label", "icon", "iconAppend", "color", "ring", "depth"];

/** reka's own base props, which every `extends PrimitiveProps` surface carries. */
const PRIMITIVE_PROPS = ["as", "asChild"];

type Offence = { at: string; component: string; prop: string };

// --- The library's declared surface -------------------------------------------

function typeFiles(dir: string): string[] {
  return flatMap(readdirSync(dir), entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return typeFiles(full);
    return entry === "types.ts" ? [full] : [];
  });
}

/** Every `XProps` interface the library publishes, with its own body + parents. */
function declaredSurface(): Record<
  string,
  { own: string[]; parents: string[] }
> {
  const surface: Record<string, { own: string[]; parents: string[] }> = {};

  forEach(typeFiles(UI_COMPONENTS_ROOT), file => {
    const text = readFileSync(file, "utf-8");
    forEach(
      [
        ...text.matchAll(
          /export\s+interface\s+(\w+Props)\s*(?:extends\s+([^{]+))?\{([\s\S]*?)\n\}/g
        )
      ],
      match => {
        surface[String(match[1])] = {
          own: map(
            [
              ...String(match[3]).matchAll(/^\s*(?:readonly\s+)?(\w+)\??\s*:/gm)
            ],
            property => String(property[1])
          ),
          parents: map(
            reject(split(String(match[2] ?? ""), ","), isEmpty),
            parent => String(trim(parent).match(/(\w+)/)?.[1] ?? "")
          )
        };
      }
    );
  });

  return surface;
}

const SURFACE = declaredSurface();

/** A component's whole declared prop set, `extends` chain resolved. */
function declaredProps(component: string, seen = new Set<string>()): string[] {
  const entry = SURFACE[`${component}Props`];
  if (!entry || seen.has(component)) return [];
  seen.add(component);

  return uniq([
    ...entry.own,
    ...PRIMITIVE_PROPS,
    ...flatMap(entry.parents, parent =>
      declaredProps(parent.replace(/Props$/, ""), seen)
    )
  ]);
}

// --- The playground's call sites ----------------------------------------------

const uiImports = (source: string): string[] =>
  flatMap(
    [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']@upmind\/ui["']/g)],
    match =>
      map(reject(split(String(match[1]), ","), isEmpty), name =>
        trim(String(name).replace(/^type\s+/, ""))
      )
  );

const templateOf = (source: string): string => {
  const opens = source.indexOf("<template>");
  const closes = source.lastIndexOf("</template>");
  return opens === -1 || closes === -1 ? "" : source.slice(opens, closes);
};

/** Every retired name a source hands a ui component that never declared it. */
function offencesIn(source: string, at: string): Offence[] {
  const template = templateOf(source);

  return flatMap(uiImports(source), component => {
    const declared = declaredProps(component);
    if (isEmpty(declared)) return [];

    const passed = flatMap(
      [
        ...template.matchAll(new RegExp(`<${component}(?![\\w-])([^>]*)>`, "g"))
      ],
      usage =>
        map(
          [...String(usage[1]).matchAll(/(?:^|\s)(?::|v-bind:)?([\w-]+)\s*=/g)],
          attribute => camelCase(String(attribute[1]))
        )
    );

    return map(
      reject(intersection(uniq(passed), RETIRED), prop =>
        includes(declared, prop)
      ),
      prop => ({ at, component, prop })
    );
  });
}

function sourceFiles(): string[] {
  const walk = (dir: string): string[] =>
    flatMap(readdirSync(dir), entry => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        return SKIPPED_DIRS.has(entry) ? [] : walk(full);
      }
      return entry.endsWith(".vue") ? [full] : [];
    });

  return flatMap(SCANNED_ROOTS, root => walk(join(PLAYGROUND_ROOT, root)));
}

const OFFENCES = sortBy(
  flatMap(sourceFiles(), file =>
    offencesIn(readFileSync(file, "utf-8"), relative(PLAYGROUND_ROOT, file))
  ),
  ["at", "component", "prop"]
);

// -----------------------------------------------------------------------------

describe("AC-8 the gate reads the library's own declared surface", () => {
  it("resolves a component's props from its published types.ts", () => {
    // `variant` is `Badge`'s own; `as` arrives through `extends PrimitiveProps`.
    expect(declaredProps("Badge")).toEqual(expect.arrayContaining(["variant"]));
    expect(declaredProps("Badge")).toEqual(expect.arrayContaining(["as"]));
    expect(declaredProps("Badge")).not.toEqual(
      expect.arrayContaining(["label"])
    );
  });

  it("reads more than a handful of the library's components", () => {
    expect(size(keys(SURFACE))).toBeGreaterThan(20);
  });

  it("tells an offending call site from a clean one", () => {
    const offending = `import { Badge } from "@upmind/ui";
<template><Badge :label="count" icon="eye" /></template>`;
    const clean = `import { Badge } from "@upmind/ui";
<template><Badge variant="warning" as="span">{{ count }}</Badge></template>`;

    expect(map(offencesIn(offending, "probe.vue"), "prop")).toEqual([
      "label",
      "icon"
    ]);
    expect(offencesIn(clean, "probe.vue")).toEqual([]);
  });

  it("claims nothing about a component the library does not publish", () => {
    const local = `import { NotAUiComponent } from "@upmind/ui";
<template><NotAUiComponent label="x" /></template>`;

    expect(offencesIn(local, "probe.vue")).toEqual([]);
  });

  it("reads only the template, never the script block", () => {
    const scriptOnly = `import { Badge } from "@upmind/ui";
<script setup lang="ts">const fixture = "<Badge label=\\"x\\" />";</script>
<template><Badge variant="promo" /></template>`;

    expect(offencesIn(scriptOnly, "probe.vue")).toEqual([]);
  });
});

describe("AC-8 no undeclared prop reaches an @upmind/ui component", () => {
  it("names every call site still speaking the retired API", () => {
    expect(
      map(OFFENCES, ({ at, component, prop }) => `${at} ${component}.${prop}`)
    ).toEqual([]);
  });

  it("swept both roots, and found ui call sites to sweep", () => {
    const swept = uniq(
      map(sourceFiles(), file => split(relative(PLAYGROUND_ROOT, file), "/")[0])
    );

    expect(sortBy(swept)).toEqual(["app", "modules"]);
    expect(
      some(sourceFiles(), file =>
        some(uiImports(readFileSync(file, "utf-8")), Boolean)
      )
    ).toBe(true);
  });
});
