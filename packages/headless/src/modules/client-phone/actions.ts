import { assign } from "xstate";
import { useSchema, useUischema } from "./client-phone.schemas";
import { useModelParser } from "../../utils";
import { get, compact, isObject } from "lodash-es";
import type { Phone, PhoneModel, PhoneContext } from "./client-phone.types";
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
      description: ({ model: _model, country }: PhoneContext) => {
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
