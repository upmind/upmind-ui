// --- internal
import services from "../services";
import { useI18n, useQuery } from "../..";

// --- utils
import { isEmpty } from "lodash-es";
import { getTokenFromStorage } from "../utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../../utils";

// ---types
import type { ClientContext } from "./types";

// -----------------------------------------------------------------------------

async function load(_context: ClientContext, _event: any) {
  // if we have a token, we are potentially authenticated
  // and we need to check the token/get the user
  const { t } = useI18n();

  const token = getTokenFromStorage("client");
  if (isEmpty(token))
    return Promise.reject(
      new DetailedError(
        t("error.token_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  const { get, useUrl } = useQuery();

  return get({
    url: useUrl("self", {
      with: [
        "actor",
        "accounts",
        "actor.custom_fields"
        // client specific only
        // "actor.account", // Relation required for determining `topup_enabled` value
        // "actor.brand", // Relation required for determining `topup_enabled` value
        // "delegated_ids",
        // "enabled_modules"
      ].join()
    }),
    queryKey: ["client"],
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  transferTo: services.transferTo
};
