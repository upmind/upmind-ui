<template>
  <div class="ml-auto mr-auto min-w-[20rem] max-w-4xl">
    <fieldset class="form-control">
      <label for="domain-search" class="form sr-only">
        <span class="label-text">search for domain</span>
      </label>

      <div
        :class="`input-${safeTheme}`"
        class="input input-bordered join items-center px-0"
      >
        <magnifying-glass-icon class="w-8 h-8 join-item mx-2" />

        <input
          ref="input"
          id="domain-search"
          class="flex-1 rounded-none px-2 h-full"
          placeholder="Find your domain"
          v-model="domain"
          type="text"
        />

        <button
          v-if="meta.hasValue"
          type="reset"
          class="btn btn-ghost btn-square join-item"
          tabindex="-1"
          @click="resetModel(input)"
          :disabled="meta.isProcessing"
        >
          <backspace-icon class="w-8 h-8" />
        </button>

        <button
          :class="`btn-${safeTheme}`"
          class="btn join-item"
          :disabled="meta.isProcessing || !meta.hasValue"
          @click="doSearch"
        >
          <span class="loading loading-spinner" v-if="meta.isProcessing"></span>

          <span v-else>Search</span>
        </button>
      </div>
    </fieldset>

    <div
      class="results flex flex-col items-center justify-center"
      v-if="meta.hasResults || (meta.hasValue && meta.isProcessing)"
    >
      <slot name="results" v-bind="{ results }">
        <ul role="list" class="menu rounded-box border w-full mt-2">
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
                :type="multiple ? 'checkbox' : 'radio'"
                name="dac-domain"
                :class="
                  multiple
                    ? ['checkbox', `checkbox-${safeTheme}`]
                    : ['radio', `radio-${safeTheme}`]
                "
                :checked="isChecked(item.domain)"
                :disabled="!item.is_available"
                :value="item.domain"
                @change="updateModel"
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
import { MagnifyingGlassIcon, NoSymbolIcon } from "@heroicons/vue/20/solid";
import { BackspaceIcon, CheckCircleIcon } from "@heroicons/vue/24/outline";

// --- internal
import { useDac } from "./composables";

// --- utils
import { compact, isArray, some, filter } from "lodash-es";

// ---------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDac",
  components: {
    MagnifyingGlassIcon,
    CheckCircleIcon,
    BackspaceIcon,
    NoSymbolIcon
  },
  emits: ["update:modelValue"],
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
      type: [String, Array]
    },
    multiple: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String
    }
  },
  setup(props) {
    const input = ref<InstanceType<typeof HTMLInputElement>>();
    const model = ref();
    if (props.multiple) {
      model.value = compact(
        isArray(props.modelValue) ? props.modelValue : [props.modelValue]
      );
    } else {
      model.value = props.modelValue || null;
    }

    const {
      meta,
      domain,
      results,
      // --- Methods
      reset,
      doSearch,
      loadMore
    } = useDac(props);

    return {
      // --- Refs
      model,
      input,
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
    multiple(value) {
      this.model = value ? [] : null;
      this.$emit("update:modelValue", this.model);
    }
  },
  methods: {
    resetModel(input: InstanceType<typeof HTMLInputElement>) {
      this.reset(input);
      this.model = this.multiple ? [] : null;
      this.$emit("update:modelValue", this.model);
    },

    updateModel(event: Event) {
      const target = event.target as HTMLInputElement;
      const value = target.value;

      if (this.multiple) {
        if (target.checked) {
          this.model.push(value);
        } else {
          this.model = this.model.filter((item: string) => item !== value);
        }
        this.model = compact(this.model);
      } else {
        this.model = value;
      }

      this.validate();

      this.$emit("update:modelValue", this.model);
    },

    validate() {
      const value = this.model;

      if (isArray(value) && value.length) {
        this.model = filter(value, item =>
          some(this.results, { domain: item })
        );
      } else {
        this.model = some(this.results, { domain: value }) ? value : null;
      }
    },

    isChecked(value: string) {
      if (this.multiple) {
        return this.model.includes(value);
      }

      return this.model === value;
    }
  },
  computed: {
    safeTheme() {
      return this.theme || "neutral";
    }
  }
});
</script>
./composables
