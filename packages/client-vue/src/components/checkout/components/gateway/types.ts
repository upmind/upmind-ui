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
  color?: string;
}

export interface GatewayTriggerProps {
  gateway: {
    name: string;
  };
  gateway_id: string;
}
