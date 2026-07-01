/** @internal */
import {
  CustomFieldsMajorTypes,
  type ICustomField
} from "@upmind-automation/types";
import { RequestSortDirection, useQuery } from "../query";
import type { QueryParams } from "../query";
import { mapCustomField } from "./client-custom-fields.mappers";
import { useTime } from "../../utils";
import { map } from "lodash-es";
import type { CustomField } from "./client-custom-fields.types";
import type { QueryKey } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "customFields"];

function loadList(params: Partial<QueryParams> = { pagination: { limit: 0 } }) {
  const { list, useUrl } = useQuery();

  return list<ICustomField[], CustomField[]>({
    ...(params as any),
    queryKey,
    url: useUrl(`custom_fields`, {
      "filter[object_type]": CustomFieldsMajorTypes.CLIENT
    }),
    sort: [[RequestSortDirection.ASC, "order"]],
    withAccessToken: true,
    // --- options
    select: data => map(data ?? [], mapCustomField),
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
