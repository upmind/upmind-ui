// --- external
import { computed, toRef, unref } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import {
  useFeedback as useUpmindFeedback,
  utils,
} from "@upmind-automation/headless";

// --- utils
import { map, reduce, isEmpty, sortBy } from "lodash-es";
import type { Actor, ActorRef } from "xstate";
import { messageDisplays } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const useFeedback = (): any => {
  const { service, dismiss, add, addError, addSuccess } = useUpmindFeedback();
  const { state } = useActor(service);

  // ---
  const messages = computed(() =>
    map(state.value.context.messages, (item: ActorRef<any>) => ({
      id: item.id,
      ...useActor(item),
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
              ...useActor(item),
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
              ...useActor(item),
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
                ...useActor(item),
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

  // ---
  const meta = computed(() => ({
    isProcessing: ["processing"].some(state.value.matches),
    isEmpty: ["empty"].some(state.value.matches),
    hasNotifications: !isEmpty(notifications.value),
    hasToasts: !isEmpty(toasts.value),
    hasSystem: !isEmpty(system.value),
  }));

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
    add: (data: any) => add(unref(data)),
    addError,
    addSuccess,
    dismiss,
    // ---
    useTime: utils.useTime,
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
      isScheduled: state.value.matches("pending"),
    })),
    // ---
    dismiss: () => send({ type: "DISMISS" }),
  };
};
