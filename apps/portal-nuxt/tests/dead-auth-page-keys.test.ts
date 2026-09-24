// -----------------------------------------------------------------------------
/**
 * @fileoverview The four deleted auth page keys are gone, and nothing still asks for them.
 *
 * ## Job To Be Done
 * Every `PAGE_KEY.<NAME>` the app reaches for is a member that exists.
 *
 * ## What Breaks If These Fail
 * A deleted key reads as `undefined`, and the page silently renders the fallback shell.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_KEY } from "~/portal/types";

// -----------------------------------------------------------------------------

const APP = join(import.meta.dirname, "..", "app");
const CONFIG = join(APP, "portal", "config");

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
