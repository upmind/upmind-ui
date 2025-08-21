// --- internal
import { type QueryParams, useQuery } from "../../../query";

// --- types
import type { QueryKey } from "@tanstack/vue-query";
import type { ClientAreaTemplate } from "./types";
import { ClientTemplateSlotCodes } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["clientTemplates", "templates"];

function load({
  code,
  objectId
}: Partial<QueryParams> & {
  code?: ClientTemplateSlotCodes;
  objectId?: string;
}) {
  const { useUrl, query } = useQuery();

  return query<ClientAreaTemplate>({
    queryKey: [...queryKey, { code, objectId }],
    url: useUrl(`templates/client_area/slots/${code}/render`, {
      object_id: objectId
    }),
    init: { method: "PATCH" },
    withAccessToken: true,
    retry: (_failureCount, error: any) => {
      return error.code < 400;
    }
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  load
};
