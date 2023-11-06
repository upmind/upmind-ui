<template>
  <form class="card bg-base-100 shadow-xl" :class="color">
    <div class="card-body">
      <header>
        <div class="card-actions justify-end floating">
          <button
            class="btn btn-ghost btn-square btn-sm"
            :disabled="meta.isLoading || processing"
            type="reset"
            @click.prevent="remove"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <h6 class="meta">{{ status }}</h6>
        <h4 class="card-title" v-if="available?.product?.name">
          {{ available.product.name }}
        </h4>
        <h5 class="subtitle" v-if="available?.product?.description">
          {{ available.product.description }}
        </h5>
      </header>

      <!-- terms -->
      <ul
        class="terms list-none stats stats-vertical xl:stats-horizontal shadow bg-stone-100 text-neutral"
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
            <!-- <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block w-8 h-8 stroke-current"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg> -->

            <input
              :key="term.billing_cycle_months"
              type="checkbox"
              class="checkbox checkbox-primary"
              :value="term"
              :checked="isSelectedTerm(term)"
              disabled
            />
          </div>
          <div class="stat-title">{{ term.billing_cycle_name }}</div>
          <div class="stat-value">
            {{ !term?.price ? "Free" : term?.price_formatted }}
          </div>
          <div class="stat-desc" v-if="term.saving">
            {{ term.saving_formatted }} Saving
          </div>
        </li>
      </ul>

      <!-- attributes -->
      <section class="attributes my-4" v-if="available.attributes?.length">
        <template v-for="attribute in available.attributes" :key="attribute.id">
          <h4 class="text-neutral">
            {{ attribute.name }}
          </h4>

          <ul class="menu bg-neutral-content rounded-md">
            <li v-for="value in attribute.values">
              <fieldset
                class="form-control"
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

                  <span class="label-text ml-2">{{ value.name }}</span>
                </label>

                <template v-if="model.attributes?.[attribute.id]?.[value.id]">
                  <fieldset
                    class="form-control quantity-increment"
                    v-if="value.canChangeQuantity"
                  >
                    <button
                      class="btn prepend"
                      @click.prevent="incrementAttribute(attribute.id, value)"
                    >
                      +
                    </button>

                    <input
                      type="number"
                      class="input"
                      v-model="
                        model.attributes[attribute.id][value.id].unit_quantity
                      "
                      :min="value.min_order_quantity"
                      :max="value.max_order_quantity"
                      :step="value.min_order_quantity || 1"
                      readonly
                    />

                    <button
                      class="btn append"
                      @click.prevent="decrementAttribute(attribute.id, value)"
                    >
                      -
                    </button>
                  </fieldset>
                </template>

                <strong>{{ value?.price?.price_formatted }}</strong>
              </fieldset>
            </li>
          </ul>
        </template>
      </section>

      <!-- options -->
      <section class="options" v-if="available.options?.length">
        <div class="my-4" v-for="option in available.options" :key="option.id">
          <h4 class="text-neutral">
            {{ option.name }}
          </h4>

          <ul class="menu bg-stone-100 rounded-md">
            <li class="" v-for="value in option.values">
              <div
                class="grid grid-cols-3"
                v-if="model.options"
                :disabled="meta.isLoading || processing"
              >
                <label
                  class="label cursor-pointer col-span-1 justify-start"
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

                <div class="col-span-2 justify-end text-right">
                  <template v-if="model.options?.[option.id]?.[value.id]">
                    <fieldset
                      v-if="value.canChangeQuantity"
                      class="quantity-increment form-control"
                    >
                      <button
                        class="btn prepend"
                        @click.prevent="incrementOption(option.id, value)"
                      >
                        +
                      </button>

                      <input
                        class="input"
                        type="number"
                        v-model="
                          model.options[option.id][value.id].unit_quantity
                        "
                        :min="value.min_order_quantity"
                        :max="value.max_order_quantity"
                        :step="value.min_order_quantity || 1"
                        readonly
                      />

                      <button
                        class="btn append"
                        @click.prevent="decrementOption(option.id, value)"
                      >
                        -
                      </button>
                    </fieldset>
                  </template>

                  <strong>{{ value?.price?.price_formatted }}</strong>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- provisioning -->
      <dl class="provisioning">
        <template v-for="field in available.provision_fields" :key="field.id">
          <fieldset
            class="form-control"
            :disabled="meta.isLoading || processing"
            v-if="field.defer_mode != 'hidden'"
          >
            <label class="label" :for="field.id">
              <span class="label-text"> {{ field.field_label }}</span>
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
              <option v-for="option in field.options" v-bind="option"></option>
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
        </template>
      </dl>

      <!-- summary -->
      <dl class="summary" v-if="!meta.isLoading && !processing">
        <template v-if="available.product?.canChangeQuantity">
          <dt>Quantity:</dt>
          <dd>
            <fieldset
              v-if="available.product?.canChangeQuantity"
              class="form-control quantity-increment"
            >
              <button class="btn prepend" @click.prevent="incrementQuantity">
                +
              </button>

              <input
                type="number"
                v-model="model.quantity"
                min="1"
                max="10"
                readonly
                @change="updateQuantity"
              />

              <button class="btn append" @click.prevent="decrementQuantity">
                -
              </button>
            </fieldset>
            <!-- <span v-else>{{ model.quantity }}</span> -->
          </dd>
        </template>

        <dt>Item Total:</dt>
        <dd v-if="meta.isCalculating">calculating...</dd>
        <dd v-else-if="meta.isConfiguring">waiting...</dd>
        <dd v-else="">{{ totalFormatted }}</dd>
      </dl>

      <footer>
        <div class="card-actions">
          <slot name="actions" v-bind="meta"> </slot>
        </div>

        <Debug
          title="Product Config"
          :state="state.value"
          :model="model"
          :context="available"
          :errors="errors"
          :meta="meta"
        ></Debug>

        <div class="overlay" v-if="processing">Updating...</div>
      </footer>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent, toRef, computed, getCurrentInstance } from "vue";
import { useBasketItem } from "..";
import Debug from "@/components/Debug.vue";
import { get, find } from "lodash-es";

export default defineComponent({
  name: "ProductConfig",
  components: {
    Debug
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
    }
  },
  setup: (props, { emit }) => {
    const basketItem = useBasketItem(props.item);
    const remove = () => emit("remove", { itemId: props.id });

    // const
    return {
      remove,
      ...basketItem,
      uuid: getCurrentInstance().uid
    };
  },
  computed: {
    color() {
      return {
        added: !this.meta.isNew,
        info: this.meta.isNew,
        warning: this.meta.isConfiguring,
        error: this.meta.hasErrors,
        success: this.meta.isConfigured && !this?.model?.id
      };
    },
    status() {
      const values = [];
      // if (this.id) values.push(`ID: ${this.id}`);
      if (this.meta.isLoading) values.push("Loading");
      if (this.meta.isNew) values.push("New");
      if (!this.meta.isNew) values.push("Added");

      if (!this.meta.isLoading) {
        if (this.meta.hasErrors) values.push("Errors");
        if (this.meta.isConfiguring) values.push("Configuring");
        if (this.meta.isConfigured) values.push("Configured");
      }

      return values.join(" · ");
    }
  },
  methods: {}
});
</script>
