<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex items-center justify-between">
      <div class="flex w-full items-center gap-x-3">
        <span
          class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 p-0.5"
        >
          <img
            src="https://s3-alpha-sig.figma.com/img/1a7a/31d7/c34df83627525e5559e019a94ac1728c?Expires=1732492800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=Bj4QLIOwqvGJEbKrVCRQ8sBFec2nrQ-sSGodGBgrQxrWasbjEdzyF6-6NopEV3U9w6kYseLOjK7AT7lUXdDTaJ0Kx-Xv0f51T75K572070YJihMfJ0EAnVudG3MdSxUFPztgxoJ1Al0-XzoeRl4DW1UbXLUr4yZ6NhT2KZO76Iq59~vKQ1UpTIhZ1HxlBS6R-CvArDyL4wwz7gwIQt3zXpSh0HzfEsdGZO4ggXe2E0vtdcLxh-8fJAbaIo89O8WOULTMdrxAim9ivQPKFJ65TC6gI84WL5vXm0dL2Tq6m4TLns~ibDys64Mh-8LkE0Utavq0M7DyqwQoUTU~LH9olQ__"
            alt="Upmind"
            class="m-0"
          />
        </span>

        <div class="w-full">
          <div class="flex items-end justify-between">
            <div class="text-sm font-normal leading-[15px]">
              {{ product.category }}
            </div>
            <Badge
              v-if="pricing.meta?.discounted"
              class="-mt-2 mb-1 !px-[6px] !py-[2px] !text-[12px] !leading-[16.8px]"
              color="promotion"
              variant="tonal"
              size="sm"
              label="SAVE 10%"
            />
          </div>
          <div class="flex items-end justify-between">
            <router-link :to="editLink" class="no-underline">
              <div class="text-[22px] font-semibold leading-[30px]">
                {{ product.name }}
                <template v-if="props.product.serviceIdentifier">
                  ({{ product.serviceIdentifier }})
                </template>
              </div>
            </router-link>

            <div class="flex gap-x-[24px]">
              <NumberField
                class-field="!text-[16px]"
                :model-value="1"
                variant="minimal"
                size="sm"
                width="sm"
              />
              <div class="text-[22px] font-semibold leading-[30px]">
                {{ pricing.currentPrice }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-between text-sm italic leading-5 opacity-50">
      <span>{{
        t(`product.terms.${pricing.cycle}`, [pricing.currentPrice])
      }}</span>
      <span v-if="pricing.meta?.discounted" class="line-through">{{
        pricing.regularPrice
      }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";
// --- components
import { Badge } from "@upmind-automation/upwind";

// --- types
import {
  type BasketProductDetails,
  type BasketProductSummaryPrice,
} from "@upmind-automation/client-vue";

const props = defineProps<{
  id: string;
  product: BasketProductDetails;
  pricing: BasketProductSummaryPrice;
}>();

const { t } = useI18n();

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});
</script>
