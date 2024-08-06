// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import basketMachine from "./basket.machine";

// --- utils
import { every, find, get, some } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(basketMachine, { devTools: true });

// --------------------------------------------------------
// methods
// --------------------------------------------------------
const exists = (items = [], mapping, context = null) => {
  context = context ? `${context}.` : "";
  return some(items, item =>
    every(mapping, (value, key) => {
      const itemValue = get(item, `${context}${key}`, get(item, key));
      const matches = itemValue == value;
      return matches;
    })
  );
};

export const useBasket = () => {
  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    getBasketId: () => service.getSnapshot()?.context?.basket?.id,

    // --- basket functions
    isReady: async () =>
      waitFor(service, state => ["shopping", "checkout"].some(state.matches), {
        timeout: Infinity, // infinity = no timeout
      }),

    clear: () => service.send({ type: "CLEAR" }),

    checkout: () => service.send({ type: "CHECKOUT" }),

    refresh: () => service.send({ type: "REFRESH" }),

    // --- item functions
    getItemsSnapshot: () => service.getSnapshot()?.context?.items || [],

    findItem: mapping =>
      find(service.getSnapshot()?.context?.items, basketItem =>
        every(mapping, (value, key) => {
          if (key == "id") {
            return basketItem.id == value;
          } else {
            return get(basketItem, `state.context.model.${key}`) == value;
          }
        })
      ),

    itemExists: mapping =>
      exists(
        service.getSnapshot()?.context?.items,
        mapping,
        "state.context.model"
      ),

    addItem: async ({
      id,
      product_id,
      quantity,
      term,
      attributes,
      options,
      provision_fields,
    }) => {
      // lets wait for our basket  to be ready for shopping
      return waitFor(service, state =>
        ["shopping", "checkout"].some(state.matches)
      ).then(async () => {
        // lets add the new product base don the provided config to the basket
        const mapping = {
          id,
          product_id,
          quantity,
          term,
          attributes,
          options,
          provision_fields,
        };
        service.send({
          type: "ADD",
          data: mapping,
        });

        // then wait/check for the new product actor to be configured
        // then send the update event to the basket
        const actor = find(service.getSnapshot()?.context?.items, basketItem =>
          every(mapping, (value, key) => {
            if (key == "id" && value) {
              return basketItem.id == value;
            } else {
              return get(basketItem, `state.context.model.${key}`) == value;
            }
          })
        );
        await waitFor(actor, actorState => actorState.matches("configured"));
        return actor;
      });
    },

    updateItem: async itemId => {
      service.send({ type: "UPDATE", data: { itemId } });
      return waitFor(service, state =>
        ["shopping.items.processed", "shopping.items.processing.error"].some(
          state.matches
        )
      ).then(state => {
        if (state.matches("shopping.items.processing.error")) {
          return Promise.reject();
        }
        return Promise.resolve();
      });
    },

    removeItem: itemId => {
      service.send({ type: "REMOVE", data: { itemId } });
    },

    updateTerm: ({ itemId, term }) =>
      service.send({ type: "UPDATE.TERM", data: { itemId, term } }),

    updateQuantity: ({ itemId, quantity }) =>
      service.send({ type: "UPDATE.QUANTITY", data: { itemId, quantity } }),

    updateAttributes: ({ itemId, attributes }) =>
      service.send({ type: "UPDATE.ATTRIBUTES", data: { itemId, attributes } }),

    updateOptions: ({ itemId, options }) =>
      service.send({ type: "UPDATE.OPTIONS", data: { itemId, options } }),

    updateProvisioning: ({ itemId, provision_fields }) =>
      service.send({
        type: "UPDATE.PROVISIONING",
        data: { itemId, provision_fields },
      }),
    // ---
  };
};
