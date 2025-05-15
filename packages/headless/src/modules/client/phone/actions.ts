// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { useModelParser } from "../../../utils";
import { get, compact, isObject, toString } from "lodash-es";

// --- types
import type { PhoneContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useClientPhoneActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: PhoneContext) => {
        const phone = get(model, "phone");
        if (isObject(phone)) return get(model, "phone.number");
        return get(model, "international_phone");
      },
      description: ({ model, country, types }: PhoneContext) => {
        let typeKey = get(model, "type");
        // Convert type to string before using it as a path
        const typeStr = toString(typeKey);
        const typeObj = types ? get(types, typeStr) : undefined;
        return compact([get(country, "name"), typeObj?.value]).join(" | ");
      },
    }),

    setSchemas: assign({
      schema: (context: PhoneContext) => useSchema(context),
      uischema: () => useUischema(),
    }),

    setModel: assign({
      model: ({ schema, baseModel }: PhoneContext, { data }: AnyEventObject) =>
        useModelParser(schema, data, baseModel),
    }),
  };
};
