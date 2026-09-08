// -----------------------------------------------------------------------------
/**
 * @module tests/support/page-config
 * @description Reads a page CONFIG back through the one thing that identifies
 * a panel from outside: the data ref bound into it. A render cap (`maxItems`)
 * and a panel's own header control are config facts, not selector facts, so
 * they are provable nowhere else — and a config is authored as nested rows and
 * slots whose shape no consumer should have to know, hence the search rather
 * than an index path.
 */

import { isObject, isString } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import { isDataRef } from "~/portal/mock/data-refs";

export type ConfigNode = Readonly<Record<string, unknown>>;

function isConfigNode(value: unknown): value is ConfigNode {
  return isObject(value) && !Array.isArray(value);
}

function children(node: unknown): unknown[] {
  if (Array.isArray(node)) return node;
  if (isConfigNode(node)) return Object.values(node);
  return [];
}

function bindsRef(node: unknown, id: DataRefId): boolean {
  if (isDataRef(node)) return node.id === id;
  return children(node).some(child => bindsRef(child, id));
}

/** The nearest node whose OWN properties bind `id` — the module's props object. */
export function propsBinding(
  node: unknown,
  id: DataRefId
): ConfigNode | undefined {
  if (isConfigNode(node)) {
    const owns = Object.values(node).some(
      value => isDataRef(value) && value.id === id
    );
    if (owns) return node;
  }
  for (const child of children(node)) {
    const found = propsBinding(child, id);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** The page's own top-level row carrying `id` anywhere beneath it. */
export function rowBinding(
  page: unknown,
  id: DataRefId
): ConfigNode | undefined {
  if (!isConfigNode(page)) return undefined;
  const rows = page.rows;
  if (!Array.isArray(rows)) return undefined;
  const row = rows.find(candidate => bindsRef(candidate, id));
  if (!isConfigNode(row)) return undefined;
  return row;
}

/** Which data ref one property of a node is bound to, if it is bound to one. */
export function boundRefId(
  node: ConfigNode | undefined,
  key: string
): DataRefId | undefined {
  const value = node?.[key];
  if (!isDataRef(value)) return undefined;
  return value.id;
}

/** Every authored string beneath a node — a panel's labels, wherever they hang. */
export function stringsIn(node: unknown): string[] {
  if (isString(node)) return [node];
  return children(node).flatMap(stringsIn);
}
