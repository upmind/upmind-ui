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
  isNil,
  isEqual,
  PropertyPath,
  compact,
  pick
} from "lodash-es";

// --- types
import type { ComputedRef, MaybeRef, Ref } from "vue";
import { InterpreterStatus } from "xstate";
import type { ActorRef, AnyEventObject, InterpreterFrom, State } from "xstate";
import { isString } from "xstate/lib/utils";

type MachineLike =
  | MaybeRef<any>
  | MaybeRef<Actor>
  | MaybeRef<ActorRef<any>>
  | MaybeRef<undefined>;

type StateLike =
  | MaybeRef<State<any>>
  | MaybeRef<VueState>
  | MaybeRef<undefined>;

export type Actor = {
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

export function stopService(machine: InterpreterFrom<any>): boolean {
  if (
    machine.status == InterpreterStatus.Running ||
    !machine.getSnapshot().done
  ) {
    machine.stop();
  } else {
    console.info("** MACHINE State **", "Machine is already stopped", {
      name: machine.id,
      status: machine.status,
      done: machine.getSnapshot().done
    });
  }

  return machine.status == InterpreterStatus.Stopped;
}

export function stopActor(actor: ActorRef<any>): void {
  if (!actor) return;

  const state = actor.getSnapshot();

  if (
    actor.stop &&
    (state.status == InterpreterStatus.Running || !state.done)
  ) {
    actor.stop();
  } else {
    // console.debug("** ACTOR State **", "Actor is already stopped", {
    //   name: actor.id,
    //   status: state.status,
    //   done: state.done,
    // });
    return;
  }

  // console.debug("** ACTOR State **", "Actor stopped", {
  //   name: actor.id,
  //   state: actor.getSnapshot(),
  // });
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

  if (!isFunction(state?.matches)) return false;

  return matchAll ? states.every(state.matches) : states.some(state.matches);
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
): Actor | undefined => {
  const service = stateValue<ActorRef<any>>(stateLike, `children.${prop}`);

  if (isNil(service)) return undefined;

  return createActor(service);
};

export const contextActor = (
  stateLike: StateLike,
  prop?: string | number
): Actor | undefined => {
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

export const createActor = (service: ActorRef<any>): Actor | undefined => {
  service = unref(service);
  if (!service || !service.id || !isFunction(service?.getSnapshot))
    return undefined;

  const actor = useActor(service);
  if (!actor) return undefined;
  return {
    id: service.id,
    service,
    ...actor
  } as Actor;
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

export const useChildActor = (
  stateLike: StateLike,
  prop?: string | number
): ComputedRef<Actor | undefined> =>
  computed(() => childActor(stateLike, prop));

export const useContextActor = (
  stateLike: StateLike,
  prop?: string | number
): ComputedRef<Actor | undefined> =>
  computed(() => contextActor(stateLike, prop));

export const useContextService = <T = unknown>(
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
