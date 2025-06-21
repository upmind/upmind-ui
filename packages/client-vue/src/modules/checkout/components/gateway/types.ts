import type { ButtonProps } from "@upmind-automation/upmind-ui";

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

  modelValue?: string;
  gatewayId?: string;

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
