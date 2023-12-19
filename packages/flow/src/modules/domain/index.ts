// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types.d";

// --- utils
import { has, find, get, set } from "lodash-es";
import { useBasketHelper } from "..";

// --------------------------------------------------------

export const useDomain = (
  sync?: boolean,
  type?: DomainTypes,
  parent?: string
) => {
  // --------------------------------------------------------
  // create a new instance of the domain machine

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
  // sync the basket with the domain machine and any parent machines

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

    // ---

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

    // ---

    let parentBuilder = null;
    let parentMapper = null;

    if (parent) {
      parentBuilder = items => {
        const primaryDomain = find(items, "is_primary");
        const config = !!primaryDomain?.domain && {
          provision_fields: {
            domain: primaryDomain.domain
          }
        };

        return config;
      };

      parentMapper = () => ({
        id: parent
      });
    }

    // ---

    useBasketHelper(
      service,
      [
        "register.valid",
        "transfer.valid",
        "register.available",
        "transfer.available",
        "basket.valid",
        "basket.available"
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
    getSnapshot: () => state
  };
};
