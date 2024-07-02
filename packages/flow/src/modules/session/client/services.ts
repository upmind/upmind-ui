// --- internal
import { useApi } from "../../api";

// --- utils
import { isEmpty } from "lodash-es";
import { getTokenfromStorage, useUserParser } from "../utils";

// ---types
import type { ClientContext } from "./types.d";
// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function load(_context: ClientContext, _event: any) {
  // if we have a token, we are potentially authenticated
  // and we need to check the token/get the user

  const token = getTokenfromStorage("client");
  if (isEmpty(token)) return Promise.reject("No token found");

  const { get, useUrl } = useApi();

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
    withAccessToken: true,
  }).then(({ data }) => useUserParser(data?.actor));
}

async function transfer(_context: ClientContext, _event: any) {
  const { post, useUrl } = useApi();

  return post({
    url: useUrl("auth_code"),
    withAccessToken: true,
  }).then(({ data }) => data);
}
// --------------------------------------------------------
// EXPORTS

export default <Object>{
  load,
  transfer,
};
