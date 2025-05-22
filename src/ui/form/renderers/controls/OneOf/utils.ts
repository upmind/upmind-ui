import { createCombinatorRenderInfos } from "@jsonforms/core";
import type { CombinatorSubSchemaRenderInfo } from "@jsonforms/core";

/**
 * Creates indexed render information for oneOf schemas
 */
export const createIndexedOneOfRenderInfos = (
  control: any
): (CombinatorSubSchemaRenderInfo & {
  index: number;
})[] => {
  const oneOfUiSchemas = control.uischema.options?.oneOfUiSchema;

  const result = createCombinatorRenderInfos(
    control.schema.oneOf!,
    control.rootSchema,
    "oneOf",
    control.uischema,
    control.path,
    control.uischemas
  );

  return result
    .filter(info => info.uischema)
    .map((info, index) => {
      if (oneOfUiSchemas && oneOfUiSchemas[index]) {
        return {
          ...info,
          uischema: oneOfUiSchemas[index],
          index: index,
        };
      }
      return { ...info, index: index };
    });
};
