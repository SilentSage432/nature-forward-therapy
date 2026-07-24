import { notFound } from "next/navigation";
import { BookshelfEditor } from "@/components/admin/BookshelfEditor";
import { getBookshelfItemById } from "@/lib/bookshelf";

type AdminEditBookshelfPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditBookshelfPage({
  params,
}: AdminEditBookshelfPageProps) {
  const { id } = await params;
  const item = await getBookshelfItemById(id);
  if (!item) {
    notFound();
  }
  return <BookshelfEditor item={item} />;
}
