import { get } from "lodash-es";
import type { FormComposable } from "@upmind-automation/headless-vue";

export const useSchemaComposable = (control: any): FormComposable => {
  const fieldSchema = get(
    control.value.schema,
    `properties.${control.value.path}`
  );
  const composable = get(fieldSchema, "use");

  if (composable && typeof composable === "function") {
    return (composable as any)() as FormComposable;
  }

  return {
    getModel: () => () => null,
    setDefault: async () => {},
    input: async () => {},
    clear: () => {},
    stop: () => {},
    isReady: async () => true,
    state: () => null,
    context: () => null,
    errors: () => null,
  };
};
