/** @internal */
import { Store } from "@tanstack/vue-store";
import {
  useQuery,
  RequestSortDirection,
  localStoragePersister,
  storePersister
} from "../query";
import { useI18n } from "../system-localisation";
import type { QueryParams } from "../query";
import {
  useTime,
  ErrorOrigin,
  responseCodes,
  DetailedError
} from "../../utils";
import type {
  IRegion,
  IStatus,
  ICountry,
  ICurrency,
  ILanguage,
  IBillingCycle,
  ITicketDepartment
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const regionsStore = new Store<Record<string, IRegion[]>>({});

// ---  SERVICE METHODS

function fetchCurrencies() {
  const { query, useUrl } = useQuery();

  return query<ICurrency[]>({
    url: useUrl("currencies"),
    queryKey: ["system", "currencies", { limit: 0 }],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchBillingCycles() {
  const { query, useUrl } = useQuery();
  return query<IBillingCycle[]>({
    url: useUrl("billing_cycles", { limit: 0 }),
    queryKey: ["system", "billing-cycles"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchCountries() {
  const { query, useUrl } = useQuery();

  return query<ICountry[]>({
    sort: [RequestSortDirection.ASC, "name"],
    url: useUrl("countries", { limit: 0 }),
    queryKey: ["system", "countries"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchRegions({
  data: { code, id }
}: Partial<QueryParams> & {
  data: { code: string; id: string };
}) {
  const { t } = useI18n();
  const { query, useUrl } = useQuery();

  if (!code || !id)
    throw new DetailedError(
      t("error.region_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );

  return query<IRegion[]>({
    url: useUrl(`countries/${id}/regions`, { limit: 0 }),
    queryKey: ["system", "regions", code],
    // --- options
    // select: data => parseRegion(data),
    staleTime: useTime()?.DAY,
    persister: storePersister(regionsStore, { append: code }).persisterFn
  });
}

function fetchLanguages() {
  const { query, useUrl } = useQuery();

  return query<ILanguage[]>({
    url: useUrl("languages", { limit: 0 }),
    queryKey: ["system", "languages"],
    withAccessToken: true,
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchStatuses() {
  const { query, useUrl } = useQuery();

  return query<IStatus[]>({
    url: useUrl("statuses", { limit: 0 }),
    queryKey: ["system", "statuses"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchDepartments() {
  const { query, useUrl } = useQuery();

  return query<ITicketDepartment[]>({
    url: useUrl("tickets/departments", { limit: 0 }),
    queryKey: ["system", "departments"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

// -----------------------------------------------------------------------------

export default {
  fetchRegions,
  fetchStatuses,
  fetchCountries,
  fetchLanguages,
  fetchCurrencies,
  fetchDepartments,
  fetchBillingCycles
  //--
};

export const stores = {
  regions: regionsStore
};
