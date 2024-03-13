<template>
  <button
    v-if="!noAction"
    type="button"
    v-bind="$attrs"
    class="py-3 px-4 flex items-center gap-x-2 font-semibold rounded-lg disabled:opacity-50 disabled:pointer-events-none"
    :data-hs-overlay="`#${contentId}`"
    :aria-controls="contentId"
    :aria-label="action"
  >
    <slot name="action">
      {{ action }}
    </slot>
  </button>

  <div
    :id="contentId"
    class="hs-overlay hs-overlay-open:translate-x-0 hidden -translate-x-full fixed top-0 start-0 transition-all duration-300 transform h-full max-w-xs w-full z-[60] bg-white border-e"
    tabindex="-1"
  >
    <div class="flex justify-between items-center py-3 px-4 border-b">
      <h3 class="font-bold text-gray-800">{{ title }}</h3>
      <button
        type="button"
        class="inline-flex flex-shrink-0 justify-center items-center size-8 rounded-lg text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white text-sm"
        :data-hs-overlay="`#${contentId}`"
      >
        <span class="sr-only">Close drawer</span>
        <svg
          class="flex-shrink-0 size-4"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
    <div class="p-4">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Drawer",
  props: {
    contentId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      default: "Open",
    },
    noAction: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
