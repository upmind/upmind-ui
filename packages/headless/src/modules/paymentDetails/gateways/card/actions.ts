// --- external
import { assign } from "xstate";

// --- utils
import { useModelParser } from "../../../../utils";
import { useSchema, useUischema } from "./utils";

// --- types

// -----------------------------------------------------------------------------
// override the macine actions to generate the schema, uischema and model

export default {
  setSchemas: assign({
    schema: context => useSchema(context),
    // TODO: uischema: context => useUischema(context),
    uischema: () => useUischema()
  }),

  setModel: assign({
    model: ({ schema, model }: any, { data }: any) =>
      useModelParser(schema, data || model)
  })
};
