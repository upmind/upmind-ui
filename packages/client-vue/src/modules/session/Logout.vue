<template>
  <article>
    <ContentSection v-auto-animate>
      <BasketEmpty
        open
        modal
        skrim="light"
        :text="t('basket.empty.text')"
        :action="{
          as: 'a',
          color: 'primary',
          href: storefrontUrl,
          appendIcon: 'arrow-right',
          label: t('basket.empty.actions.continue'),
        }"
        :animated-icon="{
          icon: 'basket-empty',
          trigger: 'loop',
          primaryColor: 'base-foreground',
          secondaryColor: 'tertiary',
          size: '4xl',
        }"
      >
        <template #title>
          <i18n-t
            keypath="basket.empty.title"
            tag="span"
            for="basket.empty.basket"
            class="text-primary font-bold"
          >
            <mask class="bg-accent leading-relaxed">{{
              t("basket.empty.basket")
            }}</mask>
          </i18n-t>
        </template>
      </BasketEmpty>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";
// -- components
import ContentSection from "../../components/content/ContentSection.vue";
import BasketEmpty from "../basket/components/Empty.vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;
</script>
