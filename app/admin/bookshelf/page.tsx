import { BookshelfManager } from "@/components/admin/BookshelfManager";
import { getAllBookshelfItemsForAdmin } from "@/lib/bookshelf";

export default async function AdminBookshelfPage() {
  const items = await getAllBookshelfItemsForAdmin();
  return <BookshelfManager items={items} />;
}
