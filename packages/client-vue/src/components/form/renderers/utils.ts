import { get, find } from "lodash-es";

export const useSchemaComposable = (control: any) => {
  const matchingField = find(
    get(control.value.schema, "properties", {}),
    property =>
      get(property, "update") === control.value.path ||
      get(property, "create") === control.value.path
  );

  if (matchingField) {
    const composable = get(matchingField, "use");
    if (composable && typeof composable === "function") {
      const data = control.value.data;
      return composable(typeof data === "string" ? data : null);
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
    uischema: () => null
  };
};

export type FormComposable = ReturnType<typeof useSchemaComposable>;
