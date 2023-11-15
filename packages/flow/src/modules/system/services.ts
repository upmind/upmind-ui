// --- internal
import { useApi } from "../api";

// --- utils

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function fetchCurrencies(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("currencies", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function fetchBillingCycles(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("billing_cycles", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  fetchCurrencies,
  fetchBillingCycles
};
