// --- internal
import { useApi } from "../api";

// --- utils

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(_context: any, _event: any) {
  // TODO:  check local storage for token and basket

  // for now we will always return false, so that we generate a guest token + basket
  return Promise.reject("Not implemented");
}

async function generateGuestToken(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("terms_and_conditions/current?lang=en"),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ access }: any) => access);
}

async function generateBasket(_context: any, _event: any) {
  // TODO:  generate a actual basket

  // const { get, useUrl, useTime } = useApi();
  // return get({
  //   url: useUrl(""),
  //   useCache: false
  // }).then((response: any) => response?.data);

  // for now we will always return a Positive empty response, so that we can move on
  return Promise.resolve();
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  generateGuestToken,
  generateBasket
};
