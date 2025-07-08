// --- internal
import {
  useQuery,
  useSystem,
  useSession,
  useFeedback,
  useClientPhones,
  useClientEmails,
  useClientAddresses,
  type QueryParams,
  useBrand,
  AddressModel,
  EmailModel,
  PhoneModel
} from "../..";

import { useClientAddressServices } from "../address/services";
import { useClientPhoneServices } from "../phone/services";
import { useClientEmailServices } from "../email/services";

// --- utils
import {
  useTime,
  useValidation,
  useModelParser,
  NotAuthenticatedError,
  DetailedError,
  responseCodes,
  ErrorOrigin,
  useCollection
} from "../../../utils";
import { mapCompanies, mapCompany, mapICompany } from "./mappers";
import { invalidateQueryByKey } from "../../query";
import { get, isString, isEmpty, omitBy, some, find } from "lodash-es";

// --- types
import { BrandConfigKeys, type ICompany } from "@upmind-automation/types";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
import type { Company, CompanyModel, CompanyContext } from "./types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["client", "companies"];
const { addError, addSuccess } = useFeedback();

function loadList(params?: Partial<QueryParams>) {
  const { meta, user } = useSession();
  const { list, useUrl } = useQuery();

  return list<ICompany[], Company[]>({
    ...(params as any),
    queryKey,
    url: useUrl(`clients/${user.value?.id}/companies`, {
      with: ["address", "address.country", "address.region"].join()
    }),
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
    select: mapCompanies,
    staleTime: useTime().DAY
  });
}

async function loadLookups({
  model,
  schema
}: CompanyContext): Promise<CompanyContext> {
  const {
    isReady: getPhones,
    default: defaultPhone,
    data: phones
  } = useClientPhones();

  const {
    isReady: getEmails,
    default: defaultEmail,
    data: emails
  } = useClientEmails();

  const {
    isReady: getAddresses,
    default: defaultAddress,
    data: addresses
  } = useClientAddresses();

  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  const { ensureConfig } = useBrand();

  await isReady().catch(error => Promise.reject(error));

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  const [countries, config] = await Promise.all([
    fetchCountries(),
    ensureConfig([BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS]),
    getPhones(),
    getEmails(),
    getAddresses()
  ]);

  const country = getCountry(model?.address?.countryId);
  const regions = await fetchRegions(model?.address?.countryId || country?.id);

  if (isEmpty(countries) || isEmpty(regions)) {
    return Promise.reject("Failed to load countries and regions");
  }

  const baseModel: CompanyModel = {
    // --- one of
    addressId: defaultAddress.value?.id,
    address: !defaultAddress.value?.id
      ? ({ countryId: country?.id } as CompanyModel["address"])
      : undefined,
    // ---
    emailId: defaultEmail.value?.id,
    phoneId: defaultPhone.value?.id,
    phone: defaultPhone.value?.phone
  };

  const safeModel = useModelParser<CompanyModel>(schema, model, baseModel);

  return Promise.resolve({
    addresses: addresses.value || [],
    emails: emails.value || [],
    phones: phones.value || [],
    country,
    countries,
    regions,
    config,
    // ---
    model: safeModel,
    baseModel: safeModel
  } as CompanyContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: CompanyModel) {
  const { meta, user } = useSession();

  const { post, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return ensureDependencies(data).then(ensuredData => {
    return post<ICompany>({
      url: useUrl(`clients/${user.value?.id}/companies`),
      data: mapICompany(ensuredData),
      withAccessToken: true
    }).then(invalidateQueryByKey(queryKey, { exact: false }));
  });
}

async function update(id: Company["id"], data: CompanyModel) {
  const { meta, user } = useSession();
  const { put, useUrl } = useQuery();

  if (!meta.value.isAuthenticated || !user.value?.id) {
    return Promise.reject(new NotAuthenticatedError());
  }
  return ensureDependencies(data).then(ensuredData => {
    return put<ICompany>({
      url: useUrl(`clients/${user.value?.id}/companies/${id}`),
      data: mapICompany(ensuredData),
      withAccessToken: true
    }).then(invalidateQueryByKey(queryKey, { exact: false }));
  });
}

async function ensure(model: CompanyModel): Promise<Company> {
  const mapping = omitBy(model, isEmpty);
  const { data, promise } = loadList();
  await promise.value.finally(); // wait for the query to resolve

  const { findOne } = useCollection<Company>(data.value ?? []);
  const found = findOne(mapping);

  if (found) return Promise.resolve(found);
  return add(model).then(raw => {
    if (isEmpty(raw))
      throw new DetailedError(
        "Ensure company failed",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { model }
      );
    // NB: Remember to refresh our machines so we have the new data
    // refresh();
    return mapCompany(raw);
  });
}

function remove(companyId: Company["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${user.value?.id}/companies/${companyId}`),
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
          : error?.title || "We experienced an error removing this company",
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully removed company");
    },
    withAccessToken: true
  });
}

function setDefault(companyId: Company["id"]) {
  const { meta, user } = useSession();
  const { mutate, useUrl } = useQuery();

  return mutate<ICompany>("PUT", {
    url: useUrl(`clients/${user.value?.id}/companies/${companyId}`),
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
            "We experienced an error setting this company as default",
        copy: error?.message,
        data: error?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      addSuccess("Successfully set company as default");
    },
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function ensureDependencies(data: CompanyModel): Promise<CompanyModel> {
  if (isEmpty(data))
    return Promise.reject(
      new DetailedError(
        "Ensure Company dependencies faile: No data provided",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );

  const { ensure: ensureEmail } = useClientEmailServices();
  const { ensure: ensurePhone } = useClientPhoneServices();
  const { add: ensureAddress } = useClientAddressServices();

  // for our dependencies we need to check if they already exists by finding them in their respective stores
  // if they do then we can just return the id
  // if they don't then we return a promise of the add method
  // NB: for each new dependency we force type to be 4 = company
  return Promise.all([
    ensureEmail({
      model: (data?.email
        ? { email: data.email }
        : { id: data?.emailId }) as EmailModel
    }),

    ensurePhone({
      model: (data?.phone
        ? { phone: data.phone }
        : { id: data?.phoneId }) as PhoneModel
    }),

    ensureAddress({
      model: (data?.address
        ? data.address
        : { id: data?.addressId }) as AddressModel
    })
  ])
    .then(([email, phone, address]) => {
      return {
        id: data.id,
        addressId: address?.id,
        phoneId: phone.id,
        emailId: email.id,
        name: data.name,
        regNumber: data.regNumber,
        vatNumber: data.vatNumber,
        default: data.default
      };
    })
    .catch(errors => {
      throw new DetailedError(
        "Ensure Company dependencies failed",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        errors
      );
    });
}

async function parse(
  { schema, regions, country, autoupdate }: CompanyContext,
  { data }: AnyEventObject
) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )
  const { fetchRegions, getCountry } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel = useModelParser<CompanyModel>(
    schema,
    get(data, "model", data)
  );

  // IF we have a new address, we need to ensure it has a country and its regions
  if (safeModel.address) {
    // first let's check we have a valid country,
    // fallback to the default country if not set or invalid
    country = getCountry(safeModel.address.countryId);
    safeModel.address!.countryId = country.id;

    // let's check if the country has changed, i.e.: the regions don't match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country from the address
    // this will in turn update the phone schema to match the country
    if (!some(regions, ["countryId", safeModel.address?.countryId])) {
      regions = await fetchRegions(safeModel.address!.countryId);
    }

    // now let's check our region list to see if we have a match
    // if so, then we need to update the safeModel with the new region id
    // otherwise the regionId is reset to null
    const region = find(regions, ["id", safeModel.address?.regionId]);
    safeModel.address!.regionId = get(region, "id");
  }

  // ---
  return Promise.resolve({
    model: safeModel,
    regions,
    country,
    autoupdate
  });
}

async function validate({ schema, model }: Partial<CompanyContext>) {
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);

    if (errors?.length) {
      reject(
        new DetailedError(
          "Company validation failed",
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
   * The query key used for caching and identifying company-related queries.
   * @type {QueryKey}
   */
  queryKey,

  //--- queries
  /**
   * Loads the company list.
   * @returns {Promise<Company[]>} A promise that resolves to the list of companys
   */
  loadList,

  //--- mutations
  /**
   * Removes a company by its ID.
   * @param {Company["id"]} companyId - The ID of the company to remove.
   * @returns {Promise<null>} A promise that resolves when the company is removed
   */
  remove,

  /**
   * Sets a company as the default company.
   * @param {Company["id"]} companyId - The ID of the company to set as default.
   * @returns {Promise<ICompany>} A promise that resolves to the updated company
   */
  setDefault
};

export const useClientCompanyServices = () => {
  return {
    // --- methods

    /**
     * Adds a company.
     * @param {Partial<CompanyContext>} param0 - The company context containing the model to add.
     * @returns {Promise<any>} The result of the add operation.
     */
    add: async ({ model }: Partial<CompanyContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "Add Company failed: model provided",
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        );
      // return add(model);
      return ensure(model);
    },

    /**
     * Ensures a company exists.
     * @param {Partial<CompanyContext>} param0 - The company context containing the model to ensure.
     * @returns {Promise<any>} The ensured company model, which will either be the existing company or a new one created.
     */
    ensure: async ({ model }: Partial<CompanyContext>) => {
      if (isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "Ensure Company failed: model provided",
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        );
      return ensure(model);
    },

    /**
     * Loads lookups for the company form.
     * @param {CompanyContext} context - The company context.
     * @returns {Promise<CompanyContext>} The loaded lookups.
     */
    loadLookups,

    /**
     * Parses a company context.
     * @param {CompanyContext} context - The company context.
     * @param {AnyEventObject} event - The event object.
     * @returns {Promise<any>} The parsed company context.
     */
    parse,

    /**
     * Refreshes the company list.
     * @param {Partial<QueryParams>} params - Optional query params.
     * @returns {Promise<any>} The refreshed company list.
     */
    refresh: loadList,

    /**
     * Updates a company.
     * @param {Partial<CompanyContext>} param0 - The company context containing id and model.
     * @returns {Promise<any>} The result of the update operation.
     */
    update: async ({ id, model }: Partial<CompanyContext>) => {
      if (!id || isEmpty(model))
        return Promise.reject(
          new DetailedError(
            "Update Company failed: No id or model provided",
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { id, model }
          )
        );
      return update(id, model);
    },

    /**
     * Validates a company model.
     * @param {Partial<CompanyContext>} param0 - The company context containing schema and model.
     * @returns {Promise<any>} The validated model.
     */
    validate
  };
};
