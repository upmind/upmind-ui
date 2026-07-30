/**
 * @fileoverview `scope-based/no-hand-rolled-int-fixture` — the AST re-home of
 * the bespoke regex scanner `tests/fixtures/lint-int-test-provenance.mjs`.
 *
 * Scoped (via `eslint.config.mjs`) to `**\/*.int.test.ts`. Journey response
 * bodies fed to `HttpResponse.json(...)` must come from the recorded fixture
 * pool (`getFixtureBody`/`getFixture`), never be manufactured in-test by a
 * local builder — directly, or via a `const` bound to that builder's result
 * (the const-first evasion the old checker called out at §3.10).
 *
 * A local function/arrow is a MANUFACTURED builder only when it does not
 * itself derive from the fixture pool. A helper that reshapes already
 * fixture-sourced data (e.g. `const listOf = rows => ({ ...listBody, data:
 * rows })`, where `listBody` is `getFixtureBody`-sourced) is not hand-rolling
 * journey data — it is a legitimate fixture wrapper — so it, and identifiers
 * bound to its result, are exempt. Computed as a fixed point: a builder that
 * itself calls an already-exempt builder is exempt too.
 *
 * Control/error responses (`data: null` acks, `{ error }` literals, any
 * `status >= 400`) are never flagged — not via a special-cased allowlist, but
 * because they never reference a manufactured builder in the first place.
 *
 * Companion check `[novestige]`: a file that wires a replay server
 * (`startReplayServer(...)` / a `recordingsDir` reference / an import from
 * `.../setup.integration`) but has no co-located `fixtures/*.json` next to it
 * is a replay harness with nothing to replay.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-hand-rolled-int-fixture
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

const FIXTURE_CALLEES = new Set(["getFixtureBody", "getFixture"]);
const REPLAY_IMPORT_SUFFIX = "setup.integration";

function unwrapAwait(node) {
  return node?.type === "AwaitExpression" ? node.argument : node;
}

function isFixtureCall(node) {
  return (
    node?.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    FIXTURE_CALLEES.has(node.callee.name)
  );
}

function isLocalFunctionNode(node) {
  return (
    node?.type === "ArrowFunctionExpression" ||
    node?.type === "FunctionExpression"
  );
}

/** Every direct child ESTree/TSESTree node, skipping the `parent` back-edge. */
function childNodesOf(node) {
  const children = [];
  for (const key in node) {
    if (key === "parent" || key === "loc" || key === "range") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item.type === "string") children.push(item);
      }
    } else if (value && typeof value.type === "string") {
      children.push(value);
    }
  }
  return children;
}

/** Visit every node under `root` exactly once (pre-order); no early exit. */
function walk(root, visit) {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    visit(node);
    const children = childNodesOf(node);
    for (let i = children.length - 1; i >= 0; i -= 1) stack.push(children[i]);
  }
}

/** Pre-order DFS returning the first node for which `predicate` is truthy. */
function findFirst(root, predicate) {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    const hit = predicate(node);
    if (hit) return hit;
    const children = childNodesOf(node);
    for (let i = children.length - 1; i >= 0; i -= 1) stack.push(children[i]);
  }
  return null;
}

/** True when `node` is a non-computed property key or member property (a name, not a value read). */
function isNamePosition(node) {
  const parent = node.parent;
  if (!parent) return false;
  if (parent.type === "Property" && parent.key === node && !parent.computed)
    return true;
  if (
    parent.type === "MemberExpression" &&
    parent.property === node &&
    !parent.computed
  ) {
    return true;
  }
  return false;
}

function isHttpResponseJsonCall(node) {
  return (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.object?.type === "Identifier" &&
    node.callee.object.name === "HttpResponse" &&
    node.callee.property?.type === "Identifier" &&
    node.callee.property.name === "json"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Integration-test response bodies must replay recorded fixtures (getFixtureBody/getFixture), never a hand-rolled local builder.",
      recommended: true
    },
    schema: [],
    messages: {
      handRolled:
        "HttpResponse.json(...) is fed by {{via}} — manufactured journey data, not a recorded fixture. Record it (pnpm fixtures:generate) and source via getFixtureBody/getFixture.",
      vestigialReplay:
        "This integration test wires a replay server but has no co-located __tests__/fixtures/*.json — the replay harness has nothing to replay (vestigial). Generate the recordings or remove the dead setup."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();

    return {
      "Program:exit"(program) {
        // --- Pass 1: fixture-bound identifiers + local builder candidates ---
        const fixtureBoundNames = new Set();
        const builderNodesByName = new Map();

        walk(program, node => {
          if (
            node.type === "VariableDeclarator" &&
            node.id.type === "Identifier"
          ) {
            const init = unwrapAwait(node.init);
            if (isFixtureCall(init)) {
              fixtureBoundNames.add(node.id.name);
            } else if (isLocalFunctionNode(init)) {
              builderNodesByName.set(node.id.name, init);
            }
          } else if (node.type === "FunctionDeclaration" && node.id) {
            builderNodesByName.set(node.id.name, node);
          }
        });

        // --- Pass 2: fixed point — a builder that derives from the fixture
        // pool (or from another already-exempt builder) in its own BODY is a
        // fixture wrapper, not a manufacturer, and is exempt.
        const exemptBuilders = new Set();
        let changed = true;
        while (changed) {
          changed = false;
          for (const [name, fnNode] of builderNodesByName) {
            if (exemptBuilders.has(name)) continue;
            const derivesFromFixture = !!findFirst(fnNode.body, n => {
              if (n.type !== "Identifier" || isNamePosition(n)) return false;
              return (
                fixtureBoundNames.has(n.name) || exemptBuilders.has(n.name)
              );
            });
            if (derivesFromFixture) {
              exemptBuilders.add(name);
              changed = true;
            }
          }
        }

        const manufacturedBuilders = new Set(
          [...builderNodesByName.keys()].filter(
            name => !exemptBuilders.has(name)
          )
        );

        // --- Pass 3: identifiers bound to a manufactured builder's result —
        // the const-first evasion.
        const taintedNames = new Set();
        walk(program, node => {
          if (
            node.type !== "VariableDeclarator" ||
            node.id.type !== "Identifier"
          )
            return;
          const init = unwrapAwait(node.init);
          if (
            init?.type === "CallExpression" &&
            init.callee?.type === "Identifier" &&
            manufacturedBuilders.has(init.callee.name)
          ) {
            taintedNames.add(node.id.name);
          }
        });

        // --- Pass 4: every HttpResponse.json(...) call site ---
        walk(program, node => {
          if (!isHttpResponseJsonCall(node)) return;
          const arg = node.arguments[0];
          if (!arg) return;

          const via = findFirst(arg, n => {
            if (
              n.type === "CallExpression" &&
              n.callee?.type === "Identifier" &&
              manufacturedBuilders.has(n.callee.name)
            ) {
              return `${n.callee.name}(...)`;
            }
            if (
              n.type === "Identifier" &&
              taintedNames.has(n.name) &&
              !isNamePosition(n)
            ) {
              return `\`${n.name}\` (bound to a local builder's result)`;
            }
            return null;
          });

          if (via)
            context.report({ node, messageId: "handRolled", data: { via } });
        });

        // --- [novestige]: a wired replay server with nothing to replay ---
        const usesReplay = !!findFirst(program, n => {
          if (
            n.type === "CallExpression" &&
            n.callee?.type === "Identifier" &&
            n.callee.name === "startReplayServer"
          ) {
            return true;
          }
          if (n.type === "Identifier" && n.name === "recordingsDir")
            return true;
          return (
            n.type === "ImportDeclaration" &&
            typeof n.source.value === "string" &&
            n.source.value.endsWith(REPLAY_IMPORT_SUFFIX)
          );
        });
        if (!usesReplay) return;

        const fixturesDir = join(dirname(filename), "fixtures");
        const hasJson =
          existsSync(fixturesDir) &&
          readdirSync(fixturesDir).some(entry => entry.endsWith(".json"));

        if (!hasJson)
          context.report({ node: program, messageId: "vestigialReplay" });
      }
    };
  }
};
