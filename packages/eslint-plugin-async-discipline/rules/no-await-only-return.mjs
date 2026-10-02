/**
 * async-discipline/no-await-only-return — never `await` only to return the value.
 *
 * `const x = await fn(); return x` adds a needless microtask tick and breaks the
 * chain. Return the promise: `return fn()`.
 *
 * Covers the VAR form only. The direct `return await fn()` form is fully owned by
 * @typescript-eslint/return-await ['error','never'], which is type-aware and also
 * catches the ternary/logical variants an AST-only check would miss. Pair the two.
 */

/** @type {import('eslint').Rule.RuleModule} */
const noAwaitOnlyReturn = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow awaiting a value only to return it — return the promise instead.",
    },
    schema: [],
    messages: {
      awaitOnlyReturn: "return the promise; don't await only to return it",
    },
  },
  create(context) {
    /**
     * Report the var form ONLY: a `const`/`let` declaration `x = await <expr>`
     * immediately followed by `return x`, where `x` is not referenced in
     * between (it can't be — they are adjacent — but we still confirm the
     * returned identifier is exactly the one just declared).
     *
     * The `return await <expr>` direct form is intentionally NOT handled here:
     * it is fully covered by @typescript-eslint/return-await ['error', 'never'],
     * which is type-aware and also catches the nested ternary/logical variants
     * (`return cond ? await a() : await b()`, `return (await a()) || b`) that an
     * AST-only check would miss. This rule covers only the var form, which
     * return-await does not see.
     *
     * Operates over statement lists (block bodies, program, switch cases) so
     * "immediately followed by" is checked positionally.
     *
     * The swallow is deliberate: a thrown rule breaks linting for the whole
     * file. The guarded loop does nothing but report, so the swallow masks no
     * other behaviour; on a malformed node we skip rather than crash.
     */
    function checkStatementList(statements) {
      try {
        for (let i = 0; i < statements.length - 1; i += 1) {
          const decl = statements[i];
          const next = statements[i + 1];

          // `const` and `let` are in scope; `var` is excluded (hoisting makes
          // the positional "immediately followed by" guard unsound).
          if (
            decl.type !== "VariableDeclaration" ||
            (decl.kind !== "const" && decl.kind !== "let") ||
            decl.declarations.length !== 1
          ) {
            continue;
          }
          const declarator = decl.declarations[0];
          if (
            !declarator.id ||
            declarator.id.type !== "Identifier" ||
            !declarator.init ||
            declarator.init.type !== "AwaitExpression"
          ) {
            continue;
          }

          if (
            next.type === "ReturnStatement" &&
            next.argument &&
            next.argument.type === "Identifier" &&
            next.argument.name === declarator.id.name
          ) {
            context.report({ node: decl, messageId: "awaitOnlyReturn" });
          }
        }
      } catch {
        // Never throw inside the rule — skip on the rare malformed node.
      }
    }

    return {
      BlockStatement(node) {
        checkStatementList(node.body);
      },
      Program(node) {
        checkStatementList(node.body);
      },
      SwitchCase(node) {
        checkStatementList(node.consequent);
      },
    };
  },
};

export default noAwaitOnlyReturn;
export { noAwaitOnlyReturn };
