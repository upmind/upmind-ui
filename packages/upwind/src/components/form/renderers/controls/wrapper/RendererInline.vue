<template>
  <div v-if="meta.isVisible" :class="styles.inputControl.root">
    <!-- wrapper -->
    <div :class="styles.inputControl.inline">
      <slot
        name="prepend"
        v-bind="{
          meta,
          styles: styles.inputControl,
          prependIcon,
          prependAvatar,
          prefix,
        }"
      >
        <span class="prefix" :class="styles.inputControl.prefix" v-if="prefix">
          {{ prefix }}
        </span>

        <upw-icon
          v-if="prependAvatar"
          class="avatar"
          :class="styles.inputControl.avatar"
          :icon="prependAvatar"
        />

        <upw-icon
          v-if="prependIcon"
          :class="styles.inputControl.icon"
          :icon="prependIcon"
        />
      </slot>

      <slot v-bind="{ meta, styles: styles.inputControl }"></slot>

      <!-- label -->
      <upw-label
        :id="id"
        :text="label"
        :requiredText="requiredText"
        :optionalText="optionalText"
        :hideRequired="hideRequired"
        :hideStatus="hideStatus"
        :required="meta.isRequired"
        :dirty="meta.isDirty"
        :invalid="meta.isInvalid"
        :disabled="meta.isDisabled"
        :size="size"
        :upwindConfig="[config, upwindConfig]"
      />

      <slot
        name="append"
        v-bind="{
          meta,
          styles: styles.inputControl,
          appendIcon,
          appendAvatar,
          suffix,
        }"
      >
        <upw-icon
          v-if="appendIcon"
          :class="styles.inputControl.icon"
          :icon="appendIcon"
        />

        <upw-icon
          v-if="appendAvatar"
          class="avatar"
          :class="styles.inputControl.avatar"
          :icon="appendAvatar"
        />

        <span class="suffix" :class="styles.inputControl.suffix" v-if="suffix">
          {{ suffix }}
        </span>
      </slot>
    </div>

    <!-- feedback -->
    <div class="feedback" :class="styles.feedback.root" v-if="!hideFeedback">
      <upw-icon
        key="icon"
        :class="styles.feedback.icon"
        icon="information-circle"
      />
      <span key="details">{{ errors || description }}</span>
    </div>
  </div>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";

// --- components
import Base from "./Renderer.vue";

export default defineComponent({
  name: "ControlWrapper",
  extends: Base,
  setup(props, ctx) {
    return {
      ...Base.setup(props, ctx),
    };
  },
});
</script>
