// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/declaration-contract.spec
 * @description The reshaped declaration contract, held three ways at once: the
 * TYPE declares only what a composable does not already own, the landed
 * DECLARATIONS carry only what the type declares, and no CONSUMER reads a
 * channel the audit deleted.
 *
 * Seven channels were deleted because each stated a second time a fact the
 * module already owned — `sort` (the criteria schema's own enum), `form` (the
 * mutate composable's own schemas), `scope` and its loose `contextType`
 * spelling (the url, and headless's own `ScopeContext`), `scopeMatrix` (the
 * composable's own export), `nav` (presentation), `marker` (a renderer) and
 * `pinned` (width, decided at render). Two more collapsed into one:
 * `rowActions`/`collectionActions` became `actions`, and `row` became `table`.
 *
 * Deleting a channel from a type is not the same as deleting it from the
 * product, which is why the second and third describe blocks exist: a
 * declaration may still carry an unknown key, and a consumer may still reach
 * for one.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { registry } from "../runtime/registry";
import {
  difference,
  filter,
  flatMap,
  intersection,
  isEmpty,
  keys,
  map,
  reject,
  some,
  sortBy,
  values
} from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_ROOT = join(import.meta.dirname, "..");
const PLAYGROUND_ROOT = join(MODULE_ROOT, "..", "..");
const CONTRACT = join(MODULE_ROOT, "runtime", "scenario.types.ts");

const SCANNED_ROOTS = ["app", "modules"];
const SKIPPED_DIRS = new Set(["__tests__", "node_modules", ".nuxt", "dist"]);
const SOURCE_EXTENSIONS = /\.(?:ts|vue)$/;

/** Every channel the audit deleted, by the name a declaration used to give it. */
const RETIRED_CHANNELS = [
  "collectionActions",
  "contextType",
  "form",
  "marker",
  "nav",
  "pinned",
  "row",
  "rowActions",
  "scope",
  "scopeMatrix",
  "sort",
  "sortOptions"
];

const DECLARATION_MEMBERS = ["key", "presentation", "tracks"];
const BINDING_MEMBERS = [
  "handoff",
  "identifier",
  "persistCriteria",
  "useDetail"
];
const PRESENTATION_MEMBERS = ["actions", "card", "detail", "icon", "table"];
const BOUND_COMPOSABLES = ["useList", "useMutate"];

// -----------------------------------------------------------------------------

/** Source with its comments removed, so prose about a dead channel is not a read of one. */
function code(path: string): string {
  return readFileSync(path, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** The top-level member names an object type literal declares, brace depth aside. */
function membersOf(source: string, typeName: string): string[] {
  const start = source.indexOf(`export type ${typeName} =`);
  const open = source.indexOf("{", start);
  const collected: string[] = [];

  let depth = 0;

  for (let cursor = open; cursor < source.length; cursor++) {
    const character = source[cursor];

    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) break;
    }

    if (depth === 1 && /[\w?]/.test(character)) {
      const member = /^(\w+)\??\s*:/.exec(source.slice(cursor));

      if (member) {
        collected.push(member[1]);
        cursor += member[0].length - 1;
      }
    }
  }

  return sortBy(collected);
}

function sourceFiles(directory: string): string[] {
  return flatMap(readdirSync(directory), entry => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory())
      return SKIPPED_DIRS.has(entry) ? [] : sourceFiles(path);

    return SOURCE_EXTENSIONS.test(entry) ? [path] : [];
  });
}

const scannedFiles = flatMap(SCANNED_ROOTS, root =>
  sourceFiles(join(PLAYGROUND_ROOT, root))
);

const contract = code(CONTRACT);
const declarations = values(registry);

/** The binding's own members — what the union's two composables are intersected WITH. */
const bindingMembers = sortBy(
  map(
    [
      ...(
        /export type ScenarioBinding =[\s\S]*?\) & \{([\s\S]*?)\n\};/.exec(
          contract
        )?.[1] ?? ""
      ).matchAll(/^\s{2}(\w+)\??\s*:/gm)
    ],
    member => member[1]
  )
);

// -----------------------------------------------------------------------------

describe("the reshaped declaration contract — the type", () => {
  it("declares only what no composable already owns", () => {
    expect(membersOf(contract, "ScenarioDeclaration")).toStrictEqual(
      sortBy(DECLARATION_MEMBERS)
    );
    expect(membersOf(contract, "ScenarioPresentation")).toStrictEqual(
      sortBy(PRESENTATION_MEMBERS)
    );
  });

  it("makes at-least-one-of a two-member union, so neither composable is a type error", () => {
    const union = /export type ScenarioBinding = \(([\s\S]*?)\) & \{/.exec(
      contract
    );

    expect(
      union,
      "ScenarioBinding is no longer a union of two members"
    ).not.toBeNull();

    const members = map(
      filter(union![1].split("|"), member => !isEmpty(member.trim())),
      member => ({
        required: map(
          [...member.matchAll(/(\w+)\s*:/g)],
          required => required[1]
        ),
        optional: map(
          [...member.matchAll(/(\w+)\?\s*:/g)],
          optional => optional[1]
        )
      })
    );

    expect(map(members, "required")).toStrictEqual([
      ["useList"],
      ["useMutate"]
    ]);
    expect(map(members, "optional")).toStrictEqual([
      ["useMutate"],
      ["useList"]
    ]);
  });

  it("carries the binding's own optional members and nothing retired beside them", () => {
    expect(bindingMembers).toStrictEqual(sortBy(BINDING_MEMBERS));
  });

  it("expresses a scope as headless's own ScopeContext, never a bare string", () => {
    expect(contract).toContain("ScopeContext");
    expect(contract).toMatch(/from "@upmind-automation\/headless"/);
    expect(
      filter(contract.split("\n"), line => /contextType/.test(line))
    ).toStrictEqual([]);
    expect(
      filter(contract.split("\n"), line =>
        /\bcontext\??\s*:\s*string/.test(line)
      )
    ).toStrictEqual([]);
  });

  it("declares no retired channel anywhere in the contract", () => {
    const declared = [
      ...bindingMembers,
      ...flatMap(
        ["ScenarioDeclaration", "ScenarioPresentation", "ScenarioHandoff"],
        typeName => membersOf(contract, typeName)
      )
    ];

    expect(intersection(declared, RETIRED_CHANNELS)).toStrictEqual([]);
  });
});

describe("the reshaped declaration contract — the declarations", () => {
  it("registers at least one declaration, so the claims below are made of something", () => {
    expect(declarations.length).toBeGreaterThan(0);
  });

  it("carries only the channels the contract declares", () => {
    const unknown = map(declarations, declaration => ({
      key: declaration.key,
      channels: difference(keys(declaration), [
        ...DECLARATION_MEMBERS,
        ...BINDING_MEMBERS,
        ...BOUND_COMPOSABLES,
        "route"
      ])
    }));

    expect(reject(unknown, entry => isEmpty(entry.channels))).toStrictEqual([]);
  });

  it("draws only through the four presentation channels", () => {
    const unknown = map(declarations, declaration => ({
      key: declaration.key,
      channels: difference(keys(declaration.presentation), PRESENTATION_MEMBERS)
    }));

    expect(reject(unknown, entry => isEmpty(entry.channels))).toStrictEqual([]);
  });

  it("gives at least one of the two composables — with neither there is nothing to build", () => {
    expect(
      reject(declarations, declaration =>
        some(BOUND_COMPOSABLES, member => Boolean(declaration[member]))
      )
    ).toStrictEqual([]);
  });

  it("names no boot scope at all — the page boots as self and the url is the only override", () => {
    expect(
      flatMap(declarations, declaration =>
        intersection(keys(declaration), RETIRED_CHANNELS)
      )
    ).toStrictEqual([]);
  });
});

describe("the reshaped declaration contract — the consumers", () => {
  const RECEIVERS =
    "declaration|presentation|registered|registry|scenario|scenarioRegistry|scenarioRoutes";

  const RETIRED_READ = new RegExp(
    `\\b(?:${RECEIVERS})\\.(?:${RETIRED_CHANNELS.join("|")})\\b`,
    "g"
  );

  /**
   * The same read spelled as a lodash path. A dotted read on a channel the
   * type no longer declares does not compile; a path read compiles and answers
   * `undefined`, which is the spelling a reshape leaves behind in silence.
   */
  const RETIRED_PATH_READ = new RegExp(
    `\\bget\\(\\s*(?:${RECEIVERS})\\b[^)]*?\\[[^\\]]*?"(?:${RETIRED_CHANNELS.join("|")})"`,
    "g"
  );

  it("reads no retired channel off a declaration anywhere in the playground", () => {
    const offenders = flatMap(scannedFiles, path =>
      map([...code(path).matchAll(RETIRED_READ)], match => ({
        file: relative(PLAYGROUND_ROOT, path),
        read: match[0]
      }))
    );

    expect(offenders).toStrictEqual([]);
  });

  it("reaches for no retired channel through a lodash path either", () => {
    const offenders = flatMap(scannedFiles, path =>
      map([...code(path).matchAll(RETIRED_PATH_READ)], match => ({
        file: relative(PLAYGROUND_ROOT, path),
        read: match[0]
      }))
    );

    expect(offenders).toStrictEqual([]);
  });

  it("widens no declaration with an off-contract intersection", () => {
    const offenders = filter(scannedFiles, path =>
      /satisfies\s+ScenarioDeclaration\s*&/.test(code(path))
    );

    expect(
      map(offenders, path => relative(PLAYGROUND_ROOT, path))
    ).toStrictEqual([]);
  });
});
