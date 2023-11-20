<template>
  <!-- <ul class="menu menu-horizontal my-0" ref="target">
    <li class="m-0 p-0">
      <details :open="open" @toggle="doToggle($event.target.open)">
        <summary class="">
          {{ modelValue }}</summary>
        <ul class="shadow bg-base-100 rounded-box w-52">
          <li
            v-for="currency in currencies"
            :key="currency"
            @click="doUpdate(currency)"
          >
            <span :class="{ active: currency == modelValue }">
              {{ currency }}</span
            >
          </li>
        </ul>
      </details>
    </li>
  </ul> -->

  <details
    ref="target"
    class="dropdown"
    :class="{ 'dropdown-open': force || open, disabled: processing }"
    :disabled="processing"
    :open="open"
    @toggle="doToggle($event.target.open)"
  >
    <summary class="btn btn-ghost text-primary">
      <span>
        <strong class="badge badge-primary mr-1">
          {{ modelValue?.prefix || modelValue?.suffix }}
        </strong>
        {{ modelValue?.code }}
      </span>
      <chevron-up-icon v-if="open" class="w-4 h-4" />
      <chevron-down-icon v-else class="h-4 w-4" />
    </summary>
    <ul
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
    >
      <li
        v-for="currency in currencies"
        :key="currency"
        @click="doUpdate(currency)"
        class="p-0 mx-0 my-1"
      >
        <span :class="{ active: currency?.code == modelValue?.code }">
          <strong class="badge">
            {{ currency?.prefix || currency?.suffix }}
          </strong>
          {{ currency?.code }}
        </span>
      </li>
    </ul>
  </details>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/24/outline";
import { onClickOutside } from "@vueuse/core";

export default defineComponent({
  name: "CurrencySwitcher",
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
    currencies: {
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
