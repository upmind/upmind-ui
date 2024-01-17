// --- internal
import { useApi } from "../../api";
import { useBrand, BrandConfigKeys } from "../../brand";

// --- utils
import { useValidation } from "../../../utils";
import { includes, isEmpty, get } from "lodash-es";

// --- types
import type { PlaceEvent, PlaceContext } from "./types";

// --------------------------------------------------------
// HELPERS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function search({ field }: PlaceContext, { data }: PlaceEvent) {
  // if we have a hash, we can skip the request
  if (data?.hash) {
    return Promise.resolve({ ...field, value: data.hash });
  }

  if (!field?.field_type && !data.hash)
    return Promise.reject("No field type or hash provided");

  const { get, useUrl, useTime } = useApi();

  // const path = `${fieldPath({ field_type: field.field_type })}/${data.hash}`;
  const path = `images/${data.hash}`;

  debugger;

  return get({
    url: useUrl(path),
    withAccessToken: true,
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function getPlace({ field }: PlaceContext, { data }: PlaceEvent) {
  // if we have a hash, we can skip the request
  if (data?.hash) {
    return Promise.resolve({ ...field, value: data.hash });
  }

  if (!field?.field_type && !data.hash)
    return Promise.reject("No field type or hash provided");

  const { get, useUrl, useTime } = useApi();

  // const path = `${fieldPath({ field_type: field.field_type })}/${data.hash}`;
  const path = `images/${data.hash}`;

  debugger;

  return get({
    url: useUrl(path),
    withAccessToken: true,
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function validate({ schema, model }: PlaceContext, _event: any) {
  const { validate } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validate(schema, model);
    if (errors?.length) {
      reject(errors);
    } else {
      resolve(model);
    }
  });
}

async function update({ request }: any, _event: any) {
  const { post, useUrl } = useApi();
  // todo
  const path = "";

  return post({
    url: useUrl(path),
    data: request,
    withAccessToken: true
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default {
  search,
  getPlace,
  validate,
  update
};
