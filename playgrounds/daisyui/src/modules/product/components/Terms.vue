<template>
  <section class="terms" v-if="terms?.length">
    <ul
      class="w-full list-none p-0 stats border border-base-300 bg-base-200 bg-opacity-30"
    >
      <li
        v-for="term in terms"
        :key="term.billing_cycle_months"
        class="term stat cursor-pointer"
        :class="{
          selected: isSelected(term),
          disabled: processing,
        }"
        :data-selected="isSelected(term)"
        @click.prevent="!processing ? $emit('update:modelValue', term) : null"
      >
        <div class="stat-figure text-secondary">
          <input
            :key="term.billing_cycle_months"
            type="checkbox"
            class="checkbox checkbox-secondary pointer-events-none"
            :value="term"
            :checked="isSelected(term)"
          />
        </div>

        <div class="stat-title">
          {{ term.billing_cycle_name }}
          <span
            v-if="term.saving"
            class="rounded badge badge-accent text-base-100 badge-sm mx-2"
          >
            Save {{ term.saving_formatted }}
          </span>
        </div>

        <!-- price -->
        <div class="stat-value" v-if="term?.price_discounted">
          <span class="line-through text-sm mt-2 block">
            {{ !term?.price ? "Free" : term?.price_formatted }}
          </span>
          <span class="text-accent">{{ term.price_discounted_formatted }}</span>
        </div>
        <div class="stat-value" v-else>
          {{ !term?.price ? "Free" : term?.price_formatted }}
        </div>

        <!-- promo/monthly -->
        <div
          class="stat-desc"
          v-if="term?.monthly_price_from && term.billing_cycle_months > 1"
        >
          <span
            class="text-sm"
            v-if="term?.monthly_price_from_discounted_formatted"
          >
            {{ term.monthly_price_from_discounted_formatted }}
          </span>
          <span class="text-sm" v-else>
            {{ term.monthly_price_from_formatted }}
          </span>
          per Month
        </div>
      </li>

      <!-- quantity -->
      <li class="px-4 pt-2" v-if="product?.canChangeQuantity">
        <quantity
          label="Quantity"
          :processing="processing"
          :min="product?.min_order_quantity"
          :max="product?.max_order_quantity"
          :step="product?.unit_quantity || 1"
          :model-value="quantity"
          @update:increment="$emit('update:quantity:increment', $event)"
          @update:decrement="$emit('update:quantity:decrement', $event)"
        ></quantity>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Quantity from "./Quantity.vue";

import { isEqual } from "lodash-es";

export default defineComponent({
  name: "ProductConfigTerms",
  components: {
    Quantity,
  },
  inheritAttrs: true,
  customOptions: {},
  emits: [
    "update:modelValue",
    "update:quantity",
    "update:quantity:increment",
    "update:quantity:decrement",
  ],
  props: {
    processing: {
      type: Boolean,
      default: false,
    },
    product: {
      type: Object,
      required: true,
    },
    terms: {
      type: Array,
      required: true,
    },
    modelValue: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    function isSelected(term) {
      const value = isEqual(term.billing_cycle_months, props.modelValue);
      return value;
    }

    return {
      isSelected,
    };
  },
  computed: {},
});
</script>
