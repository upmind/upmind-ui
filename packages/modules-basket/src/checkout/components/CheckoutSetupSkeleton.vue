<template>
  <!-- Mirrors ProductSetupForm: the provision schema is realistically a couple
       of string fields (label above the input), above the full-width Continue,
       so the load state matches the form it resolves into. -->
  <div :class="setupSkeletonRootVariants()">
    <div :class="setupSkeletonFieldVariants()">
      <Skeleton :class="setupSkeletonLabelVariants()" />
      <Skeleton :class="setupSkeletonInputVariants()" />
    </div>
    <div :class="setupSkeletonFieldVariants()">
      <Skeleton :class="setupSkeletonLabelWideVariants()" />
      <Skeleton :class="setupSkeletonInputVariants()" />
    </div>
    <Skeleton :class="setupSkeletonButtonVariants()" />
  </div>
</template>

<script lang="ts" setup>
import { Skeleton } from "@upmind/ui";
import {
  setupSkeletonButtonVariants,
  setupSkeletonFieldVariants,
  setupSkeletonInputVariants,
  setupSkeletonLabelVariants,
  setupSkeletonLabelWideVariants,
  setupSkeletonRootVariants
} from "../variants";
</script>
