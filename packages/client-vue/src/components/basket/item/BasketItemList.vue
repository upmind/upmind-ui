<template>
  <div v-if="!meta.isLoading" class="flex flex-col space-y-4">
    <template v-for="product in data" :key="product.id">
      <UpmBasketItem
        v-bind="product"
        :open="!!open[product.id]"
        @update:open="trackOpen(product.id, $event)"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { ref, watch, computed } from "vue";
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
const useMockData = computed(() => "mock" in route.query);

const data = computed(() => {
  if (useMockData.value) {
    return [
      {
        id: "d6325079-8065-d1e0-67df-8174e234e98d",
        quantity: 1,
        productId: "3de78642-de53-9714-542c-21208469530d",
        term: 0,
        options: {
          "20403869-6e54-721d-4ea5-18d9305e7d23": {
            "78985742-6489-7012-0e4c-21e325d0ed36": {
              productId: "78985742-6489-7012-0e4c-21e325d0ed36",
              quantity: 1,
              cycle: 0,
            },
          },
        },
        attributes: {},
        provisionFields: [],
        product: {
          name: "Upmind License",
          serviceIdentifier: "hosting.com",
          category: "Software",
          description: "Development - Dev Blocks",
          excerpt: "__vue_devtool_undefined__",
          id: "3de78642-de53-9714-542c-21208469530d",
          imgUrl: "__vue_devtool_undefined__",
          quantifiable: false,
          step: 1,
          min: 0,
          max: "__vue_devtool_infinity__",
        },
        summary: {
          pricing: [
            {
              name: "Monthly",
              category: "Billing Cycle",
              serviceIdentifier: null,
              cycle: 1,
              quantity: 1,
              meta: { oneoff: false, discounted: true, free: false },
              regularAmount: 5000,
              regularPrice: "£50.00",
              currentAmount: 4500,
              currentPrice: "£45.00",
              key: "term",
            },
          ],
          details: [
            {
              name: "Monthly",
              category: "Billing Cycle",
              serviceIdentifier: null,
              cycle: 1,
              quantity: 1,
              meta: { oneoff: false, discounted: true, free: false },
              regularAmount: 5000,
              regularPrice: "£50.00",
              currentAmount: 4500,
              currentPrice: "£45.00",
              key: "term",
            },
            {
              name: "Easy-to-implement",
              category: "Bundle",
              serviceIdentifier: null,
              cycle: 0,
              quantity: 1,
              meta: { oneoff: false, discounted: false, free: false },
              regularAmount: 1500,
              regularPrice: "$1,500.00",
              currentAmount: 1500,
              currentPrice: "$1,500.00",
              key: "option",
            },
          ],
        },
      },
    ];
  }
  return products.value;
});

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
