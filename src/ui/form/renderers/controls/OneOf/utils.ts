import { get, set, intersection, flatMap, cloneDeep } from "lodash-es";
import { createDefaultValue } from "@jsonforms/core";

/**
 * Prepares data when switching between tabs in a OneOf control.
 * Stores current tab data, retrieves or creates data for the new tab,
 * and transfers matching property values between schemas.
 */
export const prepareDataForTabSwitch = (
  control: any,
  storedModels: Record<number, any>,
  oldIndex: number,
  newIndex: number,
  schemas: {
    [index: number]: {
      schema: any;
    };
  }
): { newData: any; updatedStorage: Record<number, any> } => {
  const updatedStorage = { ...storedModels, [oldIndex]: control.data };

  const newData =
    updatedStorage[newIndex] ||
    createDefaultValue(schemas[newIndex].schema, control.rootSchema);

  const finalData = transferMatchingSchemaValues(
    control.data,
    newData,
    schemas[oldIndex]?.schema,
    schemas[newIndex]?.schema
  );

  return {
    newData: finalData,
    updatedStorage,
  };
};

/**
 * Transfers values from source data to target data, but only for properties
 * that exist in both source and target schemas.
 */
export const transferMatchingSchemaValues = (
  sourceData: any,
  targetData: any,
  sourceSchema: any,
  targetSchema: any
): any => {
  const data = cloneDeep(targetData);

  const getSchemaPropertyPaths = (schema: any, prefix = ""): string[] => {
    if (!schema.properties) return [];

    return flatMap(
      Object.entries(schema.properties),
      ([key, prop]: [string, any]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return [
          path,
          ...(prop.properties ? getSchemaPropertyPaths(prop, path) : []),
        ];
      }
    );
  };

  const sourcePaths = getSchemaPropertyPaths(sourceSchema);
  const targetPaths = getSchemaPropertyPaths(targetSchema);

  intersection(sourcePaths, targetPaths).forEach(path => {
    const value = get(sourceData, path);
    if (value) {
      set(data, path, value);
    }
  });

  return data;
};
