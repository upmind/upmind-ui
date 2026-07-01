<template>
  <div class="flex flex-col gap-2">
    <dl class="flex flex-col gap-1 lg:gap-0">
      <DetailsGroup
        v-for="(group, index) in groupedDetails"
        :key="'details-group-' + index"
        :id="id"
        :category="getCategory(group)"
        :items="group"
      />
    </dl>

    <Link
      v-bind="props.editRoute"
      size="sm"
      color="muted"
      :label="t('text.edit_configuration')"
      class="self-start"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Link } from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";
import DetailsGroup from "./components/DetailsGroup.vue";
import { groupBy, first } from "lodash-es";
import type { BasketProductConfigDetailsProps } from "./types";

defineOptions({
  inheritAttrs: false
});

const { t } = useI18n();

const props = defineProps<BasketProductConfigDetailsProps>();

const _styles = useStyles(["product.configDetails"], props, config);

function getCategory(group: BasketProductConfigDetailsProps["details"]) {
  const groupCategory = first(group)?.category;

  if (groupCategory === props.summary.category) {
    return "";
  }

  return groupCategory;
}

const groupedDetails = computed(
  (): Record<string, BasketProductConfigDetailsProps["details"]> => {
    return groupBy(props.details, "category");
  }
);
</script>
