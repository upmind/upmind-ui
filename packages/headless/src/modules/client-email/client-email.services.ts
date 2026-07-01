/** @internal */
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useFeedback } from "../feedback";
import { useI18n } from "../system-localisation";
import type { QueryParams } from "../query";
import { invalidateQueryByKey } from "../query";
import { mapEmail, mapEmails, mapIEmail } from "./client-email.mappers";
import {
  useTime,
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useCollection,
  useModelParser,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { get, isString, isEmpty, omitBy, isArray } from "lodash-es";
import type { Email, EmailModel, EmailContext } from "./client-email.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IEmail } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "emails"];

function loadList(params: Partial<QueryParams> = { pagination: { limit: 0 } }) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { list, useUrl } = useQuery();

  return list<IEmail[], Email[]>({
    ...(params as any),
    queryKey: [...queryKey, { client: client.value?.id }],
    url: useUrl(`clients/${client.value?.id}/emails`),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value && !!client.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    // --- options
    select: mapEmails,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAuthenticated.value && !!client.value?.id
  });
}

async function loadLookups({
  model,
  schema
}: EmailContext): Promise<EmailContext> {
  // we don't have any lookups for emails, so return null
  const baseModel: EmailModel = {
    email: null
  };

  const safeModel = useModelParser<EmailModel>(schema, model, baseModel);

  return Promise.resolve({
    model: safeModel,
    baseModel: safeModel
  } as EmailContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: EmailModel) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { post, useUrl } = useQuery();

  if (!isAuthenticated.value || !client.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }
  return post<IEmail>({
    mutationKey: ["client", "emails", "add"],
    url: useUrl(`clients/${client.value?.id}/emails`),
    data: mapIEmail(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function update(id: Email["id"], data: EmailModel) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { put, useUrl } = useQuery();

  if (!isAuthenticated.value || !client.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IEmail>({
    mutationKey: ["client", "emails", id],
    url: useUrl(`clients/${client.value?.id}/emails/${id}`),
    data: mapIEmail(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

async function ensure(model: EmailModel): Promise<Email> {
  const { t } = useI18n();
  const { data, promise } = loadList();
  await promise.value.finally(); // wait for the query to resolve
  const { findOne } = useCollection<Email>(
    isArray(data.value) ? data.value : []
  );

  // foe emails we map agains id or the actual email address
  const mapping = omitBy(model, isEmpty);
  const found = findOne(mapping);
  if (found) return Promise.resolve(found);

  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        t("error.client_email_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { model }
      );
    // NB: Remember to refresh our machines so we have the new data
    // refresh();
    return mapEmail(raw);
  });
}

function remove(emailId: Email["id"]) {
  const { t } = useI18n();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${client.value?.id}/emails/${emailId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value || !client.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    onError(error: any) {
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_email_delete_failed"),
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.email_removed"));
    },
    withAccessToken: true
  });
}

function verify(emailId: Email["id"]) {
  const { t } = useI18n();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("PATCH", {
    url: useUrl(`clients/${client.value?.id}/emails/${emailId}/send_verify`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value || !client.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    onError(error: any) {
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_email_verify_failed"),
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.email_verification_sent"));
    },
    withAccessToken: true
  });
}

function setDefault(emailId: Email["id"]) {
  const { t } = useI18n();
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<IEmail>("PUT", {
    url: useUrl(`clients/${client.value?.id}/emails/${emailId}`),
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value || !client.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    data: { default: true },
    onError(error: any) {
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_email_set_default_failed"),
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.email_set_default"));
    },
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse({ schema }: EmailContext, { data }: AnyEventObject) {
  const safeModel = useModelParser<EmailModel>(
    schema,
    get(data, "model", data)
  );

  // ---

  return Promise.resolve({ model: safeModel });
}

async function validate({ schema, model }: EmailContext) {
  const { t } = useI18n();
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_email_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
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

  //--- mutations
  /**
   * Verify email by its ID.
   * @param {Email["id"]} emailId - The ID of the email to verify.
   * @returns {Promise<null>} A promise that resolves when the email verification is sent
   */
  verify,

  /**
   * Sets a email as the default email.
   * @param {Email["id"]} emailId - The ID of the email to set as default.
   * @returns {Promise<IEmail>} A promise that resolves to the updated email
   */
  setDefault
};

export const useClientEmailServices = () => {
  return {
    // --- methods

    /**
     * Adds a email.
     * @param {Partial<EmailContext>} param0 - The email context containing the model to add.
     * @returns {Promise<any>} The result of the add operation.
     */
    add: async ({ model }: Partial<EmailContext>): Promise<any> => {
      const { t } = useI18n();
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            t("error.client_email_not_available"),
            responseCodes.No_Content,
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
    ensure: async ({ model }: Partial<EmailContext>): Promise<any> => {
      const { t } = useI18n();
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            t("error.client_email_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
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
    update: async ({ id, model }: Partial<EmailContext>): Promise<any> => {
      const { t } = useI18n();
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            t("error.client_email_not_available"),
            responseCodes.No_Content,
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
    validate
  };
};
