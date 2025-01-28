import type { Recommendation, Benefit } from "@upmind-automation/headless";
import type { IconProps } from "@upmind-automation/upmind-ui";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

export interface RecommendationsProps {
  disabled?: boolean;
}

export interface RecommendationItemProps extends Recommendation {
  disabled?: boolean;
  badge?: BadgeProps;
  benefits?: Benefit[];
}

export interface RecommendationBenefitProps {
  label: string;
  icon: IconProps;
}
