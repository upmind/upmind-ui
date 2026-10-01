import { computed } from "vue";
import {
  useCommissionsQuerySchema,
  useCommissionsSortUischema
} from "./affiliate.schemas";
import { mapToHeadlessError } from "../../utils";
import type { AffiliateCommissionsListQuery } from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateCommissions.context
 * @description Collection context — the reactive list and its criteria
 * surface. Row shape is `IAffiliatePendingCommission` (raw wire, no mapper —
 * design.md §5.1). Status derivation is `commissionTagStatus` /
 * `commissionSummaryStatus` in `affiliate.utils.ts`.
 */

const QUERY_SCHEMA = useCommissionsQuerySchema();
const SORT_UISCHEMA = useCommissionsSortUischema();

export function createAffiliateCommissionsContext(
  _actorScope: ScopeActorTypes,
  query: AffiliateCommissionsListQuery
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
