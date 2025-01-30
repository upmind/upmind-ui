<template>
  <UpmCard
    class="relative !py-0"
    :class="[
      !meta.isProcessing && (meta.hasErrors || props.error)
        ? 'ring-2 ring-invalid !ring-offset-2'
        : 'ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 group-focus-within:ring-0 group-focus-within:ring-offset-0',
    ]"
  >
    <DropdownMenu :items="actions" size="sm" class="absolute right-0 top-0" />

    <div
      class="items-stretch justify-between py-6 leading-none md:flex md:py-8"
    >
      <div
        v-if="meta?.isProcessing || meta?.isLoading"
        class="absolute inset-0 z-10 flex h-full w-full items-center justify-center bg-base bg-opacity-75"
      >
        <Spinner size="md" />
      </div>

      <div class="items-start md:flex md:space-x-10">
        <div class="flex flex-col">
          <div v-if="props.summary.discounted" class="mb-1 w-full">
            <Badge
              color="promotion"
              :label="t('product.promotion')"
              variant="tonal"
              size="xs"
            />
          </div>

          <div class="mt-2 text-sm leading-snug text-emphasis-medium md:mt-1">
            {{ props.product.category }}
          </div>
          <router-link
            :to="editLink"
            class="h-auto p-0 text-lg font-medium text-primary underline hover:bg-transparent hover:opacity-80"
          >
            <span class="font-semibold">{{ props.product.name }}</span>
            <span v-if="props.product.serviceIdentifier">
              ({{ props.product.serviceIdentifier }})
            </span>
          </router-link>

          <div class="mt-2 text-sm leading-snug text-emphasis-medium md:mt-1">
            {{ props.product.description }}
          </div>
          <div class="mt-2 text-sm leading-snug text-emphasis-medium md:mt-1">
            {{ props.product.excerpt }}
          </div>

          <div class="mt-7 flex flex-col text-sm">
            <CartItemConfigDetails
              v-model:open="open"
              :items="filteredSummaryDetails"
              label="Configuration"
            >
              <template #append>
                <Badge
                  v-if="!meta.isLoading && !meta.isProcessing && meta.hasErrors"
                  color="error"
                  size="xs"
                  variant="tonal"
                  class="mx-1"
                >
                  {{ t("cart.item.invalid") }}
                </Badge>
              </template>
            </CartItemConfigDetails>
          </div>
        </div>
      </div>

      <div
        class="mt-8 flex items-end justify-between sm:mt-6 md:mt-0 md:flex-col"
      >
        <div
          class="flex flex-col pr-6 md:pr-0 md:text-right"
          v-for="(price, index) in props.summary.pricing"
          :key="`price-${index}`"
        >
          <span
            v-if="price.meta.discounted"
            class="mb-1 block text-xs text-emphasis-medium line-through"
          >
            {{ price.regularPrice }}
          </span>
          <span
            class="block text-lg font-semibold"
            :class="{ 'opacity-0': meta.isLoading || meta.isCalculating }"
          >
            {{ price.meta.free ? t("product.free") : price.currentPrice }}
          </span>
          <span
            v-if="termSummary"
            class="mt-1 block text-sm leading-snug text-emphasis-medium"
          >
            {{ t(`product.terms.${termSummary?.cycle}`, termSummary?.name) }}
          </span>
        </div>

        <div
          class="flex items-center space-x-4"
          v-if="props.product.quantifiable"
        >
          <NumberField
            :model-value="props.quantity"
            @update:model-value="doUpdateQuantity"
            :min="props.product.min"
            :max="props.product.max"
            :step="props.product.step"
            width="md"
          />
        </div>
      </div>
    </div>
  </UpmCard>
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
} from "@upmind-automation/upmind-ui";
import CartItemConfigDetails from "./CartItemConfigDetails.vue";

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
          name: "product.edit",
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
    name: "product.edit",
    params: {
      bpid: props.id,
    },
  };
});
</script>
