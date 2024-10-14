<template>
  <nav
    class="hs-accordion-group flex w-full flex-col flex-wrap"
    data-hs-accordion-always-open
    v-if="inspector"
  >
    <ul class="w-full space-y-3">
      <li
        v-for="(item, key) in inspector"
        :key="key"
        class="hs-accordion w-full"
        :id="`accordion-${key}`"
      >
        <button
          type="button"
          class="hs-accordion-toggle hs-accordion-active:rounded-b-none hs-accordion-active:bg-neutral-700 hs-accordion-active:text-neutral-content hs-accordion-active:hover:bg-neutral-700 flex w-full items-center gap-x-3.5 rounded border border-neutral-200 bg-base px-3 py-2 text-start text-sm font-medium text-neutral hover:bg-neutral-100"
          @click="open = open === key ? null : key"
        >
          {{ startCase(key) }}

          <upw-icon
            v-if="open === key"
            icon="arrow-up"
            class="hs-accordion-active:block ms-auto size-3 group-hover:text-neutral-500"
          />
          <upw-icon
            v-else
            icon="arrow-down"
            class="hs-accordion-active:hidden ms-auto block size-3 group-hover:text-neutral-500"
          />
        </button>

        <div
          :id="`accordion-${key}`"
          class="hs-accordion-content w-full overflow-auto rounded-b border border-t-0 border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500 transition-[height] duration-300"
          :class="{
            'hs-accordion-active': open === key,
            hidden: open !== key,
          }"
        >
          <pre class="w-full overflow-scroll">{{ item }}</pre>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script>
import { defineComponent, ref } from "vue";
import { startCase, defaultsDeep, omitBy, isEmpty, get } from "lodash-es";
import { UpwIcon } from "@upmind-automation/upwind";

export default defineComponent({
  name: "UpmInspctor",
  components: { UpwIcon },
  inheritAttrs: false,
  inject: ["inspectors"],
  props: {
    flow: { type: String, required: true },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    return {
      startCase,
      open: ref(null),
    };
  },
  computed: {
    isDebugging() {
      return import.meta.env.DEV;
    },
    inspector() {
      const inspector = get(this.inspectors, this.flow);
      return omitBy(
        defaultsDeep(inspector, {
          errors: null,
          state: null,
          context: null,
          meta: null,
          model: null,
        }),
        isEmpty
      );
    },
  },
});
</script>
