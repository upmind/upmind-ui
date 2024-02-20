// --- external
import { computed, unref } from "vue";
import { useActor } from "@xstate/vue";

// --- internal

// --- utils
import {
  isFunction,
  map,
  some,
  get,
  isArray,
  isObject,
  isEmpty,
  isNil
} from "lodash-es";

// --------------------------------------------------------
// These are some helper to reduce the repetition of the same code when using xstate/vue

// --- state matching
export const stateMatches = (state, states: string[]) => {
  // console.log("stateMatches", states?.toString());

  state = unref(state);

  if (!state || !states?.length) return false;

  if (!isFunction(state.matches)) return false;

  // console.log(
  //   "stateMatches",
  //   states?.toString(),
  //   states.some(state.matches),
  //   state.value
  // );

  return states.some(state.matches);
};

export const contextMatches = (state, props: string[]) => {
  const context = stateValue(state, "context");

  if (!context || !props?.length) return false;

  return some(props, prop => {
    const value = get(context, prop);
    return isArray(value) || isObject(value) ? !isEmpty(value) : !!value;
  });
};

export const machineMatches = (machine, states: string[]) => {
  machine = unref(machine);

  if (!machine || !states?.length) return false;

  const state = unref(machine.state);

  return stateMatches(state, states);
};

// --- value helpers
export const stateValue = (state, prop?: string | string[], fallback?: any) => {
  state = unref(state);

  if (!state) return fallback;

  if (!prop?.length) return fallback;

  return get(state, prop, fallback);
};

export const contextValue = (
  state,
  prop?: string | string[],
  fallback?: any
) => {
  const context = stateValue(state, "context");

  if (!prop?.length || !context) return fallback;

  return get(context, prop, fallback);
};

export const childActor = (state, prop?: string | string[], fallback?: any) => {
  state = unref(state);

  if (!state || !prop?.length) return fallback;

  const context = state?.children[prop];
  // const context = get(state, "children", prop);

  if (isNil(context)) return fallback;

  if (isArray(context)) return map(context, createActor);

  return createActor(context);
};

export const contextActor = (
  state,
  prop?: string | string[],
  fallback?: any
) => {
  state = unref(state);

  if (!state || !prop?.length) return fallback;

  const context = contextValue(state, prop);

  if (isNil(context)) return fallback;

  if (isArray(context)) {
    return map(context, createActor);
  }

  return createActor(context);
};

const createActor = context => {
  const actor = useActor(context);
  return {
    id: context.id,
    ...actor
  };
};
// --- computed helpers

export const useState = (state, prop?: string | string[], fallback?: any) =>
  computed(() => stateValue(state, prop, fallback));

export const useContext = (state, prop?: string | string[], fallback?: any) =>
  computed(() => contextValue(state, prop, fallback));

export const useChildActor = (
  state,
  prop?: string | string[],
  fallback?: any
) => computed(() => childActor(state, prop, fallback));

export const useContextActor = (
  state,
  prop?: string | string[],
  fallback?: any
) => computed(() => contextActor(state, prop, fallback));
