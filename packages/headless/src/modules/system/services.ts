import { Store } from "@tanstack/vue-store";

// --- internal
import {
  useQuery,
  useSession,
  type QueryParams,
  RequestSortDirection,
  localStoragePersister,
  storePersister
} from "../..";

// --- utils
import {
  useTime,
  ErrorOrigin,
  responseCodes,
  DetailedError
} from "../../utils";

// --- types
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

function fetchCurrencies(
  { pagination, ...params }: Partial<QueryParams> = {
    pagination: {
      limit: 0,
      offset: 0
    }
  }
) {
  const { list, useUrl } = useQuery();

  return list<ICurrency[]>({
    ...(params as any),
    pagination,
    url: useUrl("currencies"),
    queryKey: ["system", "currencies"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchBillingCycles(
  { pagination, ...params }: Partial<QueryParams> = {
    pagination: {
      limit: 0,
      offset: 0
    }
  }
) {
  const { list, useUrl } = useQuery();
  return list<IBillingCycle[]>({
    ...(params as any),
    pagination,
    url: useUrl("billing_cycles"),
    queryKey: ["system", "billing-cycles"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchCountries(
  { pagination, ...params }: Partial<QueryParams> = {
    pagination: {
      limit: 0,
      offset: 0
    }
  }
) {
  const { list, useUrl } = useQuery();

  return list<ICountry[]>({
    sort: [RequestSortDirection.ASC, "name"],
    ...(params as any),
    pagination,
    url: useUrl("countries"),
    queryKey: ["system", "countries"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchRegions({
  data: { code, id },
  pagination,
  ...params
}: Partial<QueryParams> & {
  data: { code: string; id: string };
}) {
  const { list, useUrl } = useQuery();

  if (!code || !id)
    throw new DetailedError(
      "No code or id provided",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );

  return list<IRegion[]>({
    ...(params as any),
    pagination,
    url: useUrl(`countries/${id}/regions`),
    queryKey: ["system", "regions", code],
    // --- options
    // select: data => parseRegion(data),
    staleTime: useTime()?.DAY,
    persister: storePersister(regionsStore, { append: code }).persisterFn
  });
}

function fetchLanguages(
  { pagination, ...params }: Partial<QueryParams> = {
    pagination: {
      limit: 0,
      offset: 0
    }
  }
) {
  const { meta, user } = useSession();
  const { list, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    throw new DetailedError(
      "You must be authenticated to fetch languages",
      responseCodes.Unauthorized,
      ErrorOrigin.Headless
    );
  }

  return list<ILanguage[]>({
    ...(params as any),
    pagination,
    url: useUrl("languages"),
    queryKey: ["system", "languages"],
    withAccessToken: true,
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchStatuses(
  { pagination, ...params }: Partial<QueryParams> = {
    pagination: {
      limit: 0,
      offset: 0
    }
  }
) {
  const { list, useUrl } = useQuery();

  return list<IStatus>({
    ...(params as any),
    pagination,
    url: useUrl("statuses"),
    queryKey: ["system", "statuses"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchDepartments(
  { pagination, ...params }: Partial<QueryParams> = {
    pagination: {
      limit: 0,
      offset: 0
    }
  }
) {
  const { list, useUrl } = useQuery();

  return list<ITicketDepartment[]>({
    ...(params as any),
    pagination,
    url: useUrl("tickets/departments"),
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
