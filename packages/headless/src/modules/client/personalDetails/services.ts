// --- external

// --- internal
import {
  useQuery,
  // useBrand,
  useSystem,
  useSession,
  // useFeedback,
  type QueryParams,
  useI18n,
  CustomField,
  invalidateQueryByKey
} from "../..";

// --- utils
import {
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser
} from "../../../utils";

import { get, find, pick, reduce, set, isEmpty } from "lodash-es";

// --- types

import { useClientCustomFields } from "../customFields/useClientCustomFields";
import type { AnyEventObject } from "xstate";
import type { FieldsContext, FieldsModel } from "./types";
import { ICustomField } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------
// QUERIES
const queryKey: QueryKey = ["client"];

async function loadLookups({
  model,
  schema,
  filterFields = []
}: FieldsContext): Promise<Partial<FieldsContext>> {
  const { client } = useSession();
  const { isReady, data: customFields } = useClientCustomFields();

  return isReady().then(() => {
    let customFieldsValues: Record<string, any> = reduce(
      client.value?.customFields || [],
      (result, element) => {
        const fieldCode = get(
          find(customFields.value, ["id", element.field_id]),
          "code",
          null
        );
        if (!fieldCode) return result;
        set(result, fieldCode, element.value);
        return result;
      },
      {} as Record<string, any>
    );

    let baseModel: FieldsModel = {
      firstName: client.value?.firstname,
      lastName: client.value?.lastname,
      publicName: client.value?.public_name, // change
      language: client.value?.interface_language_id, // change
      customFields: customFieldsValues
    };

    if (filterFields.length > 0) {
      customFieldsValues = pick(customFieldsValues, filterFields);
      baseModel = {
        ...pick(baseModel, filterFields),
        ...(isEmpty(customFieldsValues)
          ? {}
          : { customFields: customFieldsValues })
      } as FieldsModel;
    }

    const safeModel = useModelParser<FieldsModel>(schema, model, baseModel);

    return {
      model: safeModel,
      baseModel: safeModel,
      fields: customFields.value
    } as Partial<FieldsContext>;
  });
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function update(data: FieldsModel) {
  const { meta, client } = useSession();
  const { put, useUrl } = useQuery();

  console.log("Services update data:", data);

  return put<ICustomField>({
    url: useUrl(`clients/${client.value?.id}`),
    data,
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
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

export default () => {
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
    update: async ({ model }: Partial<FieldsContext>): Promise<any> => {
      console.log("services update model: ", model);

      // if (!id || isEmpty(model))
      if (isEmpty(model))
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
