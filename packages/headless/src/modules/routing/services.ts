// --- external

import type { AnyEventObject } from "xstate";
import { ROUTE } from "./types";
import type { RoutingEngineContext, Flow } from "./types";

// --- internal
import { useBasket } from "../basket";

// --- utils
import { find, forEach, isEmpty } from "lodash-es";

// --- types

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise
// ---

async function calculateNextRoute(
  { currentFlow, basketHelper }: RoutingEngineContext,
  event: AnyEventObject
) {
  // ---

  // loop though any of our currentFlow( if any ) targets and see if we have a match
  forEach(currentFlow?.targets?.next, target => {
    if (target.guard(basket, event)) return Promise.resolve(target);
  });

  // if weve not found a target, then we need to check if we have a fallback
  forEach(currentFlow?.targets?.fallback, target => {
    if (target.guard(basket, event)) return Promise.resolve(target);
  });

  // if we still dont have a target, then we need to check if we have any items in the basket, as it may be empty
  const basket = basketHelper?.getSnapshot();
  if (isEmpty(basket?.context?.products)) return Promise.resolve(ROUTE.EMPTY);

  //   if we get to this point and we still dont have a target, then we need to check if we have a fallback
  return Promise.reject();
}

async function calculateBackRoute(
  { currentFlow, basketHelper }: RoutingEngineContext,
  event: AnyEventObject
) {
  // ---

  // loop though any of our currentFlow( if any ) targets and see if we have a match
  forEach(currentFlow?.targets?.back, target => {
    if (target.guard(basket, event)) return Promise.resolve(target);
  });

  // if weve not found a target, then we need to check if we have a fallback
  forEach(currentFlow?.targets?.fallback, target => {
    if (target.guard(basket, event)) return Promise.resolve(target);
  });

  // if we still dont have a target, then we need to check if we have any items in the basket, as it may be empty
  const basket = basketHelper?.getSnapshot();
  if (isEmpty(basket?.context?.products)) return Promise.resolve(ROUTE.EMPTY);

  //   if we get to this point and we still dont have a target, then we need to check if we have a fallback
  return Promise.reject();
}

async function calculateFallbackRoute(
  { currentFlow, basketHelper }: RoutingEngineContext,
  event: AnyEventObject
) {
  // ---

  // loop though any of our currentFlow( if any ) targets and see if we have a match
  forEach(currentFlow?.targets?.fallback, target => {
    if (target.guard(basket, event)) return Promise.resolve(target);
  });

  // if we still dont have a target, then we need to check if we have any items in the basket, as it may be empty
  const basket = basketHelper?.getSnapshot();
  if (isEmpty(basket?.context?.products)) return Promise.resolve(ROUTE.EMPTY);

  //   if we get to this point and we still dont have a target, then we need to check if we have a fallback
  return Promise.reject();
}

// --------------------------------------------------------
// EXPORTS

export default {
  calculateNextRoute,
  calculateBackRoute,
  calculateFallbackRoute,
} as any;
