// --- external
import parsePhoneNumber from "libphonenumber-js";

// --- internal
import { useApi, useSystem, useSession } from "../..";
import { usePlaces } from "../places";
import { useClientAddresses } from "../address";
import { useClientPhones } from "../phone";
import { useClientEmails } from "../email";

// --- utils
import { useValidation } from "../../../utils";
import { parseAddress } from "./utils";
import {
  some,
  first,
  isEmpty,
  find,
  get,
  includes,
  filter,
  defaultsDeep,
  isString,
  pick,
  isEqual,
} from "lodash-es";

// --- types
import { AddressTypes } from "../address/types";
import type { IAddressData } from "../address/types";
import type { UnifiedAddressContext, UnifiedAddressesContext } from "./types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
// ENUMS

// -----------------------------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// async function getEnums({ field }: UnifiedAddressContext, _event: AnyEventObject) {
//   const { getConfig } = useBrand();

//   const brandPaymentPeriod: DefaultPaymentPeriod | any = await getConfig(
//     BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
//   ).then(response =>
//     get(response, BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD)
//   );
// }

async function load(_context: UnifiedAddressesContext, _event: AnyEventObject) {
  const { get, useUrl } = useApi();

  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  const addresses = get({
    url: useUrl(`clients/${client.id}/addresses`, {
      limit: 0,
      with: ["region", "country"].join(),
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true,
  }).then(({ data }: any) => parseAddress(data));

  const companies = get({
    url: useUrl(`clients/${client.id}/companies`, {
      limit: 0,
      with: [
        "address",
        "address.region",
        "address.country",
        "email",
        "phone",
      ].join(),
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true,
  }).then(({ data }: any) => parseAddress(data));

  return Promise.all([addresses, companies]).then(
    ([addresses, companies]) => [...companies, ...addresses] // we prioritise/return the companies first so they are at the top of the list
  );
}

async function filterItems(
  // TODO: { raw }: ClientListingsContext,
  // TODO: { data }: AnyEventObject
  { raw }: any,
  { data }: any
) {
  if (!data?.length)
    return Promise.reject({ error: "No data provided for filtering" });

  const filteredItems = filter(
    raw,
    item =>
      includes(item.state.context?.title?.toLowerCase(), data?.toLowerCase()) ||
      includes(
        item.state.context?.description?.toLowerCase(),
        data?.toLowerCase()
      )
  );

  return Promise.resolve(filteredItems);
}

async function findItem(
  // TODO: { raw }: ClientListingsContext,
  { raw }: any,
  { data }: { data: IAddressData }
) {
  if (isEmpty(data))
    return Promise.reject({ error: "No data provided for filtering" });
  const value = pick(data, [
    "address1",
    "address2",
    "city",
    "postcode",
    "regionId",
    "countryId",
  ]);

  const found = find(raw, item =>
    isEqual(
      pick(item.state.context.model, [
        "address1",
        "address2",
        "city",
        "postcode",
        "regionId",
        "countryId",
      ]),
      value
    )
  );

  return new Promise((resolve, reject) => {
    if (!found) reject();
    resolve(found);
  });
}

// -----------------------------------------------------------------------------

async function add(
  // TODO: { model, addresses, phones, emails }: UnifiedAddressContext,
  { model, addresses, phones, emails }: any,
  _event?: AnyEventObject
) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  // for the unified address we need to check if we have company details or jsut an address.
  if (!model?.companyDetails) {
    // If we dont then we can just create the address as normal...simple
    return post({
      url: useUrl(`clients/${clientId}/addresses`),
      data: {
        id: model.id,
        client_id: model.clientId,
        // ---
        name: model.name,
        address_1: model.address1,
        address_2: model.address2,
        city: model.city,
        postcode: model.postcode,
        region_id: model.regionId,
        country_id: model.countryId,
      },
      withAccessToken: true,
    }).then(({ data }: any) => data);
  } else {
    // if we do then we need to :
    // check if the address provided already exists in our addresses or if we need to create a new one
    // check if the phone number provided already exists in our phones or if we need to create a new one
    // check if the email provided already exists in our emails or if we need to create a new one
    // thhen create the address, email and phone as necessary and use the ids to create the company
    // @ts-ignore
    const [address, email, phone] = await ensureDependencies({
      model,
      addresses,
      emails,
      phones,
    }).catch(error => {
      Promise.reject(error);
    });

    return post({
      url: useUrl(`clients/${clientId}/companies`),
      data: {
        name: model.companyName,
        address_id: address?.id,
        email_id: email?.id,
        phone_id: phone?.id,
        reg_number: model.regNumber,
        vat_number: model.vatNumber,
        // vat_percent: model.vatPercent,
      },
      withAccessToken: true,
    }).then(({ data }: any) => data);
  }
}

async function update(
  { model, addresses, phones, emails }: any,
  _event: AnyEventObject
) {
  const { post, put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  // for the unified address we need to check if we have company details, and existing company or just an address.
  //

  if (!model?.companyId && !model?.companyDetails) {
    return put({
      url: useUrl(`clients/${clientId}/addresses/${model.id}`),
      data: model,
      withAccessToken: true,
    }).then(({ data }: any) => data);
  } else {
    // if we do then we need to :
    // check if the address provided already exists in our addresses or if we need to create a new one
    // check if the phone number provided already exists in our phones or if we need to create a new one
    // check if the email provided already exists in our emails or if we need to create a new one
    // thhen create the address, email and phone as necessary and use the ids to the company
    // @ts-ignore
    const [address, email, phone] = await ensureDependencies({
      model,
      addresses,
      emails,
      phones,
    }).catch(error => {
      Promise.reject(error);
    });

    // if we have a company_id then we are updating an existing company with the ensureDependencies
    if (model.companyId) {
      return put({
        url: useUrl(`clients/${clientId}/companies/${model.id}`),
        data: {
          name: model.companyName,
          address_id: address?.id,
          email_id: email?.id,
          phone_id: phone?.id,
          reg_number: model.regNumber,
          vat_number: model.vatNumber,
          // vat_percent: model.vatPercent,
        },
        withAccessToken: true,
      }).then(({ data }: any) => data);
    } else {
      // if we dont have a company_id then we are creating a new company with the ensureDependencies
      return post({
        url: useUrl(`clients/${clientId}/companies`),
        data: {
          name: model.companyName,
          address_id: address?.id,
          email_id: email?.id,
          phone_id: phone?.id,
          reg_number: model.regNumber,
          vat_number: model.vatNumber,
          // vat_percent: model.vatPercent,
        },
        withAccessToken: true,
      }).then(({ data }: any) => data);
    }
  }
}

async function remove(
  // TODO: { model }: UnifiedAddressContext,
  { model }: any,
  _event: AnyEventObject
) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  if (!model?.companyId) {
    return del({
      url: useUrl(`clients/${clientId}/addresses/${model.id}`),
      withAccessToken: true,
    }).then(({ data }: any) => data);
  } else {
    return del({
      url: useUrl(`clients/${clientId}/companies/${model.id}`),
      withAccessToken: true,
    }).then(({ data }: any) => data);
  }
}

async function setDefault(
  // TODO: { model }: UnifiedAddressContext,
  { model }: any,
  _event: AnyEventObject
) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/addresses/${model.id}`),
    data: { default: true },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}
// -----------------------------------------------------------------------------

async function ensureDependencies({
  model,
  addresses,
  emails,
  phones,
  // TODO: }: UnifiedAddressContext) {
}: any) {
  const address = pick(model, [
    "address1",
    "address2",
    "city",
    "postcode",
    "regionId",
    "countryId",
  ]);

  // for our dependencies we need to check if the they already exists by finding them in their respective stores
  // if they do then we can just return the id
  // if they dont then we return a promise of the add method
  // NB: for each new dependency we force type to be 4 = company
  const dependencies = [
    addresses
      .find(address)
      .then((item: any) => item?.state?.context?.model)
      .catch(() => {
        return addresses.add({
          model: { ...address, type: 4, name: model.name },
        });
      }),

    !model?.email
      ? Promise.resolve(null)
      : emails
          .find(model.email)
          .then((item: any) => item?.state?.context?.model)
          .catch(() => {
            return emails.add({ model: { email: model.email, type: 4 } });
          }),

    !model?.phone
      ? Promise.resolve(null)
      : phones
          .find(model.phone)
          .then((item: any) => item?.state?.context?.model)
          .catch(() => {
            return phones.add({ model: { phone: model.phone, type: 4 } });
          }),
  ];

  return Promise.all(dependencies);
}

async function loadLookups(
  { model }: UnifiedAddressContext,
  _event: AnyEventObject
) {
  const { isReady, fetchCountries, fetchRegions, getCountry } = useSystem();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so theres no worry about performance
  await isReady().catch(error => Promise.reject(error));
  const countries = await fetchCountries();
  const country = getCountry(model?.countryId);
  const regions = await fetchRegions(model?.countryId || country?.id);

  if (!countries || !regions) {
    return Promise.reject("Failed to load countries and regions");
  }

  // ---
  // lets start up/use our dependencies
  const addresses = useClientAddresses();
  const phones = useClientPhones();
  const emails = useClientEmails();
  const places = usePlaces();

  return Promise.all([
    addresses.isReady(),
    phones.isReady(),
    emails.isReady(),
    places.isReady(),
  ])
    .then(() => {
      places.reset();

      const address = addresses.getDefault()?.state?.context?.model;
      const email = emails.getDefault()?.state?.context?.model;
      const phone = phones.getDefault()?.state?.context?.model;
      return {
        countries,
        regions,
        types: AddressTypes,
        places,
        country,
        // ---
        emails,
        addresses,
        phones,
        // ---
        baseModel: {
          ...model,
          manualPlace: !!model?.id,
          type: first(AddressTypes)?.key,
          phone: phone?.phone,
          email: email?.email,
          country_id: address?.countryId || country?.id,
        },
      };
    })
    .catch(() => {
      Promise.reject("Failed to load lookups");
    });
}

async function parse(
  // TODO: { addresses, schema, model, regions, country, places }: UnifiedAddressContext,
  { addresses, schema, model, regions, country, places }: any,
  event: AnyEventObject
) {
  // We need to check and potentially update the regions list based on the selected country ( if its changed )
  const { fetchRegions, getCountry } = useSystem();

  if (!isEmpty(model)) {
    // let scheck to see if weve been given a place to lookup
    // if we have:
    //  1: get the place from our existing addressess by placeId
    //  2: get the place details from google
    //  4: update the model with the place details
    if (model?.place) {
      const existing = addresses.getItem(model.place);
      if (existing) {
        model.name ??= existing.name; // only update it if weve not already got a value
        model.address1 = existing.address1;
        model.address2 = existing.address2;
        model.city = existing.city;
        model.postcode = existing.postcode;
        model.regionId = existing.regionId;
        model.state = existing.state;
        model.countryId = existing.countryId;
      } else {
        const { getPlaceDetails } = places;
        const place = await getPlaceDetails(model.place);
        model = defaultsDeep(place, model);
      }
    }

    // lets check if the country has changed, ie: the regions dont match
    // if so, then we need to fetch the regions for the new country
    // AND update our 'default' country to match the country fro mthe address
    // this will in turn update the phone schema to match the country
    if (!some(regions, ["countryId", model.countryId]))
      regions = await fetchRegions(model.countryId);

    // now lets check our regions list to see if we have a match
    // if so, then we need to update the model with the new region id
    // otherwise the region_id is reset to null
    country = getCountry(model.countryId);
    const region = find(regions, ["id", model?.regionId]);
    model.regionId = get(region, "id", undefined);

    // now lets check our phone number
    if (model?.phone) {
      const phonenumber = isString(model.phone)
        ? model?.phone
        : model?.phone?.number || model?.phone?.nationalNumber || "";

      const countryCode =
        model?.phone?.country || model?.phoneCountryCode || country?.code;
      const phone = parsePhoneNumber(phonenumber, countryCode) || undefined;

      // now map the phone number to the model in the correct format with fallbacks
      model.phone = phone
        ? {
            number: phone?.number || model.phone?.number,
            nationalNumber:
              phone?.nationalNumber || model.phone?.nationalNumber,
            countryCallingCode:
              phone?.countryCallingCode || model.phone?.countryCallingCode,
            country: countryCode,
          }
        : undefined;
    }

    // finally lets force a manual place if we are invalid:
    // @ts-ignore
    const isValid = await validate({ schema, model }, event)
      .then(() => true)
      .catch(() => false);

    // force the manual place if we are have a place && are invalid
    // OR editing an existing address
    // OR the place value is our reserved word 'manual'
    if (
      (!!model.place?.length && !isValid) ||
      !!model?.id ||
      model.place == "manual"
    ) {
      model.manualPlace = true;
    }

    // force the type as company if we have added company details
    if (model.companyId) {
      model.type = 4; // company
      model.companyDetails = true;
    }

    if (!model.companyDetails) {
      // housekeeping
      model.phone = undefined;
      model.email = undefined;
      model.companyName = undefined;
      model.regNumber = undefined;
      model.vatNumber = undefined;
      model.vatPercent = undefined;
    }
  }

  return Promise.resolve({ model, regions, country });
}

async function validate(
  { schema, model }: UnifiedAddressContext,
  _event: AnyEventObject
) {
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

// -----------------------------------------------------------------------------
// EXPORTS

export default {
  find: findItem,
  load,
  loadLookups,
  validate,
  parse,
  setDefault,
  add,
  update,
  remove,
  filter: filterItems,
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
