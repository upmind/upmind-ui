// --- internal
import { useApi } from "../api";

// --- utils

// --- types
import type {
  SystemContext,
  SystemEvent,
  ICurrency,
  IBillingCycle,
  ICountry,
  IRegion,
  ILanguage,
  IStatuses,
  ITicketDepartment
} from "./types.d";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// TODO: session type contextual/guest/client/admin endpoint logic
//       as we are only guest/client at this point, we can ignore this for now

async function fetchCurrencies(_context: SystemContext, _event: SystemEvent) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("currencies", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data as ICurrency[]);
}

async function fetchBillingCycles(
  _context: SystemContext,
  _event: SystemEvent
) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("billing_cycles", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data as IBillingCycle[]);
}

async function fetchCountries(_context: SystemContext, _event: SystemEvent) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("countries", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data as ICountry[]);
}

async function fetchRegions(
  _context: SystemContext,
  { data: { code, id } }: any
) {
  const { get, useUrl, useTime } = useApi();

  if (!code || !id) return Promise.reject("No code or id provided");

  return get({
    url: useUrl(`countries/${id}/regions`, { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(
    ({ data }: any) => ({ key: code, values: data }) as Record<string, IRegion>
  );
}

async function fetchLanguages(_context: SystemContext, _event: SystemEvent) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("languages", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY,
    withAccessToken: true
  }).then(({ data }: any) => data as ILanguage[]);
}

async function fetchStatuses(_context: SystemContext, _event: SystemEvent) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("statuses", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data as IStatuses);
}

async function fetchDepartments(_context: SystemContext, _event: SystemEvent) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("tickets/departments", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data as ITicketDepartment[]);
}

// --------------------------------------------------------
// admin only endpoints

// async function fetchSystemIPAddresses(_context: SystemContext, _event: SystemEvent) {
//   const { get, useUrl, useTime } = useApi();

//   return get({
//     url: useUrl("admin/system/ip_addresses", { limit: 0 }),
//     useCache: true,
//     maxAge: useTime()?.DAY,
//     withAccessToken: true
//   }).then(({ data }: any) => data);
// }

// async function fetchTaxBusinessTypes(_context: SystemContext, _event: SystemEvent) {
//   const { get, useUrl, useTime } = useApi();

//   return get({
//     url: useUrl("admin/tax_business_types", { limit: 0 }),
//     useCache: true,
//     maxAge: useTime()?.DAY
//   }).then(({ data }: any) => data);
// }

// --------------------------------------------------------
// EXPORTS

export default {
  fetchCurrencies,
  fetchBillingCycles,
  fetchCountries,
  fetchRegions,
  fetchLanguages,
  fetchStatuses,
  fetchDepartments
  // fetchSystemIPAddresses,
  // fetchTaxBusinessTypes
};
