// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { useModelParser } from "../../../utils";
import { get, compact, isObject } from "lodash-es";

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
      description: (
        // TODO: { model, country, types }: PhoneContext,
        { model, country, types }: PhoneContext
      ) => {
        let type = get(model, "type");
        type = get(types, type);
        return compact([get(country, "name"), type?.value]).join(" | ");
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
