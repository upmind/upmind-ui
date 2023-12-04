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
        <div
          v-if="model?.length"
          class="absolute left-0 w-full flex place-items-center group-focus-within/dac:hidden"
          :class="[compact ? 'gap-1 mx-2' : 'gap-2']"
        >
          <template v-if="multiple">
            <button
              v-for="value in model"
              :key="value"
              class="btn"
              :class="[compact ? 'btn-xs' : '']"
              @click.prevent="removeValue(value)"
            >
              {{ value }}
              <backspace-icon class="w-5 h-5 ml-1" />
            </button>
          </template>
          <span v-else>
            <button @click.prevent="removeValue()" class="btn">
              {{ model }}
              <backspace-icon class="w-5 h-5 ml-1" />
            </button>
          </span>
        </div>

        <!-- icon -->
        <magnifying-glass-icon
          :class="[
            compact ? 'w-5 h-5 ml-2' : 'w-7 h-7 ',
            !model?.length ? '' : 'invisible'
          ]"
          class="join-item text-inherit group-focus-within/dac:text-primary group-focus-within/dac:visible"
        />

        <!-- input -->
        <input
          :autocomplete="autocomplete"
          :placeholder="model?.length ? '' : placeholder"
          @blur="doBlur"
          @focus="doFocus"
          :class="[
            compact ? 'ml-2 px-2' : 'mx-6 px-4',
            !model?.length ? '' : 'invisible'
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
          :class="[
            compact ? 'join-item' : '',
            !model?.length ? '' : 'invisible'
          ]"
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
      class="results flex flex-col items-center justify-center relative z-10"
      v-if="!meta.isEmpty || meta.isProcessing"
    >
      <slot
        name="results"
        v-bind="{ results, meta, update: updateModel, value: model, multiple }"
      >
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
import {
  first,
  filter,
  includes,
  without,
  some,
  compact,
  uniq
} from "lodash-es";

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
      type: [String, Array<String>]
    },
    multiple: {
      type: Boolean,
      default: false
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
    const dac = useDac(props);

    // --- DOM observers
    const input = ref<InstanceType<typeof HTMLInputElement>>();
    const control = ref<InstanceType<typeof HTMLDivElement>>();
    const { focused } = useFocusWithin(control);

    onClickOutside(control, () => (dac.active.value = false));

    // -----------------------------------------------------------------------
    return {
      ...dac,
      // --- Refs
      focused,
      input,
      control
    };
  },
  watch: {
    model(value, oldValue) {
      // weve got a new value, that is not the same as the old value
      // so we need to emit the change
      if (oldValue !== value) {
        this.$emit("update:modelValue", value);
        this.$emit("change", { currentTarget: { value } });
      }
    },
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
    resetInput() {
      this.reset(this.input);
      this.domain = "";
      this.model = this.multiple ? [] : "";
      this.active = false;
    },

    updateModel({ currentTarget }: Event) {
      // ---
      let value: string | string[] = currentTarget?.value;
      this.update(value);
    },

    isChecked(value: string) {
      return this.multiple ? includes(this.model, value) : this.model === value;
    },

    doFocus(event: Event) {
      this.$emit("focus", event);
    },

    doBlur(event: Event) {
      this.$emit("blur", event);
    },

    removeValue(value: string) {
      this.model = this.multiple ? without(this.model, value) : "";
    }
  },
  computed: {
    hasErrors() {
      return (
        this.meta.hasErrors ||
        (!this.focused && includes(this.$attrs?.class, "error"))
      );
    }
  }
});
</script>
