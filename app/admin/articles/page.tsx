import { ArticlesManager } from "@/components/admin/ArticlesManager";
import { getAllArticlesForAdmin } from "@/lib/articles";

export default async function AdminArticlesPage() {
  const articles = await getAllArticlesForAdmin();
  return <ArticlesManager articles={articles} />;
}
