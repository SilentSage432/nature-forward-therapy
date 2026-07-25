"use client";

import { DeveloperDashboard } from "@/components/admin/DeveloperDashboard";
import { EditorDashboard } from "@/components/admin/EditorDashboard";
import { useEditorPreview } from "@/components/admin/EditorPreviewContext";
import type {
  ActivityItem,
  ExternalLinkCheck,
} from "@/lib/admin-ops";
import type { SystemHealth } from "@/lib/system-health";
import type { SiteContent } from "@/lib/types";

type DeveloperPortalHomeProps = {
  health: SystemHealth;
  activity: ActivityItem[];
  externalLinks: ExternalLinkCheck[];
  editorFirstName: string;
  content: SiteContent;
};

export function DeveloperPortalHome({
  health,
  activity,
  externalLinks,
  editorFirstName,
  content,
}: DeveloperPortalHomeProps) {
  const { previewEditor, setPreviewEditor } = useEditorPreview();

  if (previewEditor) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gold">
            Viewing Practice Portal in Editor Preview Mode
          </p>
          <button
            type="button"
            onClick={() => setPreviewEditor(false)}
            className="rounded-lg border border-gold/40 bg-forest/40 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-forest/70"
          >
            Exit Preview
          </button>
        </div>
        <EditorDashboard firstName={editorFirstName} content={content} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setPreviewEditor(true)}
          className="rounded-lg border border-sage-dark/40 bg-forest-soft/70 px-4 py-2 text-sm text-sage-light transition hover:border-gold hover:text-gold"
        >
          👁️ Preview Editor View
        </button>
      </div>
      <DeveloperDashboard
        health={health}
        activity={activity}
        externalLinks={externalLinks}
      />
    </div>
  );
}
