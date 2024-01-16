<template>
  <section
    class="card card-compact card-bordered border-base-300"
    :class="color"
  >
    <header class="">
      <div class="navbar px-4 relative">
        <div class="flex-1 flex flex-wrap overflow-x-hidden gap-2">
          <span
            class="rounded badge badge-info"
            v-if="available?.product?.hasFreeTrial"
          >
            free trail
          </span>

          <span
            class="rounded badge badge-accent text-base-100"
            v-if="available?.product?.isOnPromotion"
          >
            On Promotion
          </span>

          <template v-if="isDev">
            <span
              class="rounded badge badge-outline"
              :class="[`badge-${color}`]"
              v-for="({ color, label }, index) in status"
              :key="`status-${index}`"
            >
              {{ label }}
            </span>
          </template>

          <h4
            class="card-title my-0 w-full text-inherit"
            v-if="available?.product?.name"
          >
            {{ available.product.name }}
          </h4>
        </div>

        <div class="flex-none">
          <progress
            v-if="meta.isLoading"
            class="progress progress-secondary w-12"
          ></progress>

          <button
            v-else
            class="btn btn-ghost btn-square btn-xs"
            :disabled="processing"
            type="reset"
            @click.prevent="remove"
          >
            <x-mark-icon></x-mark-icon>
          </button>
        </div>
      </div>

      <h5
        class="card-subtitle px-4 text-inherit"
        v-if="available?.product?.description"
      >
        {{ available.product.description }}
      </h5>
    </header>

    <form class="card-body" v-if="!meta.isLoading" :data-theme="activeTheme">
      <config-terms
        v-if="!isNil(model?.term?.billing_cycle_months)"
        :processing="meta.isLoading || processing || meta.isCalculating"
        :product="availableProduct"
        :terms="availableTerms"
        :quantity="model?.quantity"
        :model-value="model?.term?.billing_cycle_months"
        @update:modelValue="updateTerm"
        @update:quantity:increment="incrementQuantity"
        @update:quantity:decrement="decrementQuantity"
      ></config-terms>

      <config-attributes
        v-if="model?.attributes"
        :processing="meta.isLoading || processing || meta.isCalculating"
        :attributes="available.attributes"
        :model-value="model.attributes"
        @update:modelValue="selectAttribute"
        @update:quantity:increment="incrementAttribute"
        @update:quantity:decrement="decrementAttribute"
      ></config-attributes>

      <config-options
        v-if="model?.options"
        :processing="meta.isLoading || processing || meta.isCalculating"
        :options="available.options"
        :model-value="model.options"
        @update:modelValue="selectOption"
        @update:quantity:increment="incrementOption"
        @update:quantity:decrement="decrementOption"
      ></config-options>

      <config-provisioning
        class=""
        v-if="model?.provision_fields"
        :processing="meta.isLoading || processing || meta.isCalculating"
        :fields="getProvisioningFields()"
        :additionalErrors="errors?.data"
        :model-value="model.provision_fields"
        @update:modelValue="setProvisioningFields"
      ></config-provisioning>
    </form>

    <footer
      v-if="!meta.isLoading"
      class="items-center justify-between p-4 border-t"
    >
      <aside
        class="summary flex-1 items-center justify-center text-center grid-flow-col"
      >
        <strong class="uppercase" v-if="processing"> Updating... </strong>
        <strong class="uppercase" v-else-if="meta.isCalculating">
          Calculating...
        </strong>
        <strong class="uppercase" v-else-if="meta.isConfiguring">
          Pending...
        </strong>
        <template v-else-if="!!summary?.discount">
          <span class="uppercase">Item Total: </span>
          <span class="inline-block align-center text-right">
            <span class="line-through text-sm ml-2 block">{{
              summary.subtotalFormatted
            }}</span>
            <!-- <span class="text-sm ml-2 block">
              - {{ summary.discountFormatted }}</span
            > -->
            <strong class="text-accent text-xl ml-2 block">{{
              summary?.totalFormatted
            }}</strong>
          </span>
        </template>
        <template v-else>
          <span class="uppercase">Item Total: </span>

          <strong class="text-secondary text-xl ml-2">
            {{ summary?.totalFormatted }}
          </strong>
        </template>
      </aside>

      <div class="justify-end card-actions">
        <slot name="actions" v-bind="meta"> </slot>
      </div>
    </footer>
  </section>

  <upm-debug
    v-if="debugging"
    title="Product Config"
    :state="state.value"
    :model="model"
    :context="available"
    :errors="errors"
    :meta="meta"
    class="mt-2"
  />
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance, inject } from "vue";
import { useProductConfig } from "..";
import { UpmDebug } from "@upmind/components";
import ConfigTerms from "../components/Terms.vue";
import ConfigAttributes from "../components/Attributes.vue";
import ConfigOptions from "../components/Options.vue";
import ConfigProvisioning from "../components/Provisioning.vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { isNil } from "lodash-es";

export default defineComponent({
  name: "ConfigProduct",
  components: {
    ConfigTerms,
    ConfigAttributes,
    ConfigOptions,
    ConfigProvisioning,
    UpmDebug,
    XMarkIcon
  },
  inject: ["activeTheme"],
  emits: [
    "remove",
    "update:term",
    "update:quantity",
    "update:attributes",
    "update:provisioning",
    "update:options"
  ],
  props: {
    id: {
      type: String,
      required: true
    },
    item: {
      type: Object, // xstate actor
      required: true
    },
    processing: {
      type: Boolean,
      default: false
    },
    debugging: {
      type: Boolean,
      default: false
    }
  },
  setup: (props, { emit }) => {
    const productConfig = useProductConfig(props.item);
    const remove = () => emit("remove", { itemId: props.id });

    // const
    return {
      isNil,
      remove,
      ...productConfig,
      uuid: getCurrentInstance()?.uid
    };
  },
  computed: {
    isDev(): boolean {
      return (this.debugging && import.meta.env.DEV) || true;
    },
    color() {
      return {
        "border-base-300":
          this.meta.isConfigured && !this.meta.isNew && !this.meta.isDirty,

        "border-primary":
          this.meta.isConfiguring ||
          (this.meta.isConfigured && (this.meta.isNew || this.meta.isDirty)),

        "border-error": this.meta.hasErrors
      };
    },
    status() {
      const values = [];

      if (this.processing) values.push({ color: "", label: "Updating..." });

      if (!this.meta.isLoading && !this.processing) {
        if (this.meta.isCalculating)
          values.push({ color: "", label: "Calculating..." });
        if (this.meta.hasErrors)
          values.push({ color: "error", label: "Has Errors" });
        if (this.meta.isConfiguring)
          values.push({ color: "primary", label: "Needs Configuring" });
        if (this.meta.isConfigured && !this.meta.isNew && !this.meta.isDirty)
          values.push({ color: "secondary", label: "Is Configured" });
        if (this.meta.isConfigured && (this.meta.isNew || this.meta.isDirty))
          values.push({ color: "primary", label: "Pending" });
      }

      return values;
      // return values.join(" · ");
    }
  },
  methods: {}
});
</script>
