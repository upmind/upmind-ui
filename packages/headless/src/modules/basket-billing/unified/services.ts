import parsePhoneNumber, { type CountryCode } from "libphonenumber-js";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../../brand";
import { useClientAddresses } from "../../client-address";
import { useClientAddressServices } from "../../client-address";
import { useClientCompanies } from "../../client-company";
import { useClientEmails } from "../../client-email";
import { useClientPhones } from "../../client-phone";
import { ScopeActorTypes } from "../../scope";
import { useSystem } from "../../system";
import { useI18n } from "../../system-localisation";
import { UnifiedType } from "./types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../../utils";
import { find, get, isEmpty, isString, some } from "lodash-es";
import type { UnifiedContext, UnifiedModel } from "./types";
import type { AddressModel } from "../../client-address";
import type { CompanyModel } from "../../client-company";
import type { PhoneModel } from "../../client-phone";
import type { AnyEventObject } from "xstate";

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
  const clientPhones = useClientPhones().as(ScopeActorTypes.SELF);
  const { isReady: getPhones } = clientPhones.useActions();
  const { default: defaultPhone, data: phones } = clientPhones.useContext();

  const clientEmails = useClientEmails().as(ScopeActorTypes.SELF);
  const { isReady: getEmails } = clientEmails.useActions();
  const { default: defaultEmail, data: emails } = clientEmails.useContext();

  const {
    isReady: getAddresses,
    default: defaultAddress,
    data: addresses
  } = useClientAddresses();

  const companiesScope = useClientCompanies().as(ScopeActorTypes.CLIENT);
  const { isReady: getCompanies } = companiesScope.useActions();
  const { data: companies } = companiesScope.useContext();

  const { isReady, ensureCountries, fetchRegions, getCountry } = useSystem();

  const { ensureConfig } = useBrand();

  await isReady().catch(error => Promise.reject(error));

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  const [countries, config] = await Promise.all([
    ensureCountries(),
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
            addressId: defaultAddress()?.id,
            emailId: defaultEmail()?.id,
            phoneId: defaultPhone()?.id
          } as CompanyModel)
        : undefined,
    phone: get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE)
      ? ((defaultPhone() ?? {
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
    type,
    regions,
    country,
    countries,
    phones: phones.value ?? [],
    emails: emails.value ?? [],
    addresses: addresses.value ?? [],
    companies: companies.value ?? [],
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
  const { ensure: ensurePhone } = useClientPhones()
    .as(ScopeActorTypes.SELF)
    .useActions();
  const { ensure: ensureCompany } = useClientCompanies()
    .as(ScopeActorTypes.CLIENT)
    .useActions();
  const promises: Promise<any>[] = [];

  promises.push(
    data?.phone && type == UnifiedType.PERSONAL
      ? ensurePhone(data.phone)
      : Promise.resolve(undefined)
  );

  promises.push(
    data?.address && type == UnifiedType.PERSONAL
      ? ensureAddress({ model: { address: data.address } })
      : Promise.resolve(undefined)
  );

  promises.push(
    data?.company && type == UnifiedType.BUSINESS
      ? ensureCompany({
          ...data.company,
          phoneId: data.phone?.id,
          phone: data.phone?.phone
        })
      : Promise.resolve(undefined)
  );

  return Promise.all(promises).then(([phone, address, company]) => {
    return {
      phone: phone?.phone ?? company?.phone, // NB the returned Phone object has a phone property
      address,
      company
    };
  });
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
  const { t } = useI18n();

  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);

    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.unified_address_validation_failed"),
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
      const { invalidate: invalidateCompanies } = useClientCompanies()
        .as(ScopeActorTypes.CLIENT)
        .useActions();
      await Promise.all([invalidateAddresses(null), invalidateCompanies(null)]);
    }
  };
};
