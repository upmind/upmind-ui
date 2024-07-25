<template>
  <li
    class="group/domain-baket-card m-0 items-center gap-x-4 gap-y-1 px-4 py-4 transition-colors sm:flex sm:flex-wrap sm:pl-6"
    :class="{
      'dark:hover:bg-dm-contrast/5 hover:bg-lm-contrast/2': meta.isAvailable,
      'bg-primary text-primary-text': meta.isSelected,
    }"
  >
    <div class="hidden sm:block">
      <check-circle-icon
        v-if="meta.isAvailable"
        class="h-7 w-7"
        :class="{
          'text-primary-content': meta.isSelected,
          'text-primary': !meta.isSelected,
        }"
      />
      <arrows-right-left-icon
        v-else
        class="h-7 w-7"
        :class="{
          'text-primary-content': meta.isSelected,
          'text-primary': !meta.isSelected,
        }"
      />
    </div>

    <div class="max-w-full grow-[99]">
      <!-- Status Label -->
      <span
        class="block text-sm uppercase leading-4"
        :class="{
          'text-primary-content': meta.isSelected,
          'text-primary': meta.isAvailable && !meta.isSelected,
          'text-auto-50': !meta.isAvailable,
        }"
      >
        {{ meta.isAvailable ? "Available" : "Transfer" }}
      </span>

      <!-- Domain Name (SLD + TLD) -->
      <div class="gap-x-8 overflow-hidden sm:flex sm:items-center">
        <span
          class="text-rtl text-auto grow truncate text-xl sm:text-2xl"
          :class="{
            'transition-transform sm:group-hover/domain-baket-card:translate-x-2':
              meta.isAvailable && !meta.isSelected,
          }"
        >
          <span
            class="font-light opacity-80"
            :class="{
              'text-base-content': !meta.isSelected,
              'text-primary-content': meta.isSelected,
            }"
            >{{ sld }}</span
          >

          <strong
            :class="{
              'font-semibold': true,
              'text-base-content': !meta.isSelected,
              'text-primary-content': meta.isSelected,
              'group-hover/domain-baket-card:text-primary transition-colors':
                meta.isAvailable && !meta.isSelected,
              'group-hover/domain-baket-card:text-primary-content transition-colors':
                meta.isAvailable && meta.isSelected,
            }"
            >{{ tld }}</strong
          >
        </span>

        <div
          class="flex shrink-0 flex-row-reverse items-center gap-x-3 sm:flex-row"
        >
          <!-- 'Save X%' tag -->

          <upw-badge
            :key="domain"
            :label="percentage_saving"
            v-if="meta.isAvailable && percentage_saving"
          />

          <!-- Price -->
          <template v-if="meta.isAvailable">
            <span
              path="price_by_n_years"
              class="text-auto-50 mr-auto shrink-0 text-sm"
              :class="{
                'text-base-content': !meta.isSelected,
                'text-primary-content': meta.isSelected,
              }"
              :count="billing_cycle_years"
            >
              <!-- <template #price> -->
              <span
                class="text-auto text-lg font-semibold sm:text-xl"
                :class="{
                  'text-base-content': !meta.isSelected,
                  'text-primary-content': meta.isSelected,
                }"
                >{{ price_discounted_formatted || price_formatted }}</span
              >
              <!-- </template> -->
            </span>
          </template>
        </div>
      </div>

      <!-- Billing Summary -->
      <upw-markdown
        tag="p"
        class="text-auto-50 text-xs"
        v-if="meta.isAvailable && billing_summary"
      >
        {{ billing_summary }}
      </upw-markdown>
    </div>

    <upw-button
      v-if="meta.isAvailable || meta.isSelected"
      variant="outline"
      color="primary"
      size="sm"
      :class="{ 'btn-active': meta.isSelected }"
      :disabled="meta.isLoading || meta.isProcessing"
      :value="domain"
      @click="select"
      tabindex="-1"
    >
      <shopping-cart-icon class="h-4 w-4 xl:hidden" />

      <template v-if="!meta.isSelected">Add</template>
      <template v-else-if="meta.isSelected && meta.isProcessing">
        <span v-if="meta.isProcessing" class="loading loading-xs"></span>
        Addding
      </template>
      <template v-else>Added</template> to Basket
    </upw-button>

    <div
      v-else
      class="text-auto-50 m-0 grow basis-72 text-xs"
      :class="{ 'text-primary-content': meta.isSelected }"
    >
      <p class="m-0" :values="{ percentage: percentage_saving }">
        Do you own this domain?

        <button
          as="anchor"
          :href="order_url"
          class="btn btn-xs btn-link"
          :value="domain"
          @click="updateModel"
          tabindex="-1"
        >
          <shopping-cart-icon class="h-4 w-4 xl:hidden" />

          Transfer it to us
        </button>
      </p>

      <p class="m-0">
        Our
        <strong class="text-inherit">{{ tld.toUpperCase() }}</strong> renewal
        prices start from only
        <strong class="text-inherit">{{
          price_discounted_formatted || price_formatted
        }}</strong>
        / {{ billing_cycle_years > 1 ? "years" : "year" }}.
      </p>
    </div>
  </li>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import {
  UpwMarkdown,
  UpwBadge,
  UpwButton,
  UpwAvatar,
  UpwIcon,
} from "@upmind/upwind";

// ---------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomainCard",
  components: {
    UpwMarkdown,
    UpwBadge,
    UpwButton,
    UpwAvatar,
    UpwIcon,
  },
  emits: ["change"],
  props: {
    i18nKey: { type: String, default: "domain.card" },
    // ---
    domain: {
      type: String,
      required: true,
    },
    sld: {
      type: String,
      required: true,
    },
    tld: {
      type: String,
      required: true,
    },
    // ---
    billing_cycle_years: { type: Number },
    billing_summary: { type: String },
    is_available: { type: Boolean },
    order_url: { type: String },
    percentage_saving: { type: Number },
    price_discounted_formatted: { type: String },
    price_formatted: { type: String },
    // ---
    disabled: { type: Boolean },
    loading: { type: Boolean },
    processing: { type: Boolean },
    modelValue: { type: Boolean },
  },
  setup(props) {
    const meta = computed(() => ({
      isDisabled: props.disabled,
      isLoading: props.loading,
      isProcessing: props.processing,
      isAvailable: props.is_available,
    }));

    const styles = useStyles(["domain.card"], meta, config);

    return {
      styles,
      meta,
    };
  },

  methods: {
    select() {
      this.$emit("update:modelValue", {
        value: this.domain,
        checked: !this.modelValue,
      });
    },
  },
});
</script>
