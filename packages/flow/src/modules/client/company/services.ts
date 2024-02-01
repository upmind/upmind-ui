// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useClientAddresses } from "../address";
import { useClientPhones } from "../phone";
import { useClientEmails } from "../email";

import { useApi, useSession } from "../../";

// --- utils
import { useValidation } from "../../../utils";
import { includes, filter } from "lodash-es";

// --- types
import type { CompanyEvent, CompanyContext } from "./types.d";
import type { ClientListingsEvents, ClientListingsContext } from "../types.d";

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// async function getEnums({ field }: CompanyContext, _event: CompanyEvent) {
//   const { getConfig } = useBrand();

//   const brandPaymentPeriod: DefaultPaymentPeriod | any = await getConfig(
//     BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
//   ).then(response =>
//     get(response, BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD)
//   );
// }

async function load(
  _context: ClientListingsContext,
  { data }: ClientListingsEvents
) {
  const { get, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return get({
    url: useUrl(`clients/${clientId}/companies`, {
      // with: [].join(),
      limit: 0
    }),
    withAccessToken: true,
    useCache: true,
    refresh: true
  }).then(({ data }) => data);
}

async function loadLookups({ model }: CompanyContext, _event: CompanyEvent) {
  // lets start up/use our dependencies
  const addresses = useClientAddresses();
  const phones = useClientPhones();
  const emails = useClientEmails();

  // lets wait for them to be ready and loaded before we continue
  const addressesReady = waitFor(
    addresses.service,
    state => !state.matches("loading")
  );
  const phonesReady = waitFor(
    phones.service,
    state => !state.matches("loading")
  );
  const emailsReady = waitFor(
    emails.service,
    state => !state.matches("loading")
  );

  return Promise.all([addressesReady, phonesReady, emailsReady]).then(() => ({
    emails: useClientEmails,
    addresses: useClientAddresses,
    phones: useClientPhones,
    baseModel: {
      ...model,
      address_id: addresses.getDefault()?.id,
      email_id: emails.getDefault()?.id,
      phone_id: phones.getDefault()?.id
    }
  }));
}

async function filterItems(
  { raw }: ClientListingsContext,
  { data }: ClientListingsEvents
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

  debugger;
  return Promise.resolve(filteredItems);
}

// --------------------------------------------------------

async function add({ model }: CompanyContext, _event: CompanyEvent) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/companies`),
    data: {
      name: model.name,
      address_id: model.address_id,
      email_id: model.email_id,
      phone_id: model.phone_id,
      reg_number: model.reg_number,
      vat_number: model.vat_number,
      vat_percent: model.vat_percent
    },
    withAccessToken: true
  }).then(({ data }) => data);
}

async function update({ model }: CompanyContext, _event: CompanyEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/companies/${model.id}`),
    data: {
      name: model.name,
      address_id: model.address_id,
      email_id: model.email_id,
      phone_id: model.phone_id,
      reg_number: model.reg_number,
      vat_number: model.vat_number,
      vat_percent: model.vat_percent
    },
    withAccessToken: true
  }).then(({ data }) => data);
}

async function setDefault({ model }: CompanyContext, _event: CompanyEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/companies/${model.id}`),
    data: { default: true },
    withAccessToken: true
  }).then(({ data }) => data);
}

async function remove({ model }: CompanyContext, _event: CompanyEvent) {
  const { del, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return del({
    url: useUrl(`clients/${clientId}/companies/${model.id}`),
    withAccessToken: true
  }).then(({ data }) => data);
}

// --------------------------------------------------------

async function parse({ model }: PhoneContext, _event: PhoneEvent) {
  // ---
  return Promise.resolve({ model });
}

async function validate(
  { schema, model }: CompanyContext,
  _event: CompanyEvent
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

// --------------------------------------------------------
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
  filter: filterItems
};
