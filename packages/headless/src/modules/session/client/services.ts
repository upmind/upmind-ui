// --- internal
import services from "../services";
import { useI18n, useQuery } from "../..";
import { isAdmin } from "../../../utils/config";

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

  const admin = isAdmin.value;
  const token = getTokenFromStorage(admin ? "user" : "client");

  if (isEmpty(token)) {
    return Promise.reject(
      new DetailedError(
        t("error.token_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );
  }

  const { get, useUrl } = useQuery();
  const url = useUrl(admin ? "admin/self" : "self", {
    with: ["actor", "accounts"].join()
  });

  return get({
    url,
    queryKey: admin ? ["session", "admin"] : ["client"],
    withAccessToken: token?.access_token,
    withoutLocale: admin
  })
    .then(data => {
      return data;
    })
    .catch(err => {
      throw err;
    });
}

// -----------------------------------------------------------------------------

export default {
  load,
  transferTo: services.transferTo
};
