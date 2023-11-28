<template>
  <div class="ml-auto mr-auto min-w-[20rem] max-w-4xl group" ref="control">
    <!-- search field -->
    <fieldset
      class="form-control"
      :disabled="disabled"
      :id="id"
      @blur="doBlur"
      @focus="doFocus"
    >
      <div
        :class="[`input-${safeTheme}`, { 'input-error': hasError }]"
        class="input input-bordered join items-center px-0 overflow-hidden"
      >
        <!-- icon -->
        <magnifying-glass-icon
          class="w-5 h-5 join-item mx-2"
          v-if="!model || hasFocus"
        />

        <!-- selected -->
        <span v-if="model && !hasFocusWithin" class="group mx-2">
          <span class="flex flex-nowrap place-items-center mx-2">
            {{ model }}
          </span>
        </span>

        <!-- input -->
        <input
          :autocomplete="autocomplete"
          :placeholder="model ? '' : placeholder"
          @blur="doBlur"
          @focus="doFocus"
          class="flex-1 px-2 h-full"
          id="domain-search"
          ref="input"
          type="text"
          v-model="domain"
        />

        <!-- reset -->
        <button
          v-if="
            !!model?.length ||
            (meta.hasValue && clearable && !meta.isProcessing)
          "
          type="reset"
          class="btn btn-ghost btn-square join-item invisible group-hover:visible"
          tabindex="-1"
          @click="resetInput"
        >
          <backspace-icon class="w-5 h-5" />
        </button>

        <!-- submit -->
        <button
          :class="`btn-${safeTheme}`"
          :disabled="meta.isProcessing || !meta.hasValue"
          @click="doSearch"
          class="btn join-item"
          tabindex="-1"
          v-if="!model?.length || hasFocus"
        >
          <span class="loading loading-spinner" v-if="meta.isProcessing"></span>

          <span v-else>Search</span>
        </button>
      </div>
    </fieldset>

    <!-- results -->
    <div
      class="results flex flex-col items-center justify-center relative"
      v-if="meta.hasResults || (meta.hasValue && meta.isProcessing)"
    >
      <slot name="results" v-bind="{ results }" v-if="isOpen">
        <ul
          tabindex="1"
          role="list"
          class="menu rounded-box flex-col flex-nowrap bg-base-100 border w-full mt-2 absolute top-0 left-0 right-0 z-10 shadow-sm min-h-[13em] max-h-[13em] overflow-y-auto"
        >
          <li class="place-self-center" v-if="meta.isProcessing">
            <span
              :class="`text-${safeTheme}`"
              class="loading loading-dots"
            ></span>
          </li>

          <li
            role="listitem"
            v-for="item in results"
            :key="item?.domain"
            :class="[{ disabled: !item.is_available }]"
            class="p-0"
          >
            <label class="w-full">
              <input
                type="radio"
                name="dac-domain"
                :class="['radio', `radio-${safeTheme}`]"
                :checked="isChecked(item.domain)"
                :disabled="!item.is_available"
                :value="item.domain"
                @input="updateModel"
              />

              {{ item.domain }}

              <span
                :class="`badge-${safeTheme}`"
                class="badge badge-xs"
                v-if="item.is_available"
              ></span>
              <span class="badge badge-xs badge-ghost" v-else></span>
            </label>
          </li>
        </ul>
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
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/20/solid";
import { BackspaceIcon } from "@heroicons/vue/24/outline";
import { onClickOutside, useFocus, useFocusWithin } from "@vueuse/core";

// --- internal
import { useDac } from "./composables";

// --- utils
import { some, debounce } from "lodash-es";

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

    theme: {
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
      default: "off"
    },
    placeholder: {
      type: String,
      default: ""
    }
  },
  setup(props) {
    const {
      meta,
      domain,
      results,
      // --- Methods
      reset,
      doSearch,
      loadMore
    } = useDac(props);

    const input = ref<InstanceType<typeof HTMLInputElement>>();
    const control = ref<InstanceType<typeof HTMLDivElement>>();

    const isOpen = ref(false);
    const model = ref(props.modelValue || null);

    const { focused: hasFocusWithin } = useFocusWithin(control);
    const { focused: hasFocus } = useFocus(input);

    onClickOutside(control, () => {
      domain.value = "";
      isOpen.value = false;
    });

    return {
      // --- Refs
      isOpen,
      hasFocus,
      hasFocusWithin,
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
      this.isOpen =
        this.hasFocusWithin && (!!value?.length || this.meta.isProcessing);
    },
    hasFocusWithin(value) {
      if (!value) {
        this.isOpen = false;
        this.domain = "";
      }
    }
  },
  methods: {
    resetInput(event: Event) {
      this.reset(this.input);
      this.model = null;
      this.$emit("update:modelValue", this.model);
      this.$emit("change", event);
      this.isOpen = false;
    },

    updateModel(event: Event) {
      this.$emit("change", event);
      // ---
      const target = event.target as HTMLInputElement;
      const value = target.value;

      this.validate(value);

      this.$emit("update:modelValue", this.model);
      this.$emit("change", event);

      this.domain = "";
      this.isOpen = false;
    },

    validate(value: string) {
      this.model = some(this.results, { domain: value }) ? value : null;
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
    hasError() {
      return !this.hasFocusWithin && this.$attrs.class.includes("error");
    },
    safeTheme() {
      return this.theme || "neutral";
    }
  }
});
</script>
./composables
