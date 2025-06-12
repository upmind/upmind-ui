// --- external
import { ref } from "vue";

// --- internal
import { useQuery, useSession, useFeedback } from "../..";

// --- utils
import {
  useValidation,
  useModelParser,
  CacheIsStaleError,
  useTime,
  UserIsNotAuthenticatedError,
} from "../../../utils";
import { invalidateQueryByKey } from "../../query";
import { mapEmails, mapIEmail } from "./mappers";
import { get, isEmpty, isNil, isString, first } from "lodash-es";

// --- types
import { EmailTypes } from "./types";
import type { IEmail } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { QueryListParams } from "../..";
import type { EmailContext, Email, EmailModel } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "emails"];
const { addError, addSuccess } = useFeedback();

function loadList(params?: QueryListParams) {
  const { get, useUrl } = useQuery();
  const { meta, user } = useSession();

  return query<IEmail[], Email[]>({
    queryKey: [...queryKey, params],
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated || !user.value?.id) {
          resolve(true);
        } else {
          reject(new UserIsNotAuthenticatedError());
        }
      }),
    url: useUrl(`clients/${user.value?.id}/emails`, {
      ...(params || ref({ pagination: { limit: 0, offset: 0 } })),
    }),
    withAccessToken: true,
    // --- options
    select: mapEmails,
    staleTime: useTime().DAY,
  });
}

function loadCached() {
  const { queryClient } = useQuery();
  const cached = queryClient.queryQueryData<Email[]>(queryKey);
  if (isNil(cached)) throw new CacheIsStaleError();
  return cached;
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
    withAccessToken: true,
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
    onSuccess(data) {
      invalidateQueryByKey(queryKey)(data);
      addSuccess("Successfully set email as default");
    },
    withAccessToken: true,
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema }: EmailContext,
  { data }: AnyEventObject
) {
  const safeModel = useModelParser<EmailModel>(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  // ---

  return Promise.resolve({ model: safeModel });
}

async function validate({ schema, model }: EmailContext) {
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
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
  loadList,
  loadCached,

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
    refresh: loadList,
  };
};
