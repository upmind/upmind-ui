import { computed } from "vue";
import {
  useReferralsQuerySchema,
  useReferralsQueryUischema,
  useReferralsSortUischema
} from "./affiliate.schemas";
import { mapToHeadlessError } from "../../utils";
import type { AffiliateReferralsListQuery } from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateReferrals.context
 * @description Collection context — the reactive list and its criteria surface.
 * Row shape is `IAffiliateReferral` (raw wire, no mapper — design.md §5.1).
 */

const QUERY_SCHEMA = useReferralsQuerySchema();
const QUERY_UISCHEMA = useReferralsQueryUischema();
const SORT_UISCHEMA = useReferralsSortUischema();

export function createAffiliateReferralsContext(
  _actorScope: ScopeActorTypes,
  query: AffiliateReferralsListQuery
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
        uischema: QUERY_UISCHEMA,
        sortUischema: SORT_UISCHEMA
      }
    }
  };
}
