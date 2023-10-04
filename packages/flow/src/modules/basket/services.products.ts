// --- external

// --- internal
import { useApi } from "../api";
import { type BasketContext } from "./types";

// --- utils
import { random } from "lodash-es";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

// --------------------------------------------------------
//  Syntax sugar to manage Products (likely to move to a separate product machine, like requests)

async function add({ basket_id, product }, _event: any) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl(`/orders/${basket_id}/products`),
    data: product,
    withAccessToken: true
  });
}

async function update(context: BasketContext, _event: any) {}

async function remove(context: BasketContext, _event: any) {}

async function clear(context: BasketContext, _event: any) {}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  add,
  update,
  remove,
  clear
};
