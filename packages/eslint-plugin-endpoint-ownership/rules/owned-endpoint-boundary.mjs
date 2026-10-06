/**
 * @fileoverview `endpoint-ownership/owned-endpoint-boundary`.
 *
 * The `brand` and `system` modules load their endpoints once at start-up. Any
 * other module that re-requests one of those endpoints forks the source of
 * truth and re-fetches data the store already holds. This rule reports a
 * request literal — passed to `useUrl(...)`, a `url:` property, or `fetch(...)`
 * — that targets an owned endpoint from outside the owning module.
 *
 * A match is by path PREFIX after normalising an optional leading `/` and an
 * optional `api/` segment. A template literal is matched on its leading static
 * quasi, so `` `countries/${id}/regions` `` is caught by the `countries` owner.
 *
 * The one exception: `session-transfer` runs in Express, outside the normal
 * Upmind start-up where `brand` loads, so it may request `brand/settings`.
 *
 * @module packages/eslint-plugin-endpoint-ownership/rules/owned-endpoint-boundary
 */

const OWNED_ENDPOINTS = [
  { path: "brand/settings", owner: "brand", use: "useBrand()" },
  { path: "config/brand/values", owner: "brand", use: "useBrand()" },
  { path: "org/modules", owner: "brand", use: "useBrand()" },
  { path: "config/organisation/values", owner: "brand", use: "useBrand()" },
  { path: "currencies", owner: "system", use: "useSystem()" },
  { path: "billing_cycles", owner: "system", use: "useSystem()" },
  { path: "countries", owner: "system", use: "useSystem()" },
  { path: "languages", owner: "system", use: "useSystem()" },
  { path: "statuses", owner: "system", use: "useSystem()" },
  { path: "tickets/departments", owner: "system", use: "useSystem()" }
];

const OWNER_DIR = /\/modules\/(brand|system)\//;
const SESSION_TRANSFER_DIR = /\/modules\/session-transfer\//;

/** Strip an optional leading `/` then an optional `api/` segment. */
function normalise(raw) {
  return raw.replace(/^\//, "").replace(/^api\//, "");
}

/** The owned endpoint a normalised path targets, or null. */
function matchEndpoint(pathStart) {
  const normalised = normalise(pathStart);
  return (
    OWNED_ENDPOINTS.find(
      e =>
        normalised === e.path ||
        normalised.startsWith(`${e.path}/`) ||
        normalised.startsWith(`${e.path}?`)
    ) ?? null
  );
}

/** The static leading path of a string or template literal argument, or null. */
function literalPathStart(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral") {
    const first = node.quasis[0];
    return first ? first.value.cooked : null;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid requesting a brand-owned or system-owned endpoint outside the brand/system modules; read it through useBrand()/useSystem() instead.",
      recommended: true
    },
    schema: [],
    messages: {
      ownedEndpoint:
        "`{{path}}` is a {{owner}}-owned endpoint. Do not request it here; read it through `{{use}}`, which the `{{owner}}` module loads once at start-up."
    }
  },

  create(context) {
    const filename = context.filename;
    if (OWNER_DIR.test(filename)) return {};
    const inSessionTransfer = SESSION_TRANSFER_DIR.test(filename);

    const check = argNode => {
      const pathStart = literalPathStart(argNode);
      if (pathStart == null) return;
      const match = matchEndpoint(pathStart);
      if (!match) return;
      if (inSessionTransfer && match.path === "brand/settings") return;
      context.report({
        node: argNode,
        messageId: "ownedEndpoint",
        data: { path: match.path, owner: match.owner, use: match.use }
      });
    };

    return {
      CallExpression(node) {
        const callee = node.callee;
        const name =
          callee.type === "Identifier"
            ? callee.name
            : callee.type === "MemberExpression" &&
                callee.property.type === "Identifier"
              ? callee.property.name
              : null;
        if (name === "useUrl" || name === "fetch") {
          check(node.arguments[0]);
        }
      },

      Property(node) {
        if (
          node.key.type === "Identifier" &&
          node.key.name === "url" &&
          !node.computed
        ) {
          check(node.value);
        }
      }
    };
  }
};
