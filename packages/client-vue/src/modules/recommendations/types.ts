import type { RouteLocationAsRelativeGeneric } from "vue-router";

export enum RECOMMENDATIONS_TEMPLATE {
  FULL = "full"
}

export type RecommendationsPageProps = {
  configureRoute: RouteLocationAsRelativeGeneric;
  template?: RECOMMENDATIONS_TEMPLATE;
};
