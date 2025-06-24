// --- internal
import { useQuery, useSession, useFeedback, type QueryParams } from "../..";

// --- utils
import {
  useTime,
  useValidation,
  useModelParser,
  CacheIsStaleError,
  NotAuthenticatedError,
  DetailedError,
  responseCodes,
  ErrorOrigin,
} from "../../../utils";
import { invalidateQueryByKey } from "../../query";
import { mapEmails, mapIEmail } from "./mappers";
import { get, isEmpty, isNil, isString, first } from "lodash-es";

// --- types
import { EmailTypes } from "./types";
import type { IEmail } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { EmailContext, Email, EmailModel } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "emails"];
const { addError, addSuccess } = useFeedback();

function loadList(params?: Partial<QueryParams>) {
  const { meta, user } = useSession();
  const { list, useUrl } = useQuery();

  return list<IEmail[], Email[]>({
    ...(params as any),
    queryKey,
    url: useUrl(`clients/${user.value?.id}/emails`),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated && !!user.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    // --- options
    select: mapEmails,
    staleTime: useTime().DAY,
  });
}

function loadCached() {
  const { queryClient } = useQuery();
  const cached = queryClient.getQueryData<Email[]>(queryKey);
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
  const { meta, user } = useSession();
  const { post, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return post<IEmail>({
    url: useUrl(`clients/${user.value?.id}/emails`),
    data: mapIEmail(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function update(id: Email["id"], data: EmailModel) {
  const { meta, user } = useSession();
  const { put, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IEmail>({
    url: useUrl(`clients/${user.value?.id}/emails/${id}`),
    data: mapIEmail(data),
    withAccessToken: true,
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

function remove(emailId: Email["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${user.value?.id}/emails/${emailId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated || !user.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    onError(error: any) {
      addError({
        title: isString(error)
          ? error
          : error?.title || "We experienced an error removing this email",
        copy: error?.message,
        data: error?.data,
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully removed email");
    },
    withAccessToken: true,
  });
}

function setDefault(emailId: Email["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<IEmail>("PUT", {
    url: useUrl(`clients/${user.value?.id}/emails/${emailId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated || !user.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
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
      invalidateQueryByKey(queryKey, { exact: false })(data);
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
      reject(
        new DetailedError(
          "[headless] Invalid Email Model",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { error: errors }
        )
      );
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
    add: async ({ model }: Partial<EmailContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Add Email failed: model provided",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { model }
          )
        );
      return add(model);
    },
    update: async ({ id, model }: Partial<EmailContext>) => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Update Email failed: No id or model provided",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { id, model }
          )
        );

      return update(id, model);
    },
    parse,
    validate,
    refresh: loadList,
  };
};
