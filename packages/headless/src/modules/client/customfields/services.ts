// --- external

// --- internal
import {
  useQuery,
  // useBrand,
  useSystem,
  useSession,
  // useFeedback,
  type QueryParams,
  useI18n
} from "../..";

// --- utils
import {
  useTime,
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  // useCollection,
  useModelParser,
  NotAuthenticatedError
} from "../../../utils";
// import { invalidateQueryByKey } from "../../query";
import {
  // mapAddress,
  mapCustomField
  // mapIAddress
} from "./mappers";
import {
  get,
  isString,
  isEmpty,
  find,
  some,
  pick,
  isArray,
  reduce,
  set
} from "lodash-es";

// --- types
import {
  // BrandConfigKeys,
  // type IAddress,
  CustomFieldsMajorTypes,
  ICustomField
} from "@upmind-automation/types";
import { useClientCustomFields } from "../customfields/useClientCustomFields";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type {
  // Address,
  // FieldsModel,
  FieldsContext,
  FieldsModel
} from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "customFields"];

function loadList(params: Partial<QueryParams> = { pagination: { limit: 0 } }) {
  const { meta, client } = useSession();
  const { list, useUrl } = useQuery();

  return list<ICustomField[]>({
    ...(params as any),
    queryKey,
    url: useUrl(`custom_fields`, {
      "filter[object_type]": CustomFieldsMajorTypes.CLIENT,
      order: "order"
    }),
    withAccessToken: true,
    // --- options
    select: mapCustomField,
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
   * @returns {Promise<Address[]>} A promise that resolves to the list of addresses
   */
  loadList

  //--- mutations
  /**
   * Removes a address by its ID.
   * @param {Address["id"]} addressId - The ID of the address to remove.
   * @returns {Promise<null>} A promise that resolves when the address is removed
   */
  // remove,

  /**
   * Sets a address as the default address.
   * @param {Address["id"]} addressId - The ID of the address to set as default.
   * @returns {Promise<IAddress>} A promise that resolves to the updated address
   */
  // setDefault
};
