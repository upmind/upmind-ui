// -----------------------------------------------------------------------------
/**
 * @fileoverview `auth` resolves to no commerce package — ADR 023 §7
 *
 * ## Job To Be Done
 * A login screen that fetches a basket is what started this phase: the session
 * views owned the summary aside, so a package that must run with no basket at
 * all (the standalone app, portal-nuxt) could not. The aside and the guest offer
 * now arrive through the `auth:*` shell sockets, and the boundary that keeps them
 * there is a RESOLUTION fact: follow every import from this package's own entry
 * points and nothing in the closure may reach a package that sits above it.
 *
 * ## What Breaks If These Fail
 * One import of a commerce package puts the whole basket module graph back into
 * every host that mounts a login screen — including the ones with no basket
 * store, which then fail a fetch or hang on the screen that mints credentials.
 * A build stays green throughout: the import compiles.
 *
 * ## Why not a source grep
 * This control used to grep the package's source for `useBasket`, `useOrder`,
 * `provision_fields` and friends. It was wrong in both directions, and both
 * failures were observed live. It PASSED while the three views fetched an order
 * and the basket catalogue, because that coupling arrived through a shared
 * composable and no banned literal ever appeared here. It then FAILED on correct
 * code, because an explanatory comment named one of the terms in prose. A term
 * list measures spelling: it cannot see one hop, and it cannot tell an import
 * from a sentence.
 *
 * The closure below sees every hop, and strips comments before it reads a
 * specifier, so prose can neither hide a reach nor invent one.
 *
 * ## The Nuxt half rides here too
 * This package used to keep Nuxt core in a thin `/nuxt` adapter, walked as a
 * second closure. The adapter is gone, so the fact is now the stronger one: NO
 * file here speaks Nuxt. That is asserted twice over — once across the closure
 * a host mounts through, and once across every file on disk, because a file the
 * closure never reaches can still be added and later imported.
 *
 * ## Where the request fact is held instead
 * The harm itself — an auth surface issuing an order or basket request — is a
 * network fact and is asserted where the platform actually boots, against the
 * standalone app's own production build: `apps/auth/tests/basket-free.spec.ts`.
 * It is not assertable here. The session bootstrap is app-level (`useUpmind`),
 * so under vitest the mounted surfaces never mint a session, the basket is never
 * consulted, and a request-level assertion in this lane passes over the live
 * harm exactly as the term list did — measured, not assumed.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());
const SOURCE_EXTENSIONS = [".ts", ".vue", ".mts", ".js", ".mjs"];

/**
 * The one entry point a host mounts components through. Framework-core-
 * agnostic by ADR 023 §9: what it reaches has to run under plain Vite, because
 * `apps/cart` mounts exactly these organisms and knows nothing of Nuxt.
 */
const ORGANISM_ENTRIES = ["src/index.ts"];

/** Every way in: the sole `package.json#exports` entry. */
const ENTRY_POINTS = [...ORGANISM_ENTRIES];

/**
 * Commerce packages sit ABOVE `auth`, so nothing reachable from it may resolve
 * to one. The offer and the summary aside arrive through a shell socket.
 */
const ABOVE_AUTH = [
  "@upmind-automation/client-vue",
  "@upmind-automation/basket",
  "@upmind-automation/client",
  "@upmind-automation/checkout"
];

/**
 * Everything outside the package the closure reaches, exactly. An exact set is
 * deliberate: a scanner that silently drops a specifier would make every
 * forbidden-reach assertion vacuous, so the set has to be pinned in BOTH
 * directions. Nothing Nuxt appears in it, and nothing may: this package has no
 * adapter to hold such an import any more.
 */
const REACHED = [
  "@upmind-automation/foundation",
  "@upmind-automation/headless",
  "@upmind/ui",
  "class-variance-authority",
  "lodash-es",
  "vue",
  "vue-i18n",
  "vue-router"
];

/**
 * Modules no entry point reaches. `Expired.vue` is orphaned by the extraction —
 * only its prop type is published — so the closure cannot cover it. Declared so
 * this stays a subset check: deleting the file is fine, orphaning another is not.
 */
const UNREACHABLE = ["src/components/Expired.vue"];

/** Nuxt's own modules, virtual and real. None may reach an organism. */
const NUXT_CORE = ["#app", "#imports", "nuxt", "nuxt/kit", "nuxt/app"];

function relativeToPackage(path: string) {
  return path.slice(PACKAGE_ROOT.length + 1);
}

/** Comments carry prose, and prose names things it does not import. */
function withoutComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

/**
 * One pattern per import form, run separately. A single alternation loses a
 * side-effect `import "x";` to the from-form's cross-line gap: the gap starts at
 * that `import`, runs past it and matches the NEXT statement's `from`, so the
 * specifier disappears. `[^;]` keeps each gap inside its own statement.
 */
const IMPORT_FORMS = [
  /\b(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g
];

function specifiersIn(source: string) {
  const found: string[] = [];
  const code = withoutComments(source);
  for (const form of IMPORT_FORMS) {
    for (const match of code.matchAll(form)) {
      if (match[1]) found.push(match[1]);
    }
  }
  return found;
}

function resolveRelative(from: string, specifier: string) {
  const base = join(dirname(from), specifier);
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map(extension => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map(extension => join(base, `index${extension}`))
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    if (statSync(candidate).isDirectory()) continue;
    return candidate;
  }
  return undefined;
}

/**
 * Follows every relative import from the package's own entry points and reports
 * the bare specifiers the closure reaches — a transitive reach three hops from
 * the barrel is caught the same as one in the barrel itself.
 */
function resolvedGraph(entries: string[] = ENTRY_POINTS) {
  const bare = new Set<string>();
  const files = new Set<string>();
  const unresolved: string[] = [];
  const queue = entries
    .map(entry => join(PACKAGE_ROOT, entry))
    .filter(entry => existsSync(entry));

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || files.has(file)) continue;
    files.add(file);

    for (const specifier of specifiersIn(readFileSync(file, "utf8"))) {
      if (!specifier.startsWith(".")) {
        bare.add(specifier);
        continue;
      }
      const target = resolveRelative(file, specifier);
      if (!target) {
        unresolved.push(`${relativeToPackage(file)} -> ${specifier}`);
        continue;
      }
      queue.push(target);
    }
  }

  return { bare: [...bare].sort(), files: [...files], unresolved };
}

/** Every SFC and module under `src/`, so the closure can be shown to cover it. */
function sourceFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "__tests__") continue;
      found.push(...sourceFiles(path));
      continue;
    }
    if ([".ts", ".vue"].includes(extname(entry))) found.push(path);
  }
  return found;
}

const graph = resolvedGraph();
const organisms = resolvedGraph(ORGANISM_ENTRIES);
const modules = sourceFiles(join(PACKAGE_ROOT, "src"));

/**
 * Every file on disk, not just the reached ones. A re-added adapter sits
 * outside the closure until something imports it, so the closure alone cannot
 * see it arrive.
 */
const allFiles = [
  ...modules,
  ...readdirSync(PACKAGE_ROOT)
    .filter(entry => extname(entry) === ".ts")
    .map(entry => join(PACKAGE_ROOT, entry))
];

/** Which of `names` the closure reaches, by exact name or by subpath. */
function reaches(bare: string[], names: string[]) {
  return names.filter(name =>
    bare.some(
      specifier => specifier === name || specifier.startsWith(`${name}/`)
    )
  );
}

// -----------------------------------------------------------------------------

describe("the Nuxt half, which this package no longer has", () => {
  /**
   * ADR 023 §9 keeps the organisms framework-core-agnostic. There is no adapter
   * left to hold a legitimate Nuxt import, so the closure a host mounts through
   * must reach none at all.
   */
  it("keeps Nuxt core out of every organism", () => {
    expect(
      reaches(organisms.bare, NUXT_CORE),
      "an organism speaks Nuxt, so the Vite cart cannot mount it"
    ).toEqual([]);
  });

  /** Measured on disk, so a re-added adapter cannot hide outside the closure. */
  it("speaks Nuxt in no file it ships", () => {
    const speaking = allFiles
      .filter(
        file =>
          reaches(specifiersIn(readFileSync(file, "utf8")), NUXT_CORE).length >
          0
      )
      .map(relativeToPackage)
      .sort();

    expect(speaking).toEqual([]);
  });
});

describe("the auth package's resolved import boundary", () => {
  it("resolves a real graph, and every edge in it", () => {
    expect(graph.files.length).toBeGreaterThan(1);
    expect(graph.unresolved).toEqual([]);
  });

  it("reaches every module under src bar the ones declared unreachable", () => {
    const missed = modules
      .filter(file => !graph.files.includes(file))
      .map(relativeToPackage)
      .filter(file => !UNREACHABLE.includes(file));

    expect(missed).toEqual([]);
  });

  it("resolves to no package that sits above auth", () => {
    const reached = ABOVE_AUTH.filter(name =>
      graph.bare.some(
        specifier => specifier === name || specifier.startsWith(`${name}/`)
      )
    );

    expect(reached).toEqual([]);
  });

  it("reaches exactly the packages a §7 leaf may reach, and no others", () => {
    expect(graph.bare).toEqual(REACHED);
  });

  it("takes the summary aside from its host rather than building one", () => {
    const built = modules
      .filter(file => {
        const source = readFileSync(file, "utf8");
        return (
          source.includes("cart.basket_section") ||
          source.includes("shopping-bag-02")
        );
      })
      .map(relativeToPackage);

    expect(built).toEqual([]);
  });
});
