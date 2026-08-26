// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/icon-resolution.spec
 * @description `AC-10` — every icon name the playground declares RESOLVES.
 *
 * The story's own audit records the failure this closes: the nav configs and
 * the scenario registry declared Untitled-UI names (`code-browser`,
 * `beaker-01`, `layers-three-01`) against a lucide-only map, so every row drew
 * the fallback glyph — and the suite stayed green, because a fallback glyph is
 * still an `<svg>` and every count-based assertion still passed. Same
 * empty-render class as the `:label`-prop badge, one component along.
 *
 * The oracle is the published `Icon` component itself, mounted per name, and
 * the glyph it lands on is read off the rendered `lucide-*` class. Nothing here
 * re-derives the name-map: a gate carrying its own copy would only ever pass
 * against that copy. The fallback is discovered the same way — by asking the
 * component for a name no map could hold — so the gate needs no private
 * knowledge of WHICH glyph the fallback is.
 *
 * The playground registers no SVG asset pack (nothing under `app/**` calls
 * `registerIcons`), so the lucide map is the whole of what a name can resolve
 * through — in this lane and in the running app alike.
 *
 * Falsifiability rides in the suite: the discrimination case below asks the
 * component for one mapped name and one Untitled-UI name and requires opposite
 * answers, so a gate that had gone blind reds on itself. The colocated
 * `must-fail.patch` — planting one unmapped name in a source file — is OWED,
 * and is authored once the sweep below is green; it cannot prove a red test
 * redder.
 *
 * @anchor render-integrity.feature
 * @anchor AC-10
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { Icon } from "@upmind-automation/client-vue";
import {
  filter,
  flatMap,
  includes,
  map,
  reject,
  some,
  sortBy,
  uniqBy
} from "lodash-es";

// -----------------------------------------------------------------------------

// `import.meta.url` is an http URL under jsdom, so the root comes from the
// lane's own `root` (`vitest.config.ts:96`), which is this package.
const PLAYGROUND_ROOT = process.cwd();

const SCANNED_ROOTS = ["app", "modules"];

const SKIPPED_DIRS = new Set(["__tests__", "node_modules", ".nuxt", "dist"]);

const SOURCE_EXTENSIONS = /\.(?:ts|vue)$/;

/**
 * A name is only collected where the source SPELLS it — a template attribute,
 * a bound string literal, or a config property. A bound EXPRESSION names no
 * icon this gate can resolve, and `SidebarNavItem.icon` takes a component
 * rather than a name, so neither is a declaration and both fall through.
 */
const DECLARED_NAME =
  /(?:^|[\s{,(])(?::?icon|:?fallback)\s*[=:]\s*(?:"([a-z][a-z0-9-]*)"|'([a-z][a-z0-9-]*)'|"'([a-z][a-z0-9-]*)'"|'"([a-z][a-z0-9-]*)"')/g;

type Declaration = { at: string; name: string };

function sourceFiles(): string[] {
  const walk = (dir: string): string[] =>
    flatMap(readdirSync(dir), entry => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        return SKIPPED_DIRS.has(entry) ? [] : walk(full);
      }
      return SOURCE_EXTENSIONS.test(entry) ? [full] : [];
    });

  return flatMap(SCANNED_ROOTS, root => walk(join(PLAYGROUND_ROOT, root)));
}

function declarations(): Declaration[] {
  return flatMap(sourceFiles(), file => {
    const text = readFileSync(file, "utf-8");
    return map([...text.matchAll(DECLARED_NAME)], match => ({
      at: `${relative(PLAYGROUND_ROOT, file)}:${
        text.slice(0, match.index ?? 0).split("\n").length
      }`,
      name: String(match[1] ?? match[2] ?? match[3] ?? match[4])
    }));
  });
}

const DECLARED = uniqBy(sortBy(declarations(), "name"), "name");

/** The lucide glyph the component actually landed on, e.g. `lucide-x-icon`. */
function glyphOf(name: string): string {
  const wrapper = mount(Icon, { props: { icon: name } });
  const landed = wrapper.html().match(/lucide-[a-z0-9-]+-icon/)?.[0] ?? "";

  wrapper.unmount();

  return landed;
}

/**
 * What the component draws for a name NO map can hold — discovered, never
 * declared, so the gate carries no private copy of the fallback's identity.
 */
const FALLBACK_GLYPH = glyphOf("upmind-labs-no-such-icon");

const resolves = (name: string): boolean => {
  const glyph = glyphOf(name);
  return !!glyph && glyph !== FALLBACK_GLYPH;
};

// -----------------------------------------------------------------------------

describe("AC-10 the gate reads the whole playground", () => {
  it("collects icon names from both scanned roots", () => {
    expect(DECLARED.length).toBeGreaterThan(0);
    expect(some(DECLARED, ({ at }) => at.startsWith("app/"))).toBe(true);
    expect(some(DECLARED, ({ at }) => at.startsWith("modules/"))).toBe(true);
  });

  it("collects no name out of a test file", () => {
    expect(filter(DECLARED, ({ at }) => includes(at, "__tests__"))).toEqual([]);
  });

  it("tells a resolved name from an unresolved one", () => {
    // Two literals, not a copy of the map: `check` is lucide's own spelling and
    // `beaker-01` is the Untitled-UI name the audit found. A gate returning the
    // same answer for both would be blind to the whole class.
    expect(resolves("check")).toBe(true);
    expect(resolves("beaker-01")).toBe(false);
  });
});

describe("AC-10 every declared icon resolves — no fallback glyph", () => {
  it("names each declaration the resolver cannot serve", () => {
    const unresolved = reject(DECLARED, ({ name }) => resolves(name));

    expect(map(unresolved, ({ at, name }) => `${at} ${name}`)).toEqual([]);
  });
});
