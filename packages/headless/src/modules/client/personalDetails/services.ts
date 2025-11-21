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
  CustomField
} from "../..";

// --- utils
import {
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser
} from "../../../utils";

import { get, pick, reduce, set } from "lodash-es";

// --- types

import { useClientCustomFields } from "../customFields/useClientCustomFields";
import type { AnyEventObject } from "xstate";
import type { FieldsContext, FieldsModel } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

async function loadLookups({
  model,
  schema,
  filterFields = []
}: FieldsContext): Promise<Partial<FieldsContext>> {
  const { client } = useSession();
  const { isReady, data } = useClientCustomFields();

  return isReady().then(() => {
    const customFieldsValues: Record<string, any> = reduce(
      client.value?.customFields || [],
      (result, element) => {
        if (!element?.field?.code) return result;
        set(result, element.field.code, element.value);
        return result;
      },
      {} as Record<string, any>
    );

    let baseModel: FieldsModel = {
      firstName: client.value?.firstname,
      lastName: client.value?.lastname,
      publicName: client.value?.publicName,
      language: client.value?.language,
      customFields: customFieldsValues
    };

    if (filterFields.length > 0)
      baseModel = pick(baseModel, filterFields) as FieldsModel;
    // Filter the fields based on filterFields array
    // data.value = data.value.filter(field => filterFields.includes(field.code));

    const safeModel = useModelParser<FieldsModel>(schema, model, baseModel);

    return {
      model: safeModel,
      baseModel: safeModel,
      fields: data.value
    } as Partial<FieldsContext>;
  });
}

// -----------------------------------------------------------------------------
// MUTATIONS

// async function update(id: Address["id"], data: FieldsModel) {
//   const { meta, client } = useSession();
//   const { put, useUrl } = useQuery();

//   if (!meta.value.isAuthenticated || !client.value?.id) {
//     return Promise.reject(new NotAuthenticatedError());
//   }

//   return put<IAddress>({
//     url: useUrl(`clients/${client.value?.id}/addresses/${id}`),
//     data: mapIAddress(data),
//     withAccessToken: true
//   }).then(invalidateQueryByKey(queryKey, { exact: false }));
// }

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
    // , regions, country
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
    // update: async ({ id, model }: Partial<FieldsContext>): Promise<any> => {
    //   if (!id || isEmpty(model))
    //     return Promise.reject(
    //       new DetailedError(
    //         t("error.client_address_not_available"),
    //         responseCodes.No_Content,
    //         ErrorOrigin.Headless,
    //         { id, model }
    //       )
    //     );
    //   return update(id, model);
    // },

    /**
     * Validates a address model.
     * @param {Partial<FieldsContext>} param0 - The address context containing schema and model.
     * @returns {Promise<any>} The validated model.
     */
    validate
  };
};
