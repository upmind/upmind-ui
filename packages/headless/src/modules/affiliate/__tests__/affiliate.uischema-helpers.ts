// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate — uischema and JSON-schema readers for the specs
 * that prove a published form can draw its controls.
 */
import type { JsonSchema } from "@jsonforms/core";

export type UischemaNode = {
  type?: string;
  scope?: string;
  i18n?: string;
  elements?: UischemaNode[];
  options?: Record<string, unknown>;
};

/** Every Control's `scope` in a uischema tree, as property-name segments. */
export function controlScopePaths(
  node: UischemaNode | undefined,
  out: string[][] = []
): string[][] {
  if (!node) return out;
  if (typeof node.scope === "string") {
    out.push(
      node.scope
        .replace(/^#\//, "")
        .split("/")
        .filter(segment => segment !== "properties")
    );
  }
  for (const child of node.elements ?? []) controlScopePaths(child, out);
  return out;
}

/** Whether a property-name path resolves to a declared property of `schema`. */
export function resolvesInSchema(
  schema: JsonSchema | undefined,
  path: string[]
): boolean {
  let node: JsonSchema | undefined = schema;
  for (const segment of path) {
    node = (node?.properties as Record<string, JsonSchema> | undefined)?.[
      segment
    ];
    if (!node) return false;
  }
  return true;
}

/**
 * The values a schema property accepts as a closed choice — its `enum`, or
 * the `const` of each `oneOf`/`anyOf` branch. `null` is left out.
 */
export function choiceValues(property: JsonSchema | undefined): unknown[] {
  if (!property) return [];
  const branches = [...(property.oneOf ?? []), ...(property.anyOf ?? [])];
  const values = [
    ...(property.enum ?? []),
    ...branches.flatMap(branch =>
      "const" in branch ? [branch.const] : (branch.enum ?? [])
    )
  ];
  return values.filter(value => value !== null);
}
