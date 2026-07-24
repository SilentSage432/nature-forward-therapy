"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

export function AuthLoadingScreen({
  label = "Restoring your session…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-forest px-6">
      <Image
        src="/images/fof-logo.png"
        alt="Flock of Fox, LLC"
        width={56}
        height={56}
        className="h-14 w-14 rounded-full border border-gold/35 object-cover"
        priority
      />
      <div className="flex items-center gap-2 text-sm text-amber-200/80">
        <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}
