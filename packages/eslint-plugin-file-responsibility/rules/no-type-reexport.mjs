/**
 * @fileoverview `file-responsibility/no-type-reexport` — FE-3249 #4.
 *
 * A type has ONE home and is never re-exported from ANOTHER module. A module's
 * own barrel (`account/index.ts`) re-exporting its own sub-file's type
 * (`export { useAccount, type UseAccount } from "./useAccount"`) is the module
 * publishing its own surface — that is fine. The violation is a CROSS-module
 * re-export: module B handing out module A's type.
 *
 * Same module vs another module is decided by the resolved source path: if it
 * stays inside the current file's `modules/<name>/` directory it is the same
 * module; if it points into a different module (or a package) it is a
 * cross-module re-export.
 *
 * Flags a type re-export (`export type { X } from`, `export { type X } from`,
 * or `export * from` a types module) whose source is another module. A value
 * re-export and a plain type import are untouched.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/no-type-reexport
 */

import path from "node:path";

/** A source path that names a types module: `./x.types` or `./x.types.<actor>`. */
const TYPES_MODULE = /\.types(\.[a-z]+)?$/;

/** The `modules/<name>/` directory of a file, or null if the file is not under a module. */
function moduleDirOf(absPath) {
  const norm = absPath.replace(/\\/g, "/");
  const m = norm.match(/^(.*\/modules\/[^/]+)\//);
  return m ? m[1] : null;
}

/**
 * True when `source` is a re-export from ANOTHER INTERNAL module. A bare
 * package / alias (e.g. `ajv`) is NOT flagged: headless deliberately re-exports
 * a third-party type so client-vue and the apps consume it without importing
 * the dependency themselves. Only a relative source that escapes the file's own
 * `modules/<name>/` directory into a different module counts.
 */
function isCrossModule(filename, source) {
  if (!source.startsWith(".")) return false; // a package re-export — provided on purpose
  const fileModule = moduleDirOf(filename);
  if (!fileModule) return false; // file not under a module — don't guess
  const resolved = path.resolve(path.dirname(filename), source).replace(/\\/g, "/");
  return !(resolved === fileModule || resolved.startsWith(fileModule + "/"));
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow re-exporting a type from ANOTHER module; a type has one home and each consumer imports it directly from its `*.types` module (FE-3249 #4).",
      recommended: true
    },
    schema: [],
    messages: {
      noTypeReexport:
        "Do not re-export a type from another module (`{{source}}`). A type has one home; import it directly from its `*.types` module instead of re-publishing it here."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    return {
      // `export … from "…"` — a named re-export with a source.
      ExportNamedDeclaration(node) {
        if (!node.source) return; // a local export, not a re-export
        const source = node.source.value;
        if (!isCrossModule(filename, source)) return; // same module — the barrel's own surface

        // `export type { X } from "…"` — the whole statement is type-only.
        if (node.exportKind === "type") {
          context.report({ node, messageId: "noTypeReexport", data: { source } });
          return;
        }
        // `export { type X } from "…"` — an inline type specifier.
        for (const spec of node.specifiers) {
          if (spec.exportKind === "type") {
            context.report({ node: spec, messageId: "noTypeReexport", data: { source } });
          }
        }
      },

      // `export * from "…"` — a cross-module wildcard re-export of a types module.
      ExportAllDeclaration(node) {
        if (!node.source) return;
        const source = node.source.value;
        if (TYPES_MODULE.test(source) && isCrossModule(filename, source)) {
          context.report({ node, messageId: "noTypeReexport", data: { source } });
        }
      }
    };
  }
};
