import { SpecialtiesEditor } from "@/components/admin/SpecialtiesEditor";

export default function AdminSpecialtiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">Specialties</h1>
        <p className="mt-2 text-sage-light">
          Manage focus tags and specialty cards shown on the public site.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <SpecialtiesEditor />
      </div>
    </div>
  );
}
