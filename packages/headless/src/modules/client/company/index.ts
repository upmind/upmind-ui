// --- external

// --- internal
import company from "./services";
import { useSession } from "../../session";
import { QueryObserver } from "../../query";

// --- utils
import { find, filter, includes } from "lodash-es";

// --- types
import { QueryCacheNotifyEvent } from "@tanstack/query-core";
import { Company, UseClientCompany } from "./types";

// -----------------------------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let companyObserver: QueryObserver | undefined;

const subscribeToClientCompanies = ({
  clientId,
  callback,
}: {
  clientId: string;
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!companyObserver) {
    companyObserver = new QueryObserver({
      queryKey: ["clients", clientId, "companies"],
    });
  }

  return companyObserver.subscribe(data => {
    if (
      data.query.state.fetchStatus === "idle" &&
      data.query.state.status === "success"
    ) {
      callback(data);
    }
  });
};

// -----------------------------------------------------------------------------

export const useClientCompanies = (): UseClientCompany => {
  function isReady() {
    return new Promise<boolean>(async (resolve, reject) => {
      const { isAuthenticated } = useSession();
      const client = await isAuthenticated().catch(error => reject(error));

      subscribeToClientCompanies({
        clientId: client.id as string,
        callback: () => resolve(true),
      });
    });
  }

  async function getAllCompanies() {
    return company.loadAll();
  }

  async function getOneCompany(id: Company["id"]) {
    return getAllCompanies().then(item => find(item, ["id", id]));
  }

  async function findOneCompany(param: string) {
    return getAllCompanies().then(items =>
      find(
        items,
        item =>
          includes(item.name.toLowerCase(), param.toLowerCase()) ||
          includes(item.description.toLowerCase(), param.toLowerCase())
      )
    );
  }

  async function filterCompanies(param: string) {
    return getAllCompanies().then(items =>
      filter(
        items,
        item =>
          includes(item.name.toLowerCase(), param.toLowerCase()) ||
          includes(item.description.toLowerCase(), param.toLowerCase())
      )
    );
  }

  async function getDefaultCompany() {
    return getAllCompanies().then(items => find(items, "default"));
  }

  return {
    isReady,
    //--- getters
    getOne: getOneCompany,
    getAll: getAllCompanies,
    filter: filterCompanies,
    findOne: findOneCompany,
    getPaged: company.loadPaged,
    getDefault: getDefaultCompany,
    // --- actions
    add: company.add,
    update: company.update,
    remove: company.remove,
    setDefault: company.setDefault,
  };
};
