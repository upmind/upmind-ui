import type { ButtonProps } from "@upmind-automation/ui";

export interface GatewayContentProps {
  item: {
    gateway: {
      type: number;
      gateway_provider: {
        code: string;
      };
    };
  };
  meta: {
    hasGateway: boolean;
    isProcessing: boolean;
  };
  basketMeta: {
    isReadyForCheckout: boolean;
    isProcessingDetails: boolean;
  };
  model: {
    gateway_id: string;
  };
  gateway: {
    id: string;
    gateway_provider: {
      code: string;
    };
    type: number;
  };
  // ---
  color?: ButtonProps["color"];
}

export interface GatewayTriggerProps {
  gateway: {
    name: string;
    gateway_provider: {
      code: string;
    };
  };
  gateway_id: string;
}
