/**
 * @fileoverview `scope-based/no-services-in-read-layers` — meta and context
 * derive from the state holder, never from the services object.
 *
 * In a `use<Module>.meta*.ts` or `use<Module>.context*.ts` file, a factory
 * `create<Module>Meta` / `create<Module>Context` (or an actor arm of either)
 * takes no services parameter. Only the actions factory may. A parameter counts
 * as a services parameter when its name is `service` or `services` (any case),
 * or its type name ends in `Services`.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-services-in-read-layers
 */

import { composableFile } from "../util.mjs";

/** The parameter's own name, or null for a pattern. */
function paramName(param) {
  const p = param.type === "AssignmentPattern" ? param.left : param;
  return p.type === "Identifier" ? p.name : null;
}

/** The referenced type name of a parameter, or null. */
function paramTypeName(param) {
  const p = param.type === "AssignmentPattern" ? param.left : param;
  const ref = p.typeAnnotation?.typeAnnotation;
  if (ref?.type === "TSTypeReference" && ref.typeName.type === "Identifier") {
    return ref.typeName.name;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a services parameter on a meta or context layer factory."
    },
    schema: [],
    messages: {
      servicesInReadLayer:
        "The {{layer}} layer takes no services. Derive it from the state holder; only the actions factory may receive `{{param}}`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const info = composableFile(filename);
    if (!info || (info.layer !== "meta" && info.layer !== "context")) return {};
    const layer = info.layer;
    const suffix = layer === "meta" ? "Meta" : "Context";

    function check(name, fn) {
      if (!/^create/.test(name) || !name.endsWith(suffix)) return;
      for (const param of fn.params) {
        const pName = paramName(param);
        const tName = paramTypeName(param);
        const isServices =
          (pName && /^services?$/i.test(pName)) ||
          (tName && /Services$/.test(tName));
        if (isServices) {
          context.report({
            node: param,
            messageId: "servicesInReadLayer",
            data: { layer, param: pName ?? tName }
          });
        }
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) check(node.id.name, node);
      },
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          check(node.id.name, node.init);
        }
      }
    };
  }
};
