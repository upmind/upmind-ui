/** @internal */
import upmind from "../../useUpmind";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import {
  mapEmailHistory,
  mapReceivedEmail
} from "./client-email-history.mappers";
import { useQuerySchema } from "./client-email-history.schemas";
import { useTime, NotAuthenticatedError } from "../../utils";
import type {
  SentEmailQueryModel,
  SentEmail
} from "./client-email-history.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { ISentEmail } from "@upmind-automation/types";

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

/**
 * The whole request state is the DECLARED query schema: `list()` constructs the
 * criteria from it and publishes it back on the handle. The URL carries only
 * what scopes the collection (`with`) — a filter baked into it there would be
 * frozen at construction while the same filter moved through the criteria.
 */
function loadList(model?: Partial<SentEmailQueryModel>) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { list, useUrl } = useQuery();
  const { admin } = upmind;

  return list<ISentEmail[], SentEmail[], SentEmailQueryModel>({
    criteria: { schema: useQuerySchema(), model },
    queryKey: [...queryKey, admin],
    url: useUrl(admin ? "admin/self/email_history" : "self/email_history", {
      with: ["recipient", "recipient_type", "recipient.image"].join(",")
    }),
    withSplitCount: true,
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value) {
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
