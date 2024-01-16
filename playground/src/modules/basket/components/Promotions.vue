<template>
  <div class="promotions px-4">
    <h4 class="divider">Discounts</h4>

    <upm-form-generator
      class="mt-2"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="additionalErrors"
      :processing="processing"
      @resolve="doResolve"
    >
      <template #actions="{ meta }">
        <button
          type="submit"
          class="btn btn-block btn-link text-accent btn-xs"
          :disabled="!meta.isValid || meta.isProcessing"
        >
          Apply Discount Code
        </button>
      </template>
    </upm-form-generator>

    <ul class="my-4 p-0 list-none" v-if="hasPromotions">
      <li
        class="bg-accent bg-opacity-25 flex items-center rounded-lg text-xs"
        :class="{ 'border-accent': !processing }"
        v-for="promotion in promotions"
        :key="promotion.promotion.code"
      >
        <!-- <ReceiptPercentIcon class="w-6 h-6" /> -->

        <span class="spacer flex-1 mx-2">
          {{ promotion.promotion.code }}
        </span>

        <strong
          class="bg-accent bg-opacity-50 rounded-lg flex items-center py-1 px-2 mx-1"
          v-if="promotion?.promotion?.amount_formatted"
        >
          {{ promotion.promotion.amount_formatted }}
        </strong>

        <button
          class="btn btn-square btn-ghost btn-sm"
          title="Click to Remove Discount"
          @click.prevent="doReject(promotion)"
          :disabled="processing"
        >
          <x-mark-icon class="w-5 h-5" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import { UpmFormGenerator } from "@upmind/components";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { isEmpty } from "lodash-es";
import type { ErrorObject } from "ajv";

export default defineComponent({
  name: "ConfigPromotions",
  components: { UpmFormGenerator, XMarkIcon },
  inheritAttrs: true,
  customOptions: {},
  emits: ["reject", "resolve"],
  props: {
    processing: {
      type: Boolean,
      default: false
    },
    promotions: {
      type: Array,
      required: true
    },
    additionalErrors: {
      type: Array as PropType<
        ErrorObject<string, Record<string, any>, unknown>[]
      >,
      default: () => []
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { emit }) {
    const doReject = value => {
      emit("reject", value);
    };

    const doResolve = value => {
      emit("resolve", value);
    };

    return {
      doReject,
      doResolve
    };
  },
  computed: {
    hasPromotions() {
      return !isEmpty(this.promotions);
    },

    schema() {
      return {
        type: "object",
        required: ["promocode"],
        properties: {
          promocode: {
            type: "string",
            title: "Discount Code"
          }
        }
      };
    },

    uischema() {
      return {
        type: "HorizontalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/promocode",
            options: {
              placeholder: "eg: 9VT9TVXV, BF-fixed-10",
              styles: {
                control: {
                  input: "input input-accent input-bordered w-full max-w-xs"
                }
              }
            }
          }
        ]
      };
    }
  }
});
</script>
