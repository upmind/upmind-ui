<template>
  <div :class="styles.clientListings.root">
    <upw-skeleton-list
      :class="styles.clientListings.loading"
      v-if="meta.isLoading"
    />

    <template v-if="!meta.isLoading">
      <upw-textbox
        @input="filter($event?.currentTarget?.value)"
        placeholder="Filter by..."
        v-if="meta.canFilter && !processing"
      />

      <upm-card
        v-for="item in items"
        :key="item.id"
        :item="item"
        :selected="item.id === selected?.id"
        @select="select"
        :loading="processing"
        :hidden="meta.isEditing && item.id === selected?.id"
      />

      <upm-empty
        v-if="!items.length && !meta.isLoading"
        :icon="meta.icon"
        :message="meta.message"
      ></upm-empty>

      <upm-form :item="selected" v-if="meta.isEditing" :key="selected.id" />

      <div
        :class="styles.clientListings.actions"
        v-if="!meta.isEditing && !meta.isLoading && !processing"
      >
        <upw-button
          block
          icon="plus"
          label="Add new"
          variant="ghost"
          @click="add"
        />
      </div>
    </template>
  </div>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useClientEmails } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "../config.cva";

// --- components
import UpmCard from "./Card.vue";
import UpmForm from "./Form.vue";
import UpmEmpty from "./Empty.vue";
import { UpwTextbox, UpwButton, UpwSkeletonList } from "@upmind/upwind";

// --- utils
import { isEqual } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmEmails",
  components: {
    UpwTextbox,
    UpwButton,
    UpmCard,
    UpmForm,
    UpmEmpty,
    UpwSkeletonList,
  },
  emits: ["update:modelValue"],
  props: {
    modelValue: { type: String },
    processing: { type: Boolean },
  },
  setup() {
    const clientEmails = useClientEmails();

    const styles = useStyles(["clientListings"], clientEmails.meta, config);

    return {
      ...clientEmails,
      styles,
    };
  },
  mounted() {
    this.select(this.modelValue);
  },
  watch: {
    selected(newValue, oldValue) {
      if (
        !isEqual(newValue?.id, oldValue?.id) &&
        !isEqual(newValue?.id, this.modelValue)
      ) {
        this.$emit("update:modelValue", newValue);
      }
    },
  },
});
</script>
