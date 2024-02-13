<template>
  <div
    tabindex="0"
    ref="form"
    class="card card-bordered card-compact bg-base-100"
    :class="[
      meta.hasErrors ? 'border-error' : '',
      meta.isComplete ? 'border-accent' : '',
      !meta.isComplete ? 'border-accent' : ''
    ]"
  >
    <div class="card-body">
      <h3 class="text-inherit uppercase text-xl mt-2 mb-0 opacity-50">
        Discounts
      </h3>

      <upm-form-generator
        tabindex="1"
        :additional-errors="errors?.data"
        :loading="meta.isLoading"
        :model-value="model"
        :processing="meta.isProcessing"
        :schema="schema"
        :uischema="uischema"
        @reject="clear"
        @resolve="add"
        @update:modelValue="input"
        class="mt-2 gap-4"
      >
        <template #actions="{ meta }">
          <button
            type="submit"
            class="btn btn-outline btn-sm btn-accent border-none"
            :disabled="!meta.isDirty || !meta.isValid || meta.isProcessing"
            v-show="meta.isDirty"
          >
            Apply
          </button>
        </template>
      </upm-form-generator>

      <ul
        class="flex flex-col p-0 list-none text-left"
        v-if="meta.hasPromotions"
      >
        <div class="divider text-xs uppercase text-base-content mt-0">
          Active Discounts
        </div>

        <li
          class="border border-accent bg-accent bg-opacity-10 text-base-content flex items-center justify-between rounded-btn p-2 text-xs"
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
            @click.prevent="remove(promotion)"
            :disabled="meta.isProcessing"
          >
            <x-mark-icon class="w-fit h-fit" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { UpmFormGenerator } from "@upmind/ui";
import { useBasketPromotions } from "@upmind/vue";
import { XMarkIcon, TagIcon } from "@heroicons/vue/24/outline";

export default defineComponent({
  name: "UpmBasketPromotions",
  components: { UpmFormGenerator, XMarkIcon, TagIcon },
  inheritAttrs: true,
  customOptions: {},
  props: {
    actor: {
      type: Object, // xstate actor
      required: true
    }
  },

  setup(props) {
    return useBasketPromotions(props.actor);
  }
});
</script>
