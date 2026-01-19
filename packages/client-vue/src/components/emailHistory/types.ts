import type {
  ReceivedEmailsSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";

export interface ReceivedEmailsProps {
  categoryId?: string;
  sort?: ReceivedEmailsSortProps;
  query?: string;
}

export interface ReceivedEmailsSortProps {
  property?: ReceivedEmailsSortableProperties;
  direction?: RequestSortDirection;
}
