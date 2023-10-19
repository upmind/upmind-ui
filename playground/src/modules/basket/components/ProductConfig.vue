<template>
  <form class="card" :class="color">
    <header>
      <template v-if="!meta.isLoading">
        <h6 class="meta">{{ status }}</h6>
        <h4 class="title">{{ product.name }}</h4>
        <h5 class="subtitle">{{ product.description }}</h5>
      </template>
      <template v-else> Loading... </template>
    </header>

    <!-- terms -->
    <ul class="terms">
      <li
        v-for="term in available.terms"
        class="term"
        :class="{ selected: isSelectedTerm(term) }"
      >
        <input type="checkbox" :value="term" :checked="isSelectedTerm(term)" />
        <h4 class="title" v-if="term?.billing_cycle_name">
          {{ term.billing_cycle_name }}
        </h4>
        <h5 class="price">{{ term.price_formatted }}</h5>
        <h6 class="savings" v-if="term.saving">{{ term.saving_formatted }}</h6>
        <!-- {{ term }} -->
      </li>
    </ul>

    <!-- attributes -->
    <!-- options -->

    <!-- summary -->
    <dl class="summary" v-if="!meta.isLoading">
      <dt>Quantity:</dt>
      <dd>
        <fieldset
          v-if="product?.canChangeQuantity || true"
          class="quantity-increment"
        >
          <button class="prepend" @click.prevent="increment">+</button>

          <input type="number" v-model="config.quantity" min="1" max="10" />

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
        :model="config"
        :context="{ product, selected, available }"
        :errors="error"
        :meta="meta"
      ></Debug>
    </footer>
  </form>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import Debug from "@/components/Debug.vue";
import { isEqual } from "lodash-es";

export default defineComponent({
  name: "ProductConfig",
  components: {
    Debug
  },
  props: {
    item: {
      type: Object, // This is really an Actor for a spawned Item
      required: true
    }
  },
  setup: props => {
    const config = ref(props.item.context.config);
    const state = computed(() => props.item.value);
    const product = computed(() => props.item.context.product);
    const selected = computed(() => props.item.context.selected);
    const available = computed(() => props.item.context.available);
    const error = computed(() => props.item.context.error);

    const meta = computed(() => {
      return {
        isLoading: props.item.matches("loading")
      };
    });

    function increment() {
      config.value.quantity++;
      config.value.quantity = Math.min(config.value.quantity, 10);
    }
    function decrement() {
      config.value.quantity--;
      config.value.quantity = Math.max(config.value.quantity, 1);
    }

    function isSelectedTerm(term) {
      debugger;
      const selectedTerm = selected.value.term;
      debugger;
      const value = isEqual(selectedTerm, term);
      debugger;
      return value;
    }

    return {
      state,
      config,
      product,
      selected,
      available,
      error,
      meta,
      // ---
      total_amount_formatted: computed(() => {
        // get this from the machine
        return selected.value?.term
          ? config.value.quantity * selected.value.term?.price
          : config.value.quantity * product.value.price;
      }),
      color: computed(() => {
        return {
          warning: props.item.matches("configuring"),
          error: props.item.matches("error"),
          success: props.item.matches("configured")
        };
      }),
      status: computed(() => {
        if (props.item.matches("configuring")) return "Configuring";
        if (props.item.matches("error")) return "Error";
        if (props.item.matches("configured")) return "Configured";
        if (props.item.context.config?.id) return "Added";
      }),
      // ---
      isSelectedTerm,
      increment,
      decrement
    };
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 1em;
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
    padding: 0.5em 1em;
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
  }
  .price {
    font-weight: 600;
    font-size: 1.5em;
    padding: 1em;
  }
}
</style>
