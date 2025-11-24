// --- external

// --- internal
import { useQuery, type QueryParams } from "../..";

// --- utils
import { useTime } from "../../../utils";
import { mapCustomField } from "./mappers";

// --- types
import { CustomFieldsMajorTypes, ICustomField } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { CustomField } from "./types";
import { map } from "lodash-es";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "customFields"];

function loadList(params: Partial<QueryParams> = { pagination: { limit: 0 } }) {
  const { list, useUrl } = useQuery();

  return list<ICustomField[], CustomField[]>({
    ...(params as any),
    queryKey,
    url: useUrl(`custom_fields`, {
      "filter[object_type]": CustomFieldsMajorTypes.CLIENT,
      order: "order"
    }),
    withAccessToken: true,
    // --- options
    // select: data => map(data ?? [], mapCustomField),
    staleTime: useTime().DAY
  });
}
// -----------------------------------------------------------------------------

export default {
  /**
   * The query key used for caching and identifying address-related queries.
   * @type {QueryKey}
   */
  queryKey,

  //--- queries
  /**
   * Loads the address list.
   * @returns {Promise<CustomField[]>} A promise that resolves to the list of custom fields
   */
  loadList
};
