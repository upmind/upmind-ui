import { get, find } from "lodash-es";
import type { FormComposable } from "@upmind-automation/headless-vue";

export const useSchemaComposable = (control: any): FormComposable => {
  const matchingField = find(
    get(control.value.schema, "properties", {}),
    property => get(property, "update") === control.value.path
  );

  if (matchingField) {
    const composable = get(matchingField, "use");
    if (composable && typeof composable === "function") {
      return composable(control.value.data);
    }
  }

  return {
    getModel: () => () => control.value.data,
    setDefault: async () => {},
    update: async () => {},
    input: async () => {},
    clear: () => {},
    stop: () => {},
    isReady: async () => true,
    state: () => null,
    context: () => null,
    errors: () => null,
    schema: () => null,
    uischema: () => null,
  };
};
