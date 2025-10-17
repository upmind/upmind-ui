// --- external
import { AnyEventObject, assign } from "xstate";

// --- utils
import { useModelParser } from "../../../../utils";
import { useSchema, useUischema } from "./schemas";
import { OpenPayContext, OpenPayModel } from "./types";

// --- types

// -----------------------------------------------------------------------------
// override the macine actions to generate the schema, uischema and model

export default {
  setSchemas: assign({
    schema: (context: OpenPayContext) => useSchema(context),
    uischema: (context: OpenPayContext) => useUischema(context)
  }),

  setModel: assign({
    model: ({ schema, model }: OpenPayContext, { data }: AnyEventObject) =>
      useModelParser<OpenPayModel>(schema, data ?? model ?? {})
  })
};
