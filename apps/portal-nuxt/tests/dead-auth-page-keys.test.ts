// -----------------------------------------------------------------------------
/**
 * @fileoverview The four auth page keys are gone, and nothing still asks for them
 *
 * ## Job To Be Done
 * `AUTH_LOGIN`, `AUTH_LOGIN_TWOFA`, `AUTH_REGISTER` and `AUTH_FORGOTTEN_PASSWORD`
 * were page keys with configs behind them and no page in front of them. Deleting
 * a key is only half a deletion: the member goes, and every reference to it has
 * to go with it or the app carries a lookup that can never resolve. `PAGE_KEY.X`
 * for a deleted `X` is `undefined`, and `config.pages[undefined]` is a miss that
 * falls through to the generic content — a page that quietly renders the wrong
 * chrome rather than throwing.
 *
 * ## Why the sweep is general, not a list of four
 * The named four are asserted gone, but the reference sweep grades EVERY
 * `PAGE_KEY.<NAME>` in the app against the members that actually exist. A list
 * of four goes vacuous the day a fifth key is deleted; the derivation cannot.
 *
 * ## What Breaks If These Fail
 * A client hits a page whose key resolves to nothing and gets the fallback
 * shell — wrong title, wrong measure, wrong menu — with every gate green,
 * because an undefined key is a valid object lookup.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_KEY } from "~/portal/types";

// -----------------------------------------------------------------------------

const APP = join(import.meta.dirname, "..", "app");
const CONFIG = join(APP, "portal", "config");

/** The four this story deleted, by the name every reference would use. */
const DELETED = [
  "AUTH_LOGIN",
  "AUTH_LOGIN_TWOFA",
  "AUTH_REGISTER",
  "AUTH_FORGOTTEN_PASSWORD"
];

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".vue", ".mts", ".js", ".mjs"];

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap(entry => {
    if (entry === "node_modules" || entry === ".nuxt" || entry === "dist") {
      return [];
    }
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) return sourceFiles(path);
    return SOURCE_EXTENSIONS.includes(extname(entry)) ? [path] : [];
  });
}

function withoutComments(code: string) {
  return code
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

const appSources = sourceFiles(APP).map(file => ({
  file: file.slice(APP.length + 1),
  code: withoutComments(readFileSync(file, "utf8"))
}));

const memberNames = Object.keys(PAGE_KEY);

/**
 * Whole-identifier match. `AUTH_REGISTER_ORG` is a live key that a substring
 * search reads as a deleted `AUTH_REGISTER` still in place — the sweep would
 * fail on correct code and, worse, teach the next reader to loosen it.
 */
function named(code: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`).test(code);
}

// -----------------------------------------------------------------------------

describe("the four auth page keys this story deleted", () => {
  it("finds the app's sources and the key map, so the sweep grades something", () => {
    expect(appSources.length).toBeGreaterThan(0);
    expect(memberNames.length).toBeGreaterThan(0);
  });

  it.each(DELETED)("%s is no longer a member of PAGE_KEY", name => {
    expect(
      memberNames,
      `${name} is still a page key, so the delete did not happen`
    ).not.toContain(name);
  });

  it.each(DELETED)("%s is named nowhere in the app", name => {
    const mentions = appSources
      .filter(entry => named(entry.code, name))
      .map(entry => entry.file);

    expect(
      mentions,
      `${name} was deleted from PAGE_KEY and is still named in: ${mentions.join(", ")}`
    ).toEqual([]);
  });

  it("leaves no config file naming any of them as a page entry", () => {
    const configs = sourceFiles(CONFIG).map(file => ({
      file: file.slice(CONFIG.length + 1),
      code: withoutComments(readFileSync(file, "utf8"))
    }));
    const dangling = configs.flatMap(entry =>
      DELETED.filter(name => named(entry.code, name)).map(
        name => `${entry.file} -> ${name}`
      )
    );

    expect(configs.length).toBeGreaterThan(0);
    expect(
      dangling,
      `a page config still keys on a deleted page key: ${dangling.join(", ")}`
    ).toEqual([]);
  });
});

/**
 * The general form. Every key the app reaches for must be a key that exists —
 * this is what makes the four above a deletion rather than a rename.
 */
describe("every page key the app reaches for", () => {
  const referenced = appSources.flatMap(entry =>
    [...entry.code.matchAll(/\bPAGE_KEY\s*\.\s*([A-Z0-9_]+)/g)].map(match => ({
      file: entry.file,
      name: match[1]
    }))
  );

  it("is reached for somewhere, so the sweep is not grading an empty set", () => {
    expect(referenced.length).toBeGreaterThan(0);
  });

  it("resolves to a member the key map actually declares", () => {
    const unknown = referenced
      .filter(entry => !memberNames.includes(entry.name))
      .map(entry => `${entry.file} -> PAGE_KEY.${entry.name}`);

    expect(
      unknown,
      `these resolve to undefined and fall through to the generic content: ${unknown.join(
        ", "
      )}`
    ).toEqual([]);
  });
});
