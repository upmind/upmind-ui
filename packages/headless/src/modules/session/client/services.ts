// --- internal
import services from "../services";
import { useQuery } from "../..";

// --- utils
import { isEmpty } from "lodash-es";
import { getTokenFromStorage, useUserParser } from "../utils";

// ---types
import type { ClientContext } from "./types";
// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function load(_context: ClientContext, _event: any) {
  // if we have a token, we are potentially authenticated
  // and we need to check the token/get the user

  const token = getTokenFromStorage("client");
  if (isEmpty(token)) return Promise.reject("No token found");

  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("self", {
      with: [
        "actor",
        "accounts",
        // client specific only
        // "actor.account", // Relation required for determining `topup_enabled` value
        // "actor.brand", // Relation required for determining `topup_enabled` value
        // "delegated_ids",
        // "enabled_modules"
      ].join(),
    }),
    queryKey: ["session", "self"],
    withAccessToken: true,
  }).then(({ data }: any) => useUserParser(data?.actor));
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  transfer: services.transfer,
};
