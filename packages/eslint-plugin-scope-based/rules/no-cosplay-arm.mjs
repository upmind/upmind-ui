/**
 * @fileoverview `scope-based/no-cosplay-arm` — variance-law clauses 2 & 3.
 *
 * A per-actor `.{actor}.ts` arm exists ONLY for members exclusive to that actor
 * or genuinely overriding the shared implementation (A vs A+B). Two failures:
 *   - COSPLAY OVERRIDE: an arm member whose body is byte-identical (comments and
 *     whitespace aside) to the shared member of the same name — it delivers no
 *     actor variance. This is the FE-2824 / T7d class the anti-cosplay law
 *     exists to catch.
 *   - EMPTY SCAFFOLD: an arm that exports nothing exclusive or overriding.
 *
 * A member carrying a complete `@decision` (what/why/rejected) that names it is
 * a justified deviation and passes. The shared-factory delegate seam
 * (`scopedServices(scopeActor)…`) is the endorsed dispatch idiom, not a
 * duplicate.
 *
 * Cross-file: the arm's sibling shared factory is parsed from disk — the same
 * disk-read pattern the repo's `@internal` barrier rule already uses.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-cosplay-arm
 */

import { existsSync, readFileSync } from "node:fs";
import { extractSurface, isDelegateSeam, parseModule } from "../surface.mjs";
import { ARM_FILENAME_RE, hasCompleteDecisionFor } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a scope-based arm that duplicates a shared member (cosplay override) or carries nothing exclusive/overriding (empty scaffold) — variance-law clauses 2 & 3.",
      recommended: true
    },
    schema: [],
    messages: {
      cosplayMember:
        "Arm member `{{name}}` is byte-identical to the shared implementation — a cosplay override that adds no actor variance. An override must extend shared behaviour (A vs A+B), or carry a complete `@decision` (what/why/rejected) justifying it.",
      cosplaySchema:
        "Arm export `{{name}}` is byte-identical to a shared schema member — a cosplay member that adds no actor variance. Give it a genuine A-vs-A+B divergence and a complete `@decision`, or remove it.",
      emptyArm:
        "Arm `{{file}}` exports nothing exclusive to or overriding the shared factory — an empty scaffold. A fresh module stays armless until a scope earns an arm (clause 2).",
      noShared:
        "Arm `{{file}}` has no corresponding shared factory file (expected `{{shared}}`).",
      sharedUnparseable:
        "Shared factory `{{shared}}` yielded zero exported members, so no arm key can be scored (a checker error, never a pass). Its exported surface could not be extracted."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const armMatch = filename.match(ARM_FILENAME_RE);
    if (!armMatch) return {};

    const base = armMatch[1];
    const sharedFile = `${base}.ts`;

    return {
      Program(node) {
        if (!existsSync(sharedFile)) {
          context.report({
            node,
            messageId: "noShared",
            data: { file: filename, shared: sharedFile }
          });
          return;
        }

        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const armText = sourceCode.getText();
        const arm = extractSurface(sourceCode.ast, armText, filename);

        if (arm.keys.size === 0) {
          context.report({
            node,
            messageId: "emptyArm",
            data: { file: filename }
          });
          return;
        }

        let shared;
        try {
          const sharedText = readFileSync(sharedFile, "utf8");
          shared = extractSurface(
            parseModule(sharedText),
            sharedText,
            sharedFile
          );
        } catch {
          // File vanished between the check above and now → noShared; a
          // malformed/unparseable sibling → sharedUnparseable ("a checker error,
          // never a pass") — NOT an uncaught parser throw that would crash the
          // whole lint run on the arm file.
          context.report({
            node,
            messageId: existsSync(sharedFile)
              ? "sharedUnparseable"
              : "noShared",
            data: { file: filename, shared: sharedFile }
          });
          return;
        }

        if (shared.keys.size === 0) {
          context.report({
            node,
            messageId: "sharedUnparseable",
            data: { file: filename, shared: sharedFile }
          });
          return;
        }

        const sharedBodies = new Set(shared.keys.values());
        const cosplayId = arm.schemas ? "cosplaySchema" : "cosplayMember";

        // Each arm member either EARNS the arm (exclusive / genuine override /
        // delegate seam / justified @decision) or is a cosplay report. A member
        // is cosplay when its comparable body is byte-identical to a shared
        // member — whether SAME-named (an override that overrides nothing) or
        // DIFFERENTLY-named (a renamed dead copy, the FE-BLK class — caught for
        // every layer, not just schemas). Opaque bodies ("" from a cross-file
        // re-export) never match. A zero-member arm is already caught above.
        for (const [name, armBody] of arm.keys) {
          if (hasCompleteDecisionFor(sourceCode, name)) continue; // justified

          const sharedBody = shared.keys.get(name);
          if (sharedBody !== undefined) {
            if (isDelegateSeam(sharedBody)) continue; // endorsed dispatch seam
            if (armBody !== "" && armBody === sharedBody) {
              context.report({ node, messageId: cosplayId, data: { name } });
            }
            // else: genuine A-vs-A+B override — conforming
            continue;
          }

          // Name is exclusive to this arm; a body byte-identical to ANY shared
          // member is a renamed duplicate, not new capability.
          if (armBody !== "" && sharedBodies.has(armBody)) {
            context.report({ node, messageId: cosplayId, data: { name } });
          }
          // else: genuinely exclusive — conforming
        }
      }
    };
  }
};
