<template>
  <form class="card" :class="color">
    <header>
      <div class="actions floating">
        <button
          :disabled="meta.isLoading || processing"
          type="reset"
          @click.prevent="remove"
        >
          remove
        </button>
      </div>

      <h6 class="meta">{{ status }}</h6>
      <h4 class="title" v-if="available?.product?.name">
        {{ available.product.name }}
      </h4>
      <h5 class="subtitle" v-if="available?.product?.description">
        {{ available.product.description }}
      </h5>
    </header>

    <!-- terms -->
    <ul class="terms">
      <li
        v-for="term in available.terms"
        :key="term.billing_cycle_months"
        class="term"
        :class="{
          selected: isSelectedTerm(term),
          disabled: meta.isLoading || processing
        }"
        @click.prevent="
          !meta.isLoading && !processing ? updateTerm(term) : null
        "
      >
        <input
          :key="term.billing_cycle_months"
          type="checkbox"
          :value="term"
          disabled
          :checked="isSelectedTerm(term)"
        />
        <h4 class="title" v-if="term?.billing_cycle_name">
          {{ term.billing_cycle_name }}
        </h4>
        <h5 class="price">
          {{ !term?.price ? "Free" : term?.price_formatted }}
        </h5>
        <h6 class="savings" v-if="term.saving">
          {{ term.saving_formatted }}
        </h6>
        <!-- {{ term }} -->
      </li>
    </ul>

    <!-- attributes -->
    <dl class="attributes">
      <template v-for="attribute in available.attributes" :key="attribute.id">
        <dt class="attribute">
          <h4 class="subtitle">
            {{ attribute.name }}
          </h4>
        </dt>
        <dd v-for="value in attribute.values">
          <fieldset
            v-if="model.attributes"
            :disabled="meta.isLoading || processing"
          >
            <input
              :type="attribute.multiple ? 'checkbox' : 'radio'"
              :name="`attributes[${attribute.id}]`"
              @change="selectAttribute(attribute, value.id, $event)"
              :checked="isSelectedAttribute(attribute.id, value.id)"
              :required="attribute.required"
              :id="`${uuid}-${value.id}`"
              :value="value.id"
            />

            <label :for="`${uuid}-${value.id}`">{{ value.name }}</label>

            <template v-if="model.attributes?.[attribute.id]?.[value.id]">
              <fieldset
                v-if="value.canChangeQuantity"
                class="quantity-increment"
              >
                <button
                  class="prepend"
                  @click.prevent="incrementAttribute(attribute.id, value)"
                >
                  +
                </button>

                <input
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
                  class="append"
                  @click.prevent="decrementAttribute(attribute.id, value)"
                >
                  -
                </button>
              </fieldset>
            </template>

            <strong>{{ value?.price?.price_formatted }}</strong>
          </fieldset>
        </dd>
      </template>
    </dl>

    <!-- options -->
    <dl class="options">
      <template v-for="option in available.options" :key="option.id">
        <dt class="option">
          <h4 class="subtitle">
            {{ option.name }}
          </h4>
        </dt>
        <dd v-for="value in option.values">
          <fieldset
            v-if="model.options"
            :disabled="meta.isLoading || processing"
          >
            <input
              :type="option.multiple ? 'checkbox' : 'radio'"
              :name="`options[${option.id}]`"
              @change="selectOption(option, value.id, $event)"
              :checked="isSelectedOption(option.id, value.id)"
              :required="option.required"
              :id="`${uuid}-${value.id}`"
              :value="value.id"
            />

            <label :for="`${uuid}-${value.id}`">
              {{ value.name }}
            </label>

            <template v-if="model.options?.[option.id]?.[value.id]">
              <fieldset
                v-if="value.canChangeQuantity"
                class="quantity-increment"
              >
                <button
                  class="prepend"
                  @click.prevent="incrementOption(option.id, value)"
                >
                  +
                </button>

                <input
                  type="number"
                  v-model="model.options[option.id][value.id].unit_quantity"
                  :min="value.min_order_quantity"
                  :max="value.max_order_quantity"
                  :step="value.min_order_quantity || 1"
                  readonly
                />

                <button
                  class="append"
                  @click.prevent="decrementOption(option.id, value)"
                >
                  -
                </button>
              </fieldset>
            </template>

            <strong>{{ value?.price?.price_formatted }}</strong>
          </fieldset>
        </dd>
      </template>
    </dl>

    <!-- provisioning -->
    <dl class="provisioning">
      <template v-for="field in available.provision_fields" :key="field.id">
        <fieldset
          :disabled="meta.isLoading || processing"
          v-if="field.defer_mode != 'hidden'"
        >
          <label :for="field.id">{{ field.field_label }}</label>
          <select
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
            :name="`provision_fields[${field.id}]`"
            :value="getProvisioningField(field.name)"
            :required="field.required"
            :id="field.id"
            @input="setProvisioningField(field.name, $event.target.value)"
          ></textarea>

          <input
            v-else
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
      <dt>Quantity:</dt>
      <dd>
        <fieldset
          v-if="available.product?.canChangeQuantity"
          class="quantity-increment"
        >
          <button class="prepend" @click.prevent="incrementQuantity">+</button>

          <input
            type="number"
            v-model="model.quantity"
            min="1"
            max="10"
            readonly
            @change="updateQuantity"
          />

          <button class="append" @click.prevent="decrementQuantity">-</button>
        </fieldset>
        <span v-else>{{ model.quantity }}</span>
      </dd>
      <dt>Price:</dt>
      <dd>{{ totalAmount }}</dd>
    </dl>

    <footer>
      <div class="actions">
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

<style scoped lang="scss">
.card {
  color: var(--upm-c-black);
  background-color: var(--upm-c-white-soft);
  padding: 1em;
  border: 1px solid var(--color-border);
  border-radius: 0.25em;
  transition: all 200ms linear;
  position: relative;
  max-width: none !important;

  &.warning {
    background-color: var(--upm-c-warning-muted);
    color: var(--upm-c-black);
  }
  &.error {
    background-color: var(--upm-c-error-muted);
    color: var(--upm-c-black);
  }
  &.success {
    background-color: var(--upm-c-success-muted);
    color: var(--upm-c-black);
  }
  &.info {
    background-color: var(--upm-c-info-muted);
    color: var(--upm-c-black);
  }

  &.added {
    background-color: var(--upm-c-white-soft);
    color: var(--upm-c-black);
  }

  // &:hover {
  //   box-shadow: 0 0 0.5em 0.25em rgba(0, 0, 0, 0.1);
  // }

  .actions {
    &.floating {
      margin: 0 !important;
      position: absolute;
      top: 0;
      right: 0;

      button,
      button[type="reset"] {
        font-size: 0.667em !important;
      }
    }
  }
  .title {
    font-size: 1.25em;
    font-weight: bold;
  }
  .subtitle {
    font-size: 1em;
    font-style: italic;
  }

  .meta {
    font-weight: 600;
    font-size: 0.5em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 0.5em;
    margin-top: 1em;
    font-size: 0.875em;

    dt {
      font-weight: bold;
    }
    dd {
      font-weight: normal;
      text-align: right;
    }
  }

  fieldset {
    justify-content: flex-end;

    &.quantity-increment {
      padding: 0 0.5em;
      input {
        text-align: center;
        color: currentColor !important;
        border-color: currentColor !important;
      }
      > button {
        background-color: var(--upm-c-black-semi);
        color: currentColor;
      }
    }
  }

  label {
    display: flex !important;
    justify-content: space-between;
    flex-grow: 1;
  }
}

.terms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  grid-gap: 0.5em;
  margin: 1em 0;
}

.term {
  color: var(--upm-c-black);
  background-color: var(--upm-c-white);
  border: 1px solid var(--color-border);
  border-radius: 0.25em;
  transition: all 200ms linear;
  text-align: center;
  position: relative;
  cursor: pointer;

  &.selected,
  &:hover {
    background-color: var(--upm-c-info-muted);
    color: var(--upm-c-black);
    border-color: var(--upm-c-info);
    box-shadow: var(--shadow-hover);
  }

  &.disabled {
    cursor: default;
    background-color: var(--upm-c-disabled-muted);
    color: var(--upm-c-black);
    border-color: var(--upm-c-disabled);
    box-shadow: none;
  }

  input[type="checkbox"] {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(25%, -25%);
  }

  .title {
    background-color: var(--upm-c-white);
    font-size: 0.875em;
    padding: 0.5em 0.125em;
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
  }
  .price {
    font-weight: 600;
    font-size: 1.25em;
    padding: 1em 0.125em;
  }
}

.overlay {
  // font-weight: 800;
  align-items: center;
  background-color: var(--overlay);
  bottom: 0;
  color: var(--overlay-text);
  display: flex;
  font-size: 0.873em;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  text-transform: uppercase;
  top: 0;
  z-index: 1;
}
</style>
