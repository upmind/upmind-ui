<template>
  <li class="p-0 m-0">
    <label
      :class="{
        'bg-primary bg-opacity-20 ': selected,
        'border-primary': selected
      }"
      class="active:bg-primary"
    >
      <input
        :checked="selected"
        class="checkbox"
        :class="{ 'checkbox-primary': selected }"
        :disabled="disabled"
        :value="item.id"
        @input="$emit('select', $event, item.id)"
        type="checkbox"
      />

      <div class="flex flex-wrap px-2">
        <span class="flex items-center w-full">
          {{ item?.title || item.id }}

          <sub v-if="loading" class="loading loading-dots loading-xs"></sub>

          <span role="button" class="ml-2" v-if="item.default">
            <star-icon class="w-4 h-4 cursor-pointer text-primary" />
          </span>
        </span>

        <p class="m-0 mt-1 text-xs font-light" v-if="item.description || true">
          {{ item.description }}
        </p>
      </div>
    </label>
  </li>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { StarIcon } from "@heroicons/vue/24/solid";

export default defineComponent({
  name: "UpmLookuItem",
  components: {
    StarIcon
  },
  emits: ["select"],
  props: {
    item: {
      type: Object, // xstate actor
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    processing: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  }
});
</script>
