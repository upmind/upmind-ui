/** @internal */
import {
  CustomFieldsMajorTypes,
  type ICustomField
} from "@upmind-automation/types";
import { useQuery } from "../query";
import { mapCustomField } from "./client-custom-fields.mappers";
import { useQuerySchema } from "./client-custom-fields.schemas";
import { useTime } from "../../utils";
import { map } from "lodash-es";
import type {
  CustomField,
  CustomFieldQueryModel
} from "./client-custom-fields.types";
import type { QueryKey } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "customFields"];

/**
 * The whole request state is the DECLARED query schema: `list()` constructs the
 * criteria from it and publishes it back on the handle, so there is no params
 * back door a caller could contradict it through. `filter[object_type]` stays
 * on the URL — it scopes WHICH collection this is, not how it is queried.
 */
function loadList(model?: Partial<CustomFieldQueryModel>) {
  const { list, useUrl } = useQuery();

  return list<ICustomField[], CustomField[], CustomFieldQueryModel>({
    criteria: { schema: useQuerySchema(), model },
    queryKey,
    url: useUrl(`custom_fields`, {
      "filter[object_type]": CustomFieldsMajorTypes.CLIENT
    }),
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
