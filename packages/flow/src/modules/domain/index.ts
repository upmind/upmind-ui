// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types.d";

// --- utils
import { has } from "lodash-es";
import { useBasketHelper } from "..";

// --------------------------------------------------------

export const useDomain = (sync?: boolean, type?: DomainTypes) => {
  // --------------------------------------------------------
  // create a new instance of the domain machine
  // NB dont automatically start the machine as in order for the inspector to work
  // it needs to be started after the inspect service is created, so we only start it when we need it

  let state = null;

  // safetycheck to ensure forcedType is valid
  type = has(DomainTypes, type) ? type : null;

  const context = {
    type,
    sync,
    // ---
    choices: type ? null : DomainTypes,
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
    error: null
  };

  const service = interpret(domainMachine.withContext(context), {
    devTools: true
  })
    .onTransition(newState => (state = newState))
    .start();

  // --------------------------------------------------------
  // sync the basket with the domain machine

  if (sync) {
    const itemBuilder = basketItem => {
      return {
        product_id: basketItem.product_id,
        quantity: basketItem.quantity,
        tld: basketItem?.name,
        sld: basketItem?.provision_fields?.sld,
        term: {
          billing_cycle_months:
            basketItem?.billing_cycle_months ||
            basketItem?.term?.billing_cycle_months ||
            basketItem?.term
        }
      };
    };

    const itemMapper = item => ({
      product_id: item.product_id,
      sld: item?.sld || item?.provision_fields?.sld
    });

    const basketItemBuilder = item => {
      return {
        product_id: item.product_id,
        quantity: 1,
        term: {
          billing_cycle_months: item.billing_cycle_months
        },
        provision_fields: {
          sld: item.sld
        }
      };
    };

    const basketItemMapper = item => ({
      product_id: item.product_id,
      "provision_fields.sld": item?.sld || item?.provision_fields?.sld
    });

    useBasketHelper(
      service,
      [
        "register.valid",
        "transfer.valid",
        "register.available",
        "transfer.available"
      ],
      "values",
      // ---
      basketItemMapper,
      basketItemBuilder,
      // ---
      itemMapper,
      itemBuilder
    );
  }
  // --------------------------------------------------------

  return {
    service, // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state
  };
};
