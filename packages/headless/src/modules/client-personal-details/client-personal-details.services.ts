/** @internal */
import { useClientCustomFields } from "../client-custom-fields";
import { invalidateQueryByKey, useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n, useLocale } from "../system-localisation";
import {
  mapCustomFieldValue,
  mapIProfileFields
} from "./client-personal-details.mappers";
import {
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser
} from "../../utils";
import { get, find, pick, reduce, set, isEmpty } from "lodash-es";
import type {
  FieldsContext,
  FieldsModel
} from "./client-personal-details.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IClient } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// QUERIES
const queryKey: QueryKey = ["client"];

async function loadLookups({
  model,
  schema,
  lookups
}: FieldsContext): Promise<Partial<FieldsContext>> {
  const { activeUser: client } = useActiveSession().useContext();
  const { isReady, data: customFields } = useClientCustomFields();

  return isReady().then(() => {
    const customFieldsValues: Record<string, any> = reduce(
      client.value?.customFields || [],
      (result, element) => {
        const fieldCode = get(
          find(customFields.value, ["id", element.field_id]),
          "code",
          null
        );
        if (!fieldCode) return result;
        const value = mapCustomFieldValue(
          element.value,
          find(customFields.value, ["id", element.field_id])
        );
        set(result, fieldCode, value);
        return result;
      },
      {} as Record<string, any>
    );

    const baseModel: FieldsModel = {
      firstName: client.value?.firstName,
      lastName: client.value?.lastName,
      publicName: client.value?.publicName,
      language: client.value?.language,
      customFields: customFieldsValues
    };

    const filteredModel: Partial<FieldsModel> = isEmpty(
      lookups?.filterFields ?? []
    )
      ? baseModel
      : pick(baseModel, lookups?.filterFields ?? []);

    const safeModel = useModelParser<FieldsModel>(schema, model, filteredModel);

    return {
      model: safeModel,
      baseModel: useModelParser<FieldsModel>(schema, model, baseModel),
      lookups: {
        ...lookups,
        fields: customFields.value
      }
    } as Partial<FieldsContext>;
  });
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function update(data: FieldsModel) {
  const { sessionId: clientId } = useActiveSession().useContext();
  const { put, useUrl } = useQuery();

  return put<IClient>({
    mutationKey: ["client", clientId.value],
    url: useUrl(`clients/${clientId.value}`),
    data: mapIProfileFields(data),
    withAccessToken: true,
    withoutLocale: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .then(response => {
      const client = response as IClient;
      if (!client) return;
      // ensure we honor the clients locale ( it may have changed )
      if (client.interface_language_code) {
        useLocale().setLocale(client.interface_language_code);
      }
      return client;
    });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse({ schema }: FieldsContext, { data }: AnyEventObject) {
  // We need to check and potentially update the region list based on the selected country (if it's changed)
  // const { fetchRegions, getCountry } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model

  const safeModel = useModelParser<FieldsModel>(
    schema,
    get(data, "model", data)
  );

  // first let's check we have a valid country,
  // fallback to the default country if not set or invalid
  // country = getCountry(safeModel.address?.countryId);
  // safeModel.address.countryId = country.id;

  // let's check if the country has changed, i.e.: the regions don't match
  // if so, then we need to fetch the regions for the new country
  // AND update our 'default' country to match the country from the address
  // this will in turn update the phone schema to match the country
  // TODO: Regions should be mapped to camelcase, e.g country_id => countryId
  // if (!some(regions, ["country_id", safeModel?.address?.countryId])) {
  //   regions = await fetchRegions(safeModel.address.countryId);
  //   country = getCountry(safeModel.address.countryId);
  // }

  // now let's check our region list to see if we have a match
  // if so, then we need to update the safeModel with the new region id
  // otherwise the regionId is reset to null
  // const region = find(regions, ["id", safeModel?.address?.regionId]);
  // safeModel.address.regionId = get(region, "id");

  return Promise.resolve({
    model: safeModel
  });
}

// async function validate({ schema, model }: Partial<FieldsContext>) {
async function validate({ schema, model }: Partial<any>) {
  const { t } = useI18n();
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_profile_validation_failed"),
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

export const useProfileDetailsServices = () => {
  const { t } = useI18n();

  return {
    // --- methods

    /**
     * Loads lookups for the address form.
     * @param {FieldsContext} context - The address context.
     * @returns {Promise<FieldsContext>} The loaded lookups.
     */
    loadLookups,

    /**
     * Parses a address context.
     * @param {FieldsContext} context - The address context.
     * @param {AnyEventObject} event - The event object.
     * @returns {Promise<any>} The parsed address context.
     */
    parse,

    /**
     * Updates a address.
     * @param {Partial<FieldsContext>} param0 - The address context containing id and model.
     * @returns {Promise<any>} The result of the update operation.
     */
    update: async ({ id, model }: Partial<FieldsContext>): Promise<any> => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            t("error.profile_details_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        );
      return update(model);
    },

    /**
     * Validates a address model.
     * @param {Partial<FieldsContext>} param0 - The address context containing schema and model.
     * @returns {Promise<any>} The validated model.
     */
    validate
  };
};
