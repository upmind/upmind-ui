// --- external
import { assign } from "xstate";

// --- internal
import { useSchema, useUischema } from "./schemas";

// --- utils
import { useModelParser } from "../../../utils";
import { get, compact, isObject, toString } from "lodash-es";

// --- types
import { Phone, PhoneModel, type PhoneContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

export const useClientPhoneActions = () => {
  return {
    setMeta: assign({
      title: ({ model }: PhoneContext) => {
        const phone = get(model, "phone");
        if (isObject(phone)) return get(model, "phone.number", "");
        return phone;
      },
      description: ({ model, country }: PhoneContext) => {
        return compact([get(country, "name")]).join(" | ");
      }
    }),

    setSchemas: assign({
      schema: (context: PhoneContext) => useSchema(context),
      uischema: () => useUischema()
    }),

    setModel: assign({
      model: ({ schema, baseModel }: PhoneContext, { data }: AnyEventObject) =>
        useModelParser<PhoneModel, Phone>(schema, data, baseModel)
    }),

    refreshContext: assign({
      clientId: ({ clientId }: PhoneContext, { data }: AnyEventObject) => {
        return clientId || data?.clientId;
      }
    })
  };
};

export const useClientPhoneGuards = () => {
  return {
    hasSubscription: ({ clientId }: PhoneContext, _event: AnyEventObject) =>
      !!clientId
  };
};
