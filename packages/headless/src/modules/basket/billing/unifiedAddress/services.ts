// --- external
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import {
  AddressTypes,
  useClientEmails,
  useClientPhones,
  useClientAddresses,
  useClientCompanies,
} from "../../../client";
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
import { find, first, get, isEmpty, isString, pick, some } from "lodash-es";

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
import { invalidateQueryByKey } from "../../../query";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey = ["unified-addresses"];

/**
 * Load the lookups for the address form
 * @param {UnifiedAddressContext} context
 * @returns {Promise<UnifiedAddressContext>}
 */
async function loadLookups({
  model,
  schema,
}: UnifiedAddressContext): Promise<UnifiedAddressContext> {
  const { getAll: getPhones } = useClientPhones();
  const { getAll: getEmails } = useClientEmails();
  const { isReady: getAddresses, data: addresses } = useClientAddresses();

  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  await isReady().catch(error => Promise.reject(error));

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  const [phones, emails, countries] = await Promise.all([
    getPhones(),
    getEmails(),
    fetchCountries(),
    getAddresses(),
  ]);

  const country = getCountry(model?.countryId);
  const regions = await fetchRegions(model?.countryId || country?.id);

  if (!countries || !regions) {
    return Promise.reject("Failed to load countries and regions");
  }

  const baseModel: UnifiedAddressModel = {
    city: "",
    name: "",
    address1: "",
    countryId: country?.id,
    default: false,
    postcode: "",
    type: first(AddressTypes)?.key || 1,
  };

  const safeModel = useModelParser<UnifiedAddressModel>(
    schema,
    model,
    baseModel,
    { allowExtraProps: false }
  );

  return Promise.resolve({
    regions,
    country,
    countries,
    phones,
    emails,
    addresses: addresses.value,
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

  // for the unified address we need to check if we have company details or just an address.
  if (!data?.companyDetails) {
    // If we don't then we can just create the address as normal...simple
    return addAddress({ model: data }).then(() =>
      useBillingDetailsServices().invalidate()
    );
  } else {
    // if we do then we need to:
    // check if the address provided already exists in our addresses or if we need to create a new one
    // check if the phone number provided already exists in our phones or if we need to create a new one
    // check if the email provided already exists in our emails or if we need to create a new one
    // then create the address, email and phone as necessary and use the ids to create the company

    // First ensure dependencies to get refs to address, email, and phone
    return ensureDependencies({ model: data })
      .then(({ address, email, phone }) =>
        // Only create company, since address was already created or found by ensureDependencies
        addCompany({
          model: {
            // relations details
            emailId: email?.id,
            phoneId: phone?.id,
            addressId: address?.id,
            // company details
            name: data.companyName,
            regNumber: data.regNumber,
            vatNumber: data.vatNumber,
            // vatPercent: model.vatPercent,
          },
        })
      )
      .then(() => useBillingDetailsServices().invalidate());
  }
}

async function update(id: string, data: UnifiedAddressModel) {
  const { update: updateAddress } = useClientAddressServices();
  const { update: updateCompany } = useClientCompanyServices();

  // for the unified address we need to check if we have company details or just an address.
  if (!data?.companyDetails) {
    // If we don't then we can just create the address as normal...simple
    return updateAddress({ id, model: data }).then(() =>
      useBillingDetailsServices().invalidate()
    );
  } else {
    // if we do then we need to :
    // check if the address provided already exists in our addresses or if we need to create a new one
    // check if the phone number provided already exists in our phones or if we need to create a new one
    // check if the email provided already exists in our emails or if we need to create a new one
    // then create the address, email and phone as necessary and use the ids to create the company
    return ensureDependencies({ model: data })
      .then(({ address, email, phone }) =>
        updateCompany({
          id,
          model: {
            name: data.companyName,
            addressId: address?.id,
            emailId: email?.id,
            phoneId: phone?.id,
            regNumber: data.regNumber,
            vatNumber: data.vatNumber,
            // vatPercent: model.vatPercent,
          },
        }).then(() => {})
      )
      .then(() => useBillingDetailsServices().invalidate());
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
  const safeModel: UnifiedAddressModel = useModelParser(
    schema,
    get(data, "model", data),
    baseModel,
    { allowExtraProps: false }
  );

  if (!isEmpty(data)) {
    // let's check if the country has changed, ie: the regions don't match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country from the address
    // this will in turn update the phone schema to match the country
    if (!some(regions, ["countryId", safeModel.countryId]))
      regions = await fetchRegions(safeModel.countryId);

    // now lets check our regions list to see if we have a match
    // if so, then we need to update the model with the new region id
    // otherwise the region_id is reset to null
    country = getCountry(safeModel.countryId);
    const region = find(regions, ["id", data?.regionId]);
    safeModel.regionId = get(region, "id", undefined);

    // now lets check our phone number
    if (data?.phone) {
      const phoneNumber = isString(safeModel.phone)
        ? data?.phone
        : data?.phone?.number || data?.phone?.nationalNumber || "";

      const countryCode =
        data?.phone?.country || data?.phoneCountryCode || country?.code;
      const phone = parsePhoneNumber(phoneNumber, countryCode) || undefined;

      // now map the phone number to the model in the correct format with fallbacks
      safeModel.phone = phone
        ? {
            number: phone?.number || safeModel.phone?.number || "",
            nationalNumber:
              phone?.nationalNumber || safeModel.phone?.nationalNumber || "",
            countryCallingCode:
              phone?.countryCallingCode ||
              safeModel.phone?.countryCallingCode ||
              "",
            country: countryCode,
          }
        : undefined;
    }

    // force the type as company if we have added company details
    if (safeModel.companyDetails) {
      safeModel.type = 4; // company
    }

    if (!safeModel.companyDetails) {
      // housekeeping
      safeModel.phone = undefined;
      safeModel.email = undefined;
      safeModel.companyName = undefined;
      safeModel.regNumber = undefined;
      safeModel.vatNumber = undefined;
      // safeModel.vatPercent = undefined;
    }
  }

  return Promise.resolve({ model: safeModel, regions, country });
}

async function validate({ schema, model }: Partial<UnifiedAddressContext>) {
  // ---
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
  const emails = useClientEmails();

  const data = pick(model, ["email"]) as EmailModel;

  return new Promise<Email>((resolve, reject) => {
    const found = emails.findOne(data);
    found ? resolve(found) : reject();
  }).catch(async () => {
    const { add, refresh } = useClientEmailServices();
    return add({
      model: { ...data, name: model.name },
    }).then(item => {
      // NB: Remember to refresh our machines so we have the new data
      refresh();
      return mapEmail(item.data);
    });
  });
}

async function ensurePhone(model: UnifiedAddressModel): Promise<Phone> {
  const phones = useClientPhones();

  const data = pick(model, ["phone"]) as PhoneModel;

  return new Promise<Phone>((resolve, reject) => {
    const found = phones.findOne(data);
    found ? resolve(found) : reject();
  }).catch(async () => {
    const { add, refresh } = useClientPhoneServices();
    return add({ model: data }).then(item => {
      // NB: Remember to refresh our machines so we have the new data
      refresh();
      return mapPhone(item.data);
    });
  });
}

async function ensureAddress(model: UnifiedAddressModel): Promise<Address> {
  const addresses = useClientAddresses();

  const data = pick(model, [
    "address1",
    "address2",
    "city",
    "postcode",
    "regionId",
    "countryId",
  ]) as AddressModel;

  return new Promise<Address>((resolve, reject) => {
    const found = addresses.findOne(data);
    found ? resolve(found) : reject();
  }).catch(async () => {
    const { add, refresh } = useClientAddressServices();
    return add({
      model: { ...data, name: model.name },
    }).then(item => {
      // NB: Remember to refresh our machines so we have the new data
      refresh();
      return mapAddress(item.data);
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
  ]).then(([email, phone, address]) => ({ email, phone, address }));
}

export default {
  queryKey,
};

export const useBillingDetailsServices = () => {
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
      // Invalidate the unified-addresses query
      await invalidateQueryByKey(queryKey)(null);

      // Also invalidate the underlying queries
      const { invalidate: invalidateAddresses } = useClientAddresses();
      const { invalidate: invalidateCompanies } = useClientCompanies();

      await Promise.all([invalidateAddresses(null), invalidateCompanies(null)]);
    },
  };
};
