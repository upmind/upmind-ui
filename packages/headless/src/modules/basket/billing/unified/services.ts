// --- external
import parsePhoneNumber, { CountryCode } from "libphonenumber-js";

// --- internal
import {
  useClientAddresses,
  useClientCompanies,
  useClientEmails,
  useClientPhones
} from "../../../client";
import { useBrand } from "../../../brand";
import { useSystem } from "../../../system";
import { useClientEmailServices } from "../../../client/email/services";
import { useClientPhoneServices } from "../../../client/phone/services";
import { useClientCompanyServices } from "../../../client/company/services";
import { useClientAddressServices } from "../../../client/address/services";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../../../utils";
import { find, get, isEmpty, isString, some } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { UnifiedContext, UnifiedModel } from "./types";
import { UnifiedType } from "./types";
import { BrandConfigKeys } from "@upmind-automation/types";
import type { AddressModel, CompanyModel, PhoneModel } from "../../../client";

// -----------------------------------------------------------------------------
// QUERIES

/**
 * Load the lookups for the address form
 * @param {UnifiedContext} context
 * @returns {Promise<UnifiedContext>}
 */
async function loadLookups({
  model,
  schema,
  type
}: UnifiedContext): Promise<UnifiedContext> {
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

  const {
    isReady: getCompanies,
    default: defaultCompany,
    data: companies
  } = useClientCompanies();

  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  const { ensureConfig } = useBrand();

  await isReady().catch(error => Promise.reject(error));

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  const [countries, config] = await Promise.all([
    fetchCountries(),
    ensureConfig([
      BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
      BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
      BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
      BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS
    ]),
    getPhones(),
    getEmails(),
    getAddresses(),
    getCompanies()
  ]);

  const country = getCountry(model?.address?.countryId);
  const regions = await fetchRegions(model?.address?.countryId || country?.id);

  if (isEmpty(countries) || isEmpty(regions)) {
    return Promise.reject("Failed to load countries and regions");
  }

  const baseModel: UnifiedModel = {
    address:
      type == UnifiedType.PERSONAL
        ? ({
            countryId: country?.id
          } as AddressModel["address"])
        : undefined,
    company:
      type == UnifiedType.BUSINESS
        ? ({
            addressId: defaultAddress.value?.id,
            emailId: defaultEmail.value?.id,
            phoneId: defaultPhone.value?.id
          } as CompanyModel)
        : undefined,
    phone: get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE)
      ? ((defaultPhone.value ?? {
          phone: {
            number: null,
            nationalNumber: null,
            countryCallingCode: null,
            country: country?.code
          }
        }) as PhoneModel)
      : undefined
  };

  const safeModel = useModelParser<UnifiedModel>(schema, model, baseModel);

  return Promise.resolve({
    regions,
    country,
    countries,
    phones: phones.value,
    emails: emails.value,
    addresses: addresses.value,
    companies: companies.value,
    config,
    // ---
    model: safeModel,
    baseModel: safeModel
  } as UnifiedContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(type: UnifiedType, data: UnifiedModel) {
  const { ensure: ensureAddress } = useClientAddressServices();
  const { ensure: ensurePhone } = useClientPhoneServices();
  const { ensure: ensureCompany } = useClientCompanyServices();

  const promises: Promise<any>[] = [];

  promises.push(
    data?.phone
      ? ensurePhone({ model: data.phone })
      : Promise.resolve(undefined)
  );

  promises.push(
    data?.address && type == UnifiedType.PERSONAL
      ? ensureAddress({ model: { address: data.address } })
      : Promise.resolve(undefined)
  );

  const [phone, address] = await Promise.all(promises);

  return {
    phone: phone?.phone, // NB the returned Phone object has a phone property
    address,
    company:
      data?.company && type == UnifiedType.BUSINESS
        ? await ensureCompany({
            model: {
              ...data.company,
              phoneId: phone?.id,
              phone: undefined // Don't pass phone data, use phoneId instead
            }
          })
        : undefined
  };
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema, regions, country, autoupdate }: UnifiedContext,
  { data }: AnyEventObject
) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )
  const { fetchRegions, getCountry } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel: UnifiedModel = useModelParser(
    schema,
    get(data, "model", data)
  );

  if (safeModel?.address) {
    country = getCountry(
      safeModel?.address?.countryId ?? baseModel.address?.countryId
    );

    safeModel.address!.countryId = country.id;

    // let's check if the country has changed, i.e.: the regions don't match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country from the address
    if (!some(regions, ["countryId", safeModel.address?.countryId])) {
      regions = await fetchRegions(safeModel.address!.countryId);
    }

    // now let's check our region list to see if we have a match
    // if so, then we need to update the safeModel with the new region id
    // otherwise the regionId is reset to null
    const region = find(regions, ["id", safeModel.address?.regionId]);
    safeModel.address!.regionId = get(region, "id");
  }

  if (safeModel?.company && !safeModel?.company?.addressId) {
    safeModel.company.address ??= {
      address1: null,
      city: null,
      postcode: null,
      countryId: baseModel.address?.countryId
    } as AddressModel["address"];

    country = getCountry(
      safeModel.company?.address?.countryId ?? baseModel.address?.countryId
    );

    safeModel.company.address!.countryId = country.id;

    // let's check if the country has changed, i.e.: the regions don't match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country from the address
    if (!some(regions, ["countryId", safeModel.company.address?.countryId])) {
      regions = await fetchRegions(safeModel.company.address!.countryId);
    }

    // now let's check our region list to see if we have a match
    // if so, then we need to update the safeModel with the new region id
    // otherwise the regionId is reset to null
    const region = find(regions, ["id", safeModel.company.address?.regionId]);
    safeModel.company.address!.regionId = get(region, "id");
  }

  if (safeModel?.phone?.phone) {
    const phoneNumber = isString(safeModel?.phone?.phone)
      ? safeModel?.phone?.phone
      : safeModel?.phone?.phone?.number ||
        safeModel?.phone?.phone?.nationalNumber ||
        "";

    const countryCode = safeModel?.phone?.phone?.country || country?.code;
    const phone =
      parsePhoneNumber(phoneNumber, countryCode as CountryCode) || undefined;

    safeModel.phone = {
      phone: {
        number: phone?.number || null,
        nationalNumber: phone?.nationalNumber || null,
        countryCallingCode: phone?.countryCallingCode || null,
        country: phone?.country || countryCode || null
      }
    };
  }

  return Promise.resolve({
    model: safeModel,
    regions,
    country,
    autoupdate
  });
}

async function validate({ schema, model }: Partial<UnifiedContext>) {
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);

    if (errors?.length) {
      reject(
        new DetailedError(
          "Unified address validation failed",
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

export const useUnifiedServices = () => {
  return {
    loadLookups,
    add: async ({ type, model }: UnifiedContext) => {
      if (isEmpty(model)) return Promise.reject("No address model provided");
      return add(type, model);
    },

    parse,
    validate,
    invalidate: async () => {
      // Also invalidate the underlying queries
      const { invalidate: invalidateAddresses } = useClientAddresses();
      const { invalidate: invalidateCompanies } = useClientCompanies();
      await Promise.all([invalidateAddresses(null), invalidateCompanies(null)]);
    }
  };
};
