import type { IconProps } from "../../../components/icon";
import type {
  Recommendation,
  Benefit,
  ProductProps
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export type RecommendationsProps = {
  items?: Recommendation[];
  disabled?: boolean;
  loading?: boolean;
  refreshing?: boolean;
  processing?: boolean;
  configureRoute: RouteLocationAsRelativeGeneric;
};

export type RecommendationItemProps = Recommendation & {
  disabled?: boolean;
  benefits?: Benefit[];
};

export type RecommendationBenefitProps = Benefit & {
  label: string;
  icon?: IconProps | string;
};

export type RecommendationConfigurationProps = {
  modelValue: ProductProps;
};
