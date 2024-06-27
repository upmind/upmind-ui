<template>
  <button
    v-if="!noAction"
    type="button"
    class="flex items-center gap-x-2 font-semibold disabled:pointer-events-none disabled:opacity-50"
    v-bind="$attrs"
    :aria-controls="contentId"
    :aria-label="action"
  >
    <slot name="action">
      {{ action }}
    </slot>
  </button>

  <div
    :id="contentId"
    class="hs-overlay hs-overlay-open:translate-x-0 fixed start-0 top-0 z-[60] hidden h-full w-full max-w-xs -translate-x-full transform border-e bg-white transition-all duration-300"
    tabindex="-1"
  >
    <div class="flex items-center justify-between border-b px-4 py-3">
      <h3 class="font-bold text-base-800">{{ title }}</h3>
      <button
        type="button"
        class="inline-flex size-8 flex-shrink-0 items-center justify-center rounded-lg text-sm text-base-500 hover:text-base-700 focus:outline-none focus:ring-2 focus:ring-base-400 focus:ring-offset-2 focus:ring-offset-white"
      >
        <span class="sr-only">Close drawer</span>
        <svg
          class="size-4 flex-shrink-0"
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

<script>
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
