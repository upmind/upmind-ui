// --- external

// --- internal
import {
  useQuery,
  useSession,
  PaginatedParams,
  useQueryPaginated,
} from "../..";
import { useClientPhones } from "../phone";
import { useClientEmails } from "../email";
import { useClientAddresses } from "../address";
import { invalidateQueryByKey } from "../../query/utils";

// --- utils
import { CompanyWithRelations, parseCompany } from "./utils";
import { useValidation } from "../../../utils";
import { includes, filter } from "lodash-es";

// --- types
import { ICompany } from "@upmind-automation/types";
import { AnyEventObject } from "xstate";
import { CompanyContext, CompaniesContext, Company } from "./types";

// -----------------------------------------------------------------------------
// Queries

async function loadAll() {
  const { get, useUrl } = useQuery();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<CompanyWithRelations[]>({
    url: useUrl(`clients/${client.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
      limit: 0,
    }),
    queryKey: ["clients", client.id, "companies"],
    withAccessToken: true,
    revalidateIfStale: true,
  }).then(({ data }) => parseCompany(data ?? []));
}

async function loadPaged(paginationParams: PaginatedParams) {
  const { get, useUrl } = useQueryPaginated();
  const { isAuthenticated } = useSession();
  const client = await isAuthenticated().catch(error => Promise.reject(error));

  return get<CompanyWithRelations[]>({
    url: useUrl(`clients/${client.id}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
    }),
    queryKey: ["clients", client.id, "companies", { ...paginationParams }],
    withAccessToken: true,
    revalidateIfStale: true,
    ...paginationParams,
  }).then(({ data }) => parseCompany(data ?? []));
}

async function loadLookups({ model }: CompanyContext) {
  // let's start up/use our dependencies
  const phones = useClientPhones();
  const emails = useClientEmails();
  const addresses = useClientAddresses();

  return Promise.all([
    addresses.isReady(),
    phones.isReady(),
    emails.isReady(),
  ]).then(async () => {
    const [defaultEmail, defaultAddress] = await Promise.all([
      emails.getDefault(),
      addresses.getDefault(),
    ]);
    const defaultPhone = phones.getDefault();

    return {
      emails,
      addresses,
      phones,
      baseModel: {
        ...model,
        addressId: defaultAddress?.id,
        email: defaultEmail?.email,
        phone: {
          number: defaultPhone?.number,
          nationalNumber: defaultPhone?.national_number,
          countryCallingCode: defaultPhone?.country_calling_code,
          country: defaultPhone?.country,
        },
      },
    };
  });
}

// -----------------------------------------------------------------------------
// Mutations

async function add(company: Company) {
  const { post, useUrl } = useQuery();
  const { getUserId } = useSession();

  const clientId = await getUserId();

  post<ICompany>({
    url: useUrl(`clients/${clientId}/companies`),
    data: {
      name: company.name,
      email_id: company.emailId,
      phone_id: company.phoneId,
      address_id: company.addressId,
      reg_number: company.regNumber,
      vat_number: company.vatNumber,
    },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "companies"]));
}

async function update(company: Company) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  put<ICompany>({
    url: useUrl(`clients/${clientId}/companies/${company.id}`),
    data: {
      name: company.name,
      email_id: company.emailId,
      phone_id: company.phoneId,
      address_id: company.addressId,
      reg_number: company.regNumber,
      vat_number: company.vatNumber,
    },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "companies"]));
}

async function remove(companyId: Company["id"]) {
  const { getUserId } = useSession();
  const { del, useUrl } = useQuery();

  const clientId = await getUserId();

  del<ICompany>({
    url: useUrl(`clients/${clientId}/companies/${companyId}`),
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "companies"]));
}

async function setDefault(companyId: Company["id"]) {
  const { getUserId } = useSession();
  const { put, useUrl } = useQuery();

  const clientId = await getUserId();

  put<ICompany>({
    url: useUrl(`clients/${clientId}/companies/${companyId}`),
    data: { default: true },
    withAccessToken: true,
  }).then(invalidateQueryByKey(["clients", clientId, "companies"]));
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
  //--- queries
  loadAll,
  loadPaged,
  loadLookups,
  //--- mutations
  add,
  update,
  remove,
  setDefault,
  //-- utils
  parse,
  validate,
  //--- session
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
