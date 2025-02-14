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
                <SmartTitle i18n-key="product.title" size="2xl" />
              </template>

              <!-- TODO: add skeleton loader when meta.isLoading -->
              <Card class="!p-0">
                <ProductConfig
                  v-if="basketItem"
                  :item="basketItem"
                  :model-value="basketItem?.id"
                  :processing="meta?.isProcessing"
                  :no-footer="true"
                  as="div"
                  @resolve="doResolve"
                  @reject="doReject"
                />
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
                v-if="basketItem"
                :item="basketItem"
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
  useBasket,
  useRoutingEngine,
  useProductsPending,
  useProductConfig,
} from "@upmind-automation/headless-vue";

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import Card from "../../components/content/Card.vue";
import ProductConfig from "./components/config/Config.vue";
import Summary from "./components/Summary.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

// --- basket setup
const { back, next } = useRoutingEngine();
const { updateItem } = useBasket();
const { getPendingProduct } = useProductsPending();

// ---

async function doResolve() {
  if (!basketItem?.id) return;
  updateItem(basketItem.id).then(() => {
    next(basketItem);
  });
}

function doReject() {
  // NB: DO NOT remove/unset this item from the basket,
  // This is so that we can keep the item in the basket for later use,
  // especially if the user hits the back button on the browser
  back();
}

// ---
const basketItem = await getPendingProduct();
const { meta } = !isEmpty(basketItem)
  ? useProductConfig(basketItem as ActorRef<any, any>)
  : {
      meta: {
        isLoading: false,
        isProcessing: false,
        isComplete: false,
        isUnavailable: false,
      },
    };
</script>
