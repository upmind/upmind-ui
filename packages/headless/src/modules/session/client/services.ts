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
import { Contexts } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

async function load(_context: ClientContext, _event: any) {
  // if we have a token, we are potentially authenticated
  // and we need to check the token/get the user
  const { t } = useI18n();

  const token = getTokenFromStorage(
    isAdmin.value ? Contexts.USER : Contexts.CLIENT
  );

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
  const url = useUrl(isAdmin.value ? "admin/self" : "self", {
    with: ["actor", "accounts"].join()
  });

  return get({
    url,
    queryKey: isAdmin.value ? ["session", "admin"] : ["client"],
    withAccessToken: token?.access_token,
    withoutLocale: isAdmin.value
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
