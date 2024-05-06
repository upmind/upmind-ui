<template>
  <aside
    class="profile"
    :class="styles.profile.root"
    v-if="meta.isClient && !meta.isProcessing"
  >
    <figure :class="styles.profile.avatar">
      <img
        v-if="user.image_url"
        :src="user.image_url"
        alt="uploaded image thumbnail "
        :class="styles.profile.image"
      />
    </figure>
    <div :class="styles.profile.content">
      <span :class="styles.profile.meta">You're currently logged in as</span>
      <h4 :class="styles.profile.title">{{ user.fullname }}</h4>
      <h5 :class="styles.profile.text">{{ user.email }}</h5>

      <div :class="styles.profile.actions">
        <upw-button
          variant="ghost"
          size="sm"
          to="/"
          icon="profile"
          label="My Account"
        />
        <upw-button
          variant="ghost"
          size="sm"
          @click.prevent="logout"
          icon="logout"
          label="Logout"
        />
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { UpwButton } from "@upmind/upwind";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "Profile",
  components: { UpwButton },
  inheritAttrs: true,
  customOptions: {},
  emits: [],
  props: {},
  setup() {
    const session = useSession();

    const styles = useStyles(["profile"], session.meta, config);

    return {
      ...session,
      styles,
    };
  },
});
</script>
