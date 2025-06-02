<template>
  <Card :class="styles.recommendation.skeleton.root" disabled>
    <div :class="styles.recommendation.skeleton.container">
      <!-- Image section -->
      <div
        v-if="props.productDetails?.imgUrl"
        :class="styles.recommendation.skeleton.image.root"
      >
        <Skeleton :class="styles.recommendation.skeleton.image.skeleton">
          Image
        </Skeleton>
      </div>

      <!-- Content section -->
      <div :class="styles.recommendation.skeleton.content.root">
        <div :class="styles.recommendation.skeleton.content.inner">
          <!-- Title and description -->
          <div :class="styles.recommendation.skeleton.content.title.root">
            <div
              :class="styles.recommendation.skeleton.content.title.container"
            >
              <Skeleton
                :class="styles.recommendation.skeleton.content.title.skeleton"
              >
                Product Name
              </Skeleton>

              <Skeleton
                :class="
                  styles.recommendation.skeleton.content.title.description
                "
              >
                Product description
              </Skeleton>
            </div>
          </div>

          <!-- Price section -->
          <div :class="styles.recommendation.skeleton.content.price.root">
            <!-- Price Intro: eg. 'From' or 'Was $X.XX' -->
            <div
              :class="styles.recommendation.skeleton.content.price.intro.root"
            >
              <Skeleton
                :class="
                  styles.recommendation.skeleton.content.price.intro.skeleton
                "
                >Only.........</Skeleton
              >
            </div>

            <div
              :class="styles.recommendation.skeleton.content.price.current.root"
            >
              <!-- Current Price -->
              <Skeleton
                :class="
                  styles.recommendation.skeleton.content.price.current.skeleton
                "
              >
                currentPrice
              </Skeleton>

              <!-- Term -->
              <template>
                <Skeleton
                  :class="
                    styles.recommendation.skeleton.content.price.current.term
                  "
                >
                  Monthly
                </Skeleton>
              </template>
            </div>

            <!-- Summary (If there is a billing cycle) -->
            <Skeleton
              :class="styles.recommendation.skeleton.content.price.summary"
            >
              Term Price
            </Skeleton>
          </div>
        </div>

        <!-- Button section -->
        <div :class="styles.recommendation.skeleton.content.button.root">
          <Skeleton
            :class="styles.recommendation.skeleton.content.button.skeleton"
            >Button</Skeleton
          >
        </div>
      </div>
    </div>
  </Card>
</template>

<script lang="ts" setup>
// --- internal
import config from "../recommendations.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import Card from "../../../components/content/Card.vue";
import { Skeleton } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { RecommendationItemProps } from "./types";

const props = defineProps<Partial<RecommendationItemProps>>();

const styles = useStyles(
  [
    "recommendation.skeleton",
    "recommendation.skeleton.image",
    "recommendation.skeleton.content",
    "recommendation.skeleton.content.title",
    "recommendation.skeleton.content.price",
    "recommendation.skeleton.content.price.intro",
    "recommendation.skeleton.content.price.current",
    "recommendation.skeleton.content.price.summary",
    "recommendation.skeleton.content.button",
  ],
  {},
  config
) as ComputedRef<{
  recommendation: {
    skeleton: {
      root: string;
      container: string;
      image: {
        root: string;
        skeleton: string;
      };
      content: {
        root: string;
        inner: string;
        title: {
          root: string;
          container: string;
          skeleton: string;
          description: string;
        };
        price: {
          root: string;
          intro: {
            root: string;
            skeleton: string;
          };
          current: {
            root: string;
            skeleton: string;
            term: string;
          };
          summary: string;
        };
        button: {
          root: string;
          skeleton: string;
        };
      };
    };
  };
}>;
</script>
