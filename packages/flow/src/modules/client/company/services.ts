// --- external

// --- internal
import { useApi, useSystem, useSession } from "../../";

// --- utils
import { useValidation } from "../../../utils";
import { some, isEmpty, find, get, first } from "lodash-es";

// --- types
import type {
  CompanyEvent,
  CompanyContext,
  CompaniesEvents,
  CompaniesContext
} from "./types.d";

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

async function load(_context: CompaniesContext, { data }: CompaniesEvents) {
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

async function loadLookups({ model }: CompanyContext, { data }: CompanyEvent) {
  const { fetchCountries, fetchRegions, getDefaultCountry } = useSystem();

  const emails = fetchCountries();
  const addresses = fetchRegions();
  const phones = fetchRegions();

  return Promise.all([emails, addresses, phones]).then(
    ([emails, addresses, phones]) => {
      if (emails && addresses && phones) {
        return {
          emails,
          addresses,
          phones,
          baseModel: {
            ...model,
            address_id: getDefaultCountry(),
            email_id: getDefaultCountry(),
            phone_id: getDefaultCountry()
          }
        };
      }
    }
  );
}

// --------------------------------------------------------

async function add({ model }: CompanyContext, _event: CompanyEvent) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return post({
    url: useUrl(`clients/${clientId}/companies`),
    data: model,
    withAccessToken: true
  }).then(({ data }) => data);
}

async function update({ model }: CompanyContext, _event: CompanyEvent) {
  const { put, useUrl } = useApi();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  return put({
    url: useUrl(`clients/${clientId}/companies/${model.id}`),
    data: model,
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
  validate,
  setDefault,
  add,
  update,
  remove
};
