<template>
  <article v-auto-animate>
    <UpmContentSection v-auto-animate>
      <form v-auto-animate @submit.prevent @reset.prevent>
        <Button
          type="reset"
          class="relative -top-4 md:-top-6"
          size="sm"
          variant="tonal"
          :label="t('navigation.back')"
          @click.prevent="doReject"
        >
          <template #prepend><Icon icon="arrow-left" size="2xs" /></template>
        </Button>

        <div
          class="relative mx-auto flex w-full flex-wrap items-start justify-between gap-8"
        >
          <section class="flex min-w-0 flex-1 flex-col gap-16">
            <UpmContentSection>
              <template #title>
                <i18n-t
                  keypath="product.title"
                  for="product.title"
                  class="text-primary font-bold"
                >
                  <mask class="bg-quarternary leading-relaxed">{{
                    t("product.configuration")
                  }}</mask>
                </i18n-t>
              </template>

              <!-- TODO: add skeleton loader when meta.isLoading -->
              <UpmCard class="!p-0">
                <UpmProductConfig
                  v-if="basketProduct"
                  :item="basketProduct"
                  :model-value="basketProduct?.id"
                  :processing="meta?.isProcessing"
                  :no-footer="true"
                  as="div"
                  @resolve="doResolve"
                  @reject="doReject"
                />
              </UpmCard>
            </UpmContentSection>
          </section>

          <header
            class="flex w-full flex-col items-start gap-4 sm:sticky sm:top-1 xl:max-w-md"
          >
            <UpmContentSection
              :title="t('product.summary.title')"
              classTitle="py-1.5"
            >
              <VSummary
                v-if="basketProduct"
                :item="basketProduct"
                @resolve="doResolve"
              />
            </UpmContentSection>
          </header>
        </div>

        <!-- small print -->
        <footer
          class="text-emphasis-medium mt-6 flex flex-col space-y-2 px-6 text-xs md:space-y-0 md:px-0"
        >
          <div
            v-for="(term, index) in tm('product.smallprint')"
            :key="index"
            class="leading-snug"
          >
            {{ term }}
          </div>
        </footer>
      </form>
    </UpmContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useRoutingEngine,
  useProductsPending,
  useBasketProductConfig,
  UpmProductConfig,
  UpmCard,
  UpmContentSection,
} from "@upmind-automation/client-vue";

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";
import VSummary from "./product/Summary.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

// --- basket setup
const { back, next } = useRoutingEngine();
const { getBasketProduct } = useProductsPending();

// ---

async function doResolve() {
  if (!basketProduct?.id) return;
  update().then(() => next(basketProduct));
}

function doReject() {
  stop();
  back();
}

// ---
const basketItem = await getBasketProduct();
const {
  meta,
  stop,
  update,
  service: basketProduct,
} = !isEmpty(basketItem)
  ? useBasketProductConfig(basketItem.id)
  : {
      service: undefined,
      meta: {
        isLoading: false,
        isProcessing: false,
        isComplete: false,
        isUnavailable: false,
      },
      stop: back,
      update: next,
    };
</script>
