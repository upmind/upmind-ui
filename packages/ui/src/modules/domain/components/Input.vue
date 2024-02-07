<template>
  <div class="relative group/domain-input join join-vertical w-full">
    <!-- input -->
    <div
      class="input input-bordered overflow-hidden"
      :class="[
        !!error ? 'input-error ' : 'focus-within/domain-input:input-primary',
        compact ? 'p-0' : 'input-lg ',
        filteredSuggestions?.length && model?.length ? 'join-item' : ''
      ]"
    >
      <div class="join h-full w-full items-center relative">
        <!-- icon -->

        <component
          v-if="hasIcon"
          :is="iconComponent"
          :class="[compact ? 'w-5 h-5 ml-2' : 'w-7 h-7 ']"
          class="join-item text-inherit group-focus-within/domain-input:text-primary"
        />

        <!-- input -->
        <input
          ref="input"
          @blur="doBlur"
          @focus="doFocus"
          @input="doUpdate"
          :autocomplete="autocomplete"
          :class="[compact ? 'ml-2 px-2' : 'mr-6 px-4', { 'ml-6': hasIcon }]"
          v-model="model"
          :placeholder="placeholder"
          class="flex-1 bg-transparent h-full"
          id="domain-search"
          type="text"
        />

        <!-- reset -->
        <button
          v-if="clearable && !!model?.length"
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
          @click="doClick"
          :class="[compact ? 'join-item' : '']"
          class="btn btn-primary opacity-50 group-focus-within/domain-input:opacity-100"
          tabindex="-1"
        >
          <span class="loading loading-spinner" v-if="processing"></span>

          <span v-else>{{ action }}</span>
        </button>
      </div>
    </div>
    <!-- errors -->
    <div
      v-if="!!error && !filteredSuggestions?.length"
      class="text-sm text-error py-1 px-2"
    >
      {{ error }}
    </div>

    <!-- suggestions -->
    <ul
      tabindex="1"
      role="list"
      class="menu rounded-b-box flex-col flex-nowrap bg-base-100 border border-base-300 w-full mt-0 absolute top-full left-0 right-0 z-auto shadow-md max-h-[13em] overflow-y-auto join-item"
      v-if="filteredSuggestions?.length && model?.length"
    >
      <li class="place-self-center" v-if="processing">
        <span class="loading loading-dots text-primary"></span>
      </li>

      <li
        role="listitem"
        v-for="{ domain, highlight } in filteredSuggestions"
        :key="domain"
        class="p-0"
        @click="doSuggestion(domain)"
      >
        <label class="w-full">
          <span v-html="highlight"></span>
        </label>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, watchEffect } from "vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/20/solid";
import { BackspaceIcon } from "@heroicons/vue/24/outline";

// --- utils
import { isArray, get, filter, includes, map } from "lodash-es";

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
    suggestions: {
      type: Array,
      default: () => []
    },
    processing: {
      type: Boolean,
      default: false
    },
    action: {
      type: String
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
    let model = ref(props.modelValue);
    let iconComponent = ref(null as any);

    watchEffect(async () => {
      model.value = props.modelValue;

      if (props.icon) {
        iconComponent.value = await import(`@heroicons/vue/20/solid`).then(
          icons => {
            return get(icons, props.icon);
          }
        );
      }
    });

    return {
      model,
      iconComponent
    };
  },
  computed: {
    filteredSuggestions() {
      return map(
        filter(
          this.suggestions,
          (item: any) =>
            includes(item.domain, this.model) && item.domain !== this.model
        ),
        item => {
          return {
            domain: item.domain,
            highlight: item.domain.replace(
              this.model,
              "<strong class='text-inherit underline underline-offset-4 decoration-primary'>$&</strong>"
            )
          };
        }
      );
    },
    isMutiple() {
      return isArray(this.model);
    },
    hasIcon() {
      return !!this.iconComponent;
    }
  },
  methods: {
    doSuggestion(value: string) {
      this.model = value;

      this.$emit("update:modelValue", {
        currentTarget: { value: this.model }
      });

      this.setFocus();
    },

    doClick(_event: Event) {
      // resend the model value to the parent to trigger the search
      this.$emit("click", {
        currentTarget: { value: this.model }
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
    },

    setFocus() {
      this.$refs?.input?.focus();
    }
  },
  mounted() {
    if (this.autofocus) this.setFocus();
  }
});
</script>
