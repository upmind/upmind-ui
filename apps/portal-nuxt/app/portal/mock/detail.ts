// -----------------------------------------------------------------------------
/**
 * @module portal/mock/detail
 * @description A named detail page's own record, from the route's id. Legacy
 * headed a document with its NUMBER and a ticket with its SUBJECT — never the
 * internal id — so the heading comes from the record itself, and falls back to
 * the page's plain name where the dataset holds no such record, rather than
 * echoing an id that names nothing. The modules below already render their own
 * "No such …" empty state off the same absent record (`Spec.vue`).
 *
 * Heading and route context are SEPARATE computeds on purpose. The context
 * depends on the route alone, so a store mutation — paying the invoice being
 * viewed — leaves its identity untouched; sharing one computed with the
 * heading would invalidate it on every mutation, and the page host provides it,
 * so every module on the page would re-render.
 */

import { computed } from "vue";
import { injectActiveMockData } from "./injection";
import { find } from "lodash-es";
import type { DataRouteContext } from "./injection";
import type { MockDataset } from "./types";
import type { ComputedRef } from "vue";

export type MockDetail = {
  /** The page's route context — stable while the route is; the data refs key off `entityId`. */
  readonly routeContext: ComputedRef<DataRouteContext>;
  /** The record's own display name, or the page's plain name when nothing matches. */
  readonly heading: ComputedRef<string>;
};

export function useMockDetail<T extends { readonly id: string }>(
  select: (data: MockDataset) => readonly T[],
  label: (entity: T) => string,
  pageName: string
): MockDetail {
  const route = useRoute();
  const activeData = injectActiveMockData();

  const entityId = computed(() => String(route.params["id"]));
  const routeContext = computed<DataRouteContext>(() => ({
    entityId: entityId.value
  }));

  const heading = computed(() => {
    const data = activeData.value;
    if (data === undefined) return pageName;

    const entity = find(
      select(data),
      candidate => candidate.id === entityId.value
    );
    if (entity === undefined) return pageName;
    return label(entity);
  });

  return { routeContext, heading };
}
