// ---  external
import { ActorRef, InterpreterFrom, InterpreterStatus, State } from "xstate";

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
  isNil,
  PropertyPath,
} from "lodash-es";

// -----------------------------------------------------------------------------

export function stopService(machine: InterpreterFrom<any>): boolean {
  machine.status == InterpreterStatus.Running &&
    !machine.getSnapshot().done &&
    machine.stop();

  return machine.status == InterpreterStatus.Stopped;
}

// ---  These are some helper to reduce the repetition of the same code when using xstate/vue

// safe state allows us to pass reactive objects and get the state object
// as well as objects that could contain the state object, eg an actor/machine
// This is useful when we want to pass in a ref or reactive object that could be an actor, machine or a state object

const safeState = (
  stateLike: State<any> | ActorRef<any>
): State<any> | undefined => {
  // an actor has the getSnapshot method to return the state object
  if ("getSnapshot" in stateLike && isFunction(stateLike.getSnapshot)) {
    return stateLike.getSnapshot();
  }

  // state has the matches method, so we know its a state object
  if ("matches" in stateLike && isFunction(stateLike.matches)) {
    return stateLike as State<any>;
  }

  // if its not a state or an actor, we return undefined
  return undefined;
};

// --- state matching
export const stateMatches = (
  stateLike: State<any> | ActorRef<any>,
  states: string[],
  matchAll: boolean = false
): boolean => {
  const state = safeState(stateLike);

  if (!state || !isEmpty(states)) return false;

  return matchAll ? states.every(state.matches) : states.some(state.matches);
};

export const contextMatches = (
  stateLike: State<any> | ActorRef<any>,
  props: string[]
): boolean => {
  const context = stateValue(stateLike, "context");

  if (!context || isEmpty(props)) return false;

  return some(props, prop => {
    const value = get(context, prop);
    return isArray(value) || isObject(value) ? !isEmpty(value) : !!value;
  });
};

export const machineMatches = (
  machine: ActorRef<any>,
  states: string[]
): boolean => {
  if (!machine || isEmpty(states)) return false;

  const state = safeState(machine);

  if (!state) return false;

  return stateMatches(state, states);
};

// --- value helpers
export const stateValue = (
  stateLike: State<any> | ActorRef<any>,
  props?: string | number | (string | number)[],
  fallback?: any
) => {
  const state = safeState(stateLike);

  if (!state) return fallback;

  if (isEmpty(props)) return fallback;

  return get(state, props as PropertyPath, fallback);
};

export const contextValue = (
  stateLike: State<any> | ActorRef<any>,
  props?: string | number | (string | number)[],
  fallback?: any
) => {
  const context = stateValue(stateLike, "context");

  if (isEmpty(props) || isNil(context)) return fallback;

  return get(context, props as PropertyPath, fallback);
};
