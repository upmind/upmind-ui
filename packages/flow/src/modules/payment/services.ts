// --- external

// --- internal
import { useApi } from "../..";

// --- utils

// --- types
import type { PaymentEvent, PaymentContext } from "./types";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(_context: PaymentContext, _event: PaymentEvent) {
  // TODO: load the order details
  return new Promise(resolve => {
    resolve({});
  });
}

// --------------------------------------------------------

// --------------------------------------------------------

// --------------------------------------------------------
// EXPORTS

export default {
  load
};
