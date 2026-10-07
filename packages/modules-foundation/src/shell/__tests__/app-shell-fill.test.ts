// -----------------------------------------------------------------------------
/**
 * @fileoverview Every page template record an app passes is whole and its own.
 *
 * ## Job To Be Done
 * Each app module's `*_TEMPLATES` record draws every template its package, or
 * its own enum, can pick (any of them, when the package types its record
 * `Partial`), each from one of the module's own page templates; an app-keyed
 * record's pick falls back to a template it draws; and every host page passes,
 * picks from, or draws its slot from, the record or the pick of its own app.
 *
 * ## What Breaks If These Fail
 * A brand's chosen arrangement throws, a page draws another page's template, a
 * brand with no template gets no page, or a page ships a record that another
 * app owns.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  concat,
  countBy,
  difference,
  endsWith,
  filter,
  find,
  flatMap,
  includes,
  keys,
  map,
  pickBy,
  replace,
  some,
  sortBy,
  startsWith,
  sumBy,
  toArray
} from "lodash-es";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(process.cwd(), "..", "..");

const HOSTS = [
  { name: "cart", tree: "apps/cart/src", pages: "apps/cart/src/pages" },
  {
    name: "cart-nuxt",
    tree: "apps/cart-nuxt/app",
    pages: "apps/cart-nuxt/app/pages"
  }
];

const TEMPLATE_TREES = concat(
  map(HOSTS, host => ({ name: host.name, tree: host.tree })),
  [{ name: "labs-nuxt", tree: "playgrounds/labs-nuxt/app" }]
);

// Domain's record is keyed by its one template, so its pick is graded in the app shell's own spec.
const RECORDED = { modules: 10, templates: 43, picks: 11 };

const PACKAGE_SCOPE = "@upmind-automation/";

const SOURCE_EXTENSIONS = [".ts", ".vue", ".mts", ".mjs", ".js"];

const SKIPPED_DIRECTORIES = ["node_modules", ".nuxt", "dist", "__tests__"];

function read(path: string) {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8");
}

function withoutComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return flatMap(readdirSync(directory, { withFileTypes: true }), entry => {
    if (includes(SKIPPED_DIRECTORIES, entry.name)) return [];

    const path = join(directory, entry.name);

    if (entry.isDirectory()) return sourceFiles(path);
    if (some(SOURCE_EXTENSIONS, extension => endsWith(entry.name, extension))) {
      return [path];
    }
    return [];
  });
}

function importsOf(source: string) {
  const code = withoutComments(source);
  const bindings = new Map<string, string>();

  for (const match of code.matchAll(
    /import\s+([\w$]+)\s*(?:,\s*\{([^}]*)\})?\s*from\s*["']([^"']+)["']/g
  )) {
    bindings.set(match[1], match[3]);
    for (const member of (match[2] ?? "").split(",")) {
      const name = member.trim();
      if (name) bindings.set(name, match[3]);
    }
  }

  for (const match of code.matchAll(
    /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g
  )) {
    for (const member of match[1].split(",")) {
      const name = member.trim().replace(/^type\s+/, "");
      if (name) bindings.set(name, match[2]);
    }
  }

  return bindings;
}

function directoryOf(published: string) {
  const manifests = filter(
    readdirSync(join(REPO_ROOT, "packages"), { withFileTypes: true }),
    entry =>
      entry.isDirectory() &&
      existsSync(join(REPO_ROOT, "packages", entry.name, "package.json"))
  );
  const owner = find(manifests, entry => {
    const { name }: { name: string } = JSON.parse(
      readFileSync(
        join(REPO_ROOT, "packages", entry.name, "package.json"),
        "utf8"
      )
    );
    return name === `${PACKAGE_SCOPE}${published}`;
  });

  return owner?.name ?? published;
}

function packageCode(published: string) {
  return map(
    filter(
      sourceFiles(join(REPO_ROOT, "packages", directoryOf(published), "src")),
      file => endsWith(file, ".ts")
    ),
    file => withoutComments(readFileSync(file, "utf8"))
  );
}

function firstMatch(sources: string[], pattern: RegExp) {
  for (const code of sources) {
    const match = pattern.exec(code);
    if (match) return match;
  }
  return null;
}

function enumMembers(sources: string[], name: string) {
  const body = firstMatch(
    sources,
    new RegExp(`export\\s+enum\\s+${name}\\s*\\{([^}]*)\\}`)
  );

  return map([...(body?.[1] ?? "").matchAll(/(\w+)\s*=/g)], match => match[1]);
}

/** The keys a package's `*Templates` record type demands: the whole enum, or the union it aliases. */
function templateKeys(published: string, type: string, enumName: string) {
  const sources = packageCode(published);
  const record = firstMatch(
    sources,
    new RegExp(
      `export type ${type}\\s*=\\s*(?:Partial<\\s*)?Record<\\s*(\\w+)\\s*,\\s*Component\\s*>`
    )
  );
  const key = record?.[1] ?? "";

  if (key === enumName) return enumMembers(sources, enumName);

  const union = firstMatch(
    sources,
    new RegExp(`export type ${key}\\s*=([^;]*);`)
  );

  return map(
    [...(union?.[1] ?? "").matchAll(new RegExp(`${enumName}\\.(\\w+)`, "g"))],
    match => match[1]
  );
}

/** The members of an enum a record is keyed by: read from the app module's own file, or from the package that publishes it. */
function keyMembers(directory: string, specifier: string, enumName: string) {
  if (startsWith(specifier, ".")) {
    return enumMembers(
      [withoutComments(read(`${resolve(directory, specifier)}.ts`))],
      enumName
    );
  }
  return enumMembers(
    packageCode(replace(specifier, PACKAGE_SCOPE, "")),
    enumName
  );
}

/** Whether a package's `*Templates` record type lets the app draw only some of its keys. */
function isPartialRecord(published: string, type: string) {
  return (
    firstMatch(
      packageCode(published),
      new RegExp(`export type ${type}\\s*=\\s*Partial<`)
    ) !== null
  );
}

function recordModule(tree: string, name: string) {
  const directory = join(REPO_ROOT, tree, "shell/modules", name);
  const code = withoutComments(read(join(directory, "shell.ts")));
  const record =
    /export const (\w+_TEMPLATES)\s*:\s*(\w+|Record<\s*\w+\s*,\s*Component\s*>)\s*=\s*\{([^}]*)\}/.exec(
      code
    );
  const keyedBy = /^Record<\s*(\w+)/.exec(record?.[2] ?? "")?.[1];
  const entries = map(
    [...(record?.[3] ?? "").matchAll(/\[\s*(\w+)\.(\w+)\s*\]\s*:\s*([\w$]+)/g)],
    match => ({ enum: match[1], key: match[2], component: match[3] })
  );
  const bindings = importsOf(code);
  const enumName = entries[0]?.enum ?? "";
  const enumSource = bindings.get(enumName) ?? "";
  const type = keyedBy ?? record?.[2] ?? "";
  const declared =
    /export const (\w+)\s*=\s*resolveTemplate\(\s*(\w+_TEMPLATES)\s*,\s*(\w+)\.(\w+)\s*,?\s*\)/.exec(
      code
    );
  const ownRecord = declared !== null && declared[2] === record?.[1];
  const templates = join(directory, "templates");

  let files: string[] = [];
  if (existsSync(templates)) {
    files = filter(readdirSync(templates), file =>
      endsWith(file, ".template.vue")
    );
  }

  return {
    name,
    directory,
    shell: join(tree, "shell/modules", name, "shell"),
    record: record?.[1] ?? "",
    type,
    typeSource: bindings.get(type) ?? "",
    enumSource,
    entries,
    bindings,
    keyed: keyedBy !== undefined,
    pick: ownRecord ? declared[1] : "",
    fallback: ownRecord ? { enum: declared[3], key: declared[4] } : null,
    expected: keyedBy
      ? keyMembers(directory, enumSource, keyedBy)
      : templateKeys(replace(enumSource, PACKAGE_SCOPE, ""), type, enumName),
    partial: keyedBy
      ? false
      : isPartialRecord(replace(enumSource, PACKAGE_SCOPE, ""), type),
    files
  };
}

function modulesOf(tree: string) {
  const root = join(REPO_ROOT, tree, "shell/modules");

  if (!existsSync(root)) return [];

  const named = filter(
    readdirSync(root, { withFileTypes: true }),
    entry =>
      entry.isDirectory() && existsSync(join(root, entry.name, "shell.ts"))
  );

  return filter(
    map(named, entry => recordModule(tree, entry.name)),
    module => module.record !== ""
  );
}

/** Each module's exported pick: the function a page calls with the raw template to draw a layout. */
function picksOf(tree: string) {
  const root = join(REPO_ROOT, tree, "shell/modules");
  if (!existsSync(root)) return [];
  return flatMap(readdirSync(root, { withFileTypes: true }), entry => {
    const code = withoutComments(read(join(root, entry.name, "shell.ts")));
    return map(
      toArray(
        code.matchAll(/export const (\w+Template)\s*=\s*resolveTemplate\(/g)
      ),
      match => ({
        pick: match[1],
        shell: join(tree, "shell/modules", entry.name, "shell")
      })
    );
  });
}

function specifierPath(file: string, specifier: string) {
  if (!startsWith(specifier, ".")) return specifier;
  return relative(REPO_ROOT, resolve(dirname(file), specifier));
}

/** Every record a host's pages pass, or pick from with the module's `xTemplate(template)`. */
function recordsPassed(pages: string) {
  const files = filter(sourceFiles(join(REPO_ROOT, pages)), file =>
    endsWith(file, ".vue")
  );

  return flatMap(files, file => {
    const code = withoutComments(readFileSync(file, "utf8"));
    const bindings = importsOf(code);

    return map(
      [
        ...code.matchAll(
          /:(?:(?:[\w-]+-)?templates="(\w+)"|is="(\w+_TEMPLATES)\[|is="(\w+Template)\(\s*template\s*\)")/g
        )
      ],
      match => {
        const record = match[1] ?? match[2] ?? match[3];
        return {
          page: relative(REPO_ROOT, file),
          record,
          from: specifierPath(file, bindings.get(record) ?? "")
        };
      }
    );
  });
}

const hosts = map(HOSTS, host => ({
  name: host.name,
  tree: host.tree,
  modules: modulesOf(host.tree),
  picks: picksOf(host.tree),
  passed: recordsPassed(host.pages)
}));

const pairs = flatMap(hosts, host =>
  map(host.modules, module => ({
    host: host.name,
    module: module.name,
    detail: module
  }))
);

function drawnSpecifiers(detail: (typeof pairs)[number]["detail"]) {
  return filter(
    map(detail.entries, entry => detail.bindings.get(entry.component) ?? ""),
    specifier => endsWith(specifier, ".template.vue")
  );
}

// -----------------------------------------------------------------------------

describe("the record surface this spec grades", () => {
  it.each(hosts)("finds $name's template records", host => {
    expect(
      host.modules.length,
      `${host.name} owns ${host.modules.length} shell modules with a template ` +
        `record and ${RECORDED.modules} were recorded, so a record went missing`
    ).toBe(RECORDED.modules);
  });

  it.each(hosts)("finds every entry in $name's records", host => {
    const drawn = sumBy(host.modules, module => module.entries.length);

    expect(
      drawn,
      `${host.name} is graded on ${drawn} record entries and ` +
        `${RECORDED.templates} were recorded`
    ).toBe(RECORDED.templates);
  });

  it.each(hosts)("finds $name's picks", host => {
    expect(
      map(host.picks, "pick"),
      `${host.name} exports ${host.picks.length} picks and ` +
        `${RECORDED.picks} were recorded, so a pick went missing`
    ).toHaveLength(RECORDED.picks);
  });

  it.each(pairs)(
    "reads $host's $module against the templates its package can pick",
    pair => {
      expect(
        pair.detail.expected.length,
        `${pair.detail.enumSource || "no package"} publishes no ` +
          `${pair.detail.type || "templates type"} this spec can read, so ` +
          `${pair.module}'s record is graded against nothing`
      ).toBeGreaterThan(0);
    }
  );
});

describe("every template a package can pick, drawn by the app that owns the page", () => {
  it.each(filter(pairs, pair => !pair.detail.partial))(
    "$host's $module draws every template it can be asked for",
    pair => {
      const missing = difference(
        pair.detail.expected,
        map(pair.detail.entries, "key")
      );

      expect(
        missing,
        `${pair.host}'s ${pair.detail.record} has no page for ` +
          `${missing.join(", ")}, so a brand that picks one gets an error`
      ).toEqual([]);
    }
  );

  it.each(pairs)("$host's $module draws no template twice", pair => {
    const doubled = keys(
      pickBy(countBy(pair.detail.entries, "key"), count => count > 1)
    );

    expect(doubled).toEqual([]);
  });

  it.each(pairs)(
    "$host's $module draws no template its package never offered",
    pair => {
      const invented = difference(
        map(pair.detail.entries, "key"),
        pair.detail.expected
      );

      expect(
        invented,
        `${pair.host}'s ${pair.detail.record} draws ${invented.join(", ")}, ` +
          `which ${pair.detail.type} does not name, so no organism picks it`
      ).toEqual([]);
    }
  );

  it.each(pairs)(
    "$host's $module types its record with its package's type",
    pair => {
      expect(
        pair.detail.typeSource,
        `${pair.host}'s ${pair.detail.record} is typed ${pair.detail.type || "loosely"}, ` +
          `not with the templates type of the package it serves`
      ).toBe(pair.detail.enumSource);
    }
  );
});

describe("every app-keyed record, picked with a fallback it draws", () => {
  const keyed = filter(pairs, pair => pair.detail.keyed);

  it("finds the app-keyed records", () => {
    expect(keyed.length).toBeGreaterThan(0);
  });

  it.each(keyed)("$host's $module hands its pages a pick", pair => {
    expect(
      pair.detail.pick,
      `${pair.host}'s ${pair.detail.record} declares no \`resolveTemplate\` ` +
        `pick over it, so a page reads the record unchecked`
    ).not.toBe("");
  });

  it.each(keyed)("$host's $module falls back to a template it draws", pair => {
    expect(
      pair.detail.fallback,
      `${pair.host}'s ${pair.module} pick names no fallback`
    ).not.toBeNull();
    expect(pair.detail.fallback?.enum).toBe(pair.detail.type);
    expect(map(pair.detail.entries, "key")).toContain(
      pair.detail.fallback?.key
    );
  });
});

describe("each entry pinned to the file it draws", () => {
  it.each(pairs)(
    "$host's $module pins every entry to one of its own templates",
    pair => {
      const unpinned = map(
        filter(pair.detail.entries, entry => {
          const specifier = pair.detail.bindings.get(entry.component) ?? "";
          return (
            !endsWith(specifier, ".template.vue") ||
            !existsSync(resolve(pair.detail.directory, specifier))
          );
        }),
        entry =>
          `${entry.key} -> ${pair.detail.bindings.get(entry.component) || "nothing"}`
      );

      expect(
        unpinned,
        `${pair.host}'s ${pair.module} draws something that is not one of its ` +
          `own page templates: ${unpinned.join(", ")}`
      ).toEqual([]);
    }
  );

  it.each(pairs)("$host's $module draws each of its templates once", pair => {
    const doubled = keys(
      pickBy(countBy(drawnSpecifiers(pair.detail)), count => count > 1)
    );

    expect(
      doubled,
      `${pair.host}'s ${pair.module} hands one template to two entries: ` +
        doubled.join(", ")
    ).toEqual([]);
  });

  it.each(pairs)("$host's $module leaves no template no entry draws", pair => {
    const drawn = map(drawnSpecifiers(pair.detail), specifier =>
      resolve(pair.detail.directory, specifier)
    );
    const orphans = map(
      filter(
        map(pair.detail.files, file =>
          join(pair.detail.directory, "templates", file)
        ),
        file => !includes(drawn, file)
      ),
      file => relative(REPO_ROOT, file)
    );

    expect(
      orphans,
      `${pair.host}'s ${pair.module} owns page template(s) no entry draws: ` +
        orphans.join(", ")
    ).toEqual([]);
  });
});

describe("each host page passes its own app's record", () => {
  it.each(hosts)("$name's pages pass a record", host => {
    expect(
      host.passed.length,
      `${host.name}'s pages pass no template record, so this sweep grades nothing`
    ).toBeGreaterThan(0);
  });

  it.each(hosts)("$name's pages take each record from its own module", host => {
    const stray = map(
      filter(host.passed, passed => {
        const owner =
          find(host.modules, module => module.record === passed.record) ??
          find(host.picks, pick => pick.pick === passed.record);
        return owner === undefined || passed.from !== owner.shell;
      }),
      passed =>
        `${passed.page}: ${passed.record} from ${passed.from || "nowhere"}`
    );

    expect(
      stray,
      `${host.name} passes a record that is not its own module's: ` +
        stray.join(", ")
    ).toEqual([]);
  });

  it.each(hosts)(
    "$name hands every module's record and pick to a page",
    host => {
      const passed = map(host.passed, "record");
      const unpassed = concat(
        map(
          filter(
            host.modules,
            module =>
              !includes(passed, module.record) && !includes(passed, module.pick)
          ),
          "record"
        ),
        difference(map(host.picks, "pick"), passed)
      );

      expect(
        unpassed,
        `${host.name} builds ${unpassed.join(", ")} and no page passes it`
      ).toEqual([]);
    }
  );
});

describe("the two apps against each other", () => {
  it("draws the same template set in both", () => {
    const setOf = (host: (typeof hosts)[number]) =>
      sortBy(
        flatMap(host.modules, module =>
          map(module.entries, entry => `${entry.enum}.${entry.key}`)
        )
      );
    const [first, second] = hosts;

    expect(
      setOf(second),
      `${second.name} draws a different set from ${first.name}, so one of the ` +
        `two renders a page the other does not`
    ).toEqual(setOf(first));
  });

  it("falls back to the same template in both", () => {
    const fallbacksOf = (host: (typeof hosts)[number]) =>
      sortBy(
        map(
          filter(host.modules, module => module.keyed),
          module => `${module.name}: ${module.fallback?.key ?? "none"}`
        )
      );
    const [first, second] = hosts;

    expect(fallbacksOf(second)).toEqual(fallbacksOf(first));
  });
});

describe("no app owns a page template nothing reaches", () => {
  it.each(TEMPLATE_TREES)("$name imports every page template it owns", tree => {
    const owned = filter(
      sourceFiles(join(REPO_ROOT, tree.tree, "shell/modules")),
      file => endsWith(file, ".template.vue")
    );
    const sources = map(
      filter(
        sourceFiles(join(REPO_ROOT, tree.tree)),
        file => !endsWith(file, ".template.vue")
      ),
      file => withoutComments(readFileSync(file, "utf8"))
    );
    const unreached = map(
      filter(owned, template => {
        const stem = template
          .slice(template.lastIndexOf("/") + 1)
          .replace(/\.vue$/, "");
        return !some(sources, code => includes(code, stem));
      }),
      template => relative(REPO_ROOT, template)
    );

    expect(
      owned.length,
      `${tree.name} owns no page template, so this sweep grades nothing`
    ).toBeGreaterThan(0);
    expect(
      unreached,
      `${tree.name} owns page template(s) no file imports: ${unreached.join(", ")}`
    ).toEqual([]);
  });

  it.each(TEMPLATE_TREES)(
    "$name keeps every template folder in a module",
    tree => {
      const stray = map(
        filter(
          sourceFiles(join(REPO_ROOT, tree.tree, "shell/modules")),
          file =>
            endsWith(file, ".template.vue") &&
            dirname(file).split("/").at(-1) !== "templates"
        ),
        file => relative(REPO_ROOT, file)
      );

      expect(stray).toEqual([]);
    }
  );
});
