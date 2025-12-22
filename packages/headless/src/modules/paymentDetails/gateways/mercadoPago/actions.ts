// --- external
import { AnyEventObject, assign } from "xstate";

// --- utils
import { useModelParser } from "../../../../utils";
import { useSchema, useUischema } from "./schemas";
import { MercadoPagoContext, MercadoPagoModel } from "./types";

// --- types

// -----------------------------------------------------------------------------
// override the macine actions to generate the schema, uischema and model

export default {
  setSchemas: assign({
    schema: (context: MercadoPagoContext) => useSchema(context),
    uischema: (context: MercadoPagoContext) => useUischema(context)
  }),

  setModel: assign({
    model: ({ schema, model }: MercadoPagoContext, { data }: AnyEventObject) =>
      useModelParser<MercadoPagoModel>(schema, data ?? model ?? {})
  })
};
