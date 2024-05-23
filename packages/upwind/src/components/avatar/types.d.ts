import type { Icon } from "../icon/types";

export interface IconProps {
  avatar: string | Icon | Image;
}

export interface Image {
  src?: string;
  caption?: string;
}
