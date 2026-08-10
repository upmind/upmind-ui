import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * @AC-1 / @AC-4 — the package.json dependency block is read as plain DATA
 * (never as source): the falsifiable check both ACs cite — zero vue, zero
 * table library, zero headless.
 */
const packageJsonPath = fileURLToPath(
  new URL("../../package.json", import.meta.url)
);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

// Scans all four dependency blocks — a banned package declared in
// peerDependencies/optionalDependencies is as real an agnosticism violation
// as one in dependencies/devDependencies (finding 35): it is the natural way
// a "framework-agnostic" package would start accepting a framework.
const allDeclaredDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
  ...packageJson.peerDependencies,
  ...packageJson.optionalDependencies
};

describe("@AC-1 @AC-4 package.json — the dependency policy", () => {
  it("declares no vue dependency", () => {
    const names = Object.keys(allDeclaredDependencies);
    expect(names.some(name => name === "vue" || name.startsWith("@vue/"))).toBe(
      false
    );
  });

  it("declares no table-library dependency", () => {
    const names = Object.keys(allDeclaredDependencies);
    expect(names.some(name => /table/i.test(name))).toBe(false);
  });

  it("declares no headless (or other vue-tainted workspace-package) dependency", () => {
    const bannedWorkspacePackages = [
      "@upmind-automation/headless",
      "@upmind-automation/client-vue",
      "@upmind-automation/upmind-ui",
      "@upmind-automation/i18n"
    ];

    for (const banned of bannedWorkspacePackages) {
      expect(allDeclaredDependencies).not.toHaveProperty(banned);
    }
  });

  it("runtime dependencies are exactly @cucumber/cucumber-expressions, @cucumber/gherkin, @cucumber/messages, @jsonforms/core, @upmind-automation/types and lodash-es — all three cucumber packages are runtime (not dev) because createTraceabilityCheck is barrel-exported production src: it parses `.feature` text via @cucumber/gherkin's AST behind a VALUE (not type-only) import of @cucumber/messages and matches steps via @cucumber/cucumber-expressions, so every consumer's import executes all three, not only this package's own tests", () => {
    expect(Object.keys(packageJson.dependencies ?? {}).sort()).toStrictEqual(
      [
        "@cucumber/cucumber-expressions",
        "@cucumber/gherkin",
        "@cucumber/messages",
        "@jsonforms/core",
        "@upmind-automation/types",
        "lodash-es"
      ].sort()
    );
  });

  it("declares no peerDependencies or optionalDependencies at all — the declared-policy gate has no field left for a banned package to hide in", () => {
    expect(packageJson.peerDependencies ?? {}).toStrictEqual({});
    expect(packageJson.optionalDependencies ?? {}).toStrictEqual({});
  });
});
