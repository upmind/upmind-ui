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
      <div class="label" :class="styles.inputControlLabel.root">
        <label v-if="label" :for="id" :class="styles.inputControlLabel.text">
          {{ label }}
        </label>

        <span
          class="status"
          :class="styles.inputControlLabel.status"
          v-if="!hideStatus"
        >
          <span
            v-if="meta.showAsRequired"
            :class="styles.inputControlLabel.required"
          >
            {{ requiredText }}
          </span>

          <span
            v-else-if="meta.showAsOptional"
            :class="styles.inputControlLabel.optional"
          >
            {{ optionalText }}
          </span>

          <upw-icon
            v-if="meta.isInvalid"
            :class="styles.inputControlLabel.icon"
            icon="alert-circle"
          />
          <upw-icon
            v-else-if="meta.isValid"
            :class="styles.inputControlLabel.icon"
            icon="check-circle"
          />
        </span>
      </div>

      <upw-icon
        v-if="meta.isInvalid"
        :class="styles.inputControl.status"
        icon="alert-circle"
      />

      <upw-icon
        v-else-if="meta.isValid"
        :class="styles.inputControl.status"
        icon="check-circle"
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
    <div class="feedback" :class="styles.inputControl.feedback">
      <upw-icon
        key="icon"
        :class="styles.inputControl.feedbackIcon"
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
