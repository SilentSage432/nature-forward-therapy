"use client";

import { useSession } from "next-auth/react";
import { useEditorPreview } from "@/components/admin/EditorPreviewContext";
import { SupportChatDrawer } from "@/components/admin/SupportChatDrawer";

/**
 * Mounts the floating Tech Desk on all /admin/* pages for EDITORS,
 * or when a DEVELOPER enables Preview Editor View.
 */
export function AdminSupportChatHost() {
  const { data: session, status } = useSession();
  const { previewEditor } = useEditorPreview();

  const isEditor = session?.user?.role === "EDITOR";
  const forcePasswordBlocked =
    isEditor && session?.user?.mustChangePassword === true;

  const show =
    status === "authenticated" &&
    !forcePasswordBlocked &&
    (isEditor || previewEditor);

  if (!show) return null;
  return <SupportChatDrawer />;
}
