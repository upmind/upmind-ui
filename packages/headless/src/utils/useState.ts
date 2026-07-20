import { useActor as useXStateActor } from "@xstate/vue";
import { computed, unref } from "vue";
import { InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { isString } from "lodash-es";
import {
  isFunction,
  some,
  get,
  isArray,
  isObject,
  isEmpty,
  isNil,
  isEqual,
  type PropertyPath,
  pick,
  includes,
  reject,
  compact
} from "lodash-es";
import type { ComputedRef, MaybeRef, Ref } from "vue";
import type { ActorRef, AnyEventObject, InterpreterFrom, State } from "xstate";

type MachineLike =
  | MaybeRef<any>
  | MaybeRef<UseActor>
  | MaybeRef<ActorRef<any>>
  | MaybeRef<undefined>;

type StateLike =
  | MaybeRef<State<any>>
  | MaybeRef<VueState>
  | MaybeRef<undefined>;

export type UseActor = {
  id: string | number | symbol;
  state: Ref<State<any>>;
  send: any;
  service: ActorRef<any>;
};

type VueState = State<
  any,
  AnyEventObject,
  any,
  {
    value: any;
    context: any;
  },
  any
>;
// -----------------------------------------------------------------------------

export function stopService(
  machine: InterpreterFrom<any> | ActorRef<any, any>
): boolean {
  //   if (!machine) return;

  // Only access 'status' if machine is an Interpreter
  // const isInterpreter = !!(machine as any)?.status;
  const state = machine.getSnapshot();

  if (state.status == InterpreterStatus.Running || !state.done) {
    machine?.stop && machine.stop();
  }

  // NB use the uipdated snapshot to check if we are stopped/done
  const success = machine.getSnapshot().done;
  return success;
}

export function isStoppedService(
  machine: InterpreterFrom<any> | ActorRef<any, any>
): boolean {
  //   if (!machine) return;

  // Only access 'status' if machine is an Interpreter
  // const isInterpreter = !!(machine as any)?.status;
  const state = machine.getSnapshot();

  return state.done;
}

// ---  These are some helper to reduce the repetition of the same code when using xstate/vue

// safe state allows us to pass reactive objects and get the state object
// as well as objects that could contain the state object, eg an actor/machine
// This is useful when we want to pass in a ref or reactive object that could be an actor, machine or a state object

const safeState = (
  stateLike: StateLike | MachineLike
): State<any> | undefined => {
  let state: any = unref(stateLike);
  state = get(state, "state", state);
  state = unref(state);

  // an actor has the getSnapshot method to return the state object
  if (state && "getSnapshot" in state && isFunction(state.getSnapshot)) {
    return state.getSnapshot();
  }

  // state has the matches method, so we know its a state object
  if (state && "matches" in state && isFunction(state.matches)) {
    return state as State<any>;
  }

  // if its not a state or an actor, we return undefined
  return undefined;
};

// --- state matching

export const stateMatches = (
  stateLike: StateLike | MachineLike,
  states: string | string[],
  matchAll: boolean = false
): boolean => {
  const state = safeState(stateLike);

  states = isArray(states) ? states : [states];

  // --- done check: xstate does not support state.matches("done")
  const isDone = includes(states, "done") && !!state?.done;

  // --- filter out "done" before passing to state.matches
  const matchStates = reject(states, "done");

  // --- if state has no matches method, done is the only possible match
  if (!isFunction(state?.matches)) return isDone;

  // --- match remaining states
  const isMatch =
    !isEmpty(matchStates) && matchAll
      ? states.every(state.matches)
      : states.some(state.matches);

  return isMatch || isDone;
};

export const contextMatches = (
  stateLike: StateLike | MachineLike,
  props: string | string[],
  value?: any
): boolean => {
  const context = stateValue(stateLike, "context");

  if (isEmpty(context) || isEmpty(props)) return false;

  props = isArray(props) ? props : [props];

  return some(props, prop => {
    const propValue = get(context, prop);

    if (isNil(value))
      return isArray(propValue) || isObject(propValue) || isString(propValue)
        ? !isEmpty(propValue)
        : !isNil(propValue);

    if (isFunction(value)) return value(propValue);

    return isEqual(propValue, value);
  });
};

export const machineMatches = (
  machine: MachineLike,
  states: string | string[]
): boolean => {
  machine = unref(machine);

  if (!machine || isEmpty(states)) return false;

  states = isArray(states) ? states : [states];

  const state = safeState(machine);

  if (!state) return false;

  return stateMatches(state, states);
};

// --- value helpers

export const stateValue = <T = unknown>(
  stateLike: StateLike | MachineLike,
  props?: string | number | (string | number)[],
  fallback?: T | undefined
): T | undefined => {
  const state = safeState(stateLike);

  if (isEmpty(props) || isNil(state)) return fallback;

  if (isArray(props)) return pick(state, props) as T;

  if (isFunction(props)) return props(state) as T;

  return get(state, props as PropertyPath, fallback) as T;
};

export const contextValue = <T = unknown>(
  stateLike: StateLike | MachineLike,
  props?: string | number | (string | number)[],
  fallback?: T | undefined
): T | undefined => {
  const context = stateValue<T>(stateLike, "context");

  if (isNil(context)) return fallback;

  if (isEmpty(props)) return context as T;

  if (isArray(props)) return pick(context, props) as T;

  if (isFunction(props)) return props(context) as T;

  return get(context, props as PropertyPath, fallback);
};

export const childService = (
  stateLike: StateLike,
  prop?: string | number,
  fallback?: ActorRef<any> | undefined
): ActorRef<any> | undefined => {
  const state = safeState(stateLike);

  if (!state || isNil(prop)) return fallback;

  const actor = state?.children[prop];

  if (isNil(actor)) return fallback;

  return actor;
};

export const childActor = (
  stateLike: StateLike,
  prop?: string | number
): UseActor | undefined => {
  const service = stateValue<ActorRef<any>>(stateLike, `children.${prop}`);

  if (isNil(service)) return undefined;

  return createActor(service);
};

export const contextActor = (
  stateLike: StateLike,
  prop?: string | number
): UseActor | undefined => {
  if (isEmpty(prop)) return undefined;

  const context = contextValue<ActorRef<any>>(stateLike, prop);

  if (isNil(context)) return undefined;

  return createActor(context);
};

export const contextService = (
  stateLike: StateLike,
  prop?: string | number,
  fallback?: ActorRef<any> | undefined
): ActorRef<any> | undefined => {
  if (isEmpty(prop)) return fallback;

  const service = contextValue<ActorRef<any>>(stateLike, prop);

  if (isNil(service)) return fallback;

  return service;
};

export const createActor = (service: ActorRef<any>): UseActor | undefined => {
  service = unref(service);
  if (!service || !service.id || !isFunction(service?.getSnapshot))
    return undefined;

  const actor = useXStateActor(service);
  if (!actor) return undefined;
  return {
    id: service.id,
    service,
    ...actor
  } as UseActor;
};
// --- context helpers

export const useState = <T = unknown>(
  stateLike: StateLike | MachineLike,
  prop?: string | string[],
  fallback?: any
): ComputedRef<T | undefined> =>
  computed(() => stateValue<T>(stateLike, prop, fallback));

export const useContext = <T = unknown>(
  stateLike: StateLike | MachineLike,
  prop?: string | string[],
  fallback?: any
): ComputedRef<T | undefined> =>
  computed(() => contextValue<T>(stateLike, prop, fallback));

export const useActor = (
  service: ActorRef<any>
): ComputedRef<UseActor | undefined> => computed(() => createActor(service));

export const useChildActor = (
  stateLike: StateLike,
  prop?: string | number
): ComputedRef<UseActor | undefined> =>
  computed(() => childActor(stateLike, prop));

export const useContextActor = (
  stateLike: StateLike | MachineLike,
  prop?: string | number
): ComputedRef<UseActor | undefined> =>
  computed(() => contextActor(stateLike, prop));

export const useContextService = <_T = unknown>(
  stateLike: StateLike,
  prop?: string | number,
  fallback?: any
): ComputedRef<ActorRef<any> | undefined> =>
  computed(() => contextService(stateLike, prop, fallback));

export const useChildService = (
  stateLike: StateLike,
  prop?: string | number,
  fallback?: any
): ComputedRef<ActorRef<any> | undefined> =>
  computed(() => childService(stateLike, prop, fallback));

/**
 * Reactive wrapper for stateMatches.
 * Returns a computed ref that updates when the matched state changes.
 */
export const useStateMatches = (
  stateLike: StateLike | MachineLike,
  states: string | string[],
  matchAll: boolean = false
): ComputedRef<boolean> =>
  computed(() => stateMatches(stateLike, states, matchAll));

/**
 * Wait for a state machine to complete processing, then return boolean based on
 * success/error. Resolves true if it ended in a success state, false on error
 * or timeout.
 *
 * @param service - XState service/interpreter
 * @param successStates - States that indicate completion
 * @param errorStates - States that indicate failure (default: "error")
 * @param timeout - Timeout in milliseconds (default: 60_000)
 */
export async function waitForProcessing(
  service: ActorRef<any>,
  successStates: string | string[],
  errorStates?: string | string[],
  timeout: number = 60_000
): Promise<boolean> {
  const successArray = isArray(successStates) ? successStates : [successStates];
  const errorArray = isArray(errorStates) ? errorStates : [errorStates];
  const allStates = [...successArray, ...errorArray, "done"];
  const failOnDone = !includes(successArray, "done");

  return waitFor(service, s => stateMatches(s, compact(allStates)), {
    timeout
  })
    .then(s => {
      if (failOnDone && s.done) return false;
      return stateMatches(s, compact(successArray));
    })
    .catch(() => false);
}
