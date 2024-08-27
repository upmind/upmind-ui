<template>
  <Drawer>
    <DrawerTrigger>
      <slot name="trigger" />
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle v-if="hasTitle">{{ title }}</DrawerTitle>
        <DrawerDescription v-if="hasDescription">
          {{ description }}
        </DrawerDescription>
      </DrawerHeader>

      <slot name="content" />
      <slot />

      <DrawerFooter>
        <slot name="footer" />
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { isEmpty } from "lodash-es";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from ".";
import { Button } from "../button";

export default defineComponent({
  components: {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    Button,
  },

  props: {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    // const styles = useStyles(
    //   "dialog",
    //   toRefs(props),
    //   config,
    //   props.upwindConfig
    // );

    const hasTitle = computed(() => {
      return !isEmpty(props.title);
    });
    const hasDescription = computed(() => {
      return !isEmpty(props.description);
    });
    const hasHeader = computed(() => {
      return hasTitle.value || hasDescription.value;
    });

    return {
      props,
      hasTitle,
      hasDescription,
      hasHeader,
    };
  },
});
</script>
