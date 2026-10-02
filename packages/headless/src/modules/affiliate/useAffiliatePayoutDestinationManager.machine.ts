/** @internal */
import { assign } from "xstate";
import { invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  usePayoutDestinationSchema,
  usePayoutDestinationUischema
} from "./affiliate.schemas";
import {
  AFFILIATE_ACCOUNT_QUERY_KEY,
  loadAffiliateAccount,
  loadAffiliateClientEmails,
  loadAffiliatePayoutDestinations,
  saveAffiliatePayoutDestination
} from "./affiliate.services";
import { isClientScopeActor, preselectPaypalEmail } from "./affiliate.utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import { get } from "lodash-es";
import type { dataManagerMachine } from "../data-manager";
import type {
  AffiliatePayoutDestinationFormModel,
  AffiliatePayoutDestinationManagerContext
} from "./affiliate.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module affiliate/useAffiliatePayoutDestinationManager.machine
 * @description The `dataManagerMachine.withConfig(...)` payload for the
 * payout destination manager (design.md §8.4 Editors, §8.6, D-40). The
 * module owns no machine of its own (D-2).
 */

function notAvailableError(): DetailedError {
  return new DetailedError(
    useI18n().t("error.affiliate_payout_destination_not_available"),
    responseCodes.No_Content,
    ErrorOrigin.Headless
  );
}

async function loadLookups(
  context: AffiliatePayoutDestinationManagerContext,
  actorScope: ScopeActorTypes
): Promise<Partial<AffiliatePayoutDestinationManagerContext>> {
  if (!isClientScopeActor(actorScope))
    return Promise.reject(notAvailableError());

  const accountId = context.accountId;
  if (!accountId) return Promise.reject(notAvailableError());

  const { activeUser } = useActiveSession().useContext();
  const clientId = activeUser.value?.id;

  const account = await loadAffiliateAccount(accountId);
  const brandId = account?.account?.brand_id;

  // A failed destinations read or emails read leaves that lookup empty; the
  // seed still runs from the account (design.md §8.2 Failure surface) — so
  // each read is caught on its OWN, never through the shared `Promise.all`
  // rejection that would otherwise fail the whole seed.
  const [destinations, emails] = await Promise.all([
    brandId
      ? loadAffiliatePayoutDestinations(brandId).catch(() => [])
      : Promise.resolve([]),
    clientId
      ? loadAffiliateClientEmails(clientId).catch(() => [])
      : Promise.resolve([])
  ]);

  const seeded: AffiliatePayoutDestinationFormModel = {
    payoutDestinationId: account?.account?.affiliate_payout_destination_id,
    paypalEmailId: account?.account?.affiliate_payout_paypal_email_id
  };
  const model = preselectPaypalEmail(seeded, destinations, emails);

  return { model, baseModel: seeded, destinations, emails };
}

export function createAffiliatePayoutDestinationManagerMachineConfig(
  actorScope: ScopeActorTypes
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      setMeta: assign({
        title: () => "Payout destination",
        description: () => ""
      }),

      setSchemas: assign({
        schema: ({
          destinations,
          emails
        }: AffiliatePayoutDestinationManagerContext) =>
          usePayoutDestinationSchema({ destinations, emails }),
        uischema: () => usePayoutDestinationUischema()
      }),

      setModel: assign(
        (
          { model }: AffiliatePayoutDestinationManagerContext,
          { data }: AnyEventObject
        ) => ({
          model: {
            ...model,
            ...(data as Partial<AffiliatePayoutDestinationFormModel>)
          }
        })
      ),

      refreshContext: assign({
        accountId: (
          { accountId }: AffiliatePayoutDestinationManagerContext,
          { data }: AnyEventObject
        ) => accountId || data?.accountId
      })
    },

    guards: {
      hasSubscription: (context: AffiliatePayoutDestinationManagerContext) =>
        !!context.accountId || !isClientScopeActor(actorScope)
    },

    services: {
      loadLookups: context => loadLookups(context, actorScope),

      /**
       * `event.emails` is not part of the shared machine's `SET` contract —
       * `addEmail` (`useAffiliatePayoutDestinationManager.actions.ts`) smuggles
       * a fresh emails page through it so `setParsed`'s wholesale merge
       * (`data-manager.machine.ts`'s default) replaces `context.emails`
       * without a second `loading` cycle (design.md §8.6, "sends no `REFRESH`").
       *
       * The `loadLookups` done event carries the whole lookups result, with the
       * seeded form under `model`; a `SET` carries the bare form. Reading only
       * the form keeps lookup keys out of `model`, so a fresh seed reads clean.
       */
      parse: (
        {
          model,
          destinations,
          emails
        }: AffiliatePayoutDestinationManagerContext,
        event: AnyEventObject
      ) => {
        const nextEmails =
          (event as AnyEventObject & { emails?: typeof emails }).emails ??
          emails;
        return Promise.resolve({
          model: preselectPaypalEmail(
            {
              ...model,
              ...(get(
                event.data,
                "model",
                event.data
              ) as Partial<AffiliatePayoutDestinationFormModel>)
            },
            destinations,
            nextEmails
          ),
          emails: nextEmails
        });
      },

      validate: () => Promise.resolve(undefined),

      /**
       * This manager carries no `id` at all — it always edits the one pinned
       * account's destination in place, never a row. The default `isNew`
       * guard (`!id`) always resolves true, so every save reaches
       * `processing.adding`; `update` is wired identically so a machine
       * change to the guard never routes a save to a no-op.
       */
      add: (context: AffiliatePayoutDestinationManagerContext) =>
        savePayoutDestination(context),
      update: (context: AffiliatePayoutDestinationManagerContext) =>
        savePayoutDestination(context)
    }
  };
}

async function savePayoutDestination(
  context: AffiliatePayoutDestinationManagerContext
) {
  const { accountId, model } = context;
  if (!accountId || !model) return Promise.reject(notAvailableError());

  await saveAffiliatePayoutDestination(accountId, model);
  await invalidateQueryByKey([...AFFILIATE_ACCOUNT_QUERY_KEY, accountId], {
    exact: false
  })(undefined);

  return model;
}

export type AffiliatePayoutDestinationManagerMachineConfig = ReturnType<
  typeof createAffiliatePayoutDestinationManagerMachineConfig
>;
