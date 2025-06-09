// --- internal
import { useFeedback, useQuery, useSession } from "../..";

// --- utils
import {
  useValidation,
  useModelParser,
  CacheIsStaleError,
  useTime,
} from "../../../utils";
import { mapEmails, mapIEmail } from "./mappers";
import { invalidateQueryByKey } from "../../query";
import { isNil, isEmpty, get, first, isString } from "lodash-es";

// --- types
import { EmailTypes } from "./types";
import type { IEmail } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/query-core";
import type { AnyEventObject } from "xstate";
import type { PaginatedParams } from "../..";
import type { Email, EmailModel, EmailContext } from "./types";

// -----------------------------------------------------------------------------

const queryKey: QueryKey = ["client", "emails"];
const { addError, addSuccess } = useFeedback();

async function loadAll() {
  const { getAsync, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return getAsync<IEmail[], Email[]>({
    url: useUrl(`clients/${client.id}/emails`, { limit: 0 }),
    select: data => mapEmails(data ?? []),
    queryKey,
    staleTime: useTime().DAY,
    withAccessToken: true,
  });
}

async function loadPaged(params: PaginatedParams) {
  const { getAsync, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return getAsync<IEmail[], Email[]>({
    url: useUrl(`clients/${client.id}/emails`, {
      ...params,
    }),
    select: data => mapEmails(data ?? []),
    queryKey: [...queryKey, params],
    staleTime: useTime().DAY,
    withAccessToken: true,
  });
}

function loadAllFromCache() {
  const { queryClient } = useQuery();
  const cachedEmails = queryClient.getQueryData<Email[]>(queryKey);
  if (isNil(cachedEmails)) throw new CacheIsStaleError();
  return cachedEmails;
}

/**
 * Load the lookups for the email form
 * @param {EmailContext} _context
 * @returns {Promise<null>}
 */
async function loadLookups({
  model,
  schema,
}: EmailContext): Promise<EmailContext> {
  // we don't have any lookups for emails, so return null
  const baseModel: EmailModel = {
    email: "",
    type: first(EmailTypes)?.key || 1,
  };

  const safeModel = useModelParser<EmailModel>(schema, model, baseModel, {
    allowExtraProps: false,
  });

  return Promise.resolve({
    model: safeModel,
    baseModel: safeModel,
  } as EmailContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: EmailModel) {
  const { getUserId } = useSession();
  const { post, useUrl } = useQuery();

  const clientId = await getUserId();

  return post<IEmail>({
    url: useUrl(`clients/${clientId}/emails`),
    data: mapIEmail(data),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error adding this email",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey)(data);
      addSuccess("Successfully added email");
    },
    withAccessToken: true,
  });
}

async function update(id: Email["id"], data: EmailModel) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${id}`),
    data: mapIEmail(data),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error updating this email",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey)(data);
      addSuccess("Successfully updated email");
    },
    withAccessToken: true,
  });
}

async function remove(emailId: Email["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  return del<null>({
    url: useUrl(`clients/${clientId}/emails/${emailId}`),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error removing this email",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess() {
      invalidateQueryByKey(queryKey);
      addSuccess("Successfully removed email");
    },
    withAccessToken: true,
  });
}

async function setDefault(emailId: Email["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  return put<IEmail>({
    url: useUrl(`clients/${clientId}/emails/${emailId}`),
    data: { default: true },
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title ||
            "We experienced an error setting this email as default",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess() {
      invalidateQueryByKey(queryKey);
      addSuccess("Successfully set email as default");
    },
    withAccessToken: true,
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema }: EmailContext,
  { data }: AnyEventObject & { data: EmailContext }
) {
  const safeModel = useModelParser(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  // ---

  return Promise.resolve({ model: safeModel });
}

async function validate({ schema, model }: EmailContext) {
  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    if (!schema) return resolve(model);
    const errors = validate(schema, model);
    if (errors?.length) {
      reject({ error: errors });
    } else {
      resolve(model);
    }
  });
}

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  queryKey,
  //--- queries
  loadAll,
  loadPaged,
  refresh: loadAll,

  loadAllFromCache,
  //--- mutations

  remove,
  setDefault,
};

export const useClientEmailServices = () => {
  return {
    loadLookups,
    add: async (context: EmailContext) => {
      if (isEmpty(context.model))
        return Promise.reject("No email model provided");
      return add(context.model);
    },
    update: async (context: EmailContext) => {
      if (!context.id) return Promise.reject("No email id provided");
      if (isEmpty(context.model))
        return Promise.reject("No email model provided");

      return update(context.id, context.model);
    },
    parse,
    validate,
    refresh: loadAll,
  };
};
