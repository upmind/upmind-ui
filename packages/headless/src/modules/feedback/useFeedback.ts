// --- external
import { computed, MaybeRef, unref } from "vue";
import { interpret, InterpreterStatus } from "xstate";
import { useActor } from "@xstate/vue";

// --- internal
import feedbackMachine from "./feedback.machine";

// --- utils
import { useTime } from "../../utils";
import { map, reduce, isEmpty, sortBy, isString, get } from "lodash-es";

// --- types
import type { Actor, ActorRef } from "xstate";
import { messageTypes } from "./types";
import { messageDisplays, type Message } from "./types";

// -----------------------------------------------------------------------------
// create a global instance of the feedback machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(feedbackMachine, { devTools: false });

// -----------------------------------------------------------------------------

export const useFeedback = () => {
  if (service.status == InterpreterStatus.NotStarted) service.start();
  const { state } = useActor(service);

  // --- state

  const meta = computed(() => ({
    isProcessing: ["processing"].some(state.value.matches),
    isEmpty: ["empty"].some(state.value.matches),
    hasNotifications: !isEmpty(notifications.value),
    hasToasts: !isEmpty(toasts.value),
    hasSystem: !isEmpty(system.value)
  }));

  // --- context

  const messages = computed(() =>
    map(state.value.context.messages, (item: ActorRef<any>) => ({
      id: item.id,
      ...useActor(item)
    }))
  );

  const notifications = computed(() =>
    sortBy(
      reduce(
        state.value.context.messages,
        (result: any[], item: ActorRef<any>) => {
          if (
            item.getSnapshot().context.display === messageDisplays.NOTIFICATION
          ) {
            result.push({
              id: item.id,
              ...useActor(item)
            });
          }
          return result;
        },
        []
      ),
      ["state.value.context.scheduled"]
    )
  );

  const toasts = computed(() =>
    sortBy(
      reduce(
        state.value.context.messages,
        (result: any[], item: ActorRef<any>) => {
          if (item.getSnapshot().context.display === messageDisplays.TOAST) {
            result.push({
              id: item.id,
              ...useActor(item)
            });
          }
          return result;
        },
        []
      ),
      ["state.value.context.scheduled"]
    )
  );

  const system = computed(() =>
    sortBy(
      reduce(
        state.value.context.messages,
        (result: any[], item: ActorRef<any>) => {
          const state = item.getSnapshot();
          if (state.context.display === messageDisplays.SYSTEM) {
            result.push(
              useMessage({
                id: item.id,
                ...useActor(item)
              })
            );
          }
          return result;
        },
        []
      ),
      ["state.value.context.scheduled"]
    )
  );

  // --- methods

  function add(message: Message) {
    service.send({ type: "ADD", data: message });
  }

  function dismiss(id: string) {
    service.send({ type: "REMOVE", data: { id } });
  }

  // --- syntactic sugar

  function addError(
    message: string | object | any,
    display: messageDisplays = messageDisplays.TOAST,
    delay: number = 0,
    maxAge: number = useTime().SECOND * 6
  ) {
    if (!message) return; // bail if no message

    return add({
      type: messageTypes.ERROR,
      i18nKey: message?.i18nKey,
      title: message?.title,
      subtitle: message?.subtitle,
      copy: isString(message) ? message : message?.copy,
      data: message?.data,
      display,
      delay,
      maxAge
    } as Message);
  }

  function addSuccess(
    message: string | Object | any,
    display: messageDisplays = messageDisplays.TOAST,
    delay: number = 0,
    maxAge: number = useTime().SECOND * 2
  ) {
    if (!message) return; // bail if no message

    return add({
      type: messageTypes.SUCCESS,
      i18nKey: message?.i18nKey,
      title: message?.title,
      subtitle: message?.subtitle,
      copy: isString(message) ? message : message?.copy,
      data: message?.data,
      display,
      delay,
      maxAge
    } as Message);
  }

  // maybe?
  // function addDebug(message: string) {
  //   const message: Message = {
  //     id: uniqueId("message_"),
  //     type: messageTypes.DEBUG,
  //     message: message,
  //     display: messageDisplays.CONSOLE,
  //     delay: 0,
  //     maxAge: 0
  //   };

  //   return add(message);
  // }

  // ---------------------------------------------------------------------------
  return {
    state: computed(() => state.value.value),
    messages,
    notifications,
    toasts,
    system,
    // ---
    meta,
    // ---
    add: (data: MaybeRef<Message>) => add(unref(data)),
    addError,
    addSuccess,
    dismiss,
    // ---
    getMessage: (id: string) => get(messages.value, id)
  };
};

export const useMessage = (item: any /** ACTOR*/) => {
  const { state, send } = item;
  // ---------------------------------------------------------------------------
  return {
    id: item.id,
    state,
    message: computed(() => state.value.context),
    meta: computed(() => ({
      isActive: state.value.matches("active"),
      isScheduled: state.value.matches("pending")
    })),
    // ---
    dismiss: () => send({ type: "DISMISS" })
  };
};
