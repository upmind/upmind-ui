// --- external
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import {
  ADDRESS_TYPE_KEYS,
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
import { mapPhone } from "../../../client/phone/mapper";
import { mapEmail } from "../../../client/email/mappers";
import { mapAddress } from "../../../client/address/mappers";
import { find, get, isEmpty, isString, pick, some } from "lodash-es";

// --- types
import type {
  Email,
  Phone,
  Address,
  EmailModel,
  PhoneModel,
  AddressModel,
} from "../../../client";
import type { AnyEventObject } from "xstate";
import type { UnifiedAddressContext, UnifiedAddressModel } from "./types";
import {
  BrandConfigKeys,
  IAddress,
  IEmail,
  IPhone,
} from "@upmind-automation/types";

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
  allowMultipleEdits,
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

  debugger;

  const country = getCountry(model?.address?.countryId);
  const regions = await fetchRegions(model?.address?.countryId || country?.id);

  if (!countries || !regions) {
    return Promise.reject("Failed to load countries and regions");
  }

  const needsPhone = get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE);

  const baseModel: UnifiedAddressModel = {
    addressId: defaultAddress.value?.id,
    companyId: defaultCompany.value?.id,
    phoneId: needsPhone ? defaultPhone.value?.id : undefined,
    address: {
      city: null,
      address1: null,
      countryId: country?.id,
      postcode: null,
      type: ADDRESS_TYPE_KEYS.HOME,
    },
    company: {
      addressId: defaultAddress.value?.id,
      name: "",
    },
    phone:
      needsPhone && defaultPhone.value
        ? {
            number: defaultPhone.value?.phone.number ?? "",
            nationalNumber: defaultPhone.value?.phone.nationalNumber ?? "",
            countryCallingCode:
              defaultPhone.value?.phone.countryCallingCode ?? "",
            country: defaultPhone.value?.phone.country ?? "",
          }
        : undefined,
    type: ADDRESS_TYPE_KEYS.HOME, // Schema level
  };

  const safeModel = useModelParser<UnifiedAddressModel>(
    schema,
    model,
    baseModel,
    { allowExtraProps: true }
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
    allowMultipleEdits: defaultAddress.value?.id ? true : allowMultipleEdits,
    // ---
    model: safeModel,
    baseModel: safeModel,
  } as UnifiedAddressContext);
}

// -----------------------------------------------------------------------------
// MUTATIONS

async function add(data: UnifiedAddressModel) {
  const { add: addAddress } = useClientAddressServices();
  const { add: addCompany } = useClientCompanyServices();

  if (isEmpty(data?.company)) {
    // For personal addresses, create phone separately if it exists (we don't link as it doesn't accept phone_id)
    if (data?.phone) await ensurePhone(data);

    if (data?.addressId) return Promise.resolve(data);

    return addAddress({ model: data.address });
  } else {
    return ensureDependencies({ model: data }).then(
      async ({ address, email, phone }) => {
        if (!address?.id) return Promise.resolve(data);

        return addCompany({
          model: {
            ...data.company,
            name: data.company!.name,
            addressId: address.id,
            emailId: email?.id,
            phoneId: phone?.id,
          },
        });
      }
    );
  }
}

async function update(id: string, data: UnifiedAddressModel) {
  const { update: updateAddress } = useClientAddressServices();
  const { update: updateCompany } = useClientCompanyServices();

  if (isEmpty(data?.company)) {
    // For personal addresses, create phone separately if it exists (we don't link as it doesn't accept phone_id)
    if (data?.phone) await ensurePhone(data);

    return updateAddress({ id, model: data.address });
  } else {
    return ensureDependencies({ model: data }).then(
      async ({ address, email, phone }) => {
        if (!address?.id) return Promise.resolve(data);
        return updateCompany({
          id,
          model: {
            ...data.company,
            name: data.company!.name,
            addressId: address?.id,
            emailId: email?.id,
            phoneId: phone?.id,
          },
        });
      }
    );
  }
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

async function parse(
  { baseModel, schema, regions, country }: UnifiedAddressContext,
  { data }: AnyEventObject
) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )
  const { fetchRegions, getCountry } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model
  const inputData = get(data, "model", data);
  const safeModel: UnifiedAddressModel = useModelParser(
    schema,
    inputData,
    baseModel,
    { allowExtraProps: true }
  );

  // Preserve company field from baseModel if it exists and safeModel doesn't have it
  // This is needed because the schema uses oneOf structure and useModelParser
  // only processes top-level/root properties
  if (
    baseModel?.company &&
    !safeModel?.company &&
    inputData?.type === ADDRESS_TYPE_KEYS.COMPANY
  ) {
    safeModel.company = baseModel.company;
  }

  if (!isEmpty(data)) {
    // let's check if the country has changed, ie: the regions don't match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country from the address
    // this will in turn update the phone schema to match the country
    const addressCountryId = safeModel?.address?.countryId;
    if (!some(regions, ["countryId", addressCountryId]))
      regions = await fetchRegions(addressCountryId);

    // now lets check our regions list to see if we have a match
    // if so, then we need to update the model with the new region id
    // otherwise the region_id is reset to null
    country = getCountry(addressCountryId);
    const region = find(regions, ["id", safeModel?.address?.regionId]);

    if (safeModel?.address) {
      safeModel.address.regionId = get(region, "id");
    }

    // now lets check our phone number
    if (data?.phone) {
      const phoneNumber = isString(data?.phone)
        ? data?.phone
        : data?.phone?.number || data?.phone?.nationalNumber || "";

      const countryCode =
        data?.phone?.country || data?.phoneCountryCode || country?.code;
      const phone = parsePhoneNumber(phoneNumber, countryCode) || undefined;

      safeModel.phone = phone
        ? {
            number: phone?.number || "",
            nationalNumber: phone?.nationalNumber || "",
            countryCallingCode: phone?.countryCallingCode || "",
            country: countryCode,
          }
        : undefined;
    }

    // force the type as company if we have added company details
    if (safeModel?.type === ADDRESS_TYPE_KEYS.COMPANY && safeModel?.address) {
      safeModel.address.type = ADDRESS_TYPE_KEYS.COMPANY;
    }
  }

  return Promise.resolve({ model: safeModel, regions, country });
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

async function ensureEmail(model: UnifiedAddressModel): Promise<Email> {
  const { findOne } = useClientEmails();
  const { add, refresh } = useClientEmailServices();

  const data = pick(model?.company, ["email"]) as EmailModel;

  return new Promise<Email>((resolve, reject) => {
    const found = findOne(data);
    if (found) return resolve(found);

    return add({ model: data }).then(item => {
      if (!item) return reject();
      // NB: Remember to refresh our machines so we have the new data
      refresh();
      return mapEmail(item);
    });
  });
}

async function ensurePhone(model: UnifiedAddressModel): Promise<Phone> {
  const { findOne } = useClientPhones();
  const { add, refresh } = useClientPhoneServices();

  const data = pick(model, ["phone"]) as PhoneModel;

  return new Promise<Phone>((resolve, reject) => {
    const found = findOne(data);
    if (found) return resolve(found);

    return add({ model: data }).then(item => {
      if (!item) return reject();
      // NB: Remember to refresh our machines so we have the new data
      refresh();
      return mapPhone(item);
    });
  });
}

async function ensureAddress(model: UnifiedAddressModel): Promise<Address> {
  const { getOne, findOne } = useClientAddresses();
  const { add, refresh } = useClientAddressServices();

  // Include type field and set to company type if this is for a company
  const data = {
    ...pick(model?.address, [
      "address1",
      "address2",
      "city",
      "postcode",
      "regionId",
      "countryId",
      "type",
    ]),
    type: model.type,
  } as AddressModel;

  return new Promise<Address>((resolve, reject) => {
    const found = getOne(model.company?.addressId) || findOne(data);
    if (found) return resolve(found);

    return add({
      model: { ...data, name: model?.address?.name },
    }).then(item => {
      if (!item) return reject();
      // NB: Remember to refresh our machines so we have the new data
      refresh();
      return mapAddress(item);
    });
  });
}

async function ensureDependencies({
  model,
}: Partial<UnifiedAddressContext>): Promise<{
  email: Email;
  phone: Phone;
  address: Address;
}> {
  if (!model)
    return Promise.reject(
      new DetailedError(
        "No address model provided",
        responseCodes.Unprocessable_Entity
      )
    );

  // for our dependencies we need to check if they already exists by finding them in their respective stores
  // if they do then we can just return the id
  // if they don't then we return a promise of the add method
  // NB: for each new dependency we force type to be 4 = company
  return Promise.all([
    ensureEmail(model),
    ensurePhone(model),
    ensureAddress(model),
  ]).then(([email, phone, address]) => {
    return { email, phone, address };
  });
}

// -----------------------------------------------------------------------------

export const useUnifiedAddressServices = () => {
  return {
    loadLookups,
    add: async (context: Partial<UnifiedAddressContext>) => {
      if (isEmpty(context.model))
        return Promise.reject("No address model provided");
      return add(context.model);
    },
    update: async (context: Partial<UnifiedAddressContext>) => {
      if (!context.id) return Promise.reject("No address id provided");
      if (isEmpty(context.model))
        return Promise.reject("No address model provided");

      return update(context.id, context.model);
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
