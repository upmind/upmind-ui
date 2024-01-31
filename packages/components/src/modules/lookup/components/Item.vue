<template>
  <li class="p-0 m-0">
    <label
      :class="{
        'bg-primary bg-opacity-20 ': selected,
        'border-error': meta.hasErrors,
        'border-primary': selected
      }"
      class="active:bg-primary"
    >
      <input
        :checked="selected"
        class="checkbox"
        :class="{ 'checkbox-primary': selected }"
        :disabled="disabled"
        :label="label"
        :value="item.id"
        @input="select"
        type="checkbox"
      />

      <sub
        v-if="meta.isLoading && !meta.hasErrors"
        class="loading loading-dots loading-xs"
      ></sub>

      <span role="button" class="ml-auto" v-if="meta.isDefault">
        <star-icon class="w-6 h-6 cursor-pointer text-primary" />
      </span>
    </label>
  </li>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useLookupItem } from "../composables";
import { StarIcon } from "@heroicons/vue/24/solid";

export default defineComponent({
  name: "UpmLookuItem",
  components: {
    StarIcon
  },
  emits: ["select", "edit", "refresh"],
  props: {
    item: {
      type: Object, // xstate actor
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, context) {
    return useLookupItem(props, context);
  }
});
</script>
