/** @internal */
import { assign } from "xstate";
import { ScopeActorTypes } from "../scope/scope.types";
import { useI18n } from "../system-localisation";
import { useLinkSchema, useLinkUischema } from "./affiliate.schemas";
import {
  loadAffiliateLinkOne,
  loadSelfBrandName,
  saveAffiliateLink
} from "./affiliate.services";
import { isClientScopeActor } from "./affiliate.utils";
import { useClientAffiliate } from "./useClientAffiliate";
import { useModelParser } from "../../utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { get } from "lodash-es";
import type { dataManagerMachine } from "../data-manager";
import type {
  AffiliateLinkFormModel,
  AffiliateLinkManagerContext
} from "./affiliate.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module affiliate/useAffiliateLinkManager.machine
 * @description The `dataManagerMachine.withConfig(...)` payload for the link
 * manager (design.md §8.4 Editors, §8.6). The module owns no machine of its
 * own (D-2).
 */

async function loadLookups(
  context: AffiliateLinkManagerContext,
  actorScope: ScopeActorTypes
): Promise<Partial<AffiliateLinkManagerContext>> {
  const { t } = useI18n();

  if (!isClientScopeActor(actorScope)) {
    return Promise.reject(
      new DetailedError(
        t("error.affiliate_link_not_available"),
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    );
  }

  const accountId = context.accountId;
  if (!accountId) {
    return Promise.reject(
      new DetailedError(
        t("error.affiliate_link_not_available"),
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    );
  }

  if (context.id) {
    const [link, brandName] = await Promise.all([
      loadAffiliateLinkOne(accountId, context.id),
      loadSelfBrandName()
    ]);
    const model: AffiliateLinkFormModel = {
      name: link?.name ?? "",
      redirectUrl: link?.redirect_url ?? ""
    };
    return { model, baseModel: model, brandName };
  }

  const clientAffiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
  const [isReady, brandName] = await Promise.all([
    clientAffiliate.useActions().isReady(),
    loadSelfBrandName()
  ]);

  if (!isReady) {
    return Promise.reject(
      new DetailedError(
        t("error.affiliate_link_not_available"),
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    );
  }

  const defaultRedirectUrl =
    clientAffiliate.useContext().defaultRedirectUrl.value ?? "";
  const model: AffiliateLinkFormModel = {
    name: "",
    redirectUrl: defaultRedirectUrl
  };

  return { model, baseModel: {}, defaultRedirectUrl, brandName };
}

export function createAffiliateLinkManagerMachineConfig(
  actorScope: ScopeActorTypes
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      setMeta: assign({
        title: ({ model }: AffiliateLinkManagerContext) =>
          model?.name || "Link",
        description: () => ""
      }),

      setSchemas: assign({
        schema: () => useLinkSchema(),
        uischema: () => useLinkUischema()
      }),

      setModel: assign(
        (
          { id, schema, baseModel }: AffiliateLinkManagerContext,
          { data }: AnyEventObject
        ) => {
          const raw = data as
            | { id?: string; name?: string; redirect_url?: string }
            | undefined;
          const incoming = raw?.redirect_url
            ? { name: raw.name ?? "", redirectUrl: raw.redirect_url }
            : (get(data, "model", data) as Partial<AffiliateLinkFormModel>);

          return {
            model: useModelParser<AffiliateLinkFormModel>(
              schema,
              incoming,
              baseModel
            ),
            id: id || raw?.id
          };
        }
      ),

      refreshContext: assign({
        accountId: (
          { accountId }: AffiliateLinkManagerContext,
          { data }: AnyEventObject
        ) => accountId || data?.accountId
      })
    },

    guards: {
      hasSubscription: (context: AffiliateLinkManagerContext) =>
        !!context.accountId || !isClientScopeActor(actorScope)
    },

    services: {
      loadLookups: context => loadLookups(context, actorScope),

      parse: (
        { schema, baseModel }: AffiliateLinkManagerContext,
        { data }: AnyEventObject
      ) =>
        Promise.resolve({
          model: useModelParser<AffiliateLinkFormModel>(
            schema,
            get(data, "model", data),
            baseModel
          )
        }),

      validate: () => Promise.resolve(undefined),

      add: ({ model, accountId }: AffiliateLinkManagerContext) =>
        accountId && model
          ? saveAffiliateLink(accountId, undefined, model)
          : Promise.reject(
              new DetailedError(
                useI18n().t("error.affiliate_link_not_available"),
                responseCodes.No_Content,
                ErrorOrigin.Headless
              )
            ),

      update: ({ id, model, accountId }: AffiliateLinkManagerContext) =>
        id && accountId && model
          ? saveAffiliateLink(accountId, id, model)
          : Promise.reject(
              new DetailedError(
                useI18n().t("error.affiliate_link_not_available"),
                responseCodes.No_Content,
                ErrorOrigin.Headless
              )
            )
    }
  };
}

export type AffiliateLinkManagerMachineConfig = ReturnType<
  typeof createAffiliateLinkManagerMachineConfig
>;
