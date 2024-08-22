import type { Icon } from "../icon/types";

export interface AvatarProps {
  avatar: string | Icon | Image;
}

export interface Image {
  src?: string;
  caption?: string;
  forceCaption?: boolean;
}
