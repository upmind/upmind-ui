<template>
  <fieldset
    class="form-control group/dac"
    :disabled="disabled"
    :id="id"
    ref="control"
    tabindex="0"
    @blur="doBlur"
    @focus="doFocus"
  >
    <!-- search field -->

    <div
      :class="[{ 'input-error': hasErrors }, compact ? 'p-0' : 'input-lg ']"
      class="input input-bordered group-focus-within/dac:input-primary overflow-hidden"
    >
      <div class="join h-full w-full items-center relative">
        <!-- selected -->
        <span
          v-if="model"
          :class="[compact ? 'px-4' : '']"
          class="flex flex-nowrap place-items-center group-focus-within/dac:hidden absolute left-0"
        >
          {{ model }}
        </span>

        <!-- icon -->
        <magnifying-glass-icon
          :class="[
            compact ? 'w-5 h-5 ml-2' : 'w-7 h-7 ',
            !model ? '' : 'invisible'
          ]"
          class="join-item text-inherit group-focus-within/dac:text-primary group-focus-within/dac:visible"
        />

        <!-- input -->
        <input
          :autocomplete="autocomplete"
          :placeholder="model ? '' : placeholder"
          @blur="doBlur"
          @focus="doFocus"
          :class="[
            compact ? 'ml-2 px-2' : 'mx-6 px-4',
            !model ? '' : 'invisible'
          ]"
          class="flex-1 bg-transparent h-full group-focus-within/dac:visible"
          id="domain-search"
          ref="input"
          type="text"
          v-model="domain"
        />

        <!-- reset -->
        <button
          v-if="clearable && !!domain?.length"
          type="reset"
          :class="[compact ? 'join-item btn-square' : '']"
          class="btn btn-link text-inherit opacity-50 hover:opacity-100 invisible group-focus-within/dac:visible"
          tabindex="-1"
          @click="resetInput"
        >
          <backspace-icon :class="compact ? 'w-5 h-5' : 'w-7 h-7'" />
        </button>

        <!-- submit -->
        <button
          @click="doSearch"
          :class="[compact ? 'join-item' : '', !model ? '' : 'invisible']"
          class="btn btn-primary opacity-50 group-focus-within/dac:opacity-100 group-focus-within/dac:visible"
          tabindex="-1"
        >
          <span class="loading loading-spinner" v-if="meta.isProcessing"></span>

          <span v-else>Search</span>
        </button>
      </div>
    </div>

    <!-- results -->
    <div
      class="results flex flex-col items-center justify-center relative"
      v-if="!meta.isEmpty || meta.isProcessing"
    >
      <slot name="results" v-bind="{ results, meta, update, value: model }">
      </slot>

      <template v-if="meta.hasMore">
        <button
          class="btn btn-sm"
          @click="loadMore"
          :disabled="meta.isProcessing"
        >
          Load more
        </button>
      </template>
    </div>
  </fieldset>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/20/solid";
import { BackspaceIcon } from "@heroicons/vue/24/outline";
import { onClickOutside, useFocusWithin } from "@vueuse/core";

// --- internal
import { useDac } from "./composables";

// --- utils
import { some } from "lodash-es";

// ---------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDac",
  components: {
    MagnifyingGlassIcon,
    BackspaceIcon
  },
  emits: ["update:modelValue", "change", "focus", "blur"],
  props: {
    coupons: {
      type: Array,
      default: () => []
    },
    currencyCode: {
      type: String,
      default: ""
    },
    limit: {
      type: Number,
      default: 10
    },
    orderConfigUrl: {
      type: String,
      default: ""
    },
    skeletonCount: {
      type: Number,
      default: null
    },
    modelValue: {
      type: String
    },

    clearable: {
      type: Boolean,
      default: true
    },
    id: {
      type: String
    },

    disabled: {
      type: Boolean,
      default: false
    },
    autocomplete: {
      type: String,
      default: ""
    },
    placeholder: {
      type: String,
      default: ""
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const {
      meta,
      domain,
      model,
      results,
      active,
      // --- Methods
      reset,
      doSearch,
      loadMore
    } = useDac(props);

    // --- DOM observers

    const input = ref<InstanceType<typeof HTMLInputElement>>();
    const control = ref<InstanceType<typeof HTMLDivElement>>();
    const { focused } = useFocusWithin(control);
    onClickOutside(control, () => (active.value = false));

    // -----------------------------------------------------------------------
    return {
      // --- Refs
      focused,
      active,
      model,
      input,
      control,
      // --- Data
      domain,
      meta,
      results,
      // --- Methods
      reset,
      doSearch,
      loadMore
    };
  },
  watch: {
    results(value) {
      this.active = this.focused && (!!value?.length || this.meta.isProcessing);
    },
    focused(value) {
      this.active = value && (!!this.results?.length || this.meta.isProcessing);
      if (!value) {
        this.active = false;
      }
    }
  },
  methods: {
    resetInput(event: Event) {
      this.reset(this.input);
      this.domain = "";
      this.model = "";
      this.$emit("update:modelValue", this.model);
      this.$emit("change", event);
      this.active = false;
    },

    update(event: Event) {
      this.$emit("change", event);
      // ---
      const target = event.currentTarget as HTMLInputElement;
      const value = target.value;

      this.validate(value);

      this.$emit("update:modelValue", this.model);
      this.$emit("change", event);

      this.active = false;
    },

    validate(value: string) {
      this.model = some(this.results, { domain: value }) ? value : "";
      this.domain = this.model;
    },

    isChecked(value: string) {
      return this.model === value;
    },

    doFocus(event: Event) {
      this.$emit("focus", event);
    },

    doBlur(event: Event) {
      this.$emit("blur", event);
    }
  },
  computed: {
    hasErrors() {
      return (
        this.meta.hasErrors ||
        (!this.focused && this.$attrs.class.includes("error"))
      );
    }
  }
});
</script>
./composables
