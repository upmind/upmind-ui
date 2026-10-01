import { computed } from "vue";
import {
  useLinksQuerySchema,
  useLinksQueryUischema,
  useLinksSortUischema
} from "./affiliate.schemas";
import { mapToHeadlessError } from "../../utils";
import type { AffiliateLinksListQuery } from "./affiliate.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliateLinks.context
 * @description Collection context — the reactive list and its criteria surface.
 * Row shape is `IAffiliateLink` (raw wire, no mapper — design.md §5.1).
 */

const QUERY_SCHEMA = useLinksQuerySchema();
const QUERY_UISCHEMA = useLinksQueryUischema();
const SORT_UISCHEMA = useLinksSortUischema();

export function createAffiliateLinksContext(
  _actorScope: ScopeActorTypes,
  query: AffiliateLinksListQuery,
  writeError: Ref<ResponseError | undefined>
) {
  const error = computed<ResponseError | undefined>(
    () =>
      writeError.value ??
      query.criteriaError.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  return {
    /** The reactive list of this scope's links (always an array). */
    data: query.data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /** This scope's ACTIVE request state (design.md §8.3). */
    query: query.criteria,

    /** The links criteria schema, uischema and sort uischema. */
    schemas: {
      query: {
        schema: QUERY_SCHEMA,
        uischema: QUERY_UISCHEMA,
        sortUischema: SORT_UISCHEMA
      }
    }
  };
}
