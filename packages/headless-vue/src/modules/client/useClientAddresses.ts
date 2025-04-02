// --- internal
import { useQuery } from "../query";
import {
  useClientAddress as useUpmindClientAddress,
  useClientAddresses as useUpmindClientAddresses,
} from "@upmind-automation/headless";

// --- utils

// -----------------------------------------------------------------------------

export const useClientAddresses = () => {
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)

  const {
    isReady,
    queryOptions,
    remove,
    setDefault,
    getDefault,
    getAllFromCache,
    getAll,
    filter,
    getOne,
    findOne,
    getPaged,
  } = useUpmindClientAddresses();

  const { error, meta, data } = useQuery(queryOptions.queryKey);
  // ---------------------------------------------------------------------------
  return {
    error,
    meta,
    data,
    // ---
    isReady,
    remove,
    setDefault,
    getDefault,
    getAllFromCache,
    getAll,
    filter,
    getOne,
    findOne,
    getPaged,
    invalidate: () => {},
  };
};
