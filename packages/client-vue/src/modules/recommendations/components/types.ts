import type {
  Recommendation,
  Benefit,
  ProductProps
} from "@upmind-automation/headless";
import type { IconProps } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export interface RecommendationsProps {
  items?: Recommendation[];
  disabled?: boolean;
  loading?: boolean;
  refreshing?: boolean;
  processing?: boolean;
  configureRoute: RouteLocationAsRelativeGeneric;
}

export interface RecommendationItemProps extends Recommendation {
  disabled?: boolean;
  benefits?: Benefit[];
}

export interface RecommendationBenefitProps extends Benefit {
  label: string;
  icon?: IconProps | string;
}

export interface RecommendationConfigurationProps {
  modelValue: ProductProps;
}
