// --- internal
import { useApi } from "../api";

// --- utils

// --- types
import type {
  IBillingCycle,
  ICountry,
  ICurrency,
  ILanguage,
  IRegion,
  ITicketDepartment,
  IStatus,
} from "@upmind-automation/types";

import type { SystemContext } from "./types";
import { AnyEventObject } from "xstate";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// TODO: session type contextual/guest/client/admin endpoint logic
//       as we are only guest/client at this point, we can ignore this for now

async function fetchCurrencies(
  _context: SystemContext,
  _event: AnyEventObject
) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("currencies", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data as ICurrency[]);
}

async function fetchBillingCycles(
  _context: SystemContext,
  _event: AnyEventObject
) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("billing_cycles", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data as IBillingCycle[]);
}

async function fetchCountries(_context: SystemContext, _event: AnyEventObject) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("countries", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY,
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
    maxAge: useTime()?.DAY,
  }).then(
    ({ data }: any) => ({ key: code, values: data }) as Record<string, IRegion>
  );
}

async function fetchLanguages(_context: SystemContext, _event: AnyEventObject) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("languages", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY,
    withAccessToken: true,
  }).then(({ data }: any) => data as ILanguage[]);
}

async function fetchStatuses(_context: SystemContext, _event: AnyEventObject) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("statuses", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data as IStatus);
}

async function fetchDepartments(
  _context: SystemContext,
  _event: AnyEventObject
) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("tickets/departments", { limit: 0 }),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data as ITicketDepartment[]);
}

// --------------------------------------------------------
// EXPORTS

export default {
  fetchCurrencies,
  fetchBillingCycles,
  fetchCountries,
  fetchRegions,
  fetchLanguages,
  fetchStatuses,
  fetchDepartments,
};
