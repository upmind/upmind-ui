<template>
  <form class="card" :class="color">
    <header>
      <template v-if="!meta.isLoading">
        <h6 class="meta">{{ status }}</h6>
        <h4 class="title">{{ available.product.name }}</h4>
        <h5 class="subtitle">{{ available.product.description }}</h5>
      </template>
      <template v-else> Loading... </template>
    </header>

    <!-- terms -->
    <ul class="terms">
      <li
        v-for="term in available.terms"
        :key="term.billing_cycle_months"
        class="term"
        :class="{ selected: isSelectedTerm(term) }"
        @click.prevent="setTerm(term)"
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
        <h5 class="price">{{ term.price_formatted }}</h5>
        <h6 class="savings" v-if="term.saving">{{ term.saving_formatted }}</h6>
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
          <fieldset v-if="model.attributes">
            <input
              :type="attribute.multiple ? 'checkbox' : 'radio'"
              v-model="model.attributes[attribute.id]"
              :name="`attributes[${attribute.id}][]`"
              @change="setAttributes"
              :required="attribute.required"
              :id="value.id"
              :value="value.id"
            />
            <label :for="value.id">{{ value.name }}</label>
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
          <fieldset v-if="model.options">
            <input
              :type="option.multiple ? 'checkbox' : 'radio'"
              v-model="model.options[option.id]"
              :name="`options[${option.id}][]`"
              @change="setOptions"
              :required="option.required"
              :id="value.id"
              :value="value.id"
            />
            <label :for="value.id"
              >{{ value.name }}
              <strong>{{ value.price.price_formatted }}</strong></label
            >
          </fieldset>
        </dd>
      </template>
    </dl>

    <!-- summary -->
    <dl class="summary" v-if="!meta.isLoading">
      <dt>Quantity:</dt>
      <dd>
        <fieldset
          v-if="available.product?.canChangeQuantity || true"
          class="quantity-increment"
        >
          <button class="prepend" @click.prevent="increment">+</button>

          <input
            type="number"
            v-model="model.quantity"
            min="1"
            max="10"
            @input="setQuantity"
          />

          <button class="append" @click.prevent="decrement">-</button>
        </fieldset>
      </dd>
      <dt>Price:</dt>
      <dd>{{ total_amount_formatted }}</dd>
    </dl>

    <footer>
      <Debug
        title="Product Config"
        :state="state"
        :model="model"
        :context="available"
        :errors="error"
        :meta="meta"
      ></Debug>
    </footer>
  </form>
</template>

<script lang="ts">
import { defineComponent, toRef } from "vue";
import Debug from "@/components/Debug.vue";
import {
  isEqual,
  get,
  set,
  find,
  some,
  forEach,
  intersectionWith,
  first,
  map,
  remove
} from "lodash-es";

export default defineComponent({
  name: "ProductConfig",
  components: {
    Debug
  },
  emits: [
    "update:term",
    "update:quantity",
    "update:attributes",
    "update:options"
  ],
  props: {
    id: {
      type: String,
      required: true
    },
    values: {
      type: Object,
      required: true
    },
    state: {
      type: [String, Object],
      required: true
    },
    available: {
      type: Object,
      required: true
    },
    matches: {
      type: Function,
      required: true
    },
    error: {
      type: [Array, Object]
    }
  },
  setup: props => {
    const model = toRef(props, "values");

    return {
      model
    };
  },
  computed: {
    // attributes: {
    //   get() {
    //     // ensure our attributes are set up correctly for mapping:
    //     const values = {};
    //     forEach(this.available.attributes, attribute => {
    //       const value = intersectionWith(
    //         this.model.attributes,
    //         attribute.values,
    //         ({ product_id }, { id }) => product_id === id
    //       );
    //       if (!attribute.multiple) {
    //         set(values, attribute.id, first(value)?.id || null);
    //       } else {
    //         set(values, attribute.id, map(value, "id"));
    //       }
    //     });

    //     return values;
    //   },
    //   set(value) {
    //     this.selectAttributes(value);
    //   }
    // },
    // ---
    meta() {
      return {
        isLoading: this.matches("loading")
      };
    },
    total_amount_formatted() {
      // get this from the machine
      return this.model?.billing_cycle_months
        ? this.model.quantity *
            get(
              find(this.available.terms, [
                "billing_cycle_months",
                this.model.billing_cycle_months
              ]),
              "price",
              0
            )
        : this.model.quantity * this.available?.product?.price || 0;
    },
    color() {
      return {
        warning: this.matches("configuring"),
        error: this.matches("error"),
        success: this.matches("configured")
      };
    },
    status() {
      if (this.matches("configuring")) return "Configuring";
      if (this.matches("error")) return "Error";
      if (this.matches("configured")) return "Configured";
      if (this.model?.id) return "Added";
    }
  },
  methods: {
    increment() {
      this.model.quantity++;

      if (this.available.product.max_order_quantity) {
        this.model.quantity = Math.min(
          this.model.quantity,
          this.available.product.max_order_quantity
        );
      }

      this.setQuantity();
    },
    decrement() {
      this.model.quantity--;

      this.model.quantity = Math.max(
        this.model.quantity,
        Math.max(this.available.product.min_order_quantity, 1)
      );

      this.setQuantity();
    },

    setQuantity() {
      this.$emit("update:quantity", {
        itemId: this.id,
        quantity: this.model.quantity
      });
    },

    // ---

    isSelectedTerm(term) {
      return isEqual(term.billing_cycle_months, this.model?.term);
    },

    setTerm(term) {
      this.$emit("update:term", {
        itemId: this.id,
        term: term.billing_cycle_months
      });
    },
    // ---

    setAttributes() {
      this.$emit("update:attributes", {
        itemId: this.id,
        attributes: this.model.attributes
      });
    },

    setOptions() {
      this.$emit("update:options", {
        itemId: this.id,
        options: this.model.options
      });
    }
  }
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

  &.info {
    background-color: var(--upm-c-info-muted);
    color: var(--upm-c-black);
  }
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

  // &:hover {
  //   box-shadow: 0 0 0.5em 0.25em rgba(0, 0, 0, 0.1);
  // }

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

    fieldset {
      justify-content: flex-end;

      &.quantity-increment {
        input {
          text-align: center;
        }
      }
    }
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

form {
  label {
    display: flex !important;
    justify-content: space-between;
    flex-grow: 1;
  }
}
</style>
