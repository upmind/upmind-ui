import type { Recommendation, Benefit } from "@upmind-automation/headless-vue";
import type { IconProps } from "@upmind-automation/upmind-ui";

export interface RecommendationsProps {
  disabled?: boolean;
}

export interface RecommendationItemProps extends Recommendation {
  disabled?: boolean;
  benefits?: Benefit[];
}

export interface RecommendationBenefitProps extends Benefit {
  label: string;
  icon?: IconProps;
}
