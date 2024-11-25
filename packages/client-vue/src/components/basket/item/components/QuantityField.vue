<template>
  <NumberField
    class-field="!text-[16px]"
    :model-value="props.quantity"
    @update:model-value="doUpdateQuantity"
    :min="props.product.min"
    :max="props.product.max"
    :step="props.product.step"
    variant="minimal"
    size="sm"
    width="sm"
  />
</template>

<script lang="ts" setup>
import { debounce } from "lodash-es";
import { NumberField } from "@upmind-automation/upwind";
import { useBasketProduct } from "@upmind-automation/client-vue";
import type { BasketProductDetails } from "@upmind-automation/client-vue";

const props = defineProps<{
  id: string;
  product: BasketProductDetails;
  quantity: number;
}>();

const { updateQuantity } = useBasketProduct(props.id);

const doUpdateQuantity = debounce((value: number) => {
  updateQuantity(value);
}, 750);
</script>
