// --- external
import { computed, ref } from "vue";
import { Router, useRoute, useRouter } from "vue-router";
// import { interpret } from "xstate";

// --- internal
import { useSession } from "../../session";
// import { useProfileDetailsActions, useProfileDetailsGuards } from "./actions";
// import { useProfileDetailsServices } from "./services";
import {
  // useBasket,
  useClientCustomFields,
  // useDataLayer,
  useBrand
  // ROUTE,
  // useRoutingEngine
} from "@upmind-automation/headless";

// --- utils
// import { useCollection } from "../../../utils";
import { map, find, concat, get } from "lodash-es";
import { useI18n } from "vue-i18n";

// --- types
// import type {
//   //  QueryProps,
//   RequestFilters
// } from "../../query";
import { ICustomField } from "@upmind-automation/types";
import { ProfileFields } from "./types";
import { CustomField } from "../customFields";

// import dataManagerMachine from "../../../utils/dataManager.machine";

/**
 * Composable function for managing client phones.
 * It handles fetching, displaying, filtering, and performing actions on client phones,
 * leveraging an underlying service and TanStack Query for data management.
 *
 * @param initial - Optional initial query parameters for loading the phone list. Defaults to pagination limit of 0.
 * @returns The {@link UseProfileDetails} API for interacting with client phones.
 */
export const useProfileDetails = () => {
  const { t } = useI18n();
  const { isAuthenticated, meta: sessionMeta, client } = useSession();
  const { languages } = useBrand();
  let router: Router = useRouter();

  const { isReady: customFieldsIsReady, data: customFields } =
    useClientCustomFields();

  async function isReady(): Promise<boolean> {
    if (sessionMeta.value.isAuthenticated)
      return new Promise(async resolve => {
        await customFieldsIsReady();
        resolve(true);
      });
    return isAuthenticated()
      .then(() => customFieldsIsReady().then(() => true))
      .catch(() => false);
  }

  const data = computed(() => {
    return concat(
      map(ProfileFields, (profileField: CustomField) => {
        const fieldValue = get(client.value || {}, profileField.code, null);

        return {
          ...profileField,
          name_translated: t(`text.${profileField.code}`),
          value:
            profileField.code !== "interface_language_id"
              ? fieldValue
              : get(find(languages.value, ["id", fieldValue]), "language", null)
        };
      }),
      map(customFields.value, (customField: ICustomField) => {
        return {
          ...customField,
          value:
            find(client.value?.customFields || [], ["field_id", customField.id])
              ?.value || null
        };
      })
    );
  });

  // const meta = computed(() => ({
  //   isLoading: query?.isLoading.value || !query.isFetched.value,
  //   hasError: !isEmpty(query.error.value),
  //   isEmpty: isEmpty(query.data?.value) || query.pagination.value.total == 0,
  //   isAvailable: sessionMeta.value.isAuthenticated
  // }));

  // --- context

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Resolves when the client items are ready to be used.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Meta-information about the basket state.
     * @typedef {Object} ClientPhoneMeta
     * @property {boolean} isError - Indicates if there was an error during the query.
     * @property {boolean} isEmpty - Indicates if the basket is empty.
     * @property {boolean} isLoading - Indicates if the query is currently loading.
     * @property {boolean} isAuthenticated - Indicates if the client is authenticated.
     */
    // meta,

    // --- context

    /**
     * The reactive data property containing the list of client items.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data

    // --- methods
  };
};

/**
 * The return type of the {@link UseProfileDetails} composable function.
 */
export type UseProfileDetails = ReturnType<typeof useProfileDetails>;
