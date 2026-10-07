/** @internal */
// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import { map{Module}, map{Module}s } from "./module.mappers";
import { useQuerySchema } from "./module.schemas";
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes,
  useTime
} from "../../utils";
import type { ScopeActorTypes, ScopeContext } from "../scope";
import type {
  {Module},
  ModuleModel,
  ModuleServices,
  QueryModel
} from "./module.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { I{Module} } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module module/module.services
 * @description Module requests and the services factory.
 */

export const queryKey: QueryKey = ["module", "items"];

function loadList(clientId: ComputedRef<string | undefined>) {
  const { list, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();

  return list<I{Module}[], {Module}[], QueryModel>({
    url: useUrl(`clients/${clientId.value}/module-items`),
    queryKey: [...queryKey, { client: clientId.value }],
    criteria: { schema: useQuerySchema() },
    enabled: () => isAuthenticated.value && !!clientId.value,
    guard: async () => {
      if (!isAuthenticated.value || !clientId.value)
        throw new NotAuthenticatedError();
      return true;
    },
    retryDelay: DEBOUNCE_DELAY,
    select: map{Module}s,
    staleTime: useTime().DAY,
    withAccessToken: true
  });
}

function loadOne(clientId: ComputedRef<string | undefined>, id?: {Module}["id"]) {
  const { query, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { t } = useI18n();

  return query<I{Module}, {Module}>({
    url: useUrl(`module-items/${id}`),
    queryKey: [...queryKey, "item", id, { client: clientId.value }],
    enabled: () => !!id && isAuthenticated.value && !!clientId.value,
    guard: async () => {
      if (!isAuthenticated.value || !clientId.value)
        throw new NotAuthenticatedError();
      if (!id)
        throw new DetailedError(
          t("error.module_not_found"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      return true;
    },
    select: map{Module},
    staleTime: useTime().DAY,
    withAccessToken: true
  });
}

function login(model: ModuleModel): Promise<unknown> {
  const { post, useUrl } = useQuery();

  return post({
    mutationKey: [...queryKey, "login"],
    url: useUrl("module-items/login"),
    data: model,
    withAccessToken: true
  });
}
// -----------------------------------------------------------------------------
function scopedServices(scopeActor: ScopeActorTypes): Partial<ModuleServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

export function createModuleServices(
  scopeActor: ScopeActorTypes,
  scopeContext: ScopeContext | undefined,
  clientId: ComputedRef<string | undefined>
): ModuleServices {
  return {
    loadList: () => loadList(clientId),
    loadOne: id => loadOne(clientId, id),
    login,
    queryKey,
    ...scopedServices(scopeActor)
  };
}

export default createModuleServices;
