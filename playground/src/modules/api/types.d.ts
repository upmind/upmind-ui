import type { Url } from "url";
import type { Ref } from "vue";
import type { StateMachine } from "xstate";

interface Request {
  url: string;
  init: RequestInit;
  useCache?: boolean;
}

interface UseApi {
  state: StateMachine.State<
    any,
    any,
    any,
    {
      value: any;
      context: {
        requests: Record<string, Request>;
        cache: Record<string, any>;
      };
    }
  >;
  send: (event: any) => void;
  count: Ref<number>;
  cache: Ref<Record<string, any>>;
  requests: Ref<Record<string, any>>;
  isIdle: Ref<boolean>;
  isActive: Ref<boolean>;
  isProcessing: Ref<boolean>;
}

interface UseApiFunctions {
  useUrl: (path: Url["path"]) => string;
  get: (
    { url, init }: { url: string; init?: RequestInit },
    useCache?: boolean,
    maxAge?: number
  ) => Promise<any>;
  post: ({
    url,
    data,
    init
  }: {
    url: string;
    data: any;
    init: RequestInit;
  }) => Promise<any>;
}

export type { UseApi, UseApiFunctions };
