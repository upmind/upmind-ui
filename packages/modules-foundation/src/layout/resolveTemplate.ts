import { get, has } from "lodash-es";
import type { Component } from "vue";

export function resolveTemplate<T extends string>(
  templates: Record<T, Component>,
  fallback: T
): (template?: string) => Component {
  return (template: string = fallback): Component => {
    if (has(templates, [template])) return get(templates, [template]);

    return templates[fallback];
  };
}
