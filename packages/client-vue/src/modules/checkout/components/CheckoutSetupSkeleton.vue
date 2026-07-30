<template>
  <!-- Mirrors ProductSetupForm: the provision schema is realistically a couple
       of string fields (label above the input), above the full-width Continue,
       so the load state matches the form it resolves into. -->
  <div :class="styles.checkout.setup.skeleton.root">
    <div :class="styles.checkout.setup.skeleton.field">
      <Skeleton :class="styles.checkout.setup.skeleton.label" />
      <Skeleton :class="styles.checkout.setup.skeleton.input" />
    </div>
    <div :class="styles.checkout.setup.skeleton.field">
      <Skeleton :class="styles.checkout.setup.skeleton.labelWide" />
      <Skeleton :class="styles.checkout.setup.skeleton.input" />
    </div>
    <Skeleton :class="styles.checkout.setup.skeleton.button" />
  </div>
</template>

<script lang="ts" setup>
import { Skeleton, useStyles } from "@upmind-automation/upmind-ui";
import config from "../checkout.config";

const styles = useStyles(["checkout.setup.skeleton"], {}, config);
</script>
