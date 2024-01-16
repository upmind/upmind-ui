<template>
  <div
    class="promotions flex flex-col gap-4 text-accent border border-accent rounded-box px-4 text-center"
  >
    <!-- <h4 class="divider uppercase text-xs">Discounts</h4> -->
    <h3 class="text-inherit text-xl">Discounts</h3>

    <upm-form-generator
      :schema="schema"
      :uischema="uischema"
      :additional-errors="additionalErrors"
      :processing="processing"
      @resolve="doResolve"
    >
      <template #actions="{ meta }">
        <button
          type="submit"
          class="btn btn-outline btn-sm mx-auto"
          :disabled="!meta.isValid || meta.isProcessing"
        >
          Apply
        </button>
      </template>
    </upm-form-generator>

    <ul class="flex flex-col p-0 list-none text-left" v-if="hasPromotions">
      <div class="divider text-xs uppercase text-base-content mt-0">
        Active Discounts
      </div>

      <li
        class="bg-base-300 bg-opacity-25 text-base-content flex items-center justify-between rounded-btn p-2 text-xs"
        v-for="promotion in promotions"
        :key="promotion.promotion.code"
      >
        <!-- <ReceiptPercentIcon class="w-6 h-6" /> -->

        <span class="spacer mx-1 text-sm flex gap-2 items-center">
          <tag-icon class="w-6 h-6" />
          {{ promotion.promotion.code }}
        </span>

        <button
          class="btn btn-circle btn-ghost btn-xs"
          title="Click to Remove Discount"
          @click.prevent="doReject(promotion)"
          :disabled="processing"
        >
          <x-mark-icon class="w-fit h-fit" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import { UpmFormGenerator } from "@upmind/components";
import { XMarkIcon, TagIcon } from "@heroicons/vue/24/outline";
import { isEmpty } from "lodash-es";
import type { ErrorObject } from "ajv";

export default defineComponent({
  name: "ConfigPromotions",
  components: { UpmFormGenerator, XMarkIcon, TagIcon },
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
