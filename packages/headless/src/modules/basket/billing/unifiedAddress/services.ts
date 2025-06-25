// --- external
import parsePhoneNumber, { CountryCode } from "libphonenumber-js";

// --- internal
import {
  useClientEmails,
  useClientPhones,
  useClientAddresses,
  useClientCompanies,
} from "../../../client";
import { useBrand } from "../../../brand";
import { useSystem } from "../../../system";
import { useClientEmailServices } from "../../../client/email/services";
import { useClientPhoneServices } from "../../../client/phone/services";
import { useClientCompanyServices } from "../../../client/company/services";
import { useClientAddressServices } from "../../../client/address/services";

// --- utils
import {
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser,
} from "../../../../utils";

import { find, get, isEmpty, isString, some } from "lodash-es";

// --- types
import type { PhoneModel, AddressModel, CompanyModel } from "../../../client";
import type { AnyEventObject } from "xstate";
import { UnifiedAddressType } from "./types";
import type { UnifiedAddressContext, UnifiedAddressModel } from "./types";
import { BrandConfigKeys } from "@upmind-automation/types";
import { Address } from "cluster";

// -----------------------------------------------------------------------------
// QUERIES

/**
 * Load the lookups for the address form
 * @param {UnifiedAddressContext} context
 * @returns {Promise<UnifiedAddressContext>}
 */
async function loadLookups({
  model,
  schema,
  type,
}: UnifiedAddressContext): Promise<UnifiedAddressContext> {
  const {
    isReady: getPhones,
    default: defaultPhone,
    data: phones,
  } = useClientPhones();

  const {
    isReady: getEmails,
    default: defaultEmail,
    data: emails,
  } = useClientEmails();

  const {
    isReady: getAddresses,
    default: defaultAddress,
    data: addresses,
  } = useClientAddresses();

  const {
    isReady: getCompanies,
    default: defaultCompany,
    data: companies,
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
      BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
    ]),
    getPhones(),
    getEmails(),
    getAddresses(),
    getCompanies(),
  ]);

  const country = getCountry(model?.address?.countryId);
  const regions = await fetchRegions(model?.address?.countryId || country?.id);

  if (isEmpty(countries) || isEmpty(regions)) {
    return Promise.reject("Failed to load countries and regions");
  }

  const baseModel: UnifiedAddressModel = {
    address:
      type == UnifiedAddressType.PERSONAL
        ? ({
            countryId: country?.id,
          } as AddressModel)
        : undefined,
    company:
      type == UnifiedAddressType.BUSINESS
        ? ({
            addressId: defaultAddress.value?.id,
            emailId: defaultEmail.value?.id,
            phoneId: defaultPhone.value?.id,
          } as CompanyModel)
        : undefined,
    phone: get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE)
      ? ((defaultPhone.value?.phone ?? {
          phone: {
            number: "",
            nationalNumber: "",
            countryCallingCode: "",
            country: country?.code,
          },
        }) as PhoneModel)
      : undefined,
  };

  const safeModel = useModelParser<UnifiedAddressModel>(
    schema,
    model,
    baseModel
  );

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
    baseModel: safeModel,
  } as UnifiedAddressContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(type: UnifiedAddressType, data: UnifiedAddressModel) {
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
    data?.address && type == UnifiedAddressType.PERSONAL
      ? ensureAddress({ model: data.address })
      : Promise.resolve(undefined)
  );

  promises.push(
    data?.company && type == UnifiedAddressType.BUSINESS
      ? ensureCompany({
          model: {
            ...data.company,
            phone: data.phone?.phone,
          },
        })
      : Promise.resolve(undefined)
  );

  return Promise.all(promises)
    .then(([phone, address, company]) => {
      return {
        phone: phone?.phone, // NB the returned Phone object has a phone property
        address,
        company,
      };
    })
    .catch(error => {
      return Promise.reject(
        new DetailedError(
          "[headless] Add Unified Address Failed",
          responseCodes.Unprocessable_Entity,
          { error }
        )
      );
    });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema, regions, country, autoupdate }: UnifiedAddressContext,
  { data }: AnyEventObject
) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )
  const { fetchRegions, getCountry } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const safeModel: UnifiedAddressModel =
    useModelParser(schema, get(data, "model", data), baseModel) ?? {};

  // first let's check we have a valid country,
  // fallback to the default country if not set or invalid

  if (safeModel?.address) {
    country = getCountry(
      safeModel?.address?.countryId ?? baseModel.address?.countryId
    );

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

  if (safeModel?.company) {
    safeModel.company.address ??= {
      address1: "",
      city: "",
      postcode: "",
      countryId: baseModel.address?.countryId,
    } as AddressModel;

    country = getCountry(
      safeModel.company?.address?.countryId ?? baseModel.address?.countryId
    );

    safeModel.company.address!.countryId = country.id;

    // let's check if the country has changed, i.e.: the regions don't match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country from the address
    // this will in turn update the phone schema to match the country
    if (!some(regions, ["countryId", safeModel.company.address?.countryId])) {
      regions = await fetchRegions(safeModel.company.address!.countryId);
    }

    // now let's check our region list to see if we have a match
    // if so, then we need to update the safeModel with the new region id
    // otherwise the regionId is reset to null
    const region = find(regions, ["id", safeModel.company.address?.regionId]);
    safeModel.company.address!.regionId = get(region, "id");
  }

  // now lets check our phone number
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
        number: phone?.number || "",
        nationalNumber: phone?.nationalNumber || "",
        countryCallingCode: phone?.countryCallingCode || "",
        country: phone?.country || countryCode || "",
      },
    };
  }

  return Promise.resolve({
    model: safeModel,
    regions,
    country,
    autoupdate,
  });
}

async function validate({ schema, model }: Partial<UnifiedAddressContext>) {
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

export const useUnifiedAddressServices = () => {
  return {
    loadLookups,
    add: async ({ type, model }: UnifiedAddressContext) => {
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
    },
  };
};
