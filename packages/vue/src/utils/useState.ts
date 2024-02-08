// --- external
import { computed, unref } from "vue";
import { useActor } from "@xstate/vue";

// --- internal

// --- utils
import { isFunction, map, some, get, isArray, isEmpty } from "lodash-es";

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

  return some(context, props);
};

export const machineMatches = (machine, states: string[]) => {
  machine = unref(machine);

  if (!machine || !states?.length) return false;

  const state = unref(machine.state);

  return stateMatches(state, states);
};

// --- value helpers
export const stateValue = (state, prop?: string, fallback?: any) => {
  state = unref(state);

  if (!state) return fallback;

  if (!prop?.length) return fallback;

  return get(state, prop, fallback);
};

export const contextValue = (state, prop?: string, fallback?: any) => {
  const context = stateValue(state, "context");

  if (!prop?.length || !context) return fallback;

  return get(context, prop, fallback);
};

export const childActor = (state, prop?: string) => {
  state = unref(state);

  if (!state || !prop?.length) return undefined;

  const child = contextValue(state, prop);

  if (!child) return undefined;

  return useActor(child.value);
};

export const childrenActors = (state, prop?: string) => {
  state = unref(state);
  if (!state || !prop?.length) return [];
  const children = contextValue(state, prop, []);

  if (!isArray(children) || isEmpty(children)) return [];

  return map(children, child => ({
    id: child.id,
    ...useActor(child)
  }));
};

// --- computed helpers

export const useState = (state, prop?: string, fallback?: any) =>
  computed(() => stateValue(state, prop, fallback));

export const useContext = (state, prop?: string, fallback?: any) =>
  computed(() => contextValue(state, prop, fallback));

export const useChild = (state, prop?: string) =>
  computed(() => childActor(state, prop));

export const useChildren = (state, prop?: string) =>
  computed(() => childrenActors(state, prop));
