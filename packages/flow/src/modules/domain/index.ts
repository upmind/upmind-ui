// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types.d";
export * from "./types.d";
// --- utils
import { useBasketHelper, useBasket } from "..";
import { has, find, map } from "lodash-es";

// --------------------------------------------------------

export const useDomain = ({
  sync,
  type,
  parentId,
}: {
  sync?: boolean;
  type?: DomainTypes;
  parentId?: Object; // id of basket item machine representing the parent context
}) => {
  // --------------------------------------------------------
  // create a new instance of the  domain machine

  // safetycheck to ensure forcedType is valid
  const safeType = has(DomainTypes, type) ? type : null;

  const context = {
    type: safeType,
    sync,
    // ---
    choices: safeType ? null : DomainTypes,
    values: [],
    available: [],
    total: 0,
    // ---
    search: null,
    currency: null,
    promotions: [],
    limit: 10,
    offset: 0,
    controller: null,
    // ---
    error: null,
  };

  const service = interpret(domainMachine.withContext(context), {
    devTools: true,
  }).start();

  // --------------------------------------------------------
  // Get the basket machine and watch for changes, ie basket is updated/refreshed
  // and get the currency and promotions to update our domain prices
  const { service: basket } = useBasket();

  basket.onTransition(state => {
    if (state.matches("shopping.refreshing.complete")) {
      // ---
      const currencyActor = state.context?.actors?.currency;
      const currency = currencyActor?.getSnapshot()?.context?.model?.code;
      // ---
      const promotionsActor = state.context?.actors?.promotions;
      const promotions =
        promotionsActor?.getSnapshot()?.context?.model?.promotions;

      // ---
      //  only refresh if the currency or promotions have changed
      if (
        (currency || promotions) &&
        (currency !== service.getSnapshot().context.currency ||
          promotions !== service.getSnapshot().context.promotions)
      ) {
        service.send({
          type: "REFRESH",
          data: {
            currency,
            promotions,
          },
        });
      }
      // ---
      // if (sync) {
      //   const itemActors = state.context?.items;
      //   const domains = map(itemActors, item => {
      //     return {
      //       product_id: item.getSnapshot().context.model.product_id,
      //       sld: item.getSnapshot().context.model.provision_fields.sld,
      //     };
      //   });
      // }
    }
  });
  // --------------------------------------------------------
  // sync the basket with the domain machine and any parent machines

  if (sync) {
    const itemBuilder = basketItem => {
      return {
        product_id: basketItem.product_id,
        options: basketItem.options,
        quantity: basketItem.quantity,
        tld: basketItem?.name,
        sld: basketItem?.provision_fields?.sld,
        term: {
          billing_cycle_months:
            basketItem?.billing_cycle_months ||
            basketItem?.term?.billing_cycle_months ||
            basketItem?.term,
        },
      };
    };

    const itemMapper = item => ({
      product_id: item.product_id,
      sld: item?.sld || item?.provision_fields?.sld,
    });

    // ---

    const basketItemBuilder = item => {
      if (!item?.product_id) return null;
      return {
        product_id: item.product_id,
        quantity: 1,
        term: {
          billing_cycle_months: item.billing_cycle_months,
        },
        options: item.options,
        provision_fields: {
          sld: item.sld,
        },
      };
    };

    const basketItemMapper = item => ({
      product_id: item.product_id,
      "provision_fields.sld": item?.sld || item?.provision_fields?.sld,
    });

    // ---

    // if we have a parent...make sure we set the primaryDomain!

    let parentBuilder = null;
    let parentMapper = null;

    if (parentId) {
      // debugger;

      // MAYBE we need to add the parents domain value to the values array
      //  but  we should be able t oget it from the basket.... so hence commented out
      // const parentModel = parent.getSnapshot().context.model;
      // debugger;
      // if (parentModel?.provision_fields?.domain) {
      //   const domain = parseDomain(parentModel.provision_fields.domain);
      //   debugger;
      //   if (domain) {
      //     set(domain, "is_primary", true);
      //     values.push(domain);
      //   }
      // }

      // ---
      parentBuilder = () => {
        const state = service.getSnapshot();
        let config = null;
        const primaryDomain = find(state?.context?.values, "is_primary");

        if (primaryDomain) {
          // ensure the domain is set as primary
          if (!primaryDomain.is_primary) {
            service.send({ type: "SELECT", data: primaryDomain.domain });
          }

          //finally, build the config for the parent machine with the primary domain
          config = {
            provision_fields: {
              domain: primaryDomain.domain,
            },
          };
        }

        return config;
      };

      parentMapper = () => ({
        id: parentId,
      });
    }

    // ---

    useBasketHelper(
      service,
      ["dac.valid", "existing.valid", "basket.valid"],
      "values",
      // ---
      basketItemMapper,
      basketItemBuilder,
      // ---
      itemMapper,
      itemBuilder,
      // ---
      parentMapper,
      parentBuilder
    );
  }
  // --------------------------------------------------------

  return {
    service, // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: service.getSnapshot,
    destroy: service.stop,
  };
};
