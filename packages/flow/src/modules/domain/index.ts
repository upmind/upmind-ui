// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types.d";

// --- utils
import { useBasketHelper } from "..";
import { parseDomain } from "./utils";
import { has, find, isNil } from "lodash-es";

// --------------------------------------------------------

export const useDomain = (
  sync?: boolean,
  type?: DomainTypes,
  parent?: Object // machine representing the parent context
) => {
  // --------------------------------------------------------
  // create a new instance of the domain machine

  let state = null;

  // safetycheck to ensure forcedType is valid
  type = has(DomainTypes, type) ? type : null;

  const values = [];

  // if we have a parent...make sure we set the primaryDomain!
  if (parent?.state.value.context?.values?.provision_fields?.domain) {
    const domain = parseDomain(
      parent.state.value.context.values.provision_fields.domain
    );
    domain.is_primary = true;
    values.push(domain);
  }

  const context = {
    type,
    sync,
    // ---
    choices: type ? null : DomainTypes,
    values,
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
    devTools: false
  })
    .onTransition(newState => (state = newState))
    .start();

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
            basketItem?.term
        }
      };
    };

    const itemMapper = item => ({
      product_id: item.product_id,
      sld: item?.sld || item?.provision_fields?.sld
    });

    // ---

    const basketItemBuilder = item => {
      if (!item?.product_id) return null;
      return {
        product_id: item.product_id,
        quantity: 1,
        term: {
          billing_cycle_months: item.billing_cycle_months
        },
        options: item.options,
        provision_fields: {
          sld: item.sld
        }
      };
    };

    const basketItemMapper = item => ({
      product_id: item.product_id,
      "provision_fields.sld": item?.sld || item?.provision_fields?.sld
    });

    // ---

    let parentBuilder = null;
    let parentMapper = null;

    if (parent) {
      // ---
      parentBuilder = items => {
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
              domain: primaryDomain.domain
            }
          };
        }

        return config;
      };

      parentMapper = () => ({
        id: parent.id
      });
    }

    // ---

    useBasketHelper(
      service,
      [
        "register.valid",
        // ---
        "transfer.valid",
        // ---
        "existing.valid",
        // ---
        "basket.valid"
      ],
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
    getSnapshot: () => state,
    destroy: () => service.stop()
  };
};
