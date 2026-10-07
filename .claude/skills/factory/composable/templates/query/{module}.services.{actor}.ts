/** @internal */
// TEMPLATE FILE — scaffold only when this actor earns a services arm (ARMS.md).
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { map{Module}s } from "./module.mappers";
import { useQuerySchema } from "./module.schemas";
import { queryKey } from "./module.services";
import { DEBOUNCE_DELAY, NotAuthenticatedError, useTime } from "../../utils";
import type {
  {Module},
  ModuleModel,
  ModuleServices,
  QueryModel
} from "./module.types";
import type { I{Module} } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module module/module.services.client
 * @description Client-specific module requests.
 */

function loadClientList(clientId: ComputedRef<string | undefined>) {
  const { list, useUrl } = useQuery();
  const { isAuthenticated } = useActiveSession().useMeta();
  const includes = ["internal_notes", "flagged_by"];

  return list<I{Module}[], {Module}[], QueryModel>({
    url: useUrl(`clients/${clientId.value}/module-items`, {
      with: includes.join()
    }),
    // The includes widen the response, so they key the cache apart from the
    // shared read.
    queryKey: [...queryKey, { client: clientId.value }, { with: includes }],
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

function register(model: ModuleModel): Promise<unknown> {
  const { post, useUrl } = useQuery();

  return post({
    mutationKey: [...queryKey, "register"],
    url: useUrl("module-items/register"),
    data: model,
    withAccessToken: true
  });
}

function registerAsGuest(): Promise<unknown> {
  const { post, useUrl } = useQuery();

  return post({
    mutationKey: [...queryKey, "register-guest"],
    url: useUrl("module-items/register-guest"),
    withAccessToken: true
  });
}
// -----------------------------------------------------------------------------
export function createClientModuleServices(
  clientId: ComputedRef<string | undefined>
): Partial<ModuleServices> {
  return {
    loadList: () => loadClientList(clientId),
    register,
    registerAsGuest
  };
}
