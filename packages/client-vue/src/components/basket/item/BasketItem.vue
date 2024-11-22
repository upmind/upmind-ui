<template>
  <div class="bg-base flex flex-col gap-y-4 p-8 pb-7">
    <div class="flex flex-col gap-y-1">
      <div class="flex items-center justify-between">
        <div class="flex w-full items-center gap-x-3">
          <img
            src="https://s3-alpha-sig.figma.com/img/1a7a/31d7/c34df83627525e5559e019a94ac1728c?Expires=1732492800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=Bj4QLIOwqvGJEbKrVCRQ8sBFec2nrQ-sSGodGBgrQxrWasbjEdzyF6-6NopEV3U9w6kYseLOjK7AT7lUXdDTaJ0Kx-Xv0f51T75K572070YJihMfJ0EAnVudG3MdSxUFPztgxoJ1Al0-XzoeRl4DW1UbXLUr4yZ6NhT2KZO76Iq59~vKQ1UpTIhZ1HxlBS6R-CvArDyL4wwz7gwIQt3zXpSh0HzfEsdGZO4ggXe2E0vtdcLxh-8fJAbaIo89O8WOULTMdrxAim9ivQPKFJ65TC6gI84WL5vXm0dL2Tq6m4TLns~ibDys64Mh-8LkE0Utavq0M7DyqwQoUTU~LH9olQ__"
            alt="Upmind"
            class="my-0 h-12 w-12"
          />

          <div class="w-full">
            <div class="flex items-end justify-between">
              <div class="text-sm font-normal leading-[15px]">Software</div>
              <Badge
                class="px-[2px] py-[10px] text-[12px] leading-[16.8px]"
                color="promotion"
                variant="tonal"
                size="sm"
                label="SAVE 10%"
              />
            </div>
            <div class="flex items-end justify-between">
              <div class="text-[22px] font-semibold leading-[30px]">
                Upmind License (hosting.com)
              </div>

              <div class="flex gap-x-[24px]">
                <NumberField
                  class-field="!text-[16px]"
                  :model-value="1"
                  variant="minimal"
                  size="sm"
                  width="sm"
                />
                <div class="text-[22px] font-semibold leading-[30px]">
                  £45.00
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between text-sm italic leading-5 opacity-50">
        <span>£10 every month, incl. taxes</span>
        <span class="line-through">£50.00</span>
      </div>
    </div>

    <Separator />

    <div class="flex flex-col gap-y-1">
      <div class="text-sm font-normal leading-[15px]">Software Setup</div>

      <div class="flex items-end justify-between">
        <div class="text-[22px] font-semibold leading-[30px]">
          Arrangement Fee
        </div>

        <div>
          <div class="text-[22px] font-semibold leading-[30px]">£44.99</div>
        </div>
      </div>

      <div class="flex justify-between text-sm italic leading-5 opacity-50">
        <span>One time payment, incl. taxes</span>
        <span class="line-through">£49.99</span>
      </div>
    </div>

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
