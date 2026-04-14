// --- external

// --- internal
import {
  RequestSortDirection,
  useQuery,
  useSession,
  type QueryParams
} from "../..";
import upmind from "../../../useUpmind";

// --- utils
import { useTime, NotAuthenticatedError } from "../../../utils";
import { mapEmailHistory, mapReceivedEmail } from "./mappers";

// --- types
import type { IEmail, ISentEmail } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { SentEmail } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "emailHistory"];

function load({ emailId }: { emailId?: SentEmail["id"] }) {
  const { query, useUrl } = useQuery();
  const { admin } = upmind;

  // NB:We use the latest but in time we could get a specific version.
  // This would be the identifier that needs to be overridden/replaced by a param

  return query<ISentEmail, SentEmail>({
    queryKey: [...queryKey, emailId, admin],
    url: useUrl(admin ? `admin/emails/${emailId}` : `emails/${emailId}`, {
      with: "data"
    }),
    withAccessToken: true,
    // --- options
    select: mapReceivedEmail,
    staleTime: useTime().DAY
    // persister: localStoragePersister.persisterFn
  });
}

function loadList(params: Partial<QueryParams> = { pagination: { limit: 0 } }) {
  const { meta } = useSession();
  const { list, useUrl } = useQuery();
  const { admin } = upmind;

  return list<IEmail[], SentEmail[]>({
    ...(params as any),
    queryKey: [...queryKey, admin],
    url: useUrl(admin ? "admin/self/email_history" : "self/email_history", {
      with: ["recipient", "recipient_type", "recipient.image"].join(","),
      ...params.filters
    }),
    sort: [[RequestSortDirection.DESC, "created_at"]],
    withSplitCount: true,
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    // --- options
    select: mapEmailHistory,
    staleTime: useTime().DAY
  });
}

// -----------------------------------------------------------------------------
// MUTATIONS

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

// -----------------------------------------------------------------------------

export default {
  /**
   * The query key used for caching and identifying email-related queries.
   * @type {QueryKey}
   */
  queryKey,

  //--- queries
  /**
   * Loads the email.
   * @returns {Promise<Email>} A promise that resolves to the email
   */
  load,

  /**
   * Loads the email list.
   * @returns {Promise<Email[]>} A promise that resolves to the list of emails
   */
  loadList
};
