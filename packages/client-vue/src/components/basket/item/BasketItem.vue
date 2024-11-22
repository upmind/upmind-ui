<template>
  <div class="bg-base flex flex-col gap-y-4 p-8 pb-7">
    <UpmBasketItemSummary
      v-for="pricing in summary.pricing"
      :key="pricing.key"
      :id="props.id"
      :product="props.product"
      :pricing="pricing"
    />

    <UpmBasketConfigurationDetails v-if="open" :details="summary.details" />

    <div class="flex items-baseline justify-between pt-[16px]">
      <!-- TODO: We shouldn't need to manually apply these classses, but is tricky with the current cva implementation -->
      <Button
        label="Show details"
        variant="link"
        size="sm"
        class="h-auto !p-0 leading-none"
        @click="open = !open"
      >
        <template #append>
          <Icon
            icon="arrow-down"
            size="xs"
            class="-ml-1 mt-0.5 transition-all duration-300"
            :class="{ 'rotate-180': open }"
          />
        </template>
      </Button>

      <div class="text-primary flex items-end space-x-2">
        <!-- TODO: xs too big, 2xs too small -->
        <Icon icon="pencil" class="h-5 w-5" />
        <Icon icon="bin" class="h-5 w-5" />
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
  Button,
} from "@upmind-automation/upwind";
import UpmBasketConfigurationDetails from "./BasketItemConfigurationDetails.vue";
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
