// --- external

// --- internal
import { useClientPhones } from "../phone";
import { useClientEmails } from "../email";
import { useClientAddresses } from "../address";

import { useQuery, useSession } from "../..";

// --- utils
import { useValidation } from "../../../utils";
import { includes, filter } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { CompanyContext, CompaniesContext } from "./types";

// -----------------------------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// async function getEnums({ field }: CompanyContext, ) {
//   const { getConfig } = useBrand();

//   const brandPaymentPeriod: DefaultPaymentPeriod | any = await getConfig(
//     BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
//   ).then(response =>
//     get(response, BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD)
//   );
// }

async function load(_context: CompaniesContext) {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get({
    url: useUrl(`clients/${client.id}/companies`, {
      // with: [].join(),
      limit: 0,
    }),
    queryKey: [
      "clients",
      client.id,
      "companies",
      {
        // with: [].join(),
        limit: 0,
      },
    ],
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }: any) => data);
}

async function loadLookups({ model }: CompanyContext) {
  // let's start up/use our dependencies
  const addresses = useClientAddresses();
  const phones = useClientPhones();
  const emails = useClientEmails();

  return Promise.all([
    addresses.isReady(),
    phones.isReady(),
    emails.isReady(),
  ]).then(async () => {
    const defaultAddress = await addresses.getDefault();
    // TODO: `defaultPhone` is not used.
    const defaultPhone = phones.getDefault();
    const defaultEmail = emails.getDefault();
    return {
      emails,
      addresses,
      phones,
      baseModel: {
        ...model,
        addressId: defaultAddress?.id,
        email: defaultEmail?.email,
        phone: {
          number: defaultEmail?.phone?.number,
          nationalNumber: defaultEmail?.phone?.national_number,
          countryCallingCode: defaultEmail?.phone?.country_calling_code,
          country: defaultEmail?.phone?.country,
        },
      },
    };
  });
}

async function filterItems(
  { raw }: CompaniesContext,
  { data }: AnyEventObject
) {
  if (!data?.length)
    return Promise.reject({ error: "No data provided for filtering" });

  const filteredItems = filter(
    raw,
    item =>
      includes(
        item.getSnapshot().context?.title?.toLowerCase(),
        data?.toLowerCase()
      ) ||
      includes(
        item.getSnapshot().context?.description?.toLowerCase(),
        data?.toLowerCase()
      )
  );

  return Promise.resolve(filteredItems);
}

// -----------------------------------------------------------------------------

async function add({ model }: CompanyContext) {
  const { post, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/companies`),
    data: {
      name: model.name,
      address_id: model.addressId,
      email_id: model.emailId,
      phone_id: model.phoneId,
      reg_number: model.regNumber,
      vat_number: model.vatNumber,
      // vat_percent: model.vatPercent,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function update({ model }: CompanyContext) {
  const { put, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/companies/${model.id}`),
    data: {
      name: model.name,
      address_id: model.addressId,
      email_id: model.emailId,
      phone_id: model.phoneId,
      reg_number: model.regNumber,
      vat_number: model.vatNumber,
      // vat_percent: model.vatPercent,
    },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function setDefault({ model }: CompanyContext) {
  const { put, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/companies/${model.id}`),
    data: { default: true },
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function remove({ model }: CompanyContext) {
  const { del, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/companies/${model.id}`),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// -----------------------------------------------------------------------------

// TODO: async function parse({ model }: PhoneContext, _event: PhoneEvent) {
async function parse({ model }: any, _event: any) {
  // ---
  return Promise.resolve({ model });
}

async function validate({ schema, model }: CompanyContext) {
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
  load,
  loadLookups,
  parse,
  validate,
  setDefault,
  add,
  update,
  remove,
  filter: filterItems,
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
