import { PracticeEditor } from "@/components/admin/PracticeEditor";

export default function AdminPracticePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Practice Details
        </h1>
        <p className="mt-2 text-sage-light">
          Edit expertise, insurance, payment methods, therapy modalities, and
          onboarding steps.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <PracticeEditor />
      </div>
    </div>
  );
}
