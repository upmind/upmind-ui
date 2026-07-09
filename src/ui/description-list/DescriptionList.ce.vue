<template>
  <dl
    :class="cn(styles.list.root, props.class)"
    v-bind="delegatedAttrs"
    v-auto-animate
  >
    <div
      v-for="(item, index) in items"
      :key="`dl-item-${index}`"
      :class="styles.list.item"
      v-bind="testAttrsItem(item, index)"
    >
      <dt :class="cn(styles.list.term)" v-bind="testAttrsDt(item, index)">
        <slot name="term" :item="item" :index="index">
          {{ item.term }}
        </slot>
      </dt>
      <dd
        :class="cn(styles.list.description)"
        v-bind="testAttrsDd(item, index)"
      >
        <slot name="description" :item="item" :index="index">
          {{ item.description }}
        </slot>
      </dd>
    </div>

    <slot />
  </dl>
</template>

<script lang="ts" setup>
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed } from "vue";
import config from "./descriptionList.config";
import { useStyles, cn, useTestAttrs, useForwardPropsTests } from "../../utils";
import type { DescriptionItem, DescriptionListProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<DescriptionListProps>(), {
  uiConfig: () => ({ descriptionList: [] }),
  class: ""
});

const meta = computed(() => ({
  //
}));

const styles = useStyles("list", meta, config, props.uiConfig ?? {});

const delegatedAttrs = useForwardPropsTests(
  {},
  {
    key: "description-list",
    dataAttrs: props.dataAttrs
  }
);

const testAttrsItem = (item: DescriptionItem, index: number) =>
  useTestAttrs({
    key: "description-list-item",
    value: index.toString(),
    dataAttrs: item.dataAttrs
  });

const testAttrsDd = (item: DescriptionItem, index: number) =>
  useTestAttrs({
    key: "description-list-description",
    value: index.toString()
  });

const testAttrsDt = (item: DescriptionItem, index: number) =>
  useTestAttrs({
    key: "description-list-term",
    value: index.toString()
  });

</script>
