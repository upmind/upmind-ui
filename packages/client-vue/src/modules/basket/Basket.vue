<template>
  <Layout>
    <template #navigation>
      <Back v-bind="route" i18n-key="basket.back" />
    </template>

    <div class="flex items-center justify-center" v-auto-animate>
      <section
        class="relative mx-auto flex w-full flex-wrap items-start justify-between gap-8"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-8">
          <ContentSection>
            <template #title>
              <SmartTitle i18n-key="basket.title" size="2xl" />
            </template>
            <template #option>
              <div class="flex items-center gap-6">
                <Link
                  :label="t('basket.expand', open ? 0 : 1)"
                  :disabled="meta.isLoading || !meta.isAvailable"
                  @click="open = !open"
                  variant="muted"
                  size="sm"
                  class="space-x-2"
                >
                  <template v-slot:prepend>
                    <Icon icon="configuration" class="size-3" />
                  </template>
                </Link>
              </div>
            </template>

            <ProductCards :open="open" @update:open="open = $event" />
          </ContentSection>

          <!-- Custom Fields  -->
          <ContentSection>
            <template #title>
              <SmartTitle i18n-key="customFields.title" size="2xl" />
            </template>
            <Card>
              <Form
                v-if="!fieldsMeta.isLoading"
                :additional-errors="fieldsErrors?.data"
                :model-value="fieldsModel"
                :schema="fieldsSchema"
                :uischema="fieldsUischema"
                @reject="fieldsClear"
                @resolve="fieldsUpdate"
                @update:modelValue="fieldsUpdate"
                no-actions
                autosave
              />

              <template v-else>
                <Skeleton class="-mt-1 w-24 text-sm leading-normal"
                  >Title</Skeleton
                >
                <Skeleton class="mt-1 h-20 w-full" />
              </template>
            </Card>
          </ContentSection>
        </div>

        <aside
          class="flex w-full flex-col items-start gap-4 sm:sticky sm:top-1 xl:max-w-md"
        >
          <ContentSection :title="t('basket.summary.title')">
            <Card>
              <Summary />
            </Card>
          </ContentSection>

          <footer class="w-full">
            <router-link to="/checkout" custom v-slot="{ navigate }">
              <Button
                :disabled="
                  !fieldsMeta.isComplete ||
                  meta.isProcessing ||
                  meta.isLoading ||
                  !meta.hasProducts ||
                  meta.hasInvalidProducts
                "
                block
                color="primary"
                :loading="meta.isProcessing || meta.isLoading"
                @click="navigate()"
                :label="t('basket.summary.proceed')"
              >
                <template #prepend>
                  <Icon icon="cart" size="2xs" class="-mt-0.5 mr-2" />
                </template>
              </Button>
            </router-link>
          </footer>

          <Alert
            v-if="meta.hasInvalidProducts"
            color="error"
            icon="alert-triangle"
            :description="t('basket.requiresAction.summary.description')"
          >
            <template #title>
              <i18n-t
                keypath="basket.requiresAction.summary.title"
                tag="span"
                :plural="productsInvalid.length"
                scope="global"
              />
            </template>
            <ol class="list-disc text-left">
              <li
                v-for="basketItem in productsInvalid"
                :key="basketItem.id"
                class="marker:text-inherit"
              >
                <router-link
                  class="text-inherit"
                  :to="{
                    name: 'product.edit',
                    params: { bpid: basketItem.id }
                  }"
                >
                  <span>{{ basketItem?.productDetails?.title }}</span>
                </router-link>
              </li>
            </ol>
          </Alert>
        </aside>
      </section>
    </div>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useBasketFields,
  useDataLayer,
  useBrand,
  ROUTE
} from "@upmind-automation/headless";

// --- components
import {
  Layout,
  Card,
  Button,
  Icon,
  Alert,
  Link,
  Skeleton
} from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import Summary from "./components/Summary.vue";
import ProductCards from "./product/BasketProductCards.vue";
import Form from "../../components/form/Form.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";
import Back from "../../components/navigation/Back.vue";
import { isEmpty, omitBy } from "lodash-es";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, productsInvalid, isReady } = useBasket();
const { storefrontUrl, hasStorefront } = useBrand();

const {
  errors: fieldsErrors,
  meta: fieldsMeta,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate
} = useBasketFields();

const open = ref(false);

await isReady();

const route = computed(() => {
  return omitBy(
    {
      to: !hasStorefront.value ? { name: ROUTE.CATALOGUE } : undefined,
      href: hasStorefront.value ? storefrontUrl.value : undefined
    },
    isEmpty
  );
});

const { dataLayer } = useDataLayer();
dataLayer({ event: "view_cart" }).withEcommerce().push();
</script>
