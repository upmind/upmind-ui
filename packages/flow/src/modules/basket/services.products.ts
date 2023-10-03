// --- external

// --- internal
import { useApi } from "../api";
import { type BasketContext } from "./types";

// --- utils

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

// --------------------------------------------------------
//  Syntax sugar to manage Products (likely to move to a separate product machine, like requests)

async function add(context: BasketContext, _event: any) {}

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
