/**
 * @fileoverview Factory-surface extraction on a real AST — the correct
 * replacement for `law-checker.mjs`'s `getExportedSurface` string lexer.
 *
 * Because it reads the parsed tree, the whole family of extraction bugs the
 * lexer carried is gone: the top-level return object is found structurally (no
 * `lastIndexOf("return {")` grabbing a nested method's return), inline
 * return-type annotations and generics are irrelevant, and no regex can
 * catastrophically backtrack.
 *
 * A member's COMPARABLE BODY is always a function's body block / arrow body —
 * resolved through a shorthand or identifier reference to the local declaration
 * it names — never the reference text itself. Comparing `{ destroy }` by the
 * string "destroy" (a name, not an implementation) was the shorthand blind spot
 * that produced both false-positive and false-negative cosplay verdicts; the
 * dominant idiom in the tree returns members by shorthand, so this resolution
 * is load-bearing, not an edge case.
 *
 * @module packages/eslint-plugin-scope-based/surface
 */

import { parse as tsParse } from "@typescript-eslint/parser";

/** Parse a `.ts` module to an ESTree AST with ranges. */
export function parseModule(text) {
  return tsParse(text, {
    range: true,
    loc: true,
    ecmaVersion: "latest",
    sourceType: "module"
  });
}

function stripComments(str) {
  return str.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

/** Comment- and whitespace-insensitive form for body-identity comparison. */
export function normalizeBody(str) {
  return stripComments(str).replace(/\s+/g, " ").trim();
}

function textOf(node, text) {
  return text.slice(node.range[0], node.range[1]);
}

const FN_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration"
]);

/**
 * The comparable body of a member value: a function's body block / arrow body
 * (so two functions are compared by implementation, not by name or wrapper),
 * or the whole node's text for a non-function value.
 */
function bodyText(node, text) {
  if (node && FN_TYPES.has(node.type) && node.body) {
    return normalizeBody(textOf(node.body, text));
  }
  return normalizeBody(textOf(node, text));
}

/**
 * The object a factory RETURNS — structurally, so a nested `return {…}` inside
 * one of the returned members can never be mistaken for it.
 *   `() => ({...})`            → the ObjectExpression body
 *   `() => { … return {...} }` → the first top-level ReturnStatement's object
 *   `function () { … }`        → same, and recursing into a wrapping try/if
 */
function findReturnObject(fnNode) {
  const body = fnNode.body;
  if (!body) return null;
  if (body.type === "ObjectExpression") return body;
  if (body.type === "BlockStatement") return findReturnInStatements(body.body);
  return null;
}

// Walk statements for a `return {…}`, descending through the control-flow
// wrappers a factory legitimately uses (try/catch, if/else, plain blocks) so a
// guarded return is still found rather than scored as an empty surface.
function findReturnInStatements(statements) {
  for (const stmt of statements) {
    const found = findReturnInStatement(stmt);
    if (found) return found;
  }
  return null;
}

function findReturnInStatement(stmt) {
  if (!stmt) return null;
  switch (stmt.type) {
    case "ReturnStatement":
      return stmt.argument?.type === "ObjectExpression" ? stmt.argument : null;
    case "BlockStatement":
      return findReturnInStatements(stmt.body);
    case "IfStatement":
      return (
        findReturnInStatement(stmt.consequent) ||
        findReturnInStatement(stmt.alternate)
      );
    case "TryStatement":
      return (
        findReturnInStatement(stmt.block) ||
        findReturnInStatement(stmt.handler?.body) ||
        findReturnInStatement(stmt.finalizer)
      );
    default:
      return null;
  }
}

// name -> value node (const init, or the function declaration itself), for
// resolving a shorthand/identifier member to the implementation it references.
function indexTopLevel(ast) {
  const map = new Map();
  const add = decl => {
    if (!decl) return;
    if (decl.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        if (d.id.type === "Identifier" && d.init) map.set(d.id.name, d.init);
      }
    } else if (decl.type === "FunctionDeclaration" && decl.id) {
      map.set(decl.id.name, decl);
    }
  };
  for (const node of ast.body) {
    if (node.type === "ExportNamedDeclaration") add(node.declaration);
    else add(node);
  }
  return map;
}

function collectMembers(objNode, text, topLevel, into) {
  for (const prop of objNode.properties) {
    if (prop.type !== "Property") continue; // skip SpreadElement
    let name;
    if (!prop.computed && prop.key.type === "Identifier") name = prop.key.name;
    else if (prop.key.type === "Literal") name = String(prop.key.value);
    else continue; // computed / non-literal key — cannot statically name

    // Resolve a shorthand or bare-identifier value to the declaration it names,
    // so the comparison is implementation-vs-implementation, never name-vs-name.
    let valueNode = prop.value;
    if (valueNode.type === "Identifier" && topLevel.has(valueNode.name)) {
      valueNode = topLevel.get(valueNode.name);
    }
    into.set(name, bodyText(valueNode, text));
  }
}

function isSchemasFile(filename) {
  return /\.schemas(\.[A-Za-z0-9_]+)*\.ts$/.test(filename);
}

// An exported object literal is a factory SURFACE (its inner keys are members)
// only when its name reads as a scoped-composable layer object; a plain data /
// config constant (`SHARED_DEFAULTS`, `CLIENT_META`) is NOT a surface, so its
// keys must never be flattened into the comparison namespace.
function isSurfaceObjectName(name) {
  return (
    /(?:services|actions|context|meta)$/i.test(name) || /^create/i.test(name)
  );
}

/**
 * The exported public surface of a factory file: member name → comparable body.
 *
 * Services/actions/context/meta: the union of every exported factory's RETURNED
 * object members (a factory is any exported function/arrow, plus a named
 * services-object literal). Schemas: the exported parser NAMES (their return
 * object is a JSON Schema, not the layer's members), keyed with the declaration
 * body as the comparable text; a re-export barrel contributes its exported
 * names too.
 */
export function extractSurface(ast, text, filename) {
  const schemas = isSchemasFile(filename);
  const surface = new Map();
  const topLevel = indexTopLevel(ast);

  const harvestFactory = (node, name) => {
    if (schemas) {
      const body = node.type === "FunctionDeclaration" ? node.body : node;
      surface.set(name, normalizeBody(textOf(body, text)));
      return;
    }
    if (FN_TYPES.has(node.type)) {
      const obj = findReturnObject(node);
      if (obj) collectMembers(obj, text, topLevel, surface);
    } else if (node.type === "ObjectExpression" && isSurfaceObjectName(name)) {
      collectMembers(node, text, topLevel, surface);
    }
  };

  for (const node of ast.body) {
    if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) {
        const decl = node.declaration;
        if (decl.type === "VariableDeclaration") {
          for (const d of decl.declarations) {
            if (d.id.type === "Identifier" && d.init) {
              harvestFactory(d.init, d.id.name);
            }
          }
        } else if (decl.type === "FunctionDeclaration" && decl.id) {
          harvestFactory(decl, decl.id.name);
        }
      } else if (node.specifiers?.length) {
        // `export { x }` / `export { x } from "./y"` — a re-export barrel.
        for (const spec of node.specifiers) {
          const exported =
            spec.exported?.name ?? spec.exported?.value ?? spec.local?.name;
          if (!exported) continue;
          if (schemas) {
            surface.set(exported, ""); // parser name; body opaque across files
          } else if (!node.source && topLevel.has(spec.local?.name)) {
            harvestFactory(topLevel.get(spec.local.name), exported);
          } else {
            surface.set(exported, ""); // cross-file re-export — name only
          }
        }
      }
      continue;
    }

    if (node.type === "ExportDefaultDeclaration") {
      const d = node.declaration;
      if (FN_TYPES.has(d.type)) harvestFactory(d, "default");
      else if (d.type === "ObjectExpression")
        collectMembers(d, text, topLevel, surface);
      else if (d.type === "Identifier" && topLevel.has(d.name)) {
        harvestFactory(topLevel.get(d.name), "default");
      }
    }
  }

  return { keys: surface, schemas };
}

/**
 * The shared-factory delegate seam: a member whose body routes BY NAME to a
 * per-actor implementation via a `scoped<Something>(…scopeActor…)` call (e.g.
 * `scopedServices(context.scopeActor).authenticate(...)`). Anchored to a
 * scopeActor-taking `scoped*` call, NOT any identifier starting with "scoped".
 */
export function isDelegateSeam(valueText) {
  return /\bscoped[A-Z]\w*\s*\(\s*(?:[A-Za-z0-9_$.]+\.)?scopeActor\b/.test(
    valueText
  );
}
