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

function load() {
  const { query, useUrl } = useQuery();

  return query<IClientTemplateSlot[], ClientTemplateSlot[]>({
    queryKey,
    url: useUrl("templates/client_area/slots", {
      limit: 0,
      with: ["category"].join(",")
    }),
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
