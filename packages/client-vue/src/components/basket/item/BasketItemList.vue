<template>
  <div v-if="!meta.isLoading" class="flex flex-col space-y-4">
    <template v-for="product in products" :key="product.id">
      <UpmBasketItem
        v-bind="product"
        :open="!!open[product.id]"
        :quantity="product.quantity"
        @update:open="trackOpen(product.id, $event)"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { ref, watch } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useRoute } from "vue-router";

// --- internal
import { useBasket } from "@upmind-automation/client-vue";

// --- components
import UpmBasketItem from "./BasketItem.vue";
import { every, reduce, set } from "lodash-es";

const props = defineProps<{
  open: boolean;
}>();

const emits = defineEmits(["update:open"]);

const { meta, products } = useBasket();

const open = ref<Record<string, boolean>>(forceOpen(props.open));

const route = useRoute();
function forceOpen(value: boolean = false): Record<string, boolean> {
  return reduce(
    products.value,
    (acc, item) => {
      set(acc, item.id, value);
      return acc;
    },
    {}
  );
}

function trackOpen(id: string, value: boolean) {
  open.value[id] = value;

  if (every(open.value)) {
    emits("update:open", true);
  } else if (every(open.value, v => !v)) {
    emits("update:open", false);
  }
}

watch(products, () => {
  open.value = forceOpen(props.open);
});

watch(
  () => props.open,
  () => {
    open.value = forceOpen(props.open);
  }
);
</script>
