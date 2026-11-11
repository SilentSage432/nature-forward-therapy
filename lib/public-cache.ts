import { revalidatePath, revalidateTag } from "next/cache";
import {
  articleTag,
  CACHE_TAGS,
} from "@/lib/public-cache-shared";

export {
  PUBLIC_REVALIDATE_SECONDS,
  MAINTENANCE_REVALIDATE_SECONDS,
  CACHE_TAGS,
  MAINTENANCE_PREVIEW_COOKIE,
  articleTag,
  type CacheTag,
} from "@/lib/public-cache-shared";

/** Immediate expiration — next read is a blocking cache miss (CMS / maintenance). */
const EXPIRE_NOW = { expire: 0 } as const;

function expireTag(tag: string) {
  revalidateTag(tag, EXPIRE_NOW);
}

/** Invalidate shared public data tags + common public paths after CMS writes. */
export function revalidatePublicSurfaces(options?: {
  articleSlug?: string;
  includeHome?: boolean;
  includeArticles?: boolean;
  includeBookshelf?: boolean;
}) {
  const includeHome = options?.includeHome ?? true;
  const includeArticles = options?.includeArticles ?? true;
  const includeBookshelf = options?.includeBookshelf ?? true;

  expireTag(CACHE_TAGS.siteContent);
  expireTag(CACHE_TAGS.announcements);
  expireTag(CACHE_TAGS.articles);
  expireTag(CACHE_TAGS.bookshelf);

  if (includeHome) revalidatePath("/");
  if (includeArticles) revalidatePath("/articles");
  if (includeBookshelf) revalidatePath("/bookshelf");

  if (options?.articleSlug) {
    expireTag(articleTag(options.articleSlug));
    revalidatePath(`/articles/${options.articleSlug}`);
  }
}

export function revalidateMaintenanceSurfaces() {
  expireTag(CACHE_TAGS.maintenance);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin", "layout");
  revalidatePath("/articles", "layout");
  revalidatePath("/bookshelf", "layout");
  revalidatePath("/maintenance", "page");
}
