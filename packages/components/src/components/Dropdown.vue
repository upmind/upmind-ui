<template>
  <details
    ref="target"
    class="dropdown"
    :class="{ 'dropdown-open': force || open, disabled: processing }"
    :disabled="processing"
    :open="open"
    @toggle="doToggle($event.currentTarget.open)"
  >
    <summary class="btn btn-ghost text-primary">
      <span>
        <slot name="trigger"></slot>
      </span>
      <chevron-up-icon v-if="open" class="w-4 h-4" />
      <chevron-down-icon v-else class="h-4 w-4" />
    </summary>
    <ul
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-btn w-full m-0 gap-2"
    >
      <slot name="items"></slot>
    </ul>
  </details>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/24/outline";
import { onClickOutside } from "@vueuse/core";

export default defineComponent({
  name: "UpmBasketCurrency",
  components: { ChevronDownIcon, ChevronUpIcon },
  inheritAttrs: true,
  customOptions: {},
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    force: {
      type: Boolean,
      default: false
    },
    items: {
      type: Array,
      required: true
    },
    modelValue: {
      type: Object,
      required: true
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    const target = ref(null);

    onClickOutside(target, () => {
      open.value = false;
    });

    const open = ref(!!props.force);

    function doToggle(value) {
      open.value = value;
    }

    function doUpdate(value) {
      emit("update:modelValue", value);
      open.value = false;
    }
    return {
      target,
      doToggle,
      doUpdate,
      open
    };
  },
  computed: {}
});
</script>
