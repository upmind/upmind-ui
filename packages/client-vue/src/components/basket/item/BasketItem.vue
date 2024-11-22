<template>
  <div class="bg-base flex flex-col gap-y-4 p-8 pb-7">
    <UpmBasketItemSummary
      v-for="pricing in summary.pricing"
      :key="pricing.key"
      :product="props.product"
      :pricing="pricing"
    />

    <div class="flex justify-between pt-[16px]">
      <CartItemConfigDetails
        v-model:open="open"
        :items="filteredSummaryDetails"
        :disabled="!meta.isConfigurable"
        label="Show details"
      />

      <div class="text-primary flex items-end space-x-2">
        <Icon icon="pencil" size="xs" />
        <Icon icon="bin" size="xs" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import { useBasketProduct, UpmCard } from "@upmind-automation/client-vue";

// --- components
import {
  Spinner,
  NumberField,
  DropdownMenu,
  Badge,
  Icon,
  Separator,
} from "@upmind-automation/upwind";
import CartItemConfigDetails from "@/views/cart/components/CartItemConfigDetails.vue";
import UpmBasketItemSummary from "./BasketItemSummary.vue";

// --- utils
import { debounce, find, reject } from "lodash-es";

// --- types
import { type BasketProduct } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    BasketProduct & {
      open?: boolean;
      error: boolean;
    }
  >(),
  {
    open: false,
  }
);

const emits = defineEmits(["update:open"]);

// ---
const router = useRouter();
const { t } = useI18n();

const open = useVModel(props, "open", emits);

const { remove, updateQuantity, meta } = useBasketProduct(props.id);

const termSummary = computed(() => {
  return find(props.summary?.details, d => d.key === "term");
});

const filteredSummaryDetails = computed(() => {
  return reject(props.summary?.details, d =>
    ["term", "category"].includes(d.key)
  );
});

const doUpdateQuantity = debounce((value: number) => {
  updateQuantity(value);
}, 750);

const actions = computed(() => {
  return [
    {
      label: t("cart.actions.edit"),
      icon: "edit",
      class: "",
      handler: () => {
        router.push({
          name: "itemEdit",
          params: {
            bpid: props.id,
          },
        });
      },
    },
    {
      hide: false,
      label: t("cart.actions.remove"),
      icon: "remove",
      class:
        "text-destructive data-[highlighted]:bg-destructive-muted data-[highlighted]:text-destructive-muted-foreground",
      handler: () => {
        remove();
      },
    },
  ];
});

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});
</script>
