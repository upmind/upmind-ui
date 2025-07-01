// --- internal
import { RequestSortDirection, useQuery } from "../..";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useTime
} from "../../utils";

// --- types
import type { IRegion } from "@upmind-automation/types";
import type { SystemContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// ENUMS

// ---  SERVICE METHODS
// Invoked by machines, providing context and event data

// TODO: session type contextual/guest/client/admin endpoint logic
//       as we are only guest/client at this point, we can ignore this for now

async function fetchCurrencies(
  _context: SystemContext,
  _event: AnyEventObject
) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("currencies", { limit: 0 }),
    queryKey: ["system", "currencies"],
    staleTime: useTime()?.DAY
  });
}

async function fetchBillingCycles(
  _context: SystemContext,
  _event: AnyEventObject
) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("billing_cycles", { limit: 0 }),
    queryKey: ["system", "billing-cycles"],
    staleTime: useTime()?.DAY
  });
}

async function fetchCountries(_context: SystemContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("countries", { limit: 0 }),
    queryKey: ["system", "countries"],
    sort: [RequestSortDirection.ASC, "name"],
    staleTime: useTime()?.DAY
  });
}

async function fetchRegions(
  _context: SystemContext,
  { data: { code, id } }: any
) {
  const { get, useUrl } = useQuery();

  if (!code || !id)
    return Promise.reject(
      new DetailedError(
        "[headless] No code or id provided",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  return get<any>({
    url: useUrl(`countries/${id}/regions`, { limit: 0 }),
    queryKey: ["system", "regions", code],
    staleTime: useTime()?.DAY
  }).then(data => ({ key: code, values: data }) as Record<string, IRegion>);
}

async function fetchLanguages(_context: SystemContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("languages", { limit: 0 }),
    queryKey: ["system", "languages"],
    staleTime: useTime()?.DAY,
    withAccessToken: true
  });
}

async function fetchStatuses(_context: SystemContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("statuses", { limit: 0 }),
    queryKey: ["system", "statuses"],
    staleTime: useTime()?.DAY
  });
}

async function fetchDepartments(
  _context: SystemContext,
  _event: AnyEventObject
) {
  const { get, useUrl } = useQuery();

  return get<any>({
    url: useUrl("tickets/departments", { limit: 0 }),
    queryKey: ["system", "departments"],
    staleTime: useTime()?.DAY
  });
}

// -----------------------------------------------------------------------------

export default {
  fetchCurrencies,
  fetchBillingCycles,
  fetchCountries,
  fetchRegions,
  fetchLanguages,
  fetchStatuses,
  fetchDepartments
};
