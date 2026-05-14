export type HtmlSourceType = "sample" | "paste" | "upload";
export type HtmlShareStatus = "private" | "public";

export interface HtmlItem {
  id: string;
  title: string;
  summary: string;
  html: string;
  sourceType: HtmlSourceType;
  tags: string[];
  cover: string;
  createdAt: string;
  updatedAt: string;
  lastReadAt: string | null;
  readingProgress: number;
  favorite: boolean;
  shareStatus: HtmlShareStatus;
  shareSlug: string;
}

export type LibraryFilter = "all" | "unread" | "favorites";
