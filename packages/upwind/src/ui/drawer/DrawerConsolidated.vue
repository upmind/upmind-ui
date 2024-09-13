<template>
  <Drawer>
    <DrawerTrigger>
      <slot name="trigger" />
    </DrawerTrigger>
    <DrawerContent>
      <div class="mx-auto w-full" :class="maxWidth">
        <DrawerHeader>
          <DrawerTitle v-if="hasTitle">{{ title }}</DrawerTitle>
          <DrawerDescription v-if="hasDescription">
            {{ description }}
          </DrawerDescription>
        </DrawerHeader>

        <slot />

        <DrawerFooter>
          <slot name="footer" />

          <DrawerClose>
            <slot name="close" />
          </DrawerClose>
        </DrawerFooter>
      </div>
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
  },

  props: {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    maxWidth: {
      type: String,
      default: "max-w-sm",
    },
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
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
