import type { Recommendation, Benefit } from "@upmind-automation/headless";
import type { IconProps } from "@upmind-automation/upmind-ui";
import type { ActorRef } from "xstate";

export interface RecommendationsProps {
  items?: Recommendation[];
  disabled?: boolean;
  loading?: boolean;
  refreshing?: boolean;
  processing?: boolean;
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
  modelValue: ActorRef<any>;
}
