/**
 * @fileoverview `ui/token-classes` — only token utilities in class strings.
 *
 * In template class strings (`class="..."`, `:class="..."`) and in
 * `variants.ts` files, flag:
 *   - a `#hex` colour,
 *   - a Tailwind palette colour (`bg-gray-500`),
 *   - a bracket value (`w-[123px]`).
 * A bracket or paren value that reads a CSS variable is allowed
 * (`bg-(--bg-control-checked)`, `w-[var(--row)]`). When the option
 * `tokensManifest` names a readable token manifest (for example
 * `design-system/packages/tokens/dist/tokens.json`), the variable must be a
 * token named in its `semantic` or `contextual` sections.
 *
 * Variant prefixes (`hover:`, `data-[state=open]:`) are not values and are
 * never flagged.
 *
 * Valid:   `bg-surface text-body p-4 bg-(--bg-control-checked)`
 * Invalid: `bg-gray-500`, `text-[#fff]`, `w-[123px]`
 *
 * @module packages/eslint-plugin-ui/rules/token-classes
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PALETTE_CLASS = new RegExp(
  `^-?[a-z]+(?:-[a-z]+)*-(?:${PALETTE})-\\d{2,3}(?:/\\d+)?$`
);
const HEX = /#[0-9a-fA-F]{3,8}\b/;

const manifestCache = new Map();

/** The set of token names in the manifest, or null when unavailable. */
function loadTokenNames(manifestPath) {
  if (manifestCache.has(manifestPath)) return manifestCache.get(manifestPath);
  let names = null;
  const absolute = resolve(cwd(), manifestPath);
  if (existsSync(absolute)) {
    const manifest = JSON.parse(readFileSync(absolute, "utf8"));
    names = new Set([
      ...Object.keys(manifest.semantic ?? {}),
      ...Object.keys(manifest.contextual ?? {})
    ]);
  }
  manifestCache.set(manifestPath, names);
  return names;
}

/** The utility part of a class token: everything after the last top-level `:`. */
function utilityOf(token) {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i += 1) {
    const char = token[i];
    if (char === "[" || char === "(") depth += 1;
    else if (char === "]" || char === ")") depth -= 1;
    else if (char === ":" && depth === 0) cut = i;
  }
  return token.slice(cut + 1).replace(/^!/, "");
}

/** The problems with one class string: a list of `{ kind, token }`. */
function findProblems(text, tokenNames) {
  const problems = [];
  for (const token of text.split(/\s+/).filter(Boolean)) {
    const utility = utilityOf(token);
    const bracket = /-\[([^\]]*)\]/.exec(utility);
    const paren = /-\((--[\w-]+)[^)]*\)/.exec(utility);
    if (HEX.test(utility)) {
      problems.push({ kind: "hex", token });
    } else if (PALETTE_CLASS.test(utility)) {
      problems.push({ kind: "palette", token });
    } else if (paren) {
      if (tokenNames && !tokenNames.has(paren[1].slice(2))) {
        problems.push({ kind: "unknownToken", token });
      }
    } else if (bracket) {
      const variable = /var\(--([\w-]+)/.exec(bracket[1]);
      if (!variable) problems.push({ kind: "arbitrary", token });
      else if (tokenNames && !tokenNames.has(variable[1])) {
        problems.push({ kind: "unknownToken", token });
      }
    }
  }
  return problems;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Allow only token utilities in class strings: no hex, no palette colour, no arbitrary value.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: { tokensManifest: { type: "string" } },
        additionalProperties: false
      }
    ],
    messages: {
      hex: "`{{token}}` uses a hex colour. Use a token utility such as `bg-surface`.",
      palette:
        "`{{token}}` uses a palette colour. Use a token utility such as `text-body`.",
      arbitrary:
        "`{{token}}` uses an arbitrary value. Use a token utility, or a bracket value that reads a CSS variable.",
      unknownToken:
        "`{{token}}` reads a CSS variable that is not a token in the token manifest."
    }
  },

  create(context) {
    const manifestPath = context.options[0]?.tokensManifest;
    const tokenNames = manifestPath ? loadTokenNames(manifestPath) : null;

    function check(node, text) {
      for (const { kind, token } of findProblems(text, tokenNames)) {
        context.report({ node, messageId: kind, data: { token } });
      }
    }

    const filename = context.filename;
    const isVue = filename.endsWith(".vue");
    const isVariants = /(^|[/.])variants\.[cm]?ts$/.test(filename);

    if (isVariants) {
      return {
        Literal(node) {
          if (typeof node.value === "string") check(node, node.value);
        },
        TemplateElement(node) {
          check(node, node.value.cooked ?? "");
        }
      };
    }

    const services = context.sourceCode.parserServices;
    if (!isVue || !services || !services.defineTemplateBodyVisitor) return {};
    return services.defineTemplateBodyVisitor({
      "VAttribute[directive=false][key.name='class'] > VLiteral"(node) {
        check(node, node.value);
      },
      "VAttribute[directive=true][key.argument.name='class'] Literal"(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      "VAttribute[directive=true][key.argument.name='class'] TemplateElement"(
        node
      ) {
        check(node, node.value.cooked ?? "");
      }
    });
  }
};
