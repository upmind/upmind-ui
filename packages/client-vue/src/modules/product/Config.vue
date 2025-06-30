<template>
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
                size="2xl"
                class="py-0.5 !text-3xl leading-tight [&:has(mask)]:leading-normal"
              />
            </template>

            <!-- TODO: add skeleton loader when meta.isLoading -->
            <Card class="!p-0">
              <ProductConfig
                v-if="item"
                :item="props.item"
                :model-value="props.item?.id"
                :processing="props.processing"
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
            :ui-config="{
              title: 'py-1.5'
            }"
          >
            <Summary :item="item" @resolve="doResolve" />
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
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";
import Summary from "./components/summary/Summary.vue";
import ProductConfig from "./components/config/Config.vue";
import Card from "../../components/content/Card.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";
// -----------------------------------------------------------------------------

const emit = defineEmits<{
  reject: [Object];
  resolve: [Object];
}>();

const props = defineProps<{
  item: any;
  processing?: boolean;
}>();

// ---
const { t, tm } = useI18n();

// ---

function doResolve(model: any) {
  emit("resolve", model);
}

function doReject(model: any) {
  emit("reject", model);
}
</script>
