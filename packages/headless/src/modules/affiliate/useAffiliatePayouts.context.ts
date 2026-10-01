import { computed } from "vue";
import {
  usePayoutsQuerySchema,
  usePayoutsSortUischema
} from "./affiliate.schemas";
import { mapToHeadlessError } from "../../utils";
import type { AffiliatePayoutsListQuery } from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayouts.context
 * @description Collection context — the reactive list and its criteria
 * surface. Rows are `AffiliatePayoutRow`, mapped via `mapAffiliatePayout`
 * (design.md D-34).
 */

const QUERY_SCHEMA = usePayoutsQuerySchema();
const SORT_UISCHEMA = usePayoutsSortUischema();

export function createAffiliatePayoutsContext(
  _actorScope: ScopeActorTypes,
  query: AffiliatePayoutsListQuery
) {
  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  return {
    data: query.data,
    error,
    pagination: query.pagination,
    query: query.criteria,
    schemas: {
      query: {
        schema: QUERY_SCHEMA,
        sortUischema: SORT_UISCHEMA
      }
    }
  };
}
