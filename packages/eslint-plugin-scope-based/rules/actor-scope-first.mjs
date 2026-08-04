/**
 * @fileoverview `scope-based/actor-scope-first` — the input-signature half of
 * variance-law clause 1 (uniform four-layer default).
 *
 * `complete-layer-set` proves the four sub-composable layer FILES exist; this
 * rule proves their factories share one INPUT signature: every sub-composable
 * factory — `create{Module}{Actions,Context,Meta,Internals}` — takes
 * `actorScope: ScopeActorTypes` as its FIRST parameter, uniformly, whether or
 * not that layer consumes it (an unused one is `_actorScope`, matching the
 * manager convention). The signature is the contract, not the usage: a layer
 * that never reads the scope still declares it first, so every layer of every
 * scoped module is invoked the same way.
 *
 * This is the decidable form of the FE-2968 incident (2026-08-04): the
 * factory-generated `useClientEmails` collection layers shipped with
 * `actorScope` dropped (`createClientEmailsContext(query)`) or mis-positioned
 * (`createClientEmailsInternals(query, actorScope)`) — a deviation the
 * templates carried by example but no gate caught, because clause 1 was only
 * enforced on the RETURN shape, never the input signature.
 *
 * SCOPE — only the SHARED layer factory of a genuinely scope-based module:
 *  - The file is `use{X}.{actions|context|meta|internals}.ts` (the anchored
 *    `.ts$` naturally excludes an actor arm `use{X}.context.client.ts`, whose
 *    factory takes the already-resolved actor context, never `actorScope`).
 *  - Its sibling entry `use{X}.ts` uses `createScopedComposable` — so a
 *    singleton store (`session-store`, whose layer factories take `_sessionId`)
 *    is NOT in scope and never reported.
 *
 * KNOWN LIMITATIONS (documented, not silently absent):
 *  - Scoped-ness is read from the sibling entry's TEXT (`createScopedComposable`
 *    mention), not its AST — a comment mention in a non-scoped entry would pull
 *    that module in. No such comment exists in the tree; the safe direction
 *    (over-inclusion of a factory that should already be actorScope-first) is
 *    preferred to parsing a second file per lint.
 *  - Only a factory named `create…{Layer}` matching the file's own layer is
 *    checked; a factory that abandons the `create{Module}{Layer}` naming is out
 *    of this rule's reach (and is a `complete-layer-set` / naming concern).
 *
 * @module packages/eslint-plugin-scope-based/rules/actor-scope-first
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { basenameOf, ARM_FILENAME_RE } from "../util.mjs";

// A shared sub-composable layer file: `use{X}.{layer}.ts`, anchored so an actor
// arm (`use{X}.context.client.ts`) never matches.
const LAYER_FILE_RE =
  /^(use[A-Z][A-Za-z0-9_]*)\.(actions|context|meta|internals)\.ts$/;

// filename layer segment → factory name suffix (`context` → `…Context`).
const LAYER_SUFFIX = {
  actions: "Actions",
  context: "Context",
  meta: "Meta",
  internals: "Internals"
};

// The first parameter must be one of these — the named scope, or its
// deliberately-unused twin (the manager convention for a layer that never
// reads it).
const ACCEPTED_FIRST_PARAMS = new Set(["actorScope", "_actorScope"]);

const FN_INIT_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression"
]);

/** How the found first parameter reads in the report message. */
function describeFirstParam(fn) {
  const p = fn.params?.[0];
  if (!p) return { name: null, label: "no parameters" };
  if (p.type === "Identifier") return { name: p.name, label: `\`${p.name}\`` };
  if (p.type === "AssignmentPattern" && p.left?.type === "Identifier") {
    return { name: p.left.name, label: `\`${p.left.name}\`` };
  }
  // ObjectPattern / ArrayPattern / RestElement / TSParameterProperty
  return { name: null, label: "a destructured parameter" };
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Every scoped sub-composable factory (actions/context/meta/internals) must take `actorScope: ScopeActorTypes` as its first parameter, uniformly — the input-signature half of variance-law clause 1.",
      recommended: true
    },
    schema: [],
    messages: {
      actorScopeFirst:
        "Sub-composable factory `{{factory}}` must take `actorScope: ScopeActorTypes` as its FIRST parameter (variance-law clause 1, uniform input signature) — found {{found}}. Every scoped layer is invoked the same way even when it doesn't read the scope; name an unused one `_actorScope`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const base = basenameOf(filename);

    // Actor arms take the resolved actor context, not `actorScope` — never our
    // jurisdiction (belt-and-braces beside the anchored LAYER_FILE_RE).
    if (ARM_FILENAME_RE.test(base)) return {};

    const layerMatch = base.match(LAYER_FILE_RE);
    if (!layerMatch) return {};
    const [, composable, layer] = layerMatch;
    const suffix = LAYER_SUFFIX[layer];

    // Scoped-ness gate: only a module whose entry uses `createScopedComposable`
    // is held to the actor-scoped signature. A missing entry (can't confirm) or
    // a singleton store (no factory) is left alone.
    const entry = join(dirname(filename), `${composable}.ts`);
    if (!existsSync(entry)) return {};
    if (!/\bcreateScopedComposable\b/.test(readFileSync(entry, "utf8"))) {
      return {};
    }

    const check = (name, fnNode, reportNode) => {
      if (!name.startsWith("create") || !name.endsWith(suffix)) return;
      const { name: firstName, label } = describeFirstParam(fnNode);
      if (firstName && ACCEPTED_FIRST_PARAMS.has(firstName)) return;
      context.report({
        node: reportNode,
        messageId: "actorScopeFirst",
        data: { factory: name, found: label }
      });
    };

    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl) return;
        if (decl.type === "FunctionDeclaration" && decl.id) {
          check(decl.id.name, decl, decl.id);
        } else if (decl.type === "VariableDeclaration") {
          for (const d of decl.declarations) {
            if (
              d.id?.type === "Identifier" &&
              d.init &&
              FN_INIT_TYPES.has(d.init.type)
            ) {
              check(d.id.name, d.init, d.id);
            }
          }
        }
      }
    };
  }
};
