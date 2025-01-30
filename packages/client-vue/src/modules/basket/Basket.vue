<template>
  <article v-auto-animate>
    <div class="flex items-center justify-center">
      <section
        class="relative mx-auto flex w-full flex-wrap items-start justify-between gap-8"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-8">
          <ContentSection>
            <template #title>
              <i18n-t
                keypath="cart.title"
                tag="span"
                for="cart.basket"
                class="text-primary font-bold"
              >
                <mask class="bg-quarternary leading-relaxed">{{
                  t("cart.basket")
                }}</mask>
              </i18n-t>
            </template>
            <template #option>
              <div class="flex items-center gap-6">
                <Button
                  variant="link"
                  color="primary"
                  size="sm"
                  class="!hover:opacity-100 text-emphasis-medium hover:text-base-foreground -mt-1 hidden pr-3 font-medium md:block"
                  :disabled="meta.isLoading || !meta.isAvailable"
                  @click="open = !open"
                >
                  <template v-slot:prepend>
                    <Icon icon="configuration" class="-mt-0.5 mr-2 size-3" />
                  </template>

                  <span>{{ t("cart.expand", open ? 0 : 1) }}</span>
                </Button>
              </div>
            </template>

            <BasketProductCards
              :open="open"
              @update:open="open = $event"
              class="text-primary"
            />
          </ContentSection>

          <!-- Custom Fields  -->
          <ContentSection>
            <template #title>
              <i18n-t
                keypath="customFields.title.text"
                tag="span"
                class="text-primary font-bold"
              >
                <template v-slot:mask>
                  <mask class="bg-accent leading-relaxed">{{
                    t("customFields.title.mask")
                  }}</mask>
                </template>
              </i18n-t>
            </template>
            <Card>
              <Form
                v-if="!fieldsMeta.isLoading"
                :additional-errors="fieldsErrors?.data"
                :model-value="fieldsModel"
                :processing="fieldsMeta.isProcessing"
                :schema="fieldsSchema"
                :uischema="fieldsUischema"
                @reject="fieldsClear"
                @resolve="fieldsUpdate"
                @update:modelValue="fieldsUpdate"
                no-actions
                autosave
              />

              <VCustomFieldsSkeleton v-else />
            </Card>
          </ContentSection>
        </div>

        <aside
          class="flex w-full flex-col items-start gap-4 sm:sticky sm:top-1 xl:max-w-md"
        >
          <ContentSection :title="t('cart.summary.title')" classTitle="py-1.5">
            <Card>
              <BasketSummary no-actions />
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
                color="secondary"
                :loading="meta.isProcessing || meta.isLoading"
                @click="navigate()"
                :label="t('cart.summary.proceed')"
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
            :description="t('cart.requiresAction.summary.description')"
          >
            <template #title>
              <i18n-t
                keypath="cart.requiresAction.summary.title"
                tag="span"
                :plural="productsInvalid.length"
              />
            </template>
            <ol class="list-disc text-left">
              <li v-for="basketItem in productsInvalid" :key="basketItem.id">
                <router-link
                  class="text-inherit"
                  :to="{
                    name: 'product.edit',
                    params: { bpid: basketItem.id },
                  }"
                >
                  <span>{{ basketItem?.product?.name }}</span>
                  <span v-if="basketItem?.product?.serviceIdentifier">
                    ({{ basketItem?.product?.serviceIdentifier }})
                  </span>
                </router-link>
              </li>
            </ol>
          </Alert>
        </aside>
      </section>
    </div>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket, useBasketFields } from "@upmind-automation/client-vue";

// --- components
import BasketSummary from "./components/Summary.vue";
import BasketProductCards from "./components/product/BasketProductCards.vue";

import ContentSection from "../../components/content/ContentSection.vue";
import Card from "../../components/content/Card.vue";
import Form from "../../components/form/Form.vue";

import { Button, Icon, Alert } from "@upmind-automation/upmind-ui";
import VCustomFieldsSkeleton from "./components/CustomFieldsSkeleton.vue";

// --- utils

// --- types

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, productsInvalid } = useBasket();

const {
  errors: fieldsErrors,
  meta: fieldsMeta,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate,
} = useBasketFields();

const open = ref(false);
</script>
