import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { getArticleById } from "@/lib/articles";

type AdminEditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditArticlePage({
  params,
}: AdminEditArticlePageProps) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) {
    notFound();
  }
  return <ArticleEditor article={article} />;
}
