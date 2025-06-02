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
import { BrandConfigKeys } from "@upmind-automation/types";
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
  allowMultipleEdits,
}: UnifiedAddressContext): Promise<UnifiedAddressContext> {
  const { getAll: getPhones, getDefault: getDefaultPhone } = useClientPhones();
  const { getAll: getEmails } = useClientEmails();
  const { getAll: getAddresses, getDefault: getDefaultAddress } =
    useClientAddresses();

  const { getAll: getCompanies, getDefault: getDefaultCompany } =
    useClientCompanies();

  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  const { ensureConfig } = useBrand();

  await isReady().catch(error => Promise.reject(error));

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
  const [phones, emails, addresses, companies, countries, config] =
    await Promise.all([
      getPhones(),
      getEmails(),
      getAddresses(),
      getCompanies(),
      fetchCountries(),
      ensureConfig([
        BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
        BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
        BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
        BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
      ]),
    ]);

  const country = getCountry(model?.address?.countryId);
  const regions = await fetchRegions(model?.address?.countryId || country?.id);

  if (!countries || !regions) {
    return Promise.reject("Failed to load countries and regions");
  }

  const defaultAddress = await getDefaultAddress();
  const defaultPhone = await getDefaultPhone();
  const defaultCompany = await getDefaultCompany();

  const baseModel: UnifiedAddressModel = {
    addressId: defaultAddress?.id,
    companyId: defaultCompany?.id,
    address: {
      city: null,
      address1: null,
      countryId: country?.id,
      postcode: null,
      type: ADDRESS_TYPE_KEYS.HOME,
    },
    phone: defaultPhone
      ? {
          number: defaultPhone?.phone.number ?? "",
          nationalNumber: defaultPhone?.phone.nationalNumber ?? "",
          countryCallingCode: defaultPhone?.phone.countryCallingCode ?? "",
          country: defaultPhone?.phone.country ?? "",
        }
      : undefined,
    type: ADDRESS_TYPE_KEYS.HOME, // Schema level
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
    addresses,
    companies,
    config,
    allowMultipleEdits: defaultAddress?.id ? true : allowMultipleEdits,
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
  const { setDefault } = useClientAddresses();

  if (data?.type === ADDRESS_TYPE_KEYS.HOME) {
    // For personal addresses, create phone separately if it exists (we don't link as it doesn't accept phone_id)
    if (data?.phone) {
      await ensurePhone(data);
    }

    if (data?.addressId) {
      return Promise.resolve(data);
    }

    return addAddress({ model: data.address }).then(async item => {
      await setDefault(item.data.id);
      return useBillingDetailsServices().invalidate();
    });
  } else {
    return ensureDependencies({ model: data })
      .then(async ({ address, email, phone }) => {
        const company = addCompany({
          model: {
            emailId: email?.id,
            phoneId: phone?.id,
            addressId: address?.id,
            name: data?.company?.companyName,
            regNumber: data?.company?.regNumber,
            vatNumber: data?.company?.vatNumber,
            ...pick(data?.company, ["vatPercent", "taxId", "businessType"]),
          },
        });
        await setDefault(address?.id);
        return company;
      })
      .then(() => useBillingDetailsServices().invalidate());
  }
}

async function update(id: string, data: UnifiedAddressModel) {
  const { update: updateAddress } = useClientAddressServices();
  const { update: updateCompany } = useClientCompanyServices();

  if (data?.type === ADDRESS_TYPE_KEYS.HOME) {
    // For personal addresses, create phone separately if it exists (we don't link as it doesn't accept phone_id)
    if (data?.phone) {
      await ensurePhone(data);
    }

    return updateAddress({ id, model: data.address }).then(() =>
      useBillingDetailsServices().invalidate()
    );
  } else {
    return ensureDependencies({ model: data })
      .then(({ address, email, phone }) => {
        return updateCompany({
          id,
          model: {
            name: data?.company?.companyName,
            addressId: address?.id,
            emailId: email?.id,
            phoneId: phone?.id,
            regNumber: data?.company?.regNumber,
            vatNumber: data?.company?.vatNumber,
            ...pick(data?.company, ["vatPercent", "taxId", "businessType"]),
          },
        }).then(() => {});
      })
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
  const inputData = get(data, "model", data);
  const safeModel: UnifiedAddressModel = useModelParser(
    schema,
    inputData,
    baseModel,
    { allowExtraProps: true }
  );

  // Remove addressId if not explicitly provided in input (for new addresses)
  if (!inputData?.addressId) {
    delete safeModel.addressId;
    delete baseModel.addressId;
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
  // ---

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

  const data = pick(model?.company, ["email"]) as EmailModel;

  return new Promise<Email>((resolve, reject) => {
    const found = emails.findOne(data);
    found ? resolve(found) : reject();
  }).catch(async () => {
    const { add, refresh } = useClientEmailServices();
    return add({
      model: { ...data, name: model?.address?.name },
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
    const found = addresses.findOne(data);
    found ? resolve(found) : reject();
  }).catch(async () => {
    const { add, refresh } = useClientAddressServices();
    return add({
      model: { ...data, name: model?.address?.name },
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
