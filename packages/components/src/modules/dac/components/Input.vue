<template>
  <div
    class="input input-bordered overflow-hidden group/dac-input"
    :class="[
      !!error ? 'input-error ' : 'focus-within:input-primary',
      compact ? 'p-0' : 'input-lg '
    ]"
  >
    <div class="join h-full w-full items-center relative">
      <!-- icon -->

      <component
        v-if="hasIcon"
        :is="iconComponent"
        :class="[compact ? 'w-5 h-5 ml-2' : 'w-7 h-7 ']"
        class="join-item text-inherit group-focus-within/dac-input:text-primary"
      />

      <!-- input -->
      <input
        ref="input"
        @blur="doBlur"
        @focus="doFocus"
        @input="doUpdate"
        :autocomplete="autocomplete"
        :class="[compact ? 'ml-2 px-2' : 'mr-6 px-4', { 'ml-6': hasIcon }]"
        :model-value="modelValue"
        :placeholder="placeholder"
        :autofocus="autofocus"
        class="flex-1 bg-transparent h-full"
        id="domain-search"
        type="text"
      />

      <!-- reset -->
      <button
        v-if="clearable && !!modelValue?.length"
        type="reset"
        :class="[compact ? 'join-item btn-square' : '']"
        class="btn btn-link text-inherit opacity-50 hover:opacity-100 invisible"
        tabindex="-1"
        @click="doReset"
      >
        <backspace-icon :class="compact ? 'w-5 h-5' : 'w-7 h-7'" />
      </button>

      <!-- submit -->
      <button
        v-if="action"
        @click="doSearch"
        :class="[compact ? 'join-item' : '']"
        class="btn btn-primary opacity-50 group-focus-within/dac-input:opacity-100"
        tabindex="-1"
      >
        <span class="loading loading-spinner" v-if="processing"></span>

        <span v-else>{{ action }}</span>
      </button>
    </div>
  </div>
  <div v-if="!!error" class="text-sm text-error py-1 px-2">{{ error }}</div>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, watchEffect } from "vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/20/solid";
import { BackspaceIcon } from "@heroicons/vue/24/outline";

// --- utils
import { isArray, get } from "lodash-es";

export default defineComponent({
  name: "UpmSearch",
  components: {
    MagnifyingGlassIcon,
    BackspaceIcon
  },
  emits: ["update:modelValue", "reset", "focus", "blur", "click"],
  props: {
    modelValue: {
      type: [String, Array<String>]
    },
    processing: {
      type: Boolean,
      default: false
    },
    action: {
      type: String,
      default: "Search"
    },
    icon: {
      type: String,
      default: ""
    },
    clearable: {
      type: Boolean,
      default: true
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
    },
    error: {
      type: String
    },
    autofocus: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    input: null as HTMLInputElement | null
  }),

  setup(props) {
    let iconComponent = ref(null as any);

    watchEffect(async () => {
      if (props.icon) {
        iconComponent.value = await import(`@heroicons/vue/20/solid`).then(
          icons => {
            return get(icons, props.icon);
          }
        );
      }
    });

    return {
      iconComponent
    };
  },
  computed: {
    isMutiple() {
      return isArray(this.modelValue);
    },
    hasIcon() {
      return !!this.iconComponent;
    }
  },
  methods: {
    doSearch(event: Event) {
      // resend the model value to the parent to trigger the search
      this.$emit("click", {
        currentTarget: { value: this.modelValue }
      });
    },

    doUpdate(event: Event) {
      this.$emit("update:modelValue", event);
    },

    doReset(event: Event) {
      this.$emit("reset", event);
    },

    doFocus(event: Event) {
      this.$emit("focus", event);
    },

    doBlur(event: Event) {
      this.$emit("blur", event);
    }
  },
  mounted() {
    if (this.autofocus) this.$refs.input.focus();
  }
});
</script>
