/**
 * @fileoverview `file-responsibility/services-purity` — FE-3249 #2.
 *
 * ONLY in a services file (`*.services.ts`, or an actor arm), every TOP-LEVEL
 * function — EXPORTED OR NOT — must earn its place. It is one of exactly four
 * shapes, else it is a misplaced util that belongs in `.utils.ts`. A missing
 * `export` is no shield: a stray util hides just as easily behind a local
 * helper as behind an exported one (the FE-3031 gap).
 *
 *   (a) REQUEST — its body contains a `useQuery(` / `useMutation(`
 *       CallExpression (the HTTP seam).
 *   (b) MACHINE SERVICE — `isMachineServiceFn(fnNode)`: async, first param is
 *       the context (`context` / `_context`, `{ context }`, or a `*Context`
 *       type, including the context destructured into its fields).
 *   (c) FACTORY — returns an object literal that assembles services
 *       (`createClientAuthServices()` → `{ authenticate, … }`), or is annotated
 *       to return a `*Services` bag (`scopedServices` → `Partial<XServices>`).
 *       `auth/` is the reference implementation.
 *   (d) DELEGATE — its body calls a function imported from another module: the
 *       root callee of a CallExpression is an identifier imported (statically,
 *       or via a dynamic `import()`) from a source that either contains
 *       `service` (e.g. `../foo/foo.services`) OR is a bare sibling-module
 *       barrel `"../<name>"` (e.g. `useBasket` from `"../basket"`), OR names a
 *       function declared in the SAME file (in-file dispatch).
 *
 * DELEGATE BOUNDARY (decidable): an import source counts as a delegate origin
 * when it matches `/service/i` OR `^\.\.\/[A-Za-z0-9_-]+$` (a single-segment
 * `../<name>` barrel). Deeper relative paths (`../a/b`) and type-only imports do
 * NOT count. A call is a delegate when the ROOT identifier of its callee chain
 * (unwrapping `member.object` and `call.callee`, so `useBasket().fetch()` roots
 * at `useBasket`) is such an imported name.
 *
 * SCOPE: top-level functions — `function foo(){}` / `const foo = () => {}`,
 * exported or not. A function-scoped inner function is an implementation
 * detail, not top-level, so it stays out of scope to keep the check decidable.
 *
 * Grounding: the `packages/headless` module services files — request fns call
 * `useQuery()`; `auth.services.ts` exports `checkSession(context, _event)`;
 * delegate services call sibling composables imported from `"../<module>"`.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/services-purity
 */

import { isServicesFile, isMachineServiceFn, asFunctionNode } from "../util.mjs";

/** Query-seam callees that mark a request function. */
const QUERY_ENTRIES = new Set(["useQuery", "useMutation"]);

/** A single-segment sibling-module barrel: `../basket`, not `../a/b`. */
const SIBLING_BARREL_RE = /^\.\.\/[A-Za-z0-9_-]+$/;

/** True when an import source is a delegate origin (a services/sibling module). */
function isDelegateSource(source) {
  return /service/i.test(source) || SIBLING_BARREL_RE.test(source);
}

/**
 * Collect every top-level function NAME declared in the file: a
 * `function foo(){}` declaration, or a `const foo = () => …` / `const foo =
 * function(){}` initialiser. A services function that calls one of these
 * delegates in-file — `loadUser` dispatches to a local `loadStaffUser`, and
 * `mintGuestToken` delegates to a local `driveGuestMint`. That is orchestration,
 * not a misplaced util. A pure util roots its calls at a parameter
 * (`s.trim()`), never at a co-located function.
 */
function collectLocalFunctionNames(programBody) {
  const names = new Set();
  for (const stmt of programBody) {
    const decl =
      stmt.type === "ExportNamedDeclaration" && stmt.declaration
        ? stmt.declaration
        : stmt;
    if (decl.type === "FunctionDeclaration" && decl.id?.type === "Identifier") {
      names.add(decl.id.name);
      continue;
    }
    if (decl.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        if (asFunctionNode(d.init) && d.id?.type === "Identifier") {
          names.add(d.id.name);
        }
      }
    }
  }
  return names;
}

/** Collect every value-imported local name that comes from a delegate origin. */
function collectDelegateNames(programBody) {
  const names = new Set();
  for (const stmt of programBody) {
    if (stmt.type !== "ImportDeclaration") continue;
    // `import type { X } from ...` — a type import is never a runtime delegate.
    if (stmt.importKind === "type") continue;
    if (typeof stmt.source?.value !== "string") continue;
    if (!isDelegateSource(stmt.source.value)) continue;
    for (const spec of stmt.specifiers) {
      if (spec.importKind === "type") continue;
      if (spec.local?.type === "Identifier") names.add(spec.local.name);
    }
  }
  return names;
}

/** Depth-first walk of a subtree, collecting every node the predicate accepts. */
function collectNodes(root, predicate) {
  const found = [];
  const visit = node => {
    if (!node || typeof node.type !== "string") return;
    if (predicate(node)) found.push(node);
    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const value = node[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === "string") visit(child);
        }
      } else if (value && typeof value.type === "string") {
        visit(value);
      }
    }
  };
  visit(root);
  return found;
}

/** The root identifier of a callee chain, unwrapping members and inner calls. */
function rootCalleeName(callExpr) {
  let node = callExpr.callee;
  while (node) {
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression") {
      node = node.object;
      continue;
    }
    if (node.type === "CallExpression") {
      node = node.callee;
      continue;
    }
    return null;
  }
  return null;
}

/**
 * True when a function directly returns an object literal — the services
 * FACTORY shape (`createClientAuthServices()` returns `{ authenticate, … }`).
 * The factory assembles services; each member is a service in its own right.
 * `auth/` is the reference implementation for this shape.
 */
function isFactory(fnNode) {
  const body = fnNode.body;
  // An arrow with an expression body: `() => ({ … })`.
  if (body && body.type === "ObjectExpression") return true;
  if (!body || body.type !== "BlockStatement") return false;
  // A block body whose only concern is `return { … }`.
  return body.body.some(
    s =>
      s.type === "ReturnStatement" &&
      s.argument &&
      s.argument.type === "ObjectExpression"
  );
}

/**
 * True when a function is annotated to return a services bag — a `*Services`
 * type, bare or wrapped (`Partial<ClientAddressServices>`). This is the
 * scope-wiring factory (`scopedServices`) whose object returns sit inside a
 * `switch`, so `isFactory`'s direct-return check does not see them. The return
 * type is the reliable structural tell.
 */
function returnsServicesType(fnNode) {
  if (!fnNode.returnType) return false;
  const refs = collectNodes(fnNode.returnType, n => n.type === "TSTypeReference");
  return refs.some(
    ref =>
      ref.typeName?.type === "Identifier" && ref.typeName.name.endsWith("Services")
  );
}

/**
 * Names bound from a dynamic delegate import inside a function body — a
 * `const { useAuth } = await import("../auth")`. `driveGuestMint` reaches the
 * auth module this way to dodge a static cycle, so its `useAuth()` call is a
 * genuine delegate the static-import scan cannot see.
 */
function collectDynamicDelegateNames(fnNode) {
  const names = new Set();
  const decls = collectNodes(
    fnNode.body,
    n => n.type === "VariableDeclarator"
  );
  for (const d of decls) {
    let init = d.init;
    if (init?.type === "AwaitExpression") init = init.argument;
    if (init?.type !== "ImportExpression") continue;
    const src = init.source;
    if (src?.type !== "Literal" || typeof src.value !== "string") continue;
    if (!isDelegateSource(src.value)) continue;
    if (d.id?.type === "Identifier") names.add(d.id.name);
    if (d.id?.type === "ObjectPattern") {
      for (const p of d.id.properties) {
        if (p.type === "Property" && p.value?.type === "Identifier") {
          names.add(p.value.name);
        }
      }
    }
  }
  return names;
}

/** Classify an exported function body against the four allowed shapes. */
function isAllowed(fnNode, delegateNames, localFnNames) {
  const calls = collectNodes(fnNode.body, n => n.type === "CallExpression");

  // (a) REQUEST — an HTTP seam call.
  const isRequest = calls.some(
    c => c.callee.type === "Identifier" && QUERY_ENTRIES.has(c.callee.name)
  );
  if (isRequest) return true;

  // (b) MACHINE SERVICE — async, first param `context`.
  if (isMachineServiceFn(fnNode)) return true;

  // (c) FACTORY — returns an object literal of services (`create*Services`), or
  // is annotated to return a `*Services` bag (`scopedServices`).
  if (isFactory(fnNode) || returnsServicesType(fnNode)) return true;

  // (d) DELEGATE — calls a function imported from a services/sibling module
  // (statically or via a dynamic `import()`), OR a function declared in the
  // SAME file (in-file dispatch).
  const dynamicNames = collectDynamicDelegateNames(fnNode);
  const isDelegate = calls.some(c => {
    const name = rootCalleeName(c);
    return (
      name !== null &&
      (delegateNames.has(name) ||
        localFnNames.has(name) ||
        dynamicNames.has(name))
    );
  });
  return isDelegate;
}

/**
 * Every TOP-LEVEL function in the file, exported or not, paired with the node
 * to report against and an `exported` flag. A non-exported top-level helper is
 * governed too: a stray util hides just as easily behind a missing `export` as
 * behind one. A function-scoped inner function is an implementation detail and
 * is not top-level, so it is untouched.
 */
function collectTopLevelFunctions(programBody) {
  const fns = [];
  const add = (fnNode, id, reportNode, exported) => {
    if (!fnNode) return;
    fns.push({ fnNode, name: id?.name ?? "(anonymous)", reportNode, exported });
  };
  for (const stmt of programBody) {
    const exported =
      stmt.type === "ExportNamedDeclaration" && !!stmt.declaration;
    const decl = exported ? stmt.declaration : stmt;

    if (decl.type === "FunctionDeclaration") {
      add(decl, decl.id, decl, exported);
      continue;
    }
    if (decl.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        add(asFunctionNode(d.init), d.id, d, exported);
      }
    }
  }
  return fns;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "In a services file, every top-level function — exported or not — must be a request, a machine service, a factory, or a delegate; anything else is a misplaced util (FE-3249 #2).",
      recommended: true
    },
    schema: [],
    messages: {
      misplacedUtil:
        "Exported function `{{name}}` is a misplaced util. A services file exports only request functions (call `useQuery`/`useMutation`), machine services (`async fn(context, event)`), factories (return an object of services), or delegates (call an imported services/sibling-module function). Move `{{name}}` to `.utils.ts`.",
      misplacedLocalUtil:
        "Local function `{{name}}` is a misplaced util. A services file holds only request functions (call `useQuery`/`useMutation`), machine services (`async fn(context, event)`), factories (return an object of services), or delegates — a non-exported helper is no exception. Move `{{name}}` to `.utils.ts`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    // This rule governs services files only.
    if (!isServicesFile(filename)) return {};

    return {
      "Program:exit"(program) {
        const delegateNames = collectDelegateNames(program.body);
        const localFnNames = collectLocalFunctionNames(program.body);
        for (const { fnNode, name, reportNode, exported } of collectTopLevelFunctions(
          program.body
        )) {
          if (!isAllowed(fnNode, delegateNames, localFnNames)) {
            context.report({
              node: reportNode,
              messageId: exported ? "misplacedUtil" : "misplacedLocalUtil",
              data: { name }
            });
          }
        }
      }
    };
  }
};
