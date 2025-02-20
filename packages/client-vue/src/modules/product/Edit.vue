<template>
  <article v-auto-animate>
    <ContentSection v-auto-animate>
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
            <ContentSection>
              <template #title>
                <SmartTitle
                  i18n-key="product.title"
                  class="text-3xl leading-relaxed"
                />
              </template>

              <!-- TODO: add skeleton loader when meta.isLoading -->
              <Card class="!p-0">
                <ProductConfig
                  v-if="basketProduct && !meta?.isLoading"
                  :item="basketProduct"
                  :model-value="basketProduct?.id"
                  :processing="meta?.isProcessing"
                  :no-footer="true"
                  as="div"
                  @resolve="doResolve"
                  @reject="doReject"
                />

                <ConfigSkeleton v-else />
              </Card>
            </ContentSection>
          </section>

          <header
            class="flex w-full flex-col items-start gap-4 sm:sticky sm:top-1 xl:max-w-md"
          >
            <ContentSection
              :title="t('product.summary.title')"
              classTitle="py-1.5"
            >
              <Summary
                v-if="basketProduct"
                :item="basketProduct"
                @resolve="doResolve"
              />
            </ContentSection>
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
    </ContentSection>
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
} from "@upmind-automation/headless-vue";

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";
import Summary from "./components/Summary.vue";
import ProductConfig from "./components/config/Config.vue";
import Card from "../../components/content/Card.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";

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
>
