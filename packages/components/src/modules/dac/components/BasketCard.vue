<template>
  <li
    class="group/dac-baket-card items-center gap-x-4 gap-y-1 m-0 px-4 py-4 transition-colors sm:flex sm:flex-wrap sm:pl-6"
    :class="{
      'dark:hover:bg-dm-contrast/5 hover:bg-lm-contrast/2': is_available,
      'bg-primary text-primary-text': isSelected
    }"
    @click="select"
  >
    <!-- this is to mimic a form input behaviour + events -->
    <input ref="input" type="hidden" @change="updateModel" />

    <div class="hidden sm:block">
      <check-circle-icon
        v-if="is_available"
        class="h-7 w-7"
        :class="{
          'text-primary-content': isSelected,
          'text-primary': !isSelected
        }"
      />
      <arrows-right-left-icon v-else class="text-auto-25 h-7 w-7" />
    </div>

    <div class="max-w-full grow-[99]">
      <!-- Status Label -->
      <span
        class="block text-sm uppercase leading-4"
        :class="{
          'text-primary-content': is_available && isSelected,
          'text-primary': is_available && !isSelected,
          'text-auto-50': !is_available
        }"
      >
        {{ is_available ? "Available" : "Unavailable" }}
      </span>

      <div class="gap-x-8 overflow-hidden sm:flex sm:items-center">
        <!-- Domain Name (SLD + TLD) -->
        <span
          class="text-rtl text-auto grow truncate text-xl sm:text-2xl"
          :class="{
            'transition-transform sm:group-hover/dac-baket-card:translate-x-2':
              is_available
          }"
        >
          <span
            class="font-light opacity-80"
            :class="{
              'text-base-content': !isSelected,
              'text-primary-content': isSelected
            }"
            >{{ sld }}</span
          >

          <strong
            :class="{
              'font-semibold': true,
              'text-base-content': !isSelected,
              'text-primary-content': isSelected,
              'group-hover/dac-baket-card:text-primary transition-colors':
                is_available && !isSelected,
              'group-hover/dac-baket-card:text-primary-content transition-colors':
                is_available && isSelected
            }"
            >{{ tld }}</strong
          >
        </span>

        <div
          class="flex shrink-0 flex-row-reverse items-center gap-x-3 sm:flex-row"
        >
          <!-- 'Save X%' tag -->
          <template v-if="is_available">
            <saving-tag :key="domain" :percentage="percentage_saving" />
          </template>

          <!-- Price -->
          <template v-if="is_available">
            <span
              path="price_by_n_years"
              class="text-auto-50 mr-auto shrink-0 text-sm"
              :class="{
                'text-base-content': !isSelected,
                'text-primary-content': isSelected
              }"
              :count="billing_cycle_years"
            >
              <!-- <template #price> -->
              <span
                class="text-auto text-lg font-semibold sm:text-xl"
                :class="{
                  'text-base-content': !isSelected,
                  'text-primary-content': isSelected
                }"
                >{{ price_discounted_formatted || price_formatted }}</span
              >
              <!-- </template> -->
            </span>
          </template>
        </div>
      </div>

      <!-- Billing Summary -->
      <template v-if="is_available && billing_summary">
        <upm-markdown tag="p" class="text-auto-50 text-xs">{{
          billing_summary
        }}</upm-markdown>
      </template>
    </div>

    <template v-if="is_available">
      <button
        as="anchor"
        :href="order_url"
        class="btn btn-outline btn-primary"
        :class="{ 'btn-active': isSelected }"
        :value="domain"
        @click="updateModel"
        tabindex="-1"
      >
        <shopping-cart-icon class="h-4 w-4 xl:hidden" />

        <span v-if="!isSelected">Add</span><span v-else>Added</span> to Basket
      </button>
    </template>

    <template v-else>
      <p
        class="text-auto-50 grow basis-72 text-xs"
        :values="{ percentage: percentage_saving }"
      >
        <template v-if="order_url">
          Do you own this domain? Transfer it to us by
          <a :href="order_url" class="underline"> Clicking here </a>.
        </template>

        Our <strong>{{ tld.toUpperCase() }}</strong> renewal prices start from
        only
        <strong>{{ price_discounted_formatted || price_formatted }}</strong>
        / {{ billing_cycle_years > 1 ? "years" : "year" }}.
      </p>
    </template>
  </li>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import UpmMarkdown from "./Markdown.vue";
import SavingTag from "./SavingTag.vue";
import { CheckCircleIcon } from "@heroicons/vue/24/outline";
import { ArrowsRightLeftIcon, ShoppingCartIcon } from "@heroicons/vue/20/solid";

import { includes } from "lodash-es";

export default defineComponent({
  name: "UpmDacBasketCard",
  components: {
    UpmMarkdown,
    SavingTag,
    CheckCircleIcon,
    ArrowsRightLeftIcon,
    ShoppingCartIcon
  },
  emits: ["change"],
  props: {
    modelValue: {
      type: [String, Array<String>]
    },
    multiple: {
      type: Boolean,
      default: false
    },
    billing_cycle_years: {
      type: Number,
      default: 1
    },
    billing_summary: {
      type: String,
      default: ""
    },
    domain: {
      type: String,
      required: true
    },
    is_available: {
      type: Boolean,
      default: false
    },
    order_url: {
      type: String,
      default: ""
    },
    percentage_saving: {
      type: Number,
      default: 0
    },
    price_discounted_formatted: {
      type: String,
      default: ""
    },
    price_formatted: {
      type: String,
      default: ""
    },
    sld: {
      type: String,
      required: true
    },
    tld: {
      type: String,
      required: true
    }
  },
  setup() {
    const input = ref<InstanceType<typeof HTMLInputElement>>();

    return {
      input
    };
  },

  computed: {
    isSelected() {
      return this.multiple
        ? includes(this.modelValue, this.domain)
        : this.modelValue === this.domain;
    }
  },
  methods: {
    select() {
      if (!this?.input) return; // safety check

      // we use a radio to be able to emit a valid input event
      // so that any parent/form can listen to it
      this.input.value = this.domain;
      this.input?.dispatchEvent(new Event("input"));
    },

    updateModel(event: Event) {
      this.$emit("change", event);
    }
  }
});
</script>
