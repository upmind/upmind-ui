// --- internal
import { localStoragePersister, useQuery } from "../..";

// --- utils
import { parseTerm } from "./mappers";
import { useTime } from "../../../utils";

// --- types
import type { TermsAndConditions } from "./types";
import type { ITermsAndConditions } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["brand", "terms"];

function load() {
  const { query, useUrl } = useQuery();

  // NB:We use the latest but in time we could get a specific version.
  // This would be the identifier that needs to be overridden/replaced by a param
  const id = "current";

  return query<ITermsAndConditions, TermsAndConditions>({
    queryKey,
    url: useUrl(`terms_and_conditions/${id}`),
    withAccessToken: true,
    // --- options
    select: data => parseTerm(data),
    staleTime: useTime().DAY,
    persister: localStoragePersister.persisterFn
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  load
};
