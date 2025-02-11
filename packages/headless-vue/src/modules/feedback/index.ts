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

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useFeedback = (): any => {
  const { service, dismiss, add, addError, addSuccess, trackEvent } =
    useUpmindFeedback();
  const { state } = useActor(service);

  // --------------------------------------------------------

  const messages = computed(() =>
    map(state.value.context.messages, (item: any) => ({
      id: item.id,
      ...useActor(item),
    }))
  );

  const notifications = computed(() =>
    sortBy(
      reduce(
        state.value.context.messages,
        (result, item: any) => {
          if (item.state.context.display === "notification") {
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
        (result, item: any) => {
          if (item.state.context.display === "toast") {
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

  const events = computed(() =>
    sortBy(
      reduce(
        state.value.context.messages,
        (result, item: any) => {
          if (item.state.context.type === "event") {
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

  // ---
  const meta = computed(() => ({
    isProcessing: ["processing"].some(state.value.matches),
    isEmpty: ["empty"].some(state.value.matches),
    hasNotifications: !isEmpty(notifications.value),
    hasToasts: !isEmpty(toasts.value),
    hasEvents: !isEmpty(events.value),
  }));

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    messages,
    notifications,
    toasts,
    events,
    // ---
    meta,
    // ---
    add: (data: any) => add(unref(data)),
    addError,
    addSuccess,
    trackEvent,
    dismiss,
    // ---
    useTime: utils.useTime,
  };
};

export const useMessage = (item: any) => {
  const { state, send } = item;

  const message = toRef(state.value, "context");

  const meta = computed(() => ({
    isActive: state.value.matches("active"),
    isScheduled: state.value.matches("pending"),
  }));

  // --------------------------------------------------------

  return {
    state,
    message,
    meta,
    // ---
    dismiss: () => send("DISMISS"),
  };
};
