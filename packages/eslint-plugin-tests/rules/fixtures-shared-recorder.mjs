/**
 * @fileoverview `tests/fixtures-shared-recorder` — a module's recorder
 * (`<module>.fixtures.ts`) records through the shared `Generator` and takes
 * its tokens from the `auth` module (ADR 035, decision 3 and "Rejected": no
 * second recorder beside `Generator`).
 *
 * Three shapes are reported:
 *
 * - `noGenerator` — the file imports no `Generator` from the shared
 *   `test-fixtures/generator`. It records some other way.
 * - `noMintedToken` — the file imports no `mint<Actor>Token` from
 *   `auth/__tests__/auth.tokens`. It obtains its tokens some other way.
 * - `ownLogin` — a string or template literal names `oauth/access_token`. The
 *   file logs in by hand; token minting is the `auth` module's.
 *
 * Scoped (via `eslint.config.mjs`) to `packages/headless/src/modules/*\/__tests__/*.fixtures.ts`,
 * minus the modules that own token and transport behaviour.
 *
 * @module packages/eslint-plugin-tests/rules/fixtures-shared-recorder
 */

const GENERATOR_SOURCE = /(^|\/)test-fixtures\/generator$/;
const TOKENS_SOURCE = /(^|\/)auth\/__tests__\/auth\.tokens$/;
const MINT_NAME = /^mint\w*Token$/;
const LOGIN_ROUTE = "oauth/access_token";

/** The imported names of an import declaration's named specifiers. */
function importedNames(node) {
  return node.specifiers
    .filter(s => s.type === "ImportSpecifier")
    .map(s => s.imported.name ?? s.imported.value);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A module recorder records through the shared Generator and mints tokens through the auth module (ADR 035).",
      recommended: true
    },
    schema: [],
    messages: {
      noGenerator:
        "This recorder does not import `Generator` from `@upmind-automation/test-fixtures/generator`. Record through the shared Generator; a second recorder is rejected (ADR 035).",
      noMintedToken:
        "This recorder does not import a `mint<Actor>Token` from `auth/__tests__/auth.tokens`. Take tokens from the auth module.",
      ownLogin:
        "This recorder names `oauth/access_token`: it logs in by hand. Mint the token with `auth/__tests__/auth.tokens`."
    }
  },

  create(context) {
    let hasGenerator = false;
    let hasMintedToken = false;

    function checkText(node, text) {
      if (typeof text === "string" && text.includes(LOGIN_ROUTE)) {
        context.report({ node, messageId: "ownLogin" });
      }
    }

    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        const names = importedNames(node);
        if (GENERATOR_SOURCE.test(source) && names.includes("Generator")) {
          hasGenerator = true;
        }
        if (TOKENS_SOURCE.test(source) && names.some(n => MINT_NAME.test(n))) {
          hasMintedToken = true;
        }
      },
      Literal(node) {
        if (node.parent?.type === "ImportDeclaration") return;
        checkText(node, node.value);
      },
      TemplateElement(node) {
        checkText(node, node.value.cooked ?? node.value.raw);
      },
      "Program:exit"(program) {
        const loc = { line: 1, column: 0 };
        if (!hasGenerator) {
          context.report({ node: program, loc, messageId: "noGenerator" });
        }
        if (!hasMintedToken) {
          context.report({ node: program, loc, messageId: "noMintedToken" });
        }
      }
    };
  }
};
