<template>
  <form
    class="card card-compact card-bordered border-base-300 rounded-xl bg-base-100 bg-opacity-10 shadow-sm overflow-hidden"
    :class="color"
  >
    <header class="">
      <div class="navbar px-4 relative">
        <div class="flex-1 flex flex-wrap items-center gap-2 overflow-x-hidden">
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

          <span
            :class="['rounded', 'badge', 'badge-outline', `badge-${color}`]"
            v-for="({ color, label }, index) in status"
            :key="`status-${index}`"
          >
            {{ label }}
          </span>
          <!-- <span :class="['rounded', 'badge', 'badge-sm', 'badge-warning']"
            >temp</span
          > -->
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
            <XMarkIcon></XMarkIcon>
          </button>
        </div>
      </div>

      <h4 class="card-title px-4 my-0" v-if="available?.product?.name">
        {{ available.product.name }}
      </h4>
      <h5 class="card-subtitle px-4" v-if="available?.product?.description">
        {{ available.product.description }}
      </h5>
    </header>

    <div class="card-body" v-if="!meta.isLoading">
      <!-- terms -->
      <ul
        class="terms list-none p-0 mt-4 stats stats-vertical border border-base-300 bg-base-200 bg-opacity-30"
      >
        <li
          v-for="term in available.terms"
          :key="term.billing_cycle_months"
          class="term stat cursor-pointer"
          :class="{
            selected: isSelectedTerm(term),
            disabled: meta.isLoading || processing
          }"
          @click.prevent="
            !meta.isLoading && !processing ? updateTerm(term) : null
          "
        >
          <div class="stat-figure text-secondary">
            <input
              :key="term.billing_cycle_months"
              type="checkbox"
              class="checkbox checkbox-secondary pointer-events-none"
              :value="term"
              :checked="isSelectedTerm(term)"
            />
          </div>

          <div class="stat-title">
            {{ term.billing_cycle_name }}
            <span
              v-if="term.saving"
              class="badge badge-outline badge-accent badge-sm mx-2"
            >
              Save {{ term.saving_formatted }}
            </span>
          </div>

          <!-- price -->
          <div class="stat-value" v-if="term?.price_discounted">
            <span class="line-through text-sm mt-2 block">
              {{ !term?.price ? "Free" : term?.price_formatted }}
            </span>
            <span class="text-accent">{{
              term.price_discounted_formatted
            }}</span>
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
        <li class="px-4 pt-2" v-if="available.product?.canChangeQuantity">
          <fieldset
            :disabled="meta.isLoading || processing"
            class="flex w-full"
          >
            <label class="label text-start w-full" for="quantity">
              <span class="label-text">Quantity</span>
            </label>

            <div class="quantity-increment join">
              <button
                class="btn btn-square btn-sm join-item"
                @click.prevent="incrementQuantity"
              >
                +
              </button>

              <input
                class="input input-sm join-item text-center max-w-[5em]"
                type="number"
                v-model="model.quantity"
                :min="available.product?.min_order_quantity"
                :max="available.product?.max_order_quantity"
                :step="available.product?.unit_quantity || 1"
                readonly
              />

              <button
                class="btn btn-square btn-sm join-item"
                @click.prevent="decrementQuantity()"
              >
                -
              </button>
            </div>
          </fieldset>
        </li>
      </ul>

      <!-- attributes -->
      <section class="attributes mt-4" v-if="available.attributes?.length">
        <div
          class="mt-4"
          v-for="attribute in available.attributes"
          :key="attribute.id"
        >
          <h4 class="">
            {{ attribute.name }}
          </h4>

          <ul
            class="list-none p-4 border border-base-300 bg-base-200 bg-opacity-30 rounded-xl"
          >
            <li class="p-0" v-for="value in attribute.values">
              <fieldset
                class="flex items-center justify-between"
                v-if="model.attributes"
                :disabled="meta.isLoading || processing"
              >
                <label
                  class="label cursor-pointer"
                  :for="`${uuid}-${value.id}`"
                >
                  <input
                    :type="attribute.multiple ? 'checkbox' : 'radio'"
                    :class="attribute.multiple ? 'checkbox' : 'radio'"
                    :name="`attributes[${attribute.id}]`"
                    @change="selectAttribute(attribute, value.id, $event)"
                    :checked="isSelectedAttribute(attribute.id, value.id)"
                    :required="attribute.required"
                    :id="`${uuid}-${value.id}`"
                    :value="value.id"
                  />

                  <span class="ml-2"> {{ value.name }}</span>
                </label>

                <div class="flex justify-end items-center">
                  <fieldset
                    v-if="
                      value.canChangeQuantity &&
                      model.attributes?.[attribute.id]?.[value.id]
                    "
                    class="quantity-increment join mx-4"
                  >
                    <button
                      class="btn btn-square btn-sm join-item"
                      @click.prevent="incrementAttribute(attribute.id, value)"
                    >
                      +
                    </button>

                    <input
                      class="input input-sm join-item text-center max-w-[5em]"
                      type="number"
                      v-model="
                        model.attributes[attribute.id][value.id].unit_quantity
                      "
                      :min="value.min_order_quantity"
                      :max="value.max_order_quantity"
                      :step="value.min_order_quantity || 1"
                      readonly
                    />

                    <button
                      class="btn btn-square btn-sm join-item"
                      @click.prevent="decrementAttribute(attribute.id, value)"
                    >
                      -
                    </button>
                  </fieldset>

                  <!-- price -->
                  <span
                    v-if="value?.price?.price_discounted"
                    class="text-right"
                  >
                    <span class="line-through text-xs block">
                      {{
                        !value?.price?.price
                          ? "Free"
                          : value?.price?.price_formatted
                      }}
                    </span>

                    <strong class="text-accent">{{
                      value?.price.price_discounted_formatted
                    }}</strong>
                  </span>

                  <strong class="text-right" v-else>
                    {{
                      !value?.price?.price
                        ? "Free"
                        : value?.price?.price_formatted
                    }}
                  </strong>
                </div>
              </fieldset>
            </li>
          </ul>
        </div>
      </section>

      <!-- options -->
      <section class="options" v-if="available.options?.length">
        <div class="mt-4" v-for="option in available.options" :key="option.id">
          <h4 class="">
            {{ option.name }}
          </h4>

          <ul
            class="list-none p-4 border border-base-300 bg-base-200 bg-opacity-30 rounded-xl"
          >
            <li class="p-0" v-for="value in option.values">
              <fieldset
                class="flex items-center justify-between"
                v-if="model.options"
                :disabled="meta.isLoading || processing"
              >
                <label
                  class="label cursor-pointer"
                  :for="`${uuid}-${value.id}`"
                >
                  <input
                    :type="option.multiple ? 'checkbox' : 'radio'"
                    :class="option.multiple ? 'checkbox' : 'radio'"
                    :name="`options[${option.id}]`"
                    @change="selectOption(option, value.id, $event)"
                    :checked="isSelectedOption(option.id, value.id)"
                    :required="option.required"
                    :id="`${uuid}-${value.id}`"
                    :value="value.id"
                  />

                  <span class="ml-2"> {{ value.name }}</span>
                </label>

                <div class="flex justify-end items-center">
                  <fieldset
                    v-if="
                      value.canChangeQuantity &&
                      model.options?.[option.id]?.[value.id]
                    "
                    class="quantity-increment join mx-4"
                  >
                    <button
                      class="btn btn-square btn-sm join-item"
                      @click.prevent="incrementOption(option.id, value)"
                    >
                      +
                    </button>

                    <input
                      class="input input-sm join-item text-center"
                      type="number"
                      v-model="model.options[option.id][value.id].unit_quantity"
                      :min="value.min_order_quantity"
                      :max="value.max_order_quantity"
                      :step="value.min_order_quantity || 1"
                      readonly
                    />

                    <button
                      class="btn btn-square btn-sm join-item"
                      @click.prevent="decrementOption(option.id, value)"
                    >
                      -
                    </button>
                  </fieldset>

                  <!-- price -->
                  <span
                    v-if="value?.price?.price_discounted"
                    class="text-right"
                  >
                    <span class="line-through text-xs block">
                      {{
                        !value?.price?.price
                          ? "Free"
                          : value?.price?.price_formatted
                      }}
                    </span>
                    <strong class="text-accent">{{
                      value?.price.price_discounted_formatted
                    }}</strong>
                  </span>

                  <strong class="text-right" v-else>
                    {{
                      !value?.price?.price
                        ? "Free"
                        : value?.price?.price_formatted
                    }}
                  </strong>
                </div>
              </fieldset>
            </li>
          </ul>
        </div>
      </section>

      <!-- provisioning -->
      <section class="provisioning" v-if="available.provision_fields?.length">
        <h4 class="">Additional Information</h4>
        <ul
          class="list-none p-4 border border-base-300 bg-base-200 bg-opacity-30 rounded-xl"
        >
          <template v-for="field in available.provision_fields" :key="field.id">
            <li class="p-0" v-if="field.defer_mode != 'hidden'">
              <fieldset
                class="flex flex-col"
                :disabled="meta.isLoading || processing"
              >
                <label class="label text-start w-full" :for="field.id">
                  <span class="label-text">{{ field.field_label }}</span>
                </label>

                <select
                  class="select select-bordered w-full max-w-xs"
                  v-if="field.field_type == 'select'"
                  :name="`provision_fields[${field.id}]`"
                  :value="getProvisioningField(field.name)"
                  :required="field.required"
                  @input="setProvisioningField(field.name, $event.target.value)"
                  :id="field.id"
                >
                  <option
                    v-for="option in field.options"
                    v-bind="option"
                  ></option>
                </select>

                <textarea
                  v-else-if="field.field_type == 'textarea'"
                  class="textarea textarea-bordered w-full max-w-xs"
                  :name="`provision_fields[${field.id}]`"
                  :value="getProvisioningField(field.name)"
                  :required="field.required"
                  :id="field.id"
                  @input="setProvisioningField(field.name, $event.target.value)"
                ></textarea>

                <input
                  v-else
                  class="input input-bordered w-full max-w-xs"
                  :type="field.field_type.replace('input_', '')"
                  :name="`provision_fields[${field.id}]`"
                  :value="getProvisioningField(field.name)"
                  :required="field.required"
                  :id="field.id"
                  @input="setProvisioningField(field.name, $event.target.value)"
                />
              </fieldset>
            </li>
          </template>
        </ul>
      </section>
    </div>

    <footer
      v-if="!meta.isLoading"
      class="items-center justify-between p-4 bg-base-200"
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
  </form>

  <Debug
    v-if="debugging"
    title="Product Config"
    :state="state.value"
    :model="model"
    :context="available"
    :errors="errors"
    :meta="meta"
    class="mt-2"
  ></Debug>
</template>

<script lang="ts">
import { defineComponent, toRef, computed, getCurrentInstance } from "vue";
import { useBasketItem } from "..";
import Debug from "@/components/Debug.vue";
import { get, find } from "lodash-es";
import { XMarkIcon } from "@heroicons/vue/24/solid";

export default defineComponent({
  name: "ProductConfig",
  components: {
    Debug,
    XMarkIcon
  },
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
    const basketItem = useBasketItem(props.item);
    const remove = () => emit("remove", { itemId: props.id });

    // const
    return {
      remove,
      ...basketItem,
      uuid: getCurrentInstance()?.uid
    };
  },
  computed: {
    color() {
      return {
        // "bg-base": !this.meta.isNew,
        "border-base-300": this.meta.isConfigured,
        // "text-base-content": this.meta.isConfigured,
        // ---
        "border-info": this.meta.isNew && this.meta.isConfiguring,
        // "text-info-content": this.meta.isNew && this.meta.isConfiguring,
        // ---
        "border-primary":
          this.meta.isConfiguring ||
          (this.meta.isConfigured && (this.meta.isNew || this.meta.isDirty)),

        // "border-warning": this.meta.isConfiguring,
        // "text-warning-content": this.meta.isConfiguring,
        // ---
        "border-error": this.meta.hasErrors
        // "text-error-content": this.meta.hasErrors,
        // ---
        // "border-success":
        //   this.meta.isConfigured && (this.meta.isNew || this.meta.isDirty)
        // "text-success-content":
        //   this.meta.isConfigured && (this.meta.isNew || this.meta.isDirty)
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
