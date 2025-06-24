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
  useCollection,
  ErrorOrigin,
} from "../../../utils";
import { mapEmail, mapEmails, mapIEmail } from "./mappers";
import { invalidateQueryByKey } from "../../query";
import { get, isString, isEmpty, omitBy } from "lodash-es";

// --- types
import type { IEmail } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { Email, EmailModel, EmailContext } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "emails"];
const { addError, addSuccess } = useFeedback();

async function load() {
  const { meta, user } = useSession();
  const { get, useUrl } = useQuery();

  return get<IEmail[], Email[]>({
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

async function ensure(model: EmailModel): Promise<EmailModel> {
  const mapping = omitBy(model, isEmpty);
  const emails = await load();
  const { findOne } = useCollection<Email>(emails);
  const found = findOne(mapping);
  if (found) return Promise.resolve(found);

  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        "[headless] Failed to ensure (add) email",
        responseCodes.Unprocessable_Entity
      );
    // NB: Remember to refresh our machines so we have the new data
    // refresh();
    return mapEmail(raw);
  });
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

export default {
  /**
   * The query key used for caching and identifying email-related queries.
   * @type {QueryKey}
   */
  queryKey,

  //--- queries
  /**
   * Loads the email list.
   * @returns {Promise<Email[]>} A promise that resolves to the list of emails
   */
  loadList,

  //--- mutations
  /**
   * Removes a email by its ID.
   * @param {Email["id"]} emailId - The ID of the email to remove.
   * @returns {Promise<null>} A promise that resolves when the email is removed
   */
  remove,

  /**
   * Sets a email as the default email.
   * @param {Email["id"]} emailId - The ID of the email to set as default.
   * @returns {Promise<IEmail>} A promise that resolves to the updated email
   */
  setDefault,
};

export const useClientEmailServices = () => {
  return {
    // --- methods

    /**
     * Adds a email.
     * @param {Partial<EmailContext>} param0 - The email context containing the model to add.
     * @returns {Promise<any>} The result of the add operation.
     */
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
      // return add(model);
      return ensure(model);
    },

    /**
     * Ensures a email exists.
     * @param {Partial<EmailContext>} param0 - The email context containing the model to ensure.
     * @returns {Promise<any>} The ensured email model, which will either be the existing email or a new one created.
     */
    ensure: async ({ model }: Partial<EmailContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "[headless] Ensure Email failed: model provided",
            responseCodes.Unprocessable_Entity,
            { model }
          )
        );
      return ensure(model);
    },

    /**
     * Loads lookups for the email form.
     * @param {EmailContext} context - The email context.
     * @returns {Promise<EmailContext>} The loaded lookups.
     */
    loadLookups,

    /**
     * Parses a email context.
     * @param {EmailContext} context - The email context.
     * @param {AnyEventObject} event - The event object.
     * @returns {Promise<any>} The parsed email context.
     */
    parse,

    /**
     * Refreshes the email list.
     * @param {Partial<QueryParams>} params - Optional query params.
     * @returns {Promise<any>} The refreshed email list.
     */
    refresh: loadList,

    /**
     * Updates a email.
     * @param {Partial<EmailContext>} param0 - The email context containing id and model.
     * @returns {Promise<any>} The result of the update operation.
     */
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

    /**
     * Validates a email model.
     * @param {Partial<EmailContext>} param0 - The email context containing schema and model.
     * @returns {Promise<any>} The validated model.
     */
    validate,
  };
};
