<template>
  <div
    tabindex="0"
    ref="form"
    class="card card-bordered card-compact bg-base-100"
    :class="[
      meta.hasErrors ? 'border-error' : '',
      meta.isComplete ? 'border-primary' : '',
      !meta.isComplete ? 'border-warning' : ''
    ]"
  >
    <div class="card-body">
      <h3 class="text-inherit uppercase text-xl mt-2 mb-0 opacity-50">
        Billing Details
      </h3>

      <!-- <upm-form-generator
        tabindex="1"
        :additional-errors="errors?.data"
        :loading="meta.isLoading"
        :model-value="model"
        :processing="meta.isProcessing"
        :schema="schema"
        :uischema="uischema"
        @reject="clear"
        @resolve="update"
        @update:modelValue="input"
        class="mt-2 gap-4"
      >
        <template #actions="{ meta }">
          <button
            type="submit"
            class="btn btn-outline btn-sm btn-primary border-none"
            :disabled="!meta.isDirty || !meta.isValid || meta.isProcessing"
            v-show="meta.isDirty"
          >
            Update Billing Details
          </button>
        </template>
      </upm-form-generator> -->

      <div role="tablist" class="tabs tabs-lg tabs-lifted my-4">
        <input
          type="radio"
          name="billing_details"
          role="tab"
          class="tab"
          :class="{
            'text-primary': !model?.company_id && model?.address_id
          }"
          :aria-label="`My Addresses ${!model?.company_id && model?.address_id ? ' ✓ ' : ''}`"
          :checked="!model?.company_id"
        />
        <div
          role="tabpanel"
          class="tab-content bg-base-100 border-base-300 rounded-box p-6"
        >
          <upm-addresses
            class="p-0"
            :key="model?.address_id"
            :processing="meta.isProcessing"
            :model-value="!model?.company_id ? model?.address_id : null"
            @update:model-value="
              ({ id }) => input({ address_id: id, company_id: null })
            "
            :checked="!model?.company_id || false"
          />
        </div>

        <input
          type="radio"
          name="billing_details"
          role="tab"
          class="tab"
          :class="{
            'text-primary': !!model?.company_id
          }"
          :aria-label="`My Companies ${!!model?.company_id ? ' ✓ ' : ''}`"
          :checked="!!model?.company_id"
        />

        <div
          role="tabpanel"
          class="tab-content bg-base-100 border-base-300 rounded-box p-6"
        >
          <upm-companies
            class="p-0"
            :key="model?.company_id"
            :processing="meta.isProcessing"
            :model-value="model?.company_id"
            @update:model-value="
              ({ id }) => input({ company_id: id, address_id: null })
            "
          />
        </div>
      </div>

      <div class="card-actions">
        <button
          @click.prevent="update"
          class="btn btn-outline btn-sm btn-primary border-none"
          :disabled="!meta.isDirty || !meta.isValid || meta.isProcessing"
          v-show="meta.isDirty"
        >
          Update Billing Details
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useBasketBillingDetails } from "@upmind/vue";
import UpmAddresses from "../../client/address/components/Listings.vue";
import UpmCompanies from "../../client/company/components/Listings.vue";

export default defineComponent({
  name: "UpmBasketBillingDetails",
  components: {
    UpmAddresses,
    UpmCompanies
  },
  inheritAttrs: true,
  customOptions: {},
  props: {
    actor: {
      type: Object, // xstate actor
      required: true
    }
  },

  setup(props) {
    return useBasketBillingDetails(props.actor);
  }
});
</script>
