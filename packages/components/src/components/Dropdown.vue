<template>
  <details
    ref="target"
    class="dropdown"
    :class="{ 'dropdown-open': force || open, disabled: processing }"
    :disabled="processing"
    :open="open"
    @toggle="doToggle($event.currentTarget.open)"
  >
    <summary
      class="w-full flex justify-between items-center"
      :class="$attrs?.class"
      role="button"
    >
      <slot name="trigger" v-bind="{ open, toggle: doToggle }"></slot>

      <chevron-up-icon v-if="open" class="w-4 h-4" />
      <chevron-down-icon v-else class="h-4 w-4" />
    </summary>
    <ul
      ref="items"
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 shadow-md bg-base-100 rounded-btn w-full m-0 mt-1 gap-2 max-h-64 overflow-auto flex-nowrap"
      @click="doToggle(false)"
    >
      <slot name="items" v-bind="{ items, value: modelValue }"></slot>

      <slot name="append"></slot>
    </ul>
  </details>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/24/outline";
import { onClickOutside } from "@vueuse/core";

export default defineComponent({
  name: "UpmDropdown",
  components: { ChevronDownIcon, ChevronUpIcon },
  inheritAttrs: false,
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
      type: [String, Object]
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

    return {
      target,
      doToggle,
      open
    };
  },
  computed: {}
});
</script>
