import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useClientPhones as useUpmindClientPhones } from "@upmind/flow";

// --- utils
import { get, map, compact, isObject } from "lodash-es";

// --------------------------------------------------------

export const useClientPhone = item => {
  const { service } = useUpmindClientPhones();

  // this will change to be a manager of ALL phones, for now its a single instance (add/update)
  const { state, send } = item;

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["loading"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      isProcessing: ["checking", "processing"].some(state.value.matches),
      isValid: ["valid"].some(state.value.matches),
      isNew: !state.value.context?.model?.id,
      canRemove: state.value?.context?.model?.can_delete,
      isDefault: !!state.value?.context?.model?.default,
      isComplete:
        state.value.done || ["processed", "complete"].some(state.value.matches)
    })),
    // ---
    title: computed(() => {
      // state.value.context?.model
      const phone = get(state.value.context?.model, "phone");

      if (isObject(phone)) {
        return get(state.value.context?.model, "phone.number");
      }

      return get(state.value.context?.model, "phone");
    }),
    display: computed(() => {
      return compact([
        get(state.value.context, "country.code"),
        get(state.value.context, "country.name")
      ]).join(", ");
    }),
    // ---
    model: computed(() => state.value?.context?.model),
    schema: computed(() => state.value?.context?.schema),
    uischema: computed(() => state.value?.context?.uischema),
    // ---
    clear: () => send({ type: "CLEAR" }),
    input: model => send({ type: "SET", data: model }),
    update: () => send({ type: "UPDATE" }),
    remove: () => send({ type: "REMOVE" }),
    setDefault: () => send({ type: "DEFAULT" }),
    // ---
    select: () => service.send({ type: "SELECT", data: item.id }),
    edit: () => service.send({ type: "EDIT", data: item.id }),
    cancel: () => service.send({ type: "REFRESH" })
  };
};

export const useClientPhones = selected => {
  // this will change to be a manager of ALL phones, for now its a single instance (add/update)

  const { service } = useUpmindClientPhones();
  const { state, send } = useActor(service);

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["loading"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
      isEditing: ["editing"].some(state.value.matches)
    })),
    // ---
    items: computed(() =>
      map(state.value.context.items, item => ({
        id: item.id,
        ...useActor(item)
      }))
    ),
    selected: computed(() =>
      state.value.context?.selected
        ? {
            id: state.value.context.selected?.id,
            ...useActor(state.value.context.selected)
          }
        : null
    ),
    // ---
    select: async id => {
      if (state.value.matches("loading")) {
        await waitFor(service, newstate => !newstate.matches("loading"));
      }

      send({ type: "SELECT", data: id });
    },
    edit: id => send({ type: "EDIT", data: id }),
    add: () => send({ type: "ADD" })
  };
};
