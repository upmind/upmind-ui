// --- internal
import { useQuery } from "../../../query";

// --- utils
import { map } from "lodash-es";
import { useTime } from "../../../../utils";
import { parseClientSlot } from "./mappers";

// --- types
import type { QueryKey } from "@tanstack/vue-query";
import type { QueryParams } from "../../../query";
import type { ClientTemplateSlot } from "./types";
import type { IClientTemplateSlot } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["clientTemplates", "slots"];

function load(params?: Partial<QueryParams>) {
  const { list, useUrl } = useQuery();

  return list<IClientTemplateSlot[], ClientTemplateSlot[]>({
    ...(params as any),
    queryKey,
    url: useUrl("templates/client_area/slots", {
      with: ["category"].join(",")
    }),
    limit: 0,
    withAccessToken: true,
    // --- options
    select: data => map(data ?? [], parseClientSlot),
    staleTime: useTime().HOUR
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  load
};
